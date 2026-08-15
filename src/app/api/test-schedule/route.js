import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const trainNo = "15657";
  const url = `https://www.confirmtkt.com/train-schedule/${trainNo}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed with status: ${res.status}` });
    }

    const htmlText = await res.text();
    const stations = [];
    const ACTIVE_HUBS = ["CSMT", "PUNE", "NGP", "SUR", "KYN", "SBC", "YPR", "UBL", "KLBG", "MYS", "SC", "HYB", "WL", "KZJ"];

    // Regex to match station rows
    const regex = /href="\/station\/([A-Z0-9]+)">([^<]+)<\/a>[\s\S]*?<td>\s*([0-9]{2}:[0-9]{2}|Start)\s*<\/td>[\s\S]*?<td>\s*([0-9]{2}:[0-9]{2}|End)\s*<\/td>/gi;
    let match;
    while ((match = regex.exec(htmlText)) !== null) {
      const code = match[1].toUpperCase();
      const rawName = match[2];
      const arrTime = match[3].trim();
      const depTime = match[4].trim();

      const name = rawName.split(' - ')[0].trim();
      const time = arrTime === 'Start' ? depTime : arrTime;

      stations.push({
        code,
        name,
        time,
        delay: 0,
        isActive: ACTIVE_HUBS.includes(code)
      });
    }

    return NextResponse.json({ status: 'success', count: stations.length, stations: stations.slice(0, 10) });
  } catch (e) {
    return NextResponse.json({ error: e.message });
  }
}
