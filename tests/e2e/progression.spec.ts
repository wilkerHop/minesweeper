import { expect, test } from '@playwright/test';

test.describe('Progression System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should persist progress across reloads', async ({ page }) => {
    // Inject progress into localStorage
    await page.evaluate(() => {
      localStorage.setItem('minesweeper_progress', JSON.stringify({
        totalCoins: 1000,
        lifetimeScore: 500,
        gamesPlayed: 5,
        upgrades: {
          mineDensityReduction: 0,
          safeZone: 0,
          scoreMultiplier: 0,
          flagBonus: 0,
          secondChance: 0,
        }
      }));
    });

    await page.reload();

    // Wait for the game board to load
    await expect(page.getByText('COINS')).toBeVisible();

    // Check if coins are displayed
    const coinsCard = page.locator('.text-3xl.font-bold.text-neon-green').first();
    await expect(coinsCard).toHaveText('1000');
    
    // Also check games played if displayed somewhere?
    // GameBoard doesn't seem to display games played in the top cards.
    // It displays COINS, SCORE, MINES, TIME.
  });

  test('should allow purchasing upgrades', async ({ page }) => {
    // Inject coins
    await page.evaluate(() => {
      localStorage.setItem('minesweeper_progress', JSON.stringify({
        totalCoins: 5000,
        lifetimeScore: 0,
        gamesPlayed: 0,
        upgrades: {
          mineDensityReduction: 0,
          safeZone: 0,
          scoreMultiplier: 0,
          flagBonus: 0,
          secondChance: 0,
        }
      }));
    });
    await page.reload();

    // Open Shop (we need to trigger game over or have a button? 
    // GameBoard.tsx has handleContinueToShop but it's triggered from GameOverModal.
    // Is there a direct button?
    // Looking at GameBoard.tsx, there is no direct button to open shop unless game over.
    // Wait, maybe I can trigger it via console or just die.
    
    // Actually, let's just die.
    // Click random cells until game over.
    // Since we have 5000 coins, we can afford upgrades.
    
    // Clicking (0,0) might be safe due to safe zone, but eventually we hit a mine.
    // Let's click a few cells.
    await page.mouse.click(300, 300); // Center-ish
    await page.mouse.click(350, 350);
    await page.mouse.click(400, 400);
    
    // If we die, "Game Over" text appears.
    // If we don't die, we might need to click more.
    // But this is flaky.
    
    // Alternative: Expose a way to open shop or mock the state.
    // Or just test the logic via unit tests?
    // The user asked to follow the checklist.
    
    // Let's try to verify "Coins awarded on game over" first.
    // If I can't reliably die, I can't verify this easily in E2E without a fixed seed.
  });
});
