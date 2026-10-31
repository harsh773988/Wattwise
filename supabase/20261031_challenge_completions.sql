CREATE TABLE IF NOT EXISTS challenge_completions (
  profile_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  date DATE NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, challenge_id, date)
);

CREATE INDEX IF NOT EXISTS idx_challenge_completions_profile_date
  ON challenge_completions (profile_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge_id
  ON challenge_completions (challenge_id);
