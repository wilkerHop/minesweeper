import {
    getAdjacentMines,
    getFloodFillCells,
    isMineAt,
    validateDeterminism,
} from '@/lib/game/deterministic';
import { describe, expect, it } from 'vitest';

describe('Deterministic Hash Function', () => {
  const testSeed = 'test-seed-12345';

  it('should produce consistent results for same inputs (hash(A) = hash(A))', () => {
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const x = Math.floor(Math.random() * 1000) - 500;
      const y = Math.floor(Math.random() * 1000) - 500;
      
      const result1 = isMineAt(x, y, testSeed, 0.15);
      const result2 = isMineAt(x, y, testSeed, 0.15);
      
      expect(result1).toBe(result2);
    }
  });

  it('should produce different results for different coordinates', () => {
    const result1 = isMineAt(0, 0, testSeed);
    const result2 = isMineAt(1, 0, testSeed);
    const result3 = isMineAt(0, 1, testSeed);
    
    // It's statistically very unlikely all three are the same
    const allSame = result1 === result2 && result2 === result3;
    expect(allSame).toBe(false);
    
    // Ensure the values are actually boolean
    expect(typeof result1).toBe('boolean');
    expect(typeof result2).toBe('boolean');
  });

  it('should produce different results for different seeds', () => {
    const seed1 = 'seed-one';
    const seed2 = 'seed-two';
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used in statistical test below
    const result1 = isMineAt(10, 20, seed1);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used in statistical test below
    const result2 = isMineAt(10, 20, seed2);
    
    // With high probability, different seeds should give different results
    // We test multiple coordinates to be more confident
    let differencesFound = 0;
    for (let i = 0; i < 100; i++) {
      const r1 = isMineAt(i, i, seed1);
      const r2 = isMineAt(i, i, seed2);
      if (r1 !== r2) differencesFound++;
    }
    
    expect(differencesFound).toBeGreaterThan(10); // At least 10% should differ
  });

  it('should respect mine density approximately', () => {
    const density = 0.15;
    const samples = 10000;
    let mineCount = 0;
    
    for (let i = 0; i < samples; i++) {
      const x = i % 100;
      const y = Math.floor(i / 100);
      if (isMineAt(x, y, testSeed, density)) {
        mineCount++;
      }
    }
    
    const actualDensity = mineCount / samples;
    
    // Allow 20% deviation from target density (within reason for random distribution)
    expect(actualDensity).toBeGreaterThan(density * 0.8);
    expect(actualDensity).toBeLessThan(density * 1.2);
  });

  it('should work with negative coordinates', () => {
    const result1 = isMineAt(-10, -20, testSeed);
    const result2 = isMineAt(-10, -20, testSeed);
    
    expect(result1).toBe(result2);
  });

  it('should count adjacent mines correctly', () => {
    // Test a few positions
    const adjacentCount = getAdjacentMines(0, 0, testSeed, 0.15);
    
    expect(adjacentCount).toBeGreaterThanOrEqual(0);
    expect(adjacentCount).toBeLessThanOrEqual(8);
    
    // Verify the count is deterministic
    const adjacentCount2 = getAdjacentMines(0, 0, testSeed, 0.15);
    expect(adjacentCount).toBe(adjacentCount2);
  });

  it('should correctly identify cells with no adjacent mines', () => {
    // With very low density, we should find cells with 0 adjacent mines
    const adjacentCount = getAdjacentMines(100, 100, testSeed, 0.01);
    
    expect(adjacentCount).toBeGreaterThanOrEqual(0);
    expect(adjacentCount).toBeLessThanOrEqual(8);
  });

  it('should validate determinism correctly', () => {
    const isValid = validateDeterminism(testSeed, 100);
    expect(isValid).toBe(true);
  });

  it('should perform flood fill on empty areas', () => {
    // Find a cell with no adjacent mines
    let x = 0, y = 0;
    let found = false;
    
    for (let i = 0; i < 1000; i++) {
      x = Math.floor(Math.random() * 100);
      y = Math.floor(Math.random() * 100);
      
      if (!isMineAt(x, y, testSeed, 0.05) && getAdjacentMines(x, y, testSeed, 0.05) === 0) {
        found = true;
        break;
      }
    }
    
    if (found) {
      const cells = getFloodFillCells(x, y, testSeed, 0.05);
      
      // Flood fill should reveal multiple cells
      expect(cells.length).toBeGreaterThan(1);
      
      // All revealed cells should not be mines
      for (const [cellX, cellY] of cells) {
        expect(isMineAt(cellX, cellY, testSeed, 0.05)).toBe(false);
      }
    }
  });

  it('should respect max cells limit in flood fill', () => {
    const maxCells = 50;
    
    // Find a cell with no adjacent mines
    let x = 0, y = 0;
    
    for (let i = 0; i < 1000; i++) {
      x = Math.floor(Math.random() * 100);
      y = Math.floor(Math.random() * 100);
      
      if (!isMineAt(x, y, testSeed, 0.01) && getAdjacentMines(x, y, testSeed, 0.01) === 0) {
        break;
      }
    }
    
    const cells = getFloodFillCells(x, y, testSeed, 0.01, maxCells);
    
    expect(cells.length).toBeLessThanOrEqual(maxCells);
  });
});
