import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Events from Gamma API (with nested markets)
  events: defineTable({
    eventId: v.string(), // Event ID from API
    slug: v.string(), // Event slug for URLs
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    image: v.optional(v.string()), // Event image URL
    active: v.boolean(),
    closed: v.boolean(),
    liquidity: v.optional(v.float64()),
    volume: v.optional(v.float64()),
    volume24hr: v.float64(),
    volumeUsd24hr: v.optional(v.float64()), // USD volume for better sorting
    updatedAt: v.number(),
    lastScoreMs: v.optional(v.number()), // Track when last scored
  })
    .index('by_event', ['eventId'])
    .index('by_slug', ['slug'])
    .index('by_active_volume', ['active', 'volume24hr']) // Better name
    .index('by_score_time', ['lastScoreMs']), // For score scheduling

  // Individual markets within events
  markets: defineTable({
    conditionId: v.string(),
    eventId: v.string(), // Link to parent event
    question: v.string(),
    active: v.boolean(),
    closed: v.boolean(),
    lastTradePrice: v.float64(),
    bestBid: v.optional(v.float64()),
    bestAsk: v.optional(v.float64()),
    spread: v.optional(v.float64()), // Bid-ask spread for liquidity
    volume24hr: v.float64(),
    volumeUsd24hr: v.optional(v.float64()), // USD volume
    updatedAt: v.number(),
    lastChangeMs: v.optional(v.number()), // Track significant changes
  })
    .index('by_condition', ['conditionId'])
    .index('by_event', ['eventId'])
    .index('by_active_volume', ['active', 'volume24hr'])
    .index('by_recent_change', ['lastChangeMs']), // For activity detection

  // Price snapshots - optimized for time-series queries
  priceSnapshots: defineTable({
    conditionId: v.string(),
    eventId: v.string(),
    timestampMs: v.number(),
    price01: v.float64(),
    volumeSince: v.float64(), // Volume since last snapshot
    volumeUsdSince: v.optional(v.float64()), // USD volume
    priceChange: v.optional(v.float64()), // Change from previous snapshot
  })
    .index('by_market_time', ['conditionId', 'timestampMs'])
    .index('by_event_time', ['eventId', 'timestampMs'])
    .index('by_time', ['timestampMs']), // For cleanup queries

  // Aggregated price snapshots for longer horizons (hourly/daily bars)
  aggPriceSnapshots: defineTable({
    conditionId: v.string(),
    eventId: v.string(),
    granularity: v.string(), // '1h' | '1d'
    startMs: v.number(), // inclusive UTC boundary
    endMs: v.number(), // exclusive
    open01: v.float64(),
    high01: v.float64(),
    low01: v.float64(),
    close01: v.float64(),
    volumeSince: v.float64(),
    volumeUsdSince: v.optional(v.float64()),
  })
    .index('by_market_granularity_time', ['conditionId', 'granularity', 'startMs'])
    .index('by_event_granularity_time', ['eventId', 'granularity', 'startMs'])
    .index('by_granularity_time', ['granularity', 'startMs']),

  // Nightly baselines for normalization
  baselines: defineTable({
    conditionId: v.string(),
    computedAt: v.number(),
    meanRet1m: v.float64(),
    stdRet1m: v.float64(),
    // Extended baselines for longer horizons
    meanRet1h: v.optional(v.float64()),
    stdRet1h: v.optional(v.float64()),
    meanRet1d: v.optional(v.float64()),
    stdRet1d: v.optional(v.float64()),
    p95TradeSize: v.float64(),
    avgVol1m: v.float64(),
    dayCount: v.number(), // Days of data used
  }).index('by_condition', ['conditionId']),

  // Seismo scores PER EVENT (aggregated from all its markets)
  scores: defineTable({
    eventId: v.string(),
    window: v.string(), // "5m", "60m", "1440m" (24h)
    timestampMs: v.number(),
    seismoScore: v.float64(), // 0-10 normalized score
    // Track which market moved most
    topMarketId: v.string(), // conditionId of biggest mover
    topMarketChange: v.float64(), // its price change in pp
    topMarketQuestion: v.string(), // for display
    topMarketPrevPrice01: v.optional(v.float64()), // previous price (0-1)
    topMarketCurrPrice01: v.optional(v.float64()), // current price (0-1)
    isReversal: v.optional(v.boolean()), // Did it cross 50%?
    // ALL market movements in this event
    marketMovements: v.optional(
      v.array(
        v.object({
          conditionId: v.string(),
          question: v.string(),
          prevPrice: v.float64(),
          currPrice: v.float64(),
          change: v.float64(), // percentage points change (signed)
          volume: v.float64(),
          volumeUsd: v.optional(v.float64()),
        })
      )
    ),
    // Aggregate stats
    totalVolume: v.float64(), // Total volume across all markets
    totalVolumeUsd: v.optional(v.float64()), // Total USD volume
    topMarketVolume: v.optional(v.float64()), // Volume of the top market
    topMarketVolumeUsd: v.optional(v.float64()), // USD volume of top market
    activeMarkets: v.number(), // Number of markets with activity
  })
    .index('by_event_window_time', ['eventId', 'window', 'timestampMs'])
    .index('by_time_score', ['timestampMs', 'seismoScore'])
    .index('by_window_score', ['window', 'seismoScore', 'timestampMs']), // Better queries

  // Track last fetch time for each market
  marketSyncState: defineTable({
    conditionId: v.string(),
    lastTradeFetchMs: v.number(),
    lastTradeId: v.optional(v.string()),
    priority: v.string(), // "hot", "warm", "cold"
  })
    .index('by_condition', ['conditionId'])
    .index('by_priority', ['priority', 'lastTradeFetchMs']),

  // Platform volume metrics cache per window (for dynamic thresholds)
  platformMetrics: defineTable({
    window: v.string(), // '5m' | '60m' | '24h' | '7d' | '30d' | '1Q' | '1y' | 'q:YYYY-QN'
    computedAt: v.number(),
    platformUsd: v.float64(),
    rLo: v.float64(),
    rHi: v.float64(),
    rLoEma: v.optional(v.float64()),
    rHiEma: v.optional(v.float64()),
  })
    .index('by_window_time', ['window', 'computedAt'])
    .index('by_time', ['computedAt']),

  // AI-generated movement explanations
  aiAnalysis: defineTable({
    movementId: v.string(), // Links to score ID or unique movement identifier
    eventId: v.string(), // Links to event
    explanation: v.string(), // The AI-generated explanation
    sources: v.array(v.string()), // Citation URLs
    confidence: v.number(), // 0-100 confidence score
    category: v.optional(v.string()), // Event category for context
    generatedAt: v.number(), // Timestamp when generated
    expiresAt: v.number(), // When to regenerate (typically 24 hours)
    tokenCost: v.optional(v.number()), // Track API usage cost
    sourcesUsed: v.optional(v.number()), // Number of sources searched
  })
    .index('by_movement', ['movementId'])
    .index('by_event', ['eventId'])
    .index('by_expires', ['expiresAt']), // For cleanup/regeneration

  // Market summary for sidebar
  marketSummary: defineTable({
    summary: v.string(), // AI-generated market pulse
    totalMovements: v.number(), // Count of significant movements
    extremeMovements: v.number(), // Count of extreme movements (>7.5 score)
    topCategories: v.array(v.string()), // Most active categories
    generatedAt: v.number(), // When generated (for cache)
  }),
});
