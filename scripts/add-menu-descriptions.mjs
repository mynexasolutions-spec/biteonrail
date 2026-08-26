// Adds a short one-line `description` to every global (station_code='ALL')
// "Let's Shawarma" menu item, matched by category+name. Updates ONLY the
// description column — price, variants, image (manually uploaded), and
// food_type are all left untouched.
//
// Usage: node scripts/add-menu-descriptions.mjs

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

// [category, name, description]
const DESCRIPTIONS = [
  // Shawarma
  ['Shawarma', 'Classic Shawarma (Paneer)', 'Soft rolled paneer shawarma with classic house sauces.'],
  ['Shawarma', 'Classic Shawarma (Chicken)', 'Soft rolled chicken shawarma with classic house sauces.'],
  ['Shawarma', 'Schezwan Shawarma (Paneer)', 'Paneer shawarma tossed in spicy Schezwan sauce.'],
  ['Shawarma', 'Schezwan Shawarma (Chicken)', 'Chicken shawarma tossed in spicy Schezwan sauce.'],
  ['Shawarma', 'Fiery Shawarma (Paneer)', 'Paneer shawarma loaded with a fiery hot sauce kick.'],
  ['Shawarma', 'Fiery Shawarma (Chicken)', 'Chicken shawarma loaded with a fiery hot sauce kick.'],
  ['Shawarma', 'Cheese Shawarma (Paneer)', 'Paneer shawarma smothered in melted cheese.'],
  ['Shawarma', 'Cheese Shawarma (Chicken)', 'Chicken shawarma smothered in melted cheese.'],
  ['Shawarma', 'BBQ Shawarma (Paneer)', 'Paneer shawarma glazed in smoky BBQ sauce.'],
  ['Shawarma', 'BBQ Shawarma (Chicken)', 'Chicken shawarma glazed in smoky BBQ sauce.'],
  ['Shawarma', 'Tandoori Shawarma (Paneer)', 'Paneer shawarma with a smoky tandoori twist.'],
  ['Shawarma', 'Tandoori Shawarma (Chicken)', 'Chicken shawarma with a smoky tandoori twist.'],
  ['Shawarma', 'Peri Peri Shawarma (Paneer)', 'Paneer shawarma tossed in tangy peri peri sauce.'],
  ['Shawarma', 'Peri Peri Shawarma (Chicken)', 'Chicken shawarma tossed in tangy peri peri sauce.'],
  ['Shawarma', 'Frenzy Shawarma (Paneer)', 'Paneer shawarma loaded with a mix of signature sauces.'],
  ['Shawarma', 'Frenzy Shawarma (Chicken)', 'Chicken shawarma loaded with a mix of signature sauces.'],
  ['Shawarma', 'Open Shawarma (Paneer)', 'Open-style paneer shawarma bowl with all the fixings.'],
  ['Shawarma', 'Open Shawarma (Chicken)', 'Open-style chicken shawarma bowl with all the fixings.'],

  // Fusion Shawarmas
  ['Fusion Shawarmas', 'BBQ + Tandoori (Paneer)', 'Paneer shawarma fused with smoky BBQ and tandoori flavours.'],
  ['Fusion Shawarmas', 'BBQ + Tandoori (Chicken)', 'Chicken shawarma fused with smoky BBQ and tandoori flavours.'],
  ['Fusion Shawarmas', 'BBQ + Peri Peri (Paneer)', 'Paneer shawarma fused with smoky BBQ and tangy peri peri.'],
  ['Fusion Shawarmas', 'BBQ + Peri Peri (Chicken)', 'Chicken shawarma fused with smoky BBQ and tangy peri peri.'],
  ['Fusion Shawarmas', 'Fiery + BBQ (Paneer)', 'Paneer shawarma fused with fiery heat and smoky BBQ.'],
  ['Fusion Shawarmas', 'Fiery + BBQ (Chicken)', 'Chicken shawarma fused with fiery heat and smoky BBQ.'],
  ['Fusion Shawarmas', 'Frenzy + Peri Peri (Paneer)', 'Paneer shawarma fused with frenzy sauce and peri peri.'],
  ['Fusion Shawarmas', 'Frenzy + Peri Peri (Chicken)', 'Chicken shawarma fused with frenzy sauce and peri peri.'],

  // Subs
  ['Subs', 'Schezwan Sub (Paneer)', 'Paneer sub loaded with spicy Schezwan sauce.'],
  ['Subs', 'Schezwan Sub (Chicken)', 'Chicken sub loaded with spicy Schezwan sauce.'],
  ['Subs', 'Fiery Sub (Paneer)', 'Paneer sub with a fiery hot sauce kick.'],
  ['Subs', 'Fiery Sub (Chicken)', 'Chicken sub with a fiery hot sauce kick.'],
  ['Subs', 'Cheese Sub (Paneer)', 'Paneer sub packed with melted cheese.'],
  ['Subs', 'Cheese Sub (Chicken)', 'Chicken sub packed with melted cheese.'],
  ['Subs', 'BBQ Sub (Paneer)', 'Paneer sub glazed in smoky BBQ sauce.'],
  ['Subs', 'BBQ Sub (Chicken)', 'Chicken sub glazed in smoky BBQ sauce.'],
  ['Subs', 'Tandoori Sub (Paneer)', 'Paneer sub with a smoky tandoori twist.'],
  ['Subs', 'Tandoori Sub (Chicken)', 'Chicken sub with a smoky tandoori twist.'],
  ['Subs', 'Peri Peri Sub (Paneer)', 'Paneer sub tossed in tangy peri peri sauce.'],
  ['Subs', 'Peri Peri Sub (Chicken)', 'Chicken sub tossed in tangy peri peri sauce.'],
  ['Subs', 'Mexican Sub (Paneer)', 'Paneer sub loaded with zesty Mexican-style toppings.'],
  ['Subs', 'Mexican Sub (Chicken)', 'Chicken sub loaded with zesty Mexican-style toppings.'],
  ['Subs', 'Frenzy Sub (Paneer)', 'Paneer sub loaded with a mix of signature sauces.'],
  ['Subs', 'Frenzy Sub (Chicken)', 'Chicken sub loaded with a mix of signature sauces.'],

  // Fries
  ['Fries', 'Plain Fries', 'Crispy golden fries, salted to perfection.'],
  ['Fries', 'Cheesy Fries', 'Crispy fries loaded with melted cheese.'],
  ['Fries', 'Peri Peri Fries', 'Crispy fries tossed in tangy peri peri seasoning.'],
  ['Fries', 'Loaded Paneer Fries Bowl', 'Crispy fries loaded with paneer and house sauces.'],
  ['Fries', 'Loaded Chicken Fries Bowl', 'Crispy fries loaded with chicken and house sauces.'],
  ['Fries', 'Crispy Chicken Fries Bowl', 'Crispy fries topped with crispy fried chicken bites.'],

  // Salads
  ['Salads', 'Classic Salad (Paneer)', 'Fresh paneer salad with a classic house dressing.'],
  ['Salads', 'Classic Salad (Chicken)', 'Fresh chicken salad with a classic house dressing.'],
  ['Salads', 'Fiery Salad (Paneer)', 'Paneer salad tossed in a fiery hot dressing.'],
  ['Salads', 'Fiery Salad (Chicken)', 'Chicken salad tossed in a fiery hot dressing.'],
  ['Salads', 'Cheese Salad (Paneer)', 'Paneer salad topped with melted cheese.'],
  ['Salads', 'Cheese Salad (Chicken)', 'Chicken salad topped with melted cheese.'],
  ['Salads', 'BBQ Salad (Paneer)', 'Paneer salad tossed in smoky BBQ sauce.'],
  ['Salads', 'BBQ Salad (Chicken)', 'Chicken salad tossed in smoky BBQ sauce.'],
  ['Salads', 'Tandoori Salad (Paneer)', 'Paneer salad with a smoky tandoori twist.'],
  ['Salads', 'Tandoori Salad (Chicken)', 'Chicken salad with a smoky tandoori twist.'],
  ['Salads', 'Peri Peri Salad (Paneer)', 'Paneer salad tossed in tangy peri peri sauce.'],
  ['Salads', 'Peri Peri Salad (Chicken)', 'Chicken salad tossed in tangy peri peri sauce.'],
  ['Salads', 'Frenzy Salad (Paneer)', 'Paneer salad loaded with a mix of signature sauces.'],
  ['Salads', 'Frenzy Salad (Chicken)', 'Chicken salad loaded with a mix of signature sauces.'],

  // Burrito Bowl
  ['Burrito Bowl', 'Hariyali Bowl (Paneer)', 'Paneer burrito bowl with fresh green hariyali flavours.'],
  ['Burrito Bowl', 'Hariyali Bowl (Chicken)', 'Chicken burrito bowl with fresh green hariyali flavours.'],
  ['Burrito Bowl', 'Spicy Bowl (Paneer)', 'Paneer burrito bowl packed with a spicy kick.'],
  ['Burrito Bowl', 'Spicy Bowl (Chicken)', 'Chicken burrito bowl packed with a spicy kick.'],
  ['Burrito Bowl', 'Mexican Bowl (Paneer)', 'Paneer burrito bowl with zesty Mexican-style toppings.'],
  ['Burrito Bowl', 'Mexican Bowl (Chicken)', 'Chicken burrito bowl with zesty Mexican-style toppings.'],

  // Let's Platters
  ["Let's Platters", 'Middle East Magic', 'A mixed platter of Middle-Eastern style shawarma bites.'],
  ["Let's Platters", 'Paneer-E-Magic', 'A hearty platter loaded with paneer delicacies.'],
  ["Let's Platters", 'Power Eggs', 'A protein-packed platter loaded with egg preparations.'],
  ["Let's Platters", 'Royal Chicken Feast', 'A generous platter loaded with royal chicken delicacies.'],

  // Sides & Dips
  ['Sides & Dips', 'Chicken Popcorn', 'Bite-sized crispy fried chicken popcorn.'],
  ['Sides & Dips', 'Chicken Nuggets', 'Golden crispy chicken nuggets.'],
  ['Sides & Dips', 'Chicken Wings', 'Crispy fried chicken wings tossed in seasoning.'],
  ['Sides & Dips', 'Cheesy Dip', 'Creamy cheese dip, perfect with fries and sides.'],
  ['Sides & Dips', 'Garlic Mayonnaise', 'Creamy garlic-infused mayonnaise dip.'],
  ['Sides & Dips', 'Tandoori Mayonnaise', 'Smoky tandoori-spiced mayonnaise dip.'],
  ['Sides & Dips', 'Mint Hummus', 'Refreshing mint-flavoured hummus dip.'],
  ['Sides & Dips', 'Extra Paneer', 'Extra portion of soft paneer add-on.'],
  ['Sides & Dips', 'Extra Chicken', 'Extra portion of chicken add-on.'],
  ['Sides & Dips', 'Extra Cheese', 'Extra portion of melted cheese add-on.'],

  // Mojito & Beverages
  ['Mojito & Beverages', 'Refreshing Mint Mojito', 'Chilled minty mojito, refreshingly cool.'],
  ['Mojito & Beverages', 'Blue Lagoon Mojito', 'Vibrant blue-lagoon flavoured mojito.'],
  ['Mojito & Beverages', 'Classic Lemon Mojito', 'Classic zesty lemon mojito.'],
  ['Mojito & Beverages', 'Cold Coffee', 'Chilled and creamy cold coffee.'],
  ['Mojito & Beverages', 'Oreo Shake', 'Thick milkshake blended with Oreo cookies.'],
  ['Mojito & Beverages', 'Tender Coconut', 'Fresh, naturally sweet tender coconut water.'],

  // Non-Veg Specials
  ['Non-Veg Specials', 'Non Veg Special Thali (2 Pcs Chicken Kari, 2 Chapati, Dal Tadka Jeera Rice, Sweet Salad Achar)', 'Hearty non-veg thali with chicken curry, chapati, jeera rice and salad.'],
  ['Non-Veg Specials', 'Non Veg Maharaja (2 Pcs Chicken Kari, 3 Pcs Chapati, Dal Tadka Jeera Rice, Mix Veg, Papad, Sweet Salad Achaar)', 'Elaborate non-veg thali with chicken curry, mix veg, dal and more.'],
  ['Non-Veg Specials', 'Chicken Fried Rice', 'Wok-tossed fried rice cooked with chicken.'],
  ['Non-Veg Specials', 'Chicken Fried Rice Combo (4 Pcs Chicken Manchurian)', 'Chicken fried rice served with chicken Manchurian.'],
  ['Non-Veg Specials', 'Chicken 65 (14 Pcs Chicken)', 'Spicy deep-fried chicken bites, South Indian style.'],
  ['Non-Veg Specials', 'Chicken Masala (3 Pcs Chicken Masala)', 'Chicken cooked in a rich, spiced masala gravy.'],
  ['Non-Veg Specials', 'Egg Thali (2 Pcs Egg Kari, Dal Tadka, Jeera Rice, 2 Chapati, Sweet Salad Achaar)', 'Wholesome egg thali with egg curry, dal, rice and chapati.'],
  ['Non-Veg Specials', 'Egg Masala (3 Pcs Egg Masala)', 'Boiled eggs simmered in a spiced masala gravy.'],
  ['Non-Veg Specials', 'Egg Fried Rice', 'Wok-tossed fried rice cooked with scrambled egg.'],
  ['Non-Veg Specials', 'Chicken Dum Biryani (Raiyata With Gravy)', 'Slow-cooked dum chicken biryani served with raita.'],
  ['Non-Veg Specials', 'Chicken Manchurian (12 Pcs Manchurian)', 'Chicken tossed in tangy Indo-Chinese Manchurian sauce.'],
  ['Non-Veg Specials', 'Chicken Chilli (12 Pcs Chicken Chilli)', 'Chicken tossed in spicy Indo-Chinese chilli sauce.'],
  ['Non-Veg Specials', '4 Peas Combo (8 Pcs Chicken Kari, 12 Chapati, 2 Dal Tadka, 2 Jeera Rice, 2 Egg Curry, 4 Pcs Sweet Salad Achaar)', 'Big non-veg combo meal for four with chicken, egg curry, chapati and rice.'],
  ['Non-Veg Specials', 'Chicken Malvani (6 Pcs)', 'Chicken cooked in a fiery Malvani-style spice blend.'],
  ['Non-Veg Specials', 'Chicken Tikka (6 Pcs)', 'Char-grilled marinated chicken tikka pieces.'],
  ['Non-Veg Specials', 'Only Chapati (Per Pcs)', 'Soft, freshly made chapati.'],
  ['Non-Veg Specials', 'Chicken Roti Combo (3 Pcs Chapati, 2 Pcs Chicken Girvi, Salad, Achar)', 'Chapati served with chicken curry, salad and pickle.'],
  ['Non-Veg Specials', 'Chicken Rice Combo', 'Steamed rice served with chicken curry.'],
  ['Non-Veg Specials', 'Chicken Triple Rice (Sheswan Chatani, Kobi, Sos)', 'Chicken fried rice served with Schezwan chutney and slaw.'],
  ['Non-Veg Specials', 'Chicken Triple Noodle (Sheswan Chatani, Kobi, Sos)', 'Chicken noodles served with Schezwan chutney and slaw.'],
  ['Non-Veg Specials', 'Non Veg Chainise Noodle Thali (Sheswan Chatani, Kobi, Sos)', 'Chinese-style non-veg noodle thali with tasty accompaniments.'],
  ['Non-Veg Specials', 'Non Veg Chainise Rice Thali (Sheswan Chatani, Kobi, Sos)', 'Chinese-style non-veg rice thali with tasty accompaniments.'],
  ['Non-Veg Specials', 'Egg Pafe (1 Pc)', 'Fluffy egg puff pastry.'],
  ['Non-Veg Specials', 'Egg Burji', 'Spiced scrambled egg bhurji.'],

  // Veg Specials
  ['Veg Specials', 'Veg Special Thali (Mix Veg, Dal Tadka, Jeera Rice, 3 Chapati, Sweet Salad Achar)', 'Wholesome veg thali with mix veg, dal, jeera rice and chapati.'],
  ['Veg Specials', 'Veg Maharaja Thali (Mix Veg, Dal Tadka, Jeera Rice, 3 Chapati, Sweet Salad, Papad, Paneer Masala)', 'Elaborate veg thali with paneer masala, mix veg, dal and more.'],
  ['Veg Specials', 'Veg Fried Rice', 'Wok-tossed vegetable fried rice.'],
  ['Veg Specials', 'Veg Manchurian Rice', 'Fried rice topped with veg Manchurian gravy.'],
  ['Veg Specials', 'Jeera Rice (Basmati)', 'Fragrant basmati rice tempered with cumin.'],
  ['Veg Specials', 'Dal Tadaka', 'Yellow lentils tempered with ghee and spices.'],
  ['Veg Specials', 'Paneer Masala', 'Soft paneer cooked in a rich, spiced gravy.'],
  ['Veg Specials', 'Veg Fried Rice Combo (4 Pcs Manchurian)', 'Veg fried rice served with veg Manchurian.'],
  ['Veg Specials', 'Veg Dum Biryani (Raiyata)', 'Slow-cooked veg dum biryani served with raita.'],
  ['Veg Specials', '4 Person Combo (11 Chapati, 2 Dal Tadka, 2 Basmati Jeera Rice, 1 Mix Veg, 1 Paneer Masala, 4 Pcs Sweet Salad Achaar)', 'Big veg combo meal for four with chapati, dal, rice and paneer masala.'],
  ['Veg Specials', 'Veg Manchurian (14 Manchurian Pcs)', 'Crispy veg balls tossed in tangy Manchurian sauce.'],
  ['Veg Specials', 'Paneer Chilli (14 Paneer Chilli Pcs)', 'Paneer tossed in spicy Indo-Chinese chilli sauce.'],
  ['Veg Specials', 'Mix Veg', 'Assorted vegetables cooked in a light spiced gravy.'],
  ['Veg Specials', 'Dal Rice Combo (Salad & Achaar)', 'Dal tadka served with rice, salad and pickle.'],
  ['Veg Specials', 'Kaju Curry', 'Cashew nuts simmered in a rich, creamy curry.'],
  ['Veg Specials', 'Veg Pizza', 'Classic veg pizza topped with fresh vegetables.'],
  ['Veg Specials', 'Veg Cheese Pizza', 'Veg pizza loaded with extra melted cheese.'],
  ['Veg Specials', 'Paneer Cheese Pizza', 'Pizza topped with paneer and melted cheese.'],
  ['Veg Specials', 'Veg Burger', 'Crispy veg patty burger with fresh veggies.'],
  ['Veg Specials', 'Veg Cheese Burger', 'Veg patty burger loaded with melted cheese.'],
  ['Veg Specials', 'Only Chapati (Per Pcs)', 'Soft, freshly made chapati.'],
  ['Veg Specials', 'Samosa Aalu (2 Pcs)', 'Crispy samosas stuffed with spiced potato filling.'],
  ['Veg Specials', 'Pav Bhaji', 'Buttery mashed vegetable bhaji served with pav.'],
  ['Veg Specials', 'Veg Paneer Rice Combo', 'Steamed rice served with paneer masala.'],
  ['Veg Specials', 'Veg Mix Veg Roti Combo', 'Chapati served with mix veg curry.'],
  ['Veg Specials', 'Veg Rice Noodles Combination', 'A combo plate of veg fried rice and noodles.'],
  ['Veg Specials', 'Veg Singapuri Rice', 'Sweet and spicy Singapore-style fried rice.'],
  ['Veg Specials', 'Paneer Burji', 'Spiced crumbled paneer bhurji.'],

  // Chinese Starters
  ['Chinese Starters', 'Veg Manchurian', 'Crispy veg balls tossed in tangy Manchurian sauce.'],
  ['Chinese Starters', 'Paneer 65', 'Spicy deep-fried paneer bites, South Indian style.'],
  ['Chinese Starters', 'Paneer Manchuria', 'Crispy paneer tossed in tangy Manchurian sauce.'],
  ['Chinese Starters', 'Chilli Paneer', 'Paneer tossed in a spicy Indo-Chinese chilli sauce.'],
  ['Chinese Starters', 'Chicken 65', 'Spicy deep-fried chicken bites, South Indian style.'],
  ['Chinese Starters', 'Chilli Chicken', 'Chicken tossed in a spicy Indo-Chinese chilli sauce.'],
  ['Chinese Starters', 'Chicken Manchurian', 'Crispy chicken tossed in tangy Manchurian sauce.'],
  ['Chinese Starters', 'Chicken Wings (Chinese)', 'Chicken wings tossed in Indo-Chinese style sauce.'],

  // Chinese Noodles
  ['Chinese Noodles', 'Veg Soft Noodles', 'Wok-tossed soft noodles with fresh vegetables.'],
  ['Chinese Noodles', 'Hakka Veg Noodles', 'Classic Hakka-style stir-fried vegetable noodles.'],
  ['Chinese Noodles', 'Chicken Soft Noodles', 'Wok-tossed soft noodles with chicken.'],
  ['Chinese Noodles', 'Hakka Chicken Noodles', 'Classic Hakka-style stir-fried chicken noodles.'],

  // Chinese Fried Rice
  ['Chinese Fried Rice', 'Veg Fried Rice (Chinese)', 'Wok-tossed vegetable fried rice.'],
  ['Chinese Fried Rice', 'Hakka Veg Fried Rice', 'Hakka-style stir-fried vegetable rice.'],
  ['Chinese Fried Rice', 'Chicken Fried Rice (Chinese)', 'Wok-tossed fried rice cooked with chicken.'],
  ['Chinese Fried Rice', 'Hakka Chicken Fried Rice', 'Hakka-style stir-fried chicken rice.'],

  // Rice Specials
  ['Rice Specials', 'Sambar Rice', 'Steamed rice mixed with tangy South Indian sambar.'],
  ['Rice Specials', 'Curd Rice', 'Steamed rice mixed with fresh curd, lightly tempered.'],

  // Biryani
  ['Biryani', 'Chicken Biryani', 'Fragrant chicken biryani cooked with aromatic spices.'],
  ['Biryani', 'Mutton Biryani', 'Fragrant mutton biryani cooked with aromatic spices.'],

  // Bakery & Quick Bites
  ['Bakery & Quick Bites', 'Veg Puff', 'Flaky pastry puff stuffed with spiced vegetables.'],
  ['Bakery & Quick Bites', 'Egg Puff', 'Flaky pastry puff stuffed with spiced egg filling.'],
  ['Bakery & Quick Bites', 'Chicken Puff', 'Flaky pastry puff stuffed with spiced chicken filling.'],
  ['Bakery & Quick Bites', 'Samosa', 'Crispy pastry stuffed with spiced potato filling.'],
  ['Bakery & Quick Bites', 'Bread Omelette', 'Fluffy omelette sandwiched between toasted bread.'],
  ['Bakery & Quick Bites', 'Burger', 'Classic burger loaded with a juicy patty.'],
  ['Bakery & Quick Bites', 'Chicken Roll', 'Soft roll stuffed with spiced chicken filling.'],
  ['Bakery & Quick Bites', 'Pastry', 'Freshly baked sweet pastry slice.'],
  ['Bakery & Quick Bites', 'Plum Cake', 'Rich and moist classic plum cake slice.'],
  ['Bakery & Quick Bites', 'Dilpasand', 'Sweet, flaky Dilpasand pastry.'],
  ['Bakery & Quick Bites', 'Dilkush', 'Sweet, coconut-filled Dilkush pastry.'],

  // Juices & Shakes
  ['Juices & Shakes', 'Mosambi Juice', 'Freshly squeezed sweet lime juice.'],
  ['Juices & Shakes', 'Orange Juice', 'Freshly squeezed orange juice.'],
  ['Juices & Shakes', 'Watermelon Juice', 'Refreshing chilled watermelon juice.'],
  ['Juices & Shakes', 'Pineapple Juice', 'Freshly squeezed pineapple juice.'],
  ['Juices & Shakes', 'Mango Juice', 'Sweet and refreshing mango juice.'],
  ['Juices & Shakes', 'Mix Fruit Juice', 'A refreshing blend of mixed fruit juices.'],
  ['Juices & Shakes', 'Pomegranate Juice', 'Freshly squeezed pomegranate juice.'],
  ['Juices & Shakes', 'Banana Milkshake', 'Thick and creamy banana milkshake.'],
  ['Juices & Shakes', 'Oreo Milkshake', 'Thick milkshake blended with Oreo cookies.'],
  ['Juices & Shakes', 'Chocolate Milkshake', 'Rich and creamy chocolate milkshake.'],
  ['Juices & Shakes', 'Strawberry Milkshake', 'Sweet and creamy strawberry milkshake.'],
  ['Juices & Shakes', 'KitKat Milkshake', 'Thick milkshake blended with KitKat chocolate.'],
  ['Juices & Shakes', 'Oreo Thick Shake', 'Extra thick shake blended with Oreo cookies.'],
  ['Juices & Shakes', 'KitKat Thick Shake', 'Extra thick shake blended with KitKat chocolate.'],
  ['Juices & Shakes', 'Chocolate Thick Shake', 'Extra thick, rich chocolate shake.'],
  ['Juices & Shakes', 'Carrot Juice', 'Fresh and healthy carrot juice.'],
  ['Juices & Shakes', 'Beetroot Juice', 'Fresh and healthy beetroot juice.'],
  ['Juices & Shakes', 'ABC Juice', 'Healthy blend of apple, beetroot and carrot juice.'],
];

async function main() {
  let updated = 0;
  let notFound = 0;
  let unchanged = 0;

  for (const [category, name, description] of DESCRIPTIONS) {
    const { data: rows, error: fetchErr } = await supabase
      .from('menu_items')
      .select('id, description')
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
      if (row.description === description) {
        unchanged += 1;
        continue;
      }
      const { error: updErr } = await supabase
        .from('menu_items')
        .update({ description })
        .eq('id', row.id);
      if (updErr) {
        console.error(`UPDATE FAILED: ${category} / ${name} (id ${row.id}): ${updErr.message}`);
      } else {
        console.log(`Set desc: "${name}" [${category}]`);
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
