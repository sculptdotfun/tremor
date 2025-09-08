import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// Process trades directly into price snapshots
export const insertTrades = internalMutation({
  args: {
    trades: v.array(
      v.object({
        conditionId: v.string(),
        eventId: v.string(),
        timestampMs: v.number(),
        price01: v.float64(),
        size: v.float64(),
        side: v.string(),
        txHash: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.trades.length === 0) return { inserted: 0, total: 0 };
    
    // Sort trades by timestamp
    const sortedTrades = [...args.trades].sort((a, b) => a.timestampMs - b.timestampMs);
    
    // Group by market
    const tradesByMarket = new Map<string, typeof sortedTrades>();
    for (const trade of sortedTrades) {
      const key = trade.conditionId;
      if (!tradesByMarket.has(key)) {
        tradesByMarket.set(key, []);
      }
      tradesByMarket.get(key)!.push(trade);
    }
    
    let snapshotsCreated = 0;
    
    for (const [conditionId, marketTrades] of tradesByMarket) {
      if (marketTrades.length === 0) continue;
      
      // Process trades in chunks to create periodic snapshots
      let lastSnapshotTime = 0;
      let lastSnapshotPrice = 0;
      let accumulatedVolume = 0;
      
      // Get the most recent snapshot to continue from
      const existingSnapshot = await ctx.db
        .query("priceSnapshots")
        .withIndex("by_market_time", (q) => q.eq("conditionId", conditionId))
        .order("desc")
        .first();
      
      if (existingSnapshot) {
        lastSnapshotTime = existingSnapshot.timestampMs;
        lastSnapshotPrice = existingSnapshot.price01;
      }
      
      for (const trade of marketTrades) {
        accumulatedVolume += trade.size;
        
        // Skip trades older than our last snapshot
        if (trade.timestampMs <= lastSnapshotTime) continue;
        
        // Create snapshot if enough time passed or significant price change
        const timeSinceLastSnapshot = trade.timestampMs - lastSnapshotTime;
        const absolutePriceChange = Math.abs(trade.price01 - lastSnapshotPrice);
        
        const shouldCreateSnapshot = 
          lastSnapshotTime === 0 || // First snapshot
          timeSinceLastSnapshot >= 10 * 60000 || // 10 minutes minimum
          (timeSinceLastSnapshot >= 5 * 60000 && absolutePriceChange >= 0.03) || // 3pp change after 5 min
          absolutePriceChange >= 0.05; // 5pp change anytime is significant
        
        if (shouldCreateSnapshot) {
          // Check for duplicate at this timestamp
          const existing = await ctx.db
            .query("priceSnapshots")
            .withIndex("by_market_time", (q) => 
              q.eq("conditionId", conditionId)
               .eq("timestampMs", trade.timestampMs)
            )
            .first();
          
          if (!existing) {
            await ctx.db.insert("priceSnapshots", {
              conditionId,
              eventId: trade.eventId,
              timestampMs: trade.timestampMs,
              price01: trade.price01,
              volumeSince: accumulatedVolume,
            });
            snapshotsCreated++;
            
            // Reset for next snapshot
            lastSnapshotTime = trade.timestampMs;
            lastSnapshotPrice = trade.price01;
            accumulatedVolume = 0;
          }
        }
      }
    }
    
    // Clean up old snapshots (keep 26 hours for 24h scoring + buffer)
    // We score on 5m, 60m, and 24h (1440m) windows
    const cutoff = Date.now() - 26 * 60 * 60 * 1000; // 26 hours
    const oldSnapshots = await ctx.db
      .query("priceSnapshots")
      .filter((q) => q.lt(q.field("timestampMs"), cutoff))
      .take(100); // Limit deletions to avoid timeout
    
    for (const snapshot of oldSnapshots) {
      await ctx.db.delete(snapshot._id);
    }
    
    return { inserted: snapshotsCreated, total: args.trades.length };
  },
});

// Get recent price snapshots for a market
export const getRecentSnapshots = query({
  args: {
    conditionId: v.string(),
    minutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const minutes = args.minutes || 60;
    const cutoff = Date.now() - (minutes * 60000);
    
    const snapshots = await ctx.db
      .query("priceSnapshots")
      .withIndex("by_market_time", (q) => 
        q.eq("conditionId", args.conditionId)
         .gte("timestampMs", cutoff)
      )
      .collect();
    
    return snapshots;
  },
});