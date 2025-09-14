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

  // Materialized lightweight scores for instant reads
  scores_lite: defineTable({
    eventId: v.string(),
    window: v.string(), // "5m", "60m", "1440m"
    updatedAt: v.number(),
    seismoScore: v.float64(), // 0-10
    topMarketId: v.optional(v.string()),
    topMarketChange: v.optional(v.float64()),
    topMarketQuestion: v.optional(v.string()),
    topMarketPrevPrice01: v.optional(v.float64()),
    topMarketCurrPrice01: v.optional(v.float64()),
    // Store full market movements array
    marketMovements: v.optional(v.array(v.object({
      conditionId: v.string(),
      question: v.string(),
      prevPrice: v.float64(),
      currPrice: v.float64(),
      change: v.float64(),
      volume: v.float64(),
    }))),
    totalVolume: v.optional(v.float64()),
    activeMarkets: v.optional(v.number()),
  })
    .index('by_event_window', ['eventId', 'window'])
    .index('by_window_score', ['window', 'seismoScore', 'updatedAt']),

  // Track last fetch time for each market
  marketSyncState: defineTable({
    conditionId: v.string(),
    lastTradeFetchMs: v.number(),
    lastTradeId: v.optional(v.string()),
    priority: v.string(), // "hot", "warm", "cold"
    lockedUntil: v.optional(v.number()),
  })
    .index('by_condition', ['conditionId'])
    .index('by_priority', ['priority', 'lastTradeFetchMs']),

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
