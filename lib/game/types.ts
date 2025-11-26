/**
 * Game status enum
 */
export enum GameStatus {
  ACTIVE = 'ACTIVE',
  WON = 'WON',
  LOST = 'LOST',
}

/**
 * Cell action types for replay history
 */
export enum CellAction {
  REVEAL = 'REVEAL',
  FLAG = 'FLAG',
  UNFLAG = 'UNFLAG',
}

/**
 * Game session data structure
 */
export interface GameSession {
  id: string;
  seed: string;
  mineDensity: number;
  startTime: Date;
  endTime?: Date;
  score: number;
  status: GameStatus;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Modified cell record for replay functionality
 */
export interface ModifiedCell {
  id?: number;
  sessionId: string;
  x: number;
  y: number;
  action: CellAction;
  timestamp: number;
}

/**
 * Cell state for client-side rendering
 */
export interface CellState {
  x: number;
  y: number;
  isRevealed: boolean;
  isFlagged: boolean;
  isMine: boolean;
  adjacentMines: number;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  id: string;
  sessionId: string;
  playerName: string;
  score: number;
  cellsRevealed: number;
  timePlayed: number; // in seconds
  createdAt: Date;
}

/**
 * API response for creating a new game session
 */
export interface CreateGameSessionResponse {
  sessionId: string;
  seed: string;
  mineDensity: number;
}
