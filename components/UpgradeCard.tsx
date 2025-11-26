import { UpgradeDefinition } from '@/lib/game/types';

interface Props {
  upgrade: UpgradeDefinition;
  currentLevel: number;
  cost: number;
  isMaxed: boolean;
  canAfford: boolean;
  onPurchase: () => void;
}

export function UpgradeCard({
  upgrade,
  currentLevel,
  cost,
  isMaxed,
  canAfford,
  onPurchase,
}: Props) {
  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${
      isMaxed 
        ? 'bg-green-50 border-green-300' 
        : canAfford 
          ? 'bg-white border-blue-300 hover:border-blue-500 hover:shadow-md' 
          : 'bg-gray-50 border-gray-300 opacity-75'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">{upgrade.icon}</span>
            <div>
              <h3 className="font-bold text-lg text-gray-800">{upgrade.name}</h3>
              <p className="text-sm text-gray-600">{upgrade.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Level:</span>
            <div className="flex gap-1">
              {Array.from({ length: upgrade.maxLevel }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded ${
                    i < currentLevel
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-700">
              {currentLevel}/{upgrade.maxLevel}
            </span>
          </div>
          
          {!isMaxed && (
            <div className="text-sm text-gray-700 bg-blue-50 px-3 py-1 rounded inline-block">
              <span className="font-semibold">Next:</span> {upgrade.effects[currentLevel]}
            </div>
          )}
          
          {isMaxed && (
            <div className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded inline-block font-bold">
              ✓ MAX LEVEL
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {!isMaxed && (
            <>
              <div className="text-right">
                <div className="text-xs text-gray-500">Cost</div>
                <div className="font-bold text-xl text-yellow-600">
                  🪙 {cost}
                </div>
              </div>
              <button
                onClick={onPurchase}
                disabled={!canAfford}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  canAfford
                    ? 'bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canAfford ? 'Upgrade' : 'Not Enough'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
