import { createClient } from '@supabase/supabase-js';

/**
 * Lightweight Custom Supabase REST Client
 * Eliminates the need for @supabase/supabase-js package installation
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

class SupabaseRESTClient {
  constructor(url, anonKey) {
    this.url = url.replace(/\/$/, ''); // Remove trailing slash
    this.anonKey = anonKey;
  }

  from(table) {
    const defaultHeaders = {
      'apikey': this.anonKey,
      'Authorization': `Bearer ${this.anonKey}`,
      'Content-Type': 'application/json'
    };

    return {
      select: (selectQuery = '*') => {
        let queryParams = `?select=${encodeURIComponent(selectQuery)}`;
        let isSingle = false;
        let orderQuery = '';
        let filters = [];

        const builder = {
          eq: (column, value) => {
            filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
            return builder;
          },
          single: () => {
            isSingle = true;
            return builder;
          },
          order: (column, { ascending = true } = {}) => {
            orderQuery = `&order=${encodeURIComponent(column)}.${ascending ? 'asc' : 'desc'}`;
            return builder;
          },
          then: async (onfulfilled) => {
            try {
              let finalUrl = `${this.url}/rest/v1/${table}${queryParams}`;
              if (filters.length > 0) {
                finalUrl += `&${filters.join('&')}`;
              }
              if (orderQuery) {
                finalUrl += orderQuery;
              }

              const headers = { ...defaultHeaders };
              if (isSingle) {
                headers['Accept'] = 'application/vnd.pgrst.object+json';
              }

              const res = await fetch(finalUrl, { headers });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return onfulfilled({ data: null, error: err });
              }
              const data = await res.json();
              return onfulfilled({ data, error: null });
            } catch (err) {
              return onfulfilled({ data: null, error: err });
            }
          }
        };

        return builder;
      },

      insert: (rows) => {
        return {
          then: async (onfulfilled) => {
            try {
              const res = await fetch(`${this.url}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                  ...defaultHeaders,
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(rows)
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return onfulfilled({ data: null, error: err });
              }
              const data = await res.json();
              return onfulfilled({ data, error: null });
            } catch (err) {
              return onfulfilled({ data: null, error: err });
            }
          }
        };
      },

      upsert: (rows) => {
        return {
          then: async (onfulfilled) => {
            try {
              let conflictCol = 'id';
              if (table === 'config') conflictCol = 'key';
              else if (table === 'users') conflictCol = 'phone';
              else if (table === 'admins') conflictCol = 'email';
              const res = await fetch(`${this.url}/rest/v1/${table}?on_conflict=${conflictCol}`, {
                method: 'POST',
                headers: {
                  ...defaultHeaders,
                  'Prefer': 'resolution=merge-duplicates,return=representation'
                },
                body: JSON.stringify(rows)
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return onfulfilled({ data: null, error: err });
              }
              const data = await res.json().catch(() => null);
              return onfulfilled({ data, error: null });
            } catch (err) {
              return onfulfilled({ data: null, error: err });
            }
          }
        };
      },

      update: (values) => {
        let filters = [];
        const builder = {
          eq: (column, value) => {
            filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
            return builder;
          },
          then: async (onfulfilled) => {
            try {
              let finalUrl = `${this.url}/rest/v1/${table}`;
              if (filters.length > 0) {
                finalUrl += `?${filters.join('&')}`;
              }
              const res = await fetch(finalUrl, {
                method: 'PATCH',
                headers: {
                  ...defaultHeaders,
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(values)
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return onfulfilled({ data: null, error: err });
              }
              const data = await res.json();
              return onfulfilled({ data, error: null });
            } catch (err) {
              return onfulfilled({ data: null, error: err });
            }
          }
        };
        return builder;
      },

      delete: () => {
        let filters = [];
        const builder = {
          eq: (column, value) => {
            filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
            return builder;
          },
          in: (column, values) => {
            const encodedValues = values.map(v => encodeURIComponent(v)).join(',');
            filters.push(`${encodeURIComponent(column)}=in.(${encodedValues})`);
            return builder;
          },
          then: async (onfulfilled) => {
            try {
              let finalUrl = `${this.url}/rest/v1/${table}`;
              if (filters.length > 0) {
                finalUrl += `?${filters.join('&')}`;
              }
              const res = await fetch(finalUrl, {
                method: 'DELETE',
                headers: {
                  ...defaultHeaders,
                  'Prefer': 'return=representation'
                }
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return onfulfilled({ data: null, error: err });
              }
              const data = await res.json().catch(() => null);
              return onfulfilled({ data, error: null });
            } catch (err) {
              return onfulfilled({ data: null, error: err });
            }
          }
        };
        return builder;
      }
    };
  }
}

export const supabase = isConfigured ? new SupabaseRESTClient(supabaseUrl, supabaseAnonKey) : null;
export const officialSupabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
export const isSupabaseConfigured = () => !!supabase;
