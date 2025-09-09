'use client';

import { useEffect, useState } from 'react';

interface OnboardingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoShow?: boolean;
}

export function OnboardingModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  autoShow = true,
}: OnboardingModalProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  useEffect(() => {
    if (!autoShow) return;
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('tremor-onboarding-seen');
    if (!hasSeenOnboarding) {
      // Small delay for page load
      setTimeout(() => setInternalIsOpen(true), 800);
    }
  }, [autoShow]);

  const handleClose = () => {
    localStorage.setItem('tremor-onboarding-seen', 'true');
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
    setCurrentStep(0); // Reset for next time
  };

  const steps = [
    {
      title: '01. MARKET TREMORS',
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg className="h-20 w-20" viewBox="0 0 24 24" fill="none">
              <path
                d="M2 12 L5 12 L7 6 L9 18 L11 3 L13 21 L15 3 L17 18 L19 6 L21 12 L22 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400"
              />
            </svg>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Smart money moves before news breaks. When insiders trade or big
            events unfold, prediction markets shift violently. We detect these
            tremors across 500+ markets in real-time.
          </p>
          <div className="space-y-2">
            <div className="rounded border border-zinc-800/50 bg-zinc-900/30 p-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-tremor-extreme" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Trump 2024: Markets called it at 95% while polls showed 50/50
                </span>
              </div>
            </div>
            <div className="rounded border border-zinc-800/50 bg-zinc-900/30 p-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-tremor-high" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Biden dropout: Odds shifted 3 hours before announcement
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '02. INTENSITY SCORING',
      content: (
        <div className="space-y-4">
          <div className="space-y-2 rounded border border-zinc-800/50 bg-zinc-900/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-tremor-extreme">
                EXTREME
              </span>
              <div className="flex h-1.5 w-32 gap-px">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex-1 bg-tremor-extreme" />
                ))}
              </div>
              <span className="text-[10px] font-bold text-zinc-400">7.5+</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-tremor-high">
                HIGH
              </span>
              <div className="flex h-1.5 w-32 gap-px">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${i < 7 ? 'bg-tremor-high' : 'bg-zinc-800'}`}
                  />
                ))}
                {[...Array(3)].map((_, i) => (
                  <div key={i + 7} className="flex-1 bg-zinc-800" />
                ))}
              </div>
              <span className="text-[10px] font-bold text-zinc-400">5-7.5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-tremor-moderate">
                MODERATE
              </span>
              <div className="flex h-1.5 w-32 gap-px">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex-1 bg-tremor-moderate" />
                ))}
                {[...Array(5)].map((_, i) => (
                  <div key={i + 5} className="flex-1 bg-zinc-800" />
                ))}
              </div>
              <span className="text-[10px] font-bold text-zinc-400">2.5-5</span>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Our logarithmic algorithm detects market earthquakes. Big moves get
            exponentially higher scores, and crossing 50% probability adds extra
            weight.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
            <div className="space-y-1">
              <div className="font-semibold text-zinc-300">Price Movement</div>
              <div className="text-zinc-500">5pp → 5.0 score</div>
              <div className="text-zinc-500">10pp → 7.5 score</div>
              <div className="text-zinc-500">20pp → 10.0 score</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-zinc-300">Validation</div>
              <div className="text-zinc-500">$10K+ volume required</div>
              <div className="text-zinc-500">Crossing 50% = 1.5x</div>
              <div className="text-zinc-500">Multi-market moves</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '03. TIME WINDOWS',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <button className="w-full border border-zinc-800/50 bg-zinc-950 p-3 text-left transition-all hover:border-zinc-600">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-100">
                    24 HOUR
                  </div>
                  <div className="text-xs text-zinc-500">Daily trends</div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  MACRO VIEW
                </div>
              </div>
            </button>
            <button className="w-full border border-tremor-high/30 bg-zinc-950 p-3 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-100">
                    1 HOUR
                  </div>
                  <div className="text-xs text-zinc-500">Active shifts</div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-tremor-high">
                  RECOMMENDED
                </div>
              </div>
            </button>
            <button className="w-full border border-zinc-800/50 bg-zinc-950 p-3 text-left transition-all hover:border-zinc-600">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-100">
                    5 MIN
                  </div>
                  <div className="text-xs text-zinc-500">Flash moves</div>
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  MICRO VIEW
                </div>
              </div>
            </button>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Choose your perspective: 24-hour for the full picture, 1-hour for
            active shifts, or 5-min for breaking developments. We default to
            24-hour for maximum insight.
          </p>
        </div>
      ),
    },
    {
      title: '04. INTELLIGENCE',
      content: (
        <div className="space-y-4">
          <div className="rounded border border-tremor-pulse/30 bg-tremor-pulse/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <svg
                className="h-4 w-4 text-tremor-pulse"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 24L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M9 12L11 14L15 10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider text-tremor-pulse">
                AI ANALYSIS
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              For high-intensity movements (5.0+), click &quot;Analyze&quot; to
              get AI-powered analysis of what traders might be anticipating.
            </p>
          </div>
          <div className="rounded border border-zinc-800/50 bg-zinc-900/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                TREMOR REPORT
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              Auto-generated every 30 minutes. Summarizes the most significant
              market movements across all categories.
            </p>
          </div>
        </div>
      ),
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform p-4">
        <div
          className="border border-zinc-800/50 bg-zinc-950"
          style={{
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.8)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/30 p-6">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2 12 L5 12 L7 6 L9 18 L11 3 L13 21 L15 3 L17 18 L19 6 L21 12 L22 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-400"
                />
              </svg>
              <div>
                <h2 className="text-base font-bold text-zinc-100">
                  {currentStep === 0 &&
                  !localStorage.getItem('tremor-onboarding-seen')
                    ? 'WELCOME TO TREMOR'
                    : 'HOW TREMOR WORKS'}
                </h2>
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  WHERE MONEY TALKS FIRST
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
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

          {/* Step indicator */}
          <div className="border-b border-zinc-800/30 px-6 py-3">
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-1 flex-1 transition-all ${
                    i <= currentStep ? 'bg-zinc-400' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              STEP {currentStep + 1} OF {steps.length}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-200">
              {steps[currentStep].title}
            </h3>
            {steps[currentStep].content}
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-zinc-800/30 p-6">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="group relative flex-1 overflow-hidden border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-300"
              >
                <span className="relative z-10">BACK</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-zinc-800/20 to-zinc-700/20 transition-transform group-hover:translate-x-0" />
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="group relative flex-1 overflow-hidden border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-zinc-100 transition-all hover:border-zinc-600 hover:bg-zinc-700"
              >
                <span className="relative z-10">NEXT</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-zinc-700/30 to-zinc-600/30 transition-transform group-hover:translate-x-0" />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="group relative flex-1 overflow-hidden border border-tremor-pulse/50 bg-tremor-pulse/10 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-tremor-pulse transition-all hover:border-tremor-pulse hover:bg-tremor-pulse/20"
              >
                <span className="relative z-10">START MONITORING</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-tremor-pulse/20 to-tremor-pulse/10 transition-transform group-hover:translate-x-0" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
