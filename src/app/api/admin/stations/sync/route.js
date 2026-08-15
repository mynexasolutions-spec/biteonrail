import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { requireGlobalAdmin, AuthError } from '../../../../../lib/requireAdmin';

// Body: { stations: [...] } — the full desired station list.
// Global-admin only. Diffs against current DB rows: deletes ids missing from
// the payload, upserts the rest.
export async function POST(request) {
  try {
    requireGlobalAdmin(request);
    const { stations: newStations } = await request.json();
    if (!Array.isArray(newStations)) {
      return NextResponse.json({ error: 'stations must be an array' }, { status: 400 });
    }

    const { data: current, error: fetchErr } = await supabaseAdmin.from('stations').select('id, code');
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    const newIds = newStations.map(s => String(s.id));
    const deletedIds = current.filter(s => !newIds.includes(String(s.id))).map(s => s.id);

    // Reject duplicate station codes within the submitted payload.
    const codes = newStations.map(s => (s.code || '').toUpperCase());
    if (new Set(codes).size !== codes.length) {
      return NextResponse.json({ error: 'Duplicate station code in payload' }, { status: 409 });
    }
    // Reject a code collision with an existing station that isn't itself being updated.
    for (const s of newStations) {
      const clash = current.find(c => c.code.toUpperCase() === (s.code || '').toUpperCase() && String(c.id) !== String(s.id));
      if (clash) {
        return NextResponse.json({ error: `Station code ${s.code} is already in use` }, { status: 409 });
      }
    }

    if (deletedIds.length > 0) {
      const { error } = await supabaseAdmin.from('stations').delete().in('id', deletedIds);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (newStations.length > 0) {
      const cleanStations = newStations.map(({ created_at, ...rest }) => rest);
      const { error } = await supabaseAdmin.from('stations').upsert(cleanStations);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('Stations sync error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
