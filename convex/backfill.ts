import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export const backfillTradesForMarket = internalAction({
  args: {
    conditionId: v.string(),
    fromMs: v.number(),
    toMs: v.number(),
    stepHours: v.optional(v.number()),
    limitPerCall: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const step = (args.stepHours ?? 24) * 60 * 60 * 1000;
    const limit = args.limitPerCall ?? 1000;
    let inserted = 0;
    let start = args.fromMs;
    while (start < args.toMs) {
      const end = Math.min(args.toMs, start + step);
      const after = Math.floor(start / 1000);
      const params = new URLSearchParams({ market: args.conditionId, limit: String(limit), after: String(after) });
      const response = await fetch(`https://data-api.polymarket.com/trades?${params}`, { headers: { 'Accept': 'application/json' } });
      if (response.ok) {
        const trades = await response.json();
        if (Array.isArray(trades) && trades.length > 0) {
          const transformed = trades
            .filter((t: any) => t.price && t.size && t.timestamp)
            .map((t: any) => {
              const rawPrice = parseFloat(t.price || "0");
              const outcome = (t.outcome || t.filler?.outcome || "Yes").toLowerCase();
              const normalizedPrice = outcome === "no" ? 1 - rawPrice : rawPrice;
              return {
                conditionId: args.conditionId,
                eventId: args.conditionId,
                timestampMs: t.timestamp < 10000000000 ? t.timestamp * 1000 : t.timestamp,
                price01: normalizedPrice,
                size: parseFloat(t.size || "0"),
                side: t.side || "unknown",
                txHash: t.transactionHash || `${args.conditionId}_${t.timestamp}_${t.price}_${t.size}`,
              };
            });

          const result = await ctx.runMutation(internal.trades.insertTrades, { trades: transformed });
          inserted += result.inserted || 0;
          // Aggregate for this range
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await ctx.runMutation((internal as any).aggregation.aggregateSnapshotsHourly, { fromMs: start, toMs: end });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await ctx.runMutation((internal as any).aggregation.aggregateSnapshotsDaily, { fromMs: start, toMs: end });
        }
      }
      // throttle to be polite
      await sleep(300);
      start = end;
    }
    return { inserted };
  },
});

export const backfillAllActiveMarkets = internalAction({
  args: {
    days: v.number(),
    concurrency: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = Math.max(1, args.days);
    const fromMs = Date.now() - days * 24 * 60 * 60 * 1000;
    const toMs = Date.now();
    const concurrency = Math.max(1, Math.min(5, args.concurrency ?? 3));
    const markets = await ctx.runQuery(api.markets.getActiveMarkets, { limit: 200 });
    let idx = 0;
    let completed = 0;
    async function worker() {
      while (idx < markets.length) {
        const my = idx++;
        const m = markets[my];
        try {
          await (backfillTradesForMarket as any).handler(ctx, { conditionId: m.conditionId, fromMs, toMs, stepHours: 24, limitPerCall: 1000 });
        } catch (e) {
          // continue
        }
        completed++;
      }
    }
    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);
    // Recompute platform metrics for longer windows after backfill
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (internal as any).platformMetrics.computeAllPlatformMetrics(ctx, {});
    return { markets: markets.length, completed };
  },
});
/* eslint-disable @typescript-eslint/no-explicit-any */
