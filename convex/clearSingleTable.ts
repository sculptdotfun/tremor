import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Clear a single table completely
export const clearSingleTable = internalMutation({
  args: {
    tableName: v.string(),
  },
  handler: async (ctx, args) => {
    let totalDeleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      // Get a batch of documents
      const docs = await ctx.db
        .query(args.tableName as any)
        .take(50); // Small batch to avoid limits
      
      // Delete each document
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
        totalDeleted++;
      }
      
      hasMore = docs.length === 50;
      
      // Break after 200 to avoid timeout
      if (totalDeleted >= 200) {
        console.log(`Cleared ${totalDeleted} from ${args.tableName}, more remaining...`);
        return { deleted: totalDeleted, hasMore: true };
      }
    }
    
    console.log(`Fully cleared ${args.tableName}: ${totalDeleted} documents`);
    return { deleted: totalDeleted, hasMore: false };
  },
});