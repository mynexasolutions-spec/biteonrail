// Seeds `categories` + `menu_items` with ~100 packaged/packet items pulled
// category-wise from Open Food Facts (open data + openly-licensed images).
// Images are re-uploaded to Cloudinary; rows are inserted via the Supabase
// service-role client. Safe to re-run — skips items/categories already in DB.
//
// Usage: node scripts/seed-menu-from-off.mjs

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Minimal .env loader (no dotenv dependency in this project)
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
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

for (const [name, val] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_SUPABASE_SECRET_KEY: serviceRoleKey,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: cloudName,
  CLOUDINARY_API_KEY: apiKey,
  CLOUDINARY_API_SECRET: apiSecret,
})) {
  if (!val) {
    console.error(`Missing env var ${name}`);
    process.exit(1);
  }
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const STATION_CODE = 'ALL';
const ITEMS_PER_CATEGORY = 10;

// Category name -> Open Food Facts category tag
const CATEGORIES = [
  { name: 'Chips & Namkeen', tag: 'en:crisps' },
  { name: 'Biscuits & Cookies', tag: 'en:biscuits' },
  { name: 'Chocolates', tag: 'en:chocolates' },
  { name: 'Candies & Sweets', tag: 'en:candies' },
  { name: 'Instant Noodles', tag: 'en:instant-noodles' },
  { name: 'Beverages', tag: 'en:beverages' },
  { name: 'Wafers', tag: 'en:wafers' },
  { name: 'Dry Fruits & Nuts', tag: 'en:nuts' },
  { name: 'Breakfast Cereals', tag: 'en:breakfast-cereals' },
  { name: 'Packaged Snacks', tag: 'en:snacks' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchProducts(tag, count) {
  const url = `https://world.openfoodfacts.org/api/v2/search?categories_tags_en=${encodeURIComponent(
    tag
  )}&countries_tags_en=india&page_size=${count * 3}&fields=code,product_name,image_front_url,image_url,brands,quantity`;

  let res;
  for (let attempt = 1; attempt <= 4; attempt++) {
    res = await fetch(url, { headers: { 'User-Agent': 'biteonrail-seed-script/1.0' } });
    if (res.ok) break;
    if (attempt < 4) await sleep(1500 * attempt);
  }
  if (!res.ok) throw new Error(`OFF search failed for ${tag}: ${res.status}`);
  const json = await res.json();
  const seen = new Set();
  const products = [];
  for (const p of json.products || []) {
    const name = (p.product_name || '').trim();
    const image = p.image_front_url || p.image_url;
    if (!name || !image) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    products.push({
      name: p.brands ? `${name}${p.quantity ? ` (${p.quantity})` : ''}` : name,
      image,
      code: p.code,
    });
    if (products.length >= count) break;
  }
  return products;
}

async function uploadToCloudinary(imageUrl, publicIdHint) {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`image fetch failed: ${imgRes.status}`);
  const buffer = Buffer.from(await imgRes.arrayBuffer());

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'menu-seed';
  const publicId = publicIdHint.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  const form = new FormData();
  form.append('file', new Blob([buffer]), `${publicId}.jpg`);
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp.toString());
  form.append('folder', folder);
  form.append('public_id', publicId);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const result = await res.json();
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${result.error?.message}`);
  return result.secure_url;
}

async function ensureCategory(name) {
  const { data: existing } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('name', name)
    .eq('station_code', STATION_CODE);
  if (existing && existing.length > 0) return;
  const { error } = await supabaseAdmin
    .from('categories')
    .insert([{ name, station_code: STATION_CODE, image: '' }]);
  if (error) throw new Error(`insert category ${name}: ${error.message}`);
}

let nextId = Date.now();
function newItemId() {
  nextId += 1;
  return nextId;
}

async function main() {
  let totalInserted = 0;
  for (const cat of CATEGORIES) {
    console.log(`\n=== ${cat.name} (${cat.tag}) ===`);
    await sleep(1000);
    await ensureCategory(cat.name);

    let products;
    try {
      products = await fetchProducts(cat.tag, ITEMS_PER_CATEGORY);
    } catch (err) {
      console.error(`  fetch failed: ${err.message}`);
      continue;
    }
    console.log(`  found ${products.length} candidate products`);

    for (const p of products) {
      const { data: exists } = await supabaseAdmin
        .from('menu_items')
        .select('id')
        .eq('name', p.name)
        .eq('category', cat.name)
        .eq('station_code', STATION_CODE);
      if (exists && exists.length > 0) {
        console.log(`  skip (exists): ${p.name}`);
        continue;
      }

      let cloudinaryUrl;
      try {
        cloudinaryUrl = await uploadToCloudinary(p.image, `${cat.name}_${p.code || p.name}`);
      } catch (err) {
        console.error(`  image upload failed for ${p.name}: ${err.message}`);
        continue;
      }

      const { error } = await supabaseAdmin.from('menu_items').insert([
        {
          id: newItemId(),
          name: p.name,
          price: 0,
          mrp: 0,
          category: cat.name,
          available: true,
          description: '',
          image: cloudinaryUrl,
          station_code: STATION_CODE,
          variants: [],
          food_type: 'veg',
        },
      ]);
      if (error) {
        console.error(`  insert failed for ${p.name}: ${error.message}`);
        continue;
      }
      totalInserted += 1;
      console.log(`  added: ${p.name}`);
    }
  }
  console.log(`\nDone. Inserted ${totalInserted} menu items across ${CATEGORIES.length} categories.`);
  console.log('NOTE: price/mrp were seeded as 0 — set real prices from the admin panel before going live.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
