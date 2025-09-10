# TREMOR Architecture

## System Overview

TREMOR is a Next.js application with a Convex backend for real-time data processing and storage.

```
Data Sources → Convex Backend → Next.js Frontend
     ↓              ↓                ↓
Polymarket API   Database      React Components
```

## Data Layer

### Database Schema

#### Core Tables

```typescript
// events - Prediction market events
{
  _id: Id<"events">
  eventId: string
  title: string
  description?: string
  category?: string
  imageUrl?: string
  marketsCount: number
  totalVolume: number
  createdAt: number
  endDate?: string
  status: "active" | "resolved" | "inactive"
}

// markets - Individual YES/NO questions
{
  _id: Id<"markets">
  eventId: Id<"events">
  marketId: string
  question: string
  outcome: "Yes" | "No"
  currentPrice: number  // 0-1 probability
  volume24hr: number
  totalVolume: number
  lastTradeTime: number
  syncPriority: "hot" | "warm" | "cold"
}

// priceSnapshots - Time-series price data
{
  _id: Id<"priceSnapshots">
  marketId: Id<"markets">
  timestamp: number
  price: number         // Normalized 0-1
  volume: number
  tradeCount: number
}

// scores - Computed intensity scores
{
  _id: Id<"scores">
  eventId: Id<"events">
  timestamp: number
  score5m: number
  score1h: number
  score24h: number
  maxScore: number
  topMarket: {
    marketId: string
    question: string
    priceChange: number
    currentPrice: number
  }
  metadata: {
    totalVolume: number
    avgVolume: number
    marketCount: number
  }
}
```

### Data Retention

| Table           | Retention | Purpose                 |
| --------------- | --------- | ----------------------- |
| Events          | Permanent | Reference data          |
| Markets         | Permanent | Market metadata         |
| Price Snapshots | 26 hours  | Recent price history    |
| Scores          | 48 hours  | Recent intensity scores |

## Real-time Processing

### Sync Priority System

Markets are categorized by 24-hour volume:

- **Hot** (>$50k): Sync every 15 seconds
- **Warm** ($5k-50k): Sync every minute
- **Cold** (<$5k): Sync every 5 minutes

### Cron Jobs

```typescript
// convex/crons.ts
{
  "sync events": "*/2 * * * *",        // Every 2 minutes
  "sync hot markets": "*/15 * * * * *", // Every 15 seconds
  "sync warm markets": "* * * * *",     // Every minute
  "sync cold markets": "*/5 * * * *",   // Every 5 minutes
  "compute scores": "* * * * *",        // Every minute
  "cleanup old data": "0 3 * * *"       // Daily at 3 AM UTC
}
```

## Scoring Algorithm

### Intensity Calculation (v2)

```typescript
function calculateIntensity(priceChange: number, volume: number): number {
  // Base score from price movement
  let baseScore: number;

  if (priceChange <= 0.01) baseScore = priceChange * 100;
  else if (priceChange <= 0.05) baseScore = 1 + (priceChange - 0.01) * 100;
  else if (priceChange <= 0.1) baseScore = 5 + (priceChange - 0.05) * 50;
  else if (priceChange <= 0.2) baseScore = 7.5 + (priceChange - 0.1) * 25;
  else baseScore = 10;

  // Volume multiplier
  let volumeMultiplier: number;

  if (volume < 1000) volumeMultiplier = 0;
  else if (volume < 10000) volumeMultiplier = volume / 10000;
  else volumeMultiplier = 1;

  return baseScore * volumeMultiplier;
}
```

### Multi-window Analysis

Scores are calculated for three time windows:

- 5 minutes: Immediate movements
- 1 hour: Short-term trends
- 24 hours: Daily changes

## Frontend Architecture

### Component Structure

```
App
├── Layout
│   ├── Header
│   └── Sidebar
├── Dashboard
│   ├── TremorGrid
│   │   └── TremorCard[]
│   └── TremorDetailPanel
└── OnboardingModal
```

### State Management

Using React hooks and Convex reactive queries:

```typescript
// Real-time data subscription
const tremors = useQuery(api.scores.getLatestScores, {
  timeWindow,
  intensityFilter,
  limit: 50,
});
```

## Data Flow

1. **Data Collection**: Polymarket API → Convex Actions
2. **Processing**: Price snapshots → Intensity scoring
3. **Storage**: Convex Database
4. **Delivery**: Reactive queries → React components
5. **Updates**: Automatic re-rendering on data changes

## API Integration

Current integration with Polymarket Gamma API:

- Events endpoint: Active events with markets
- Trade data: Recent transactions per market
- Price normalization: Handles YES/NO market types

## Performance Considerations

- Database indexes on frequently queried fields
- Prioritized syncing based on market activity
- Data cleanup to prevent unbounded growth
- Client-side caching via React Query

## Security

- Environment variables for sensitive data
- CORS configuration for API access
- Input validation on all mutations
- Rate limiting via Convex

## Deployment

- **Frontend**: Vercel or any Node.js host
- **Backend**: Convex cloud
- **Data Source**: Polymarket public API

---

_For implementation details, see source code in `/convex` and `/app` directories._
