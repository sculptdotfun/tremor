'use client';

import { MarketMovement } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface TremorDetailPanelProps {
  movement: MarketMovement | null;
  onClose: () => void;
}

export function TremorDetailPanel({
  movement,
  onClose,
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
          .catch(() => {
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
                      
                      {/* Only show market details if multiple markets or if different from title */}
                      {movement?.marketMovements && movement.marketMovements[0] && (
                        movement.marketMovements.length > 1 ? (
                          <>
                            <div className="mt-3 text-[9px] uppercase tracking-wider text-zinc-500 mb-1">
                              LEADING MARKET ({movement.marketMovements.length} MARKETS TOTAL)
                            </div>
                            <p className="text-sm font-medium leading-snug text-zinc-200">
                              {movement.marketMovements[0].question}
                            </p>
                          </>
                        ) : (
                          movement.marketMovements[0].question !== movement.title && (
                            <p className="mt-2 text-sm text-zinc-300">
                              {movement.marketMovements[0].question}
                            </p>
                          )
                        )
                      )}
                    </div>
                    <button
                      className="-mt-1 text-xl text-zinc-500 transition-colors hover:text-zinc-300"
                      onClick={onClose}
                    >
                      ×
                    </button>
                  </div>

                  {/* Quick stats - only show key info not shown elsewhere */}
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">Intensity:</span>
                      <span className={`font-bold ${
                        movement?.seismoScore && movement.seismoScore >= 7.5
                          ? 'text-tremor-extreme'
                          : movement?.seismoScore && movement.seismoScore >= 5
                            ? 'text-tremor-high'
                            : movement?.seismoScore && movement.seismoScore >= 2.5
                              ? 'text-tremor-moderate'
                              : 'text-zinc-300'
                      }`}>
                        {movement?.seismoScore?.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">Volume:</span>
                      <span className="text-zinc-300">
                        {formatVolume(movement?.totalVolume || movement?.volume || 0) || '—'}
                      </span>
                    </div>
                    {movement?.category && (
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Category:</span>
                        <span className="text-zinc-300">{movement.category}</span>
                      </div>
                    )}
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

              {/* Individual Market Movements - show when we have the data */}
              {movement.marketMovements && movement.marketMovements.length > 0 ? (
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-zinc-800/30 pb-2">
                    <span className="text-xs uppercase tracking-wider text-zinc-500">
                      Market Breakdown
                    </span>
                    <span className="text-xs text-zinc-400">
                      {movement.marketMovements.length} {movement.marketMovements.length === 1 ? 'market' : 'markets'}
                    </span>
                  </div>
                  <div className="space-y-3">
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
                        : significantMarkets.length > 0 ? significantMarkets : movement.marketMovements;

                      return (
                        <>
                          {displayMarkets.map((market, idx) => {
                            const changeAbs = Math.abs(market.change);
                            const isSignificant = changeAbs >= 5;
                            const isModerate = changeAbs >= 2.5 && changeAbs < 5;
                            
                            return (
                              <div key={market.conditionId} className={`group rounded border p-3 transition-all ${
                                isSignificant 
                                  ? 'border-zinc-700/50 bg-zinc-900/30' 
                                  : 'border-zinc-800/30 bg-zinc-950/50'
                              }`}>
                                {/* Market question */}
                                <h4 className="mb-4 text-sm font-medium leading-relaxed text-zinc-200">
                                  {market.question}
                                </h4>
                                
                                {/* Price movement bar */}
                                <div className="mb-2 flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex h-6 items-center rounded bg-zinc-900/50">
                                      {/* Previous price marker */}
                                      <div 
                                        className="relative h-full border-r-2 border-zinc-600"
                                        style={{ width: `${market.prevPrice * 100}%` }}
                                      >
                                        <span className="absolute -top-5 right-0 text-[10px] text-zinc-500">
                                          {Math.round(market.prevPrice * 100)}%
                                        </span>
                                      </div>
                                      {/* Current price fill */}
                                      <div 
                                        className={`h-full transition-all ${
                                          market.change > 0 
                                            ? 'bg-trend-up/30' 
                                            : market.change < 0 
                                              ? 'bg-trend-down/30' 
                                              : 'bg-zinc-700/30'
                                        }`}
                                        style={{ 
                                          width: `${Math.abs(market.currPrice - market.prevPrice) * 100}%` 
                                        }}
                                      />
                                      {/* Current price marker */}
                                      <div className="relative h-full">
                                        <div className={`absolute top-0 h-full w-0.5 ${
                                          isSignificant 
                                            ? 'bg-white' 
                                            : 'bg-zinc-400'
                                        }`} />
                                        <span className={`absolute -bottom-5 left-0 text-[10px] font-bold ${
                                          isSignificant 
                                            ? 'text-white' 
                                            : 'text-zinc-300'
                                        }`}>
                                          {Math.round(market.currPrice * 100)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Change indicator */}
                                  {changeAbs >= 0.1 && (
                                    <div className={`flex items-baseline gap-1 ${
                                      market.change > 0
                                        ? 'text-trend-up'
                                        : 'text-trend-down'
                                    }`}>
                                      <span className="text-xs">
                                        {market.change > 0 ? '↑' : '↓'}
                                      </span>
                                      <span className={`font-bold ${
                                        isSignificant ? 'text-lg' : 'text-base'
                                      }`}>
                                        {changeAbs.toFixed(1)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Volume if available */}
                                {market.volume > 0 && (
                                  <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500">
                                    <span className="uppercase">Volume:</span>
                                    <span className="font-mono text-zinc-400">
                                      {formatVolume(market.volume)}
                                    </span>
                                  </div>
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
              ) : null}
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
