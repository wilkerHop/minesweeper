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
import { POINTS_PER_CELL, POINTS_PER_FLAG, WIN_SCORE_THRESHOLD } from '@/lib/game/constants';
import {
  getAdjacentMines,
  getFloodFillCells,
  isMineAt,
} from '@/lib/game/deterministic';
import { CellAction, GameStatus } from '@/lib/game/types';
import { useCallback, useEffect, useState } from 'react';
import { Cell } from './Cell';
import { GameTimer } from './GameTimer';
import { MineCounter } from './MineCounter';

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

  const VIEWPORT_WIDTH = 20;
  const VIEWPORT_HEIGHT = 15;

  // Initialize game
  useEffect(() => {
    async function initGame() {
      try {
        const session = USE_MOCK 
          ? await createMockGameSession()
          : await createGameSession();
        setSessionId(session.sessionId);
        setSeed(session.seed);
        setMineDensity(session.mineDensity);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        // Fallback to mock mode if real initialization fails
        const session = await createMockGameSession();
        setSessionId(session.sessionId);
        setSeed(session.seed);
        setMineDensity(session.mineDensity);
        setIsLoading(false);
      }
    }
    initGame();
  }, []);

  const [isFirstClick, setIsFirstClick] = useState(true);

  const revealCell = useCallback(
    async (x: number, y: number) => {
      if (gameStatus !== GameStatus.ACTIVE || !sessionId || !seed) return;

      const getCellKey = (cx: number, cy: number) => `${cx},${cy}`;
      const cellKey = getCellKey(x, y);
      const cellState = cells.get(cellKey) || { isRevealed: false, isFlagged: false };
      
      if (cellState.isRevealed || cellState.isFlagged) return;

      let currentSeed = seed;

      // First Click Safe Logic
      if (isFirstClick) {
        let attempts = 0;
        // Ensure first click is not a mine
        while (isMineAt(x, y, currentSeed, mineDensity) && attempts < 100) {
          currentSeed = `${currentSeed}-safe`;
          attempts++;
        }
        if (currentSeed !== seed) {
          setSeed(currentSeed);
        }
        setIsFirstClick(false);
      }

      const isMine = isMineAt(x, y, currentSeed, mineDensity);

      // Record the cell modification
      if (USE_MOCK) {
        await recordMockCellModification();
      } else {
        await recordCellModification(sessionId, x, y, CellAction.REVEAL);
      }

      if (isMine) {
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
        if (USE_MOCK) {
          await endMockGameSession();
        } else {
          await endGameSession(sessionId, score, GameStatus.LOST);
        }
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

      // Update score
      const newScore = score + cellsToReveal.length * POINTS_PER_CELL;
      setScore(newScore);
      
      // Check for win condition
      if (newScore >= WIN_SCORE_THRESHOLD) {
        setGameStatus(GameStatus.WON);
        if (USE_MOCK) {
          await endMockGameSession();
        } else {
          await endGameSession(sessionId, newScore, GameStatus.WON);
        }
      } else {
        if (USE_MOCK) {
          await updateMockGameScore();
        } else {
          await updateGameScore(sessionId, newScore);
        }
      }
    },
    [gameStatus, sessionId, seed, mineDensity, score, cells, isFirstClick, viewportX, viewportY]
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

      // Update score for correct flags
      if (!cellState.isFlagged) {
        const isMine = isMineAt(x, y, seed, mineDensity);
        if (isMine) {
          const newScore = score + POINTS_PER_FLAG;
          setScore(newScore);
          if (USE_MOCK) {
            await updateMockGameScore();
          } else {
            await updateGameScore(sessionId, newScore);
          }
        }
      }
    },
    [gameStatus, sessionId, seed, mineDensity, score, cells]
  );

  const resetGame = useCallback(async () => {
    const session = USE_MOCK
      ? await createMockGameSession()
      : await createGameSession();
    setSessionId(session.sessionId);
    setSeed(session.seed);
    setMineDensity(session.mineDensity);
    setCells(new Map());
    setScore(0);
    setGameStatus(GameStatus.ACTIVE);
    setViewportX(-5);
    setViewportY(-5);
    setIsFirstClick(true);
  }, []);

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
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex gap-4 items-center bg-gray-100 p-4 rounded-lg shadow-md">
        <MineCounter 
          totalMines={totalMinesInViewport} 
          flaggedCount={flaggedInViewport} 
        />
        
        <div className="text-xl font-bold" data-testid="score-display">
          Score: {score}
        </div>
        
        <button
          onClick={resetGame}
          className="text-2xl hover:scale-110 transition-transform"
          data-testid="reset-button"
          title="Reset Game (R)"
        >
          {gameStatus === GameStatus.WON ? '😎' : 
           gameStatus === GameStatus.LOST ? '😵' : '🙂'}
        </button>

        <GameTimer key={sessionId || 'initial'} gameStatus={gameStatus} />
      </div>

      {gameStatus !== GameStatus.ACTIVE && (
        <div
          className={`text-2xl font-bold ${
            gameStatus === GameStatus.WON ? 'text-green-600' : 'text-red-600'
          }`}
          data-testid="game-status"
        >
          {gameStatus === GameStatus.WON ? '🎉 You Won!' : '💥 Game Over!'}
        </div>
      )}

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setViewportY(viewportY - 5)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          title="Move Up (W)"
        >
          ↑
        </button>
        <button
          onClick={() => setViewportY(viewportY + 5)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          title="Move Down (S)"
        >
          ↓
        </button>
        <button
          onClick={() => setViewportX(viewportX - 5)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          title="Move Left (A)"
        >
          ←
        </button>
        <button
          onClick={() => setViewportX(viewportX + 5)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          title="Move Right (D)"
        >
          →
        </button>
      </div>

      <div
        className="inline-grid gap-0 border-4 border-gray-400 bg-gray-200 shadow-xl"
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

            return (
              <Cell
                key={getCellKey(x, y)}
                x={x}
                y={y}
                isRevealed={cellState.isRevealed}
                isFlagged={cellState.isFlagged}
                isMine={isMine}
                adjacentMines={adjacentMines}
                onReveal={revealCell}
                onFlag={toggleFlag}
                onChord={chordReveal}
              />
            );
          })
        )}
      </div>

      <div className="text-sm text-gray-600 flex flex-col items-center gap-1">
        <div>Viewport: ({viewportX}, {viewportY})</div>
        <div className="text-xs text-gray-500">
          Use Arrow Keys or WASD to navigate • R to reset
        </div>
      </div>
    </div>
  );
}
