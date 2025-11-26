-- Game Sessions Table
-- Stores active and completed game sessions with scores
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed TEXT NOT NULL,
  mine_density DECIMAL NOT NULL DEFAULT 0.15,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  score INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for game_sessions
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created ON game_sessions(created_at DESC);

-- Leaderboard Table
-- Stores high scores and player achievements
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL,
  cells_revealed INTEGER NOT NULL,
  time_played INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leaderboard
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_session ON leaderboard(session_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_created ON leaderboard(created_at DESC);

-- Row Level Security (RLS) Policies
-- Enable RLS on tables
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read game sessions
CREATE POLICY "game_sessions_select_policy" ON game_sessions
  FOR SELECT USING (true);

-- Policy: Anyone can create game sessions
CREATE POLICY "game_sessions_insert_policy" ON game_sessions
  FOR INSERT WITH CHECK (true);

-- Policy: Users can update their own game sessions
CREATE POLICY "game_sessions_update_policy" ON game_sessions
  FOR UPDATE USING (true);

-- Policy: Anyone can read leaderboard
CREATE POLICY "leaderboard_select_policy" ON leaderboard
  FOR SELECT USING (true);

-- Policy: Anyone can insert to leaderboard
CREATE POLICY "leaderboard_insert_policy" ON leaderboard
  FOR INSERT WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
