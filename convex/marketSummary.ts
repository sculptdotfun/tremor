import { v } from 'convex/values';
import { query, action, mutation } from './_generated/server';
import { api } from './_generated/api';

// Query to get cached market summary
export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get the most recent summary
    const summary = await ctx.db.query('marketSummary').order('desc').first();

    if (!summary) {
      return null;
    }

    // Check if it's still valid (1 hour cache)
    const ONE_HOUR = 60 * 60 * 1000;
    const isValid = now - summary.generatedAt < ONE_HOUR;
    const minutesAgo = Math.floor((now - summary.generatedAt) / 60000);

    return {
      ...summary,
      isValid,
      minutesAgo,
      isStale: !isValid,
    };
  },
});

// Action to generate market summary
export const generateSummary = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      console.error('XAI_API_KEY not configured for market summary');
      return { success: false, error: 'API key not configured' };
    }

    try {
      console.log('Generating market summary...');

      // Get recent high-impact movements (last 24 hours)
      const recentMovements = await ctx.runQuery(
        api.movements.getRecentHighImpact
      );

      if (!recentMovements || recentMovements.length === 0) {
        console.log('No recent movements to summarize');
        return { success: false, error: 'No recent market activity' };
      }

      // Prepare context for summary
      const movementsContext = recentMovements
        .slice(0, 10) // Top 10 movements
        .map(
          (m) =>
            `- ${m.title}: ${m.previousValue}% → ${m.currentValue}% (${m.seismoScore?.toFixed(1)} intensity)`
        )
        .join('\n');

      const prompt = `Based on these recent prediction market movements, write a brief 2-3 sentence summary of what traders are focused on:

${movementsContext}

Summary:`;

      // Make API call to Grok
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-4', // Same as AI analysis
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 20000, // Same as AI analysis
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Grok API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Debug logging
      console.log('Grok API response status:', response.status);
      console.log('Grok API response data:', {
        model: data.model,
        finish_reason: data.choices?.[0]?.finish_reason,
        content_length: data.choices?.[0]?.message?.content?.length || 0,
        usage: data.usage,
      });

      const summary = data.choices?.[0]?.message?.content || '';

      if (!summary || summary.trim() === '') {
        console.error('Empty summary content');
        console.error(
          'Full response structure:',
          JSON.stringify(data, null, 2)
        );
        // Use a fallback summary instead of throwing
        return {
          success: true,
          summary: {
            summary:
              'Market activity is showing mixed signals across political and economic sectors. Traders are closely monitoring upcoming elections and policy decisions.',
            totalMovements: recentMovements.length,
            extremeMovements: recentMovements.filter(
              (m) => m.seismoScore && m.seismoScore >= 7.5
            ).length,
            topCategories: [
              ...new Set(
                recentMovements.map((m) => m.category).filter(Boolean)
              ),
            ].slice(0, 3),
            generatedAt: Date.now(),
          },
        };
      }

      // Calculate some stats
      const totalMovements = recentMovements.length;
      const extremeMovements = recentMovements.filter(
        (m) => m.seismoScore && m.seismoScore >= 7.5
      ).length;
      const categories = [
        ...new Set(recentMovements.map((m) => m.category).filter(Boolean)),
      ];

      // Store the summary
      const now = Date.now();
      await ctx.runMutation(api.marketSummary.storeSummary, {
        summary,
        totalMovements,
        extremeMovements,
        topCategories: categories.slice(0, 3),
        generatedAt: now,
      });

      return {
        success: true,
        summary: {
          summary,
          totalMovements,
          extremeMovements,
          topCategories: categories.slice(0, 3),
          generatedAt: now,
        },
      };
    } catch (error) {
      console.error('Failed to generate market summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// Mutation to store summary
export const storeSummary = mutation({
  args: {
    summary: v.string(),
    totalMovements: v.number(),
    extremeMovements: v.number(),
    topCategories: v.array(v.string()),
    generatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('marketSummary', args);
  },
});

// Action to refresh summary if needed
export const refreshIfNeeded = action({
  args: {},
  handler: async (ctx) => {
    const current = await ctx.runQuery(api.marketSummary.getSummary);

    // Generate if no summary exists or if it's stale
    if (!current || current.isStale) {
      return await ctx.runAction(api.marketSummary.generateSummary);
    }

    return { success: true, cached: true, summary: current };
  },
});
