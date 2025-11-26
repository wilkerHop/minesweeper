import { DEFAULT_MINE_DENSITY } from './constants';

/**
 * Seeded Pseudo-Random Number Generator using Mulberry32
 * This ensures deterministic mine placement across all environments
 * 
 * @param seed - String seed to initialize the generator
 * @returns A function that generates pseudo-random numbers between 0 and 1
 */
function createSeededRNG(seed: string): () => number {
  // Convert string seed to a 32-bit hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Mulberry32 algorithm
  return function(): number {
    hash = hash + 0x6D2B79F5 | 0;
    let t = Math.imul(hash ^ hash >>> 15, 1 | hash);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generates a cryptographically secure random seed
 * This is server-side only to prevent client manipulation
 * 
 * @returns A random seed string
 */
export function generateSeed(): string {
  if (typeof window !== 'undefined') {
    throw new Error('generateSeed() must be called server-side only');
  }
  
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Deterministic hash function for mine placement
 * Ensures hash(x, y, seed) = hash(x, y, seed) across all environments
 * 
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param seed - Game seed
 * @param mineDensity - Probability of a cell being a mine (0-1)
 * @returns true if the cell is a mine, false otherwise
 */
export function isMineAt(
  x: number,
  y: number,
  seed: string,
  mineDensity: number = DEFAULT_MINE_DENSITY
): boolean {
  // Create a unique seed for this specific cell
  const cellSeed = `${seed}-${x}-${y}`;
  const rng = createSeededRNG(cellSeed);
  
  // Generate a random value and compare against mine density
  return rng() < mineDensity;
}

/**
 * Counts the number of adjacent mines for a given cell
 * 
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param seed - Game seed
 * @param mineDensity - Mine density
 * @returns Number of adjacent mines (0-8)
 */
export function getAdjacentMines(
  x: number,
  y: number,
  seed: string,
  mineDensity: number = DEFAULT_MINE_DENSITY
): number {
  let count = 0;
  
  // Check all 8 adjacent cells
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      // Skip the center cell
      if (dx === 0 && dy === 0) continue;
      
      const adjX = x + dx;
      const adjY = y + dy;
      
      if (isMineAt(adjX, adjY, seed, mineDensity)) {
        count++;
      }
    }
  }
  
  return count;
}

/**
 * Gets the cells to reveal when a cell with 0 adjacent mines is clicked
 * Uses flood fill algorithm with a maximum limit to prevent excessive computation
 * 
 * @param x - Starting X coordinate
 * @param y - Starting Y coordinate
 * @param seed - Game seed
 * @param mineDensity - Mine density
 * @param maxCells - Maximum number of cells to reveal
 * @returns Array of [x, y] coordinates to reveal
 */
export function getFloodFillCells(
  x: number,
  y: number,
  seed: string,
  mineDensity: number = DEFAULT_MINE_DENSITY,
  maxCells: number = 1000
): [number, number][] {
  const toReveal: [number, number][] = [];
  const visited = new Set<string>();
  const queue: [number, number][] = [[x, y]];
  
  while (queue.length > 0 && toReveal.length < maxCells) {
    const [currentX, currentY] = queue.shift()!;
    const key = `${currentX},${currentY}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    // Don't reveal mines
    if (isMineAt(currentX, currentY, seed, mineDensity)) continue;
    
    toReveal.push([currentX, currentY]);
    
    const adjacentMines = getAdjacentMines(currentX, currentY, seed, mineDensity);
    
    // Only continue flood fill if there are no adjacent mines
    if (adjacentMines === 0) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          
          const newX = currentX + dx;
          const newY = currentY + dy;
          const newKey = `${newX},${newY}`;
          
          if (!visited.has(newKey)) {
            queue.push([newX, newY]);
          }
        }
      }
    }
  }
  
  return toReveal;
}

/**
 * Validates that the deterministic hash function works correctly
 * This is used in tests to ensure hash(A) = hash(A)
 * 
 * @param seed - Test seed
 * @param iterations - Number of iterations to test
 * @returns true if all iterations produce consistent results
 */
export function validateDeterminism(seed: string, iterations: number = 100): boolean {
  const testCases: Array<[number, number]> = [];
  
  // Generate random test coordinates
  for (let i = 0; i < iterations; i++) {
    testCases.push([
      Math.floor(Math.random() * 1000) - 500,
      Math.floor(Math.random() * 1000) - 500
    ]);
  }
  
  // Test each coordinate twice
  for (const [x, y] of testCases) {
    const result1 = isMineAt(x, y, seed);
    const result2 = isMineAt(x, y, seed);
    
    if (result1 !== result2) {
      console.error(`Determinism failed at (${x}, ${y}): ${result1} !== ${result2}`);
      return false;
    }
  }
  
  return true;
}
