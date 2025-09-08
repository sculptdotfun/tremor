import { v } from "convex/values";
import { query } from "./_generated/server";

// Get recent database activity across all tables
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const now = Date.now();
    const cutoff = now - 300000; // Last 5 minutes for more activity
    
    const activities: Array<{
      type: string;
      message: string;
      timestamp: number;
      change?: number;
      eventTitle?: string;
      currentPrice?: number;
      volume?: number;
      marketCount?: number;
      seismoScore?: number;
      direction?: 'up' | 'down' | 'neutral';
      severity?: 'extreme' | 'high' | 'moderate' | 'low';
    }> = [];
    
    // Check recent high-intensity scores
    const recentScores = await ctx.db
      .query("scores")
      .withIndex("by_time_score", (q) => q.gte("timestampMs", cutoff))
      .filter((q) => q.gte(q.field("seismoScore"), 2.5))
      .take(15);
    
    for (const score of recentScores) {
      const event = await ctx.db
        .query("events")
        .withIndex("by_event", (q) => q.eq("eventId", score.eventId))
        .first();
      
      if (event && Math.abs(score.topMarketChange) > 1) {
        const severity = score.seismoScore >= 7.5 ? 'extreme' : 
                        score.seismoScore >= 5 ? 'high' :
                        score.seismoScore >= 2.5 ? 'moderate' : 'low';
        
        activities.push({
          type: "movement",
          message: event.title || score.topMarketQuestion,
          timestamp: score.timestampMs,
          change: score.topMarketChange,
          seismoScore: score.seismoScore,
          volume: score.totalVolume,
          marketCount: score.activeMarkets,
          direction: score.topMarketChange > 0 ? 'up' : 'down',
          severity,
        });
      }
    }
    
    // Check for new events added
    const recentEvents = await ctx.db
      .query("events")
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .take(5);
    
    for (const event of recentEvents) {
      activities.push({
        type: "new_event",
        message: event.title,
        timestamp: event.createdAt,
        marketCount: event.marketCount,
        volume: event.volume,
        direction: 'neutral',
        severity: 'low',
      });
    }
    
    // Don't track volume spikes separately - movements already factor in volume
    
    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});