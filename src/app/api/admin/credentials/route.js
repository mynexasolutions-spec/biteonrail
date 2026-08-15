import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireGlobalAdmin, AuthError } from '../../../../lib/requireAdmin';

export async function GET(request) {
  try {
    requireGlobalAdmin(request);
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, type, station_code, manager_name, manager_phone, created_at')
      .eq('type', 'station')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ admins: data });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('GET credentials error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    requireGlobalAdmin(request);
    const { email, password, station_code, manager_name, manager_phone } = await request.json();

    if (!email || !password || !station_code) {
      return NextResponse.json({ error: 'Email, password, and station are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', email);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabaseAdmin
      .from('admins')
      .insert([{
        email,
        password: hash,
        type: 'station',
        station_code: station_code.toUpperCase(),
        manager_name: manager_name || '',
        manager_phone: manager_phone || ''
      }])
      .select('id, email, type, station_code, manager_name, manager_phone, created_at');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ admin: data[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('POST credentials error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
