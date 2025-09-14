
import { v } from "convex/values";
import { internalAction, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Compute Seismo score on read (no writes)
export const computeEventScore = query({
  args: {
    eventId: v.string(),
    windowMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowMs = args.windowMinutes * 60000;
    const cutoff = now - windowMs;

    const markets = await ctx.db
      .query("markets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    if (markets.length === 0) return { error: "No markets found for this event." };


    // For each market: get start/end 5m buckets via index lookups
    const marketSnapshots = new Map<string, { start?: any; end?: any }>();

    for (const m of markets) {
      const end = await ctx.db
        .query("priceSnapshots")
        .withIndex("by_market_time", (q) => q.eq("conditionId", m.conditionId).lte("timestampMs", now))
        .order("desc")
        .first();

      const start = await ctx.db
        .query("priceSnapshots")
        .withIndex("by_market_time", (q) => q.eq("conditionId", m.conditionId).lte("timestampMs", cutoff))
        .order("desc")
        .first();

      marketSnapshots.set(m.conditionId, { start, end });
    }

    // Find the market with biggest price change AND track all movements
    let maxChange = 0;
    let maxChangeAbs = 0;
    let topMarketId = "";
    let topMarketQuestion = "";
    let totalVolume = 0;
    let topMarketVolume = 0;
    let activeMarkets = 0;
    let topPrev: number | undefined = undefined;
    let topCurr: number | undefined = undefined;
    let highestVolumeMarketId = "";
    let highestVolumeMarketQuestion = "";
    let highestVolumeMarketVolume = 0;

    // Track ALL market movements
    const allMovements: Array<{
      conditionId: string;
      question: string;
      prevPrice: number;
      currPrice: number;
      change: number;
      volume: number;
    }> = [];

    for (const [conditionId, pair] of marketSnapshots) {
      const end = pair.end;
      if (!end) continue; // need an end point
      const start = pair.start;

      const prev = typeof start?.price01 === 'number' ? start.price01 : end.price01; // carry-forward
      const curr = typeof end.price01 === 'number' ? end.price01 : prev; // Ensure curr is valid

      // Guard against NaN
      if (!Number.isFinite(prev) || !Number.isFinite(curr)) continue;

      const signedChange = (curr - prev) * 100; // Keep sign for display
      const absoluteChangeMagnitude = Math.abs(signedChange);

      // Sum volume across the whole window for this market
      const vols = await ctx.db
        .query("priceSnapshots")
        .withIndex("by_market_time", (q) => q.eq("conditionId", conditionId).gte("timestampMs", cutoff))
        .filter((q) => q.lte(q.field("timestampMs"), now))
        .collect();
      const marketVolume = vols.reduce((sum, s) => sum + (s.volumeSince || 0), 0);
      totalVolume += marketVolume;
      if (marketVolume > 0) activeMarkets++;

      const market = markets.find(m => m.conditionId === conditionId);
      const marketQuestion = market?.question || "Unknown";

      allMovements.push({
        conditionId,
        question: marketQuestion,
        prevPrice: prev,
        currPrice: curr,
        change: signedChange, // Store signed change
        volume: marketVolume,
      });

      // Track highest volume market as fallback
      if (marketVolume > highestVolumeMarketVolume) {
        highestVolumeMarketId = conditionId;
        highestVolumeMarketQuestion = marketQuestion;
        highestVolumeMarketVolume = marketVolume;
      }

      // Track market with biggest change (by magnitude)
      if (absoluteChangeMagnitude > maxChangeAbs) {
        maxChangeAbs = absoluteChangeMagnitude;
        maxChange = signedChange; // Store signed value
        topMarketId = conditionId;
        topMarketQuestion = marketQuestion;
        topMarketVolume = marketVolume;
        topPrev = prev;
        topCurr = curr;
      }
    }
    
    allMovements.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    // Fallback to highest volume market if no price movement
    if (topMarketId === "" && highestVolumeMarketId !== "") {
      topMarketId = highestVolumeMarketId;
      topMarketQuestion = highestVolumeMarketQuestion;
      topMarketVolume = highestVolumeMarketVolume;
      // Find the prices for the highest volume market
      const hvmMovement = allMovements.find(m => m.conditionId === highestVolumeMarketId);
      if (hvmMovement) {
        topPrev = hvmMovement.prevPrice;
        topCurr = hvmMovement.currPrice;
        maxChange = hvmMovement.change; // Use the actual change (might be 0)
        maxChangeAbs = Math.abs(hvmMovement.change);
      }
    }

    const avgPrice = 0.5;
    const usdVolume = totalVolume * avgPrice;
    
    const minVolume = 1000;
    const fullVolume = 10000;
    
    const volumeMultiplier = usdVolume < minVolume ? 0 : 
      Math.min(1, Math.sqrt((usdVolume - minVolume) / (fullVolume - minVolume)));
    
    let baseScore: number;
    const absChange = maxChangeAbs; // Use the absolute value for scoring
    
    if (absChange < 1) {
      baseScore = absChange; // Linear for small changes
    } else if (absChange < 5) {
      baseScore = 1 + (absChange - 1) * 0.875; // Gradual increase
    } else if (absChange < 10) {
      baseScore = 4.5 + (absChange - 5) * 0.5; // Slower increase
    } else if (absChange < 20) {
      baseScore = 7 + (absChange - 10) * 0.3; // Asymptotic approach
    } else {
      baseScore = 10; // Max score
    }
    
    const seismoScore = Math.max(0, Math.min(10, Math.round(baseScore * volumeMultiplier * 10) / 10));
    
    const windowStr = `${args.windowMinutes}m`;
    
    return {
      eventId: args.eventId,
      window: windowStr,
      seismoScore,
      topMarketId,
      topMarketChange: maxChange, // Return signed change for display
      topMarketQuestion,
      topMarketPrevPrice01: topPrev,
      topMarketCurrPrice01: topCurr,
      marketMovements: allMovements,
      totalVolume,
      topMarketVolume,
      activeMarkets,
      timestampMs: now // FIX: Add timestamp for UI display
    };
  },
});


// Get top tremors (compute on read or from scores_lite)
export const getTopTremors = query({
  args: {
    window: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const window = args.window || "60m";
    const limit = args.limit || 20;

    // Prefer scores_lite if populated; otherwise compute on read for top active events
    const cached = await ctx.db
      .query("scores_lite")
      .withIndex("by_window_score", (q) => q.eq("window", window))
      .order("desc")
      .take(limit);

    const items = cached.length > 0 ? cached : [];

    // Join with event/market if available
    const results: any[] = [];
    for (const score of items) {
      const event = await ctx.db
        .query("events")
        .withIndex("by_event", (q) => q.eq("eventId", score.eventId))
        .first();
      const topMarket = score.topMarketId ? await ctx.db
        .query("markets")
        .withIndex("by_condition", (q) => q.eq("conditionId", score.topMarketId!))
        .first() : null;
      
      // Use stored marketMovements, or reconstruct minimal one if not available (for backwards compat)
      const marketMovements = score.marketMovements || 
        (score.topMarketId && topMarket ? [{
          conditionId: score.topMarketId,
          question: score.topMarketQuestion || topMarket.question || "Unknown Market",
          prevPrice: score.topMarketPrevPrice01 || 0,
          currPrice: score.topMarketCurrPrice01 || topMarket.lastTradePrice || 0,
          change: score.topMarketChange || 0,
          volume: 0
        }] : []);
      
      results.push({ 
        ...score, 
        event, 
        topMarket, 
        priceChange: score.topMarketChange,
        timestampMs: score.updatedAt,
        marketMovements,
        totalVolume: score.totalVolume,
        activeMarkets: score.activeMarkets
      });
    }

    return results;
  },
});


// Upsert a single score_lite row
export const upsertScoreLite = internalMutation({
  args: {
    eventId: v.string(),
    window: v.string(),
    seismoScore: v.number(),
    topMarketId: v.optional(v.string()),
    topMarketChange: v.optional(v.number()),
    topMarketQuestion: v.optional(v.string()),
    topMarketPrevPrice01: v.optional(v.float64()),
    topMarketCurrPrice01: v.optional(v.float64()),
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("scores_lite")
      .withIndex("by_event_window", (q) => q.eq("eventId", args.eventId).eq("window", args.window))
      .first();

    const doc = {
      eventId: args.eventId,
      window: args.window,
      updatedAt: Date.now(),
      seismoScore: args.seismoScore,
      topMarketId: args.topMarketId,
      topMarketChange: args.topMarketChange,
      topMarketQuestion: args.topMarketQuestion,
      topMarketPrevPrice01: args.topMarketPrevPrice01,
      topMarketCurrPrice01: args.topMarketCurrPrice01,
      marketMovements: args.marketMovements,
      totalVolume: args.totalVolume,
      activeMarkets: args.activeMarkets,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
    } else {
      await ctx.db.insert("scores_lite", doc as any);
    }
  },
});

// Materialize scores into scores_lite for instant lists
export const updateScoresLite = internalAction({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.runQuery(internal.events.getActiveEvents, { limit: 500 });
    const windows = [5, 60, 1440];
    const concurrency = 10;

    for (let i = 0; i < events.length; i += concurrency) {
      const batch = events.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (event) => {
          for (const windowMinutes of windows) {
            const scoreData = await ctx.runQuery(internal.scoring.computeEventScore, {
              eventId: event.eventId,
              windowMinutes,
            });
            if (!("error" in scoreData)) {
              await ctx.runMutation(internal.scoring.upsertScoreLite, {
                eventId: event.eventId,
                window: `${windowMinutes}m`,
                seismoScore: scoreData.seismoScore,
                topMarketId: scoreData.topMarketId,
                topMarketChange: scoreData.topMarketChange,
                topMarketQuestion: scoreData.topMarketQuestion,
                topMarketPrevPrice01: scoreData.topMarketPrevPrice01,
                topMarketCurrPrice01: scoreData.topMarketCurrPrice01,
                marketMovements: scoreData.marketMovements,
                totalVolume: scoreData.totalVolume,
                activeMarkets: scoreData.activeMarkets,
              });
            }
          }
        })
      );
    }
  },
});
