import { v } from 'convex/values';
import { internalMutation } from './_generated/server';

// Simple mutation to store analysis results (called by the action)
export const storeAnalysis = internalMutation({
  args: {
    movementId: v.string(),
    eventId: v.string(),
    explanation: v.string(),
    sources: v.array(v.string()),
    confidence: v.number(),
    category: v.optional(v.string()),
    generatedAt: v.number(),
    expiresAt: v.number(),
    sourcesUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Store the analysis
    const analysisId = await ctx.db.insert('aiAnalysis', {
      movementId: args.movementId,
      eventId: args.eventId,
      explanation: args.explanation,
      sources: args.sources,
      confidence: args.confidence,
      category: args.category,
      generatedAt: args.generatedAt,
      expiresAt: args.expiresAt,
      sourcesUsed: args.sourcesUsed,
    });

    return analysisId;
  },
});
