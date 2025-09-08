import { v } from 'convex/values';
import { mutation, query, action } from './_generated/server';
import { api } from './_generated/api';

// Public action to request AI analysis (called when user clicks Intelligence button)
export const requestAnalysis = action({
  args: {
    movementId: v.string(),
    eventId: v.string(),
    title: v.string(),
    category: v.optional(v.string()),
    currentValue: v.number(),
    previousValue: v.number(),
    seismoScore: v.number(),
    marketQuestion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if score is high enough for AI analysis
    if (!args.seismoScore || args.seismoScore < 5) {
      return {
        success: false,
        message:
          'AI analysis is only available for high-intensity movements (score >= 5)',
      };
    }

    // Check for existing valid analysis first
    const existingAnalysis = await ctx.runQuery(api.aiAnalysis.getAnalysis, {
      movementId: args.movementId,
    });

    if (existingAnalysis && existingAnalysis.isValid) {
      return {
        success: true,
        cached: true,
        analysis: existingAnalysis,
      };
    }

    // Generate new analysis using the action
    const result = await ctx.runAction(api.aiActions.generateAnalysis, args);

    return result;
  },
});

// Public query to fetch analysis (polled by frontend while generating)
export const getAnalysis = query({
  args: {
    movementId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get the most recent analysis for this movement
    const analysis = await ctx.db
      .query('aiAnalysis')
      .withIndex('by_movement', (q) => q.eq('movementId', args.movementId))
      .order('desc')
      .first();

    if (!analysis) {
      return null;
    }

    // Check if it's still valid
    const isValid = analysis.expiresAt > now;
    const minutesUntilExpiry = Math.round((analysis.expiresAt - now) / 60000);

    return {
      explanation: analysis.explanation,
      sources: analysis.sources,
      confidence: analysis.confidence,
      category: analysis.category,
      generatedAt: analysis.generatedAt,
      isValid,
      minutesUntilExpiry: isValid ? minutesUntilExpiry : 0,
      isExpired: !isValid,
    };
  },
});

// Query to check if analysis exists (for showing button state)
export const hasAnalysis = query({
  args: {
    movementId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const analysis = await ctx.db
      .query('aiAnalysis')
      .withIndex('by_movement', (q) => q.eq('movementId', args.movementId))
      .filter((q) => q.gt(q.field('expiresAt'), now))
      .first();

    return {
      exists: !!analysis,
      expiresAt: analysis?.expiresAt,
    };
  },
});

// Admin function to clear expired analyses (can be called periodically)
export const cleanupExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find expired analyses
    const expired = await ctx.db
      .query('aiAnalysis')
      .withIndex('by_expires', (q) => q.lt('expiresAt', now))
      .collect();

    // Delete them
    let deleted = 0;
    for (const analysis of expired) {
      await ctx.db.delete(analysis._id);
      deleted++;
    }

    return { deleted };
  },
});

// Admin function to clear ALL analyses (for regeneration with better prompts)
export const clearAllAnalyses = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all analyses
    const allAnalyses = await ctx.db.query('aiAnalysis').collect();

    // Delete them all
    let deleted = 0;
    for (const analysis of allAnalyses) {
      await ctx.db.delete(analysis._id);
      deleted++;
    }

    console.log(`Cleared ${deleted} AI analyses for regeneration`);
    return { deleted };
  },
});
