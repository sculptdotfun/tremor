'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface MovementExplainerProps {
  movement: {
    id?: string;
    eventId?: string;
    title: string;
    seismoScore?: number;
    currentValue: number;
    previousValue: number;
    category?: string;
    marketQuestion?: string;
  };
}

export function MovementExplainer({ movement }: MovementExplainerProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRequestedRef = useRef(false); // Prevent duplicate requests

  const movementId = movement.id || `${movement.eventId}-${Date.now()}`;

  // Query for existing analysis
  const analysis = useQuery(api.aiAnalysis.getAnalysis, {
    movementId,
  });

  // Action to request new analysis
  const requestAnalysis = useAction(api.aiAnalysis.requestAnalysis);

  // Auto-request analysis on mount if needed
  useEffect(() => {
    // Only run once, even with StrictMode
    if (hasRequestedRef.current || analysis !== undefined || isRequesting)
      return;

    const requestIfNeeded = async () => {
      // Only request if score is high enough
      if (movement.seismoScore && movement.seismoScore >= 5) {
        hasRequestedRef.current = true; // Mark as requested
        setIsRequesting(true);
        setError(null);

        try {
          const result = await requestAnalysis({
            movementId,
            eventId: movement.eventId || '',
            title: movement.title,
            category: movement.category,
            currentValue: movement.currentValue,
            previousValue: movement.previousValue,
            seismoScore: movement.seismoScore,
            marketQuestion: movement.marketQuestion,
          });

          if (!result.success) {
            setError(result.message || 'Failed to generate analysis');
            hasRequestedRef.current = false; // Allow retry on error
          }
        } catch (err) {
          console.error('Failed to request analysis:', err);
          setError('Failed to connect to AI service');
          hasRequestedRef.current = false; // Allow retry on error
        } finally {
          setIsRequesting(false);
        }
      }
    };

    requestIfNeeded();
  }, [movementId]); // Only depend on movementId to prevent re-runs

  // Don't show for low-impact movements
  if (!movement.seismoScore || movement.seismoScore < 5) {
    return null;
  }

  // Loading state
  const isLoading = isRequesting || (!analysis && !error);

  // Format sources for display
  const formatSource = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      if (domain.includes('x.com') || domain.includes('twitter.com'))
        return 'X/Twitter';
      if (domain.includes('reddit.com')) return 'Reddit';
      if (domain.includes('bloomberg.com')) return 'Bloomberg';
      if (domain.includes('reuters.com')) return 'Reuters';
      if (domain.includes('discord.com')) return 'Discord';
      return domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0];
    } catch {
      return 'Source';
    }
  };

  return (
    <div className="border-t border-zinc-800/50 bg-zinc-950">
      {/* Content Section - no header, straight to content */}
      <div className="p-4">
        {error ? (
          <div className="rounded-lg border border-red-900/30 bg-red-950/10 p-4">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs text-red-400/70 transition-colors hover:text-red-400"
                >
                  Try again →
                </button>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-2 w-2 animate-pulse rounded-full bg-seismo-pulse/60"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-400">
                {isRequesting
                  ? 'Tracking what traders are anticipating...'
                  : 'Loading signals...'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-zinc-800/30" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-800/30" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800/30" />
            </div>
            {isRequesting && (
              <div className="border-l-2 border-zinc-800 pl-3 text-[10px] text-zinc-600">
                Detecting early signals and insider sentiment before mainstream
                coverage...
              </div>
            )}
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {/* Main Analysis */}
            <div className="border border-zinc-800/50 bg-zinc-900/30 p-4">
              <div className="text-sm leading-relaxed text-zinc-200">
                {analysis.explanation ||
                  'Analysis generated but explanation text was not received. Please try refreshing.'}
              </div>
            </div>

            {/* Sources */}
            {analysis.sources && analysis.sources.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Early Signals From
                  </div>
                  {!analysis.isExpired && (
                    <div className="text-[9px] text-zinc-600">
                      {analysis.minutesUntilExpiry}m
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.sources.map((source, i) => {
                    // Extract username from X/Twitter URLs
                    const isX =
                      source.includes('x.com') ||
                      source.includes('twitter.com');
                    const username = isX ? source.split('/')[3] : null;

                    return (
                      <a
                        key={i}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-zinc-800/50 bg-zinc-900/50 px-2 py-1 text-[10px] text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-300"
                      >
                        <svg
                          className="h-2.5 w-2.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                        {username ? `@${username}` : formatSource(source)}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
