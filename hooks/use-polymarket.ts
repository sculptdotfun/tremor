'use client';

import { useEffect, useState, useCallback } from 'react';
import { polymarketAPI, PolymarketMarket } from '@/lib/polymarket-api';
import { MarketMovement, SuddenMove } from '@/lib/types';

export function usePolymarketData() {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [movements, setMovements] = useState<MarketMovement[]>([]);
  const [suddenMoves, setSuddenMoves] = useState<SuddenMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Map<string, number[]>>(new Map());
  const [lastPrices, setLastPrices] = useState<Map<string, number>>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('polymarket_last_prices');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return new Map(Object.entries(parsed));
        } catch (e) {
          console.error('Failed to parse stored prices:', e);
        }
      }
    }
    return new Map();
  });

  // Convert Polymarket data to our format
  const convertToMovement = (market: PolymarketMarket, previousPrice?: number): MarketMovement | null => {
    const currentPrice = market.outcomePrices?.['Yes'] || market.lastTradePrice || 0;
    const prevPrice = previousPrice || currentPrice;
    
    if (currentPrice === 0) {
      console.log('Skipping market with 0 price:', market.question);
      return null;
    }
    
    const change = prevPrice !== 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;
    
    return {
      id: market.id,
      title: market.question,
      category: mapCategory(market.category),
      source: 'Polymarket',
      previousValue: Math.round(prevPrice * 100),
      currentValue: Math.round(currentPrice * 100),
      change: Math.round(change),
      timestamp: new Date(market.lastTradeTime || Date.now()),
      volume: market.volume,
      url: `https://polymarket.com/event/${market.slug}`
    };
  };

  const mapCategory = (category: string): any => {
    const categoryMap: { [key: string]: any } = {
      'Politics': 'POLITICS',
      'Crypto': 'CRYPTO',
      'Sports': 'SPORTS',
      'Business': 'ECONOMY',
      'Technology': 'TECH',
      'Science': 'SCIENCE',
      'Pop Culture': 'CULTURE',
      'Economics': 'ECONOMY'
    };
    return categoryMap[category] || 'ECONOMY';
  };

  // Fetch initial markets
  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    try {
      const marketsData = await polymarketAPI.fetchMarkets(200);
      console.log('Fetched markets:', marketsData.length);
      console.log('Sample market:', marketsData[0]);
      setMarkets(marketsData);
      
      // Convert to movements
      const movementsList: MarketMovement[] = [];
      const suddenList: SuddenMove[] = [];
      
      marketsData.forEach(market => {
        const currentPrice = market.outcomePrices?.['Yes'] || market.lastTradePrice || 0;
        
        // Get last known price for this market
        const previousPrice = lastPrices.get(market.id);
        
        const movement = convertToMovement(market, previousPrice);
        
        if (movement) {
          // Calculate actual change if we have previous price
          if (previousPrice !== undefined && previousPrice !== currentPrice) {
            const actualChange = ((currentPrice - previousPrice) / previousPrice) * 100;
            movement.change = Math.round(actualChange * 10) / 10; // Round to 1 decimal
            movement.previousValue = Math.round(previousPrice * 100);
            movement.currentValue = Math.round(currentPrice * 100);
            
            // Check for sudden moves (>15% change)
            if (Math.abs(movement.change) >= 15) {
              suddenList.push({
                ...movement,
                alertLevel: Math.abs(movement.change) >= 30 ? 'extreme' : 'high',
                timeToChange: calculateTimeToChange(movement.timestamp)
              });
            }
          }
          
          movementsList.push(movement);
        }
        
        // Update last known price
        if (currentPrice > 0) {
          setLastPrices(prev => {
            const newMap = new Map(prev);
            newMap.set(market.id, currentPrice);
            // Save to localStorage
            if (typeof window !== 'undefined') {
              const pricesObj = Object.fromEntries(newMap);
              localStorage.setItem('polymarket_last_prices', JSON.stringify(pricesObj));
            }
            return newMap;
          });
        }
      });
      
      // Sort by absolute change
      movementsList.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      suddenList.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      
      console.log('Total movements found:', movementsList.length);
      console.log('Sudden moves found:', suddenList.length);
      setMovements(movementsList.slice(0, 50)); // Top 50 movements
      setSuddenMoves(suddenList.slice(0, 5)); // Top 5 sudden moves
    } catch (error) {
      console.error('Error fetching markets:', error);
    } finally {
      setLoading(false);
    }
  }, [priceHistory]);

  const calculateTimeToChange = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    }
    return `${minutes}min`;
  };

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'activity' && data.payload) {
      // Handle real-time trade data
      console.log('Trade activity:', data.payload);
      // Refresh markets when we get significant trades
      fetchMarkets();
    }
  }, [fetchMarkets]);

  useEffect(() => {
    // Initial fetch
    fetchMarkets();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchMarkets, 30000);
    
    // WebSocket disabled for now due to CORS - using polling instead
    // polymarketAPI.connectWebSocket(handleWebSocketMessage, () => {
    //   setConnected(true);
    // });
    
    return () => {
      clearInterval(interval);
      // polymarketAPI.disconnectWebSocket();
    };
  }, []);

  return {
    markets,
    movements,
    suddenMoves,
    loading,
    connected,
    refresh: fetchMarkets
  };
}