import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Extract deck ID from a moxfield URL. Example: https://moxfield.com/decks/TqIGnMi30EKaZE1OrBPd2g
function extractDeckId(input: string): string | null {
  try {
    let href = input.trim();
    // Allow missing protocol
    if (!/^https?:\/\//i.test(href)) href = 'https://' + href;
    const u = new URL(href);
    // Expect pathname like /decks/{id}[/*]
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p.toLowerCase() === 'decks');
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    // Fallback regex
    const m = href.match(/\/decks\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
  } catch {
    // Fallback regex only
    const m = input.match(/\/decks\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
  }
}

// Normalize an entry that might have quantity fields named differently
function getQty(entry: any): number {
  if (!entry || typeof entry !== 'object') return 0;
  if (typeof entry.quantity === 'number') return entry.quantity;
  if (typeof entry.qty === 'number') return entry.qty;
  if (typeof entry.count === 'number') return entry.count;
  if (typeof entry.num === 'number') return entry.num;
  // If no quantity field, assume 1 when a card/name exists
  return 1;
}

function getName(entry: any, fallbackKey?: string): string | null {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  const byKey = fallbackKey && typeof (entry as any)[fallbackKey] === 'string' ? (entry as any)[fallbackKey] : null;
  return (
    entry?.card?.name ||
    entry?.name ||
    entry?.print?.card?.name ||
    entry?.cardName ||
    byKey ||
    null
  );
}

// Pull an array of { name, qty } from a board object that may have different shapes
function extractBoardCards(board: any): Array<{ name: string; qty: number }> {
  const out: Array<{ name: string; qty: number }> = [];
  if (!board) return out;
  // board.cards present
  if ((board as any).cards) {
    const cards = (board as any).cards;
    if (Array.isArray(cards)) {
      for (const entry of cards) {
        const name = getName(entry);
        const qty = getQty(entry);
        if (name && qty > 0) out.push({ name, qty });
      }
      return out;
    }
    if (typeof cards === 'object') {
      for (const k of Object.keys(cards)) {
        const entry = (cards as any)[k];
        const name = getName(entry, k) || k;
        const qty = typeof entry === 'number' ? Number(entry) : getQty(entry);
        if (name && qty > 0) out.push({ name, qty });
      }
      return out;
    }
  }
  // board as array
  if (Array.isArray(board)) {
    for (const entry of board) {
      const name = getName(entry);
      const qty = getQty(entry);
      if (name && qty > 0) out.push({ name, qty });
    }
    return out;
  }
  // board as object map
  if (typeof board === 'object') {
    for (const k of Object.keys(board)) {
      const entry = (board as any)[k];
      const name = getName(entry, k) || k;
      const qty = typeof entry === 'number' ? Number(entry) : getQty(entry);
      if (name && qty > 0) out.push({ name, qty });
    }
  }
  return out;
}

function pickBoards(data: any) {
  const cands = [data?.boards, data?.data?.boards, data];
  let main: any = null, side: any = null, commanders: any = null, companions: any = null, maybeboard: any = null;
  for (const b of cands) {
    if (!b || typeof b !== 'object') continue;
    main = main ?? b.mainboard ?? b.mainBoard ?? b.main ?? b.main_board;
    side = side ?? b.sideboard ?? b.sideBoard ?? b.side ?? b.side_board;
    commanders = commanders ?? b.commanders ?? b.commander ?? b.commanderboard;
    companions = companions ?? b.companions ?? b.companion;
    maybeboard = maybeboard ?? b.maybeboard ?? b.maybeBoard ?? b.maybe_board ?? b.maybe;
  }
  return { main, side, commanders, companions, maybeboard };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const urls: string[] = Array.isArray(body?.urls) ? body.urls : [];
    const includeSideboard: boolean = !!body?.includeSideboard;
    const enrichWithScryfall: boolean = body?.enrichScryfall !== false; // por defecto true
    if (!urls.length) return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });

  // Aggregate per card name with meta counts to later choose a representative expansion/rarity/code
  const aggregated = new Map<string, { qty: number; setNameCounts: Map<string, number>; setCodeCounts: Map<string, number>; rarityCounts: Map<string, number>; colorKeyCounts: Map<string, number> }>();
    const failures: Array<{ url: string; reason: string }> = [];
    const processed: string[] = [];

    for (const rawUrl of urls) {
      const id = extractDeckId(rawUrl);
      if (!id) {
        failures.push({ url: rawUrl, reason: 'No se pudo extraer el ID del mazo' });
        continue;
      }
      processed.push(id);
      const urlsToTry = [
        `https://api.moxfield.com/v2/decks/all/${id}`,
        `https://api.moxfield.com/v2/decks/${id}`,
        `https://www.moxfield.com/api/decks/all/${id}`,
        `https://www.moxfield.com/api/decks/${id}`,
      ];
      let okResp: Response | null = null;
      for (const u of urlsToTry) {
        const tryResp = await fetch(u, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'QuesoTimer/1.0 (moxfield aggregation)',
            'Origin': 'https://www.moxfield.com',
            'Referer': 'https://www.moxfield.com/'
          }
        });
        if (tryResp.ok) { okResp = tryResp; break; }
      }
      if (!okResp) {
        failures.push({ url: rawUrl, reason: 'No se pudo obtener datos del API de Moxfield' });
        continue;
      }
      const data = await okResp.json();
      const { main, side, commanders, companions } = pickBoards(data);
      const addEntries = (entries: Array<{ name: string; qty: number; _entry?: any }>) => {
        for (const it of entries) {
          const name = it.name;
          if (!name) continue;
          const current = aggregated.get(name) || { qty: 0, setNameCounts: new Map(), setCodeCounts: new Map(), rarityCounts: new Map(), colorKeyCounts: new Map() };
          current.qty += it.qty;
          // Try to infer set/rarity
          const e = (it as any)._entry || null;
          const setName = (e?.print?.edition?.name) || (e?.print?.set_name) || (e?.print?.setName) || (e?.card?.set_name) || (e?.card?.setName) || (e?.edition?.name) || '';
          const setCode = (e?.print?.edition?.code) || (e?.print?.set) || (e?.print?.set_code) || (e?.card?.set) || (e?.card?.setCode) || (e?.edition?.code) || '';
          const rarity = (e?.print?.rarity) || (e?.card?.rarity) || (e?.rarity) || '';
          // Colors: prefer color_identity; fallback to colors; if unknown, SKIP (let Scryfall fill later)
          const rawColors =
            (e?.print?.card?.color_identity) || (e?.card?.color_identity) || (e?.card?.colorIdentity) ||
            (e?.print?.card?.colors) || (e?.card?.colors) ||
            [];
          let arr: string[] = Array.isArray(rawColors) ? rawColors : (typeof rawColors === 'string' ? rawColors.split(/[,\s]+/) : []);
          arr = arr.map((x) => String(x).trim().toUpperCase()).filter((x) => x === 'W' || x === 'U' || x === 'B' || x === 'R' || x === 'G');
          if (arr.length > 0) {
            // Normalize color key in WUBRG order
            const order = { W: 0, U: 1, B: 2, R: 3, G: 4 } as Record<string, number>;
            const key = arr.sort((a, b) => order[a] - order[b]).join('');
            current.colorKeyCounts.set(key, (current.colorKeyCounts.get(key) || 0) + it.qty);
          }
          if (setName) current.setNameCounts.set(setName, (current.setNameCounts.get(setName) || 0) + it.qty);
          if (setCode) current.setCodeCounts.set(setCode, (current.setCodeCounts.get(setCode) || 0) + it.qty);
          if (rarity) current.rarityCounts.set(rarity, (current.rarityCounts.get(rarity) || 0) + it.qty);
          aggregated.set(name, current);
        }
      };
      // Enhance extractBoardCards to keep raw entry reference by re-wrapping here
      const wrap = (board: any) => {
        const list = extractBoardCards(board);
        if (!board) return list.map((x) => ({ ...x, _entry: null }));
        // Try mapping by name best-effort; when board has iterable entries, pair them
        const out: Array<{ name: string; qty: number; _entry?: any }> = [];
        if ((board as any).cards && Array.isArray((board as any).cards)) {
          const arr = (board as any).cards as any[];
          for (let i = 0; i < arr.length; i++) {
            const entry = arr[i];
            const nm = (entry?.card?.name) || (entry?.name);
            const qty = getQty(entry);
            if (nm && qty > 0) out.push({ name: nm, qty, _entry: entry });
          }
          return out;
        }
        if ((board as any).entries && Array.isArray((board as any).entries)) {
          const arr = (board as any).entries as any[];
          for (const entry of arr) {
            const nm = (entry?.card?.name) || (entry?.name) || (entry?.print?.card?.name);
            const qty = getQty(entry);
            if (nm && qty > 0) out.push({ name: nm, qty, _entry: entry });
          }
          return out;
        }
        if (Array.isArray(board)) {
          for (const entry of board) {
            const nm = (entry?.card?.name) || (entry?.name);
            const qty = getQty(entry);
            if (nm && qty > 0) out.push({ name: nm, qty, _entry: entry });
          }
          return out;
        }
        if ((board as any).cards && typeof (board as any).cards === 'object') {
          for (const key of Object.keys((board as any).cards)) {
            const entry = (board as any).cards[key];
            const nm = (entry?.card?.name) || (entry?.name) || key;
            const qty = typeof entry === 'number' ? Number(entry) : getQty(entry);
            if (nm && qty > 0) out.push({ name: nm, qty, _entry: entry });
          }
          return out;
        }
        return list.map((x) => ({ ...x, _entry: null }));
      };
      addEntries(wrap(main));
      if (includeSideboard) addEntries(wrap(side));
      addEntries(wrap(commanders));
      addEntries(wrap(companions));
    }

    // Scryfall enrichment to fill missing meta if requested
    if (enrichWithScryfall) {
      const need = Array.from(aggregated.entries())
        .filter(([_, rec]) => {
          const onlyC = rec.colorKeyCounts.size === 1 && rec.colorKeyCounts.has('C');
          return (rec.setNameCounts.size === 0 || rec.setCodeCounts.size === 0 || rec.rarityCounts.size === 0 || rec.colorKeyCounts.size === 0 || onlyC);
        })
        .map(([name]) => name);
      const cache = new Map<string, any>();
      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
      const fetchOne = async (cardName: string) => {
        if (cache.has(cardName)) return cache.get(cardName);
        try {
          const doFetch = async (mode: 'exact' | 'fuzzy'): Promise<any> => {
            const url = `https://api.scryfall.com/cards/named?${mode}=${encodeURIComponent(cardName)}`;
            let attempt = 0;
            while (attempt < 2) {
              const r = await fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json', 'User-Agent': 'QuesoTimer/1.0 (scryfall enrichment)' } });
              if (r.status === 429) {
                const ra = Number(r.headers.get('Retry-After')) || 1;
                await sleep(ra * 1000);
                attempt++;
                continue;
              }
              if (!r.ok) return null;
              return r.json();
            }
            return null;
          };
          let data = await doFetch('exact');
          if (!data) data = await doFetch('fuzzy');
          if (!data) return null;
          cache.set(cardName, data);
          return data;
        } catch { return null; }
      };
      // limit concurrency and add pacing to avoid rate limiting
      const conc = 3;
      for (let i = 0; i < need.length; i += conc) {
        const batch = need.slice(i, i + conc);
        const results = await Promise.all(batch.map((nm) => fetchOne(nm)));
        for (let bi = 0; bi < batch.length; bi++) {
          const nm = batch[bi];
          const data = results[bi];
          if (!data) continue;
          const rec = aggregated.get(nm);
          if (!rec) continue;
          const setName = data?.set_name || '';
          const setCode = data?.set || '';
          const rarity = data?.rarity || '';
          const ci = Array.isArray(data?.color_identity) ? data.color_identity : [];
          const colorsArr = ci.map((x: any) => String(x).toUpperCase()).filter((x: string) => ['W','U','B','R','G'].includes(x));
          const colorKey = colorsArr.length ? colorsArr.sort((a: string, b: string) => ({W:0,U:1,B:2,R:3,G:4} as any)[a] - ({W:0,U:1,B:2,R:3,G:4} as any)[b]).join('') : 'C';
          // Apply only if empty to avoid overriding deck-provided info; weight by total qty to keep selection logic
          if (rec.setNameCounts.size === 0 && setName) rec.setNameCounts.set(setName, rec.qty);
          if (rec.setCodeCounts.size === 0 && setCode) rec.setCodeCounts.set(setCode, rec.qty);
          if (rec.rarityCounts.size === 0 && rarity) rec.rarityCounts.set(rarity, rec.qty);
          const onlyC = rec.colorKeyCounts.size === 1 && rec.colorKeyCounts.has('C');
          if ((rec.colorKeyCounts.size === 0 || onlyC) && colorKey) rec.colorKeyCounts.set(colorKey, rec.qty);
        }
        // small delay between batches
        await sleep(150);
      }
    }

    const list = Array.from(aggregated.entries()).map(([name, rec]) => ({ name, qty: rec.qty }));
    const details = Array.from(aggregated.entries()).map(([name, rec]) => {
      // pick most frequent set and rarity
      const pickTop = (m: Map<string, number>) => {
        let best: string | null = null; let bestN = -1;
        for (const [k, v] of m.entries()) { if (v > bestN) { best = k; bestN = v; } }
        return best || '';
      };
      const colorKey = pickTop(rec.colorKeyCounts);
      const colors = colorKey === 'C' || !colorKey ? ['C'] : colorKey.split('');
      return { name, qty: rec.qty, setName: pickTop(rec.setNameCounts), setCode: pickTop(rec.setCodeCounts), rarity: pickTop(rec.rarityCounts), colors };
    });
    return NextResponse.json({ aggregated: list, aggregatedDetails: details, processed, failures }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
