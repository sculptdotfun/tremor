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

    // 5-minute bucket size
    const BUCKET_MS = 5 * 60 * 1000;
    
    for (const [conditionId, marketTrades] of tradesByMarket) {
      if (marketTrades.length === 0) continue;

      // Build 5m buckets: timestamp -> { closeTs, closePrice, volume, eventId }
      const buckets = new Map<number, { closeTs: number; closePrice: number; volume: number; eventId: string }>();

      for (const trade of marketTrades) {
        const bucketTs = Math.floor(trade.timestampMs / BUCKET_MS) * BUCKET_MS;
        const prev = buckets.get(bucketTs);
        if (!prev) {
          buckets.set(bucketTs, { closeTs: trade.timestampMs, closePrice: trade.price01, volume: trade.size, eventId: trade.eventId });
        } else {
          const closeTs = trade.timestampMs >= prev.closeTs ? trade.timestampMs : prev.closeTs;
          const closePrice = trade.timestampMs >= prev.closeTs ? trade.price01 : prev.closePrice;
          buckets.set(bucketTs, { closeTs, closePrice, volume: prev.volume + trade.size, eventId: prev.eventId });
        }
      }

      // Upsert one snapshot per bucket
      for (const [bucketTs, data] of buckets) {
        // Optimistic upsert with retry-safe pattern
        const existing = await ctx.db
          .query("priceSnapshots")
          .withIndex("by_market_time", (q) => q.eq("conditionId", conditionId).eq("timestampMs", bucketTs))
          .first();

        if (existing) {
          try {
            await ctx.db.patch(existing._id, {
              price01: data.closePrice,
              volumeSince: data.volume,
            });
          } catch (e) {
            // HIGH PRIORITY FIX: Log error instead of silent failure
            console.warn(`Failed to patch snapshot for ${conditionId} at ${bucketTs}:`, e);
          }
        } else {
          try {
            await ctx.db.insert("priceSnapshots", {
              conditionId,
              eventId: data.eventId,
              timestampMs: bucketTs,
              price01: data.closePrice,
              volumeSince: data.volume,
            });
            snapshotsCreated++;
          } catch (e) {
            // HIGH PRIORITY FIX: Better race condition handling
            // Lost race; try to patch the document that was created by another process
            const again = await ctx.db
              .query("priceSnapshots")
              .withIndex("by_market_time", (q) => q.eq("conditionId", conditionId).eq("timestampMs", bucketTs))
              .first();
            if (again) {
              try {
                await ctx.db.patch(again._id, { 
                  price01: data.closePrice, 
                  volumeSince: (again.volumeSince || 0) + data.volume // Accumulate volume
                });
                console.log(`Successfully handled race condition for ${conditionId} at ${bucketTs}`);
              } catch (patchError) {
                console.error(`Failed to handle race condition for ${conditionId} at ${bucketTs}:`, patchError);
              }
            } else {
              console.warn(`Lost data for ${conditionId} at ${bucketTs} - snapshot disappeared`);
            }
          }
        }
      }
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