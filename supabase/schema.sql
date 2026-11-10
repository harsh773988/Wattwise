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
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- Authenticated users can access only their own spaces and readings.
CREATE POLICY "Users can read their own spaces" ON spaces
  FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can create their own spaces" ON spaces
  FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own spaces" ON spaces
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own spaces" ON spaces
  FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can read readings in their own spaces" ON readings
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM spaces
    WHERE spaces.id = readings.space_id
      AND spaces.owner_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can add readings to their own spaces" ON readings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM spaces
    WHERE spaces.id = readings.space_id
      AND spaces.owner_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update readings in their own spaces" ON readings
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM spaces
    WHERE spaces.id = readings.space_id
      AND spaces.owner_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM spaces
    WHERE spaces.id = readings.space_id
      AND spaces.owner_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete readings in their own spaces" ON readings
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM spaces
    WHERE spaces.id = readings.space_id
      AND spaces.owner_id = (SELECT auth.uid())
  ));

CREATE OR REPLACE FUNCTION public.create_wattwise_home_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.spaces (id, name, owner_id)
  VALUES (
    NEW.id::TEXT,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''), 'My Home'),
    NEW.id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_wattwise_home_after_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_wattwise_home_for_user();
