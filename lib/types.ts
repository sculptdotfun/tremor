export type MarketSource = 'Polymarket' | 'Kalshi' | 'Manifold' | 'Metaculus';

export type MarketCategory =
  | 'POLITICS'
  | 'CRYPTO'
  | 'SPORTS'
  | 'ECONOMY'
  | 'TECH'
  | 'SCIENCE'
  | 'CULTURE';

export interface MarketMovement {
  id: string;
  eventId?: string; // Event ID for AI analysis linking
  title: string;
  category: MarketCategory;
  source: MarketSource;
  previousValue: number;
  currentValue: number;
  change: number;
  timestamp: Date;
  volume?: number;
  totalVolume?: number; // Total volume across all markets
  url?: string;
  image?: string; // Event image URL
  seismoScore?: number; // 0-10 normalized score
  // Individual market movements within this event
  marketMovements?: Array<{
    conditionId: string;
    question: string;
    prevPrice: number;
    currPrice: number;
    change: number; // pp change (signed)
    volume: number;
  }>;
  // Multi-market statistics
  multiMarketStats?: {
    totalMarkets: number;
    activeMarkets: number;
    marketsUp: number;
    marketsDown: number;
    averageChange: number;
    correlatedMovement: boolean;
  };
  components?: {
    momentum: number;
    volatility: number;
    volume: number;
    whales: number;
  };
}

export interface SuddenMove extends MarketMovement {
  alertLevel: 'high' | 'extreme';
  timeToChange: string;
}

export interface FilterState {
  categories: MarketCategory[];
  sources: MarketSource[];
  minChange: number;
  timeWindow: '1h' | '6h' | '24h';
  onlyHighVolume: boolean;
}
