import { NextResponse } from 'next/server';
import { verifySessionToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
      const trimmed = c.trim();
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const name = trimmed.substring(0, index);
        const value = trimmed.substring(index + 1);
        acc[name] = decodeURIComponent(value);
      }
      return acc;
    }, {});

    const sessionToken = cookies['Admin-Session'];
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const payload = verifySessionToken(sessionToken);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      email: payload.email,
      type: payload.type,
      station_code: payload.station_code
    }, { status: 200 });
  } catch (err) {
    console.error("Session verification route error:", err);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
