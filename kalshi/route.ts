import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '100';

  try {
    // This is where we would call the real Kalshi API
    // For now, we'll return mock data that matches the structure
    const mockMarkets = generateMockKalshiData(parseInt(limit));

    logger.info('Kalshi API returned:', mockMarkets.length, 'markets');
    return NextResponse.json(mockMarkets);
  } catch (error) {
    logger.error('Kalshi API failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Kalshi data' },
      { status: 500 }
    );
  }
}

function generateMockKalshiData(limit: number): any[] {
  // Create realistic mock Kalshi data
  const mockMarkets = [
    {
      id: 'kalshi_mock_1',
      question: 'Will the S&P 500 close above 5,500 this week?',
      slug: 'SP500-5500-WEEKLY',
      category: 'Economics',
      active: true,
      closed: false,
      outcomePrices: {
        Yes: 0.63, // $0.63 for "Yes"
        No: 0.37, // $0.37 for "No"
      },
      volume: 125000,
      volume24hr: 125000,
      lastTradePrice: 0.63,
      lastTradeTime: new Date().toISOString(),
      liquidity: 500000,
    },
    {
      id: 'kalshi_mock_2',
      question: 'Will it rain in NYC this Saturday?',
      slug: 'NYC-RAIN-SAT',
      category: 'Weather',
      active: true,
      closed: false,
      outcomePrices: {
        Yes: 0.75,
        No: 0.25,
      },
      volume: 45000,
      volume24hr: 45000,
      lastTradePrice: 0.75,
      lastTradeTime: new Date().toISOString(),
      liquidity: 150000,
    },
  ];

  // Return only the requested number of markets
  return mockMarkets.slice(0, limit);
}

function categorizeMarket(text: string): string {
  // Reuse the same categorization function from Polymarket
  const lower = text.toLowerCase();
  if (
    lower.includes('trump') ||
    lower.includes('biden') ||
    lower.includes('election') ||
    lower.includes('president')
  ) {
    return 'Politics';
  }
  if (
    lower.includes('bitcoin') ||
    lower.includes('btc') ||
    lower.includes('eth') ||
    lower.includes('crypto')
  ) {
    return 'Crypto';
  }
  if (
    lower.includes('fed') ||
    lower.includes('inflation') ||
    lower.includes('gdp') ||
    lower.includes('rate')
  ) {
    return 'Economics';
  }
  if (
    lower.includes('nfl') ||
    lower.includes('nba') ||
    lower.includes('game') ||
    lower.includes('win')
  ) {
    return 'Sports';
  }
  if (
    lower.includes('ai') ||
    lower.includes('tech') ||
    lower.includes('launch')
  ) {
    return 'Technology';
  }
  return 'General';
}
