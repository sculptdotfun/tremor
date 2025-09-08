'use client';

import { useState } from 'react';
import { MarketSummary } from './market-summary';

interface SidebarProps {
  selectedWindow: '5m' | '60m' | '1440m';
  onChangeWindow: (w: '5m' | '60m' | '1440m') => void;
  selectedIntensity: 'all' | 'extreme' | 'high' | 'moderate' | 'low';
  onChangeIntensity: (
    intensity: 'all' | 'extreme' | 'high' | 'moderate' | 'low'
  ) => void;
}

export function Sidebar({
  selectedWindow,
  onChangeWindow,
  selectedIntensity,
  onChangeIntensity,
}: SidebarProps) {
  const [internalWindow, setInternalWindow] = useState(selectedWindow);
  const [internalIntensity, setInternalIntensity] = useState(
    selectedIntensity || 'all'
  );

  const windows = [
    { id: '1440m', label: '24 HOUR', desc: 'Daily trends' },
    { id: '60m', label: '1 HOUR', desc: 'Active shifts' },
    { id: '5m', label: '5 MIN', desc: 'Flash moves' },
  ];

  const intensityFilters = [
    { id: 'all', label: 'ALL', range: 'Show all', color: 'bg-zinc-600' },
    {
      id: 'extreme',
      label: 'EXTREME',
      range: '7.5+',
      color: 'bg-tremor-extreme',
    },
    { id: 'high', label: 'HIGH', range: '5.0-7.5', color: 'bg-tremor-high' },
    {
      id: 'moderate',
      label: 'MODERATE',
      range: '2.5-5.0',
      color: 'bg-tremor-moderate',
    },
    { id: 'low', label: 'LOW', range: '<2.5', color: 'bg-zinc-700' },
  ];

  return (
    <aside className="from-zinc-950/98 flex h-full w-64 flex-col border-r border-zinc-800/50 bg-gradient-to-b to-black/95">
      <div className="px-5 pt-5">
        <h3 className="mb-4 text-xs font-bold tracking-wider text-zinc-600">
          FILTER BY INTENSITY
        </h3>
        <div className="space-y-2">
          {intensityFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                const intensity = filter.id as
                  | 'all'
                  | 'extreme'
                  | 'high'
                  | 'moderate'
                  | 'low';
                setInternalIntensity(intensity);
                onChangeIntensity(intensity);
              }}
              className={`block w-full text-left transition-all ${
                internalIntensity === filter.id
                  ? 'border-2 bg-zinc-950'
                  : 'border bg-zinc-950 hover:border-zinc-600'
              }`}
              style={{
                borderColor:
                  internalIntensity === filter.id
                    ? filter.id === 'extreme'
                      ? 'rgb(239 68 68)'
                      : filter.id === 'high'
                        ? 'rgb(251 146 60)'
                        : filter.id === 'moderate'
                          ? 'rgb(250 204 21)'
                          : filter.id === 'low'
                            ? 'rgb(113 113 122)'
                            : 'rgb(113 113 122)'
                    : 'rgb(39 39 42 / 0.5)',
                boxShadow:
                  internalIntensity === filter.id
                    ? '0 0 0 1px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.5)'
                    : '0 0 0 1px rgba(255,255,255,0.02), 0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <div className="p-3">
                <div className="flex items-center gap-3">
                  {filter.id === 'all' ? (
                    <img
                      src="/tremor-icon.svg"
                      alt="Tremor logo"
                      className="h-8 w-8"
                    />
                  ) : (
                    <div className={`h-8 w-8 ${filter.color} rounded`} />
                  )}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      {filter.range !== 'Show all' && (
                        <span className="text-sm font-bold text-zinc-100">
                          {filter.range}
                        </span>
                      )}
                      <span
                        className={`text-[10px] uppercase ${
                          filter.id === 'extreme'
                            ? 'text-seismo-extreme'
                            : filter.id === 'high'
                              ? 'text-seismo-high'
                              : filter.id === 'moderate'
                                ? 'text-seismo-moderate'
                                : 'text-zinc-500'
                        }`}
                      >
                        {filter.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {filter.id === 'extreme'
                        ? 'Market earthquake'
                        : filter.id === 'high'
                          ? 'Major movement'
                          : filter.id === 'moderate'
                            ? 'Notable shift'
                            : filter.id === 'low'
                              ? 'Background noise'
                              : filter.range}
                    </div>
                  </div>
                  {internalIntensity === filter.id && (
                    <div className="h-2 w-2 animate-pulse rounded-full bg-seismo-pulse"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 px-5">
        <h3 className="mb-4 text-xs font-bold tracking-wider text-zinc-600">
          TIME WINDOW
        </h3>
        <div className="space-y-2">
          {windows.map((window) => (
            <button
              key={window.id}
              onClick={() => {
                const w = window.id as '5m' | '60m' | '1440m';
                setInternalWindow(w);
                onChangeWindow(w);
              }}
              className={`block w-full text-left transition-all ${
                internalWindow === window.id
                  ? 'border border-seismo-pulse/50 bg-zinc-950 shadow-lg'
                  : 'border border-zinc-800/50 bg-zinc-950 hover:border-zinc-700'
              }`}
              style={{
                boxShadow:
                  internalWindow === window.id
                    ? '0 0 0 1px rgba(34,211,238,0.1), 0 4px 12px rgba(0,0,0,0.5)'
                    : '0 0 0 1px rgba(255,255,255,0.02), 0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-zinc-100">
                      {window.label}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {window.desc}
                    </div>
                  </div>
                  {internalWindow === window.id && (
                    <div className="h-2 w-2 animate-pulse rounded-full bg-seismo-pulse"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Market Summary - in the normal flow */}
      <MarketSummary />

      {/* Powered by - pushed to bottom */}
      <div className="mt-auto border-t border-zinc-800/50 p-5">
        <div className="mb-1 text-center text-[9px] uppercase tracking-wider text-zinc-600">
          Powered by
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <a
            href="https://polymarket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Polymarket
          </a>
          <a
            href="https://x.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Grok AI
          </a>
        </div>
      </div>
    </aside>
  );
}
