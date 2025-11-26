
interface Props {
  finalScore: number;
  coinsEarned: number;
  onContinue: () => void;
}

export function GameOverModal({ finalScore, coinsEarned, onContinue }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl animate-bounce-in">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">💥</div>
          <h2 className="text-3xl font-bold text-red-600 mb-2">Game Over!</h2>
          <p className="text-gray-600">You hit a mine!</p>
        </div>
        
        <div className="space-y-4 mb-6 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center text-xl">
            <span className="text-gray-700">Final Score:</span>
            <span className="font-bold text-2xl text-blue-600">{finalScore}</span>
          </div>
          <div className="h-px bg-gray-300"></div>
          <div className="flex justify-between items-center text-xl">
            <span className="text-gray-700">Coins Earned:</span>
            <span className="font-bold text-2xl text-yellow-600">+{coinsEarned} 🪙</span>
          </div>
        </div>
        
        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-lg hover:from-blue-600 hover:to-purple-600 text-lg font-bold transition-all transform hover:scale-105 shadow-lg"
        >
          Continue to Upgrades →
        </button>
      </div>
    </div>
  );
}
