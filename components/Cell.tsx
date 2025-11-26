'use client';

import React from 'react';

interface CellProps {
  x: number;
  y: number;
  isRevealed: boolean;
  isFlagged: boolean;
  isMine: boolean;
  adjacentMines: number;
  onReveal: (x: number, y: number) => void;
  onFlag: (x: number, y: number) => void;
  onChord: (x: number, y: number) => void;
}

export function Cell({
  x,
  y,
  isRevealed,
  isFlagged,
  isMine,
  adjacentMines,
  onReveal,
  onFlag,
  onChord,
}: CellProps) {
  const handleClick = () => {
    if (isRevealed && adjacentMines > 0) {
      onChord(x, y);
      return;
    }
    if (!isRevealed && !isFlagged) {
      onReveal(x, y);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isRevealed) {
      onFlag(x, y);
    }
  };

  const getCellContent = () => {
    if (!isRevealed) {
      return isFlagged ? '🚩' : '';
    }
    if (isMine) {
      return '💣';
    }
    return adjacentMines > 0 ? adjacentMines : '';
  };

  const getCellColor = () => {
    if (!isRevealed) return 'bg-gray-400 hover:bg-gray-300';
    if (isMine) return 'bg-red-500';
    return 'bg-gray-100';
  };

  const getNumberColor = () => {
    const colors: Record<number, string> = {
      1: 'text-blue-600',
      2: 'text-green-600',
      3: 'text-red-600',
      4: 'text-purple-600',
      5: 'text-orange-600',
      6: 'text-cyan-600',
      7: 'text-black',
      8: 'text-gray-600',
    };
    return colors[adjacentMines] || '';
  };

  return (
    <button
      onClick={handleClick}
      onContextMenu={handleRightClick}
      className={`
        w-8 h-8 border border-gray-600 
        font-bold text-sm
        flex items-center justify-center
        transition-colors duration-100
        ${getCellColor()}
        ${isRevealed && !isMine ? getNumberColor() : ''}
      `}
      data-testid={`cell-${x}-${y}`}
      aria-label={`Cell at ${x}, ${y}${isFlagged ? ', flagged' : ''}${isRevealed ? ', revealed' : ''}`}
    >
      {getCellContent()}
    </button>
  );
}
