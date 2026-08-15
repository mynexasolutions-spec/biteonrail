import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireGlobalAdmin, AuthError } from '../../../../lib/requireAdmin';

export async function GET(request) {
  try {
    requireGlobalAdmin(request);
    const { data, error } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: data });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('GET admin users error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
