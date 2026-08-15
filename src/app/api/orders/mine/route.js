import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Public, phone-scoped: returns only the orders belonging to the given phone
// number, instead of the old pattern of shipping the entire orders table to
// every visitor and filtering client-side.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const digits = (searchParams.get('phone') || '').replace(/\D/g, '').slice(-10);
    if (!digits) return NextResponse.json({ error: 'phone is required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .like('phone', `%${digits}`)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ orders: data });
  } catch (err) {
    console.error('GET orders/mine error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
