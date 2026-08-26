// One-off import: adds the "Let's Shawarma" menu (menu.pdf) as GLOBAL items
// (station_code = 'ALL') so every station's head-admin-created catalog picks
// them up. Titles/prices are transcribed as printed on the PDF. Images are
// left blank intentionally — to be added later from the admin panel.
//
// Safe to re-run: skips categories/items that already exist (by name + station).
//
// Usage: node scripts/import-lets-shawarma-menu.mjs

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

// { name, price?, variants?: [{name, price}], food_type: 'veg'|'non-veg'|'' }
const CATEGORIES = [
  {
    name: 'Shawarma',
    items: [
      ['Classic Shawarma', [['Paneer', 99], ['Chicken', 99]]],
      ['Schezwan Shawarma', [['Paneer', 109], ['Chicken', 109]]],
      ['Fiery Shawarma', [['Paneer', 109], ['Chicken', 109]]],
      ['Cheese Shawarma', [['Paneer', 139], ['Chicken', 149]]],
      ['BBQ Shawarma', [['Paneer', 139], ['Chicken', 149]]],
      ['Tandoori Shawarma', [['Paneer', 149], ['Chicken', 149]]],
      ['Peri Peri Shawarma', [['Paneer', 149], ['Chicken', 159]]],
      ['Frenzy Shawarma', [['Paneer', 149], ['Chicken', 179]]],
      ['Open Shawarma', [['Paneer', 179], ['Chicken', 179]]],
    ],
  },
  {
    name: 'Fusion Shawarmas',
    items: [
      ['BBQ + Tandoori', [['Paneer', 169], ['Chicken', 169]]],
      ['BBQ + Peri Peri', [['Paneer', 169], ['Chicken', 169]]],
      ['Fiery + BBQ', [['Paneer', 179], ['Chicken', 179]]],
      ['Frenzy + Peri Peri', [['Paneer', 179], ['Chicken', 179]]],
    ],
  },
  {
    name: 'Subs',
    items: [
      ['Schezwan Sub', [['Paneer', 159], ['Chicken', 169]]],
      ['Fiery Sub', [['Paneer', 159], ['Chicken', 169]]],
      ['Cheese Sub', [['Paneer', 169], ['Chicken', 189]]],
      ['BBQ Sub', [['Paneer', 169], ['Chicken', 189]]],
      ['Tandoori Sub', [['Paneer', 169], ['Chicken', 189]]],
      ['Peri Peri Sub', [['Paneer', 169], ['Chicken', 189]]],
      ['Mexican Sub', [['Paneer', 169], ['Chicken', 189]]],
      ['Frenzy Sub', [['Paneer', 179], ['Chicken', 199]]],
    ],
  },
  {
    name: 'Fries',
    items: [
      ['Plain Fries', 89],
      ['Cheesy Fries', 129],
      ['Peri Peri Fries', 179],
      ['Loaded Paneer Fries Bowl', 179],
      ['Loaded Chicken Fries Bowl', 179],
      ['Crispy Chicken Fries Bowl', 199],
    ],
  },
  {
    name: 'Salads',
    items: [
      ['Classic Salad', [['Paneer', 149], ['Chicken', 149]]],
      ['Fiery Salad', [['Paneer', 149], ['Chicken', 149]]],
      ['Cheese Salad', [['Paneer', 169], ['Chicken', 189]]],
      ['BBQ Salad', [['Paneer', 159], ['Chicken', 189]]],
      ['Tandoori Salad', [['Paneer', 169], ['Chicken', 189]]],
      ['Peri Peri Salad', [['Paneer', 169], ['Chicken', 189]]],
      ['Frenzy Salad', [['Paneer', 169], ['Chicken', 169]]],
    ],
  },
  {
    name: 'Burrito Bowl',
    items: [
      ['Hariyali Bowl', [['Paneer', 159], ['Chicken', 179]]],
      ['Spicy Bowl', [['Paneer', 169], ['Chicken', 189]]],
      ['Mexican Bowl', [['Paneer', 179], ['Chicken', 199]]],
    ],
  },
  {
    name: "Let's Platters",
    items: [
      ['Middle East Magic', 239],
      ['Paneer-E-Magic', 259],
      ['Power Eggs', 279],
      ['Royal Chicken Feast', 299],
    ],
  },
  {
    name: 'Sides & Dips',
    items: [
      ['Chicken Popcorn', [['Half', 99], ['Full', 129]]],
      ['Chicken Nuggets', [['Half', 99], ['Full', 129]]],
      ['Chicken Wings', [['Half', 109], ['Full', 149]]],
      ['Cheesy Dip', 50],
      ['Garlic Mayonnaise', 50],
      ['Tandoori Mayonnaise', 50],
      ['Mint Hummus', 50],
      ['Extra Paneer', 40],
      ['Extra Chicken', 30],
      ['Extra Cheese', 25],
    ],
  },
  {
    name: 'Mojito & Beverages',
    items: [
      ['Refreshing Mint Mojito', 99],
      ['Blue Lagoon Mojito', 99],
      ['Classic Lemon Mojito', 99],
      ['Cold Coffee', 99],
      ['Oreo Shake', 109],
      ['Tender Coconut', 220],
    ],
  },
  {
    name: 'Non-Veg Specials',
    foodType: 'non-veg',
    items: [
      ['Non Veg Special Thali (2 Pcs Chicken Kari, 2 Chapati, Dal Tadka Jeera Rice, Sweet Salad Achar)', 160],
      ['Non Veg Maharaja (2 Pcs Chicken Kari, 3 Pcs Chapati, Dal Tadka Jeera Rice, Mix Veg, Papad, Sweet Salad Achaar)', 190],
      ['Chicken Fried Rice', 150],
      ['Chicken Fried Rice Combo (4 Pcs Chicken Manchurian)', 190],
      ['Chicken 65 (14 Pcs Chicken)', 150],
      ['Chicken Masala (3 Pcs Chicken Masala)', 130],
      ['Egg Thali (2 Pcs Egg Kari, Dal Tadka, Jeera Rice, 2 Chapati, Sweet Salad Achaar)', 150],
      ['Egg Masala (3 Pcs Egg Masala)', 130],
      ['Egg Fried Rice', 120],
      ['Chicken Dum Biryani (Raiyata With Gravy)', 160],
      ['Chicken Manchurian (12 Pcs Manchurian)', 160],
      ['Chicken Chilli (12 Pcs Chicken Chilli)', 170],
      ['4 Peas Combo (8 Pcs Chicken Kari, 12 Chapati, 2 Dal Tadka, 2 Jeera Rice, 2 Egg Curry, 4 Pcs Sweet Salad Achaar)', 480],
      ['Chicken Malvani (6 Pcs)', 480],
      ['Chicken Tikka (6 Pcs)', 200],
      ['Only Chapati (Per Pcs)', 200],
      ['Chicken Roti Combo (3 Pcs Chapati, 2 Pcs Chicken Girvi, Salad, Achar)', 15],
      ['Chicken Rice Combo', 160],
      ['Chicken Triple Rice (Sheswan Chatani, Kobi, Sos)', 170],
      ['Chicken Triple Noodle (Sheswan Chatani, Kobi, Sos)', 200],
      ['Non Veg Chainise Noodle Thali (Sheswan Chatani, Kobi, Sos)', 200],
      ['Non Veg Chainise Rice Thali (Sheswan Chatani, Kobi, Sos)', 170],
      ['Egg Pafe (1 Pc)', 170],
      ['Egg Burji', 70],
    ],
  },
  {
    name: 'Veg Specials',
    foodType: 'veg',
    items: [
      ['Veg Special Thali (Mix Veg, Dal Tadka, Jeera Rice, 3 Chapati, Sweet Salad Achar)', 160],
      ['Veg Maharaja Thali (Mix Veg, Dal Tadka, Jeera Rice, 3 Chapati, Sweet Salad, Papad, Paneer Masala)', 180],
      ['Veg Fried Rice', 130],
      ['Veg Manchurian Rice', 150],
      ['Jeera Rice (Basmati)', 90],
      ['Dal Tadaka', 100],
      ['Paneer Masala', 130],
      ['Veg Fried Rice Combo (4 Pcs Manchurian)', 160],
      ['Veg Dum Biryani (Raiyata)', 140],
      ['4 Person Combo (11 Chapati, 2 Dal Tadka, 2 Basmati Jeera Rice, 1 Mix Veg, 1 Paneer Masala, 4 Pcs Sweet Salad Achaar)', 440],
      ['Veg Manchurian (14 Manchurian Pcs)', 160],
      ['Paneer Chilli (14 Paneer Chilli Pcs)', 200],
      ['Mix Veg', 100],
      ['Dal Rice Combo (Salad & Achaar)', 140],
      ['Kaju Curry', 150],
      ['Veg Pizza', 160],
      ['Veg Cheese Pizza', 200],
      ['Paneer Cheese Pizza', 230],
      ['Veg Burger', 100],
      ['Veg Cheese Burger', 120],
      ['Only Chapati (Per Pcs)', 15],
      ['Samosa Aalu (2 Pcs)', 50],
      ['Pav Bhaji', 90],
      ['Veg Paneer Rice Combo', 150],
      ['Veg Mix Veg Roti Combo', 130],
      ['Veg Rice Noodles Combination', 160],
      ['Veg Singapuri Rice', 160],
      ['Paneer Burji', 110],
    ],
  },
  {
    name: 'Chinese Starters',
    items: [
      ['Veg Manchuria', [['Mini', 60], ['Half', 140], ['Full', 200]]],
      ['Paneer 65', [['Mini', 70], ['Half', 150], ['Full', 210]]],
      ['Paneer Manchuria', [['Mini', 70], ['Half', 150], ['Full', 210]]],
      ['Chilli Paneer', [['Mini', 70], ['Half', 150], ['Full', 210]]],
      ['Chicken 65', [['Mini', 80], ['Half', 150], ['Full', 210]]],
      ['Chilli Chicken', [['Mini', 80], ['Half', 150], ['Full', 210]]],
      ['Chicken Manchuria', [['Mini', 80], ['Half', 150], ['Full', 210]]],
      ['Chicken Wings (Chinese)', [['Half', 160], ['Full', 220]]],
    ],
  },
  {
    name: 'Chinese Noodles',
    items: [
      ['Veg Soft Noodles', [['Mini', 70], ['Half', 110], ['Full', 160]]],
      ['Hakka Veg Noodles', [['Mini', 80], ['Half', 140], ['Full', 190]]],
      ['Chicken Soft Noodles', [['Mini', 90], ['Half', 130], ['Full', 180]]],
      ['Hakka Chicken Noodles', [['Mini', 100], ['Half', 160], ['Full', 210]]],
    ],
  },
  {
    name: 'Chinese Fried Rice',
    items: [
      ['Veg Fried Rice (Chinese)', [['Mini', 70], ['Half', 110], ['Full', 160]]],
      ['Hakka Veg Fried Rice', [['Mini', 80], ['Half', 140], ['Full', 190]]],
      ['Chicken Fried Rice (Chinese)', [['Mini', 90], ['Half', 130], ['Full', 180]]],
      ['Hakka Chicken Fried Rice', [['Mini', 100], ['Half', 160], ['Full', 210]]],
    ],
  },
  {
    name: 'Rice Specials',
    items: [
      ['Sambar Rice', 120],
      ['Curd Rice', 130],
    ],
  },
  {
    name: 'Biryani',
    items: [
      ['Chicken Biryani', [['Half', 140], ['Full', 220]]],
      ['Mutton Biryani', [['Half', 200], ['Full', 320]]],
    ],
  },
  {
    name: 'Bakery & Quick Bites',
    items: [
      ['Veg Puff', 25, 'veg'],
      ['Egg Puff', 35, 'non-veg'],
      ['Chicken Puff', 40, 'non-veg'],
      ['Samosa', 25, 'veg'],
      ['Bread Omelette', 60, 'non-veg'],
      ['Burger', 100, ''],
      ['Chicken Roll', 100, 'non-veg'],
      ['Pastry', 45, 'veg'],
      ['Plum Cake', 60, 'veg'],
      ['Dilpasand', 25, 'veg'],
      ['Dilkush', 25, 'veg'],
    ],
  },
  {
    name: 'Juices & Shakes',
    foodType: 'veg',
    items: [
      ['Mosambi Juice', 60],
      ['Orange Juice', 60],
      ['Watermelon Juice', 50],
      ['Pineapple Juice', 60],
      ['Mango Juice', 70],
      ['Mix Fruit Juice', 70],
      ['Pomegranate Juice', 90],
      ['Banana Milkshake', 90],
      ['Oreo Milkshake', 110],
      ['Chocolate Milkshake', 120],
      ['Strawberry Milkshake', 120],
      ['KitKat Milkshake', 130],
      ['Oreo Thick Shake', 150],
      ['KitKat Thick Shake', 150],
      ['Chocolate Thick Shake', 150],
      ['Carrot Juice', 60],
      ['Beetroot Juice', 60],
      ['ABC Juice', 80],
    ],
  },
];

async function ensureCategory(name) {
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('name', name)
    .eq('station_code', STATION_CODE);
  if (existing && existing.length > 0) return;
  const { error } = await supabase
    .from('categories')
    .insert([{ name, station_code: STATION_CODE, image: '' }]);
  if (error) throw new Error(`insert category "${name}": ${error.message}`);
  console.log(`Created global category: ${name}`);
}

let nextId = Date.now();
function newItemId() {
  nextId += 1;
  return nextId;
}

function normalizeItem(entry, defaultFoodType) {
  const [name, priceOrVariants, foodTypeOverride] = entry;
  if (Array.isArray(priceOrVariants)) {
    const variants = priceOrVariants.map(([vName, vPrice]) => ({ name: vName, price: vPrice }));
    const basePrice = Math.min(...variants.map((v) => v.price));
    return { name, price: basePrice, variants, food_type: foodTypeOverride ?? defaultFoodType ?? '' };
  }
  return { name, price: priceOrVariants, variants: [], food_type: foodTypeOverride ?? defaultFoodType ?? '' };
}

async function main() {
  let inserted = 0;
  let skipped = 0;

  for (const cat of CATEGORIES) {
    console.log(`\n=== ${cat.name} ===`);
    await ensureCategory(cat.name);

    for (const rawItem of cat.items) {
      const item = normalizeItem(rawItem, cat.foodType);

      const { data: exists } = await supabase
        .from('menu_items')
        .select('id')
        .eq('name', item.name)
        .eq('category', cat.name)
        .eq('station_code', STATION_CODE);
      if (exists && exists.length > 0) {
        console.log(`  skip (exists): ${item.name}`);
        skipped += 1;
        continue;
      }

      const { error } = await supabase.from('menu_items').insert([
        {
          id: newItemId(),
          name: item.name,
          price: item.price,
          mrp: item.price,
          category: cat.name,
          available: true,
          description: '',
          image: '',
          station_code: STATION_CODE,
          variants: item.variants,
          food_type: item.food_type,
        },
      ]);
      if (error) {
        console.error(`  FAILED: ${item.name}: ${error.message}`);
      } else {
        console.log(`  added: ${item.name}`);
        inserted += 1;
      }
    }
  }

  console.log(`\nDone. Inserted ${inserted} items, skipped ${skipped} already-existing items.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
