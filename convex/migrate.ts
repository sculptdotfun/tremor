import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { logger } from '../lib/logger';

// ONE-TIME MIGRATION SCRIPT
// Run this ONCE after deploying schema changes to clear old data
// New data will automatically use correct format

export const migrateToNewSchema = internalMutation({
  args: {
    confirmMigration: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmMigration) {
      return { 
        error: "Set confirmMigration to true to proceed",
        warning: "This will clear all existing data and start fresh with the new schema"
      };
    }
    
    logger.info("Starting migration to new schema...");
    
    // Clear tables that have schema changes
    const tablesToClear = [
      "priceSnapshots", // Old retention was wrong
      "scores",         // Old calculation was wrong
    ];
    
    const results: Record<string, number> = {};
    
    for (const table of tablesToClear) {
      let deleted = 0;
      let hasMore = true;
      
      while (hasMore) {
        const docs = await ctx.db.query(table as any).take(100);
        
        for (const doc of docs) {
          await ctx.db.delete(doc._id);
          deleted++;
        }
        
        hasMore = docs.length === 100;
        
        // Safety limit
        if (deleted > 5000) {
          logger.info(`Cleared ${deleted} docs from ${table} (stopped at limit)`);
          break;
        }
      }
      
      results[table] = deleted;
      logger.info(`Cleared ${deleted} documents from ${table}`);
    }
    
    // Reset sync states to force fresh data pull
    const syncStates = await ctx.db.query("marketSyncState").collect();
    for (const state of syncStates) {
      await ctx.db.patch(state._id, {
        lastTradeFetchMs: 0, // Force re-fetch
      });
    }
    
    logger.info("Migration complete!");
    logger.info("Cleared:", results);
    logger.info("Reset", syncStates.length, "sync states");
    
    return {
      success: true,
      cleared: results,
      syncStatesReset: syncStates.length,
      message: "Migration complete. Data will repopulate with correct format on next sync."
    };
  },
});

// Check if migration is needed
export const checkMigrationStatus = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check for old data patterns
    const sampleSnapshot = await ctx.db
      .query("priceSnapshots")
      .first();
    
    const sampleScore = await ctx.db
      .query("scores")
      .first();
    
    const needsMigration = 
      sampleSnapshot && !("volumeUsdSince" in sampleSnapshot) ||
      sampleScore && !("totalVolumeUsd" in sampleScore);
    
    const oldDataCount = {
      snapshots: await ctx.db.query("priceSnapshots").take(1000).then(r => r.length),
      scores: await ctx.db.query("scores").take(1000).then(r => r.length),
    };
    
    return {
      needsMigration,
      oldDataCount,
      recommendation: needsMigration ? 
        "Run migrateToNewSchema with confirmMigration=true" :
        "No migration needed - data already in new format"
    };
  },
});