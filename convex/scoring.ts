import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

function quarterStart(date: Date): Date {
  const month = date.getUTCMonth();
  const q = Math.floor(month / 3);
  const startMonth = q * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), startMonth, 1, 0, 0, 0, 0));
}

function parseWindowStr(window: string): { startMs: number; endMs: number; granularity: 'raw'|'1h'|'1d'; windowStr: string } {
  const now = Date.now();
  const endMs = now;
  if (window === '5m') return { startMs: endMs - 5 * 60 * 1000, endMs, granularity: 'raw', windowStr: '5m' };
  if (window === '60m') return { startMs: endMs - 60 * 60 * 1000, endMs, granularity: 'raw', windowStr: '60m' };
  if (window === '24h' || window === '1440m') return { startMs: endMs - 24 * 60 * 60 * 1000, endMs, granularity: 'raw', windowStr: '1440m' };
  if (window === '7d' || window === '10080m') return { startMs: endMs - 7 * 24 * 60 * 60 * 1000, endMs, granularity: '1h', windowStr: '10080m' };
  if (window === '30d' || window === '43200m') return { startMs: endMs - 30 * 24 * 60 * 60 * 1000, endMs, granularity: '1d', windowStr: '43200m' };
  if (window === '1y' || window === '525600m') return { startMs: endMs - 365 * 24 * 60 * 60 * 1000, endMs, granularity: '1d', windowStr: '525600m' };
  if (window === '1Q') {
    const nowDate = new Date(endMs);
    const start = quarterStart(nowDate).getTime();
    return { startMs: start, endMs, granularity: '1d', windowStr: '1Q' };
  }
  // q:YYYY-QN format
  if (window.startsWith('q:')) {
    const m = window.match(/^q:(\d{4})-Q([1-4])$/);
    if (m) {
      const year = parseInt(m[1], 10);
      const qi = parseInt(m[2], 10) - 1;
      const start = Date.UTC(year, qi * 3, 1, 0, 0, 0, 0);
      const end = Date.UTC(year, qi * 3 + 3, 1, 0, 0, 0, 0);
      return { startMs: start, endMs: Math.min(end, endMs), granularity: '1d', windowStr: window };
    }
  }
  // default 24h
  return { startMs: endMs - 24 * 60 * 60 * 1000, endMs, granularity: 'raw', windowStr: '1440m' };
}

function baseScoreFromPpChange(absChange: number): number {
  if (absChange < 1) {
    return absChange; // Linear for very small changes
  } else if (absChange < 5) {
    return 1 + (absChange - 1) * 0.875;
  } else if (absChange < 10) {
    return 4.5 + (absChange - 5) * 0.5;
  } else if (absChange < 20) {
    return 7 + (absChange - 10) * 0.3;
  } else {
    return 10;
  }
}

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

    // Compute hourly returns from 1h bars (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const hourlyBars = await ctx.db
      .query("aggPriceSnapshots")
      .withIndex("by_market_granularity_time", (q) =>
        q.eq("conditionId", args.conditionId).eq("granularity", "1h").gte("startMs", thirtyDaysAgo)
      )
      .collect();
    let meanRet1h = 0;
    let stdRet1h = 0;
    if (hourlyBars.length >= 3) {
      hourlyBars.sort((a, b) => a.startMs - b.startMs);
      const rets: number[] = [];
      for (let i = 1; i < hourlyBars.length; i++) {
        const prev = hourlyBars[i - 1].close01;
        const curr = hourlyBars[i].close01;
        if (prev > 0) rets.push((curr - prev) / prev);
      }
      if (rets.length > 0) {
        meanRet1h = rets.reduce((a, b) => a + b, 0) / rets.length;
        stdRet1h = Math.sqrt(
          rets.reduce((sum, r) => sum + Math.pow(r - meanRet1h, 2), 0) / rets.length
        );
      }
    }

    // Compute daily returns from 1d bars (last 180-365 days)
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const dailyBars = await ctx.db
      .query("aggPriceSnapshots")
      .withIndex("by_market_granularity_time", (q) =>
        q.eq("conditionId", args.conditionId).eq("granularity", "1d").gte("startMs", oneYearAgo)
      )
      .collect();
    let meanRet1d = 0;
    let stdRet1d = 0;
    if (dailyBars.length >= 3) {
      dailyBars.sort((a, b) => a.startMs - b.startMs);
      const rets: number[] = [];
      for (let i = 1; i < dailyBars.length; i++) {
        const prev = dailyBars[i - 1].close01;
        const curr = dailyBars[i].close01;
        if (prev > 0) rets.push((curr - prev) / prev);
      }
      if (rets.length > 0) {
        meanRet1d = rets.reduce((a, b) => a + b, 0) / rets.length;
        stdRet1d = Math.sqrt(
          rets.reduce((sum, r) => sum + Math.pow(r - meanRet1d, 2), 0) / rets.length
        );
      }
    }
    
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
      meanRet1h: meanRet1h || 0,
      stdRet1h: stdRet1h || 0.001,
      meanRet1d: meanRet1d || 0,
      stdRet1d: stdRet1d || 0.001,
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
      
      // Calculate probability change in percentage points
      // Also track if this is a reversal (more significant)
      const absoluteChange = (curr - prev) * 100; // Signed change in pp
      const absoluteChangeMagnitude = Math.abs(absoluteChange);
      
      // Check if this is a reversal (crossing 0.5)
      const isReversal = (prev < 0.5 && curr > 0.5) || (prev > 0.5 && curr < 0.5);
      
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

    // IMPROVED SCORING ALGORITHM
    // Use logarithmic scale for more intuitive scores
    // Also consider USD volume, not just shares
    
    // Convert share volume to approximate USD (assume avg price ~0.5)
    const avgPrice = 0.5; // Could be improved with actual price data
    const usdVolume = topMarketVolume * avgPrice;
    
    // Volume thresholds in USD
    const minVolume = 1000;  // $1k minimum for any score
    const fullVolume = 10000; // $10k for full score
    
    // Volume multiplier (0 to 1)
    const volumeMultiplier = usdVolume < minVolume ? 0 : 
      Math.min(1, Math.sqrt((usdVolume - minVolume) / (fullVolume - minVolume)));
    
    // Logarithmic scoring for price changes (more intuitive)
    // 1pp = 1.0, 2pp = 2.5, 5pp = 5.0, 10pp = 7.5, 20pp+ = 10
    let baseScore: number;
    const absChange = Math.abs(maxChange);
    
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

// Unified scoring for string windows (supports 5m..1Q/1y and named quarters)
export const computeEventScoreWindow = internalMutation({
  args: {
    eventId: v.string(),
    window: v.string(),
  },
  handler: async (ctx, args) => {
    const { startMs, endMs, granularity, windowStr } = parseWindowStr(args.window);

    // Get all markets for this event
    const markets = await ctx.db
      .query("markets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    if (markets.length === 0) {
      return { error: "No markets in event" };
    }

    type Bar = { t: number; o: number; h: number; l: number; c: number; vol: number; volUsd: number };
    const seriesByMarket = new Map<string, Bar[]>();

    if (granularity === 'raw') {
      const snaps = await ctx.db
        .query('priceSnapshots')
        .withIndex('by_event_time', (q) => q.eq('eventId', args.eventId).gte('timestampMs', startMs))
        .filter((q) => q.lt(q.field('timestampMs'), endMs))
        .collect();
      for (const s of snaps) {
        if (!seriesByMarket.has(s.conditionId)) seriesByMarket.set(s.conditionId, []);
        const arr = seriesByMarket.get(s.conditionId)!;
        const vol = s.volumeSince || 0;
        const volUsd = vol * (s.price01 || 0);
        arr.push({ t: s.timestampMs, o: s.price01, h: s.price01, l: s.price01, c: s.price01, vol, volUsd });
      }
      for (const [k, arr] of seriesByMarket) {
        arr.sort((a, b) => a.t - b.t);
      }
    } else {
      const bars = await ctx.db
        .query('aggPriceSnapshots')
        .withIndex('by_event_granularity_time', (q) => q.eq('eventId', args.eventId).eq('granularity', granularity).gte('startMs', startMs))
        .filter((q) => q.lt(q.field('startMs'), endMs))
        .collect();
      for (const b of bars) {
        if (!seriesByMarket.has(b.conditionId)) seriesByMarket.set(b.conditionId, []);
        const arr = seriesByMarket.get(b.conditionId)!;
        arr.push({ t: b.startMs, o: b.open01, h: b.high01, l: b.low01, c: b.close01, vol: b.volumeSince || 0, volUsd: b.volumeUsdSince || 0 });
      }
      for (const [k, arr] of seriesByMarket) {
        arr.sort((a, b) => a.t - b.t);
      }
    }

    let topMarketId = "";
    let topMarketQuestion = "";
    let topPrev: number | undefined = undefined;
    let topCurr: number | undefined = undefined;
    let topMarketUsd = 0;
    let totalUsd = 0;
    let totalVol = 0;
    let activeMarkets = 0;
    let topNetChange = 0;

    const allMovements: Array<{
      conditionId: string;
      question: string;
      prevPrice: number;
      currPrice: number;
      change: number;
      volume: number;
      volumeUsd?: number;
    }> = [];

    for (const [conditionId, arr] of seriesByMarket) {
      if (arr.length === 0) continue;
      const market = markets.find(m => m.conditionId === conditionId);
      const question = market?.question || 'Unknown';
      const first = arr[0];
      const last = arr[arr.length - 1];
      const prev = first.o;
      const curr = last.c;
      const netChangePp = (curr - prev) * 100;
      let maxHigh = -Infinity;
      let minLow = Infinity;
      let usd = 0;
      let vol = 0;
      for (const b of arr) {
        if (b.h > maxHigh) maxHigh = b.h;
        if (b.l < minLow) minLow = b.l;
        usd += b.volUsd || 0;
        vol += b.vol || 0;
      }
      const swingPp = (maxHigh - minLow) * 100;
      const movementPp = Math.max(Math.abs(netChangePp), swingPp);
      const crossed = minLow < 0.5 && maxHigh > 0.5;

      totalUsd += usd;
      totalVol += vol;
      if (usd > 0 || vol > 0) activeMarkets++;

      allMovements.push({
        conditionId,
        question,
        prevPrice: prev,
        currPrice: curr,
        change: netChangePp,
        volume: vol,
        volumeUsd: usd,
      });

      if (movementPp > Math.abs(topNetChange)) {
        topNetChange = Math.sign(netChangePp) * movementPp; // preserve sign for display based on net
        topMarketId = conditionId;
        topMarketQuestion = question;
        topPrev = prev;
        topCurr = curr;
        topMarketUsd = usd;
      }
    }

    // Sort movements by absolute change magnitude
    allMovements.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    // Volume multiplier via platform metrics
    let vm = 0;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metrics: any = await ctx.runQuery((internal as any).platformMetrics.getLatestPlatformMetrics, { window: windowStr });
      const rLo = (metrics?.rLoEma ?? metrics?.rLo) ?? 0.0002;
      const rHi = (metrics?.rHiEma ?? metrics?.rHi) ?? 0.002;
      const platformUsd = metrics?.platformUsd ?? 0;
      const r = platformUsd > 0 ? (topMarketUsd / platformUsd) : 0;
      const t = rHi > rLo ? (r - rLo) / (rHi - rLo) : 0;
      vm = Math.sqrt(Math.max(0, Math.min(1, t)));
    } catch (e) {
      vm = 0; // conservative if metrics unavailable
    }

    // Baseline-based modulation (slight)
    let zFactor = 1.0;
    if (topMarketId) {
      const baseline = await ctx.db
        .query('baselines')
        .withIndex('by_condition', (q) => q.eq('conditionId', topMarketId))
        .first();
      const absMovement = Math.abs(topNetChange);
      const stdPp = (windowStr === '10080m')
        ? (baseline?.stdRet1h || 0.001) * 100
        : (windowStr === '43200m' || windowStr === '1Q' || windowStr === '525600m' || windowStr.startsWith('q:'))
          ? (baseline?.stdRet1d || 0.001) * 100
          : (baseline?.stdRet1m || 0.001) * 100;
      const z = stdPp > 0 ? absMovement / stdPp : 0;
      zFactor = Math.max(0.75, Math.min(1.0, 0.75 + 0.25 * Math.min(z / 3, 1)));
    }

    const baseScore = baseScoreFromPpChange(Math.abs(topNetChange));
    let seismoScore = baseScore * vm * zFactor;
    // Reversal bonus if crossing 50% (determined using allMovements top market)
    const topMovement = allMovements.find(m => m.conditionId === topMarketId);
    if (topMovement) {
      const prev = topMovement.prevPrice;
      const curr = topMovement.currPrice;
      const minP = Math.min(prev, curr);
      const maxP = Math.max(prev, curr);
      const crossed = minP < 0.5 && maxP > 0.5;
      if (crossed) seismoScore *= 1.1;
    }
    seismoScore = Math.max(0, Math.min(10, Math.round(seismoScore * 10) / 10));

    await ctx.db.insert('scores', {
      eventId: args.eventId,
      window: windowStr,
      timestampMs: Date.now(),
      seismoScore,
      topMarketId,
      topMarketChange: Math.abs(topNetChange),
      topMarketQuestion,
      topMarketPrevPrice01: typeof topPrev === 'number' ? topPrev : undefined,
      topMarketCurrPrice01: typeof topCurr === 'number' ? topCurr : undefined,
      marketMovements: allMovements.length > 0 ? allMovements : undefined,
      totalVolume: totalVol,
      topMarketVolume: topMovement?.volume || 0,
      activeMarkets,
    });

    return {
      eventId: args.eventId,
      window: windowStr,
      seismoScore,
      topMarketId,
      topMarketChange: Math.abs(topNetChange),
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

// Get latest score for a given event and window
export const getLatestEventScoreForWindow = query({
  args: { eventId: v.string(), window: v.string() },
  handler: async (ctx, args) => {
    const s = await ctx.db
      .query('scores')
      .withIndex('by_event_window_time', (q) => q.eq('eventId', args.eventId).eq('window', args.window))
      .order('desc')
      .first();
    return s || null;
  },
});
