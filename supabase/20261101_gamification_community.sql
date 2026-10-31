ALTER TABLE spaces
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'room',
  ADD COLUMN IF NOT EXISTS baseline_kwh_per_day NUMERIC CHECK (baseline_kwh_per_day IS NULL OR baseline_kwh_per_day >= 0),
  ADD COLUMN IF NOT EXISTS people_count INTEGER CHECK (people_count IS NULL OR people_count > 0);

ALTER TABLE spaces
  DROP CONSTRAINT IF EXISTS spaces_type_check;

ALTER TABLE spaces
  ADD CONSTRAINT spaces_type_check CHECK (type IN ('room', 'hostel', 'society', 'campus'));

CREATE TABLE IF NOT EXISTS points_ledger (
  profile_id TEXT NOT NULL,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  points INTEGER NOT NULL CHECK (points >= 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, date, source)
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_profile_date
  ON points_ledger (profile_id, date DESC);

CREATE TABLE IF NOT EXISTS community_goals (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  target_percent NUMERIC NOT NULL CHECK (target_percent >= 0 AND target_percent <= 100),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_start <= period_end)
);

CREATE INDEX IF NOT EXISTS idx_community_goals_space_period
  ON community_goals (space_id, period_start DESC, period_end);

ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow access to points ledger" ON points_ledger;
CREATE POLICY "Allow access to points ledger" ON points_ledger
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow access to community goals" ON community_goals;
CREATE POLICY "Allow access to community goals" ON community_goals
  FOR ALL USING (true) WITH CHECK (true);
