'use client';

import { MarketMovement } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

type TremorWindow = '5m' | '60m' | '1440m' | '7d' | '30d' | '1Q' | '1y' | string;

interface TremorDetailPanelProps {
  movement: MarketMovement | null;
  onClose: () => void;
  timeframeWindow?: TremorWindow;
}

export function TremorDetailPanel({
  movement,
  onClose,
  timeframeWindow,
}: TremorDetailPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    explanation: string;
    sources?: string[];
  } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestAnalysis = useAction((api.aiAnalysis as any).requestAnalysis);

  useEffect(() => {
    if (movement) {
      setIsVisible(true);
      setShowAll(false); // Reset expansion state when opening new panel
      setAiAnalysis(null); // Reset AI analysis

      // Auto-fetch AI analysis for high-intensity movements
      if (movement.seismoScore && movement.seismoScore >= 5) {
        setIsLoadingAI(true);
        // Prepare the data in the format expected by requestAnalysis
        requestAnalysis({
          movementId: movement.id || '',
          eventId: movement.eventId || movement.id || '',
          title: movement.title || '',
          category: movement.category,
          currentValue: movement.currentValue || 0,
          previousValue: movement.previousValue || 0,
          seismoScore: movement.seismoScore || 0,
          marketQuestion: movement.marketMovements?.[0]?.question,
          timeframeWindow,
        })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((response: any) => {
            if (response.success) {
              // Extract the explanation and sources from the response
              if (response.analysis) {
                setAiAnalysis({
                  explanation:
                    response.analysis.explanation || response.analysis,
                  sources: response.analysis.sources || [],
                });
              }
            }
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .catch((error: any) => {
            // Silently handle AI analysis errors - non-critical feature
          })
          .finally(() => {
            setIsLoadingAI(false);
          });
      }
    } else {
      setIsVisible(false);
      setAiAnalysis(null);
    }
  }, [movement, requestAnalysis]);

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };

  if (!movement) return null;

  return (
    <>
      {/* Centered Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />

        {/* Modal Content - narrower like intelligence modal */}
        <div
          className={`relative w-full max-w-3xl transform transition-all duration-300 ${
            isVisible ? 'scale-100' : 'scale-95'
          }`}
        >
          <div
            className="flex max-h-[85vh] flex-col border border-zinc-800/50 bg-zinc-950"
            style={{
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.05) inset, 0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            {/* Compact header */}
            <div className="border-b border-zinc-800/30 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Title and close button */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <h2 className="text-lg font-bold leading-tight text-white md:text-xl">
                        {movement?.title}
                      </h2>
                      {/* Show the main market question */}
                      {movement?.marketMovements &&
                        movement.marketMovements[0] && (
                          <p className="mt-2 text-sm font-medium leading-snug text-zinc-200 md:text-base">
                            {movement.marketMovements[0].question}
                          </p>
                        )}
                    </div>
                    <button
                      className="-mt-1 text-xl text-zinc-500 transition-colors hover:text-zinc-300"
                      onClick={onClose}
                    >
                      ×
                    </button>
                  </div>

                  {/* Key metrics grid */}
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    <div>
                      <div className="mb-1 text-[9px] uppercase text-zinc-500">
                        Movement
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-zinc-400">
                          {movement?.previousValue.toFixed(0)}%
                        </span>
                        <span className="text-xs text-zinc-500">→</span>
                        <span className="text-base font-bold text-white">
                          {movement?.currentValue.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[9px] uppercase text-zinc-500">
                        Intensity
                      </div>
                      <div
                        className={`text-base font-bold ${
                          movement?.seismoScore && movement.seismoScore >= 7.5
                            ? 'text-tremor-extreme'
                            : movement?.seismoScore && movement.seismoScore >= 5
                              ? 'text-tremor-high'
                              : movement?.seismoScore &&
                                  movement.seismoScore >= 2.5
                                ? 'text-tremor-moderate'
                                : 'text-zinc-300'
                        }`}
                      >
                        {movement?.seismoScore?.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[9px] uppercase text-zinc-500">
                        Volume
                      </div>
                      <div className="text-sm text-zinc-300">
                        {formatVolume(
                          movement?.totalVolume || movement?.volume || 0
                        ) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[9px] uppercase text-zinc-500">
                        {movement?.marketMovements &&
                        movement.marketMovements.length > 1
                          ? 'Markets'
                          : 'Category'}
                      </div>
                      <div className="text-sm text-zinc-300">
                        {movement?.marketMovements &&
                        movement.marketMovements.length > 1
                          ? `${movement.marketMovements.length} affected`
                          : movement?.category || 'General'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 md:py-4">
              {/* AI Analysis for high-intensity movements */}
              {movement.seismoScore && movement.seismoScore >= 5 && (
                <div className="mb-6">
                  <div className="mb-4 flex items-center gap-2 border-b border-zinc-800/30 pb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="5"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-tremor-pulse"
                      />
                      <path
                        d="M12 1v6m0 6v6m11-7h-6m-6 0H1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="text-tremor-pulse"
                      />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider text-tremor-pulse">
                      Real-Time Social Intelligence
                    </span>
                  </div>
                  {isLoadingAI ? (
                    <div className="flex items-center gap-3 rounded border border-tremor-pulse/20 bg-tremor-pulse/5 p-4">
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="h-2 w-2 animate-pulse rounded-full bg-tremor-pulse/60"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-zinc-400">
                        Analyzing social signals...
                      </span>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="space-y-3">
                      <div className="rounded border border-tremor-pulse/20 bg-tremor-pulse/5 p-4">
                        <p className="text-sm leading-relaxed text-zinc-200">
                          {aiAnalysis.explanation}
                        </p>
                      </div>
                      {aiAnalysis.sources && aiAnalysis.sources.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            Sources from X
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {aiAnalysis.sources.map((source, idx) => {
                              // Extract username from X URL (format: https://x.com/username/status/...)
                              const match = source.match(/x\.com\/([^\/]+)/);
                              const username = match
                                ? `@${match[1]}`
                                : `Post ${idx + 1}`;

                              return (
                                <a
                                  key={idx}
                                  href={source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded border border-zinc-800/50 bg-zinc-900/50 px-2 py-1 text-[10px] text-zinc-400 transition-all hover:border-tremor-pulse/30 hover:text-tremor-pulse"
                                >
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                  >
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                  </svg>
                                  <span>{username}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Individual Market Movements */}
              {movement.marketMovements &&
              movement.marketMovements.length > 0 ? (
                <div>
                  <div className="mb-4 border-b border-zinc-800/30 pb-2 text-xs uppercase tracking-wider text-zinc-500">
                    {movement.marketMovements.length === 1
                      ? 'Market Details'
                      : `${movement.marketMovements.length} Markets Affected`}
                  </div>
                  <div className="space-y-1">
                    {(() => {
                      const significantMarkets =
                        movement.marketMovements.filter(
                          (m) => Math.abs(m.change) >= 1.0
                        );
                      const lowMovementMarkets =
                        movement.marketMovements.filter(
                          (m) => Math.abs(m.change) < 1.0
                        );
                      const displayMarkets = showAll
                        ? movement.marketMovements
                        : significantMarkets;

                      return (
                        <>
                          {displayMarkets.map((market, idx) => {
                            return (
                              <div key={market.conditionId} className="group">
                                <div className="mb-1 flex items-start justify-between">
                                  <h4 className="flex-1 pr-3 text-xs font-medium leading-relaxed text-zinc-300 md:text-sm">
                                    {market.question}
                                  </h4>
                                  {Math.abs(market.change) >= 0.1 && (
                                    <div
                                      className={`flex items-baseline gap-1 ${
                                        market.change > 0
                                          ? 'text-trend-up'
                                          : 'text-trend-down'
                                      }`}
                                    >
                                      <span className="text-xs">
                                        {market.change > 0 ? '↑' : '↓'}
                                      </span>
                                      <span className="text-base font-bold md:text-lg">
                                        {Math.abs(market.change).toFixed(1)}
                                      </span>
                                      <span className="text-xs text-zinc-500">
                                        %
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="mb-3 flex items-center gap-3 text-xs text-zinc-500">
                                  <span>
                                    Now {Math.round(market.currPrice * 100)}%
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Was {Math.round(market.prevPrice * 100)}%
                                  </span>
                                  {market.volume > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{formatVolume(market.volume)}</span>
                                    </>
                                  )}
                                </div>
                                {idx < displayMarkets.length - 1 && (
                                  <div className="mb-3 border-b border-zinc-800/30" />
                                )}
                              </div>
                            );
                          })}
                          {lowMovementMarkets.length > 0 && (
                            <div className="mt-3 flex items-center gap-3">
                              <div className="flex-1 border-t border-zinc-800/30"></div>
                              <button
                                onClick={() => setShowAll(!showAll)}
                                className="px-3 py-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                              >
                                {showAll ? 'Hide' : 'Show'}{' '}
                                {lowMovementMarkets.length} minor movements
                              </button>
                              <div className="flex-1 border-t border-zinc-800/30"></div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                // Fallback to single market display if no detailed movements
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Movement
                    </div>
                    <div className="font-mono text-3xl font-bold text-zinc-100">
                      {Math.abs(movement.change).toFixed(1)}% shift
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Probability change
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Current
                    </div>
                    <div className="font-mono text-3xl font-bold">
                      {movement.currentValue}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Market probability
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Previous
                    </div>
                    <div className="font-mono text-3xl font-bold">
                      {movement.previousValue}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Before movement
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Volume
                    </div>
                    <div className="font-mono text-3xl font-bold">
                      {movement.volume ? formatVolume(movement.volume) : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Trading volume
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clean footer */}
            <div className="flex items-center justify-between border-t border-zinc-800/30 bg-zinc-950/50 px-4 py-2 md:px-6 md:py-3">
              <div className="text-xs text-muted-foreground md:text-sm">
                {movement.marketMovements && movement.marketMovements.length > 1
                  ? `${movement.marketMovements.length} markets affected`
                  : 'Press ESC to close'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
