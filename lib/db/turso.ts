import { env } from '@/lib/env';
import { createClient } from '@libsql/client';

/**
 * Turso client for ModifiedCell storage (replay history)
 * Turso is optimized for edge computing and low-latency writes
 */
export const turso = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

/**
 * Initialize Turso schema
 * Creates the modified_cells table if it doesn't exist
 */
export async function initializeTursoSchema() {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS modified_cells (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('REVEAL', 'FLAG', 'UNFLAG')),
        timestamp INTEGER NOT NULL,
        UNIQUE(session_id, x, y, action, timestamp)
      )
    `);

    await turso.execute(`
      CREATE INDEX IF NOT EXISTS idx_modified_cells_session 
      ON modified_cells(session_id)
    `);

    await turso.execute(`
      CREATE INDEX IF NOT EXISTS idx_modified_cells_coords 
      ON modified_cells(session_id, x, y)
    `);

    console.log('Turso schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Turso schema:', error);
    throw error;
  }
}

/**
 * Modified cell interface for Turso
 */
export interface TursoModifiedCell {
  id?: number;
  session_id: string;
  x: number;
  y: number;
  action: 'REVEAL' | 'FLAG' | 'UNFLAG';
  timestamp: number;
}
