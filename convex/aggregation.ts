import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

function floorToHour(ms: number): number {
  const d = new Date(ms);
  d.setUTCMinutes(0, 0, 0);
  return d.getTime();
}

function ceilToHour(ms: number): number {
  const f = floorToHour(ms);
  return f + 60 * 60 * 1000;
}

function floorToDay(ms: number): number {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function ceilToDay(ms: number): number {
  return floorToDay(ms) + 24 * 60 * 60 * 1000;
}

export const aggregateSnapshotsHourly = internalMutation({
  args: {
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const toMs = args.toMs ?? now;
    const fromMs = args.fromMs ?? toMs - 3 * 60 * 60 * 1000; // last 3 hours by default

    const start = floorToHour(fromMs);
    const end = ceilToHour(toMs);

    // Fetch raw price snapshots for the window
    const snapshots = await ctx.db
      .query("priceSnapshots")
      .withIndex("by_time", (q) => q.gte("timestampMs", start))
      .filter((q) => q.lt(q.field("timestampMs"), end))
      .collect();

    // Group by market and hour
    type BucketKey = string; // `${conditionId}|${hourStart}`
    const groups = new Map<BucketKey, typeof snapshots>();

    for (const s of snapshots) {
      const hStart = floorToHour(s.timestampMs);
      const key = `${s.conditionId}|${hStart}`;
      const arr = groups.get(key) ?? [];
      arr.push(s);
      groups.set(key, arr);
    }

    let upserts = 0;

    for (const [key, arr] of groups) {
      if (arr.length === 0) continue;
      arr.sort((a, b) => a.timestampMs - b.timestampMs);
      const [conditionId, hourStr] = key.split("|");
      const hourStart = parseInt(hourStr, 10);
      const hourEnd = hourStart + 60 * 60 * 1000;
      const eventId = arr[0].eventId;

      // Compute OHLC and volumes
      const open01 = arr[0].price01;
      const close01 = arr[arr.length - 1].price01;
      let high01 = -Infinity;
      let low01 = Infinity;
      let vol = 0;
      let volUsd = 0;
      for (const s of arr) {
        if (s.price01 > high01) high01 = s.price01;
        if (s.price01 < low01) low01 = s.price01;
        const v = s.volumeSince || 0;
        vol += v;
        volUsd += v * (s.price01 || 0);
      }
      if (!isFinite(high01)) high01 = Math.max(open01, close01);
      if (!isFinite(low01)) low01 = Math.min(open01, close01);

      // Upsert into aggPriceSnapshots('1h')
      const existing = await ctx.db
        .query("aggPriceSnapshots")
        .withIndex("by_market_granularity_time", (q) =>
          q
            .eq("conditionId", conditionId)
            .eq("granularity", "1h")
            .gte("startMs", hourStart)
        )
        .filter((q) => q.eq(q.field("startMs"), hourStart))
        .first();

      const doc = {
        conditionId,
        eventId,
        granularity: "1h" as const,
        startMs: hourStart,
        endMs: hourEnd,
        open01,
        high01,
        low01,
        close01,
        volumeSince: vol,
        volumeUsdSince: volUsd,
      };

      if (existing) {
        await ctx.db.patch(existing._id, doc);
      } else {
        await ctx.db.insert("aggPriceSnapshots", doc);
      }
      upserts++;
    }

    return { upserts };
  },
});

export const aggregateSnapshotsDaily = internalMutation({
  args: {
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const toMs = args.toMs ?? now;
    const fromMs = args.fromMs ?? toMs - 2 * 24 * 60 * 60 * 1000; // last 2 days default

    const start = floorToDay(fromMs);
    const end = ceilToDay(toMs);

    // Prefer aggregating from 1h bars
    const bars = await ctx.db
      .query("aggPriceSnapshots")
      .withIndex("by_granularity_time", (q) => q.eq("granularity", "1h").gte("startMs", start))
      .filter((q) => q.lt(q.field("startMs"), end))
      .collect();

    type BucketKey = string; // `${conditionId}|${dayStart}`
    const groups = new Map<BucketKey, typeof bars>();
    for (const b of bars) {
      const dStart = floorToDay(b.startMs);
      const key = `${b.conditionId}|${dStart}`;
      const arr = groups.get(key) ?? [];
      arr.push(b);
      groups.set(key, arr);
    }

    let upserts = 0;

    for (const [key, arr] of groups) {
      if (arr.length === 0) continue;
      arr.sort((a, b) => a.startMs - b.startMs);
      const [conditionId, dayStr] = key.split("|");
      const dayStart = parseInt(dayStr, 10);
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const eventId = arr[0].eventId;

      const open01 = arr[0].open01;
      const close01 = arr[arr.length - 1].close01;
      let high01 = -Infinity;
      let low01 = Infinity;
      let vol = 0;
      let volUsd = 0;
      for (const b of arr) {
        if (b.high01 > high01) high01 = b.high01;
        if (b.low01 < low01) low01 = b.low01;
        vol += b.volumeSince || 0;
        volUsd += b.volumeUsdSince || 0;
      }
      if (!isFinite(high01)) high01 = Math.max(open01, close01);
      if (!isFinite(low01)) low01 = Math.min(open01, close01);

      // Upsert into aggPriceSnapshots('1d')
      const existing = await ctx.db
        .query("aggPriceSnapshots")
        .withIndex("by_market_granularity_time", (q) =>
          q
            .eq("conditionId", conditionId)
            .eq("granularity", "1d")
            .gte("startMs", dayStart)
        )
        .filter((q) => q.eq(q.field("startMs"), dayStart))
        .first();

      const doc = {
        conditionId,
        eventId,
        granularity: "1d" as const,
        startMs: dayStart,
        endMs: dayEnd,
        open01,
        high01,
        low01,
        close01,
        volumeSince: vol,
        volumeUsdSince: volUsd,
      };
      if (existing) {
        await ctx.db.patch(existing._id, doc);
      } else {
        await ctx.db.insert("aggPriceSnapshots", doc);
      }
      upserts++;
    }

    return { upserts };
  },
});

