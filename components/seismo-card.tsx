'use client';

import { MarketMovement } from '@/lib/types';
import { memo } from 'react';

interface SeismoCardProps {
  movement: MarketMovement;
  isSelected?: boolean;
  onClick?: () => void;
}

export const SeismoCard = memo(function SeismoCard({ movement, isSelected = false, onClick }: SeismoCardProps) {
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'NOW';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };
  
  const formatVolume = (vol: number) => {
    if (vol === 0) return null;
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };
  
  const renderMagnitudeBar = () => {
    const magnitude = movement.seismoScore || 0;
    const segments = 20;
    const filled = Math.round((magnitude / 10) * segments);
    
    return (
      <div className="flex gap-px h-1.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 transition-all duration-300 ${
              i < filled 
                ? magnitude >= 7.5 ? 'bg-seismo-extreme' 
                : magnitude >= 5 ? 'bg-seismo-high'
                : magnitude >= 2.5 ? 'bg-seismo-moderate'
                : 'bg-muted-foreground/30'
              : 'bg-muted-foreground/10'
            }`}
            style={{ transitionDelay: `${i * 20}ms` }}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div
      className={`relative bg-zinc-950 border border-zinc-800
        ${isSelected ? 'border-zinc-600 shadow-2xl ring-1 ring-zinc-700/30' : 'hover:border-zinc-700 hover:shadow-xl hover:scale-[1.01]'}
        cursor-pointer transition-all duration-200 group overflow-hidden`}
      onClick={onClick}
      style={{
        boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.5)'
      }}
    >
      {/* Top accent for high magnitude */}
      {movement.seismoScore && movement.seismoScore >= 5 ? (
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${
          movement.seismoScore >= 7.5 ? 'bg-seismo-extreme' 
          : 'bg-seismo-high'
        }`} />
      ) : null}
      
      <div className="flex">
        {/* Image on the left */}
        {movement.image && (
          <div className="w-20 bg-zinc-900 border-r border-zinc-800/50">
            <img 
              src={movement.image} 
              alt="" 
              className="w-full h-full object-cover opacity-60 hover:opacity-80 transition-opacity"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="flex-1 p-4">
          {/* Header row with title and time */}
          <div className="flex items-start justify-between mb-3 gap-2">
            <h3 className="text-sm font-semibold leading-relaxed line-clamp-2 text-zinc-100 flex-1">
              {movement.title}
            </h3>
            <span className={`text-xs whitespace-nowrap ${
              formatTime(movement.timestamp) === 'NOW' ? 'text-zinc-300 font-medium' : 'text-zinc-500'
            }`}>
              {formatTime(movement.timestamp)}
            </span>
          </div>
          
          {/* Intensity Bar */}
          <div className="mb-3">
            {renderMagnitudeBar()}
          </div>
          
          {/* Metrics row */}
          <div className="flex items-end justify-between gap-3">
            {/* Left side - price movement */}
            <div className="flex-1">
              {movement.change && Math.abs(movement.change) >= 0.1 ? (
                <div className="space-y-1">
                  {/* Multi-market: show which market moved */}
                  {movement.marketMovements && movement.marketMovements.length > 1 && movement.marketMovements[0] ? (
                    <div>
                      <div className="text-[9px] text-zinc-500 mb-0.5 truncate">
                        {movement.marketMovements[0].question.length > 35
                          ? movement.marketMovements[0].question.substring(0, 35) + '...'
                          : movement.marketMovements[0].question}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-zinc-400">
                          {(movement.marketMovements[0].prevPrice * 100).toFixed(0)}%
                        </span>
                        <span className="text-zinc-600 text-xs">→</span>
                        <span className="text-lg font-bold text-zinc-100">
                          {(movement.marketMovements[0].currPrice * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Single market: show YES price movement */
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-zinc-400">
                        {movement.previousValue.toFixed(0)}%
                      </span>
                      <span className="text-zinc-600 text-xs">→</span>
                      <span className="text-lg font-bold text-zinc-100">
                        {movement.currentValue.toFixed(0)}%
                      </span>
                      <span className="text-[9px] text-zinc-500 ml-0.5">YES</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-zinc-600">No significant movement</div>
              )}
            </div>
            
            {/* Right side - intensity and volume */}
            <div className="text-right space-y-1">
              <div className="flex items-baseline gap-2 justify-end">
                <div className={`text-lg font-bold ${
                  movement.seismoScore && movement.seismoScore >= 7.5 
                    ? 'text-seismo-extreme' 
                    : movement.seismoScore && movement.seismoScore >= 5 
                    ? 'text-seismo-high'
                    : movement.seismoScore && movement.seismoScore >= 2.5
                    ? 'text-seismo-moderate'
                    : 'text-zinc-600'
                }`}>
                  {movement.seismoScore?.toFixed(1) || '0.0'}
                </div>
                <span className="text-[9px] text-zinc-600 uppercase">intensity</span>
              </div>
              {(() => {
                const vol = formatVolume(movement.totalVolume || movement.volume || 0);
                return vol ? (
                  <div className="text-xs text-zinc-500">{vol} vol</div>
                ) : null;
              })()}
            </div>
          </div>
          
          {/* Category tag */}
          {movement.category && (
            <div className="mt-3 pt-2 border-t border-zinc-800/50">
              <span className="inline-block px-2 py-0.5 bg-zinc-900 text-[10px] uppercase tracking-wider text-zinc-500">
                {movement.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if important props change
  return prevProps.movement.id === nextProps.movement.id &&
         prevProps.movement.change === nextProps.movement.change &&
         prevProps.movement.seismoScore === nextProps.movement.seismoScore &&
         prevProps.isSelected === nextProps.isSelected;
});
