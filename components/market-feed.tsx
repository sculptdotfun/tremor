'use client';

import { MarketMovement } from '@/lib/types';

interface MarketFeedProps {
  movements: MarketMovement[];
}

export function MarketFeed({ movements }: MarketFeedProps) {
  const formatTime = (date: Date) => date.toISOString().slice(11, 16);

  const intensityClass = (score?: number) => {
    if (!score && score !== 0) return 'text-zinc-600';
    if (score >= 7.5) return 'text-seismo-extreme';
    if (score >= 5) return 'text-seismo-high';
    if (score >= 2.5) return 'text-seismo-moderate';
    return 'text-zinc-600';
  };

  return (
    <section
      className="bg-zinc-950 border border-zinc-800/50"
      style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.5)' }}
    >
      <div className="px-4 py-3 border-b border-zinc-800/30">
        <h2 className="text-xs font-bold text-zinc-500 tracking-wider">FEED</h2>
      </div>

      <div className="divide-y divide-zinc-800/30">
        {movements.map((move) => (
          <div
            key={move.id}
            className="flex items-center gap-4 px-4 py-2.5 text-sm hover:bg-zinc-900/20 transition-colors"
          >
            <span className="text-xs text-zinc-500 tabular-nums w-12">
              {formatTime(move.timestamp)}
            </span>

            <span className={`font-bold tabular-nums w-16 text-right ${intensityClass(move.seismoScore)}`}>
              {move.seismoScore !== undefined ? (
                <>
                  <span className="text-[10px] uppercase text-zinc-600 mr-0.5">int</span>
                  {move.seismoScore.toFixed(1)}
                </>
              ) : (
                <span className={move.change > 0 ? 'text-trend-up' : 'text-trend-down'}>
                  {move.change > 0 ? '↑' : '↓'}{Math.abs(move.change).toFixed(1)}%
                </span>
              )}
            </span>

            <span className="flex-1 min-w-0">
              <span className="font-medium text-zinc-300 truncate block">
                {move.title}
              </span>
              <span className="text-xs text-zinc-500 tabular-nums">
                {Math.round(move.previousValue)}% → {Math.round(move.currentValue)}%
              </span>
            </span>

            <span className="text-xs text-zinc-500">
              {move.source}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
