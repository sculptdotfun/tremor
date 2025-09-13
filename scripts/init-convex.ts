// Run this script to initialize Convex with market data
// Usage: npx tsx scripts/init-convex.ts

import { logger } from '../lib/logger';

async function initializeConvex() {
  logger.info("Initializing Convex with Polymarket data...");
  
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    logger.error("NEXT_PUBLIC_CONVEX_URL not found in environment");
    process.exit(1);
  }
  
  // Extract deployment URL
  const deploymentUrl = convexUrl.replace('/api', '');
  
  // Sync markets
  logger.info("Syncing markets...");
  const marketsResponse = await fetch(`${deploymentUrl}/sync/markets`, {
    method: 'GET',
  });
  
  if (marketsResponse.ok) {
    const result = await marketsResponse.json();
    logger.info(`✓ Synced ${result.marketsProcessed} markets`);
  } else {
    logger.error("Failed to sync markets:", await marketsResponse.text());
  }
  
  // Initial trade sync for top markets
  logger.info("Fetching initial trades for top markets...");
  
  // You would normally get this from Convex query, but for init we'll fetch directly
  const gammaResponse = await fetch(
    "https://gamma-api.polymarket.com/markets?limit=10&active=true&closed=false",
    {
      headers: {
        'Accept': 'application/json',
      },
    }
  );
  
  if (gammaResponse.ok) {
    const markets = await gammaResponse.json();
    
    for (const market of markets.slice(0, 5)) {
      if (!market.conditionId) continue;
      
      logger.info(`Syncing trades for: ${market.question}`);
      
      const tradesResponse = await fetch(`${deploymentUrl}/sync/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conditionId: market.conditionId,
          since: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000), // 24h ago
        }),
      });
      
      if (tradesResponse.ok) {
        const result = await tradesResponse.json();
        logger.info(`  ✓ Inserted ${result.inserted} trades`);
      }
    }
  }
  
  logger.info("\n✅ Initialization complete!");
  logger.info("The cron jobs will now keep the data updated automatically.");
}

initializeConvex().catch((error) => {
  logger.error('Failed to initialize Convex:', error);
  process.exit(1);
});