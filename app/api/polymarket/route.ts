import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '100';
  
  try {
    // Try CLOB API first for better active market data
    const clobUrl = `https://clob.polymarket.com/markets?limit=${limit}`;
    const clobResponse = await fetch(clobUrl, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (clobResponse.ok) {
      const data = await clobResponse.json();
      const markets = Array.isArray(data) ? data : (data.data || data.markets || []);
      logger.info('CLOB API returned:', markets.length, 'markets');
      
      // Filter and transform markets
      const activeMarkets = markets
        .filter((market: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          // Only include active markets with recent activity
          const hasValidPrice = market.price && parseFloat(market.price) > 0.01 && parseFloat(market.price) < 0.99;
          const isActive = market.active !== false;
          const hasVolume = parseFloat(market.volume || '0') > 0;
          return hasValidPrice && isActive && hasVolume;
        })
        .map((market: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const price = parseFloat(market.price || '0.5');
          return {
            id: market.condition_id || market.token_id || market.id,
            question: market.question || market.description || 'Unknown Market',
            slug: market.slug || market.condition_id,
            category: categorizeMarket(market.question || ''),
            active: true,
            closed: false,
            outcomePrices: {
              Yes: price,
              No: 1 - price
            },
            volume: parseFloat(market.volume || '0'),
            volume24hr: parseFloat(market.volume_24hr || market.volume || '0'),
            lastTradePrice: price,
            lastTradeTime: market.last_trade_time || new Date().toISOString(),
            liquidity: parseFloat(market.liquidity || '0')
          };
        })
        .sort((a: any, b: any) => b.volume24hr - a.volume24hr); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      logger.info('Active markets found:', activeMarkets.length);
      return NextResponse.json(activeMarkets);
    }
  } catch (clobError) {
    logger.error('CLOB API failed:', clobError);
  }
  
  // Fallback to Gamma API
  try {
    const gammaUrl = `https://gamma-api.polymarket.com/events?limit=50&active=true&closed=false`;
    const gammaResponse = await fetch(gammaUrl, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (gammaResponse.ok) {
      const events = await gammaResponse.json();
      logger.info('Gamma API returned:', events.length, 'events');
      
      const allMarkets: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
      events.forEach((event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (event.markets && Array.isArray(event.markets)) {
          event.markets.forEach((market: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            let yesPrice = 0;
            try {
              const prices = JSON.parse(market.outcomePrices || '[]');
              yesPrice = parseFloat(prices[0] || '0');
            } catch {
              // Skip markets with invalid prices
            }
            
            if (yesPrice > 0.01 && yesPrice < 0.99) {
              allMarkets.push({
                id: market.conditionId || market.id,
                question: market.question,
                slug: market.slug,
                category: categorizeMarket(market.question || event.title || ''),
                active: true,
                closed: false,
                outcomePrices: {
                  Yes: yesPrice,
                  No: 1 - yesPrice
                },
                volume: parseFloat(market.volume || '0'),
                volume24hr: parseFloat(event.volume24hr || '0'),
                lastTradePrice: yesPrice,
                lastTradeTime: new Date().toISOString(),
                liquidity: parseFloat(event.liquidity || '0')
              });
            }
          });
        }
      });
      
      allMarkets.sort((a, b) => b.volume24hr - a.volume24hr);
      logger.info('Active markets from Gamma:', allMarkets.length);
      return NextResponse.json(allMarkets);
    }
  } catch (gammaError) {
    logger.error('Gamma API also failed:', gammaError);
  }
  
  return NextResponse.json(
    { error: 'Failed to fetch Polymarket data' },
    { status: 500 }
  );
}

function categorizeMarket(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('trump') || lower.includes('biden') || lower.includes('election') || lower.includes('president')) {
    return 'Politics';
  }
  if (lower.includes('bitcoin') || lower.includes('btc') || lower.includes('eth') || lower.includes('crypto')) {
    return 'Crypto';
  }
  if (lower.includes('fed') || lower.includes('inflation') || lower.includes('gdp') || lower.includes('rate')) {
    return 'Economics';
  }
  if (lower.includes('nfl') || lower.includes('nba') || lower.includes('game') || lower.includes('win')) {
    return 'Sports';
  }
  if (lower.includes('ai') || lower.includes('tech') || lower.includes('launch')) {
    return 'Technology';
  }
  return 'General';
}