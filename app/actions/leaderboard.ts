'use server';

import { LeaderboardEntry } from '@/lib/game/types';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * Retrieves the global leaderboard
 * 
 * @param limit - Number of entries to retrieve
 * @returns Array of leaderboard entries
 */
export async function getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('leaderboard_view')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Fallback to empty array instead of throwing to prevent UI crash
      return [];
    }
    
    return data.map((entry: { id: string; session_id: string; player_name: string | null; score: number; cells_revealed: number | null; time_played: number | null; created_at: string }) => ({
      id: entry.id,
      sessionId: entry.session_id,
      playerName: entry.player_name || 'Anonymous',
      score: entry.score,
      cellsRevealed: entry.cells_revealed || 0,
      timePlayed: entry.time_played || 0,
      createdAt: new Date(entry.created_at),
    }));
  } catch (error) {
    console.error('getGlobalLeaderboard error:', error);
    return [];
  }
}

/**
 * Submits a score to the leaderboard
 * Note: In a real app, this might be handled automatically via database triggers
 * or when ending a game session.
 * 
 * @param sessionId - Game session ID
 * @param playerName - Player's display name
 * @param score - Final score
 */
export async function submitScore(sessionId: string, playerName: string, score: number) {
  try {
    // Check if score qualifies for leaderboard (e.g. top 1000)
    // For now, we just insert/update the session record with the player name
    
    const { error } = await supabaseAdmin
      .from('game_sessions')
      .update({
        user_id: playerName, // Using user_id column for name temporarily if no auth
        score: score
      })
      .eq('id', sessionId);
      
    if (error) {
      console.error('Failed to submit score:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('submitScore error:', error);
    return { success: false, error: String(error) };
  }
}
