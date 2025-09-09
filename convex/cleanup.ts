import { internalAction, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import logger from '../lib/logger';

// CONSOLIDATED CLEANUP MODULE - Single source of truth for data retention
// Retention policies:
// - Price snapshots: 26 hours (for 24h scoring window + buffer)
// - Scores: 48 hours (for historical comparison)
// - Baselines: 30 days (computed nightly)

export const cleanupOldData = internalAction({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    snapshotDeleted: number;
    scoreDeleted: number;
    baselineDeleted: number;
  }> => {
    const now = Date.now();

    // Clean up price snapshots older than 26 hours
    const snapshotCutoff = now - 26 * 60 * 60 * 1000;
    const snapshotDeleted = await ctx.runMutation(
      internal.cleanup.deleteOldSnapshots,
      {
        cutoff: snapshotCutoff,
        batchSize: 500, // Increased batch size for efficiency
      }
    );

    // Clean up scores older than 48 hours
    const scoreCutoff = now - 48 * 60 * 60 * 1000;
    const scoreDeleted = await ctx.runMutation(
      internal.cleanup.deleteOldScores,
      {
        cutoff: scoreCutoff,
        batchSize: 200,
      }
    );

    // Clean up baselines older than 30 days
    const baselineCutoff = now - 30 * 24 * 60 * 60 * 1000;
    const baselineDeleted = await ctx.runMutation(
      internal.cleanup.deleteOldBaselines,
      {
        cutoff: baselineCutoff,
        batchSize: 100,
      }
    );

    logger.info(
      `Cleanup completed: ${snapshotDeleted} snapshots, ${scoreDeleted} scores, ${baselineDeleted} baselines`
    );
    return { snapshotDeleted, scoreDeleted, baselineDeleted };
  },
});

export const deleteOldSnapshots = internalMutation({
  args: {
    cutoff: v.number(),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const oldSnapshots = await ctx.db
      .query('priceSnapshots')
      .filter((q) => q.lt(q.field('timestampMs'), args.cutoff))
      .take(batchSize);

    let deleted = 0;
    for (const snapshot of oldSnapshots) {
      await ctx.db.delete(snapshot._id);
      deleted++;
    }

    if (deleted > 0) {
      logger.info(`Deleted ${deleted} old price snapshots`);
    }
    return deleted;
  },
});

export const deleteOldScores = internalMutation({
  args: {
    cutoff: v.number(),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const oldScores = await ctx.db
      .query('scores')
      .filter((q) => q.lt(q.field('timestampMs'), args.cutoff))
      .take(batchSize);

    let deleted = 0;
    for (const score of oldScores) {
      await ctx.db.delete(score._id);
      deleted++;
    }

    if (deleted > 0) {
      logger.info(`Deleted ${deleted} old scores`);
    }
    return deleted;
  },
});

export const deleteOldBaselines = internalMutation({
  args: {
    cutoff: v.number(),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;

    const oldBaselines = await ctx.db
      .query('baselines')
      .filter((q) => q.lt(q.field('computedAt'), args.cutoff))
      .take(batchSize);

    let deleted = 0;
    for (const baseline of oldBaselines) {
      await ctx.db.delete(baseline._id);
      deleted++;
    }

    if (deleted > 0) {
      logger.info(`Deleted ${deleted} old baselines`);
    }
    return deleted;
  },
});

// Emergency clear all data (use with caution)
export const clearAllData = internalMutation({
  args: { confirmKey: v.string() },
  handler: async (ctx, args) => {
    if (args.confirmKey !== 'DELETE_ALL_DATA_CONFIRMED') {
      throw new Error('Invalid confirmation key');
    }

    const tables = [
      'events',
      'markets',
      'priceSnapshots',
      'scores',
      'baselines',
      'marketSyncState',
    ];
    const results: Record<string, number> = {};

    for (const table of tables) {
      let deleted = 0;
      let hasMore = true;

      while (hasMore) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docs = await ctx.db.query(table as any).take(100);

        for (const doc of docs) {
          await ctx.db.delete(doc._id);
          deleted++;
        }

        hasMore = docs.length === 100;

        // Safety limit
        if (deleted > 10000) {
          logger.warn(`Stopped deleting ${table} at 10000 docs`);
          break;
        }
      }

      results[table] = deleted;
    }

    logger.info('All data cleared:', results);
    return results;
  },
});
