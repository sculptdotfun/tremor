export interface PolymarketMarket {
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

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  category: string;
  description?: string;
  startDate: string;
  endDate: string;
  markets: PolymarketMarket[];
}

export interface MarketSnapshot {
  market: PolymarketMarket;
  timestamp: Date;
  priceChange1h?: number;
  priceChange24h?: number;
}

class PolymarketAPI {
  private baseUrl = 'https://gamma-api.polymarket.com';
  private wsUrl = 'wss://ws-subscriptions-clob.polymarket.com/ws/';
  private ws: WebSocket | null = null;
  private marketSnapshots: Map<string, MarketSnapshot> = new Map();

  async fetchMarkets(limit = 100): Promise<PolymarketMarket[]> {
    try {
      const response = await fetch(`/api/polymarket?endpoint=markets&limit=${limit}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching markets:', error);
      return [];
    }
  }

  async fetchEvents(limit = 50): Promise<PolymarketEvent[]> {
    try {
      const response = await fetch(`/api/polymarket?endpoint=events&limit=${limit}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  async fetchMarketBySlug(slug: string): Promise<PolymarketMarket | null> {
    try {
      const response = await fetch(`${this.baseUrl}/markets/${slug}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching market:', error);
      return null;
    }
  }

  connectWebSocket(onMessage: (data: any) => void, onConnect?: () => void) {
    if (this.ws) {
      console.log('WebSocket already connected');
      return;
    }

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      if (onConnect) onConnect();
      
      // Subscribe to activity (trades)
      const subscribeMessage = {
        type: 'subscribe',
        subscriptions: [
          {
            topic: 'activity',
            type: '*'
          }
        ]
      };
      this.ws?.send(JSON.stringify(subscribeMessage));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.ws = null;
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connectWebSocket(onMessage, onConnect), 5000);
    };
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  calculatePriceChanges(markets: PolymarketMarket[]): MarketSnapshot[] {
    const snapshots: MarketSnapshot[] = [];
    const now = new Date();

    markets.forEach(market => {
      const snapshot: MarketSnapshot = {
        market,
        timestamp: now
      };

      // Store snapshot for historical comparison
      const previousSnapshot = this.marketSnapshots.get(market.id);
      if (previousSnapshot) {
        // Calculate price changes if we have historical data
        const currentPrice = market.outcomePrices?.['Yes'] || 0;
        const previousPrice = previousSnapshot.market.outcomePrices?.['Yes'] || 0;
        
        if (previousPrice > 0) {
          const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;
          snapshot.priceChange1h = percentChange;
        }
      }

      this.marketSnapshots.set(market.id, snapshot);
      snapshots.push(snapshot);
    });

    return snapshots;
  }
}

export const polymarketAPI = new PolymarketAPI();