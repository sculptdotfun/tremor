# Seismo Schema & Data Flow Analysis

## Current Schema Structure ✅

### Tables:
1. **events** - Main events with metadata
2. **markets** - Individual prediction markets within events  
3. **priceSnapshots** - Time-series price data
4. **scores** - Computed seismo intensity scores
5. **baselines** - Statistical baselines for normalization
6. **marketSyncState** - Tracks sync priorities

## Data Flow

```
Polymarket API → Convex Actions → Database → Scoring → Frontend
```

### Current Flow:
1. **Every 2 minutes**: Sync events from Polymarket
2. **Every 15 seconds**: Sync hot market trades (high activity)
3. **Every 1 minute**: Sync warm market trades
4. **Every 1 minute**: Compute seismo scores
5. **Daily at 2 AM**: Compute statistical baselines

## Optimizations Needed

### 1. Data Retention Policy ⚠️
**Issue**: priceSnapshots will grow indefinitely
**Solution**: Add cleanup cron to remove snapshots older than 7 days

### 2. Score Retention ⚠️
**Issue**: Scores table will accumulate without cleanup
**Solution**: Keep only last 24 hours of scores per window

### 3. Market Volume Tracking 🔄
**Issue**: volume24hr needs rolling window calculation
**Solution**: Store hourly volume buckets for accurate 24hr calculations

### 4. Index Optimization ✅
Current indexes are good but consider adding:
- `scores.index("by_window_time", ["window", "timestampMs"])` for faster window queries

### 5. Sync Frequency Optimization
Current sync intervals are reasonable:
- Hot markets: 15s ✅
- Warm markets: 60s ✅  
- Events: 2m ✅

## Recommended Immediate Actions

1. **Add data retention policy**:
```typescript
// Add to crons.ts
crons.daily(
  "cleanup old data",
  { hourUTC: 3, minuteUTC: 0 },
  internal.actions.cleanupOldData
);
```

2. **Implement cleanupOldData action** to:
- Remove priceSnapshots older than 7 days
- Remove scores older than 24 hours
- Compact baselines older than 30 days

3. **Add volume bucketing** for accurate 24hr calculations

## Current Strengths ✅

1. **Efficient querying** - Good index coverage
2. **Smart sync prioritization** - Hot/warm/cold markets
3. **Aggregate scoring** - Event-level scores from market movements
4. **Proper relationships** - Clean foreign keys between tables
5. **Time-series support** - Timestamps on all relevant data

## Data Integrity ✅

- All required fields are properly typed
- Optional fields are correctly marked
- Indexes support all major query patterns
- No circular dependencies

## Performance Considerations

Current design should handle:
- ~500 active markets ✅
- ~50k price snapshots/day ✅
- ~1.4k scores/day ✅

With cleanup policies, the database will remain performant long-term.