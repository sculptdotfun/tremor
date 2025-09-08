import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Clean up old data to prevent unbounded growth
export const cleanupOldData = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Clean up price snapshots older than 7 days
    const snapshotCutoff = now - (7 * 24 * 60 * 60 * 1000);
    await ctx.runMutation(internal.cleanup.deleteOldSnapshots, { cutoff: snapshotCutoff });
    
    // Clean up scores older than 24 hours
    const scoreCutoff = now - (24 * 60 * 60 * 1000);
    await ctx.runMutation(internal.cleanup.deleteOldScores, { cutoff: scoreCutoff });
    
    console.log("Cleanup completed");
  }
});

export const deleteOldSnapshots = internalMutation({
  args: { cutoff: v.number() },
  handler: async (ctx, args) => {
    const oldSnapshots = await ctx.db
      .query("priceSnapshots")
      .filter((q) => q.lt(q.field("timestampMs"), args.cutoff))
      .collect();
    
    let deleted = 0;
    for (const snapshot of oldSnapshots) {
      await ctx.db.delete(snapshot._id);
      deleted++;
    }
    
    console.log(`Deleted ${deleted} old price snapshots`);
    return deleted;
  }
});

export const deleteOldScores = internalMutation({
  args: { cutoff: v.number() },
  handler: async (ctx, args) => {
    const oldScores = await ctx.db
      .query("scores")
      .filter((q) => q.lt(q.field("timestampMs"), args.cutoff))
      .collect();
    
    let deleted = 0;
    for (const score of oldScores) {
      await ctx.db.delete(score._id);
      deleted++;
    }
    
    console.log(`Deleted ${deleted} old scores`);
    return deleted;
  }
});