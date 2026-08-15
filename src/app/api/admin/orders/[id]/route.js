import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { requireAdmin, assertStationAccess, AuthError } from '../../../../../lib/requireAdmin';

const ALLOWED_FIELDS = ['status', 'rider_name', 'onDemandRequests'];

export async function PATCH(request, { params }) {
  try {
    const session = requireAdmin(request);
    const { id } = params;
    const body = await request.json();

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('orders').select('stationCode').eq('id', id).single();
    if (fetchErr || !existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    assertStationAccess(session, existing.stationCode);

    const update = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field];
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('orders').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('PATCH order error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
