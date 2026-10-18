-- WattWise Supabase PostgreSQL Schema
-- Run this script in the Supabase SQL Editor to initialize tables and indexes

-- 1. Create Spaces table (supports multi-space: room, hostel block, campus)
CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default space
INSERT INTO spaces (id, name)
VALUES ('default', 'Main Space')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Readings table
CREATE TABLE IF NOT EXISTS readings (
  id BIGSERIAL PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  kwh NUMERIC(8, 2) NOT NULL CHECK (kwh >= 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_space_date UNIQUE (space_id, date)
);

-- 3. Composite Index on (space_id, date) for optimal lookup and range queries
CREATE INDEX IF NOT EXISTS idx_readings_space_date ON readings (space_id, date ASC);

-- 4. Enable Row Level Security (RLS) with open public demo access
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to spaces" ON spaces
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to readings" ON readings
  FOR SELECT USING (true);

CREATE POLICY "Allow public upsert access to readings" ON readings
  FOR ALL USING (true) WITH CHECK (true);
