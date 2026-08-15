-- Global Item Overrides Table
-- Station admins can toggle global items (station_code='ALL') on/off for their specific station.
-- This is like Flipkart's "not available at your pincode" model.
CREATE TABLE IF NOT EXISTS global_item_overrides (
  id SERIAL PRIMARY KEY,
  item_id TEXT NOT NULL,             -- references menu_items.id
  station_code TEXT NOT NULL,        -- The station code for which this override applies
  available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, station_code)      -- One override per item per station
);

-- Index for fast lookups by station
CREATE INDEX IF NOT EXISTS idx_global_item_overrides_station ON global_item_overrides(station_code);
CREATE INDEX IF NOT EXISTS idx_global_item_overrides_item ON global_item_overrides(item_id);

-- Enable Row Level Security
ALTER TABLE global_item_overrides ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated and public reads (customers need to see override state)
CREATE POLICY "Allow public read" ON global_item_overrides
  FOR SELECT USING (true);

-- Allow all writes (station admins manage this via admin UI which bypasses RLS via anon key)
CREATE POLICY "Allow all writes" ON global_item_overrides
  FOR ALL USING (true);
