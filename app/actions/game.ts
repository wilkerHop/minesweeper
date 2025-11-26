'use server';

import { turso } from '@/lib/db/turso';
import { DEFAULT_MINE_DENSITY } from '@/lib/game/constants';
import { generateSeed } from '@/lib/game/deterministic';
import { CellAction, GameStatus } from '@/lib/game/types';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Input validation schemas
 */
const createGameSessionSchema = z.object({
  mineDensity: z.number().min(0.01).max(0.5).optional(),
  userId: z.string().optional(),
});

const recordCellModificationSchema = z.object({
  sessionId: z.string().uuid(),
  x: z.number().int(),
  y: z.number().int(),
  action: z.nativeEnum(CellAction),
});

const endGameSessionSchema = z.object({
  sessionId: z.string().uuid(),
  score: z.number().int().min(0),
  status: z.nativeEnum(GameStatus),
});

/**
 * Creates a new game session
 * Generates a unique seed and stores the session in Supabase
 * 
 * @returns Session ID, seed, and mine density
 */
export async function createGameSession(input?: { mineDensity?: number; userId?: string }) {
  try {
    // Validate input
    const validated = input ? createGameSessionSchema.parse(input) : {};
    
    // Generate a unique seed
    const seed = generateSeed();
    const mineDensity = validated.mineDensity || DEFAULT_MINE_DENSITY;
    
    // Insert into Supabase
    const { data, error } = await supabaseAdmin
      .from('game_sessions')
      .insert({
        seed,
        mine_density: mineDensity,
        status: GameStatus.ACTIVE,
        score: 0,
        user_id: validated.userId,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create game session:', error);
      throw new Error('Failed to create game session');
    }
    
    return {
      sessionId: data.id,
      seed,
      mineDensity,
    };
  } catch (error) {
    console.error('createGameSession error:', error);
    throw error;
  }
}

/**
 * Records a cell modification (reveal, flag, unflag) in Turso
 * Used for replay functionality
 * 
 * @param sessionId - Game session ID
 * @param x - Cell X coordinate
 * @param y - Cell Y coordinate
 * @param action - Action performed on the cell
 */
export async function recordCellModification(
  sessionId: string,
  x: number,
  y: number,
  action: CellAction
) {
  try {
    // Validate input
    recordCellModificationSchema.parse({ sessionId, x, y, action });
    
    const timestamp = Date.now();
    
    // Insert into Turso
    await turso.execute({
      sql: `
        INSERT INTO modified_cells (session_id, x, y, action, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [sessionId, x, y, action, timestamp],
    });
    
    return { success: true };
  } catch (error) {
    console.error('recordCellModification error:', error);
    
    // Don't throw - we don't want to interrupt gameplay if replay recording fails
    return { success: false, error: String(error) };
  }
}

/**
 * Ends a game session and updates the final score and status
 * 
 * @param sessionId - Game session ID
 * @param score - Final score
 * @param status - Game status (WON or LOST)
 */
export async function endGameSession(
  sessionId: string,
  score: number,
  status: GameStatus
) {
  try {
    // Validate input
    endGameSessionSchema.parse({ sessionId, score, status });
    
    const { error } = await supabaseAdmin
      .from('game_sessions')
      .update({
        end_time: new Date().toISOString(),
        score,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
    
    if (error) {
      console.error('Failed to end game session:', error);
      throw new Error('Failed to end game session');
    }
    
    return { success: true };
  } catch (error) {
    console.error('endGameSession error:', error);
    throw error;
  }
}

/**
 * Retrieves a game session by ID
 * 
 * @param sessionId - Game session ID
 * @returns Game session data
 */
export async function getGameSession(sessionId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      console.error('Failed to get game session:', error);
      throw new Error('Game session not found');
    }
    
    return {
      id: data.id,
      seed: data.seed,
      mineDensity: data.mine_density,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : null,
      score: data.score,
      status: data.status as GameStatus,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error('getGameSession error:', error);
    throw error;
  }
}

/**
 * Updates the score for an active game session
 * 
 * @param sessionId - Game session ID
 * @param score - New score
 */
export async function updateGameScore(sessionId: string, score: number) {
  try {
    const { error } = await supabaseAdmin
      .from('game_sessions')
      .update({
        score,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('status', GameStatus.ACTIVE); // Only update active games
    
    if (error) {
      console.error('Failed to update game score:', error);
      throw new Error('Failed to update game score');
    }
    
    return { success: true };
  } catch (error) {
    console.error('updateGameScore error:', error);
    throw error;
  }
}
