import crypto from 'crypto';
import { DEFAULT_MINE_DENSITY } from './constants';

/**
 * Converts a string to a 32-bit integer seed
 */
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Mulberry32 PRNG
 */
function mulberry32(a: number): () => number {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
 * Generates a cryptographically secure random seed
 * This is server-side only to prevent client manipulation
 */
export function generateSeed(): string {
  if (typeof window !== 'undefined') {
    throw new Error('generateSeed() must be called server-side only');
  }
  
  return crypto.randomBytes(32).toString('hex');
}

export enum Biome {
  SAFE_HAVEN = 'SAFE_HAVEN',
  WASTELAND = 'WASTELAND',
  VOID = 'VOID',
  MINEFIELD = 'MINEFIELD',
}

export function getBiome(x: number, y: number): Biome {
  const distance = Math.sqrt(x * x + y * y);

  if (distance < 50) return Biome.SAFE_HAVEN;
  if (distance < 100) return Biome.WASTELAND;
  if (distance < 200) return Biome.VOID;
  return Biome.MINEFIELD;
}

export function getBiomeDensity(x: number, y: number, baseDensity: number): number {
  const biome = getBiome(x, y);

  switch (biome) {
    case Biome.SAFE_HAVEN:
      return baseDensity;
    case Biome.WASTELAND:
      return Math.min(0.9, baseDensity * 1.2); // +20%
    case Biome.VOID:
      return Math.min(0.9, baseDensity * 1.5); // +50%
    case Biome.MINEFIELD:
      return Math.min(0.9, baseDensity * 2.0); // +100%
  }
}

/**
 * Determines if a mine exists at the given coordinates using a seeded random number generator.
 * Now incorporates Biome logic for dynamic density.
 */
export function isMineAt(x: number, y: number, seed: string, baseDensity: number = DEFAULT_MINE_DENSITY): boolean {
  // Create a unique seed for this coordinate
  const coordSeed = `${seed}:${x},${y}`;
  
  // Create a new RNG instance for this specific cell
  const rng = mulberry32(stringToSeed(coordSeed));
  
  // Generate a random number between 0 and 1
  const randomValue = rng();
  
  // Calculate dynamic density based on biome
  const effectiveDensity = getBiomeDensity(x, y, baseDensity);
  
  // If the random value is less than the density, it's a mine
  return randomValue < effectiveDensity;
}

/**
 * Counts the number of adjacent mines for a given cell.
 */
export function getAdjacentMines(x: number, y: number, seed: string, baseDensity: number = DEFAULT_MINE_DENSITY): number {
  let count = 0;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      // Skip the center cell
      if (dx === 0 && dy === 0) continue;

      if (isMineAt(x + dx, y + dy, seed, baseDensity)) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Performs a flood fill to find all connected empty cells (0 adjacent mines)
 * starting from the given coordinates.
 * Returns an array of [x, y] coordinates to reveal.
 */
export function getFloodFillCells(startX: number, startY: number, seed: string, baseDensity: number = DEFAULT_MINE_DENSITY, maxCells: number = 200): [number, number][] {
  const visited = new Set<string>();
  const queue: [number, number][] = [[startX, startY]];
  const result: [number, number][] = [];

  // Safety limit to prevent infinite loops or massive memory usage
  const MAX_REVEAL = maxCells;

  while (queue.length > 0 && result.length < MAX_REVEAL) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    visited.add(key);
    result.push([x, y]);

    const adjacentMines = getAdjacentMines(x, y, seed, baseDensity);

    // If this cell has no adjacent mines, we can continue expanding
    if (adjacentMines === 0) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;

          const nx = x + dx;
          const ny = y + dy;
          const nKey = `${nx},${ny}`;

          if (!visited.has(nKey)) {
            queue.push([nx, ny]);
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Validates that the deterministic hash function works correctly
 * This is used in tests to ensure hash(A) = hash(A)
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
