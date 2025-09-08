'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MarketMovement, SuddenMove, MarketCategory, MarketSource } from '@/lib/types';

export function useSeismoData(window: '5m' | '60m' | '1440m' = '60m') {
  // Get top tremors from Convex
  const topTremors = useQuery(api.scoring.getTopTremors, {
    window,
    limit: 50,
  });
  
  // Get active markets
  const activeMarkets = useQuery(api.markets.getActiveMarkets, {
    limit: 100,
  });
  
  // Convert to our frontend format
  const movements: MarketMovement[] = topTremors?.map(tremor => {
    // Prefer bucket-derived prices from score, fallback to market lastTradePrice
    const curr = tremor.topMarketCurrPrice01 ?? (tremor.topMarket?.lastTradePrice ?? 0);
    const prev = tremor.topMarketPrevPrice01 ?? (curr / (1 + (tremor.topMarketChange || 0)/100));
    const currentPrice = curr;
    const previousPrice = prev;
    const priceChangePercent = tremor.topMarketChange || 0;
    
    // Calculate multi-market stats
    const marketMoves = tremor.marketMovements || [];
    const activeMarkets = marketMoves.filter(m => Math.abs(m.change) > 0.1);
    const marketsUp = marketMoves.filter(m => m.change > 0).length;
    const marketsDown = marketMoves.filter(m => m.change < 0).length;
    const avgChange = marketMoves.length > 0 
      ? marketMoves.reduce((sum, m) => sum + Math.abs(m.change), 0) / marketMoves.length 
      : 0;
    const correlatedMovement = (marketsUp > 0 && marketsDown === 0) || (marketsDown > 0 && marketsUp === 0);
    
    return {
      id: tremor.eventId,
      title: tremor.event?.title || "Unknown Event",
      category: categorizeMarket(tremor.event?.category || tremor.event?.title || tremor.topMarketQuestion || "") as MarketCategory,
      source: 'Polymarket' as MarketSource,
      previousValue: Math.round(previousPrice * 100),
      currentValue: Math.round(currentPrice * 100),
      change: priceChangePercent,
      timestamp: new Date(tremor.timestampMs),
      totalVolume: tremor.totalVolume || tremor.event?.volume || 0,
      url: tremor.event?.slug ? `https://polymarket.com/event/${tremor.event.slug}` : '#',
      image: tremor.event?.image,
      seismoScore: tremor.seismoScore,
      marketMovements: marketMoves,
      multiMarketStats: marketMoves.length > 1 ? {
        totalMarkets: marketMoves.length,
        activeMarkets: activeMarkets.length,
        marketsUp,
        marketsDown,
        averageChange: avgChange,
        correlatedMovement,
      } : undefined,
    };
  })
  // drop items without a usable current price
  .filter(m => m.currentValue > 0) || [];
  
  // Filter for sudden moves (Seismo score > 7.5)
  const suddenMoves: SuddenMove[] = movements
    .filter(m => m.seismoScore && m.seismoScore > 7.5)
    .slice(0, 5)
    .map(m => ({
      ...m,
      alertLevel: m.seismoScore && m.seismoScore > 9 ? 'extreme' : 'high',
      timeToChange: calculateTimeToChange(m.timestamp),
    }));
  
  return {
    markets: activeMarkets || [],
    movements,
    suddenMoves,
    loading: !topTremors && !activeMarkets,
    connected: true, // Convex handles connection state
    refresh: () => {
      // Convex auto-refreshes with subscriptions
    },
  };
}

function categorizeMarket(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('trump') || lower.includes('biden') || lower.includes('election')) {
    return 'POLITICS';
  }
  if (lower.includes('bitcoin') || lower.includes('btc') || lower.includes('eth') || lower.includes('crypto')) {
    return 'CRYPTO';
  }
  if (lower.includes('fed') || lower.includes('inflation') || lower.includes('gdp')) {
    return 'ECONOMY';
  }
  if (lower.includes('nfl') || lower.includes('nba') || lower.includes('sports')) {
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
