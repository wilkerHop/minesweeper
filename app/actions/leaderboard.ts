'use server';

import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';

/**
 * Input validation schemas
 */
const submitToLeaderboardSchema = z.object({
  sessionId: z.string().uuid(),
  playerName: z.string().min(1).max(255),
  cellsRevealed: z.number().int().min(0),
  timePlayed: z.number().int().min(0), // in seconds
});

/**
 * Submits a game session to the leaderboard
 * 
 * @param sessionId - Game session ID
 * @param playerName - Player's display name
 * @param cellsRevealed - Number of cells revealed
 * @param timePlayed - Time played in seconds
 */
export async function submitToLeaderboard(
  sessionId: string,
  playerName: string,
  cellsRevealed: number,
  timePlayed: number
) {
  try {
    // Validate input
    submitToLeaderboardSchema.parse({ sessionId, playerName, cellsRevealed, timePlayed });
    
    // Get the game session to get the score
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('game_sessions')
      .select('score, status')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      throw new Error('Game session not found');
    }
    
    // Only allow completed games to be submitted
    if (session.status !== 'WON' && session.status !== 'LOST') {
      throw new Error('Cannot submit incomplete game to leaderboard');
    }
    
    // Insert into leaderboard
    const { data, error } = await supabaseAdmin
      .from('leaderboard')
      .insert({
        session_id: sessionId,
        player_name: playerName,
        score: session.score,
        cells_revealed: cellsRevealed,
        time_played: timePlayed,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to submit to leaderboard:', error);
      throw new Error('Failed to submit to leaderboard');
    }
    
    return {
      success: true,
      leaderboardId: data.id,
    };
  } catch (error) {
    console.error('submitToLeaderboard error:', error);
    throw error;
  }
}

/**
 * Gets the top scores from the leaderboard
 * 
 * @param limit - Number of top scores to retrieve (default: 10)
 * @returns Array of leaderboard entries
 */
export async function getTopScores(limit: number = 10) {
  try {
    const { data, error } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Failed to get top scores:', error);
      throw new Error('Failed to get top scores');
    }
    
    return data.map(entry => ({
      id: entry.id,
      sessionId: entry.session_id,
      playerName: entry.player_name,
      score: entry.score,
      cellsRevealed: entry.cells_revealed,
      timePlayed: entry.time_played,
      createdAt: new Date(entry.created_at),
    }));
  } catch (error) {
    console.error('getTopScores error:', error);
    throw error;
  }
}

/**
 * Gets the best scores for a specific user
 * 
 * @param userId - User ID
 * @param limit - Number of scores to retrieve (default: 5)
 * @returns Array of user's best scores
 */
export async function getUserBestScores(userId: string, limit: number = 5) {
  try {
    // First get the user's game sessions
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('game_sessions')
      .select('id')
      .eq('user_id', userId);
    
    if (sessionsError) {
      throw new Error('Failed to get user sessions');
    }
    
    if (!sessions || sessions.length === 0) {
      return [];
    }
    
    const sessionIds = sessions.map(s => s.id);
    
    // Get leaderboard entries for those sessions
    const { data, error } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .in('session_id', sessionIds)
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Failed to get user best scores:', error);
      throw new Error('Failed to get user best scores');
    }
    
    return data.map(entry => ({
      id: entry.id,
      sessionId: entry.session_id,
      playerName: entry.player_name,
      score: entry.score,
      cellsRevealed: entry.cells_revealed,
      timePlayed: entry.time_played,
      createdAt: new Date(entry.created_at),
    }));
  } catch (error) {
    console.error('getUserBestScores error:', error);
    throw error;
  }
}
