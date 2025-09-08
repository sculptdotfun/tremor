import { mutation } from "./_generated/server";

// Clear all data from all tables
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all documents from each table and delete them
    const tables = ['events', 'markets', 'priceSnapshots', 'baselines', 'scores', 'marketSyncState'];
    
    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      console.log(`Cleared ${docs.length} documents from ${table}`);
    }
    
    return { success: true, message: "All data cleared successfully" };
  }
});