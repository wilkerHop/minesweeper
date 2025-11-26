import { GameStatus } from '@/lib/game/types';
import { useEffect, useState } from 'react';

interface Props {
  gameStatus: GameStatus;
}

export function GameTimer({ gameStatus }: Props) {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    if (gameStatus !== GameStatus.ACTIVE) return;
    
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameStatus]);
  
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  
  return (
    <div className="flex items-center gap-2 bg-gray-800 text-white px-3 py-1 rounded font-mono">
      <span className="text-xl">⏱️</span>
      <span className="text-xl">
        {minutes.toString().padStart(2, '0')}:{displaySeconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
