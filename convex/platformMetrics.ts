import { internalAction, internalQuery, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function quarterStart(date: Date): Date {
  const month = date.getUTCMonth();
  const q = Math.floor(month / 3);
  const startMonth = q * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), startMonth, 1, 0, 0, 0, 0));
}

function parseWindow(window: string): { startMs: number; endMs: number; granularity: 'raw'|'1h'|'1d' } {
  const now = Date.now();
  const endMs = now;
  if (window === '5m') return { startMs: endMs - 5 * 60 * 1000, endMs, granularity: 'raw' };
  if (window === '60m') return { startMs: endMs - 60 * 60 * 1000, endMs, granularity: 'raw' };
  if (window === '24h' || window === '1440m') return { startMs: endMs - 24 * 60 * 60 * 1000, endMs, granularity: 'raw' };
  if (window === '7d' || window === '10080m') return { startMs: endMs - 7 * 24 * 60 * 60 * 1000, endMs, granularity: '1h' };
  if (window === '30d' || window === '43200m') return { startMs: endMs - 30 * 24 * 60 * 60 * 1000, endMs, granularity: '1d' };
  if (window === '1y' || window === '525600m') return { startMs: endMs - 365 * 24 * 60 * 60 * 1000, endMs, granularity: '1d' };
  if (window === '1Q') {
    const nowDate = new Date(endMs);
    const start = quarterStart(nowDate).getTime();
    return { startMs: start, endMs, granularity: '1d' };
  }
  // q:YYYY-QN format
  if (window.startsWith('q:')) {
    const m = window.match(/^q:(\d{4})-Q([1-4])$/);
    if (m) {
      const year = parseInt(m[1], 10);
      const qi = parseInt(m[2], 10) - 1;
      const start = Date.UTC(year, qi * 3, 1, 0, 0, 0, 0);
      const end = Date.UTC(year, qi * 3 + 3, 1, 0, 0, 0, 0);
      return { startMs: start, endMs: Math.min(end, endMs), granularity: '1d' };
    }
  }
  // default 24h
  return { startMs: endMs - 24 * 60 * 60 * 1000, endMs, granularity: 'raw' };
}

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

export const computePlatformMetrics = internalMutation({
  args: { window: v.string() },
  handler: async (ctx, args) => {
    const { startMs, endMs, granularity } = parseWindow(args.window);

    type MarketAgg = { eventId: string; conditionId: string; usd: number };
    const perMarket: Map<string, MarketAgg> = new Map(); // key conditionId
    let platformUsd = 0;

    if (granularity === 'raw') {
      // Sum USD from raw snapshots
      const snaps = await ctx.db
        .query('priceSnapshots')
        .withIndex('by_time', (q) => q.gte('timestampMs', startMs))
        .filter((q) => q.lt(q.field('timestampMs'), endMs))
        .collect();
      for (const s of snaps) {
        const usd = (s.volumeSince || 0) * (s.price01 || 0);
        if (!perMarket.has(s.conditionId)) {
          perMarket.set(s.conditionId, { eventId: s.eventId, conditionId: s.conditionId, usd: 0 });
        }
        const rec = perMarket.get(s.conditionId)!;
        rec.usd += usd;
        platformUsd += usd;
      }
    } else {
      // Use aggregated bars
      const bars = await ctx.db
        .query('aggPriceSnapshots')
        .withIndex('by_granularity_time', (q) => q.eq('granularity', granularity).gte('startMs', startMs))
        .filter((q) => q.lt(q.field('startMs'), endMs))
        .collect();
      for (const b of bars) {
        const usd = b.volumeUsdSince || 0;
        if (!perMarket.has(b.conditionId)) {
          perMarket.set(b.conditionId, { eventId: b.eventId, conditionId: b.conditionId, usd: 0 });
        }
        const rec = perMarket.get(b.conditionId)!;
        rec.usd += usd;
        platformUsd += usd;
      }
    }

    // Group by event and take top market USD per event
    const perEventTop: Map<string, number> = new Map();
    for (const rec of perMarket.values()) {
      const prev = perEventTop.get(rec.eventId) || 0;
      if (rec.usd > prev) perEventTop.set(rec.eventId, rec.usd);
    }

    const shares: number[] = [];
    if (platformUsd > 0) {
      for (const usd of perEventTop.values()) {
        if (usd > 0) shares.push(usd / platformUsd);
      }
    }
    shares.sort((a, b) => a - b);

    // Quantiles with sensible defaults
    let rLo = 0.0002;
    let rHi = 0.002;
    if (shares.length >= 10) {
      rLo = quantile(shares, 0.4);
      rHi = Math.max(quantile(shares, 0.9), rLo * 2);
    }

    // Smooth with EMA using previous record if present
    const prev = await ctx.db
      .query('platformMetrics')
      .withIndex('by_window_time', (q) => q.eq('window', args.window))
      .order('desc')
      .first();
    let rLoEma: number | undefined = undefined;
    let rHiEma: number | undefined = undefined;
    const alpha = 0.3;
    if (prev && typeof prev.rLoEma === 'number' && typeof prev.rHiEma === 'number') {
      rLoEma = alpha * rLo + (1 - alpha) * prev.rLoEma;
      rHiEma = alpha * rHi + (1 - alpha) * prev.rHiEma;
    } else {
      rLoEma = rLo;
      rHiEma = rHi;
    }

    await ctx.db.insert('platformMetrics', {
      window: args.window,
      computedAt: Date.now(),
      platformUsd,
      rLo,
      rHi,
      rLoEma,
      rHiEma,
    });

    return { window: args.window, platformUsd, rLo, rHi, rLoEma, rHiEma };
  },
});

export const getLatestPlatformMetrics = internalQuery({
  args: { window: v.string() },
  handler: async (ctx, args) => {
    const latest = await ctx.db
      .query('platformMetrics')
      .withIndex('by_window_time', (q) => q.eq('window', args.window))
      .order('desc')
      .first();
    return latest || null;
  },
});

export const computeAllPlatformMetrics = internalAction({
  args: {},
  handler: async (ctx) => {
    const windows = ['5m','60m','24h','7d','30d','1Q','1y'] as const;
    const results: Record<string, unknown> = {};
    for (const w of windows) {
      try {
        const r = await ctx.runMutation((internal as any).platformMetrics.computePlatformMetrics, { window: w });
        results[w] = r;
      } catch (e) {
        results[w] = { error: (e as Error).message };
      }
    }
    return results;
  },
});

// Public query for API consumption
export const getPlatformMetricsPublic = query({
  args: { window: v.string() },
  handler: async (ctx, args) => {
    const latest = await ctx.db
      .query('platformMetrics')
      .withIndex('by_window_time', (q) => q.eq('window', args.window))
      .order('desc')
      .first();
    return latest || null;
  },
});
/* eslint-disable @typescript-eslint/no-explicit-any */
