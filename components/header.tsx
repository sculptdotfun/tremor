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
      <header
        className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur-sm md:px-6"
        style={{
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg
              width="20"
              height="20"
              className="md:h-6 md:w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
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
            <h1 className="text-xs font-bold tracking-[0.15em] md:text-sm md:tracking-[0.2em]">
              TREMOR.LIVE
            </h1>
          </div>
          <div className="hidden items-center gap-2 text-xs lg:flex">
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">WHERE MONEY TALKS FIRST</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs md:gap-4">
          <button
            onClick={() => setShowAbout(!showAbout)}
            className="border border-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            How
          </button>
          {isLive && (
            <span className="flex items-center gap-1 rounded border border-tremor-pulse/50 bg-tremor-pulse/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tremor-pulse"></span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-tremor-pulse">
                LIVE
              </span>
            </span>
          )}
        </div>
      </header>

      {/* About Modal */}
      {showAbout && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAbout(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform p-4">
            <div
              className="flex max-h-[80vh] flex-col border border-zinc-800/50 bg-zinc-950 md:max-h-[85vh]"
              style={{
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.8)',
              }}
            >
              {/* Header - fixed */}
              <div className="flex items-start justify-between border-b border-zinc-800/30 p-4 md:p-6">
                <h2 className="text-base font-bold text-zinc-100 md:text-lg">
                  How TREMOR Works
                </h2>
                <button
                  onClick={() => setShowAbout(false)}
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

              {/* Content - scrollable */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="space-y-4 text-xs md:text-sm">
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-200">
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      The Core Insight
                    </h3>
                    <p className="leading-relaxed text-zinc-400">
                      Prediction markets aggregate real-time information from
                      thousands of traders who have skin in the game. When big
                      news is about to break, insiders and informed traders move
                      first — causing sudden probability shifts that appear as
                      &quot;tremors&quot; in our system.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-200">
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 12h18M12 3v18M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
                      </svg>
                      The Tremor Score (0-10)
                    </h3>
                    <p className="leading-relaxed text-zinc-400">
                      Our logarithmic scoring algorithm detects market
                      earthquakes:
                    </p>
                    <ul className="ml-4 mt-2 list-none space-y-1 text-zinc-400">
                      <li>
                        • <span className="text-zinc-200">Price Movement</span>{' '}
                        — Percentage point changes in probability
                      </li>
                      <li className="ml-4 text-xs">
                        1pp → 1.0 | 2pp → 2.5 | 5pp → 5.0 | 10pp → 7.5 | 20pp+ →
                        10.0
                      </li>
                      <li>
                        • <span className="text-zinc-200">USD Volume</span> —
                        Real money validates the movement
                      </li>
                      <li className="ml-4 text-xs">
                        &lt;$1K → No score | $1-10K → Gradual | $10K+ → Full
                        multiplier
                      </li>
                      <li>
                        • <span className="text-zinc-200">Time Windows</span> —
                        5 min (flash), 1 hour (active), 24 hour (daily)
                      </li>
                      <li>
                        • <span className="text-zinc-200">Reversals</span> —
                        Extra weight when crossing 50% probability
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-zinc-500">
                      The algorithm aggregates all markets within an event,
                      finding the biggest mover.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-200">
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      Why It&apos;s Powerful
                    </h3>
                    <p className="leading-relaxed text-zinc-400">
                      Traditional news has a pipeline: event → reporter → editor
                      → publication. Markets have no pipeline — they react
                      instantly. Trump&apos;s 2024 victory was priced at 95%
                      probability hours before any network called it.
                      Biden&apos;s dropout leaked through betting odds before
                      his own campaign knew.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-200">
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      What To Watch
                    </h3>
                    <ul className="ml-4 list-none space-y-1 text-zinc-400">
                      <li>
                        •{' '}
                        <span className="font-semibold text-tremor-extreme">
                          Extreme (7.5+)
                        </span>{' '}
                        — Major event unfolding now
                      </li>
                      <li>
                        •{' '}
                        <span className="font-semibold text-tremor-high">
                          High (5-7.5)
                        </span>{' '}
                        — Significant news likely incoming
                      </li>
                      <li>
                        •{' '}
                        <span className="font-semibold text-tremor-moderate">
                          Moderate (2.5-5)
                        </span>{' '}
                        — Notable shifts worth monitoring
                      </li>
                    </ul>
                  </div>

                  <div className="border-t border-zinc-800/30 pt-4">
                    <p className="text-xs leading-relaxed text-zinc-500">
                      TREMOR monitors 500+ prediction markets in real-time,
                      surfacing only the most significant movements. We&apos;re
                      not predicting the future — we&apos;re showing you where
                      smart money thinks it&apos;s heading.
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
