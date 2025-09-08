import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// Compute baselines for a market (run nightly)
export const computeBaselines = internalMutation({
  args: {
    conditionId: v.string(),
    lookbackDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lookbackDays = args.lookbackDays || 14;
    const cutoff = Date.now() - (lookbackDays * 24 * 60 * 60 * 1000);
    
    // Get price snapshots for the lookback period
    const snapshots = await ctx.db
      .query("priceSnapshots")
      .withIndex("by_market_time", (q) => 
        q.eq("conditionId", args.conditionId)
         .gte("timestampMs", cutoff)
      )
      .collect();
    
    if (snapshots.length < 10) {
      // Not enough data for reliable baselines
      return { error: "Insufficient data" };
    }
    
    // Calculate price returns between consecutive snapshots
    const returns: number[] = [];
    const volumes: number[] = [];
    
    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];
      
      if (prev.price01 > 0) {
        const ret = (curr.price01 - prev.price01) / prev.price01;
        returns.push(ret);
      }
      
      volumes.push(curr.volumeSince || 0);
    }
    
    if (returns.length === 0) {
      return { error: "No valid returns" };
    }
    
    const p95TradeSize = 1000; // Default whale threshold
    
    const meanRet1m = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdRet1m = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - meanRet1m, 2), 0) / returns.length
    );
    const avgVol1m = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    // Upsert baseline
    const existing = await ctx.db
      .query("baselines")
      .withIndex("by_condition", (q) => q.eq("conditionId", args.conditionId))
      .first();
    
    const baseline = {
      conditionId: args.conditionId,
      computedAt: Date.now(),
      meanRet1m,
      stdRet1m: stdRet1m || 0.001, // Avoid division by zero
      p95TradeSize,
      avgVol1m,
      dayCount: lookbackDays,
    };
    
    if (existing) {
      await ctx.db.patch(existing._id, baseline);
    } else {
      await ctx.db.insert("baselines", baseline);
    }
    
    return baseline;
  },
});

// Compute Seismo score for an EVENT (aggregate all its markets)
export const computeEventScore = internalMutation({
  args: {
    eventId: v.string(),
    windowMinutes: v.number(), // 5, 60, or 1440 (1 day)
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowMs = args.windowMinutes * 60000;
    const cutoff = now - windowMs;

    // Get all markets for this event
    const markets = await ctx.db
      .query("markets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    
    if (markets.length === 0) {
      return { error: "No markets in event" };
    }

    // Get price snapshots for ALL markets in the event
    const snapshots = await ctx.db
      .query("priceSnapshots")
      .withIndex("by_event_time", (q) =>
        q.eq("eventId", args.eventId)
         .gte("timestampMs", cutoff)
      )
      .collect();

    if (snapshots.length < 2) {
      return { error: "Insufficient data" };
    }

    // Group snapshots by market to find the biggest mover
    const marketSnapshots = new Map<string, typeof snapshots>();
    for (const snapshot of snapshots) {
      if (!marketSnapshots.has(snapshot.conditionId)) {
        marketSnapshots.set(snapshot.conditionId, []);
      }
      marketSnapshots.get(snapshot.conditionId)!.push(snapshot);
    }

    // Find the market with biggest price change AND track all movements
    let maxChange = 0;
    let topMarketId = "";
    let topMarketQuestion = "";
    let totalVolume = 0;
    let topMarketVolume = 0;
    let activeMarkets = 0;
    let topPrev: number | undefined = undefined;
    let topCurr: number | undefined = undefined;
    
    // Track ALL market movements
    const allMovements: Array<{
      conditionId: string;
      question: string;
      prevPrice: number;
      currPrice: number;
      change: number;
      volume: number;
    }> = [];

    for (const [conditionId, mSnapshots] of marketSnapshots) {
      if (mSnapshots.length < 1) continue;
      // Ensure chronological order
      mSnapshots.sort((a, b) => a.timestampMs - b.timestampMs);
      
      // Get first and last prices in window
      const first = mSnapshots[0];
      const last = mSnapshots[mSnapshots.length - 1];
      const prev = first.price01;
      const curr = last.price01;
      
      // Use absolute probability change (in percentage points)
      const absoluteChange = (curr - prev) * 100; // Keep sign for direction
      const absoluteChangeMagnitude = Math.abs(absoluteChange);
      
      // Sum volume across all snapshots
      const marketVolume = mSnapshots.reduce((sum, s) => sum + (s.volumeSince || 0), 0);
      totalVolume += marketVolume;
      
      if (marketVolume > 0) activeMarkets++;
      
      // Find the market info
      const market = markets.find(m => m.conditionId === conditionId);
      const marketQuestion = market?.question || "Unknown";
      
      // Track ALL markets in the event (not just ones that moved)
      allMovements.push({
        conditionId,
        question: marketQuestion,
        prevPrice: prev,
        currPrice: curr,
        change: absoluteChange, // Signed change in pp
        volume: marketVolume,
      });
      
      // Track the biggest mover
      if (absoluteChangeMagnitude > Math.abs(maxChange)) {
        maxChange = absoluteChangeMagnitude; // Keep unsigned for scoring
        topMarketId = conditionId;
        topMarketQuestion = marketQuestion;
        topMarketVolume = marketVolume;
        // Store prices for UI
        topPrev = prev;
        topCurr = curr;
      }
    }
    
    // Sort movements by absolute change magnitude
    allMovements.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    // Score based on absolute probability change in percentage points
    // 2pp change = small (score ~2)
    // 5pp change = moderate (score ~5)  
    // 10pp change = large (score ~7.5)
    // 15pp+ change = extreme (score 10)
    
    const volumeThreshold = 5000; // Need decent volume for full score
    const liquidityMultiplier = Math.min(1, Math.sqrt(topMarketVolume / volumeThreshold));
    
    // Scale: 15 percentage points = max score of 10
    const raw = (Math.abs(maxChange) / 15) * 10 * liquidityMultiplier;
    const seismoScore = Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
    
    // Store the score with ALL market movements
    const windowStr = `${args.windowMinutes}m`;
    await ctx.db.insert("scores", {
      eventId: args.eventId,
      window: windowStr,
      timestampMs: now,
      seismoScore,
      topMarketId,
      topMarketChange: maxChange,
      topMarketQuestion,
      topMarketPrevPrice01: typeof topPrev === 'number' ? topPrev : undefined,
      topMarketCurrPrice01: typeof topCurr === 'number' ? topCurr : undefined,
      marketMovements: allMovements.length > 0 ? allMovements : undefined,
      totalVolume,
      topMarketVolume,
      activeMarkets,
    });
    
    return {
      eventId: args.eventId,
      window: windowStr,
      seismoScore,
      topMarketId,
      topMarketChange: maxChange,
    };
  },
});

// Get top tremors (highest scoring events)  
export const getTopTremors = query({
  args: {
    window: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const window = args.window || "60m";
    const limit = args.limit || 20;
    const cutoff = Date.now() - 5 * 60000; // Last 5 minutes of scores
    
    // Get recent EVENT scores
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_time_score", (q) => q.gte("timestampMs", cutoff))
      .filter((q) => q.eq(q.field("window"), window))
      .collect();
    
    // Deduplicate by eventId - keep only the most recent score per event
    const latestScores = new Map<string, typeof scores[0]>();
    for (const score of scores) {
      const existing = latestScores.get(score.eventId);
      if (!existing || score.timestampMs > existing.timestampMs) {
        latestScores.set(score.eventId, score);
      }
    }
    
    // Sort by seismo score and take limit
    const sortedScores = Array.from(latestScores.values())
      .sort((a, b) => b.seismoScore - a.seismoScore)
      .slice(0, limit);
    
    // Join with event data
    const results = await Promise.all(
      sortedScores.map(async (score) => {
        const event = await ctx.db
          .query("events")
          .withIndex("by_event", (q) => q.eq("eventId", score.eventId))
          .first();
        
        if (event) {
          // Get the top market that moved
          const topMarket = await ctx.db
            .query("markets")
            .withIndex("by_condition", (q) => q.eq("conditionId", score.topMarketId))
            .first();
          
          return {
            ...score,
            event,
            topMarket,
            priceChange: score.topMarketChange,
          };
        }
        return null;
      })
    );
    
    return results.filter(r => r !== null);
  },
});
