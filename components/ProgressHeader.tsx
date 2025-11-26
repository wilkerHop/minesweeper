import { PlayerProgress } from '@/lib/game/types';

interface Props {
  progress: PlayerProgress;
}

export function ProgressHeader({ progress }: Props) {
  return (
    <div className="flex gap-4 items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🪙</span>
        <div className="flex flex-col">
          <span className="text-xs opacity-80">Coins</span>
          <span className="font-bold text-lg">{progress.totalCoins}</span>
        </div>
      </div>
      
      <div className="h-8 w-px bg-white/30"></div>
      
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎮</span>
        <div className="flex flex-col">
          <span className="text-xs opacity-80">Games</span>
          <span className="font-bold text-lg">{progress.gamesPlayed}</span>
        </div>
      </div>
      
      <div className="h-8 w-px bg-white/30"></div>
      
      <div className="flex items-center gap-2">
        <span className="text-2xl">⭐</span>
        <div className="flex flex-col">
          <span className="text-xs opacity-80">Best Score</span>
          <span className="font-bold text-lg">{progress.lifetimeScore}</span>
        </div>
      </div>
    </div>
  );
}
