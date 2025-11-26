'use client';

import {
    createGameSession,
    endGameSession,
    recordCellModification,
    updateGameScore,
} from '@/app/actions/game';
import {
    createMockGameSession,
    endMockGameSession,
    recordMockCellModification,
    updateMockGameScore,
} from '@/app/actions/mock';
import {
    getAdjacentMines,
    getBiome,
    getFloodFillCells,
    isMineAt,
} from '@/lib/game/deterministic';
import { CellAction, GameStatus, PlayerProgress, UpgradeLevels } from '@/lib/game/types';
import {
    calculateMineDensity,
    calculatePointsPerCell,
    calculatePointsPerFlag,
    calculateSafeClicks,
    calculateSecondChances,
    UPGRADES,
} from '@/lib/game/upgrades';
import {
    addCoins,
    loadProgress,
    purchaseUpgrade,
    updateGameStats
} from '@/lib/services/progressStorage';
import { useCallback, useEffect, useState } from 'react';
import { BrutalCard } from './BrutalCard';
import { Cell } from './Cell';
import { GameOverModal } from './GameOverModal';
import { GameTimer } from './GameTimer';
import { Leaderboard } from './Leaderboard';
import { UpgradeShop } from './UpgradeShop';

// Use mock mode if environment variables aren't configured
const USE_MOCK = typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://');

interface CellState {
  isRevealed: boolean;
  isFlagged: boolean;
}

export function GameBoard() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seed, setSeed] = useState<string>('');
  const [mineDensity, setMineDensity] = useState<number>(0.15);
  const [cells, setCells] = useState<Map<string, CellState>>(new Map());
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.ACTIVE);
  const [viewportX, setViewportX] = useState(-5);
  const [viewportY, setViewportY] = useState(-5);
  const [isLoading, setIsLoading] = useState(true);

  // Progression system state
  const [progress, setProgress] = useState<PlayerProgress>(loadProgress());
  const [showGameOver, setShowGameOver] = useState(false);
  const [showUpgradeShop, setShowUpgradeShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [safeClicksRemaining, setSafeClicksRemaining] = useState(1);
  const [secondChancesRemaining, setSecondChancesRemaining] = useState(0);

  const VIEWPORT_WIDTH = 20;
  const VIEWPORT_HEIGHT = 15;

  // Initialize game with upgrades
  useEffect(() => {
    async function initGame() {
      try {
        // Load progress and apply upgrades
        const currentProgress = loadProgress();
        setProgress(currentProgress);
        
        const session = USE_MOCK 
          ? await createMockGameSession()
          : await createGameSession();
        setSessionId(session.sessionId);
        setSeed(session.seed);
        
        // Apply upgrade effects
        const effectiveDensity = calculateMineDensity(currentProgress.upgrades.mineDensityReduction);
        setMineDensity(effectiveDensity);
        
        const safeClicks = calculateSafeClicks(currentProgress.upgrades.safeZone);
        setSafeClicksRemaining(safeClicks);
        
        const secondChances = calculateSecondChances(currentProgress.upgrades.secondChance);
        setSecondChancesRemaining(secondChances);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        // Fallback to mock mode if real initialization fails
        const session = await createMockGameSession();
        setSessionId(session.sessionId);
        setSeed(session.seed);
        setMineDensity(0.15);
        setIsLoading(false);
      }
    }
    initGame();
  }, []);

  const [clickCount, setClickCount] = useState(0);

  const revealCell = useCallback(
    async (x: number, y: number) => {
      if (gameStatus !== GameStatus.ACTIVE || !sessionId || !seed) return;

      const getCellKey = (cx: number, cy: number) => `${cx},${cy}`;
      const cellKey = getCellKey(x, y);
      const cellState = cells.get(cellKey) || { isRevealed: false, isFlagged: false };
      
      if (cellState.isRevealed || cellState.isFlagged) return;

      let currentSeed = seed;

      // Safe Zone Logic (upgraded first click safe)
      if (clickCount < safeClicksRemaining) {
        let attempts = 0;
        // Ensure safe clicks don't hit mines
        while (isMineAt(x, y, currentSeed, mineDensity) && attempts < 100) {
          currentSeed = `${currentSeed}-safe-${clickCount}`;
          attempts++;
        }
        if (currentSeed !== seed) {
          setSeed(currentSeed);
        }
      }
      setClickCount(prev => prev + 1);

      const isMine = isMineAt(x, y, currentSeed, mineDensity);

      // Record the cell modification
      if (USE_MOCK) {
        await recordMockCellModification();
      } else {
        await recordCellModification(sessionId, x, y, CellAction.REVEAL);
      }

      if (isMine) {
        // Check for second chance
        if (secondChancesRemaining > 0) {
          setSecondChancesRemaining(prev => prev - 1);
          // Show visual feedback but don't end game
          setCells((prev) => {
            const next = new Map(prev);
            next.set(cellKey, { ...cellState, isRevealed: true });
            return next;
          });
          return;
        }
        
        // Game over - Reveal all mines in viewport
        setCells((prev) => {
          const next = new Map(prev);
          
          // Reveal the clicked mine
          next.set(cellKey, { ...cellState, isRevealed: true });

          // Reveal all other mines in the current viewport
          for (let row = 0; row < VIEWPORT_HEIGHT; row++) {
            for (let col = 0; col < VIEWPORT_WIDTH; col++) {
              const vx = viewportX + col;
              const vy = viewportY + row;
              if (isMineAt(vx, vy, currentSeed, mineDensity)) {
                const vKey = getCellKey(vx, vy);
                const vState = prev.get(vKey) || { isRevealed: false, isFlagged: false };
                next.set(vKey, { ...vState, isRevealed: true });
              }
            }
          }
          return next;
        });
        setGameStatus(GameStatus.LOST);
        
        // Calculate coins and update stats
        const coins = Math.floor(score / 10);
        setCoinsEarned(coins);
        const updatedProgress = updateGameStats(score);
        addCoins(coins);
        setProgress(updatedProgress);
        
        if (USE_MOCK) {
          await endMockGameSession();
        } else {
          await endGameSession(sessionId, score, GameStatus.LOST);
        }
        
        // Show game over modal
        setShowGameOver(true);
        return;
      }

      // Flood fill if no adjacent mines
      const adjacentMines = getAdjacentMines(x, y, currentSeed, mineDensity);
      let cellsToReveal: [number, number][] = [[x, y]];

      if (adjacentMines === 0) {
        cellsToReveal = getFloodFillCells(x, y, currentSeed, mineDensity);
      }

      setCells((prev) => {
        const next = new Map(prev);
        cellsToReveal.forEach(([cx, cy]) => {
          const key = getCellKey(cx, cy);
          const state = prev.get(key) || { isRevealed: false, isFlagged: false };
          if (!state.isRevealed) {
            next.set(key, { ...state, isRevealed: true });
          }
        });
        return next;
      });

      // Update score with multiplier
      const pointsPerCell = calculatePointsPerCell(progress.upgrades.scoreMultiplier);
      const newScore = score + cellsToReveal.length * pointsPerCell;
      setScore(newScore);
      
      // No win condition in infinite mode - game continues until mine is hit
      if (USE_MOCK) {
        await updateMockGameScore();
      } else {
        await updateGameScore(sessionId, newScore);
      }
    },
    [gameStatus, sessionId, seed, mineDensity, score, cells, clickCount, safeClicksRemaining, viewportX, viewportY, secondChancesRemaining, progress]
  );

  const chordReveal = useCallback(
    async (x: number, y: number) => {
      if (gameStatus !== GameStatus.ACTIVE || !sessionId || !seed) return;

      const adjacentMines = getAdjacentMines(x, y, seed, mineDensity);
      let flagCount = 0;
      const neighbors: [number, number][] = [];

      // Count flags and collect neighbors
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          neighbors.push([nx, ny]);
          
          const getCellKey = (cx: number, cy: number) => `${cx},${cy}`;
          const state = cells.get(getCellKey(nx, ny));
          if (state?.isFlagged) {
            flagCount++;
          }
        }
      }

      // If flags match mines, reveal neighbors
      if (flagCount === adjacentMines) {
        for (const [nx, ny] of neighbors) {
          const getCellKey = (cx: number, cy: number) => `${cx},${cy}`;
          const state = cells.get(getCellKey(nx, ny));
          if (!state?.isRevealed && !state?.isFlagged) {
            await revealCell(nx, ny);
          }
        }
      }
    },
    [gameStatus, sessionId, seed, mineDensity, cells, revealCell]
  );

  const toggleFlag = useCallback(
    async (x: number, y: number) => {
      if (gameStatus !== GameStatus.ACTIVE || !sessionId) return;

      const getCellKey = (cx: number, cy: number) => `${cx},${cy}`;
      const cellKey = getCellKey(x, y);
      const cellState = cells.get(cellKey) || { isRevealed: false, isFlagged: false };
      
      if (cellState.isRevealed) return;

      const action = cellState.isFlagged ? CellAction.UNFLAG : CellAction.FLAG;
      if (USE_MOCK) {
        await recordMockCellModification();
      } else {
        await recordCellModification(sessionId, x, y, action);
      }

      setCells((prev) => {
        const next = new Map(prev);
        next.set(cellKey, {
          ...cellState,
          isFlagged: !cellState.isFlagged,
        });
        return next;
      });

      // Update score for correct flags with bonus
      if (!cellState.isFlagged) {
        const isMine = isMineAt(x, y, seed, mineDensity);
        if (isMine) {
          const pointsPerFlag = calculatePointsPerFlag(progress.upgrades.flagBonus);
          const newScore = score + pointsPerFlag;
          setScore(newScore);
          if (USE_MOCK) {
            await updateMockGameScore();
          } else {
            await updateGameScore(sessionId, newScore);
          }
        }
      }
    },
    [gameStatus, sessionId, seed, mineDensity, score, cells, progress]
  );

  const resetGame = useCallback(async () => {
    const currentProgress = loadProgress();
    
    const session = USE_MOCK
      ? await createMockGameSession()
      : await createGameSession();
    setSessionId(session.sessionId);
    setSeed(session.seed);
    
    // Reapply upgrades
    const effectiveDensity = calculateMineDensity(currentProgress.upgrades.mineDensityReduction);
    setMineDensity(effectiveDensity);
    
    const safeClicks = calculateSafeClicks(currentProgress.upgrades.safeZone);
    setSafeClicksRemaining(safeClicks);
    
    const secondChances = calculateSecondChances(currentProgress.upgrades.secondChance);
    setSecondChancesRemaining(secondChances);
    
    setCells(new Map());
    setScore(0);
    setGameStatus(GameStatus.ACTIVE);
    setViewportX(-5);
    setViewportY(-5);
    setClickCount(0);
    setShowGameOver(false);
    setShowUpgradeShop(false);
  }, []);

  // Handle game over modal continue
  const handleContinueToShop = () => {
    setShowGameOver(false);
    setShowUpgradeShop(true);
  };

  // Handle upgrade purchase
  const handlePurchaseUpgrade = (upgradeId: keyof UpgradeLevels) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    const currentLevel = progress.upgrades[upgradeId];
    if (currentLevel >= upgrade.maxLevel) return;
    
    const cost = upgrade.costs[currentLevel];
    const updatedProgress = purchaseUpgrade(upgradeId, cost);
    
    if (updatedProgress) {
      setProgress(updatedProgress);
    }
  };

  // Handle closing upgrade shop and starting new game
  const handleCloseShop = () => {
    setShowUpgradeShop(false);
    resetGame();
  };

  // Calculate total mines in viewport (approximate for infinite grid)
  const totalMinesInViewport = Math.floor(VIEWPORT_WIDTH * VIEWPORT_HEIGHT * mineDensity);
  
  // Count flagged cells in current viewport
  const flaggedInViewport = Array.from(cells.entries()).filter(([key, state]) => {
    if (!state.isFlagged) return false;
    const [cx, cy] = key.split(',').map(Number);
    return (
      cx >= viewportX && 
      cx < viewportX + VIEWPORT_WIDTH && 
      cy >= viewportY && 
      cy < viewportY + VIEWPORT_HEIGHT
    );
  }).length;

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent scrolling with arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setViewportY(y => y - 1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setViewportY(y => y + 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setViewportX(x => x - 1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setViewportX(x => x + 1);
          break;
        case 'r':
        case 'R':
          resetGame();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [resetGame]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-mono text-foreground selection:bg-neon-green selection:text-void">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Header / Stats Row */}
        <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BrutalCard title="COINS" icon="🪙" className="border-neon-green">
            <div className="text-3xl font-bold text-neon-green">{progress.totalCoins}</div>
            <div className="text-xs text-neon-green/80 mt-1 uppercase tracking-wider">Total Earnings</div>
          </BrutalCard>
          
          <BrutalCard title="SCORE" icon="⭐">
            <div className="text-3xl font-bold text-white">{score}</div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Current Run</div>
          </BrutalCard>
          
          <BrutalCard title="MINES" icon="💣">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-danger-red">{totalMinesInViewport - flaggedInViewport}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">/ {totalMinesInViewport} DETECTED</span>
            </div>
          </BrutalCard>

          <BrutalCard title="TIME" icon="⏱️">
             <GameTimer key={sessionId || 'initial'} gameStatus={gameStatus} />
          </BrutalCard>
        </div>

        {/* Main Game Area */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <BrutalCard className="flex-1 min-h-[600px] relative overflow-hidden bg-void border-white">
            {/* Game Status Overlay */}
            {gameStatus !== GameStatus.ACTIVE && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className={`text-5xl font-bold font-mono uppercase tracking-widest ${
                  gameStatus === GameStatus.WON ? 'text-neon-green animate-pulse' : 'text-danger-red animate-glitch'
                }`}>
                  {gameStatus === GameStatus.WON ? '>> MISSION COMPLETE <<' : '>> SYSTEM FAILURE <<'}
                </div>
              </div>
            )}

            {/* Viewport Controls Overlay */}
            <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 bg-black border-2 border-white p-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <button onClick={() => setViewportY(viewportY - 5)} className="p-3 hover:bg-hacker-grey text-white transition-colors border border-white/20">↑</button>
              <div className="flex gap-2">
                <button onClick={() => setViewportX(viewportX - 5)} className="p-3 hover:bg-hacker-grey text-white transition-colors border border-white/20">←</button>
                <button onClick={() => setViewportY(viewportY + 5)} className="p-3 hover:bg-hacker-grey text-white transition-colors border border-white/20">↓</button>
                <button onClick={() => setViewportX(viewportX + 5)} className="p-3 hover:bg-hacker-grey text-white transition-colors border border-white/20">→</button>
              </div>
            </div>

            {/* The Grid */}
            <div className="w-full h-full overflow-auto flex items-center justify-center bg-void">
               <div
                className="inline-grid gap-[1px] bg-hacker-grey border-2 border-white shadow-[8px_8px_0px_0px_rgba(255,0,0,0.5)]"
                style={{
                  gridTemplateColumns: `repeat(${VIEWPORT_WIDTH}, minmax(0, 1fr))`,
                }}
                data-testid="game-board"
              >
                {Array.from({ length: VIEWPORT_HEIGHT }, (_, row) =>
                  Array.from({ length: VIEWPORT_WIDTH }, (_, col) => {
                    const x = viewportX + col;
                    const y = viewportY + row;
                    const getCellKey = (cx: number, cy: number) => `${cx},${cy}`;
                    const cellState = cells.get(getCellKey(x, y)) || { isRevealed: false, isFlagged: false };
                    const isMine = isMineAt(x, y, seed, mineDensity);
                    const adjacentMines = getAdjacentMines(x, y, seed, mineDensity);
                    const biome = getBiome(x, y);

                    return (
                      <Cell
                        key={getCellKey(x, y)}
                        x={x}
                        y={y}
                        isRevealed={cellState.isRevealed}
                        isFlagged={cellState.isFlagged}
                        isMine={isMine}
                        adjacentMines={adjacentMines}
                        biome={biome}
                        onReveal={revealCell}
                        onFlag={toggleFlag}
                        onChord={chordReveal}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </BrutalCard>
        </div>

        {/* Sidebar / Controls */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <BrutalCard title="ACTIONS" icon="⚡">
             <div className="flex flex-col gap-3">
               <button
                onClick={resetGame}
                className="w-full py-4 bg-white text-black border-2 border-black font-bold hover:bg-neon-green hover:border-transparent transition-all active:translate-x-1 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 uppercase tracking-widest"
                data-testid="reset-button"
              >
                <span>🔄</span> REBOOT
              </button>
              
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-full py-3 bg-hacker-grey text-white font-bold hover:bg-white hover:text-black transition-colors uppercase tracking-widest border border-white/20 text-xs"
              >
                🏆 VIEW RANKINGS
              </button>
             </div>
          </BrutalCard>

          <BrutalCard title="UPGRADES" icon="🛒" className="flex-1">
             <div className="space-y-4">
                <div className="p-4 bg-hacker-grey border-2 border-white/20">
                    <div className="text-xs text-neon-green mb-2 uppercase tracking-widest border-b border-neon-green/30 pb-1">Active Modules</div>
                    <div className="flex flex-wrap gap-2">
                        {secondChancesRemaining > 0 && (
                             <span className="px-2 py-1 bg-black text-neon-green text-xs font-bold border border-neon-green flex items-center gap-1 uppercase">
                                💚 {secondChancesRemaining} LIVES
                             </span>
                        )}
                        {safeClicksRemaining > 0 && (
                            <span className="px-2 py-1 bg-black text-white text-xs font-bold border border-white flex items-center gap-1 uppercase">
                                🛡️ {safeClicksRemaining} SAFE
                            </span>
                        )}
                    </div>
                </div>
                
                <button 
                    onClick={() => setShowUpgradeShop(true)}
                    className="w-full py-3 bg-black border-2 border-neon-green text-neon-green font-bold hover:bg-neon-green hover:text-black transition-all uppercase tracking-widest"
                >
                    ACCESS SHOP
                </button>
             </div>
          </BrutalCard>
          
          <BrutalCard className="bg-black text-white border-white">
             <div className="text-xs text-neon-green uppercase tracking-widest font-bold mb-2 border-b border-neon-green pb-1">TERMINAL COMMANDS</div>
             <div className="space-y-2 text-xs font-mono text-gray-300">
                <div className="flex justify-between"><span>NAVIGATE</span> <span className="bg-hacker-grey px-1 text-white">WASD</span></div>
                <div className="flex justify-between"><span>REBOOT</span> <span className="bg-hacker-grey px-1 text-white">R</span></div>
                <div className="flex justify-between"><span>FLAG</span> <span className="bg-hacker-grey px-1 text-white">R-CLICK</span></div>
             </div>
          </BrutalCard>
        </div>
      </div>

      {showGameOver && (
        <GameOverModal
          finalScore={score}
          coinsEarned={coinsEarned}
          onContinue={handleContinueToShop}
        />
      )}
      
      {showUpgradeShop && (
        <UpgradeShop
          progress={progress}
          onPurchase={handlePurchaseUpgrade}
          onClose={handleCloseShop}
        />
      )}
      
      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}
