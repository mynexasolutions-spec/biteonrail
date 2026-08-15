import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { createSessionToken } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { email, passcode, adminType, selectedStationCode } = await request.json();

    if (!email || !passcode) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const type = adminType === 'global' ? 'global' : 'station';
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('type', type)
      .eq('email', email);

    if (error) {
      console.error('Login DB error:', error);
      return NextResponse.json({ error: 'Server authentication failed' }, { status: 500 });
    }

    const candidate = data && data[0];
    const isHashed = candidate && (candidate.password.startsWith('$2a$') || candidate.password.startsWith('$2b$'));
    const passwordMatches = candidate && (
      isHashed ? bcrypt.compareSync(passcode, candidate.password) : candidate.password === passcode
    );

    if (candidate && passwordMatches) {
      const stationCode = type === 'station' ? (candidate.station_code || selectedStationCode) : '';
      const token = createSessionToken({ email: candidate.email, type, station_code: stationCode });
      const response = NextResponse.json({ success: true, type, station_code: stationCode });
      response.headers.set(
        'Set-Cookie',
        `Admin-Session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800;`
      );
      return response;
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  } catch (err) {
    console.error('Login API Error:', err);
    return NextResponse.json({ error: 'Server authentication failed' }, { status: 500 });
  }
}
