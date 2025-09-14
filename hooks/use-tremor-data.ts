'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  MarketMovement,
  SuddenMove,
  MarketCategory,
  MarketSource,
} from '@/lib/types';
import { useEffect, useRef, useState, useMemo } from 'react';

export function useTremorData(window: '5m' | '60m' | '1440m' = '60m') {
  // State for controlled updates
  const [displayedMovements, setDisplayedMovements] = useState<MarketMovement[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const updateTimer = useRef<NodeJS.Timeout>();
  const processedDataRef = useRef<MarketMovement[]>([]);
  
  // Get top tremors from Convex (still reactive, but we control when to show)
  const topTremors = useQuery(api.scoring.getTopTremors, {
    window,
    limit: 100, // Increase limit to get more data
  });
  
  // Get active markets
  const activeMarkets = useQuery(api.markets.getActiveMarkets, {
    limit: 100,
  });

  // Process and sort the raw data with stable sorting
  const processedMovements = useMemo(() => {
    if (!topTremors) return [];
    
    const movements = topTremors
      .map((tremor) => {
        // Prefer bucket-derived prices from score, fallback to market lastTradePrice
        const curr =
          tremor.topMarketCurrPrice01 ?? tremor.topMarket?.lastTradePrice ?? 0;
        // CRITICAL FIX: The backend sends PERCENTAGE POINT change, not percentage change!
        // If price goes from 90% to 100%, that's +10 percentage points (not +11.11% change)
        // So previous = current - change_in_points
        const prev =
          tremor.topMarketPrevPrice01 ??
          (tremor.topMarketChange !== undefined
            ? curr - (tremor.topMarketChange / 100) // Convert percentage points to decimal
            : curr);
        const currentPrice = curr;
        const previousPrice = prev;
        const priceChangePercent = tremor.topMarketChange || 0;

        // Calculate multi-market stats
        const marketMoves = tremor.marketMovements || [];
        const activeMarkets = marketMoves.filter(
          (m) => Math.abs(m.change) > 0.1
        );
        const marketsUp = marketMoves.filter((m) => m.change > 0).length;
        const marketsDown = marketMoves.filter((m) => m.change < 0).length;
        const avgChange =
          marketMoves.length > 0
            ? marketMoves.reduce((sum, m) => sum + Math.abs(m.change), 0) /
              marketMoves.length
            : 0;
        const correlatedMovement =
          (marketsUp > 0 && marketsDown === 0) ||
          (marketsDown > 0 && marketsUp === 0);

        return {
          id: tremor.eventId,
          eventId: tremor.eventId, // Include for AI analysis
          title: tremor.event?.title || 'Unknown Event',
          category: categorizeMarket(
            tremor.event?.category ||
              tremor.event?.title ||
              tremor.topMarketQuestion ||
              ''
          ) as MarketCategory,
          source: 'Polymarket' as MarketSource,
          previousValue: Math.round(previousPrice * 100),
          currentValue: Math.round(currentPrice * 100),
          change: priceChangePercent,
          timestamp: new Date(tremor.timestampMs),
          totalVolume: tremor.totalVolume || tremor.event?.volume || 0,
          url: tremor.event?.slug
            ? `https://polymarket.com/event/${tremor.event.slug}`
            : '#',
          image: tremor.event?.image,
          seismoScore: tremor.seismoScore,
          marketMovements: marketMoves,
          multiMarketStats:
            marketMoves.length > 1
              ? {
                  totalMarkets: marketMoves.length,
                  activeMarkets: activeMarkets.length,
                  marketsUp,
                  marketsDown,
                  averageChange: avgChange,
                  correlatedMovement,
                }
              : undefined,
        };
      })
      // CRITICAL FIX: Allow markets at 0%, only filter null/undefined
      .filter((m) => m.currentValue !== null && m.currentValue !== undefined)
      // Filter out zero intensity scores - no point showing markets with no movement
      .filter((m) => m.seismoScore && m.seismoScore > 0)
      // Stable sorting: Sort by seismoScore DESC, then by eventId for stability
      .sort((a, b) => {
        // Primary sort by seismoScore (descending)
        const scoreDiff = (b.seismoScore || 0) - (a.seismoScore || 0);
        if (scoreDiff !== 0) return scoreDiff;
        
        // Secondary sort by absolute change (descending) 
        const changeDiff = Math.abs(b.change || 0) - Math.abs(a.change || 0);
        if (changeDiff !== 0) return changeDiff;
        
        // Tertiary sort by volume for more dynamic ordering
        const volumeDiff = (b.totalVolume || 0) - (a.totalVolume || 0);
        if (volumeDiff !== 0) return volumeDiff;
        
        // Quaternary sort by eventId for final stability
        return a.eventId.localeCompare(b.eventId);
      });

    return movements;
  }, [topTremors]); // Only depend on topTremors data

  // Store latest processed data in ref
  useEffect(() => {
    processedDataRef.current = processedMovements;
  }, [processedMovements]);

  // Update display when data changes (if not paused)
  useEffect(() => {
    if (!isPaused && processedMovements.length > 0) {
      // Reduce debounce to 500ms for more responsive updates
      const timeoutId = setTimeout(() => {
        console.log('Data changed, updating display...', new Date().toLocaleTimeString());
        setDisplayedMovements(processedMovements);
        setLastUpdateTime(Date.now());
      }, 500); // Reduced debounce for more responsive updates
      
      return () => clearTimeout(timeoutId);
    }
  }, [processedMovements, isPaused]); // Simplified dependencies

  // Initial load - show data immediately when available
  useEffect(() => {
    if (displayedMovements.length === 0 && processedMovements.length > 0) {
      console.log('Initial data load:', processedMovements.length, 'items');
      setDisplayedMovements(processedMovements);
      setLastUpdateTime(Date.now());
    }
  }, [processedMovements.length]); // Run when data becomes available

  // When window changes, update immediately with new data
  useEffect(() => {
    console.log('Window changed to:', window, 'New data:', processedMovements.length, 'items');
    if (processedMovements.length > 0) {
      // Update immediately when window changes and we have data
      setDisplayedMovements(processedMovements);
      setLastUpdateTime(Date.now());
    }
  }, [window, processedMovements]); // Trigger on window change AND new data
  
  // Add real 10-second refresh timer
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        console.log('10s refresh tick', new Date().toLocaleTimeString());
        if (processedDataRef.current.length > 0) {
          setDisplayedMovements(processedDataRef.current);
          setLastUpdateTime(Date.now());
        }
      }, 10000); // 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [isPaused]); // Only depend on pause state

  // Filter for sudden moves (Seismo score > 7.5)
  const suddenMoves: SuddenMove[] = displayedMovements
    .filter((m) => m.seismoScore && m.seismoScore > 7.5)
    .slice(0, 5)
    .map((m) => ({
      ...m,
      alertLevel: m.seismoScore && m.seismoScore > 9 ? 'extreme' : 'high',
      timeToChange: calculateTimeToChange(m.timestamp),
    }));

  return {
    markets: activeMarkets || [],
    movements: displayedMovements, // Return the controlled, stable data
    suddenMoves,
    loading: !topTremors && !activeMarkets,
    connected: true,
    lastUpdateTime, // So UI can show "Last updated: X seconds ago"
    isPaused,
    togglePause: () => {
      setIsPaused(prev => {
        const newPaused = !prev;
        if (!newPaused && processedDataRef.current.length > 0) {
          // If unpausing, update immediately with latest data
          setDisplayedMovements(processedDataRef.current);
          setLastUpdateTime(Date.now());
        }
        return newPaused;
      });
    },
    refresh: () => {
      // Force immediate update
      if (processedDataRef.current.length > 0) {
        setDisplayedMovements(processedDataRef.current);
        setLastUpdateTime(Date.now());
      }
    },
  };
}

function categorizeMarket(text: string): string {
  const lower = text.toLowerCase();
  if (
    lower.includes('trump') ||
    lower.includes('biden') ||
    lower.includes('election')
  ) {
    return 'POLITICS';
  }
  if (
    lower.includes('bitcoin') ||
    lower.includes('btc') ||
    lower.includes('eth') ||
    lower.includes('crypto')
  ) {
    return 'CRYPTO';
  }
  if (
    lower.includes('fed') ||
    lower.includes('inflation') ||
    lower.includes('gdp')
  ) {
    return 'ECONOMY';
  }
  if (
    lower.includes('nfl') ||
    lower.includes('nba') ||
    lower.includes('sports')
  ) {
    return 'SPORTS';
  }
  if (lower.includes('ai') || lower.includes('tech')) {
    return 'TECH';
  }
  return 'ECONOMY';
}

function calculateTimeToChange(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}min`;
  }
  return `${minutes}min`;
}
