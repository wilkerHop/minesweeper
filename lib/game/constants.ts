/**
 * Default mine density (15% probability a cell is a mine)
 */
export const DEFAULT_MINE_DENSITY = 0.15;

/**
 * Chunk size for infinite grid optimization
 * The grid is divided into chunks for efficient rendering
 */
export const CHUNK_SIZE = 100;

/**
 * Maximum number of cells to reveal per click (flood fill limit)
 * Prevents excessive computation on large empty areas
 */
export const MAX_REVEAL_PER_CLICK = 1000;

/**
 * Score multiplier for each revealed safe cell
 */
export const POINTS_PER_CELL = 10;

/**
 * Score bonus for correctly flagging a mine
 */
export const POINTS_PER_FLAG = 50;

/**
 * Penalty for incorrectly flagging a safe cell
 */
export const PENALTY_PER_WRONG_FLAG = -25;
