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
  autoShow = true 
}: OnboardingModalProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  useEffect(() => {
    if (!autoShow) return;
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('tremor-onboarding-seen');
    if (!hasSeenOnboarding) {
      // Small delay for page load
      setTimeout(() => setInternalIsOpen(true), 500);
    }
  }, [autoShow]);

  const handleClose = () => {
    setIsClosing(true);
    localStorage.setItem('tremor-onboarding-seen', 'true');
    setTimeout(() => {
      if (controlledOnClose) {
        controlledOnClose();
      } else {
        setInternalIsOpen(false);
      }
      setIsClosing(false);
      setCurrentStep(0); // Reset to first step
    }, 300);
  };

  const steps = [
    {
      icon: (
        <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12 L5 12 L7 6 L9 18 L11 3 L13 21 L15 3 L17 18 L19 6 L21 12 L22 12"
            stroke="url(#pulse-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF3A3A" />
              <stop offset="50%" stopColor="#FF8C42" />
              <stop offset="100%" stopColor="#FFB800" />
            </linearGradient>
          </defs>
        </svg>
      ),
      title: 'Market Tremors in Real-Time',
      description:
        'When prediction markets move suddenly, smart money knows something. We detect these tremors before news breaks.',
      visual: (
        <div className="relative h-32 w-full overflow-hidden rounded-lg bg-gradient-to-br from-zinc-900 to-black">
          <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute h-px w-full bg-gradient-to-r from-transparent via-tremor-extreme to-transparent"
                style={{
                  top: `${5 + i * 6}px`,
                  animation: `pulse ${2 + i * 0.1}s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end gap-1">
              {[3, 7, 4, 9, 5, 8, 10, 6, 4, 7].map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${
                    height >= 7
                      ? 'bg-tremor-extreme'
                      : height >= 5
                      ? 'bg-tremor-high'
                      : 'bg-tremor-moderate'
                  }`}
                  style={{
                    height: `${height * 8}px`,
                    animation: `grow ${0.5}s ease-out`,
                    animationDelay: `${i * 0.05}s`,
                    animationFillMode: 'both',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: (
        <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#FF8C42" strokeWidth="2" />
          <circle cx="12" cy="12" r="6" stroke="#FFB800" strokeWidth="2" />
          <circle
            cx="12"
            cy="12"
            r="2"
            fill="#FF3A3A"
            className="animate-pulse"
          />
        </svg>
      ),
      title: 'The Tremor Score',
      description:
        'Our algorithm scores movements from 0-10 based on price shifts, trading volume, and market dynamics.',
      visual: (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-20 text-xs font-semibold text-tremor-extreme">
              EXTREME
            </div>
            <div className="flex h-2 flex-1 gap-px">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-tremor-extreme"
                  style={{
                    animation: `fadeIn 0.5s ease-out`,
                    animationDelay: `${i * 0.05}s`,
                    animationFillMode: 'both',
                  }}
                />
              ))}
            </div>
            <div className="w-12 text-right text-sm font-bold text-tremor-extreme">
              7.5+
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 text-xs font-semibold text-tremor-high">HIGH</div>
            <div className="flex h-2 flex-1 gap-px">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i < 7 ? 'bg-tremor-high' : 'bg-zinc-800'}`}
                  style={{
                    animation: `fadeIn 0.5s ease-out`,
                    animationDelay: `${i * 0.05}s`,
                    animationFillMode: 'both',
                  }}
                />
              ))}
            </div>
            <div className="w-12 text-right text-sm font-bold text-tremor-high">
              5-7.5
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 text-xs font-semibold text-tremor-moderate">
              MODERATE
            </div>
            <div className="flex h-2 flex-1 gap-px">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i < 5 ? 'bg-tremor-moderate' : 'bg-zinc-800'}`}
                  style={{
                    animation: `fadeIn 0.5s ease-out`,
                    animationDelay: `${i * 0.05}s`,
                    animationFillMode: 'both',
                  }}
                />
              ))}
            </div>
            <div className="w-12 text-right text-sm font-bold text-tremor-moderate">
              2.5-5
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: (
        <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none">
          <path
            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke="#00FF88"
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="3" fill="#00FF88" className="animate-pulse" />
        </svg>
      ),
      title: 'Beat the News Cycle',
      description:
        "Markets move before headlines. Trump's victory was 95% certain in markets hours before networks called it.",
      visual: (
        <div className="relative space-y-2">
          <div className="flex items-center gap-3 rounded-lg border border-tremor-pulse/30 bg-tremor-pulse/5 p-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-tremor-pulse" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-tremor-pulse">
                MARKETS MOVE
              </div>
              <div className="text-[10px] text-zinc-500">Smart money acts</div>
            </div>
            <div className="text-xs font-bold text-tremor-pulse">-3h</div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 opacity-50">
            <div className="h-2 w-2 rounded-full bg-zinc-600" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-zinc-400">NEWS BREAKS</div>
              <div className="text-[10px] text-zinc-600">Media reports</div>
            </div>
            <div className="text-xs font-bold text-zinc-500">0h</div>
          </div>
        </div>
      ),
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 transform p-4 transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div
          className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black"
          style={{
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.1),
              0 10px 40px rgba(0,0,0,0.8),
              0 0 120px rgba(255,140,66,0.1)
            `,
          }}
        >
          {/* Animated background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-4 -top-4 h-32 w-32 animate-pulse rounded-full bg-tremor-extreme/20 blur-3xl" />
            <div className="absolute -bottom-4 -right-4 h-32 w-32 animate-pulse rounded-full bg-tremor-high/20 blur-3xl animation-delay-1000" />
          </div>

          {/* Content */}
          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/50 p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-tremor-high to-tremor-extreme">
                  <svg className="h-5 w-5 text-black" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M2 12 L5 12 L7 6 L9 18 L11 3 L13 21 L15 3 L17 18 L19 6 L21 12 L22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Welcome to Tremor</h2>
                  <p className="text-xs text-zinc-400">Where Money Talks First</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Step content */}
            <div className="p-6">
              <div className="mb-4 flex justify-center">{steps[currentStep].icon}</div>

              <h3 className="mb-3 text-center text-xl font-bold text-white">
                {steps[currentStep].title}
              </h3>

              <p className="mb-6 text-center text-sm leading-relaxed text-zinc-400">
                {steps[currentStep].description}
              </p>

              {/* Visual demonstration */}
              <div className="mb-6">{steps[currentStep].visual}</div>

              {/* Step indicators */}
              <div className="mb-6 flex justify-center gap-2">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`h-2 transition-all ${
                      i === currentStep
                        ? 'w-8 bg-gradient-to-r from-tremor-high to-tremor-extreme'
                        : 'w-2 bg-zinc-700 hover:bg-zinc-600'
                    } rounded-full`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    Back
                  </button>
                )}
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex-1 rounded-lg bg-gradient-to-r from-tremor-high to-tremor-extreme px-4 py-2.5 text-sm font-semibold text-black transition-all hover:opacity-90"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-lg bg-gradient-to-r from-tremor-pulse to-green-500 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:opacity-90"
                  >
                    Start Monitoring
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes grow {
          from {
            height: 0;
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </>
  );
}