import { v } from "convex/values";
import { query } from "./_generated/server";

// Search for events by title, slug, or category
export const searchEvents = query({
  args: {
    searchTerm: v.optional(v.string()),
    slug: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    // If searching by slug
    if (args.slug) {
      const event = await ctx.db
        .query("events")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .first();
      
      if (event) {
        // Get markets for this event
        const markets = await ctx.db
          .query("markets")
          .withIndex("by_event", (q) => q.eq("eventId", event.eventId))
          .collect();
        
        return [{
          event,
          markets,
          marketCount: markets.length,
          totalVolume24hr: markets.reduce((sum, m) => sum + m.volume24hr, 0),
        }];
      }
      return [];
    }
    
    // Get all events
    let events = await ctx.db
      .query("events")
      .collect();
    
    // Filter by search term if provided
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      events = events.filter(event => 
        event.title.toLowerCase().includes(searchLower) ||
        event.slug.toLowerCase().includes(searchLower) ||
        (event.description && event.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by category if provided
    if (args.category) {
      events = events.filter(event => 
        event.category && event.category.toLowerCase() === args.category.toLowerCase()
      );
    }
    
    // Sort by volume and limit
    events = events
      .sort((a, b) => b.volume24hr - a.volume24hr)
      .slice(0, limit);
    
    // Get markets for each event
    const results = await Promise.all(
      events.map(async (event) => {
        const markets = await ctx.db
          .query("markets")
          .withIndex("by_event", (q) => q.eq("eventId", event.eventId))
          .collect();
        
        return {
          event,
          markets,
          marketCount: markets.length,
          totalVolume24hr: markets.reduce((sum, m) => sum + m.volume24hr, 0),
        };
      })
    );
    
    return results;
  },
});

// Get event by specific URL path segments
export const getEventByUrlPath = query({
  args: {
    urlPath: v.string(),
  },
  handler: async (ctx, args) => {
    // Extract slug from URL path like "sports/cfb-2025/games/week/3/cfb-uf-lsu-2025-09-13"
    // The slug might be stored differently in the database
    
    // Try direct slug match
    let event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.urlPath))
      .first();
    
    if (!event) {
      // Try extracting just the last segment
      const segments = args.urlPath.split('/');
      const lastSegment = segments[segments.length - 1];
      
      event = await ctx.db
        .query("events")
        .withIndex("by_slug", (q) => q.eq("slug", lastSegment))
        .first();
    }
    
    if (!event) {
      // Try searching in title for key terms
      const searchTerms = ["UF", "LSU", "Florida", "Louisiana"];
      const allEvents = await ctx.db.query("events").collect();
      
      for (const e of allEvents) {
        const titleLower = e.title.toLowerCase();
        const hasUF = titleLower.includes("uf") || titleLower.includes("florida");
        const hasLSU = titleLower.includes("lsu") || titleLower.includes("louisiana");
        
        if (hasUF && hasLSU) {
          event = e;
          break;
        }
      }
    }
    
    if (event) {
      // Get markets for this event
      const markets = await ctx.db
        .query("markets")
        .withIndex("by_event", (q) => q.eq("eventId", event.eventId))
        .collect();
      
      // Get sync state for markets
      const marketStates = await Promise.all(
        markets.map(async (market) => {
          const state = await ctx.db
            .query("marketSyncState")
            .withIndex("by_condition", (q) => q.eq("conditionId", market.conditionId))
            .first();
          
          return {
            ...market,
            syncState: state,
          };
        })
      );
      
      return {
        event,
        markets: marketStates,
        marketCount: markets.length,
        totalVolume24hr: markets.reduce((sum, m) => sum + m.volume24hr, 0),
        isBeingSynced: marketStates.some(m => m.syncState && m.syncState.lastTradeFetchMs > 0),
      };
    }
    
    return null;
  },
});

// Check if sports events are being filtered
export const getSportsEventStats = query({
  args: {},
  handler: async (ctx) => {
    const allEvents = await ctx.db.query("events").collect();
    
    const sportsEvents = allEvents.filter(e => 
      e.category && (
        e.category.toLowerCase().includes("sport") ||
        e.category.toLowerCase().includes("football") ||
        e.category.toLowerCase().includes("cfb") ||
        e.category.toLowerCase().includes("nfl")
      )
    );
    
    const cfbEvents = allEvents.filter(e => 
      e.title.toLowerCase().includes("cfb") ||
      e.title.toLowerCase().includes("college football") ||
      e.slug.toLowerCase().includes("cfb")
    );
    
    const ufLsuSearch = allEvents.filter(e => {
      const text = (e.title + " " + (e.description || "")).toLowerCase();
      return (text.includes("uf") || text.includes("florida")) && 
             (text.includes("lsu") || text.includes("louisiana"));
    });
    
    return {
      totalEvents: allEvents.length,
      sportsEvents: sportsEvents.length,
      cfbEvents: cfbEvents.length,
      ufLsuMatches: ufLsuSearch,
      categories: [...new Set(allEvents.map(e => e.category).filter(Boolean))],
      volumeThresholds: {
        MIN_DAILY_VOLUME: 1000,
        MIN_TOTAL_VOLUME: 5000,
        MIN_LIQUIDITY: 2000,
      },
      lowVolumeEvents: allEvents.filter(e => e.volume24hr < 1000).length,
    };
  },
});