import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { requireAdmin, AuthError } from '../../../../../lib/requireAdmin';

// Body: { menuItems: [...] } — the full desired menu item list (as seen by the caller).
// Global-admin: full diff against all rows.
// Station-admin: only rows belonging to their own station are considered — everything
// else (global items, other stations' items) is left untouched no matter what's in the
// payload, so a station session can never delete/alter data outside its own station.
export async function POST(request) {
  try {
    const session = requireAdmin(request);
    const { menuItems: newItems } = await request.json();
    if (!Array.isArray(newItems)) {
      return NextResponse.json({ error: 'menuItems must be an array' }, { status: 400 });
    }

    const isGlobal = session.type === 'global';
    const myCode = String(session.station_code || '').toUpperCase();
    const inScope = (item) => isGlobal || String(item.station_code || '').toUpperCase() === myCode;

    const { data: current, error: fetchErr } = await supabaseAdmin.from('menu_items').select('id, station_code');
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    const currentScoped = current.filter(inScope);
    const newScoped = newItems.filter(inScope);

    const newIds = newScoped.map(i => String(i.id));
    const deletedIds = currentScoped.filter(i => !newIds.includes(String(i.id))).map(i => i.id);

    if (deletedIds.length > 0) {
      const { error } = await supabaseAdmin.from('menu_items').delete().in('id', deletedIds);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (newScoped.length > 0) {
      const cleanItems = newScoped.map(({ created_at, image_url, ...rest }) => ({
        ...rest,
        image: rest.image !== undefined ? rest.image : image_url
      }));
      const { error } = await supabaseAdmin.from('menu_items').upsert(cleanItems);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('Menu items sync error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
