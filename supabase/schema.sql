-- ==============================================================================
-- WattWise Supabase PostgreSQL Schema
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase project dashboard (https://supabase.com/dashboard).
-- 2. Navigate to the SQL Editor from the left-hand navigation.
-- 3. Paste the contents of this file into a new query and click "Run".
-- ==============================================================================

-- 1. Spaces table: tracks user physical environments (rooms, apartments, buildings)
CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default demo space
INSERT INTO spaces (id, name)
VALUES ('default', 'My Room')
ON CONFLICT (id) DO NOTHING;

-- 2. Readings table: daily electricity consumption measurements
CREATE TABLE IF NOT EXISTS readings (
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  kwh NUMERIC NOT NULL CHECK (kwh >= 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (space_id, date)
);

-- 3. Composite Index on (space_id, date) for optimal range scans and ordering
CREATE INDEX IF NOT EXISTS idx_readings_space_date ON readings (space_id, date ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

-- Demo policies allowing anonymous read/upsert access
CREATE POLICY "Allow read access to spaces" ON spaces
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to readings" ON readings
  FOR SELECT USING (true);

CREATE POLICY "Allow upsert access to readings" ON readings
  FOR ALL USING (true) WITH CHECK (true);
