'use client';

import { MarketMovement } from '@/lib/types';
import { useEffect, useState } from 'react';

interface SeismoDetailPanelProps {
  movement: MarketMovement | null;
  onClose: () => void;
}

export function SeismoDetailPanel({ movement, onClose }: SeismoDetailPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  useEffect(() => {
    if (movement) {
      setIsVisible(true);
      setShowAll(false); // Reset expansion state when opening new panel
    } else {
      setIsVisible(false);
    }
  }, [movement]);
  
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };
  
  if (!movement) return null;
  
  return (
    <>
      {/* Centered Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div className={`relative w-full max-w-5xl transition-all duration-300 transform ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}>
          <div className="bg-zinc-950 border border-zinc-800/50 flex flex-col" 
            style={{ maxHeight: '90vh', boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 20px 50px rgba(0,0,0,0.8)' }}>
          {/* Clean header */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-zinc-800/30">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start gap-3 md:gap-4 mb-3">
                  {movement?.image && (
                    <img 
                      src={movement.image} 
                      alt="" 
                      className="w-10 h-10 md:w-12 md:h-12 object-cover opacity-80"
                      loading="lazy"
                    />
                  )}
                  <h2 className="text-base md:text-lg font-semibold text-zinc-100 flex-1">{movement?.title}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-6">
                  {/* Price change */}
                  {movement?.change && Math.abs(movement.change) >= 0.1 ? (
                    movement?.marketMovements && movement.marketMovements.length > 1 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl md:text-3xl font-bold text-zinc-100">{Math.abs(movement.change).toFixed(1)}%</span>
                        <span className="text-xs md:text-sm text-zinc-500">max shift</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl md:text-3xl font-bold text-zinc-100">{Math.abs(movement.change).toFixed(1)}%</span>
                        <span className="text-xs md:text-sm text-zinc-500">shift</span>
                      </div>
                    )
                  ) : (
                    <div className="text-2xl md:text-3xl font-bold text-zinc-600">—</div>
                  )}
                  
                  {/* Current state - show appropriate text based on market type */}
                  <div className="text-sm text-zinc-400">
                    {movement?.marketMovements && movement.marketMovements.length > 1 ? (
                      <>
                        <div className="font-semibold text-zinc-300">Top market {movement?.currentValue}%</div>
                        <div className="text-xs">Was {movement?.previousValue}%</div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-zinc-300">Now {movement?.currentValue}%</div>
                        <div className="text-xs">Was {movement?.previousValue}%</div>
                      </>
                    )}
                  </div>
                  
                  {/* Intensity */}
                  <div className="ml-auto">
                    <div className={`text-xl md:text-2xl font-bold ${
                      movement?.seismoScore && movement.seismoScore >= 7.5 
                        ? 'text-seismo-extreme' 
                        : movement?.seismoScore && movement.seismoScore >= 5 
                        ? 'text-seismo-high'
                        : movement?.seismoScore && movement.seismoScore >= 2.5
                        ? 'text-seismo-moderate'
                        : 'text-zinc-600'
                    }`}>
                      {movement?.seismoScore?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-[10px] md:text-xs text-zinc-500">intensity</div>
                  </div>
                </div>
              </div>
              <button
                className="text-xl text-muted-foreground hover:text-foreground transition-colors px-2 ml-4"
                onClick={onClose}
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="px-4 md:px-6 py-4 md:py-6 overflow-y-auto flex-1">
            {/* Simplified stats */}
            {movement.multiMarketStats && (
              <div className="flex items-center gap-6 mb-6 pb-4 border-b border-zinc-800/30">
                <div>
                  <div className="text-2xl font-bold">{movement.multiMarketStats.totalMarkets}</div>
                  <div className="text-xs text-zinc-500">Total Markets</div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-trend-up">↑{movement.multiMarketStats.marketsUp}</span>
                    <span className="text-xl font-bold text-trend-down">↓{movement.multiMarketStats.marketsDown}</span>
                  </div>
                  <div className="text-xs text-zinc-500">Movement</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {movement.totalVolume || movement.volume ? formatVolume(movement.totalVolume || movement.volume || 0) : '—'}
                  </div>
                  <div className="text-xs text-zinc-500">Volume</div>
                </div>
                <div className="ml-auto text-xs text-zinc-500 uppercase">
                  {movement.category || 'GENERAL'}
                </div>
              </div>
            )}
            
            {/* Individual Market Movements */}
            {movement.marketMovements && movement.marketMovements.length > 0 ? (
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-800/30">Market Movements</div>
                <div className="space-y-1">
                  {(() => {
                    const significantMarkets = movement.marketMovements.filter(m => Math.abs(m.change) >= 1.0);
                    const lowMovementMarkets = movement.marketMovements.filter(m => Math.abs(m.change) < 1.0);
                    const displayMarkets = showAll ? movement.marketMovements : significantMarkets;
                    
                    return (
                      <>
                        {displayMarkets.map((market, idx) => {
                          return (
                            <div key={market.conditionId} className="group">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-medium flex-1 pr-4 text-zinc-300 leading-relaxed">{market.question}</h4>
                                {Math.abs(market.change) >= 0.1 && (
                                  <div className={`flex items-baseline gap-1 ${
                                    market.change > 0 ? 'text-trend-up' : 'text-trend-down'
                                  }`}>
                                    <span className="text-xs">{market.change > 0 ? '↑' : '↓'}</span>
                                    <span className="text-lg font-bold">{Math.abs(market.change).toFixed(1)}</span>
                                    <span className="text-xs text-zinc-500">%</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs mb-4 text-zinc-500">
                                <span>Now {Math.round(market.currPrice * 100)}%</span>
                                <span>•</span>
                                <span>Was {Math.round(market.prevPrice * 100)}%</span>
                                {market.volume > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{formatVolume(market.volume)}</span>
                                  </>
                                )}
                              </div>
                              {idx < displayMarkets.length - 1 && (
                                <div className="border-b border-zinc-800/30 mb-4" />
                              )}
                            </div>
                          );
                        })}
                        {lowMovementMarkets.length > 0 && (
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex-1 border-t border-zinc-800/30"></div>
                            <button
                              onClick={() => setShowAll(!showAll)}
                              className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              {showAll ? 'Hide' : 'Show'} {lowMovementMarkets.length} minor movements
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
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Movement</div>
                  <div className="text-3xl font-bold font-mono text-zinc-100">
                    {Math.abs(movement.change).toFixed(1)}% shift
                  </div>
                  <div className="text-xs text-muted-foreground">Probability change</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Current</div>
                  <div className="text-3xl font-bold font-mono">
                    {movement.currentValue}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Market probability
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Previous</div>
                  <div className="text-3xl font-bold font-mono">
                    {movement.previousValue}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Before movement
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Volume</div>
                  <div className="text-3xl font-bold font-mono">
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
          <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-t border-zinc-800/30 bg-zinc-950/50">
            <div className="text-xs md:text-sm text-muted-foreground">
              {movement.marketMovements && movement.marketMovements.length > 1 
                ? `${movement.marketMovements.length} markets affected`
                : 'ESC to close'}
            </div>
            {movement.url && (
              <a
                href={movement.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs md:text-sm font-medium text-foreground hover:text-seismo-pulse transition-colors"
              >
                <span className="hidden sm:inline">View on Polymarket →</span>
                <span className="sm:hidden">View →</span>
              </a>
            )}
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
