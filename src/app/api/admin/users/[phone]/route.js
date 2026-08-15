import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { requireGlobalAdmin, AuthError } from '../../../../../lib/requireAdmin';

export async function DELETE(request, { params }) {
  try {
    requireGlobalAdmin(request);
    const { phone } = params;
    const { error } = await supabaseAdmin.from('users').delete().eq('phone', phone);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('DELETE admin user error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
