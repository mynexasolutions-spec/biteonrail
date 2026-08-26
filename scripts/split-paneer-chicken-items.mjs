// Splits every Shawarma/Fusion Shawarma/Sub/Salad/Burrito Bowl item that
// currently holds BOTH a Paneer and a Chicken price via `variants` into two
// separate, single-price menu items — "<Name> (Paneer)" [veg] and
// "<Name> (Chicken)" [non-veg] — each keeping the same category, image
// (the ones manually uploaded), and station_code='ALL'. The original
// combined row is then deleted. Safe to re-run: skips items that no longer
// have a Paneer+Chicken variants pair (i.e. already split).
//
// Usage: node scripts/split-paneer-chicken-items.mjs

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

const STATION_CODE = 'ALL';
const CATEGORIES = ['Shawarma', 'Fusion Shawarmas', 'Subs', 'Salads', 'Burrito Bowl'];

let nextId = Date.now();
function newItemId() {
  nextId += 1;
  return nextId;
}

async function main() {
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('station_code', STATION_CODE)
    .in('category', CATEGORIES);
  if (error) throw error;

  let split = 0;
  let skipped = 0;

  for (const item of items) {
    const variants = item.variants || [];
    const paneer = variants.find(v => (v.name || '').toLowerCase() === 'paneer');
    const chicken = variants.find(v => (v.name || '').toLowerCase() === 'chicken');

    if (!paneer || !chicken) {
      console.log(`  skip (no Paneer+Chicken pair): ${item.category} / ${item.name}`);
      skipped += 1;
      continue;
    }

    const base = {
      category: item.category,
      station_code: STATION_CODE,
      available: item.available,
      description: item.description || '',
      image: item.image || '',
      variants: [],
    };

    const paneerItem = {
      ...base,
      id: newItemId(),
      name: `${item.name} (Paneer)`,
      price: paneer.price,
      mrp: paneer.price,
      food_type: 'veg',
    };
    const chickenItem = {
      ...base,
      id: newItemId(),
      name: `${item.name} (Chicken)`,
      price: chicken.price,
      mrp: chicken.price,
      food_type: 'non-veg',
    };

    const { error: insErr } = await supabase.from('menu_items').insert([paneerItem, chickenItem]);
    if (insErr) {
      console.error(`  FAILED to insert split for "${item.name}": ${insErr.message}`);
      continue;
    }

    const { error: delErr } = await supabase.from('menu_items').delete().eq('id', item.id);
    if (delErr) {
      console.error(`  inserted split but FAILED to delete original "${item.name}" (id ${item.id}): ${delErr.message}`);
      continue;
    }

    console.log(`Split "${item.name}" -> "${paneerItem.name}" (₹${paneer.price}, veg) + "${chickenItem.name}" (₹${chicken.price}, non-veg)`);
    split += 1;
  }

  console.log(`\nDone. Split ${split} items, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
