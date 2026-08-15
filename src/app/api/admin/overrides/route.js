import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin, assertStationAccess, AuthError } from '../../../../lib/requireAdmin';

// Sets a per-station availability override for a global menu item.
export async function POST(request) {
  try {
    const session = requireAdmin(request);
    const { item_id, station_code, available } = await request.json();
    if (!item_id || !station_code) {
      return NextResponse.json({ error: 'item_id and station_code are required' }, { status: 400 });
    }
    const code = String(station_code).toUpperCase();
    assertStationAccess(session, code);

    const itemStr = String(item_id);
    const { data: existingRows } = await supabaseAdmin
      .from('global_item_overrides').select('id').eq('item_id', itemStr).eq('station_code', code);

    if (existingRows && existingRows.length > 0) {
      const { error } = await supabaseAdmin.from('global_item_overrides').update({ available }).eq('item_id', itemStr).eq('station_code', code);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabaseAdmin.from('global_item_overrides').insert([{ item_id: itemStr, station_code: code, available }]);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('POST overrides error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
