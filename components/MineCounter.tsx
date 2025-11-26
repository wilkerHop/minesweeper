
interface Props {
  totalMines: number;
  flaggedCount: number;
}

export function MineCounter({ totalMines, flaggedCount }: Props) {
  const remaining = totalMines - flaggedCount;
  return (
    <div className="flex items-center gap-2 bg-gray-800 text-white px-3 py-1 rounded font-mono">
      <span className="text-xl">💣</span>
      <span className="text-xl">
        {remaining.toString().padStart(3, '0')}
      </span>
    </div>
  );
}
