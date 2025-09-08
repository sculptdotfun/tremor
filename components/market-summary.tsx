'use client';

import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useState } from 'react';

export function MarketSummary() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const summary = useQuery(api.marketSummary.getSummary);
  const refreshSummary = useAction(api.marketSummary.refreshIfNeeded);

  // Auto-refresh on mount and every hour
  useEffect(() => {
    let mounted = true;
    let hasRefreshed = false; // Prevent double refresh in StrictMode

    const refresh = async () => {
      if (!mounted || isRefreshing || hasRefreshed) return;
      hasRefreshed = true;
      setIsRefreshing(true);
      try {
        await refreshSummary();
      } catch (error) {
        console.error('Failed to refresh market summary:', error);
      } finally {
        if (mounted) {
          setIsRefreshing(false);
        }
      }
    };

    // Initial refresh
    refresh();

    // Set up hourly refresh
    const interval = setInterval(
      () => {
        hasRefreshed = false; // Reset for next refresh
        refresh();
      },
      60 * 60 * 1000
    ); // 1 hour

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!summary && !isRefreshing) {
    return null;
  }

  return (
    <div className="mt-6 px-5">
      {/* Header - exactly matching other sections */}
      <h3 className="mb-4 text-xs font-bold tracking-wider text-zinc-600">
        SEISMO REPORT
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
          {isRefreshing && !summary ? (
            <div className="space-y-2">
              <div className="h-2 w-full animate-pulse rounded bg-zinc-800/30" />
              <div className="h-2 w-4/5 animate-pulse rounded bg-zinc-800/30" />
              <div className="h-2 w-3/4 animate-pulse rounded bg-zinc-800/30" />
            </div>
          ) : summary ? (
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
                      <span className="text-sm font-bold text-seismo-extreme">
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
                  {summary.minutesAgo < 1 ? 'now' : `${summary.minutesAgo}m`}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
