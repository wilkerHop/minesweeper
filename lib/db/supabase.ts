import { env } from '@/lib/env';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for client-side operations
 */
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Supabase admin client for server-side operations
 * Uses service role key for elevated permissions
 */
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Database types for Supabase tables
 */
export interface Database {
  public: {
    Tables: {
      game_sessions: {
        Row: {
          id: string;
          seed: string;
          mine_density: number;
          start_time: string;
          end_time: string | null;
          score: number;
          status: string;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seed: string;
          mine_density?: number;
          start_time?: string;
          end_time?: string | null;
          score?: number;
          status?: string;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seed?: string;
          mine_density?: number;
          start_time?: string;
          end_time?: string | null;
          score?: number;
          status?: string;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leaderboard: {
        Row: {
          id: string;
          session_id: string;
          player_name: string;
          score: number;
          cells_revealed: number;
          time_played: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          player_name: string;
          score: number;
          cells_revealed: number;
          time_played: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          player_name?: string;
          score?: number;
          cells_revealed?: number;
          time_played?: number;
          created_at?: string;
        };
      };
    };
  };
}
