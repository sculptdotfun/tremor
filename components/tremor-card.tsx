'use client';

import { MarketMovement } from '@/lib/types';
import { memo } from 'react';

interface TremorCardProps {
  movement: MarketMovement;
  isSelected?: boolean;
  onClick?: () => void;
}

export const TremorCard = memo(
  function TremorCard({
    movement,
    isSelected = false,
    onClick,
  }: TremorCardProps) {
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
        <div className="flex h-1.5 gap-px">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-all duration-300 ${
                i < filled
                  ? magnitude >= 7.5
                    ? 'bg-tremor-extreme'
                    : magnitude >= 5
                      ? 'bg-tremor-high'
                      : magnitude >= 2.5
                        ? 'bg-tremor-moderate'
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
        className={`relative border border-zinc-800 bg-zinc-950 ${isSelected ? 'border-zinc-600 shadow-2xl ring-1 ring-zinc-700/30' : 'hover:border-zinc-700 hover:shadow-xl'} group overflow-hidden transition-all duration-200`}
        style={{
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Top accent for high magnitude */}
        {movement.seismoScore && movement.seismoScore >= 5 ? (
          <div
            className={`absolute left-0 right-0 top-0 h-0.5 ${
              movement.seismoScore >= 7.5
                ? 'bg-tremor-extreme'
                : 'bg-tremor-high'
            }`}
          />
        ) : null}

        <div className="flex">
          {/* Image on the left - full height */}
          {movement.image && (
            <div className="w-20 flex-shrink-0 border-r border-zinc-800/50 bg-zinc-900">
              <img
                src={movement.image}
                alt=""
                className="h-full w-full object-cover opacity-60 transition-opacity hover:opacity-80"
                loading="lazy"
              />
            </div>
          )}

          <div className="flex-1 p-4">
            {/* Main title - make it bigger and more prominent */}
            <div className="mb-2">
              <h3 className="text-base font-bold leading-tight text-white">
                {movement.title}
              </h3>
            </div>

            {/* Movement info - clear and prominent */}
            <div className="mb-3 rounded border border-zinc-800/50 bg-zinc-900/50 p-2">
              {/* Show market question - THIS is what the percentage refers to */}
              {movement.marketMovements && movement.marketMovements[0] && (
                <div className="mb-2 text-xs font-medium leading-tight text-zinc-100">
                  {movement.marketMovements[0].question}
                  {movement.marketMovements.length > 1 && (
                    <span className="ml-2 text-[9px] uppercase text-zinc-500">
                      (1 of {movement.marketMovements.length})
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-zinc-400">
                    {movement.previousValue.toFixed(0)}%
                  </span>
                  <span className="text-zinc-500">→</span>
                  <span className="text-xl font-bold text-white">
                    {movement.currentValue.toFixed(0)}%
                  </span>
                  <span className="text-xs font-medium text-zinc-400">YES</span>
                </div>
                <div
                  className={`text-xl font-bold ${
                    movement.seismoScore && movement.seismoScore >= 7.5
                      ? 'text-tremor-extreme'
                      : movement.seismoScore && movement.seismoScore >= 5
                        ? 'text-tremor-high'
                        : movement.seismoScore && movement.seismoScore >= 2.5
                          ? 'text-tremor-moderate'
                          : 'text-white'
                  }`}
                >
                  {movement.seismoScore?.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Intensity Bar */}
            <div className="mb-3">{renderMagnitudeBar()}</div>

            {/* Bottom row - clean metadata */}
            <div className="flex items-center justify-between text-[9px] text-zinc-500">
              <div className="flex items-center gap-2">
                {movement.category && (
                  <span className="uppercase tracking-wider">
                    {movement.category}
                  </span>
                )}
                {movement.category &&
                  (movement.totalVolume || movement.volume) && <span>•</span>}
                {(() => {
                  const vol = formatVolume(
                    movement.totalVolume || movement.volume || 0
                  );
                  return vol ? <span>{vol}</span> : null;
                })()}
              </div>
              <span>{formatTime(movement.timestamp)}</span>
            </div>

            {/* Bottom actions bar */}
            <div className="mt-3 flex items-center justify-between border-t border-zinc-800/50 pt-2">
              {/* Polymarket link - show if we have URL */}
              {movement.url ? (
                <a
                  href={movement.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="group relative overflow-hidden rounded border border-zinc-700/30 bg-zinc-900/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 transition-all hover:border-zinc-600 hover:text-zinc-200"
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Market</span>
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-zinc-800/30 to-zinc-700/30 transition-transform group-hover:translate-x-0" />
                </a>
              ) : (
                <div /> // Empty div to maintain spacing
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Details button - glows when intelligence is available */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                  className={`group relative overflow-hidden rounded border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                    movement.seismoScore && movement.seismoScore >= 5
                      ? 'border-tremor-pulse/30 bg-tremor-pulse/5 text-tremor-pulse hover:border-tremor-pulse hover:bg-tremor-pulse/10'
                      : 'border-zinc-700/30 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 6h16M4 12h16M4 18h16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Details</span>
                    {movement.seismoScore && movement.seismoScore >= 5 && (
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-tremor-pulse" />
                    )}
                  </span>
                  <div
                    className={`absolute inset-0 -translate-x-full transition-transform group-hover:translate-x-0 ${
                      movement.seismoScore && movement.seismoScore >= 5
                        ? 'bg-gradient-to-r from-tremor-pulse/10 to-tremor-pulse/5'
                        : 'bg-gradient-to-r from-zinc-800/30 to-zinc-700/30'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for memo - only re-render if important props change
    return (
      prevProps.movement.id === nextProps.movement.id &&
      prevProps.movement.change === nextProps.movement.change &&
      prevProps.movement.seismoScore === nextProps.movement.seismoScore &&
      prevProps.isSelected === nextProps.isSelected
    );
  }
);
