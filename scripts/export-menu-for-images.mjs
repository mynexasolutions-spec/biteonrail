// Exports all GLOBAL (station_code='ALL') menu items to a CSV, grouped by
// category, so images can be sourced/matched offline and then uploaded via
// the admin panel's category/menu item image uploader.
//
// Usage: node scripts/export-menu-for-images.mjs

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const [, key, rawVal] = match;
    const val = rawVal.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv(path.resolve(process.cwd(), '.env.local'));
loadEnv(path.resolve(process.cwd(), '.env'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.NEXT_SUPABASE_SECRET_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_SUPABASE_SECRET_KEY in .env(.local)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function csvEscape(val) {
  const s = String(val ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('id, name, category, price, variants, image, food_type')
    .eq('station_code', 'ALL')
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;

  const rows = [['Category', 'Item Name', 'Price / Variants', 'Food Type', 'Has Image?', 'Item ID']];

  for (const item of items) {
    const priceText = item.variants && item.variants.length > 0
      ? item.variants.map(v => `${v.name}: ₹${v.price}`).join(' | ')
      : `₹${item.price}`;
    rows.push([
      item.category,
      item.name,
      priceText,
      item.food_type || 'standard',
      item.image ? 'Yes' : 'No',
      item.id,
    ]);
  }

  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\r\n');
  const outPath = path.resolve(process.cwd(), 'global-menu-items.csv');
  fs.writeFileSync(outPath, '﻿' + csv, 'utf8');
  console.log(`Wrote ${items.length} rows to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
