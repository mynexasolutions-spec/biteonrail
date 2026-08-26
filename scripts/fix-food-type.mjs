// Fixes the `food_type` (veg / non-veg / standard) classification on the
// global "Let's Shawarma" menu items imported earlier. Updates ONLY the
// food_type column, matched by name+category+station_code='ALL' — leaves
// price, variants, image (including manually-added images), and everything
// else untouched.
//
// Usage: node scripts/fix-food-type.mjs

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

// [category, itemName, foodType] — foodType: 'veg' | 'non-veg'
// Items that offer BOTH a Paneer and a Chicken variant in one row are marked
// 'non-veg' (contains a non-veg option) so they never get mislabeled as pure veg.
const FIXES = [
  // Shawarma — Paneer+Chicken variant items
  ['Shawarma', 'Classic Shawarma', 'non-veg'],
  ['Shawarma', 'Schezwan Shawarma', 'non-veg'],
  ['Shawarma', 'Fiery Shawarma', 'non-veg'],
  ['Shawarma', 'Cheese Shawarma', 'non-veg'],
  ['Shawarma', 'BBQ Shawarma', 'non-veg'],
  ['Shawarma', 'Tandoori Shawarma', 'non-veg'],
  ['Shawarma', 'Peri Peri Shawarma', 'non-veg'],
  ['Shawarma', 'Frenzy Shawarma', 'non-veg'],
  ['Shawarma', 'Open Shawarma', 'non-veg'],

  // Fusion Shawarmas — Paneer+Chicken variant items
  ['Fusion Shawarmas', 'BBQ + Tandoori', 'non-veg'],
  ['Fusion Shawarmas', 'BBQ + Peri Peri', 'non-veg'],
  ['Fusion Shawarmas', 'Fiery + BBQ', 'non-veg'],
  ['Fusion Shawarmas', 'Frenzy + Peri Peri', 'non-veg'],

  // Subs — Paneer+Chicken variant items
  ['Subs', 'Schezwan Sub', 'non-veg'],
  ['Subs', 'Fiery Sub', 'non-veg'],
  ['Subs', 'Cheese Sub', 'non-veg'],
  ['Subs', 'BBQ Sub', 'non-veg'],
  ['Subs', 'Tandoori Sub', 'non-veg'],
  ['Subs', 'Peri Peri Sub', 'non-veg'],
  ['Subs', 'Mexican Sub', 'non-veg'],
  ['Subs', 'Frenzy Sub', 'non-veg'],

  // Fries
  ['Fries', 'Plain Fries', 'veg'],
  ['Fries', 'Cheesy Fries', 'veg'],
  ['Fries', 'Peri Peri Fries', 'veg'],
  ['Fries', 'Loaded Paneer Fries Bowl', 'veg'],
  ['Fries', 'Loaded Chicken Fries Bowl', 'non-veg'],
  ['Fries', 'Crispy Chicken Fries Bowl', 'non-veg'],

  // Salads — Paneer+Chicken variant items
  ['Salads', 'Classic Salad', 'non-veg'],
  ['Salads', 'Fiery Salad', 'non-veg'],
  ['Salads', 'Cheese Salad', 'non-veg'],
  ['Salads', 'BBQ Salad', 'non-veg'],
  ['Salads', 'Tandoori Salad', 'non-veg'],
  ['Salads', 'Peri Peri Salad', 'non-veg'],
  ['Salads', 'Frenzy Salad', 'non-veg'],

  // Burrito Bowl — Paneer+Chicken variant items
  ['Burrito Bowl', 'Hariyali Bowl', 'non-veg'],
  ['Burrito Bowl', 'Spicy Bowl', 'non-veg'],
  ['Burrito Bowl', 'Mexican Bowl', 'non-veg'],

  // Let's Platters
  ["Let's Platters", 'Middle East Magic', 'non-veg'],
  ["Let's Platters", 'Paneer-E-Magic', 'veg'],
  ["Let's Platters", 'Power Eggs', 'non-veg'],
  ["Let's Platters", 'Royal Chicken Feast', 'non-veg'],

  // Sides & Dips
  ['Sides & Dips', 'Chicken Popcorn', 'non-veg'],
  ['Sides & Dips', 'Chicken Nuggets', 'non-veg'],
  ['Sides & Dips', 'Chicken Wings', 'non-veg'],
  ['Sides & Dips', 'Cheesy Dip', 'veg'],
  ['Sides & Dips', 'Garlic Mayonnaise', 'veg'],
  ['Sides & Dips', 'Tandoori Mayonnaise', 'veg'],
  ['Sides & Dips', 'Mint Hummus', 'veg'],
  ['Sides & Dips', 'Extra Paneer', 'veg'],
  ['Sides & Dips', 'Extra Chicken', 'non-veg'],
  ['Sides & Dips', 'Extra Cheese', 'veg'],

  // Mojito & Beverages — all veg
  ['Mojito & Beverages', 'Refreshing Mint Mojito', 'veg'],
  ['Mojito & Beverages', 'Blue Lagoon Mojito', 'veg'],
  ['Mojito & Beverages', 'Classic Lemon Mojito', 'veg'],
  ['Mojito & Beverages', 'Cold Coffee', 'veg'],
  ['Mojito & Beverages', 'Oreo Shake', 'veg'],
  ['Mojito & Beverages', 'Tender Coconut', 'veg'],

  // Non-Veg Specials — all non-veg except plain chapati
  ['Non-Veg Specials', 'Only Chapati (Per Pcs)', 'veg'],

  // Chinese Starters
  ['Chinese Starters', 'Veg Manchuria', 'veg'],
  ['Chinese Starters', 'Paneer 65', 'veg'],
  ['Chinese Starters', 'Paneer Manchuria', 'veg'],
  ['Chinese Starters', 'Chilli Paneer', 'veg'],
  ['Chinese Starters', 'Chicken 65', 'non-veg'],
  ['Chinese Starters', 'Chilli Chicken', 'non-veg'],
  ['Chinese Starters', 'Chicken Manchuria', 'non-veg'],
  ['Chinese Starters', 'Chicken Wings (Chinese)', 'non-veg'],

  // Chinese Noodles
  ['Chinese Noodles', 'Veg Soft Noodles', 'veg'],
  ['Chinese Noodles', 'Hakka Veg Noodles', 'veg'],
  ['Chinese Noodles', 'Chicken Soft Noodles', 'non-veg'],
  ['Chinese Noodles', 'Hakka Chicken Noodles', 'non-veg'],

  // Chinese Fried Rice
  ['Chinese Fried Rice', 'Veg Fried Rice (Chinese)', 'veg'],
  ['Chinese Fried Rice', 'Hakka Veg Fried Rice', 'veg'],
  ['Chinese Fried Rice', 'Chicken Fried Rice (Chinese)', 'non-veg'],
  ['Chinese Fried Rice', 'Hakka Chicken Fried Rice', 'non-veg'],

  // Rice Specials
  ['Rice Specials', 'Sambar Rice', 'veg'],
  ['Rice Specials', 'Curd Rice', 'veg'],

  // Biryani
  ['Biryani', 'Chicken Biryani', 'non-veg'],
  ['Biryani', 'Mutton Biryani', 'non-veg'],

  // Bakery & Quick Bites — fix the one ambiguous item
  ['Bakery & Quick Bites', 'Burger', 'non-veg'],
];

// Everything else in "Non-Veg Specials" (except the chapati fixed above) is non-veg.
const NON_VEG_SPECIALS_ITEMS = [
  'Non Veg Special Thali (2 Pcs Chicken Kari, 2 Chapati, Dal Tadka Jeera Rice, Sweet Salad Achar)',
  'Non Veg Maharaja (2 Pcs Chicken Kari, 3 Pcs Chapati, Dal Tadka Jeera Rice, Mix Veg, Papad, Sweet Salad Achaar)',
  'Chicken Fried Rice',
  'Chicken Fried Rice Combo (4 Pcs Chicken Manchurian)',
  'Chicken 65 (14 Pcs Chicken)',
  'Chicken Masala (3 Pcs Chicken Masala)',
  'Egg Thali (2 Pcs Egg Kari, Dal Tadka, Jeera Rice, 2 Chapati, Sweet Salad Achaar)',
  'Egg Masala (3 Pcs Egg Masala)',
  'Egg Fried Rice',
  'Chicken Dum Biryani (Raiyata With Gravy)',
  'Chicken Manchurian (12 Pcs Manchurian)',
  'Chicken Chilli (12 Pcs Chicken Chilli)',
  '4 Peas Combo (8 Pcs Chicken Kari, 12 Chapati, 2 Dal Tadka, 2 Jeera Rice, 2 Egg Curry, 4 Pcs Sweet Salad Achaar)',
  'Chicken Malvani (6 Pcs)',
  'Chicken Tikka (6 Pcs)',
  'Chicken Roti Combo (3 Pcs Chapati, 2 Pcs Chicken Girvi, Salad, Achar)',
  'Chicken Rice Combo',
  'Chicken Triple Rice (Sheswan Chatani, Kobi, Sos)',
  'Chicken Triple Noodle (Sheswan Chatani, Kobi, Sos)',
  'Non Veg Chainise Noodle Thali (Sheswan Chatani, Kobi, Sos)',
  'Non Veg Chainise Rice Thali (Sheswan Chatani, Kobi, Sos)',
  'Egg Pafe (1 Pc)',
  'Egg Burji',
];
for (const name of NON_VEG_SPECIALS_ITEMS) {
  FIXES.push(['Non-Veg Specials', name, 'non-veg']);
}

async function main() {
  let updated = 0;
  let notFound = 0;
  let unchanged = 0;

  for (const [category, name, foodType] of FIXES) {
    const { data: rows, error: fetchErr } = await supabase
      .from('menu_items')
      .select('id, food_type')
      .eq('name', name)
      .eq('category', category)
      .eq('station_code', STATION_CODE);
    if (fetchErr) {
      console.error(`FETCH FAILED: ${category} / ${name}: ${fetchErr.message}`);
      continue;
    }
    if (!rows || rows.length === 0) {
      console.warn(`NOT FOUND: ${category} / ${name}`);
      notFound += 1;
      continue;
    }
    for (const row of rows) {
      if (row.food_type === foodType) {
        unchanged += 1;
        continue;
      }
      const { error: updErr } = await supabase
        .from('menu_items')
        .update({ food_type: foodType })
        .eq('id', row.id);
      if (updErr) {
        console.error(`UPDATE FAILED: ${category} / ${name} (id ${row.id}): ${updErr.message}`);
      } else {
        console.log(`Set "${name}" [${category}] -> ${foodType}`);
        updated += 1;
      }
    }
  }

  console.log(`\nDone. Updated ${updated}, already correct ${unchanged}, not found ${notFound}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
