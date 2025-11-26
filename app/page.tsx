import { GameBoard } from '@/components/GameBoard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <main className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            ♾️ Infinite Minesweeper
          </h1>
          <p className="text-gray-300">
            An endless minesweeper experience with deterministic gameplay
          </p>
        </div>
        <GameBoard />
      </main>
    </div>
  );
}
