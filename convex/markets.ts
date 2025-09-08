import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Upsert markets from Gamma API
export const upsertMarkets = internalMutation({
  args: {
    markets: v.array(
      v.object({
        conditionId: v.string(),
        eventId: v.optional(v.string()), // Link to parent event
        question: v.string(),
        active: v.boolean(),
        closed: v.boolean(),
        lastTradePrice: v.float64(),
        bestBid: v.optional(v.float64()),
        bestAsk: v.optional(v.float64()),
        volume24hr: v.float64(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    for (const market of args.markets) {
      // Check if market exists
      const existing = await ctx.db
        .query("markets")
        .withIndex("by_condition", (q) => q.eq("conditionId", market.conditionId))
        .first();

      const marketData = {
        conditionId: market.conditionId,
        eventId: market.eventId || existing?.eventId || market.conditionId, // Use eventId if provided
        question: market.question,
        active: market.active,
        closed: market.closed,
        lastTradePrice: market.lastTradePrice,
        bestBid: market.bestBid,
        bestAsk: market.bestAsk,
        volume24hr: market.volume24hr,
        updatedAt: now,
      };

      if (existing) {
        // Update existing market
        await ctx.db.patch(existing._id, marketData);
      } else {
        // Insert new market
        await ctx.db.insert("markets", marketData);
        
        // Initialize sync state for new market
        await ctx.db.insert("marketSyncState", {
          conditionId: market.conditionId,
          lastTradeFetchMs: 0,
          priority: market.volume24hr > 100000 ? "hot" : 
                   market.volume24hr > 10000 ? "warm" : "cold",
        });
      }
    }
    
    return { marketsProcessed: args.markets.length };
  },
});

// Get active markets sorted by volume
export const getActiveMarkets = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    const markets = await ctx.db
      .query("markets")
      .withIndex("by_active", (q) => q.eq("active", true))
      .order("desc")
      .take(limit);
    
    return markets;
  },
});

// Get a single market by conditionId
export const getMarketByConditionId = query({
  args: { conditionId: v.string() },
  handler: async (ctx, args) => {
    const market = await ctx.db
      .query("markets")
      .withIndex("by_condition", (q) => q.eq("conditionId", args.conditionId))
      .first();
    return market;
  },
});

// Get markets that need trade updates
export const getMarketsToSync = query({
  args: {
    priority: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const now = Date.now();
    
    // Different sync intervals by priority
    const syncIntervals = {
      hot: 15 * 1000,    // 15 seconds
      warm: 60 * 1000,   // 1 minute
      cold: 120 * 1000,  // 2 minutes
    };
    
    const interval = syncIntervals[args.priority as keyof typeof syncIntervals] || 60000;
    const cutoff = now - interval;
    
    const markets = await ctx.db
      .query("marketSyncState")
      .withIndex("by_priority", (q) => 
        q.eq("priority", args.priority)
      )
      .filter((q) => q.lt(q.field("lastTradeFetchMs"), cutoff))
      .take(limit);
    
    // Join with market data
    const results = await Promise.all(
      markets.map(async (state) => {
        const market = await ctx.db
          .query("markets")
          .withIndex("by_condition", (q) => q.eq("conditionId", state.conditionId))
          .first();
        return { ...state, market };
      })
    );
    
    return results.filter(r => r.market !== null);
  },
});

// Update market sync state after fetching trades
export const updateSyncState = internalMutation({
  args: {
    conditionId: v.string(),
    lastTradeFetchMs: v.number(),
    lastTradeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("marketSyncState")
      .withIndex("by_condition", (q) => q.eq("conditionId", args.conditionId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastTradeFetchMs: args.lastTradeFetchMs,
        lastTradeId: args.lastTradeId,
      });
    }
  },
});
