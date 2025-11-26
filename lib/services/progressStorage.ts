import { PlayerProgress, UpgradeLevels } from '../game/types';
import { getDefaultProgress } from '../game/upgrades';

const STORAGE_KEY = 'minesweeper_progress';

/**
 * Load player progress from localStorage
 */
export function loadProgress(): PlayerProgress {
  if (typeof window === 'undefined') return getDefaultProgress();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultProgress();
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load progress:', error);
    return getDefaultProgress();
  }
}

/**
 * Save player progress to localStorage
 */
export function saveProgress(progress: PlayerProgress): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

/**
 * Add coins to player's total
 */
export function addCoins(amount: number): PlayerProgress {
  const progress = loadProgress();
  progress.totalCoins += amount;
  saveProgress(progress);
  return progress;
}

/**
 * Update game statistics
 */
export function updateGameStats(score: number): PlayerProgress {
  const progress = loadProgress();
  progress.gamesPlayed++;
  if (score > progress.lifetimeScore) {
    progress.lifetimeScore = score;
  }
  saveProgress(progress);
  return progress;
}

/**
 * Purchase an upgrade
 * Returns updated progress if successful, null if insufficient coins
 */
export function purchaseUpgrade(
  upgradeId: keyof UpgradeLevels,
  cost: number
): PlayerProgress | null {
  const progress = loadProgress();
  
  if (progress.totalCoins < cost) {
    return null;
  }
  
  progress.totalCoins -= cost;
  progress.upgrades[upgradeId]++;
  saveProgress(progress);
  return progress;
}

/**
 * Reset all progress (for testing or prestige system)
 */
export function resetProgress(): PlayerProgress {
  const progress = getDefaultProgress();
  saveProgress(progress);
  return progress;
}
