import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireGlobalAdmin, AuthError } from '../../../../lib/requireAdmin';

export async function POST(request) {
  try {
    requireGlobalAdmin(request);
    const { name } = await request.json();
    if (!name || !name.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from('states').select('id').eq('name', name.trim());
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'State already exists' }, { status: 409 });
    }

    const { error } = await supabaseAdmin.from('states').insert([{ name: name.trim() }]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('POST states error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    requireGlobalAdmin(request);
    const { oldName, newName } = await request.json();
    if (!newName || !newName.trim()) return NextResponse.json({ error: 'newName is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('states').update({ name: newName.trim() }).eq('name', oldName);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('PUT states error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    requireGlobalAdmin(request);
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('states').delete().eq('name', name);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('DELETE states error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
