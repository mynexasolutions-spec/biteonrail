// One-off migration: makes all existing categories global (station_code = 'ALL').
// Also updates menu_items whose category name collides across stations is NOT touched here —
// only the categories table's station_code is flipped to 'ALL'.
//
// Usage: node scripts/globalize-categories.mjs

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

async function main() {
  const { data: categories, error: fetchErr } = await supabase
    .from('categories')
    .select('id, name, station_code');
  if (fetchErr) throw fetchErr;

  const nonGlobal = (categories || []).filter(
    (c) => (c.station_code || 'ALL').toUpperCase() !== 'ALL'
  );

  console.log(`Found ${categories.length} categories total, ${nonGlobal.length} not global.`);

  if (nonGlobal.length === 0) {
    console.log('Nothing to do — all categories are already global.');
    return;
  }

  // Avoid duplicate name collisions when merging into the global scope.
  const globalNames = new Set(
    (categories || [])
      .filter((c) => (c.station_code || 'ALL').toUpperCase() === 'ALL')
      .map((c) => c.name.toLowerCase())
  );

  for (const cat of nonGlobal) {
    if (globalNames.has(cat.name.toLowerCase())) {
      console.log(`Skipping "${cat.name}" (${cat.station_code}) — a global category with this name already exists. Deleting the duplicate station-local row.`);
      const { error: delErr } = await supabase.from('categories').delete().eq('id', cat.id);
      if (delErr) console.error(`  Failed to delete duplicate "${cat.name}":`, delErr.message);
      continue;
    }
    const { error: updErr } = await supabase
      .from('categories')
      .update({ station_code: 'ALL' })
      .eq('id', cat.id);
    if (updErr) {
      console.error(`Failed to globalize "${cat.name}" (${cat.station_code}):`, updErr.message);
    } else {
      console.log(`Globalized "${cat.name}" (was ${cat.station_code}).`);
      globalNames.add(cat.name.toLowerCase());
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
