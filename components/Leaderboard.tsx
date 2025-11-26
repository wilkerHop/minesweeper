import { getGameSession } from '@/app/actions/game';
import { getGlobalLeaderboard } from '@/app/actions/leaderboard';
import { getReplayData, ReplayData } from '@/app/actions/replay';
import { LeaderboardEntry } from '@/lib/game/types';
import { useEffect, useState } from 'react';
import { BrutalCard } from './BrutalCard';
import { ReplayViewer } from './ReplayViewer';

interface Props {
  onClose: () => void;
}

export function Leaderboard({ onClose }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReplay, setSelectedReplay] = useState<{ data: ReplayData; seed: string; mineDensity: number } | null>(null);

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

  const handleWatchReplay = async (sessionId: string) => {
    try {
      const [replayData, sessionData] = await Promise.all([
        getReplayData(sessionId),
        getGameSession(sessionId)
      ]);

      if (replayData && sessionData) {
        setSelectedReplay({
          data: replayData,
          seed: sessionData.seed,
          mineDensity: sessionData.mineDensity
        });
      } else {
        alert('Replay data not found');
      }
    } catch (error) {
      console.error('Failed to load replay:', error);
      alert('Failed to load replay');
    }
  };

  if (selectedReplay) {
    return (
      <ReplayViewer
        key={selectedReplay.data.sessionId}
        replayData={selectedReplay.data}
        seed={selectedReplay.seed}
        mineDensity={selectedReplay.mineDensity}
        onClose={() => setSelectedReplay(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <BrutalCard className="w-full max-w-2xl max-h-[80vh] flex flex-col relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-neon-green mb-6">GLOBAL RANKINGS</h2>
        
        {isLoading ? (
          <div className="text-center py-10 text-hacker-grey animate-pulse">LOADING DATA...</div>
        ) : (
          <div className="overflow-y-auto flex-1 pr-2">
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">
                <div className="col-span-1">#</div>
                <div className="col-span-6">Player</div>
                <div className="col-span-3 text-right">Score</div>
                <div className="col-span-2 text-right">Replay</div>
              </div>
              
              {entries.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`grid grid-cols-12 items-center py-2 border-b border-gray-900 font-mono ${
                    index === 0 ? 'text-neon-green font-bold' : 'text-gray-300'
                  }`}
                >
                  <div className="col-span-1">#{index + 1}</div>
                  <div className="col-span-6 truncate">{entry.playerName}</div>
                  <div className="col-span-3 text-right font-bold">{entry.score.toLocaleString()}</div>
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => handleWatchReplay(entry.sessionId)}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              ))}
              
              {entries.length === 0 && (
                <div className="text-center py-10 text-gray-500">NO RECORDS FOUND</div>
              )}
            </div>
          </div>
        )}
      </BrutalCard>
    </div>
  );
}
