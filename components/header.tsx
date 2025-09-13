'use client';

import { useEffect, useState, memo } from 'react';
import { OnboardingModal } from './onboarding-modal';

export const Header = memo(function Header() {
  const [, setCurrentTime] = useState(new Date());
  const [isLive] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
          {/* GitHub Link */}
          <a
            href="https://github.com/sculptdotfun/tremor"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 transition-colors hover:text-white"
            aria-label="GitHub"
          >
            <svg
              className="h-4 w-4 md:h-5 md:w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>

          {/* X (Twitter) Link */}
          <a
            href="https://x.com/tremordotlive"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 transition-colors hover:text-white"
            aria-label="X (Twitter)"
          >
            <svg
              className="h-4 w-4 md:h-5 md:w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <button
            onClick={() => {
              // Show onboarding modal instead of old about modal
              setShowOnboarding(true);
            }}
            className="group relative overflow-hidden rounded border border-zinc-800 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 transition-all hover:border-tremor-high/50 hover:text-white"
          >
            <span className="relative z-10">How</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-tremor-high/20 to-tremor-extreme/20 transition-transform group-hover:translate-x-0" />
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

      {/* Onboarding Modal - controlled by button and auto-shows on first visit */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        autoShow={true}
      />
    </>
  );
});
