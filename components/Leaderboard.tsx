import { getGlobalLeaderboard } from '@/app/actions/leaderboard';
import { LeaderboardEntry } from '@/lib/game/types';
import { useEffect, useState } from 'react';
import { BrutalCard } from './BrutalCard';

interface Props {
  onClose: () => void;
}

export function Leaderboard({ onClose }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const data = await getGlobalLeaderboard();
        setEntries(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <BrutalCard title="GLOBAL RANKINGS" icon="🏆" className="w-full max-w-md bg-void border-neon-green animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-neon-green font-mono text-center py-8 animate-pulse">
              LOADING DATA STREAM...
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-2">
                <div className="col-span-2">Rank</div>
                <div className="col-span-7">Operative</div>
                <div className="col-span-3 text-right">Score</div>
              </div>
              
              {entries.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`grid grid-cols-12 items-center py-2 border-b border-gray-900 font-mono ${
                    index === 0 ? 'text-neon-green font-bold' : 'text-gray-300'
                  }`}
                >
                  <div className="col-span-2">#{index + 1}</div>
                  <div className="col-span-7 truncate">{entry.playerName}</div>
                  <div className="col-span-3 text-right font-bold">{entry.score.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-hacker-grey text-white font-bold hover:bg-white hover:text-black transition-colors uppercase tracking-widest border border-white/20"
          >
            CLOSE TERMINAL
          </button>
        </div>
      </BrutalCard>
    </div>
  );
}
