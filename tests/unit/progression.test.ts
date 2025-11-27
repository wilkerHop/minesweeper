import {
    calculateMineDensity,
    calculatePointsPerCell,
    calculateSafeClicks,
    getDefaultProgress
} from '@/lib/game/upgrades';
import {
    addCoins,
    loadProgress,
    purchaseUpgrade,
    resetProgress,
    saveProgress
} from '@/lib/services/progressStorage';
import { beforeEach, describe, expect, it } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    key: (index: number) => Object.keys(store)[index] || null,
    length: 0
  };
})();

// Mock window and localStorage
Object.defineProperty(global, 'window', {
  value: {}
});
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

describe('Progression System', () => {
  beforeEach(() => {
    localStorage.clear();
    resetProgress();
  });

  describe('Storage Service', () => {
    it('should load default progress when storage is empty', () => {
      const progress = loadProgress();
      expect(progress).toEqual(getDefaultProgress());
    });

    it('should save and load progress', () => {
      const progress = getDefaultProgress();
      progress.totalCoins = 100;
      saveProgress(progress);

      const loaded = loadProgress();
      expect(loaded.totalCoins).toBe(100);
    });

    it('should add coins correctly', () => {
      addCoins(50);
      const progress = loadProgress();
      expect(progress.totalCoins).toBe(50);

      addCoins(25);
      const updated = loadProgress();
      expect(updated.totalCoins).toBe(75);
    });

    it('should allow purchasing upgrades if affordable', () => {
      addCoins(1000); // Enough for level 1 of everything
      
      const result = purchaseUpgrade('mineDensityReduction', 100);
      expect(result).not.toBeNull();
      expect(result?.totalCoins).toBe(900);
      expect(result?.upgrades.mineDensityReduction).toBe(1);

      const loaded = loadProgress();
      expect(loaded.upgrades.mineDensityReduction).toBe(1);
    });

    it('should prevent purchasing upgrades if not affordable', () => {
      addCoins(50); // Not enough for any upgrade (min 100)
      
      const result = purchaseUpgrade('mineDensityReduction', 100);
      expect(result).toBeNull();

      const loaded = loadProgress();
      expect(loaded.totalCoins).toBe(50);
      expect(loaded.upgrades.mineDensityReduction).toBe(0);
    });
  });

  describe('Upgrade Calculations', () => {
    it('should calculate mine density correctly', () => {
      expect(calculateMineDensity(0)).toBeCloseTo(0.15);
      expect(calculateMineDensity(1)).toBeCloseTo(0.14);
      expect(calculateMineDensity(5)).toBeCloseTo(0.10);
    });

    it('should calculate points per cell correctly', () => {
      expect(calculatePointsPerCell(0)).toBe(10);
      expect(calculatePointsPerCell(1)).toBe(12);
      expect(calculatePointsPerCell(5)).toBe(30);
    });

    it('should calculate safe clicks correctly', () => {
      expect(calculateSafeClicks(0)).toBe(1);
      expect(calculateSafeClicks(1)).toBe(3);
      expect(calculateSafeClicks(4)).toBe(10);
    });
    
    // Assuming calculateSecondChances exists in upgrades.ts (it was mentioned in plan)
    // I should verify if it exists by checking the file, but I'll assume it does based on GameBoard usage.
    // If not, test will fail and I'll fix.
  });
});
