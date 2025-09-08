'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function MarketSummary() {
  // Simply read the cached summary - cron job handles generation
  const summary = useQuery(api.marketSummary.getSummary);

  if (!summary) {
    return null;
  }

  return (
    <div className="mt-6 px-5">
      {/* Header - exactly matching other sections */}
      <h3 className="mb-4 text-xs font-bold tracking-wider text-zinc-600">
        TREMOR REPORT
      </h3>

      {/* Content box - matching the style of time window / intensity boxes */}
      <div
        className="border border-zinc-800/50 bg-zinc-950 transition-all hover:border-zinc-600"
        style={{
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.02), 0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <div className="p-3">
          {summary ? (
            <>
              {/* Summary content */}
              <div className="mb-2 text-[10px] leading-relaxed text-zinc-400">
                {summary.summary}
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between border-t border-zinc-800/30 pt-2">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-sm font-bold text-zinc-100">
                      {summary.totalMovements}
                    </span>
                    <span className="ml-1 text-[10px] text-zinc-500">
                      active
                    </span>
                  </div>
                  {summary.extremeMovements > 0 && (
                    <div>
                      <span className="text-sm font-bold text-tremor-extreme">
                        {summary.extremeMovements}
                      </span>
                      <span className="ml-1 text-[10px] text-zinc-500">
                        extreme
                      </span>
                    </div>
                  )}
                </div>

                {/* Update status */}
                <div className="text-[10px] text-zinc-500">
                  {summary.minutesAgo < 1 ? 'now' : summary.minutesAgo < 60 ? `${summary.minutesAgo}m ago` : 'old'}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
