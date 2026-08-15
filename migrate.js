const { createClient } = require('@supabase/supabase-js');

// Old Supabase credentials
const OLD_URL = 'https://ojzgubnqxhcvbykemzzw.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qemd1Ym5xeGhjdmJ5a2Vtenp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjg4ODI4NSwiZXhwIjoyMDk4NDY0Mjg1fQ.pMAR9gAGNslK71ApgTV-k2_wbcUwuSBA0JJx8-N53gs';

// New Supabase credentials (provided by you)
const NEW_URL = 'https://yzxbedwhnluajqzqcsmn.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6eGJlZHdobmx1YWpxenFjc21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE3NTQ3OSwiZXhwIjoyMDk4NzUxNDc5fQ.ix-dN88aP6suyeHVA2ozXRWjuMJHwxbUZTDy0q7ZKNE';

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(NEW_URL, NEW_KEY);

const tables = [
  'stations',
  'categories',
  'menu_items',
  'orders',
  'config',
  'users',
  'admins'
];

async function runMigration() {
  console.log('--- Starting Database Migration ---');
  console.log(`Source (Old): ${OLD_URL}`);
  console.log(`Destination (New): ${NEW_URL}\n`);
  
  for (const table of tables) {
    console.log(`Migrating table: "${table}"...`);
    
    // 1. Fetch data from old DB
    const { data: oldData, error: fetchError } = await oldSupabase
      .from(table)
      .select('*');
      
    if (fetchError) {
      console.error(`❌ Error fetching from old DB table "${table}":`, fetchError.message);
      continue;
    }
    
    console.log(`🔹 Found ${oldData.length} rows in old DB.`);
    
    if (oldData.length === 0) {
      console.log(`⚠️ No data to migrate for table "${table}". Skipping.\n`);
      continue;
    }
    
    // 2. Insert data into new DB
    const { error: insertError } = await newSupabase
      .from(table)
      .upsert(oldData);
      
    if (insertError) {
      console.error(`❌ Error inserting/upserting into new DB table "${table}":`);
      console.error(insertError.message);
      if (oldData && oldData[0]) {
        console.log(`Available columns in old DB row:`, Object.keys(oldData[0]));
      }
      if (insertError.message.includes('relation') || insertError.message.includes('does not exist')) {
        console.log(`👉 TIP: Please ensure you run the SQL schema script (supabase_schema.sql) on your new Supabase dashboard's SQL Editor first so the table exists.`);
      }
      console.log();
    } else {
      console.log(`✅ Successfully migrated ${oldData.length} rows into new DB table "${table}".\n`);
    }
  }
  
  console.log('--- Migration Completed ---');
}

runMigration();
