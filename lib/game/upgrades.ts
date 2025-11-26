import { PlayerProgress, UpgradeDefinition } from './types';

export const UPGRADES: UpgradeDefinition[] = [
  {
    id: 'mineDensityReduction',
    name: 'Mine Density Reduction',
    description: 'Reduce the probability of mines spawning',
    icon: '💣',
    maxLevel: 5,
    costs: [100, 250, 500, 1000, 2000],
    effects: ['14% mines', '13% mines', '12% mines', '11% mines', '10% mines'],
  },
  {
    id: 'safeZone',
    name: 'Safe Zone',
    description: 'Guarantee your first N clicks are safe',
    icon: '🛡️',
    maxLevel: 4,
    costs: [200, 500, 1000, 2500],
    effects: ['3 safe clicks', '5 safe clicks', '7 safe clicks', '10 safe clicks'],
  },
  {
    id: 'scoreMultiplier',
    name: 'Score Multiplier',
    description: 'Increase points earned per cell revealed',
    icon: '⭐',
    maxLevel: 5,
    costs: [150, 400, 800, 1500, 3000],
    effects: ['12 pts/cell', '15 pts/cell', '20 pts/cell', '25 pts/cell', '30 pts/cell'],
  },
  {
    id: 'flagBonus',
    name: 'Flag Bonus',
    description: 'Increase points for correctly flagging mines',
    icon: '🚩',
    maxLevel: 3,
    costs: [300, 700, 1500],
    effects: ['75 pts/flag', '100 pts/flag', '150 pts/flag'],
  },
  {
    id: 'secondChance',
    name: 'Second Chance',
    description: 'Survive hitting a mine (once per game)',
    icon: '💚',
    maxLevel: 2,
    costs: [5000, 15000],
    effects: ['1 life', '2 lives'],
  },
];

/**
 * Calculate effective mine density based on upgrade level
 */
export function calculateMineDensity(upgradeLevel: number): number {
  return Math.max(0.10, 0.15 - (upgradeLevel * 0.01));
}

/**
 * Calculate points per cell based on upgrade level
 */
export function calculatePointsPerCell(upgradeLevel: number): number {
  const multipliers = [10, 12, 15, 20, 25, 30];
  return multipliers[upgradeLevel] || 10;
}

/**
 * Calculate points per flag based on upgrade level
 */
export function calculatePointsPerFlag(upgradeLevel: number): number {
  const bonuses = [50, 75, 100, 150];
  return bonuses[upgradeLevel] || 50;
}

/**
 * Calculate number of safe clicks based on upgrade level
 */
export function calculateSafeClicks(upgradeLevel: number): number {
  const safeClicks = [1, 3, 5, 7, 10];
  return safeClicks[upgradeLevel] || 1;
}

/**
 * Calculate number of second chances based on upgrade level
 */
export function calculateSecondChances(upgradeLevel: number): number {
  return upgradeLevel;
}

/**
 * Get default player progress
 */
export function getDefaultProgress(): PlayerProgress {
  return {
    totalCoins: 0,
    lifetimeScore: 0,
    gamesPlayed: 0,
    upgrades: {
      mineDensityReduction: 0,
      safeZone: 0,
      scoreMultiplier: 0,
      flagBonus: 0,
      secondChance: 0,
    },
  };
}
