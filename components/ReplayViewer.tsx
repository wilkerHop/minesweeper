'use client';

import { ReplayData } from '@/app/actions/replay';
import { getAdjacentMines, getBiome, isMineAt } from '@/lib/game/deterministic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BrutalCard } from './BrutalCard';
import { Cell } from './Cell';

interface Props {
  replayData: ReplayData;
  seed: string;
  mineDensity: number;
  onClose: () => void;
}

export function ReplayViewer({ replayData, seed, mineDensity, onClose }: Props) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x speed
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle playback
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentMoveIndex(prev => {
          if (prev >= replayData.moves.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed); // Adjust interval based on speed
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, replayData.moves.length]);

  // Calculate board state based on current move index
  const cells = useMemo(() => {
    const newCells = new Map<string, { isRevealed: boolean; isFlagged: boolean }>();
    
    // Replay moves up to current index
    for (let i = 0; i <= currentMoveIndex; i++) {
      const move = replayData.moves[i];
      const key = `${move.x},${move.y}`;
      const currentState = newCells.get(key) || { isRevealed: false, isFlagged: false };

      if (move.action === 'REVEAL') {
        newCells.set(key, { ...currentState, isRevealed: true });
      } else if (move.action === 'FLAG') {
        newCells.set(key, { ...currentState, isFlagged: true });
      } else if (move.action === 'UNFLAG') {
        newCells.set(key, { ...currentState, isFlagged: false });
      }
    }
    
    return newCells;
  }, [currentMoveIndex, replayData.moves]);

  // Render visible cells (viewport logic simplified for replay - just show bounding box of moves + padding)
  // For simplicity, we'll just show a fixed viewport centered on the latest move or 0,0
  const lastMove = currentMoveIndex >= 0 ? replayData.moves[currentMoveIndex] : { x: 0, y: 0 };
  const viewportX = lastMove.x - 5;
  const viewportY = lastMove.y - 5;
  const viewportWidth = 11;
  const viewportHeight = 11;

  const renderCells = () => {
    const renderedCells = [];
    for (let dy = 0; dy < viewportHeight; dy++) {
      for (let dx = 0; dx < viewportWidth; dx++) {
        const x = viewportX + dx;
        const y = viewportY + dy;
        const key = `${x},${y}`;
        const cellState = cells.get(key) || { isRevealed: false, isFlagged: false };
        const isMine = isMineAt(x, y, seed, mineDensity);
        const adjacentMines = getAdjacentMines(x, y, seed, mineDensity);
        const biome = getBiome(x, y);

        renderedCells.push(
          <Cell
            key={key}
            x={x}
            y={y}
            isRevealed={cellState.isRevealed}
            isFlagged={cellState.isFlagged}
            isMine={isMine}
            adjacentMines={adjacentMines}
            biome={biome}
            onReveal={() => {}} // Read-only
            onFlag={() => {}} // Read-only
            onChord={() => {}} // Read-only
          />
        );
      }
    }
    return renderedCells;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <BrutalCard className="w-full max-w-4xl h-[80vh] flex flex-col relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-neon-green mb-4">REPLAY SYSTEM</h2>

        <div className="flex-1 overflow-hidden relative bg-black border border-gray-800 mb-4 flex items-center justify-center">
          <div className="grid grid-cols-[repeat(11,32px)] gap-0">
            {renderCells()}
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 border-t border-gray-800 bg-void">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-hacker-grey text-white font-mono hover:bg-gray-600"
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>

          <input
            type="range"
            min="-1"
            max={replayData.moves.length - 1}
            value={currentMoveIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentMoveIndex(parseInt(e.target.value));
            }}
            className="flex-1 accent-neon-green"
          />

          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-black border border-gray-700 text-white p-2 font-mono"
          >
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
          </select>
          
          <div className="font-mono text-sm text-gray-400">
            Move: {currentMoveIndex + 1} / {replayData.moves.length}
          </div>
        </div>
      </BrutalCard>
    </div>
  );
}
