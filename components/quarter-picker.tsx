'use client';

import { useMemo, useState } from 'react';

export type TremorWindow = '5m' | '60m' | '1440m' | '7d' | '30d' | '1Q' | '1y' | string;

export function QuarterPicker({ onSelect }: { onSelect: (w: TremorWindow) => void }) {
  const [open, setOpen] = useState(false);

  const { thisQuarterId, lastQuarterId, recentQuarters } = useMemo(() => {
    const now = new Date();
    const month = now.getUTCMonth();
    const q = Math.floor(month / 3) + 1 as 1|2|3|4;
    const y = now.getUTCFullYear();
    const thisId = `q:${y}-Q${q}` as const;
    const prevQ = q === 1 ? 4 : ((q - 1) as 1|2|3|4);
    const prevY = q === 1 ? y - 1 : y;
    const lastId = `q:${prevY}-Q${prevQ}` as const;
    const list: string[] = [];
    let cq = prevQ;
    let cy = prevY;
    for (let i = 0; i < 6; i++) {
      list.push(`q:${cy}-Q${cq}`);
      cq = (cq === 1 ? 4 : ((cq - 1) as 1|2|3|4));
      if (cq === 4) cy -= 1;
    }
    return { thisQuarterId: thisId, lastQuarterId: lastId, recentQuarters: list };
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left border border-zinc-800/50 bg-zinc-950 hover:border-zinc-700 transition-all"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 2px 8px rgba(0,0,0,0.3)' }}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-zinc-100">Quarters…</div>
              <div className="text-[10px] text-zinc-500">Pick specific quarter</div>
            </div>
            <div className="h-2 w-2 rounded-full bg-zinc-700" />
          </div>
        </div>
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-56 border border-zinc-800/50 bg-zinc-950 p-2 shadow-xl">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-600">Quick Picks</div>
          <div className="mb-2 grid grid-cols-1 gap-2">
            <button
              className="w-full rounded border border-zinc-800/50 bg-zinc-900/50 px-2 py-1 text-left text-[11px] text-zinc-300 hover:border-zinc-700"
              onClick={() => { onSelect('1Q'); setOpen(false); }}
            >This Quarter (QTD)</button>
            <button
              className="w-full rounded border border-zinc-800/50 bg-zinc-900/50 px-2 py-1 text-left text-[11px] text-zinc-300 hover:border-zinc-700"
              onClick={() => { onSelect(lastQuarterId); setOpen(false); }}
            >Last Quarter ({lastQuarterId.slice(2)})</button>
          </div>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-600">Recent</div>
          <div className="grid grid-cols-2 gap-2">
            {recentQuarters.map((id) => (
              <button key={id}
                className="rounded border border-zinc-800/50 bg-zinc-900/50 px-2 py-1 text-left text-[11px] text-zinc-300 hover:border-zinc-700"
                onClick={() => { onSelect(id); setOpen(false); }}
              >{id.slice(2)}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
