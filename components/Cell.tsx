import { Biome } from '@/lib/game/deterministic';
import React from 'react';

interface CellProps {
  x: number;
  y: number;
  isRevealed: boolean;
  isFlagged: boolean;
  isMine: boolean;
  adjacentMines: number;
  biome: Biome;
  onReveal: (x: number, y: number) => void;
  onFlag: (x: number, y: number) => void;
  onChord: (x: number, y: number) => void;
}

export const Cell = React.memo(({ 
  x, 
  y, 
  isRevealed, 
  isFlagged, 
  isMine, 
  adjacentMines, 
  biome,
  onReveal, 
  onFlag,
  onChord
}: CellProps) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onFlag(x, y);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isRevealed) {
      onChord(x, y);
    } else {
      onReveal(x, y);
    }
  };

  // Biome-specific styles
  const getBiomeStyles = () => {
    if (isRevealed) return '';
    
    switch (biome) {
      case Biome.SAFE_HAVEN:
        return 'bg-hacker-grey hover:bg-gray-700';
      case Biome.WASTELAND:
        return 'bg-amber-900/40 hover:bg-amber-900/60 border-amber-900/30';
      case Biome.VOID:
        return 'bg-purple-900/30 hover:bg-purple-900/50 border-purple-900/30';
      case Biome.MINEFIELD:
        return 'bg-red-900/30 hover:bg-red-900/50 border-red-900/30';
      default:
        return 'bg-hacker-grey hover:bg-gray-700';
    }
  };

  const getRevealedStyles = () => {
    if (isMine) return 'bg-danger-red border-danger-red';
    
    switch (biome) {
      case Biome.SAFE_HAVEN:
        return 'bg-void border-hacker-grey';
      case Biome.WASTELAND:
        return 'bg-black border-amber-900/20 text-amber-500';
      case Biome.VOID:
        return 'bg-black border-purple-900/20 text-purple-400';
      case Biome.MINEFIELD:
        return 'bg-black border-red-900/20 text-red-500';
      default:
        return 'bg-void border-hacker-grey';
    }
  };

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`
        w-8 h-8 border flex items-center justify-center cursor-pointer select-none transition-colors duration-200
        ${isRevealed 
          ? `${getRevealedStyles()}` 
          : `${getBiomeStyles()} border-white/10`
        }
      `}
      data-testid={`cell-${x}-${y}`}
    >
      {isRevealed ? (
        isMine ? (
          <span className="text-xl animate-pulse">💣</span>
        ) : (
          adjacentMines > 0 && (
            <span className={`font-bold font-mono ${
              adjacentMines === 1 ? 'text-blue-400' :
              adjacentMines === 2 ? 'text-green-400' :
              adjacentMines === 3 ? 'text-red-400' :
              adjacentMines === 4 ? 'text-purple-400' :
              'text-yellow-400'
            }`}>
              {adjacentMines}
            </span>
          )
        )
      ) : (
        isFlagged && <span className="text-xl text-neon-green">🚩</span>
      )}
    </div>
  );
});

Cell.displayName = 'Cell';
