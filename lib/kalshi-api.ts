import { logger } from '@/lib/logger';

export interface KalshiMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  category: string;
  startDate: string;
  endDate: string;
  description?: string;
  active: boolean;
  closed: boolean;
  marketType: string;
  outcome: string;
  outcomePrices: {
    [key: string]: number;
  };
  volume?: number;
  liquidity?: number;
  lastTradePrice?: number;
  lastTradeTime?: string;
  acceptingOrders: boolean;
  acceptingOrdersTimestamp: string;
}

export interface KalshiEvent {
  id: string;
  title: string;
  slug: string;
  category: string;
  description?: string;
  startDate: string;
  endDate: string;
  markets: KalshiMarket[];
}

export interface KalshiMarketSnapshot {
  market: KalshiMarket;
  timestamp: Date;
  priceChange1h?: number;
  priceChange24h?: number;
}

class KalshiAPI {
  private baseUrl = 'https://api.kalshi.com';
  private ws: WebSocket | null = null;
  private marketSnapshots: Map<string, KalshiMarketSnapshot> = new Map();

  async fetchMarkets(limit = 100): Promise<KalshiMarket[]> {
    try {
      // Use the proxy route like Polymarket does
      const response = await fetch(
        `/api/kalshi?endpoint=markets&limit=${limit}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error fetching Kalshi markets:', error);
      return [];
    }
  }

  async fetchEvents(limit = 50): Promise<KalshiEvent[]> {
    try {
      // For mock implementation, return empty events array
      logger.info('Fetching Kalshi events (mock implementation)');
      return [];
    } catch (error) {
      logger.error('Error fetching Kalshi events:', error);
      return [];
    }
  }

  async fetchMarketBySlug(slug: string): Promise<KalshiMarket | null> {
    try {
      // For mock implementation, return null
      logger.info(
        `Fetching Kalshi market by slug: ${slug} (mock implementation)`
      );
      return null;
    } catch (error) {
      logger.error('Error fetching Kalshi market:', error);
      return null;
    }
  }

  connectWebSocket(onMessage: (data: any) => void, onConnect?: () => void) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    if (this.ws) {
      logger.info('Kalshi WebSocket already connected');
      return;
    }

    logger.info('Kalshi WebSocket connection attempted (mock implementation)');

    // Create a proper mock WebSocket object to prevent errors
    this.ws = {
      close: () => {
        logger.info('Kalshi WebSocket disconnected (mock implementation)');
        this.ws = null;
      },
    } as WebSocket;

    // Mock successful connection
    if (onConnect) {
      setTimeout(onConnect, 1000);
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      // Use the mock close method we defined
      (this.ws as any).close(); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }

  calculatePriceChanges(markets: KalshiMarket[]): KalshiMarketSnapshot[] {
    const snapshots: KalshiMarketSnapshot[] = [];
    const now = new Date();

    markets.forEach((market) => {
      const snapshot: KalshiMarketSnapshot = {
        market,
        timestamp: now,
      };

      // Store snapshot for historical comparison
      const previousSnapshot = this.marketSnapshots.get(market.id);
      if (previousSnapshot) {
        // Calculate price changes if we have historical data
        const currentPrice = market.outcomePrices?.['Yes'] || 0;
        const previousPrice =
          previousSnapshot.market.outcomePrices?.['Yes'] || 0;

        if (previousPrice > 0) {
          const percentChange =
            ((currentPrice - previousPrice) / previousPrice) * 100;
          snapshot.priceChange1h = percentChange;
        }
      }

      this.marketSnapshots.set(market.id, snapshot);
      snapshots.push(snapshot);
    });

    return snapshots;
  }
}

export const kalshiAPI = new KalshiAPI();
