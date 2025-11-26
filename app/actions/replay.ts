'use server';

import { turso } from '@/lib/db/turso';

export interface ReplayMove {
  x: number;
  y: number;
  action: 'REVEAL' | 'FLAG' | 'UNFLAG';
  timestamp: number;
  timeOffset: number; // Time since game start
}

export interface ReplayData {
  sessionId: string;
  moves: ReplayMove[];
}

/**
 * Retrieves replay data for a given session
 * 
 * @param sessionId - Game session ID
 * @returns Replay data including all moves
 */
export async function getReplayData(sessionId: string): Promise<ReplayData | null> {
  try {
    const result = await turso.execute({
      sql: `
        SELECT x, y, action, timestamp
        FROM modified_cells
        WHERE session_id = ?
        ORDER BY timestamp ASC
      `,
      args: [sessionId],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const moves = result.rows.map((row) => ({
      x: row.x as number,
      y: row.y as number,
      action: row.action as 'REVEAL' | 'FLAG' | 'UNFLAG',
      timestamp: row.timestamp as number,
    }));

    // Calculate time offsets relative to the first move
    // (or ideally relative to game start time, but first move is a good approximation for now)
    const startTime = moves[0].timestamp;
    const movesWithOffset = moves.map(move => ({
      ...move,
      timeOffset: move.timestamp - startTime
    }));

    return {
      sessionId,
      moves: movesWithOffset,
    };
  } catch (error) {
    console.error('getReplayData error:', error);
    return null;
  }
}
