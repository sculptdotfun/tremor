'use client';

import { useState, useEffect } from 'react';

interface MovementExplainerProps {
  movement: {
    title: string;
    seismoScore?: number;
    currentValue: number;
    previousValue: number;
    category?: string;
  };
}

// Mock explanations for demo - will be replaced with AI API
const mockExplanations: Record<string, string[]> = {
  politics: [
    'Breaking: New polling data from swing states showing unexpected momentum shift. Early reports from campaign insiders suggest internal polling triggered institutional repositioning.',
    'Congressional sources indicate potential policy announcement expected within hours. Smart money appears to be positioning ahead of official news.',
    'Social media sentiment analysis shows viral moment gaining traction. Algorithmic traders likely detected pattern 2-3 hours before mainstream coverage.',
  ],
  economics: [
    "Federal Reserve officials' recent comments being reinterpreted by markets. Subtle language changes in prepared remarks suggest policy shift more likely than previously thought.",
    'Unreported supply chain data from Asian markets indicating significant disruption. Shipping manifests and port activity suggest news will break in US markets tomorrow.',
    'Large institutional orders detected in related derivatives markets. Pattern consistent with insider knowledge of upcoming economic data release.',
  ],
  sports: [
    'Injury report rumors circulating in betting circles before official announcement. Team insiders likely leaked information to select groups.',
    'Weather conditions at venue drastically different than forecast. Professional bettors with on-ground sources adjusted positions 4 hours ago.',
    'Unexpected lineup change detected through social media activity of players. Smart contracts and automated betting systems picked up pattern.',
  ],
  crypto: [
    'On-chain analysis shows whale wallets accumulating aggressively. Transaction patterns suggest coordinated move by major holders.',
    'Regulatory filing detected in overseas jurisdiction. Automated systems parsed legal documents before human analysts.',
    "Developer activity on GitHub suggests major protocol upgrade imminent. Code commits indicate feature that wasn't publicly announced.",
  ],
  default: [
    'Significant order flow imbalance detected in the past hour. Large traders appear to have information not yet public.',
    'Cross-market correlations suggest this movement is part of a larger trend. Related markets showing similar patterns.',
    'Social media sentiment shifted dramatically following unverified reports. Algorithmic traders responding to viral content.',
  ],
};

const mockSources = [
  'Reuters Terminal',
  'Bloomberg Feed',
  'X/Twitter Firehose',
  'Reddit WSB',
  'Telegram Groups',
  'Discord Servers',
  'On-chain Data',
  'Satellite Imagery',
  'Flight Tracking',
  'LinkedIn Activity',
];

export function MovementExplainer({ movement }: MovementExplainerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [explanation, setExplanation] = useState<string>('');
  const [sources, setSources] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number>(0);

  useEffect(() => {
    // Simulate AI analysis delay
    const timer = setTimeout(
      () => {
        // Pick explanation based on category
        const category = movement.category?.toLowerCase() || 'default';
        const explanationPool =
          mockExplanations[category] || mockExplanations.default;
        const selectedExplanation =
          explanationPool[Math.floor(Math.random() * explanationPool.length)];

        // Pick 2-3 random sources
        const numSources = Math.floor(Math.random() * 2) + 2;
        const selectedSources = [...mockSources]
          .sort(() => Math.random() - 0.5)
          .slice(0, numSources);

        // Generate confidence based on score
        const baseConfidence = movement.seismoScore
          ? movement.seismoScore * 10
          : 50;
        const randomVariance = (Math.random() - 0.5) * 20;
        const finalConfidence = Math.min(
          95,
          Math.max(40, baseConfidence + randomVariance)
        );

        setExplanation(selectedExplanation);
        setSources(selectedSources);
        setConfidence(Math.round(finalConfidence));
        setIsAnalyzing(false);
      },
      1500 + Math.random() * 1000
    ); // 1.5-2.5 seconds

    return () => clearTimeout(timer);
  }, [movement]);

  // Only show for high-impact movements
  if (!movement.seismoScore || movement.seismoScore < 5) {
    return null;
  }

  return (
    <div className="border-t border-zinc-800/50 bg-zinc-950/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4">
              <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
                <path
                  d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 24L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 2Z"
                  className={
                    isAnalyzing ? 'stroke-zinc-600' : 'stroke-tremor-pulse'
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12L11 14L15 10"
                  className={
                    isAnalyzing ? 'stroke-zinc-600' : 'stroke-tremor-pulse'
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Intelligence Report
            </span>
          </div>
          {!isAnalyzing && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500">Confidence:</span>
              <span
                className={`text-[10px] font-bold ${
                  confidence >= 70
                    ? 'text-green-400'
                    : confidence >= 50
                      ? 'text-yellow-400'
                      : 'text-orange-400'
                }`}
              >
                {confidence}%
              </span>
            </div>
          )}
        </div>
      </div>

      {isAnalyzing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-2 animate-pulse rounded-full bg-tremor-pulse/60"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500">
              Analyzing movement patterns...
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-zinc-800/50" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-800/50" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800/50" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm leading-relaxed text-zinc-300">
            {explanation}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Sources:
            </span>
            <div className="flex flex-wrap gap-1">
              {sources.map((source, i) => (
                <span
                  key={i}
                  className="rounded-full border border-zinc-800 bg-zinc-900/50 px-2 py-0.5 text-[10px] text-zinc-400"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 border-t border-zinc-800/30 pt-3">
            <button className="flex items-center gap-1 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 7V12L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>
                Analyzed {Math.floor(Math.random() * 10) + 2} mins ago
              </span>
            </button>
            <button className="flex items-center gap-1 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M16 6L12 2L8 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 2V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>Share Analysis</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
