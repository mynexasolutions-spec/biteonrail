import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin, AuthError } from '../../../../lib/requireAdmin';

// Returns orders scoped to the caller: all orders for a global admin, or only
// their own station's orders for a station admin. Optional ?limit=&offset=
// for future incremental loading; defaults to returning everything in scope
// so existing client-side search/filter/sort/analytics keep working.
export async function GET(request) {
  try {
    const session = requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 2000;
    const offset = Number(searchParams.get('offset')) || 0;

    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (session.type === 'station') {
      query = query.eq('stationCode', session.station_code);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ orders: data });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('GET admin orders error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
