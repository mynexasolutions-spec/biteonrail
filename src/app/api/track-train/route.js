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
  const trainNo = searchParams.get('trainNo');
  let date = searchParams.get('date') || 'today';
  if (!trainNo) {
    return NextResponse.json({ error: 'trainNo parameter is required' }, { status: 400 });
  }

  // Normalize YYYY-MM-DD to DD-MM-YYYY if matched
  if (date && date !== 'today') {
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = date.split('-');
      date = `${d}-${m}-${y}`;
    }
  }

  try {
    const RAILKIT_API_KEY = process.env.RAILKIT_API_KEY;
    if (!RAILKIT_API_KEY) {
      return NextResponse.json({ error: 'RAILKIT_API_KEY env key is not configured' }, { status: 500 });
    }
    const path = `/api/trackTrain/${trainNo}/${date}`;
    const headers = getRailKitHeaders("GET", path, RAILKIT_API_KEY);
    const res = await fetch(`https://railkit-api.rajivdubey.dev${path}`, {
      method: "GET",
      headers
    });
    if (!res.ok) {
      try {
        const errJson = await res.json();
        return NextResponse.json(errJson, { status: 200 });
      } catch (e) {
        return NextResponse.json({ success: false, error: `RailKit track train returned status: ${res.status}` }, { status: 200 });
      }
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Track train proxy error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
