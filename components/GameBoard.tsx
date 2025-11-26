'use client';

import {
    createGameSession,
    endGameSession,
    recordCellModification,
    updateGameScore,
} from '@/app/actions/game';
import { POINTS_PER_CELL, POINTS_PER_FLAG } from '@/lib/game/constants';
import {
    getAdjacentMines,
    getFloodFillCells,
    isMineAt,
} from '@/lib/game/deterministic';
import { CellAction, GameStatus } from '@/lib/game/types';
import { useCallback, useEffect, useState } from 'react';
import { Cell } from './Cell';

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
        const session = await createGameSession();
        setSessionId(session.sessionId);
        setSeed(session.seed);
        setMineDensity(session.mineDensity);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    }
    initGame();
  }, []);

  const getCellKey = (x: number, y: number) => `${x},${y}`;

  const getCellState = (x: number, y: number): CellState => {
    const key = getCellKey(x, y);
    return cells.get(key) || { isRevealed: false, isFlagged: false };
  };

  const revealCell = useCallback(
    async (x: number, y: number) => {
      if (gameStatus !== GameStatus.ACTIVE || !sessionId || !seed) return;

      const cellState = getCellState(x, y);
      if (cellState.isRevealed || cellState.isFlagged) return;

      const isMine = isMineAt(x, y, seed, mineDensity);

      // Record the cell modification
      await recordCellModification(sessionId, x, y, CellAction.REVEAL);

      if (isMine) {
        // Game over
        setCells((prev) => {
          const next = new Map(prev);
          next.set(getCellKey(x, y), { ...cellState, isRevealed: true });
          return next;
        });
        setGameStatus(GameStatus.LOST);
        await endGameSession(sessionId, score, GameStatus.LOST);
        return;
      }

      // Flood fill if no adjacent mines
      const adjacentMines = getAdjacentMines(x, y, seed, mineDensity);
      let cellsToReveal: [number, number][] = [[x, y]];

      if (adjacentMines === 0) {
        cellsToReveal = getFloodFillCells(x, y, seed, mineDensity);
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
      await updateGameScore(sessionId, newScore);
    },
    [gameStatus, sessionId, seed, mineDensity, score, cells]
  );

  const toggleFlag = useCallback(
    async (x: number, y: number) => {
      if (gameStatus !== GameStatus.ACTIVE || !sessionId) return;

      const cellState = getCellState(x, y);
      if (cellState.isRevealed) return;

      const action = cellState.isFlagged ? CellAction.UNFLAG : CellAction.FLAG;
      await recordCellModification(sessionId, x, y, action);

      setCells((prev) => {
        const next = new Map(prev);
        next.set(getCellKey(x, y), {
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
          await updateGameScore(sessionId, newScore);
        }
      }
    },
    [gameStatus, sessionId, seed, mineDensity, score, cells]
  );

  const resetGame = async () => {
    const session = await createGameSession();
    setSessionId(session.sessionId);
    setSeed(session.seed);
    setMineDensity(session.mineDensity);
    setCells(new Map());
    setScore(0);
    setGameStatus(GameStatus.ACTIVE);
    setViewportX(-5);
    setViewportY(-5);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex gap-4 items-center">
        <div className="text-xl font-bold" data-testid="score-display">
          Score: {score}
        </div>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          data-testid="reset-button"
        >
          New Game
        </button>
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
          className="px-3 py-1 bg-gray-200 rounded"
        >
          ↑
        </button>
        <button
          onClick={() => setViewportY(viewportY + 5)}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          ↓
        </button>
        <button
          onClick={() => setViewportX(viewportX - 5)}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          ←
        </button>
        <button
          onClick={() => setViewportX(viewportX + 5)}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          →
        </button>
      </div>

      <div
        className="inline-grid gap-0 border-2 border-gray-800"
        style={{
          gridTemplateColumns: `repeat(${VIEWPORT_WIDTH}, minmax(0, 1fr))`,
        }}
        data-testid="game-board"
      >
        {Array.from({ length: VIEWPORT_HEIGHT }, (_, row) =>
          Array.from({ length: VIEWPORT_WIDTH }, (_, col) => {
            const x = viewportX + col;
            const y = viewportY + row;
            const cellState = getCellState(x, y);
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
              />
            );
          })
        )}
      </div>

      <div className="text-sm text-gray-600">
        Viewport: ({viewportX}, {viewportY}) | Use arrow buttons to navigate the
        infinite grid
      </div>
    </div>
  );
}
