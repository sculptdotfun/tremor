import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query') || '';
    const window = url.searchParams.get('window') || '1440m';
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 });
    const convex = new ConvexHttpClient(convexUrl);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ query, data: [] }, { status: 200 });
    }

    const events = await convex.query(api.events.searchEvents, { query, limit: 20 });
    // Optional: attach a lightweight score for the requested window
    type ResultItem = {
      eventId: string;
      title?: string;
      slug?: string;
      category?: string;
      image?: string;
      active?: boolean;
      volume24hr?: number;
      score?: { seismoScore: number; timestampMs: number } | undefined;
    };
    const results: ResultItem[] = [];
    for (const e of events) {
      try {
        const s = await convex.query(api.scoring.getLatestEventScoreForWindow, { eventId: e.eventId, window });
        results.push({
          eventId: e.eventId,
          title: e.title,
          slug: e.slug,
          category: e.category,
          image: e.image,
          active: e.active,
          volume24hr: e.volume24hr,
          score: s ? { seismoScore: s.seismoScore, timestampMs: s.timestampMs } : undefined,
        });
      } catch {
        results.push({
          eventId: e.eventId,
          title: e.title,
          slug: e.slug,
          category: e.category,
          image: e.image,
          active: e.active,
          volume24hr: e.volume24hr,
        });
      }
    }

    return new NextResponse(JSON.stringify({ query, window, count: results.length, data: results }), {
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
