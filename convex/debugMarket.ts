import { v } from "convex/values";
import { query } from "./_generated/server";

// Debug specific market
export const debugMarket = query({
  args: {
    conditionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get market details
    const market = await ctx.db
      .query("markets")
      .withIndex("by_condition", (q) => q.eq("conditionId", args.conditionId))
      .first();
    
    // Get sync state
    const syncState = await ctx.db
      .query("marketSyncState")
      .withIndex("by_condition", (q) => q.eq("conditionId", args.conditionId))
      .first();
    
    // Get recent price snapshots
    const recentSnapshots = await ctx.db
      .query("priceSnapshots")
      .withIndex("by_market_time", (q) => 
        q.eq("conditionId", args.conditionId)
      )
      .order("desc")
      .take(10);
    
    // Get event details
    let event = null;
    if (market?.eventId) {
      event = await ctx.db
        .query("events")
        .withIndex("by_event", (q) => q.eq("eventId", market.eventId))
        .first();
    }
    
    // Get scores for this event
    let scores = null;
    if (event) {
      scores = await ctx.db
        .query("scores_lite")
        .withIndex("by_event_window", (q) => q.eq("eventId", event.eventId))
        .collect();
    }
    
    const now = Date.now();
    const timeSinceLastSync = syncState ? now - syncState.lastTradeFetchMs : null;
    
    return {
      market,
      event,
      syncState,
      recentSnapshots,
      scores,
      debug: {
        hasMarket: !!market,
        hasEvent: !!event,
        hasSyncState: !!syncState,
        snapshotCount: recentSnapshots.length,
        timeSinceLastSyncMs: timeSinceLastSync,
        timeSinceLastSyncMinutes: timeSinceLastSync ? timeSinceLastSync / 60000 : null,
        isSyncing: syncState && syncState.lastTradeFetchMs > 0,
        priority: syncState?.priority || "unknown",
      }
    };
  },
});

// Debug event by ID
export const debugEvent = query({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get event
    const event = await ctx.db
      .query("events")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();
    
    // Get all markets for this event
    const markets = await ctx.db
      .query("markets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    
    // Get sync states for all markets
    const syncStates = await Promise.all(
      markets.map(async (market) => {
        const state = await ctx.db
          .query("marketSyncState")
          .withIndex("by_condition", (q) => q.eq("conditionId", market.conditionId))
          .first();
        return {
          conditionId: market.conditionId,
          question: market.question,
          syncState: state,
        };
      })
    );
    
    // Get recent snapshots for this event
    const recentSnapshots = await ctx.db
      .query("priceSnapshots")
      .withIndex("by_event_time", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .take(20);
    
    const now = Date.now();
    
    return {
      event,
      marketCount: markets.length,
      markets,
      syncStates,
      recentSnapshots: recentSnapshots.length,
      debug: {
        hasEvent: !!event,
        totalVolume24hr: markets.reduce((sum, m) => sum + m.volume24hr, 0),
        syncedMarkets: syncStates.filter(s => s.syncState && s.syncState.lastTradeFetchMs > 0).length,
        unsyncedMarkets: syncStates.filter(s => !s.syncState || s.syncState.lastTradeFetchMs === 0).length,
        priorities: syncStates.map(s => ({
          market: s.question,
          priority: s.syncState?.priority || "not set",
          lastSync: s.syncState?.lastTradeFetchMs ? new Date(s.syncState.lastTradeFetchMs).toISOString() : "never",
          minutesSinceSync: s.syncState?.lastTradeFetchMs ? (now - s.syncState.lastTradeFetchMs) / 60000 : null,
        })),
      }
    };
  },
});