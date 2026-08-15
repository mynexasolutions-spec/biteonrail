import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';
import { createSessionToken } from '../../../../lib/auth';
import crypto from 'crypto';

// Utility to generate SHA-256 hash of password
const sha256 = (string) => {
  return crypto.createHash('sha256').update(string).digest('hex');
};

export async function POST(request) {
  try {
    const { email, passcode, adminType, selectedStationCode } = await request.json();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database service is offline. Contact Administrator.' }, { status: 503 });
    }

    const hashedPasscode = sha256(passcode);

    if (adminType === 'global') {
      // Check head admin in Supabase
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('type', 'global');

      const matchedUser = data?.find(u => u.password === passcode || u.password === hashedPasscode);

      if (matchedUser) {
        const token = createSessionToken({ email: matchedUser.email, type: 'global', station_code: '' });
        const response = NextResponse.json({ success: true, type: 'global' });
        response.headers.set(
          'Set-Cookie',
          `Admin-Session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800;`
        );
        return response;
      }
    } else {
      if (!email) {
        return NextResponse.json({ error: 'Email is required for station manager login' }, { status: 400 });
      }

      // Check station manager by email in Supabase
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('type', 'station')
        .eq('email', email);

      const matchedUser = data?.find(u => u.password === passcode || u.password === hashedPasscode);

      if (matchedUser) {
        const stationCode = matchedUser.station_code || selectedStationCode;
        const token = createSessionToken({ email: matchedUser.email, type: 'station', station_code: stationCode });
        const response = NextResponse.json({ success: true, type: 'station', station_code: stationCode });
        response.headers.set(
          'Set-Cookie',
          `Admin-Session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800;`
        );
        return response;
      }
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  } catch (err) {
    console.error("Login API Error:", err);
    return NextResponse.json({ error: 'Server authentication failed' }, { status: 500 });
  }
}
