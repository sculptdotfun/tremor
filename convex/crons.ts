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

// Compute scores every minute
crons.interval(
  "compute scores",
  { minutes: 1 },
  internal.actions.computeAllScores
);

// Aggregate hourly bars every 10 minutes (last 3 hours)
crons.interval(
  "aggregate hourly",
  { minutes: 10 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (internal as any).aggregation.aggregateSnapshotsHourly
);

// Aggregate daily bars once a day
crons.daily(
  "aggregate daily",
  { hourUTC: 0, minuteUTC: 10 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (internal as any).aggregation.aggregateSnapshotsDaily
);

// Platform metrics: compute for all windows periodically
crons.interval(
  "platform metrics all",
  { minutes: 5 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (internal as any).platformMetrics.computeAllPlatformMetrics
);

// Compute baselines nightly at 2 AM UTC
crons.daily(
  "compute baselines",
  { hourUTC: 2, minuteUTC: 0 },
  internal.actions.computeAllBaselines
);

// Clean up old data daily at 3 AM UTC
crons.daily(
  "cleanup old data",
  { hourUTC: 3, minuteUTC: 0 },
  internal.cleanup.cleanupOldData
);

// Generate market summary every 30 minutes
crons.interval(
  "generate market summary",
  { minutes: 30 },
  (internal as any).marketSummary.generateSummaryCron
);

export default crons;
/* eslint-disable @typescript-eslint/no-explicit-any */
