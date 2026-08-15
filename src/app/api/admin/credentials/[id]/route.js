import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { requireGlobalAdmin, AuthError } from '../../../../../lib/requireAdmin';

export async function PUT(request, { params }) {
  try {
    requireGlobalAdmin(request);
    const { id } = params;
    const { email, password, station_code, manager_name, manager_phone } = await request.json();

    const update = {};
    if (email) update.email = email;
    if (station_code) update.station_code = station_code.toUpperCase();
    if (manager_name !== undefined) update.manager_name = manager_name;
    if (manager_phone !== undefined) update.manager_phone = manager_phone;
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      update.password = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabaseAdmin
      .from('admins')
      .update(update)
      .eq('id', id)
      .eq('type', 'station')
      .select('id, email, type, station_code, manager_name, manager_phone, created_at');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ admin: data[0] });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('PUT credentials error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    requireGlobalAdmin(request);
    const { id } = params;
    const { error } = await supabaseAdmin.from('admins').delete().eq('id', id).eq('type', 'station');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('DELETE credentials error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
