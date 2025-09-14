import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
// Logger removed - not available in Convex runtime

// Polymarket API types
interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  volume24hr: number;
  active: boolean;
  closed: boolean;
  lastTradePrice: number;
  bestBid?: number;
  bestAsk?: number;
}

interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  image?: string;
  icon?: string;
  active: boolean;
  closed: boolean;
  liquidity: number;
  volume: number;
  markets: PolymarketMarket[];
}

interface PolymarketTrade {
  price: number;
  size: number;
  timestamp: number;
  outcome?: string;
  side?: string;
  transactionHash?: string;
  filler?: { outcome?: string };
}

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
      const allEvents: PolymarketEvent[] = [];
      let offset = 0;
      const limit = 100;

      console.log("Starting event sync with pagination...");

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
          console.warn("Reached maximum pagination limit");
          break;
        }
      }

      console.log(`Fetched ${allEvents.length} total events from API`);

      let totalEvents = 0;
      let totalMarkets = 0;
      let filteredEvents = 0;

      for (const event of allEvents) {
        // Skip events without markets
        if (!event.markets || event.markets.length === 0) continue;

        // Calculate total volume for the event
        const eventVolume24hr = event.markets.reduce((sum: number, m: PolymarketMarket) =>
          sum + Number(m.volume24hr ?? 0), 0
        );


        const totalVolume = Number((event as any).volume ?? 0);
        const liquidity = Number((event as any).liquidity ?? 0);

        // Apply minimum thresholds to filter out micro-events
        if (eventVolume24hr < MIN_DAILY_VOLUME ||
            totalVolume < MIN_TOTAL_VOLUME ||
            liquidity < MIN_LIQUIDITY) {
          filteredEvents++;
          continue;
        }

        // HIGH PRIORITY FIX: Better atomicity - prepare data first, then store together
        const validMarkets = event.markets
          .filter((m: PolymarketMarket) => m.conditionId && m.conditionId.length > 10)
          .map((m: PolymarketMarket) => ({
            conditionId: m.conditionId,
            eventId: event.id || event.slug,
            question: m.question || "Unknown",
            active: m.active !== false,
            closed: m.closed === true,
            lastTradePrice: Number(m.lastTradePrice ?? 0),
            bestBid: typeof m.bestBid === 'number' ? m.bestBid : undefined,
            bestAsk: typeof m.bestAsk === 'number' ? m.bestAsk : undefined,
            volume24hr: Number(m.volume24hr ?? 0),
          }));

        // Only store event if it has valid markets
        if (validMarkets.length > 0) {
          try {
            // Store event first
            await ctx.runMutation(internal.events.upsertEvent, {
              event: {
                eventId: event.id || event.slug,
                slug: event.slug,
                title: event.title || "Unknown Event",
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

            // Then store markets - if this fails, at least event exists
            await ctx.runMutation(internal.markets.upsertMarkets, {
              markets: validMarkets,
            });
            totalMarkets += validMarkets.length;
          } catch (error) {
            console.error(`Failed to store event ${event.id} with markets:`, error);
            // Continue with next event instead of failing entire sync
          }
        }
      }

      console.log(`Synced ${totalEvents} events with ${totalMarkets} markets (filtered ${filteredEvents} low-volume events)`);
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
      const markets = await ctx.runQuery(api.markets.getMarketsToSync, {
        priority: "hot",
        limit: 3,
      });
      
      for (const market of markets) {
        if (!market.market) continue;

        const limit = 1000;
        let offset = 0;
        const cutoffSec = Math.floor((Math.max((market.lastTradeFetchMs || 0) - 5 * 60 * 1000, Date.now() - 25 * 60 * 60 * 1000)) / 1000);
        const uniq = new Set<string>();
        const all: PolymarketTrade[] = [] as any;
        // HIGH PRIORITY FIX: Add memory limit to prevent OOM
        const MAX_TRADES = 10000; // Maximum trades to process per market
        
        while (all.length < MAX_TRADES) {
          const params = new URLSearchParams({
            market: market.conditionId,
            limit: String(limit),
            offset: String(offset),
            takerOnly: "true",
          });
          const response = await fetch(`https://data-api.polymarket.com/trades?${params}`, { headers: { 'Accept': 'application/json' } });
          if (!response.ok) break;
          const page: PolymarketTrade[] = await response.json();
          if (page.length === 0) break;
          let oldest = Number.MAX_SAFE_INTEGER;
          for (const t of page) {
            const ts = t.timestamp < 10000000000 ? t.timestamp * 1000 : t.timestamp;
            oldest = Math.min(oldest, Math.floor(ts / 1000));
            const key = t.transactionHash || `${market.conditionId}_${t.timestamp}_${t.price}_${t.size}`;
            if (!uniq.has(key)) {
              uniq.add(key);
              all.push(t);
            }
          }
          offset += limit;
          if (page.length < limit) break;
          if (oldest <= cutoffSec) break;
          // HIGH PRIORITY FIX: Stop if we've reached memory limit
          if (all.length >= MAX_TRADES) {
            console.warn(`Reached max trades limit (${MAX_TRADES}) for ${market.conditionId}`);
            break;
          }
        }

        if (all.length > 0) {
          // CRITICAL FIX: For multi-outcome markets, we need to track ONE consistent outcome
          // Group trades by outcome to detect multi-outcome markets
          const outcomeGroups = new Map<string, PolymarketTrade[]>();
          for (const trade of all) {
            const outcome = (trade.outcome || "yes").toLowerCase();
            if (!outcomeGroups.has(outcome)) {
              outcomeGroups.set(outcome, []);
            }
            outcomeGroups.get(outcome)!.push(trade);
          }
          
          // If we have multiple outcomes (like Canelo vs Crawford), pick the primary one
          let tradesToProcess = all;
          if (outcomeGroups.size > 1) {
            // Multi-outcome market detected! Pick the outcome consistently:
            // 1. Prefer "yes" for binary markets
            // 2. Otherwise pick the outcome with the most recent trades (most active)
            // 3. Or the one with most trades overall
            const primaryOutcome = outcomeGroups.has("yes") ? "yes" : 
                                  Array.from(outcomeGroups.entries())
                                    .sort((a, b) => {
                                      // Sort by most recent trade timestamp first
                                      const aLatest = Math.max(...a[1].map(t => t.timestamp));
                                      const bLatest = Math.max(...b[1].map(t => t.timestamp));
                                      if (aLatest !== bLatest) return bLatest - aLatest;
                                      // Then by number of trades
                                      return b[1].length - a[1].length;
                                    })[0][0];
            tradesToProcess = outcomeGroups.get(primaryOutcome) || all;
            console.log(`Multi-outcome market detected. Tracking "${primaryOutcome}" (${tradesToProcess.length}/${all.length} trades)`);
          }
          
          const transformed = tradesToProcess
            .filter((t: PolymarketTrade) => t.price && t.size && t.timestamp)
            .map((t: PolymarketTrade) => {
              const rawPrice = Number((t as any).price ?? 0);
              const outcome = (t.outcome || "").toLowerCase();
              // For binary markets, normalize NO prices
              const normalizedPrice = outcome === "no" ? 1 - rawPrice : rawPrice;
              return {
                conditionId: market.conditionId,
                eventId: market.market?.eventId || market.conditionId,
                timestampMs: t.timestamp < 10000000000 ? t.timestamp * 1000 : t.timestamp,
                price01: normalizedPrice,
                size: Number((t as any).size ?? 0),
                side: (t as any).side || "unknown",
                txHash: t.transactionHash || `${market.conditionId}_${t.timestamp}_${t.price}_${t.size}`,
              };
            });

          const insertResult = await ctx.runMutation(internal.trades.insertTrades, { trades: transformed });
          await ctx.runMutation(internal.markets.updateSyncState, { conditionId: market.conditionId, lastTradeFetchMs: Date.now() });
          console.log(`Processed ${transformed.length} trades → ${insertResult.inserted} snapshots for ${market.market.question}`);
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
      
      for (const market of markets) {
        if (!market.market) continue;

        const limit = 1000;
        let offset = 0;
        const cutoffSec = Math.floor((Math.max((market.lastTradeFetchMs || 0) - 5 * 60 * 1000, Date.now() - 25 * 60 * 60 * 1000)) / 1000);
        const uniq = new Set<string>();
        const all: PolymarketTrade[] = [] as any;
        // HIGH PRIORITY FIX: Add memory limit to prevent OOM
        const MAX_TRADES = 10000; // Maximum trades to process per market
        
        while (all.length < MAX_TRADES) {
          const params = new URLSearchParams({
            market: market.conditionId,
            limit: String(limit),
            offset: String(offset),
            takerOnly: "true",
          });
          const response = await fetch(`https://data-api.polymarket.com/trades?${params}`, { headers: { 'Accept': 'application/json' } });
          if (!response.ok) break;
          const page: PolymarketTrade[] = await response.json();
          if (page.length === 0) break;
          let oldest = Number.MAX_SAFE_INTEGER;
          for (const t of page) {
            const ts = t.timestamp < 10000000000 ? t.timestamp * 1000 : t.timestamp;
            oldest = Math.min(oldest, Math.floor(ts / 1000));
            const key = t.transactionHash || `${market.conditionId}_${t.timestamp}_${t.price}_${t.size}`;
            if (!uniq.has(key)) {
              uniq.add(key);
              all.push(t);
            }
          }
          offset += limit;
          if (page.length < limit) break;
          if (oldest <= cutoffSec) break;
          // HIGH PRIORITY FIX: Stop if we've reached memory limit
          if (all.length >= MAX_TRADES) {
            console.warn(`Reached max trades limit (${MAX_TRADES}) for ${market.conditionId}`);
            break;
          }
        }

        if (all.length > 0) {
          // Group by outcome to detect and handle multi-outcome markets
          const outcomeGroups = new Map<string, PolymarketTrade[]>();
          for (const trade of all) {
            const outcome = (trade.outcome || "yes").toLowerCase();
            if (!outcomeGroups.has(outcome)) {
              outcomeGroups.set(outcome, []);
            }
            outcomeGroups.get(outcome)!.push(trade);
          }
          
          // Pick primary outcome for consistency
          let tradesToProcess = all;
          if (outcomeGroups.size > 1) {
            const primaryOutcome = outcomeGroups.has("yes") ? "yes" : 
                                  Array.from(outcomeGroups.entries())
                                    .sort((a, b) => {
                                      const aLatest = Math.max(...a[1].map(t => t.timestamp));
                                      const bLatest = Math.max(...b[1].map(t => t.timestamp));
                                      if (aLatest !== bLatest) return bLatest - aLatest;
                                      return b[1].length - a[1].length;
                                    })[0][0];
            tradesToProcess = outcomeGroups.get(primaryOutcome) || all;
            console.log(`Multi-outcome warm market: ${market.market.question}. Tracking "${primaryOutcome}"`);
          }
          
          const transformed = tradesToProcess
            .filter((t: PolymarketTrade) => t.price && t.size && t.timestamp)
            .map((t: PolymarketTrade) => {
              const rawPrice = Number((t as any).price ?? 0);
              const outcome = (t.outcome || "").toLowerCase();
              const normalizedPrice = outcome === "no" ? 1 - rawPrice : rawPrice;
              return {
                conditionId: market.conditionId,
                eventId: market.market?.eventId || market.conditionId,
                timestampMs: t.timestamp < 10000000000 ? t.timestamp * 1000 : t.timestamp,
                price01: normalizedPrice,
                size: Number((t as any).size ?? 0),
                side: (t as any).side || "unknown",
                txHash: t.transactionHash || `${market.conditionId}_${t.timestamp}_${t.price}_${t.size}`,
              };
            });
          const insertResult = await ctx.runMutation(internal.trades.insertTrades, { trades: transformed });
          await ctx.runMutation(internal.markets.updateSyncState, { conditionId: market.conditionId, lastTradeFetchMs: Date.now() });
        }
      }
    } catch (error) {
      console.error("Warm trade sync error:", error);
    }
  },
});

