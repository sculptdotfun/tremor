# 📚 TREMOR API Reference

> Convex function documentation for developers

## Overview

TREMOR uses [Convex](https://convex.dev) as its backend, providing real-time, reactive functions. All API functions are TypeScript-based and can be called from the frontend using Convex hooks.

## 🔍 Queries

### scores.getLatestScores

Fetch the most recent tremor scores with filtering options.

```typescript
// Usage
const scores = useQuery(api.scores.getLatestScores, {
  timeWindow: "1h",
  minIntensity: 2.5,
  limit: 50
});

// Parameters
{
  timeWindow?: "5m" | "1h" | "24h"  // Default: "1h"
  minIntensity?: number              // Default: 0
  maxIntensity?: number              // Default: 10
  limit?: number                     // Default: 50
}

// Returns
Array<{
  _id: Id<"scores">
  eventId: Id<"events">
  eventTitle: string
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
}>
```

### events.getActive

Get all currently active prediction market events.

```typescript
// Usage
const events = useQuery(api.events.getActive, {
  category: "Politics",
  minVolume: 10000
});

// Parameters
{
  category?: string           // Filter by category
  minVolume?: number         // Minimum 24h volume
  search?: string            // Text search in title
  limit?: number             // Default: 100
}

// Returns
Array<{
  _id: Id<"events">
  eventId: string
  title: string
  description?: string
  category?: string
  imageUrl?: string
  marketsCount: number
  totalVolume: number
  status: "active" | "resolved" | "inactive"
}>
```

### markets.getByEvent

Fetch all markets for a specific event.

```typescript
// Usage
const markets = useQuery(api.markets.getByEvent, {
  eventId: 'event_123',
});

// Parameters
{
  eventId: Id<'events'>;
}

// Returns
Array<{
  _id: Id<'markets'>;
  marketId: string;
  question: string;
  outcome: 'Yes' | 'No';
  currentPrice: number; // 0-1 probability
  volume24hr: number;
  totalVolume: number;
  lastTradeTime: number;
  syncPriority: 'hot' | 'warm' | 'cold';
}>;
```

### priceSnapshots.getHistory

Get historical price data for a market.

```typescript
// Usage
const history = useQuery(api.priceSnapshots.getHistory, {
  marketId: "market_123",
  duration: "24h",
  resolution: "5m"
});

// Parameters
{
  marketId: Id<"markets">
  duration: "1h" | "6h" | "24h"
  resolution?: "1m" | "5m" | "1h"  // Data granularity
}

// Returns
Array<{
  timestamp: number
  price: number
  volume: number
  tradeCount: number
}>
```

### marketSummary.getCurrent

Get the AI-generated market summary for the sidebar.

```typescript
// Usage
const summary = useQuery(api.marketSummary.getCurrent);

// Returns
{
  summary: string
  bulletPoints: string[]
  timestamp: number
  topMovers: Array<{
    eventTitle: string
    score: number
    direction: "up" | "down"
  }>
}
```

### aiAnalysis.getForEvent

Retrieve AI analysis for a specific event's movement.

```typescript
// Usage
const analysis = useQuery(api.aiAnalysis.getForEvent, {
  eventId: "event_123"
});

// Parameters
{
  eventId: Id<"events">
}

// Returns
{
  analysis: string
  confidence: number
  factors: string[]
  timestamp: number
}
```

## 🔄 Mutations

### scores.computeScores

Manually trigger score computation (normally runs via cron).

```typescript
// Usage
const compute = useMutation(api.scores.computeScores);
await compute();

// Returns
{
  processed: number;
  errors: number;
  duration: number;
}
```

### events.syncFromPolymarket

Force sync events from Polymarket.

```typescript
// Usage
const sync = useMutation(api.events.syncFromPolymarket);
await sync({
  category: "Politics",
  forceUpdate: true
});

// Parameters
{
  category?: string
  forceUpdate?: boolean    // Skip cache
}

// Returns
{
  synced: number
  new: number
  updated: number
}
```

### markets.updateSyncPriority

Change the sync priority for a market.

```typescript
// Usage
const update = useMutation(api.markets.updateSyncPriority);
await update({
  marketId: 'market_123',
  priority: 'hot',
});

// Parameters
{
  marketId: Id<'markets'>;
  priority: 'hot' | 'warm' | 'cold';
}
```

## 🎯 Actions

Actions combine multiple operations and can call external APIs.

### syncMarketTrades

Sync recent trades for a specific market.

```typescript
// Internal action called by cron jobs
// Not directly callable from frontend

// Parameters
{
  marketId: string
  limit?: number
}

// Process
1. Fetch trades from Polymarket API
2. Normalize prices (handle YES/NO)
3. Store as price snapshots
4. Update market metadata
```

### generateAIAnalysis

Generate AI explanation for market movement.

```typescript
// Internal action called when significant movement detected

// Parameters
{
  eventId: Id<"events">
  priceChange: number
  volume: number
}

// Process
1. Gather context about event
2. Generate prompt for AI
3. Get analysis from AI service
4. Store in database
```

## 🕐 Cron Jobs

Automated tasks that maintain data freshness.

### Event Sync

- **Schedule**: Every 2 minutes
- **Function**: `actions:syncEvents`
- **Purpose**: Discover new events and update metadata

### Hot Market Trades

- **Schedule**: Every 15 seconds
- **Function**: `actions:syncHotMarketTrades`
- **Purpose**: Update high-volume markets (>$50k)

### Warm Market Trades

- **Schedule**: Every minute
- **Function**: `actions:syncWarmMarketTrades`
- **Purpose**: Update medium-volume markets ($5k-50k)

### Cold Market Trades

- **Schedule**: Every 5 minutes
- **Function**: `actions:syncColdMarketTrades`
- **Purpose**: Update low-volume markets (<$5k)

### Score Computation

- **Schedule**: Every minute
- **Function**: `mutations:computeScores`
- **Purpose**: Calculate intensity scores for all events

### Baseline Calculation

- **Schedule**: Daily at 2 AM UTC
- **Function**: `mutations:computeBaselines`
- **Purpose**: Update statistical baselines for normalization

### Data Cleanup

- **Schedule**: Daily at 3 AM UTC
- **Function**: `mutations:cleanupOldData`
- **Purpose**: Remove old snapshots and scores

## 🔐 Authentication

Currently, all read operations are public. Future versions will include:

```typescript
// Coming in v0.3
const user = useUser();

// Authenticated queries
const watchlist = useQuery(
  api.users.getWatchlist,
  user ? { userId: user.id } : 'skip'
);

// Protected mutations
const addToWatchlist = useMutation(api.users.addToWatchlist);
await addToWatchlist({
  eventId: 'event_123',
  alertThreshold: 5.0,
});
```

## 🚀 WebSocket Subscriptions

Real-time updates are handled automatically by Convex:

```typescript
// Component automatically re-renders on data change
function TremorDashboard() {
  // This updates in real-time
  const scores = useQuery(api.scores.getLatestScores);

  return <TremorGrid tremors={scores} />;
}
```

## 📊 Rate Limits

### Current Limits

- Queries: Unlimited (cached)
- Mutations: 100/minute per IP
- Actions: Internal only
- File uploads: Not supported

### Polymarket API Limits

- 100 requests/minute
- Handled automatically by sync system
- Exponential backoff on errors

## 🔧 Error Handling

All functions return consistent error formats:

```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: {
    code: "RATE_LIMIT" | "NOT_FOUND" | "INTERNAL_ERROR",
    message: string,
    details?: any
  }
}
```

## 📝 TypeScript Types

Key types used throughout the API:

```typescript
// Intensity level
type IntensityLevel = 'low' | 'moderate' | 'high' | 'extreme';

// Sync priority
type SyncPriority = 'hot' | 'warm' | 'cold';

// Market status
type MarketStatus = 'active' | 'resolved' | 'inactive';

// Time window
type TimeWindow = '5m' | '1h' | '24h';

// Score data
interface ScoreData {
  score5m: number;
  score1h: number;
  score24h: number;
  maxScore: number;
  intensityLevel: IntensityLevel;
}
```

## 🧪 Testing Functions

For development and testing:

```typescript
// Test connection
const ping = useQuery(api.system.ping);

// Get system stats
const stats = useQuery(api.system.stats);
// Returns: { events: number, markets: number, snapshots: number }

// Check health
const health = useQuery(api.system.health);
// Returns: { status: "healthy" | "degraded", checks: {...} }
```

## 📚 Usage Examples

### Basic Dashboard

```typescript
function Dashboard() {
  const scores = useQuery(api.scores.getLatestScores, {
    timeWindow: "1h",
    minIntensity: 2.5
  });

  if (!scores) return <Loading />;

  return (
    <div>
      {scores.map(score => (
        <TremorCard key={score._id} data={score} />
      ))}
    </div>
  );
}
```

### Market Detail View

```typescript
function MarketDetail({ eventId }: { eventId: Id<"events"> }) {
  const markets = useQuery(api.markets.getByEvent, { eventId });
  const analysis = useQuery(api.aiAnalysis.getForEvent, { eventId });

  return (
    <div>
      <MarketList markets={markets} />
      <AIAnalysis content={analysis} />
    </div>
  );
}
```

### Custom Filtering

```typescript
function FilteredTremors() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("1h");
  const [minScore, setMinScore] = useState(0);

  const scores = useQuery(api.scores.getLatestScores, {
    timeWindow,
    minIntensity: minScore,
    limit: 100
  });

  return (
    <>
      <Filters
        onTimeChange={setTimeWindow}
        onScoreChange={setMinScore}
      />
      <TremorList scores={scores} />
    </>
  );
}
```

## 🔗 External Integrations

### Webhook Format (Coming Soon)

```json
{
  "event": "tremor_detected",
  "timestamp": 1706745600000,
  "data": {
    "eventId": "event_123",
    "title": "2024 Presidential Election",
    "score": 8.5,
    "intensity": "extreme",
    "topMarket": {
      "question": "Will Trump win?",
      "priceChange": 0.15,
      "currentPrice": 0.45
    }
  }
}
```

---

_For more examples and implementation details, see the source code in `/convex` directory._
