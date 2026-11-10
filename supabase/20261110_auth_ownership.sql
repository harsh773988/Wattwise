-- Add account ownership to WattWise spaces and restrict household readings to
-- the authenticated owner. Existing unowned demo spaces remain inaccessible
-- through the user-facing API after this migration.

ALTER TABLE spaces
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_spaces_owner_id ON spaces (owner_id);

DROP POLICY IF EXISTS "Allow read access to spaces" ON spaces;
DROP POLICY IF EXISTS "Users can read their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can create their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can update their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can delete their own spaces" ON spaces;

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

DROP POLICY IF EXISTS "Allow read access to readings" ON readings;
DROP POLICY IF EXISTS "Allow upsert access to readings" ON readings;
DROP POLICY IF EXISTS "Users can read readings in their own spaces" ON readings;
DROP POLICY IF EXISTS "Users can add readings to their own spaces" ON readings;
DROP POLICY IF EXISTS "Users can update readings in their own spaces" ON readings;
DROP POLICY IF EXISTS "Users can delete readings in their own spaces" ON readings;

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

ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to challenge completions" ON challenge_completions;
DROP POLICY IF EXISTS "Users can access their own challenge completions" ON challenge_completions;
CREATE POLICY "Users can access their own challenge completions" ON challenge_completions
  FOR ALL TO authenticated
  USING (profile_id = (SELECT auth.uid()::TEXT))
  WITH CHECK (profile_id = (SELECT auth.uid()::TEXT));

ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to points ledger" ON points_ledger;
DROP POLICY IF EXISTS "Users can access their own points ledger" ON points_ledger;
CREATE POLICY "Users can access their own points ledger" ON points_ledger
  FOR ALL TO authenticated
  USING (profile_id = (SELECT auth.uid()::TEXT))
  WITH CHECK (profile_id = (SELECT auth.uid()::TEXT));

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

DROP TRIGGER IF EXISTS create_wattwise_home_after_signup ON auth.users;
CREATE TRIGGER create_wattwise_home_after_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_wattwise_home_for_user();

INSERT INTO public.spaces (id, name, owner_id)
SELECT
  users.id::TEXT,
  COALESCE(NULLIF(users.raw_user_meta_data ->> 'display_name', ''), 'My Home'),
  users.id
FROM auth.users AS users
ON CONFLICT (id) DO NOTHING;
