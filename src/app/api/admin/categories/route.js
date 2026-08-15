import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin, assertStationAccess, AuthError } from '../../../../lib/requireAdmin';

export async function POST(request) {
  try {
    const session = requireAdmin(request);
    const { name, station_code, image } = await request.json();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const code = (station_code || 'ALL').toUpperCase();
    assertStationAccess(session, code === 'ALL' ? null : code);

    const { data: existing } = await supabaseAdmin
      .from('categories').select('id').eq('name', name).eq('station_code', code);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Category already exists for this station' }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from('categories').insert([{ name, station_code: code, image: image || '' }]).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ category: data[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('POST categories error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = requireAdmin(request);
    const { oldName, newName, station_code, image } = await request.json();
    if (!newName) return NextResponse.json({ error: 'newName is required' }, { status: 400 });
    const code = (station_code || 'ALL').toUpperCase();
    assertStationAccess(session, code === 'ALL' ? null : code);

    const updatePayload = { name: newName };
    if (image !== undefined && image !== null) updatePayload.image = image;

    const { error: catErr } = await supabaseAdmin.from('categories').update(updatePayload).eq('name', oldName).eq('station_code', code);
    if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

    const { error: itemErr } = await supabaseAdmin.from('menu_items').update({ category: newName }).eq('category', oldName).eq('station_code', code);
    if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('PUT categories error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const stationCode = (searchParams.get('station_code') || 'ALL').toUpperCase();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    assertStationAccess(session, stationCode === 'ALL' ? null : stationCode);

    const { error: catErr } = await supabaseAdmin.from('categories').delete().eq('name', name).eq('station_code', stationCode);
    if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

    const { error: itemErr } = await supabaseAdmin.from('menu_items').update({ category: 'Uncategorized' }).eq('category', name).eq('station_code', stationCode);
    if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('DELETE categories error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
