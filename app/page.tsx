'use client';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { SeismoCard } from '@/components/seismo-card';
import { SeismoDetailPanel } from '@/components/seismo-detail-panel';
import { useSeismoData } from '@/hooks/use-seismo-data';
import { useState, useEffect } from 'react';

export default function Home() {
  const [windowSel, setWindowSel] = useState<'5m' | '60m' | '1440m'>('1440m'); // Default to daily
  const [intensityFilter, setIntensityFilter] = useState<'all' | 'extreme' | 'high' | 'moderate' | 'low'>('all');
  const [selectedMovement, setSelectedMovement] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangingWindow, setIsChangingWindow] = useState(false);
  const { movements, suddenMoves, loading } = useSeismoData(windowSel);
  
  // Filter movements based on intensity
  const filteredMovements = movements.filter(m => {
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
    switch(windowSel) {
      case '5m': return '5 MINUTE';
      case '60m': return '1 HOUR';
      case '1440m': return '24 HOUR';
    }
  };
  
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="flex pt-14 h-screen">
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
        <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className={`absolute left-0 top-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 transform transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Close button */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
              <h3 className="text-xs font-bold text-zinc-600 tracking-wider">MENU</h3>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {loading && !isChangingWindow ? (
            <div className="flex items-center justify-center h-64">
              <div className="space-y-4 text-center">
                <div className="inline-block">
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-1 h-6 bg-seismo-pulse/60 rounded-full animate-pulse" 
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Initializing monitoring...</div>
              </div>
            </div>
          ) : (
            <>
              {/* Sticky Header Section */}
              <div className="flex-shrink-0 px-4 md:px-6 pt-4 md:pt-6 pb-4 bg-background">
                {/* Removed separate alert - highlighting biggest shift in hero instead */}
                
                {/* Hero Banner - Narrative */}
                <div className="bg-zinc-950 border border-zinc-800/50 mb-6"
                  style={{
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.5)'
                  }}>
                  <div className="flex flex-col lg:flex-row">
                    {/* Live Event Section - Left on desktop, top on mobile */}
                    {filteredMovements.length > 0 && filteredMovements[0] && (
                      <div className={`w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-zinc-800/50 p-4 md:p-6 relative ${
                        filteredMovements[0].seismoScore >= 7.5 
                          ? 'bg-zinc-900/30' 
                          : 'bg-zinc-900/20'
                      }`}>
                        {/* Top accent for high intensity */}
                        {filteredMovements[0].seismoScore >= 5 && (
                          <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                            filteredMovements[0].seismoScore >= 7.5 
                              ? 'bg-seismo-extreme'
                              : 'bg-seismo-high'
                          }`} />
                        )}
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">BIGGEST SHIFT</div>
                          <div className="flex items-center gap-2">
                            {filteredMovements[0].category && (
                              <span className="px-2 py-0.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-[9px] uppercase tracking-wider text-zinc-400">
                                {filteredMovements[0].category}
                              </span>
                            )}
                            {filteredMovements[0].seismoScore >= 7.5 && (
                              <span className="px-2 py-0.5 bg-seismo-extreme/10 border border-seismo-extreme/50 rounded flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-seismo-extreme rounded-full animate-pulse"></div>
                                <span className="text-[9px] text-seismo-extreme uppercase tracking-wider font-bold">EXTREME</span>
                              </span>
                            )}
                            {filteredMovements[0].seismoScore >= 5 && filteredMovements[0].seismoScore < 7.5 && (
                              <span className="px-2 py-0.5 bg-seismo-high/10 border border-seismo-high/50 rounded flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-seismo-high rounded-full animate-pulse"></div>
                                <span className="text-[9px] text-seismo-high uppercase tracking-wider font-bold">HIGH</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            {filteredMovements[0].image && (
                              <img 
                                src={filteredMovements[0].image} 
                                alt="" 
                                className="w-14 h-14 object-cover border border-zinc-800/50"
                              />
                            )}
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-zinc-100 leading-snug">
                                {filteredMovements[0].title.length > 90 
                                  ? filteredMovements[0].title.substring(0, 90) + '...' 
                                  : filteredMovements[0].title}
                              </div>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-zinc-800/30">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="col-span-2">
                                <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Movement</div>
                                {/* Show specific market movement if multi-market */}
                                {filteredMovements[0].marketMovements && filteredMovements[0].marketMovements.length > 1 ? (
                                  <div>
                                    <div className="text-[9px] text-zinc-400 mb-1">
                                      {filteredMovements[0].marketMovements[0].question.length > 60 
                                        ? filteredMovements[0].marketMovements[0].question.substring(0, 60) + '...'
                                        : filteredMovements[0].marketMovements[0].question}
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-sm text-zinc-400">
                                        {(filteredMovements[0].marketMovements[0].prevPrice * 100).toFixed(0)}%
                                      </span>
                                      <span className="text-zinc-600">→</span>
                                      <span className="text-xl font-bold text-zinc-100">
                                        {(filteredMovements[0].marketMovements[0].currPrice * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  /* Single market - show YES price movement */
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-sm text-zinc-400">
                                      {filteredMovements[0].previousValue.toFixed(0)}%
                                    </span>
                                    <span className="text-zinc-600">→</span>
                                    <span className="text-xl font-bold text-zinc-100">
                                      {filteredMovements[0].currentValue.toFixed(0)}%
                                    </span>
                                    <span className="text-[10px] text-zinc-500 ml-1">YES</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Score</div>
                                <div className={`text-xl font-bold ${
                                  filteredMovements[0].seismoScore && filteredMovements[0].seismoScore >= 7.5 
                                    ? 'text-seismo-extreme' 
                                    : filteredMovements[0].seismoScore && filteredMovements[0].seismoScore >= 5 
                                    ? 'text-seismo-high'
                                    : filteredMovements[0].seismoScore && filteredMovements[0].seismoScore >= 2.5
                                    ? 'text-seismo-moderate'
                                    : 'text-zinc-600'
                                }`}>
                                  {filteredMovements[0].seismoScore?.toFixed(1) || '0.0'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Narrative Section - Right on desktop, bottom on mobile */}
                    <div className="flex-1 p-4 md:p-6 lg:p-8 flex items-center">
                      <div className="space-y-3 md:space-y-4">
                        <p className="text-sm md:text-base text-zinc-200 leading-relaxed">
                          <span className="text-white font-semibold text-base md:text-lg">Markets beat newsrooms every time.</span> Trump&apos;s 
                          victory was priced in hours before networks called it. Biden&apos;s dropout leaked through 
                          betting odds before his staff knew. When smart money moves, probabilities shift — fast.
                        </p>
                        <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
                          This dashboard monitors all active market movements in real-time. The intensity score 
                          measures how sudden and significant each shift is — higher means more violent, more worth 
                          watching. When multiple related markets move together, something big is happening.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Window Indicator + Mobile Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-muted-foreground tracking-[0.15em] md:tracking-[0.2em]">
                      SEISMIC ACTIVITY • {getWindowLabel()} WINDOW
                    </h2>
                    
                    {/* Mobile Menu Button */}
                    <button 
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">SHOWING</span>
                    <span className="font-mono font-bold">{filteredMovements.length}</span>
                    <span className="text-muted-foreground">
                      {intensityFilter !== 'all' && `${intensityFilter.toUpperCase()} `}MOVEMENTS
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Scrollable Cards Section */}
              <div className="flex-1 overflow-y-auto overflow-x-visible px-4 md:px-6 pt-4 pb-6 relative">
                {/* Loading overlay for window change */}
                {isChangingWindow && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex gap-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-1 h-6 bg-seismo-pulse/60 rounded-full animate-pulse" 
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 transition-all duration-300 ease-in-out">
                  {filteredMovements.map((move) => (
                    <SeismoCard 
                      key={move.id} 
                      movement={move}
                      isSelected={selectedMovement?.id === move.id}
                      onClick={() => {
                        // Toggle selection - clicking same card closes panel
                        setSelectedMovement(selectedMovement?.id === move.id ? null : move);
                      }}
                    />
                  ))}
                </div>
                
                {filteredMovements.length === 0 && (
                  <div className="text-center py-24 bg-zinc-900/30 border border-zinc-800" style={{boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'}}>
                    <div className="text-lg font-semibold mb-2 text-foreground">Market Stability</div>
                    <div className="text-sm text-muted-foreground">
                      No significant movements in the {getWindowLabel().toLowerCase()} window
                    </div>
                    <div className="text-xs text-muted-foreground mt-4">
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
