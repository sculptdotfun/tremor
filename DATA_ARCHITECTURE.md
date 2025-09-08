# Tremor Data Architecture - Current State

## Database Schema

### Core Tables

#### events
- `eventId`: string (primary key)
- `slug`: string (indexed)
- `title`: string
- `category`: string (indexed)
- `active`: boolean
- `closed`: boolean
- `archived`: boolean
- `image`: optional string
- `createdAt`: number
- `lastSyncedAt`: number

#### markets
- `conditionId`: string (primary key)
- `eventId`: string (indexed)
- `slug`: string (indexed)
- `question`: string
- `active`: boolean
- `closed`: boolean
- `archived`: boolean
- `marketId`: string
- `lastSyncedAt`: number

#### priceSnapshots
- `conditionId`: string (indexed)
- `price`: float64
- `timestampMs`: number (indexed)
- `createdAt`: number
- 48-hour retention

#### scores
- `eventId`: string (indexed)
- `window`: '5m' | '60m' | '1440m' (indexed)
- `seismoScore`: float64 (indexed)
- `timestampMs`: number
- `topMarketConditionId`: string
- `topMarketQuestion`: string
- `topMarketSlug`: string
- `topMarketCurrPrice01`: float64
- `topMarketPrevPrice01`: float64
- `marketMovements`: array
- 48-hour retention

#### trades
- `conditionId`: string (indexed)
- `txHash`: string
- `price`: float64
- `size`: float64
- `sizeUsd`: float64
- `side`: 'buy' | 'sell'
- `timestampMs`: number (indexed)
- 26-hour retention

#### marketSyncState
- `conditionId`: string (primary key)
- `priority`: number (0-100)
- `lastTradeTimestamp`: number
- `lastPriceChange`: float64
- `lastVolume24h`: float64
- `metrics`: object (various aggregations)

#### baselines
- `conditionId`: string (indexed)
- `windowType`: string
- `mean`: float64
- `stdDev`: float64
- `sampleCount`: number
- `lastUpdated`: number
- Computed nightly, not used in scoring

## Data Flow

### Ingestion Pipeline
1. **Events sync** - Every 2 minutes, fetch all events from Polymarket
2. **Market data sync**:
   - Hot markets (3) - Every 15 seconds
   - Warm markets (10) - Every 1 minute
   - Cold markets (50) - Every 5 minutes
   - Frozen markets - Every 10 minutes
3. **Trade fetching** - Per market based on priority tier
4. **Score computation** - Every minute for all windows

### Scoring Algorithm

```typescript
// Current implementation
const calculateSeismoScore = (
  priceChange: number,  // Percentage points
  volumeUsd: number,
  isReversal: boolean    // Crosses 50%
) => {
  // Price change component (logarithmic)
  const absChange = Math.abs(priceChange);
  let changeScore = 0;
  if (absChange >= 20) changeScore = 10;
  else if (absChange >= 10) changeScore = 7.5;
  else if (absChange >= 5) changeScore = 5.0;
  else if (absChange >= 2) changeScore = 2.5;
  else if (absChange >= 1) changeScore = 1.0;

  // Volume component (linear thresholds)
  let volumeMultiplier = 0;
  if (volumeUsd < 1000) volumeMultiplier = 0;
  else if (volumeUsd < 10000) volumeMultiplier = 0.5 + (volumeUsd / 20000);
  else volumeMultiplier = 1.0;

  // Reversal bonus
  const reversalBonus = isReversal ? 1.5 : 0;

  return Math.min(10, changeScore * volumeMultiplier + reversalBonus);
}
```

### Priority Calculation

```typescript
// 100-point priority system
const calculatePriority = (market) => {
  let score = 0;
  
  // Volume component (40 points)
  if (volume24h > 100000) score += 40;
  else if (volume24h > 10000) score += 30;
  else if (volume24h > 1000) score += 20;
  else if (volume24h > 100) score += 10;
  
  // Price volatility (30 points)
  if (priceChange24h > 0.1) score += 30;
  else if (priceChange24h > 0.05) score += 20;
  else if (priceChange24h > 0.02) score += 10;
  
  // Recency (30 points)
  const hoursSinceLastTrade = (Date.now() - lastTradeTime) / 3600000;
  if (hoursSinceLastTrade < 1) score += 30;
  else if (hoursSinceLastTrade < 6) score += 20;
  else if (hoursSinceLastTrade < 24) score += 10;
  
  return score;
}
```

## Performance Characteristics

### Data Volume
- ~500 events tracked
- ~2,000 active markets
- ~50,000 price snapshots/day
- ~100,000 trades/day
- ~150,000 scores computed/day

### Storage Usage
- Price snapshots: ~5MB/day
- Trades: ~10MB/day
- Scores: ~3MB/day
- Total growth: ~18MB/day before cleanup

### Query Patterns
- Score retrieval: ~1,000 queries/minute
- Market data fetches: ~500 API calls/minute
- Database writes: ~2,000 operations/minute

### Indexing Strategy
- `by_window_score`: (window, seismoScore) - Primary query pattern
- `by_event`: (eventId) - Event grouping
- `by_condition_time`: (conditionId, timestampMs) - Time series queries
- `by_timestamp`: (timestampMs) - Cleanup operations

## Cleanup Jobs
- Trades: Delete after 26 hours (hourly)
- Price snapshots: Delete after 48 hours (hourly)
- Scores: Delete after 48 hours (hourly)
- Activity: Delete after 7 days (daily)

## Cost Implications
- Convex database operations: ~$50/month
- Convex compute: ~$30/month
- Total infrastructure: ~$80/month at current scale

## Known Limitations
1. No outcome tracking (YES/NO leading)
2. No market resolution dates
3. No user interaction tracking
4. USD approximation using 0.5x multiplier
5. Baselines computed but unused
6. No cross-market correlation analysis
7. No pattern detection across time
8. Score history deleted after 48 hours