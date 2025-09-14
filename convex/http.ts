import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { logger } from '../lib/logger';

const http = httpRouter();

// Fetch markets from Gamma API
http.route({
  path: "/sync/markets",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      // Fetch from Gamma API
      const response = await fetch(
        "https://gamma-api.polymarket.com/markets?limit=500&active=true&closed=false",
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status}`);
      }
      
      const markets = await response.json();
      
      // Transform to our schema
      const transformed = markets
        .filter((m: any) => m.conditionId && m.lastTradePrice) // Must have condition ID
        .map((m: any) => ({
          conditionId: m.conditionId,
          question: m.question || "Unknown",
          slug: m.slug || m.conditionId,
          endDate: m.endDate,
          active: m.active !== false,
          closed: m.closed === true,
          lastTradePrice: parseFloat(m.lastTradePrice || "0"),
          bestBid: m.bestBid ? parseFloat(m.bestBid) : undefined,
          bestAsk: m.bestAsk ? parseFloat(m.bestAsk) : undefined,
          volume24hr: parseFloat(m.volume24hr || "0"),
        }));
      
      // Store in database
      const result = await ctx.runMutation(internal.markets.upsertMarkets, {
        markets: transformed,
      });
      
      return new Response(JSON.stringify({
        success: true,
        ...result,
        marketsFound: markets.length,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      logger.error("Market sync error:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Fetch trades from Data API
http.route({
  path: "/sync/trades",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { conditionId, since } = body;
      
      if (!conditionId) {
        return new Response(JSON.stringify({
          success: false,
          error: "conditionId required",
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const limit = 1000;
      let offset = 0;
      const uniq = new Set<string>();
      const all: any[] = [];

      while (true) {
        const params = new URLSearchParams({ market: conditionId, limit: String(limit), offset: String(offset), takerOnly: "true" });
        const response = await fetch(`https://data-api.polymarket.com/trades?${params}`, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`Data API error: ${response.status}`);
        const page = await response.json();
        if (page.length === 0) break;
        for (const t of page) {
          const key = t.transactionHash || `${conditionId}_${t.timestamp}_${t.price}_${t.size}`;
          if (!uniq.has(key)) {
            uniq.add(key);
            all.push(t);
          }
        }
        offset += limit;
        if (page.length < limit) break;
      }

      const market = await ctx.runQuery(api.markets.getMarketByConditionId, { conditionId });
      const eventId = market?.eventId || conditionId;

      const transformed = all
        .filter((t: any) => t.price && t.size && t.timestamp)
        .map((t: any) => ({
          conditionId,
          eventId,
          timestampMs: t.timestamp < 10000000000 ? t.timestamp * 1000 : t.timestamp,
          price01: parseFloat(t.price || "0"),
          size: parseFloat(t.size || "0"),
          side: t.side || "unknown",
          txHash: t.transactionHash,
        }));

      const insertResult = await ctx.runMutation(internal.trades.insertTrades, { trades: transformed });

      if (transformed.length > 0) {
        const lastTrade = transformed[transformed.length - 1];
        await ctx.runMutation(internal.markets.updateSyncState, { conditionId, lastTradeFetchMs: Date.now(), lastTradeId: lastTrade.txHash });
      }

      return new Response(JSON.stringify({ success: true, ...insertResult, tradesFound: all.length }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
      logger.error("Trade sync error:", error);
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
