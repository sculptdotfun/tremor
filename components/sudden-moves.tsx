'use client';

import { SuddenMove } from '@/lib/types';

interface SuddenMovesProps {
  moves: SuddenMove[];
}

export function SuddenMoves({ moves }: SuddenMovesProps) {
  if (moves.length === 0) {
    return null;
  }

  return (
    <section
      className="bg-zinc-950 border border-zinc-800/50"
      style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.5)' }}
    >
      <div className="px-4 py-3 border-b border-zinc-800/30">
        <h2 className="text-xs font-bold text-zinc-500 tracking-wider">
          SUDDEN MOVES (≥15% IN 1H)
        </h2>
      </div>

      <div className="divide-y divide-zinc-800/30">
        {moves.map((move) => (
          <div
            key={move.id}
            className="px-4 py-3 hover:bg-zinc-900/20 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className={`text-lg font-bold ${move.change > 0 ? 'text-trend-up' : 'text-trend-down'}`}>
                {move.change > 0 ? '↑' : '↓'}{Math.abs(move.change).toFixed(1)}%
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-zinc-200 leading-snug truncate">
                  {move.title}
                </div>
                <div className="text-xs text-zinc-500 font-mono tabular-nums mt-0.5">
                  {Math.round(move.previousValue)}% → {Math.round(move.currentValue)}% • {move.timeToChange} • {move.source}
                  {move.volume && (
                    <span className="ml-2">
                      • ${(move.volume / 1_000_000).toFixed(1)}M vol
                    </span>
                  )}
                </div>
              </div>
              {move.alertLevel === 'extreme' && (
                <div className="mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full border border-seismo-extreme/40 text-seismo-extreme uppercase tracking-wide">
                  Extreme
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
