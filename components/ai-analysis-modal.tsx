'use client';

import { useState, useEffect } from 'react';
import { MarketMovement } from '@/lib/types';
import { MovementExplainer } from './movement-explainer-real';

interface AIAnalysisModalProps {
  movement: MarketMovement | null;
  onClose: () => void;
}

export function AIAnalysisModal({ movement, onClose }: AIAnalysisModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (movement) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [movement]);

  if (!movement) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
      >
        <div
          className="border border-zinc-800/50 bg-zinc-950"
          style={{
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.05) inset, 0 20px 50px rgba(0,0,0,0.8)',
          }}
        >
          {/* Header */}
          <div className="border-b border-zinc-800/50 px-5 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-bold text-white">
                  {movement.title}
                </h2>
                {/* Show market question - what the percentage refers to */}
                {movement.marketMovements && movement.marketMovements[0] && (
                  <p className="mb-3 text-base font-medium leading-snug text-zinc-200">
                    {movement.marketMovements[0].question}
                  </p>
                )}
                {/* Key metrics in a clean grid */}
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div>
                    <div className="mb-1 text-[9px] uppercase text-zinc-500">
                      Movement
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-zinc-400">
                        {movement.previousValue.toFixed(0)}%
                      </span>
                      <span className="text-zinc-500">→</span>
                      <span className="text-lg font-bold text-white">
                        {movement.currentValue.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[9px] uppercase text-zinc-500">
                      Intensity
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        movement.seismoScore && movement.seismoScore >= 7.5
                          ? 'text-seismo-extreme'
                          : movement.seismoScore && movement.seismoScore >= 5
                            ? 'text-seismo-high'
                            : movement.seismoScore &&
                                movement.seismoScore >= 2.5
                              ? 'text-seismo-moderate'
                              : 'text-zinc-300'
                      }`}
                    >
                      {movement.seismoScore?.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[9px] uppercase text-zinc-500">
                      {movement.marketMovements &&
                      movement.marketMovements.length > 1
                        ? 'Markets'
                        : 'Category'}
                    </div>
                    <div className="text-sm text-zinc-300">
                      {movement.marketMovements &&
                      movement.marketMovements.length > 1
                        ? `${movement.marketMovements.length} affected`
                        : movement.category || 'General'}
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="-mt-1 ml-4 text-xl text-zinc-500 transition-colors hover:text-zinc-300"
                onClick={onClose}
              >
                ×
              </button>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="max-h-[50vh] overflow-y-auto">
            <MovementExplainer
              movement={{
                id: movement.id,
                eventId: movement.eventId,
                title: movement.title,
                seismoScore: movement.seismoScore,
                currentValue: movement.currentValue,
                previousValue: movement.previousValue,
                category: movement.category,
                marketMovements: movement.marketMovements,
              }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-800/50 bg-zinc-950/50 px-5 py-3">
            <span className="text-xs text-zinc-500">Press ESC to close</span>
            {movement.url && (
              <a
                href={movement.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-zinc-400 transition-colors hover:text-seismo-pulse"
              >
                View on Polymarket →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
