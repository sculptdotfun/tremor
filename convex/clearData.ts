import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Clear a single table with pagination
export const clearTable = internalMutation({
  args: {
    tableName: v.string(),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;
    
    // Get a batch of documents
    const docs = await ctx.db
      .query(args.tableName as any)
      .take(batchSize);
    
    // Delete each document
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    
    console.log(`Deleted ${docs.length} documents from ${args.tableName}`);
    
    return { 
      deleted: docs.length,
      hasMore: docs.length === batchSize 
    };
  },
});

// Clear all data from all tables (call clearTable repeatedly)
export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "events",
      "markets",
      "marketSyncState",
      "priceSnapshots",
      "baselines",
      "scores"
    ];
    
    let totalDeleted = 0;
    
    for (const table of tables) {
      let hasMore = true;
      let tableDeleted = 0;
      
      // Keep deleting batches until table is empty
      while (hasMore) {
        const result = await ctx.runMutation(internal.clearData.clearTable, {
          tableName: table,
          batchSize: 100
        });
        
        tableDeleted += result.deleted;
        totalDeleted += result.deleted;
        hasMore = result.hasMore;
        
        // Break if we've deleted too many to avoid timeout and read limits
        if (tableDeleted > 500) {
          console.log(`Partially cleared ${table} (${tableDeleted} docs). Run again to continue.`);
          break;
        }
      }
      
      console.log(`Cleared ${tableDeleted} documents from ${table}`);
    }
    
    console.log(`Total documents deleted: ${totalDeleted}`);
    return { success: true, totalDeleted };
  },
});