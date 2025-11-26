-- Turso Schema for Modified Cells (Replay History)
-- This database stores all cell modifications for replay functionality

CREATE TABLE IF NOT EXISTS modified_cells (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('REVEAL', 'FLAG', 'UNFLAG')),
  timestamp INTEGER NOT NULL,
  UNIQUE(session_id, x, y, action, timestamp)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_modified_cells_session 
  ON modified_cells(session_id);

CREATE INDEX IF NOT EXISTS idx_modified_cells_coords 
  ON modified_cells(session_id, x, y);

CREATE INDEX IF NOT EXISTS idx_modified_cells_timestamp 
  ON modified_cells(session_id, timestamp);
