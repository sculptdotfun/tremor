'use client';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { SeismoCard } from '@/components/seismo-card';
import { SeismoDetailPanel } from '@/components/seismo-detail-panel';
import { useSeismoData } from '@/hooks/use-seismo-data';
import { useState, useEffect } from 'react';

export default function Home() {
  const [windowSel, setWindowSel] = useState<'5m' | '60m' | '1440m'>('1440m'); // Default to daily
  const [intensityFilter, setIntensityFilter] = useState<
    'all' | 'extreme' | 'high' | 'moderate' | 'low'
  >('all');
  const [selectedMovement, setSelectedMovement] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangingWindow, setIsChangingWindow] = useState(false);
  const { movements, loading } = useSeismoData(windowSel);

  // Filter movements based on intensity
  const filteredMovements = movements.filter((m) => {
    if (intensityFilter === 'all') return true;
    const score = m.seismoScore || 0;
    if (intensityFilter === 'extreme') return score >= 7.5;
    if (intensityFilter === 'high') return score >= 5 && score < 7.5;
    if (intensityFilter === 'moderate') return score >= 2.5 && score < 5;
    if (intensityFilter === 'low') return score < 2.5;
    return true;
  });

  // Handle ESC key to close panel
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMovement(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Handle window change with loading state
  const handleWindowChange = (newWindow: '5m' | '60m' | '1440m') => {
    setIsChangingWindow(true);
    setWindowSel(newWindow);
    setTimeout(() => setIsChangingWindow(false), 300);
  };

  const getWindowLabel = () => {
    switch (windowSel) {
      case '5m':
        return '5 MINUTE';
      case '60m':
        return '1 HOUR';
      case '1440m':
        return '24 HOUR';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <div className="flex h-screen pt-14">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            selectedWindow={windowSel}
            onChangeWindow={handleWindowChange}
            selectedIntensity={intensityFilter}
            onChangeIntensity={setIntensityFilter}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ${
            mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            className={`absolute left-0 top-0 h-full w-64 transform border-r border-zinc-800 bg-zinc-950 transition-transform duration-300 ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Close button */}
            <div className="flex items-center justify-between border-b border-zinc-800/50 p-4">
              <h3 className="text-xs font-bold tracking-wider text-zinc-600">
                MENU
              </h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 transition-colors hover:text-zinc-200"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Sidebar content */}
            <div className="h-full overflow-y-auto pb-20">
              <Sidebar
                selectedWindow={windowSel}
                onChangeWindow={(w) => {
                  handleWindowChange(w);
                  setMobileMenuOpen(false);
                }}
                selectedIntensity={intensityFilter}
                onChangeIntensity={(intensity) => {
                  setIntensityFilter(intensity);
                  setMobileMenuOpen(false);
                }}
              />
            </div>
          </div>
        </div>

        <main className="flex flex-1 flex-col overflow-hidden">
          {loading && !isChangingWindow ? (
            <div className="flex h-64 items-center justify-center">
              <div className="space-y-4 text-center">
                <div className="inline-block">
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-6 w-1 animate-pulse rounded-full bg-seismo-pulse/60"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Initializing monitoring...
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Sticky Header Section */}
              <div className="flex-shrink-0 bg-background px-4 pb-4 pt-4 md:px-6 md:pt-6">
                {/* Removed separate alert - highlighting biggest shift in hero instead */}

                {/* Hero Banner - Narrative */}
                <div
                  className="mb-6 border border-zinc-800/50 bg-zinc-950"
                  style={{
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Live Event Section - Left on desktop, top on mobile */}
                    {filteredMovements.length > 0 && filteredMovements[0] && (
                      <div
                        className={`relative w-full overflow-hidden border-b bg-zinc-950 lg:w-80 lg:border-b-0 lg:border-r-0`}
                        style={{
                          backgroundImage: filteredMovements[0].image
                            ? `url(${filteredMovements[0].image})`
                            : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {/* Dark overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-zinc-950/90" />
                        {/* Right edge fade to blend with narrative section */}
                        <div className="absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-zinc-950 to-transparent" />

                        {/* Top accent for high intensity */}
                        {filteredMovements[0]?.seismoScore &&
                          filteredMovements[0].seismoScore >= 5 && (
                            <div
                              className={`absolute left-0 right-0 top-0 z-10 h-0.5 ${
                                filteredMovements[0].seismoScore >= 7.5
                                  ? 'bg-seismo-extreme'
                                  : 'bg-seismo-high'
                              }`}
                            />
                          )}

                        {/* Content */}
                        <div className="relative z-10 p-4 md:p-6">
                          <div className="mb-3 flex items-center justify-between md:mb-4">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                              BIGGEST SHIFT
                            </div>
                            <div className="flex items-center gap-2">
                              {filteredMovements[0].category && (
                                <span className="rounded border border-zinc-700/50 bg-zinc-800/50 px-2 py-0.5 text-[9px] uppercase tracking-wider text-zinc-400">
                                  {filteredMovements[0].category}
                                </span>
                              )}
                              {filteredMovements[0]?.seismoScore &&
                                filteredMovements[0].seismoScore >= 7.5 && (
                                  <span className="flex items-center gap-1 rounded border border-seismo-extreme/50 bg-seismo-extreme/10 px-2 py-0.5">
                                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-seismo-extreme"></div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-seismo-extreme">
                                      EXTREME
                                    </span>
                                  </span>
                                )}
                              {filteredMovements[0]?.seismoScore &&
                                filteredMovements[0].seismoScore >= 5 &&
                                filteredMovements[0].seismoScore < 7.5 && (
                                  <span className="flex items-center gap-1 rounded border border-seismo-high/50 bg-seismo-high/10 px-2 py-0.5">
                                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-seismo-high"></div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-seismo-high">
                                      HIGH
                                    </span>
                                  </span>
                                )}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <div className="text-base font-bold leading-snug text-white drop-shadow-lg">
                                {filteredMovements[0].title.length > 90
                                  ? filteredMovements[0].title.substring(
                                      0,
                                      90
                                    ) + '...'
                                  : filteredMovements[0].title}
                              </div>
                            </div>
                            <div className="border-t border-zinc-800/30 pt-3">
                              <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                                    Movement
                                  </div>
                                  {/* Show specific market movement if multi-market */}
                                  {filteredMovements[0].marketMovements &&
                                  filteredMovements[0].marketMovements.length >
                                    1 ? (
                                    <div>
                                      <div className="mb-1 text-[9px] text-zinc-300">
                                        {filteredMovements[0].marketMovements[0]
                                          .question.length > 60
                                          ? filteredMovements[0].marketMovements[0].question.substring(
                                              0,
                                              60
                                            ) + '...'
                                          : filteredMovements[0]
                                              .marketMovements[0].question}
                                      </div>
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-medium text-zinc-300">
                                          {(
                                            filteredMovements[0]
                                              .marketMovements[0].prevPrice *
                                            100
                                          ).toFixed(0)}
                                          %
                                        </span>
                                        <span className="text-zinc-400">→</span>
                                        <span className="text-2xl font-bold text-white drop-shadow-lg">
                                          {(
                                            filteredMovements[0]
                                              .marketMovements[0].currPrice *
                                            100
                                          ).toFixed(0)}
                                          %
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Single market - show YES price movement */
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-sm font-medium text-zinc-300">
                                        {filteredMovements[0].previousValue.toFixed(
                                          0
                                        )}
                                        %
                                      </span>
                                      <span className="text-zinc-400">→</span>
                                      <span className="text-2xl font-bold text-white drop-shadow-lg">
                                        {filteredMovements[0].currentValue.toFixed(
                                          0
                                        )}
                                        %
                                      </span>
                                      <span className="ml-1 text-[10px] font-semibold text-zinc-300">
                                        YES
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                                    Score
                                  </div>
                                  <div
                                    className={`text-2xl font-bold drop-shadow-lg ${
                                      filteredMovements[0].seismoScore &&
                                      filteredMovements[0].seismoScore >= 7.5
                                        ? 'text-seismo-extreme'
                                        : filteredMovements[0].seismoScore &&
                                            filteredMovements[0].seismoScore >=
                                              5
                                          ? 'text-seismo-high'
                                          : filteredMovements[0].seismoScore &&
                                              filteredMovements[0]
                                                .seismoScore >= 2.5
                                            ? 'text-seismo-moderate'
                                            : 'text-zinc-300'
                                    }`}
                                  >
                                    {filteredMovements[0].seismoScore?.toFixed(
                                      1
                                    ) || '0.0'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Narrative Section - Right on desktop, bottom on mobile */}
                    <div className="flex flex-1 items-center bg-zinc-950 p-4 md:p-6 lg:p-8">
                      <div className="space-y-3 md:space-y-4">
                        <p className="text-sm leading-relaxed text-zinc-200 md:text-base">
                          <span className="text-base font-semibold text-white md:text-lg">
                            Markets beat newsrooms every time.
                          </span>{' '}
                          Trump&apos;s victory was priced in hours before
                          networks called it. Biden&apos;s dropout leaked
                          through betting odds before his staff knew. When smart
                          money moves, probabilities shift — fast.
                        </p>
                        <p className="text-sm leading-relaxed text-zinc-400 md:text-base">
                          This dashboard monitors all active market movements in
                          real-time. The intensity score measures how sudden and
                          significant each shift is — higher means more violent,
                          more worth watching. When multiple related markets
                          move together, something big is happening.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Window Indicator + Mobile Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold tracking-[0.15em] text-muted-foreground md:tracking-[0.2em]">
                      SEISMIC ACTIVITY • {getWindowLabel()} WINDOW
                    </h2>

                    {/* Mobile Menu Button */}
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="p-1.5 text-zinc-400 transition-colors hover:text-zinc-200 lg:hidden"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 12H21M3 6H21M3 18H21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">SHOWING</span>
                    <span className="font-mono font-bold">
                      {filteredMovements.length}
                    </span>
                    <span className="text-muted-foreground">
                      {intensityFilter !== 'all' &&
                        `${intensityFilter.toUpperCase()} `}
                      MOVEMENTS
                    </span>
                  </div>
                </div>
              </div>

              {/* Scrollable Cards Section */}
              <div className="relative flex-1 overflow-y-auto overflow-x-visible px-4 pb-6 pt-4 md:px-6">
                {/* Loading overlay for window change */}
                {isChangingWindow && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex gap-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-6 w-1 animate-pulse rounded-full bg-seismo-pulse/60"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Grid */}
                <div className="grid grid-cols-1 gap-3 transition-all duration-300 ease-in-out md:grid-cols-2 md:gap-4">
                  {filteredMovements.map((move) => (
                    <SeismoCard
                      key={move.id}
                      movement={move}
                      isSelected={selectedMovement?.id === move.id}
                      onClick={() => {
                        // Toggle selection - clicking same card closes panel
                        setSelectedMovement(
                          selectedMovement?.id === move.id ? null : move
                        );
                      }}
                    />
                  ))}
                </div>

                {filteredMovements.length === 0 && (
                  <div
                    className="border border-zinc-800 bg-zinc-900/30 py-24 text-center"
                    style={{
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="mb-2 text-lg font-semibold text-foreground">
                      Market Stability
                    </div>
                    <div className="text-sm text-muted-foreground">
                      No significant movements in the{' '}
                      {getWindowLabel().toLowerCase()} window
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      Monitoring 500+ prediction markets
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Bottom HUD Panel */}
      <SeismoDetailPanel
        movement={selectedMovement}
        onClose={() => setSelectedMovement(null)}
      />
    </div>
  );
}
