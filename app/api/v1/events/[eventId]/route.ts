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

export async function GET(req: NextRequest, ctx: { params: Promise<{ eventId: string }> }) {
  try {
    const url = new URL(req.url);
    const windowParam = url.searchParams.get('window') || '1440m';
    const includeParam = (url.searchParams.get('include') || '').split(',').map(s => s.trim()).filter(Boolean);
    const window = normalizeWindow(windowParam);

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 });
    const convex = new ConvexHttpClient(convexUrl);

    const { eventId } = await ctx.params;
    const event = await convex.query(api.events.getEventById, { eventId });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    let markets: unknown[] | undefined = undefined;
    if (includeParam.includes('markets')) {
      markets = await convex.query(api.markets.getMarketsByEventId, { eventId });
    }

    // Collect scores per common windows
    const windows = ['5m','60m','1440m','10080m','43200m','1Q','525600m'];
    const scores: Record<string, unknown> = {};
    if (includeParam.includes('scores')) {
      for (const w of windows) {
        try {
          const s = await convex.query(api.scoring.getLatestEventScoreForWindow, { eventId, window: w });
          if (s) scores[w] = s;
        } catch {}
      }
    }

    // For selected window, get latest score and time series when requested
    const selectedScore = await convex.query(api.scoring.getLatestEventScoreForWindow, { eventId, window });

    const series: unknown | undefined = undefined;

    // Platform metrics context
    const metrics = await (
      (convex as unknown as { query: (fn: unknown, args: unknown) => Promise<unknown> })
    ).query('platformMetrics:getPlatformMetricsPublic', { window }) as unknown as Record<string, unknown> | null;

    const payload = {
      event: {
        eventId: event.eventId,
        title: event.title,
        slug: event.slug,
        category: event.category,
        image: event.image,
        active: event.active,
        volume24hr: event.volume24hr,
        volumeUsd24hr: event.volumeUsd24hr,
      },
      window,
      markets,
      scores,
      topMovement: selectedScore ? {
        conditionId: selectedScore.topMarketId,
        question: selectedScore.topMarketQuestion,
        prevPrice01: selectedScore.topMarketPrevPrice01,
        currPrice01: selectedScore.topMarketCurrPrice01,
        changePp: selectedScore.topMarketChange,
      } : undefined,
      series,
      volumeShare: metrics ? { rLo: metrics.rLoEma ?? metrics.rLo, rHi: metrics.rHiEma ?? metrics.rHi } : undefined,
    };

    return new NextResponse(JSON.stringify(payload), {
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
