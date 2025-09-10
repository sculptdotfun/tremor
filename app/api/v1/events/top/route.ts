import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

function normalizeWindow(w?: string): string {
  const window = (w || '1440m').toString();
  if (window === '24h') return '1440m';
  if (window === '7d') return '10080m';
  if (window === '30d') return '43200m';
  if (window === '1y') return '525600m';
  return window;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const windowParam = url.searchParams.get('window') || '1440m';
    const limitParam = parseInt(url.searchParams.get('limit') || '20', 10);
    const window = normalizeWindow(windowParam);

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 });
    const convex = new ConvexHttpClient(convexUrl);

    // Query top tremors for the window
    const scores = await convex.query(api.scoring.getTopTremors, { window, limit: limitParam });

    // Fetch platform metrics for context (may be null early)
    // Using string ref to avoid codegen mismatch in environments without Convex dev
    const metrics = await (
      (convex as unknown as { query: (fn: unknown, args: unknown) => Promise<unknown> })
    ).query('platformMetrics:getPlatformMetricsPublic', { window }) as unknown as Record<string, unknown> | null;

    const data = scores.map((s) => {
      const m = metrics as { platformUsd?: number; rLo?: number; rLoEma?: number; rHi?: number; rHiEma?: number } | null;
      const platformUsd = m?.platformUsd ?? 0;
      const rShare = platformUsd > 0 && s.topMarketVolume
        ? (s.topMarketVolume * (s.topMarketPrevPrice01 ?? 0.5)) / platformUsd
        : 0;
      const rLo = (m?.rLoEma ?? m?.rLo) as number | undefined;
      const rHi = (m?.rHiEma ?? m?.rHi) as number | undefined;
      return ({
      eventId: s.event?.eventId || s.eventId,
      title: s.event?.title || 'Unknown Event',
      slug: s.event?.slug,
      category: s.event?.category,
      image: s.event?.image,
      active: s.event?.active,
      volume24hr: s.event?.volume24hr,
      volumeUsd24hr: s.event?.volumeUsd24hr,
      window,
      generatedAt: s.timestampMs,
      seismoScore: s.seismoScore,
      priceChangePp: s.topMarketChange,
      topMarket: {
        conditionId: s.topMarketId,
        question: s.topMarketQuestion,
        prevPrice01: s.topMarketPrevPrice01,
        currPrice01: s.topMarketCurrPrice01,
      },
      totalVolume: s.totalVolume,
      activeMarkets: s.activeMarkets,
      volumeShare: metrics ? { r: rShare, rLo, rHi } : undefined,
    });
    });

    return new NextResponse(JSON.stringify({ window, count: data.length, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
