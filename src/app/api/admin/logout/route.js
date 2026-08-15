import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Expire the cookie immediately
  response.headers.set(
    'Set-Cookie',
    'Admin-Session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT;'
  );
  return response;
}
