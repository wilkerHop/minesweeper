import { PlayerProgress, UpgradeLevels } from '@/lib/game/types';
import { UPGRADES } from '@/lib/game/upgrades';
import { UpgradeCard } from './UpgradeCard';

interface Props {
  progress: PlayerProgress;
  onPurchase: (upgradeId: keyof UpgradeLevels) => void;
  onClose: () => void;
}

export function UpgradeShop({ progress, onPurchase, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b-2">
          <h2 className="text-3xl font-bold text-gray-800">🛒 Upgrade Shop</h2>
          <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-lg border-2 border-yellow-400">
            <span className="text-2xl">🪙</span>
            <span className="font-bold text-xl text-yellow-700">{progress.totalCoins}</span>
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          {UPGRADES.map(upgrade => {
            const currentLevel = progress.upgrades[upgrade.id];
            const isMaxed = currentLevel >= upgrade.maxLevel;
            const cost = isMaxed ? 0 : upgrade.costs[currentLevel];
            const canAfford = progress.totalCoins >= cost;
            
            return (
              <UpgradeCard
                key={upgrade.id}
                upgrade={upgrade}
                currentLevel={currentLevel}
                cost={cost}
                isMaxed={isMaxed}
                canAfford={canAfford}
                onPurchase={() => onPurchase(upgrade.id)}
              />
            );
          })}
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg hover:from-green-600 hover:to-emerald-600 font-bold text-lg transition-all transform hover:scale-105 shadow-lg sticky bottom-0"
        >
          Start New Game 🎮
        </button>
      </div>
    </div>
  );
}
