import { NextResponse } from 'next/server';
import crypto from 'crypto';

const getRailKitHeaders = (method, path, apiKey) => {
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(32).toString('hex');
  const payloadHash = crypto.createHash('sha256').update('').digest('hex');
  const signatureString = `${method.toUpperCase()}\n${path}\n${timestamp}\n${nonce}\n${payloadHash}\n${apiKey}`;
  const signingSecret = '97c56e08b27b161124f88acd4f24d1bd50f48075f11dc23b9ea6c0bc9b2f8794';
  const signature = crypto.createHmac('sha256', signingSecret).update(signatureString).digest('hex');

  return {
    "x-api-key": apiKey,
    "x-irctc-sdk-ts": timestamp,
    "x-irctc-sdk-nonce": nonce,
    "x-irctc-sdk-payload-sha256": payloadHash,
    "x-irctc-sdk-signature": signature,
    "x-irctc-sdk-version": "1",
    "accept": "application/json"
  };
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pnr = searchParams.get('pnr');
  if (!pnr) {
    return NextResponse.json({ error: 'PNR parameter is required' }, { status: 400 });
  }

  try {
    const RAILKIT_API_KEY = process.env.RAILKIT_API_KEY;
    const path = `/api/checkPNRStatus/${pnr}`;
    const headers = getRailKitHeaders("GET", path, RAILKIT_API_KEY);
    const res = await fetch(`https://railkit-api.rajivdubey.dev${path}`, {
      method: "GET",
      headers
    });

    if (!res.ok) {
      return NextResponse.json({ error: `RailKit returned status: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("PNR proxy route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
