import { createClient } from '@supabase/supabase-js';

// Server-only client using the service role key — bypasses RLS.
// Never import this file from a "use client" component.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.NEXT_SUPABASE_SECRET_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
