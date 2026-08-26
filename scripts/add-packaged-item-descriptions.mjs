// Adds/refreshes a short one-line `description` for the packaged-goods
// global menu items (Chips & Namkeen, Drinks & Juices, Chocolates, Dairy
// Products, Bakery & Biscuits) — matched by exact name. Updates ONLY the
// description column, everything else (price, image, food_type) untouched.
//
// Usage: node scripts/add-packaged-item-descriptions.mjs

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
const CATEGORIES = ['Chips & Namkeen', 'Drinks & Juices', 'Chocolates', 'Dairy Products', 'Bakery & Biscuits'];

// name (exact, incl. any trailing spaces as stored) -> short description
const DESCRIPTIONS = {
  'Kurkure': 'Crunchy corn-based snack with a masala twist.',
  'Kurkure  - Chilli Chatka': 'Crunchy corn snack with a spicy chilli chatka twist.',
  'Kurkure Green Chutney  ': 'Crunchy corn snack flavoured with tangy green chutney.',
  "Kurkure Sizzlin' Hot": 'Crunchy corn snack with a sizzling hot masala kick.',
  "Lay's Sizzling Hot Potato Chips": 'Crispy potato chips with a fiery hot seasoning.',
  'Lays Classic Salted': 'Crispy potato chips with a classic salted flavour.',
  'Maggi Noodles': 'Popular instant noodles, ready in minutes.',
  'Pudina Treat Potato Chips': 'Crispy potato chips with a refreshing mint pudina flavour.',
  'Takatak Chatpata Masala': 'Crunchy stick crisps with a tangy chatpata masala flavour.',
  'Tedhe Medhe Kurkure': 'Twisted crunchy snack with a masala tadka flavour.',

  'Cadbury Dairy Milk (25 g)': 'Smooth and creamy milk chocolate bar.',
  'Nestle KitKat (38.5 g)': 'Crispy wafer fingers coated in milk chocolate.',

  'Amul Gold Full Cream Milk (1ltr)': 'Rich, full cream milk from Amul.',
  'Amul Masti Cup Curd (200gm)': 'Thick, fresh curd in a convenient cup.',
  'Amul Masti Pouch Curd (380 g)': 'Thick, fresh curd in a pouch pack.',
  'Amul Moti Toned Milk (450ml)': 'Toned milk with a long 90-day shelf life.',
  'Amul Salted Butter (100gm)': 'Creamy, lightly salted table butter.',
  'Amul Taaza Toned Milk (500 ml)': 'Fresh toned milk from Amul.',
  'Mother Dairy Full Cream Milk (500ml)': 'Rich, full cream milk from Mother Dairy.',

  'Britannia Gobbles Fruity Fun Slice Cake (25g)': 'Soft, fruity slice cake, perfect for a quick bite.',
  'Britannia Little Hearts Classic Crunch (79g)': 'Crunchy, heart-shaped classic sweet biscuits.',
  'Britannia Marie Gold Marie Biscuits (208g)': 'Light and crispy tea-time Marie biscuits.',
  'Britannia NutriChoice Digestive (125g)': 'Wholesome, high-fibre digestive biscuits.',
  'Hide & Seek Choco Chip (100gm)': 'Crunchy cookies loaded with choco chips.',
  'Parle Krackjack Crackers Sweet & Salty (176.4 g)': 'Classic sweet and salty cracker biscuits.',
  'Parle-G Glucose Biscuit (250 g)': "India's favourite glucose biscuit.",
  'Sunfeast Dark Fantasy (69 g )': 'Cookies with a rich, gooey choco filling.',

  '7UP Nimbooz (350 ml)': 'Refreshing lemon-flavoured sparkling drink.',
  'Amul Kool Badam Milkshake (200ml)': 'Chilled milkshake with a rich almond flavour.',
  'Amul Masti Spiced Salted Buttermilk (200 ml )': 'Chilled, spiced and lightly salted buttermilk.',
  'Amul Sweet Lassi (200ml)': 'Thick, chilled and sweetened yogurt lassi.',
  'Bisleri Packaged Water (1 ltr)': 'Safe and pure packaged drinking water.',
  'Bisleri Soda Water (750ml)': 'Refreshing carbonated soda water.',
  'Bisleri Vedica Sparkling Water (300 ml)': 'Premium naturally sparkling mineral water.',
  'Coca-Cola': 'Classic Coca-Cola Zero Sugar soft drink.',
  'Coca-Cola ': 'Classic Coca-Cola Zero Sugar soft drink.',
  'Fanta Orange Soft Drink (750ml)': 'Fizzy orange-flavoured soft drink.',
  'Frooti Mango Drink (150ml)': 'Sweet and tangy mango fruit drink.',
  'Frooti Mango Drink(600ml)': 'Sweet and tangy mango fruit drink.',
  'Hell Energy Classic Energy Drink (250 ml)': 'Classic energy drink for an instant boost.',
  "Limca Lemon 750 ml": "Zesty lemon and lime flavoured soft drink.",
  'Maaza Mango Drink 600 ml': 'Rich and thick mango fruit drink.',
  'Monster Energy Drink': 'Bold energy drink for an extra kick.',
  'Monster Energy Drink (350 ml )': 'Bold energy drink for an extra kick.',
  'Mountain Dew (750 ml)': 'Citrus-flavoured soft drink with a sharp fizz.',
  'Pepsi Soft Drink(750ml)': 'Classic cola-flavoured fizzy soft drink.',
  'Predator Energy Drink (300ml)': 'Energy drink for an instant refresh.',
  'Real  Mixed Fruit Juice (1ltr)': 'Blend of real mixed fruit juices.',
  'Red Bull Energy Drink (250 ml)': 'Popular energy drink for an instant boost.',
  'Slice Mango Drink': 'Thick and sweet mango fruit drink.',
  'Sprite Lime (750 ml)': 'Crisp, lemon-lime flavoured soft drink.',
  'Sprite Sprite Lime can': 'Crisp, lemon-lime flavoured soft drink in a can.',
  'Sting Energy Drink (250 ml)': 'Energy drink for a quick refresh.',
  'Thums Up': 'Strong, fizzy cola soft drink.',
  'Thums Up Soft Drink(750ml)': 'Strong, fizzy cola soft drink.',
};

async function main() {
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('id, name, category, description')
    .eq('station_code', STATION_CODE)
    .in('category', CATEGORIES);
  if (error) throw error;

  let updated = 0;
  let unmatched = 0;

  for (const item of items) {
    const desc = DESCRIPTIONS[item.name];
    if (!desc) {
      console.warn(`NO MAPPING: ${item.category} / "${item.name}"`);
      unmatched += 1;
      continue;
    }
    if (item.description === desc) continue;
    const { error: updErr } = await supabase
      .from('menu_items')
      .update({ description: desc })
      .eq('id', item.id);
    if (updErr) {
      console.error(`FAILED: ${item.name}: ${updErr.message}`);
    } else {
      console.log(`Set desc: "${item.name}"`);
      updated += 1;
    }
  }

  console.log(`\nDone. Updated ${updated}, unmatched ${unmatched}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
