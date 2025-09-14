import { internalAction, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
// Logger removed - not available in Convex runtime

// CONSOLIDATED CLEANUP MODULE - Single source of truth for data retention
// Retention policies:
// - Price snapshots: 26 hours (for 24h scoring window + buffer)
// - Scores: 48 hours (for historical comparison)

export const cleanupOldData = internalAction({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    snapshotDeleted: number;
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


    console.log(
      `Cleanup completed: ${snapshotDeleted} snapshots`
    );
    return { snapshotDeleted };
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
      console.log(`Deleted ${deleted} old price snapshots`);
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
      'scores_lite',
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
          console.warn(`Stopped deleting ${table} at 10000 docs`);
          break;
        }
      }

      results[table] = deleted;
    }

    console.log('All data cleared:', results);
    return results;
  },
});
