import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireGlobalAdmin, AuthError } from '../../../../lib/requireAdmin';

// Generic key/value config setter. Global-admin only.
export async function PUT(request) {
  try {
    requireGlobalAdmin(request);
    const { key, value } = await request.json();
    if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('config').upsert({ key, value: String(value ?? '') }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('PUT config error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
