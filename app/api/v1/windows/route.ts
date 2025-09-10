import { NextResponse } from 'next/server';

function currentQuarterId(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const q = Math.floor(now.getUTCMonth() / 3) + 1;
  return `q:${y}-Q${q}`;
}

function lastQuarterId(): string {
  const now = new Date();
  let y = now.getUTCFullYear();
  let q = Math.floor(now.getUTCMonth() / 3) + 1;
  q = q === 1 ? 4 : (q - 1);
  if (q === 4) y -= 1;
  return `q:${y}-Q${q}`;
}

export async function GET() {
  const windows = [
    { id: '5m', label: '5 MIN' },
    { id: '60m', label: '1 HOUR' },
    { id: '1440m', label: '24 HOUR' },
    { id: '7d', label: '7 DAYS' },
    { id: '30d', label: '30 DAYS' },
    { id: '1Q', label: 'THIS QUARTER' },
    { id: '1y', label: '1 YEAR' },
  ];
  const payload = {
    windows,
    currentQuarter: currentQuarterId(),
    lastQuarter: lastQuarterId(),
  };
  return new NextResponse(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=3600',
    },
  });
}

