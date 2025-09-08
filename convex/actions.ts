import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

// Sync events and their markets from Gamma API
export const syncEvents = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      const response = await fetch(
        "https://gamma-api.polymarket.com/events?limit=500&active=true&closed=false",
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status}`);
      }
      
      const events = await response.json();
      
      let totalEvents = 0;
      let totalMarkets = 0;
      
      for (const event of events) {
        // Skip events without markets or volume
        if (!event.markets || event.markets.length === 0) continue;
        
        // Calculate total volume for the event
        const eventVolume = event.markets.reduce((sum: number, m: any) => 
          sum + parseFloat(m.volume24hr || "0"), 0
        );
        
        // Skip events with no volume
        if (eventVolume === 0) continue;
        
        // Store event
        await ctx.runMutation(internal.events.upsertEvent, {
          event: {
            eventId: event.id || event.slug,
            slug: event.slug,
            title: event.title || event.question || "Unknown Event",
            description: event.description,
            category: event.category,
            image: event.image || event.icon, // Add image from API
            active: event.active !== false,
            closed: event.closed === true,
            liquidity: parseFloat(event.liquidity || "0"),
            volume: parseFloat(event.volume || "0"),
            volume24hr: eventVolume,
          },
        });
        totalEvents++;
        
        // Store markets within this event
        const validMarkets = event.markets
          .filter((m: any) => m.conditionId && m.conditionId.length > 10)
          .map((m: any) => ({
            conditionId: m.conditionId,
            eventId: event.id || event.slug,
            question: m.question || "Unknown",
            active: m.active !== false,
            closed: m.closed === true,
            lastTradePrice: parseFloat(m.lastTradePrice || "0"),
            bestBid: m.bestBid ? parseFloat(m.bestBid) : undefined,
            bestAsk: m.bestAsk ? parseFloat(m.bestAsk) : undefined,
            volume24hr: parseFloat(m.volume24hr || "0"),
          }));
        
        if (validMarkets.length > 0) {
          await ctx.runMutation(internal.markets.upsertMarkets, {
            markets: validMarkets,
          });
          totalMarkets += validMarkets.length;
        }
      }
      
      console.log(`Synced ${totalEvents} events with ${totalMarkets} markets`);
    } catch (error) {
      console.error("Event sync error:", error);
    }
  },
});

// Sync trades for hot markets
export const syncHotTrades = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      // Get hot markets to sync
      const markets = await ctx.runQuery(api.markets.getMarketsToSync, {
        priority: "hot",
        limit: 3, // Reduce to avoid too many parallel requests
      });
      
      for (const market of markets) {
        if (!market.market) continue;
        
        // Fetch trades - get last 25 hours for 24h scoring window
        // Plus 1 hour buffer to ensure we have baseline price
        const since = Math.floor((Date.now() - 25 * 60 * 60 * 1000) / 1000); // 25 hours ago
        
        const params = new URLSearchParams({
          market: market.conditionId,
          limit: "500",
          after: since.toString(),
        });
        
        const response = await fetch(
          `https://data-api.polymarket.com/trades?${params}`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const trades = await response.json();
          
          if (trades.length > 0) {
            // Transform and validate trades
            const transformed = trades
              .filter((t: any) => t.price && t.size && t.timestamp) // Validate required fields
              .map((t: any) => {
                // CRITICAL FIX: Normalize all prices to YES outcome
                // Polymarket returns price for the outcome being traded
                // For NO trades: YES price = 1 - NO price
                const rawPrice = parseFloat(t.price || "0");
                const outcome = (t.outcome || t.filler?.outcome || "Yes").toLowerCase();
                const normalizedPrice = outcome === "no" ? 1 - rawPrice : rawPrice;
                
                return {
                  conditionId: market.conditionId,
                  eventId: market.market?.eventId || market.conditionId, // Add eventId
                  timestampMs: t.timestamp < 10000000000 ? t.timestamp * 1000 : t.timestamp, // Handle both seconds and ms
                  price01: normalizedPrice,
                  size: parseFloat(t.size || "0"),
                  side: t.side || "unknown",
                  txHash: t.transactionHash || `${market.conditionId}_${t.timestamp}_${t.price}_${t.size}`,
                };
              });
            
            // Store trades (now directly aggregates into buckets)
            const insertResult = await ctx.runMutation(internal.trades.insertTrades, {
              trades: transformed,
            });
            
            // Update sync state
            await ctx.runMutation(internal.markets.updateSyncState, {
              conditionId: market.conditionId,
              lastTradeFetchMs: Date.now(),
            });
            
            console.log(`Processed ${transformed.length} trades → ${insertResult.inserted} snapshots for ${market.market.question}`);
          }
        }
      }
    } catch (error) {
      console.error("Hot trade sync error:", error);
    }
  },
});

// Sync trades for warm markets
export const syncWarmTrades = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      // Get warm markets to sync
      const markets = await ctx.runQuery(api.markets.getMarketsToSync, {
        priority: "warm",
        limit: 10,
      });
      
      // Process similar to hot trades but with more markets
      for (const market of markets) {
        if (!market.market) continue;
        
        // Get last 25 hours for complete 24h window + buffer
        const since = Math.floor((Date.now() - 25 * 60 * 60 * 1000) / 1000);
        
        const params = new URLSearchParams({
          market: market.conditionId,
          limit: "250",
          after: since.toString(),
        });
        
        const response = await fetch(
          `https://data-api.polymarket.com/trades?${params}`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const trades = await response.json();
          
          if (trades.length > 0) {
            const transformed = trades
              .filter((t: any) => t.price && t.size && t.timestamp)
              .map((t: any) => {
                // Normalize all prices to YES outcome
                const rawPrice = parseFloat(t.price || "0");
                const outcome = (t.outcome || t.filler?.outcome || "Yes").toLowerCase();
                const normalizedPrice = outcome === "no" ? 1 - rawPrice : rawPrice;
                
                return {
                  conditionId: market.conditionId,
                  eventId: market.market?.eventId || market.conditionId,
                  timestampMs: t.timestamp < 10000000000 ? t.timestamp * 1000 : t.timestamp,
                  price01: normalizedPrice,
                  size: parseFloat(t.size || "0"),
                  side: t.side || "unknown",
                  txHash: t.transactionHash || `${market.conditionId}_${t.timestamp}_${t.price}_${t.size}`,
                };
              });
            
            const insertResult = await ctx.runMutation(internal.trades.insertTrades, {
              trades: transformed,
            });
            
            await ctx.runMutation(internal.markets.updateSyncState, {
              conditionId: market.conditionId,
              lastTradeFetchMs: Date.now(),
            });
          }
        }
      }
    } catch (error) {
      console.error("Warm trade sync error:", error);
    }
  },
});

// Compute scores for all active events
export const computeAllScores = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      // Get active events
      const events = await ctx.runQuery(api.events.getActiveEvents, {
        limit: 100,
      });
      
      for (const event of events) {
        // Compute 5m, 60m, and 1d scores
        for (const windowMinutes of [5, 60, 1440]) {
          try {
            await ctx.runMutation(internal.scoring.computeEventScore, {
              eventId: event.eventId,
              windowMinutes,
            });
          } catch (error) {
            console.error(`Score computation failed for event ${event.eventId}:`, error);
          }
        }
      }
      
      console.log(`Computed scores for ${events.length} events`);
    } catch (error) {
      console.error("Score computation error:", error);
    }
  },
});

// Compute baselines for all markets
export const computeAllBaselines = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      const markets = await ctx.runQuery(api.markets.getActiveMarkets, {
        limit: 500,
      });
      
      for (const market of markets) {
        try {
          await ctx.runMutation(internal.scoring.computeBaselines, {
            conditionId: market.conditionId,
            lookbackDays: 14,
          });
        } catch (error) {
          console.error(`Baseline computation failed for ${market.conditionId}:`, error);
        }
      }
      
      console.log(`Computed baselines for ${markets.length} markets`);
    } catch (error) {
      console.error("Baseline computation error:", error);
    }
  },
});
