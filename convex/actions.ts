import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { logger } from "../lib/logger";

// Sync events and their markets from Gamma API
export const syncEvents = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      // Event filtering thresholds
      const MIN_DAILY_VOLUME = 1000;  // $1k+ daily volume
      const MIN_TOTAL_VOLUME = 5000;  // $5k+ total volume
      const MIN_LIQUIDITY = 2000;     // $2k+ liquidity

      // Fetch ALL events using pagination
      const allEvents: any[] = [];
      let offset = 0;
      const limit = 100;

      logger.info("Starting event sync with pagination...");

      while (true) {
        const url = `https://gamma-api.polymarket.com/events/pagination?limit=${limit}&offset=${offset}&active=true&closed=false`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Gamma API error: ${response.status}`);
        }

        const data = await response.json();
        allEvents.push(...data.data);

        // Check if we have more pages
        if (!data.pagination?.hasMore) break;
        offset += limit;

        // Safety limit to avoid infinite loops
        if (offset > 10000) {
          logger.warn("Reached maximum pagination limit");
          break;
        }
      }

      logger.info(`Fetched ${allEvents.length} total events from API`);

      let totalEvents = 0;
      let totalMarkets = 0;
      let filteredEvents = 0;

      for (const event of allEvents) {
        // Skip events without markets
        if (!event.markets || event.markets.length === 0) continue;

        // Calculate total volume for the event
        const eventVolume24hr = event.markets.reduce((sum: number, m: any) =>
          sum + parseFloat(m.volume24hr || "0"), 0
        );

        const totalVolume = parseFloat(event.volume || "0");
        const liquidity = parseFloat(event.liquidity || "0");

        // Apply minimum thresholds to filter out micro-events
        if (eventVolume24hr < MIN_DAILY_VOLUME ||
            totalVolume < MIN_TOTAL_VOLUME ||
            liquidity < MIN_LIQUIDITY) {
          filteredEvents++;
          continue;
        }

        // Store event
        await ctx.runMutation(internal.events.upsertEvent, {
          event: {
            eventId: event.id || event.slug,
            slug: event.slug,
            title: event.title || event.question || "Unknown Event",
            description: event.description,
            category: event.category,
            image: event.image || event.icon,
            active: event.active !== false,
            closed: event.closed === true,
            liquidity: liquidity,
            volume: totalVolume,
            volume24hr: eventVolume24hr,
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

      logger.info(`Synced ${totalEvents} events with ${totalMarkets} markets (filtered ${filteredEvents} low-volume events)`);
    } catch (error) {
      logger.error("Event sync error:", error);
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
            
            logger.debug(`Processed ${transformed.length} trades → ${insertResult.inserted} snapshots for ${market.market.question}`);
          }
        }
      }
    } catch (error) {
      logger.error("Hot trade sync error:", error);
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
      logger.error("Warm trade sync error:", error);
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
            logger.error(`Score computation failed for event ${event.eventId}:`, error);
          }
        }
      }
      
      logger.info(`Computed scores for ${events.length} events`);
    } catch (error) {
      logger.error("Score computation error:", error);
    }
  },
});
