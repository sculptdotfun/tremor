'use client';

import { useEffect, useState, memo } from 'react';

export const Header = memo(function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLive] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 h-14 flex items-center justify-between px-4 md:px-6" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.5)'}}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Minimalist seismograph icon */}
              <path 
                d="M2 12 L5 12 L7 6 L9 18 L11 3 L13 21 L15 3 L17 18 L19 6 L21 12 L22 12" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <h1 className="text-xs md:text-sm font-bold tracking-[0.15em] md:tracking-[0.2em]">SEISMO.ONE</h1>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">WORLD&apos;S FASTEST NEWS SOURCE</span>
            <span className="text-zinc-600">•</span>
            <span className="text-[10px] text-zinc-500 tracking-wide">MARKETS KNOW FIRST</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 text-xs">
          <button
            onClick={() => setShowAbout(!showAbout)}
            className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 hover:border-zinc-700"
          >
            How
          </button>
          <span className={`flex items-center gap-1 md:gap-2 ${isLive ? 'text-seismo-pulse' : 'text-muted-foreground'}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isLive ? 'bg-seismo-pulse animate-pulse' : 'bg-muted-foreground'}`}></span>
            <span className="hidden sm:inline">{isLive ? 'Live' : 'Offline'}</span>
          </span>
          <span className="text-muted-foreground font-mono hidden sm:inline">
            {currentTime.toISOString().slice(11, 19)} UTC
          </span>
          <span className="text-muted-foreground font-mono sm:hidden text-[10px]">
            {currentTime.toISOString().slice(11, 16)}
          </span>
        </div>
      </header>
      
      {/* About Modal */}
      {showAbout && (
      <>
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => setShowAbout(false)}
        />
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl p-4">
          <div className="bg-zinc-950 border border-zinc-800/50 flex flex-col max-h-[80vh] md:max-h-[85vh]"
            style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.8)'}}>
            {/* Header - fixed */}
            <div className="flex items-start justify-between p-4 md:p-6 border-b border-zinc-800/30">
              <h2 className="text-base md:text-lg font-bold text-zinc-100">How SEISMO.ONE Works</h2>
              <button
                onClick={() => setShowAbout(false)}
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            {/* Content - scrollable */}
            <div className="overflow-y-auto flex-1 p-4 md:p-6">
            <div className="space-y-4 text-xs md:text-sm">
              <div>
                <h3 className="font-semibold text-zinc-200 mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  The Core Insight
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Prediction markets aggregate real-time information from thousands of traders who have skin in the game. 
                  When big news is about to break, insiders and informed traders move first — causing sudden probability shifts 
                  that appear as &quot;tremors&quot; in our system.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-zinc-200 mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h18M12 3v18M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/>
                  </svg>
                  The Seismo Score (0-10)
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Our logarithmic scoring algorithm detects market earthquakes:
                </p>
                <ul className="list-none text-zinc-400 mt-2 space-y-1 ml-4">
                  <li>• <span className="text-zinc-200">Price Movement</span> — Percentage point changes in probability</li>
                  <li className="ml-4 text-xs">1pp → 1.0 | 2pp → 2.5 | 5pp → 5.0 | 10pp → 7.5 | 20pp+ → 10.0</li>
                  <li>• <span className="text-zinc-200">USD Volume</span> — Real money validates the movement</li>
                  <li className="ml-4 text-xs">&lt;$1K → No score | $1-10K → Gradual | $10K+ → Full multiplier</li>
                  <li>• <span className="text-zinc-200">Time Windows</span> — 5 min (flash), 1 hour (active), 24 hour (daily)</li>
                  <li>• <span className="text-zinc-200">Reversals</span> — Extra weight when crossing 50% probability</li>
                </ul>
                <p className="text-xs text-zinc-500 mt-2">
                  The algorithm aggregates all markets within an event, finding the biggest mover.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-zinc-200 mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  Why It&apos;s Powerful
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  Traditional news has a pipeline: event → reporter → editor → publication. Markets have no pipeline — 
                  they react instantly. Trump&apos;s 2024 victory was priced at 95% probability hours before any network called it. 
                  Biden&apos;s dropout leaked through betting odds before his own campaign knew.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-zinc-200 mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  What To Watch
                </h3>
                <ul className="list-none text-zinc-400 space-y-1 ml-4">
                  <li>• <span className="text-seismo-extreme font-semibold">Extreme (7.5+)</span> — Major event unfolding now</li>
                  <li>• <span className="text-seismo-high font-semibold">High (5-7.5)</span> — Significant news likely incoming</li>
                  <li>• <span className="text-seismo-moderate font-semibold">Moderate (2.5-5)</span> — Notable shifts worth monitoring</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-zinc-800/30">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  SEISMO.ONE monitors 500+ prediction markets in real-time, surfacing only the most significant movements. 
                  We&apos;re not predicting the future — we&apos;re showing you where smart money thinks it&apos;s heading.
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </>
      )}
    </>
  );
});