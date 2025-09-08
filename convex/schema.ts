import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_slug", ["slug"])
    .index("by_active", ["active", "volume24hr"]),

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
    volume24hr: v.float64(),
    updatedAt: v.number(),
  })
    .index("by_condition", ["conditionId"])
    .index("by_event", ["eventId"])
    .index("by_active", ["active", "volume24hr"]),

  // Price snapshots - keep only recent ones per market
  priceSnapshots: defineTable({
    conditionId: v.string(),
    eventId: v.string(),
    timestampMs: v.number(),
    price01: v.float64(),
    volumeSince: v.float64(), // Volume since last snapshot
  })
    .index("by_market_time", ["conditionId", "timestampMs"])
    .index("by_event_time", ["eventId", "timestampMs"]),

  // Nightly baselines for normalization
  baselines: defineTable({
    conditionId: v.string(),
    computedAt: v.number(),
    meanRet1m: v.float64(),
    stdRet1m: v.float64(),
    p95TradeSize: v.float64(),
    avgVol1m: v.float64(),
    dayCount: v.number(), // Days of data used
  })
    .index("by_condition", ["conditionId"]),

  // Seismo scores PER EVENT (aggregated from all its markets)
  scores: defineTable({
    eventId: v.string(),
    window: v.string(), // "5m", "60m", "1d"
    timestampMs: v.number(),
    seismoScore: v.float64(), // 0-10 normalized score
    // Track which market moved most
    topMarketId: v.string(), // conditionId of biggest mover
    topMarketChange: v.float64(), // its price change %
    topMarketQuestion: v.string(), // for display
    topMarketPrevPrice01: v.optional(v.float64()), // previous price (0-1)
    topMarketCurrPrice01: v.optional(v.float64()), // current price (0-1)
    // ALL market movements in this event (new!)
    marketMovements: v.optional(v.array(v.object({
      conditionId: v.string(),
      question: v.string(),
      prevPrice: v.float64(),
      currPrice: v.float64(),
      change: v.float64(), // percentage points change
      volume: v.float64(),
    }))),
    // Aggregate stats
    totalVolume: v.float64(), // Total volume across all markets
    topMarketVolume: v.optional(v.float64()), // Volume of the top market (shares)
    activeMarkets: v.number(), // Number of markets with activity
  })
    .index("by_event_window_time", ["eventId", "window", "timestampMs"])
    .index("by_time_score", ["timestampMs", "seismoScore"]),

  // Track last fetch time for each market
  marketSyncState: defineTable({
    conditionId: v.string(),
    lastTradeFetchMs: v.number(),
    lastTradeId: v.optional(v.string()),
    priority: v.string(), // "hot", "warm", "cold"
  })
    .index("by_condition", ["conditionId"])
    .index("by_priority", ["priority", "lastTradeFetchMs"]),
});
