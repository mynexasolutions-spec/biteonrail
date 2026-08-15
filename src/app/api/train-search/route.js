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
  const q = searchParams.get('q')?.trim() || '';
  
  if (!q || q.length < 2) {
    return NextResponse.json([], { status: 200 });
  }

  const isNumericTrainNo = /^\d{5}$/.test(q);
  const RAILKIT_API_KEY = process.env.RAILKIT_API_KEY;

  // 1. If it's a 5-digit train number, fetch the info directly from RailKit REST API
  if (isNumericTrainNo) {
    try {
      const path = `/api/getTrainInfo/${q}`;
      const headers = getRailKitHeaders("GET", path, RAILKIT_API_KEY);
      const res = await fetch(`https://railkit-api.rajivdubey.dev${path}`, {
        method: "GET",
        headers
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data && result.data.trainInfo) {
          const trainName = result.data.trainInfo.train_name || "";
          
          let cleanName = trainName
            .replace(/:[\s\S]*$/, '')
            .replace(/running[\s\S]*$/i, '')
            .replace(/timetable[\s\S]*$/i, '')
            .replace(/time\s*table[\s\S]*$/i, '')
            .replace(/route[\s\S]*$/i, '')
            .replace(/^\d+\s*-\s*/, '')
            .trim();

          return NextResponse.json([{
            number: q,
            name: cleanName,
            route: `${result.data.trainInfo.from_stn_code || 'N/A'} - ${result.data.trainInfo.to_stn_code || 'N/A'}`
          }], { status: 200 });
        }
      }
    } catch (err) {
      console.warn("Direct RailKit train info fetch failed:", err);
    }

    return NextResponse.json([], { status: 200 });
  }

  // 2. Otherwise return empty array (only 5-digit train numbers supported via RailKit API)
  return NextResponse.json([], { status: 200 });
}
