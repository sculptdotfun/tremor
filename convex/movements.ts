import { query } from './_generated/server';

// Query to get recent high-impact movements for summary
export const getRecentHighImpact = query({
  args: {},
  handler: async (ctx) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Get recent scores with high seismo values - focusing on 60m window for better data
    const scores = await ctx.db
      .query('scores')
      .withIndex('by_window_score', (q) =>
        q
          .eq('window', '60m')
          .gte('seismoScore', 1.0)  // Lowered threshold for more data
      )
      .filter((q) => q.gte(q.field('timestampMs'), oneDayAgo))
      .order('desc')
      .take(100);

    // Deduplicate by eventId to get unique events
    const uniqueEventIds = new Set<string>();
    const uniqueScores = scores.filter((score) => {
      if (uniqueEventIds.has(score.eventId)) {
        return false;
      }
      uniqueEventIds.add(score.eventId);
      return true;
    });

    // Get event details for context
    const movements = await Promise.all(
      uniqueScores.map(async (score) => {
        const event = await ctx.db
          .query('events')
          .withIndex('by_event', (q) => q.eq('eventId', score.eventId))
          .first();

        return {
          title: event?.title || 'Unknown event',
          previousValue: (score.topMarketPrevPrice01 || 0) * 100,
          currentValue: (score.topMarketCurrPrice01 || 0) * 100,
          seismoScore: score.seismoScore,
          category: event?.category,
          timestamp: score.timestampMs,
        };
      })
    );

    // Sort by seismo score and return top unique movements
    // Return at least something even if no high scores
    const sorted = movements.sort((a, b) => b.seismoScore - a.seismoScore).slice(0, 15);
    
    // If no movements found, return empty array
    return sorted.length > 0 ? sorted : [];
  },
});
