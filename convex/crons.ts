import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sync events and markets every 2 minutes
crons.interval(
  "sync events",
  { minutes: 2 },
  internal.actions.syncEvents
);

// Sync hot market trades every 15 seconds
crons.interval(
  "sync hot trades",
  { seconds: 15 },
  internal.actions.syncHotTrades
);

// Sync warm market trades every minute
crons.interval(
  "sync warm trades",
  { minutes: 1 },
  internal.actions.syncWarmTrades
);

// Update materialized scores every 30 seconds
crons.interval(
  "update scores_lite",
  { seconds: 30 },
  (internal as any).scoring.updateScoresLite
);

// Clean up old data daily at 2 AM UTC
crons.daily(
  "cleanup old data",
  { hourUTC: 2, minuteUTC: 0 },
  internal.cleanup.cleanupOldData
);

// Generate market summary every 30 minutes
crons.interval(
  "generate market summary",
  { minutes: 30 },
  (internal as any).marketSummary.generateSummaryCron
);

export default crons;