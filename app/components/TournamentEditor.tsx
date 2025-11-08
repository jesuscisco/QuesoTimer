"use client";

import { useEffect, useMemo, useState } from "react";
import { setCurrentPairings, clearCurrentPairings, getCurrentPairings } from "../utils/pairings";
import { setCurrentStandings, clearCurrentStandings } from "../utils/standings";
import { broadcast, subscribe } from "../utils/broadcast";
// XLSX fallback: we'll export CSV to avoid bundling issues if xlsx is unavailable
function toCsv(aoa: any[][]): string {
  const esc = (v: any) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return aoa.map(row => row.map(esc).join(',')).join('\r\n');
}
function downloadCsv(filename: string, aoa: any[][]) {
  const csv = toCsv(aoa);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function TournamentEditor({
  title,
  storageKey,
  mode = 'ffa',
}: {
  title: string;
  storageKey: string;
  mode?: 'ffa' | 'twoHeads' | 'oneVsOne';
}) {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [tables, setTables] = useState<string[][]>([]);
  const [notice, setNotice] = useState<string>("");
  const [placements, setPlacements] = useState<number[][]>([]);
  const TABLES_KEY = `${storageKey}.tables`;
  const NOTICE_KEY = `${storageKey}.notice`;
  const ROUNDS_KEY = `${storageKey}.rounds`;
  const CONFIG_KEY = `${storageKey}.config`;
  const [roundsTotal, setRoundsTotal] = useState<number>(3);
  const [tableSizes, setTableSizes] = useState<number[]>([]);
  const PENDING_KEY = `${storageKey}.pendingRound`;
  const [pendingRound, setPendingRound] = useState<boolean>(false);
  const [liveStandings, setLiveStandings] = useState<Standing[]>([]);
  const [standingsModalOpen, setStandingsModalOpen] = useState<boolean>(false);
  const [pairingsModalOpen, setPairingsModalOpen] = useState<boolean>(false);
  const [roundsSavedCount, setRoundsSavedCount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  type RoundDetail = { round: number; timestamp: number; players: Array<{ name: string; points: number }>; tables: string[][] };
  const [roundsDetail, setRoundsDetail] = useState<RoundDetail[]>([]);
  // 1vs1 manual pairing builder state
  const [manualOneVsOne, setManualOneVsOne] = useState<boolean>(false);
  const [manualPick, setManualPick] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const seen = new Set<string>();
          const unique: string[] = [];
          arr.forEach((x: any) => {
            if (typeof x !== 'string') return;
            const t = x.trim();
            if (!t) return;
            const k = t.toLowerCase();
            if (!seen.has(k)) { seen.add(k); unique.push(t); }
          });
          setPlayers(unique);
        }
      }
      const savedTables = localStorage.getItem(TABLES_KEY);
      if (savedTables) {
        const t = JSON.parse(savedTables);
        if (Array.isArray(t)) setTables(t);
      }
      const savedNotice = localStorage.getItem(NOTICE_KEY);
      if (savedNotice) setNotice(savedNotice);
      const cfg = localStorage.getItem(CONFIG_KEY);
      if (cfg) {
        const obj = JSON.parse(cfg);
        if (obj && typeof obj.roundsTotal === 'number') setRoundsTotal(Math.max(1, Math.floor(obj.roundsTotal)));
        if (Array.isArray(obj?.tableSizes)) setTableSizes(obj.tableSizes.filter((n: any) => typeof n === 'number'));
      }
      const pend = localStorage.getItem(PENDING_KEY);
      setPendingRound(!!pend);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(players));
    } catch {}
  }, [players, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
      if (notice) localStorage.setItem(NOTICE_KEY, notice); else localStorage.removeItem(NOTICE_KEY);
    } catch {}
  }, [tables, notice, TABLES_KEY, NOTICE_KEY]);

  // Reset placements whenever tables change
  useEffect(() => {
    setPlacements(tables.map((tbl) => Array(Math.min(4, tbl.length)).fill(-1)));
  }, [tables]);

  // Persist config when roundsTotal or tableSizes change
  useEffect(() => {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify({ roundsTotal, tableSizes })); } catch {}
  }, [roundsTotal, tableSizes]);

  // Listen for storage changes to pending flag and rounds to update standings
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === PENDING_KEY) setPendingRound(!!localStorage.getItem(PENDING_KEY));
      if (e.key === ROUNDS_KEY) {
        try { setLiveStandings(buildStandingsFromRounds()); } catch {}
      }
    };
    try { setLiveStandings(buildStandingsFromRounds()); } catch {}
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Subscribe to cross-tab show/hide modal to reflect current visibility for standings
  useEffect(() => {
    const unsub = subscribe(({ action, payload }) => {
      if (action === 'showModal') {
        if (payload?.type === 'standings') setStandingsModalOpen(true);
        if (payload?.type === 'pairings') setPairingsModalOpen(true);
      }
      if (action === 'hideModal') {
        setStandingsModalOpen(false);
        setPairingsModalOpen(false);
      }
    });
    return () => { if (unsub) unsub(); };
  }, []);

  // Compute per-round details only (no cumulative historical block)
  useEffect(() => {
    const compute = () => {
      try {
        const raw = localStorage.getItem(ROUNDS_KEY);
        const rounds = raw ? JSON.parse(raw) : [];
        setRoundsSavedCount(Array.isArray(rounds) ? rounds.length : 0);
        const perRoundDetails: RoundDetail[] = [];
        if (Array.isArray(rounds)) {
          rounds.forEach((entry: any) => {
            const modeEntry = (entry && entry.mode) || mode;
            const rows: any[] = (entry && entry.rows) || [];
            const tablesSnap: string[][] = (entry && entry.tablesSnapshot) || [];
            const splitPlayers = (s: string): string[] => {
              const cleaned = s.replace(/\s*\(sin oponente\)\s*$/i, '');
              const m = cleaned.match(/^\s*Equipo:\s*(.+)$/i);
              const names = m ? m[1].split(/\s+y\s+/i) : [s];
              return names.map((nm) => nm.trim()).filter(Boolean);
            };
            const roundPoints = new Map<string, number>();
            rows.forEach((r) => {
              const participante: string = r.Participante || '';
              const pts: number = Number(r.Puntos) || 0;
              const playersList = modeEntry === 'twoHeads' ? splitPlayers(participante) : [participante];
              playersList.forEach((nm) => {
                const key = nm.trim();
                if (!key) return;
                roundPoints.set(key, (roundPoints.get(key) || 0) + pts);
              });
            });
            const playersArr = Array.from(roundPoints.entries()).map(([name, points]) => ({ name, points }))
              .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
            perRoundDetails.push({ round: Number(entry?.round) || perRoundDetails.length + 1, timestamp: Number(entry?.timestamp) || Date.now(), players: playersArr, tables: tablesSnap || [] });
          });
        }
        setRoundsDetail(perRoundDetails.sort((a, b) => a.round - b.round));
      } catch {
        setRoundsDetail([]);
      }
    };
    compute();
    const onStorage = (e: StorageEvent) => {
      if (e.key === ROUNDS_KEY) compute();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [ROUNDS_KEY, mode]);

  const canAdd = useMemo(() => {
    const t = name.trim();
    if (!t) return false;
    const lower = t.toLowerCase();
    return !players.some(p => p.trim().toLowerCase() === lower);
  }, [name, players]);

  function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function computeGroups(count: number): { groupsOf4: number; groupsOf3: number; fallback?: number } {
    // Partition count into 4s and 3s prioritizing 4s and minimizing 3s.
    // Valid decomposition exists for all n >= 6 except n=5 is also representable (3+2) not allowed.
    // We implement transformations:
    // n = 4q + r
    // r=0 => (q,0)
    // r=1 => if q>=2 => (q-2, 3) else fallback 5
    // r=2 => if q>=1 => (q-1, 2) else fallback 2
    // r=3 => (q,1)
    const q = Math.floor(count / 4);
    const r = count % 4;
    switch (r) {
      case 0:
        return { groupsOf4: q, groupsOf3: 0 };
      case 1:
        if (q >= 2) return { groupsOf4: q - 2, groupsOf3: 3 };
        // e.g., n=1 or 5 -> fallback single table of size r==1? choose 5 when possible
        return { groupsOf4: 0, groupsOf3: 0, fallback: count };
      case 2:
        if (q >= 1) return { groupsOf4: q - 1, groupsOf3: 2 };
        // n=2 -> fallback 2
        return { groupsOf4: 0, groupsOf3: 0, fallback: count };
      case 3:
        return { groupsOf4: q, groupsOf3: 1 };
      default:
        return { groupsOf4: 0, groupsOf3: 0 };
    }
  }

  function computeInitialTableSizes(count: number): number[] {
    const { groupsOf4, groupsOf3, fallback } = computeGroups(count);
    if (fallback) {
      // Sizes only fallback table
      return [fallback];
    }
    const sizes: number[] = [];
    for (let i = 0; i < groupsOf4; i++) sizes.push(4);
    for (let i = 0; i < groupsOf3; i++) sizes.push(3);
    return sizes;
  }

  function initTournamentConfig() {
    const count = players.length;
    const sizes = computeInitialTableSizes(count);
    setTableSizes(sizes);
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify({ roundsTotal, tableSizes: sizes })); } catch {}
  }

  type Standing = {
    name: string;
    points: number;
    wins: number;
    rounds: number;
    prf: number; // average points fraction per round (points / 4)
    omw: number; // opponents' match win % (avg opponents' prf, floored 0.33 each)
  };

  function splitPlayersForTwoHeads(line: string): string[] {
    const cleaned = line.replace(/\s*\(sin oponente\)\s*$/i, '');
    const m = cleaned.match(/^\s*Equipo:\s*(.+)$/i);
    const names = m ? m[1].split(/\s+y\s+/i) : [line];
    return names.map((s) => s.trim()).filter(Boolean);
  }

  function buildStandingsFromRounds(): Standing[] {
    const raw = localStorage.getItem(ROUNDS_KEY);
    const rounds = raw ? JSON.parse(raw) : [];
    const pts = new Map<string, number>();
    const wins = new Map<string, number>();
    const rnds = new Map<string, number>();
    const perRoundOpponents: Map<string, Set<string>> = new Map();
    const perRoundPlayerPRF = new Map<string, number>(); // average across all rounds

    const countPlayersInRound = (modeEntry: string, line: string) => (modeEntry === 'twoHeads' ? splitPlayersForTwoHeads(line) : [line]);

    if (Array.isArray(rounds)) {
      rounds.forEach((entry: any) => {
        const modeEntry: string = entry?.mode || mode;
        const rows: any[] = entry?.rows || [];
        const tablesSnap: string[][] = entry?.tablesSnapshot || [];
        // accumulate PRF for each player this round (points/4 for the round)
        const roundPoints = new Map<string, number>();
        const roundRounds = new Set<string>();
        const roundWins = new Map<string, number>();
        rows.forEach((r) => {
          const participante = String(r.Participante || '');
          const points = Number(r.Puntos) || 0;
          const victoria = Number(r.Victorias) || 0;
          const ppl = countPlayersInRound(modeEntry, participante);
          const add = points;
          ppl.forEach((nm) => {
            const k = nm.trim();
            if (!k) return;
            pts.set(k, (pts.get(k) || 0) + add);
            wins.set(k, (wins.get(k) || 0) + victoria);
            roundPoints.set(k, (roundPoints.get(k) || 0) + add);
            roundWins.set(k, (roundWins.get(k) || 0) + victoria);
          });
        });
        tablesSnap.forEach((tbl: string[]) => {
          const playersInTable = tbl.flatMap((line) => countPlayersInRound(modeEntry, line).map((nm) => nm.trim()).filter(Boolean));
          playersInTable.forEach((p) => {
            roundRounds.add(p);
            const opps = playersInTable.filter((o) => o !== p);
            if (!perRoundOpponents.has(p)) perRoundOpponents.set(p, new Set());
            opps.forEach((o) => perRoundOpponents.get(p)!.add(o));
          });
        });
        // commit rounds played and PRF for this round
        Array.from(roundRounds).forEach((p) => rnds.set(p, (rnds.get(p) || 0) + 1));
        // accumulate PRF across rounds
        roundPoints.forEach((rp, p) => {
          const prfRound = rp / 4;
          perRoundPlayerPRF.set(p, (perRoundPlayerPRF.get(p) || 0) + prfRound);
        });
      });
    }

    const names = Array.from(new Set(players.concat(Array.from(pts.keys()), Array.from(rnds.keys()))));
    const standings: Standing[] = names.map((name) => {
      const roundsPlayed = rnds.get(name) || 0;
      const points = pts.get(name) || 0;
      const w = wins.get(name) || 0;
      const prf = roundsPlayed > 0 ? (perRoundPlayerPRF.get(name) || 0) / roundsPlayed : 0;
      // compute OMW% as average of opponents' PRF (with floor 0.33 per opponent)
      const opps = perRoundOpponents.get(name) || new Set<string>();
      let omw = 0;
      if (opps.size > 0) {
        let sum = 0;
        opps.forEach((opp) => {
          const oppRounds = rnds.get(opp) || 0;
          const oppPRF = oppRounds > 0 ? (perRoundPlayerPRF.get(opp) || 0) / oppRounds : 0;
          const floored = Math.max(0.33, oppPRF);
          sum += floored;
        });
        omw = sum / opps.size;
      }
      return { name, points, wins: w, rounds: roundsPlayed, prf, omw };
    });
    standings.sort((a, b) => b.points - a.points || b.omw - a.omw || b.wins - a.wins || b.prf - a.prf || a.name.localeCompare(b.name));
    return standings;
  }

  function generateRoundFromStandings(roundNumber: number) {
    // Require minimum 3 participants for FFA multi
    const validPlayers = players.map((p) => p.trim()).filter(Boolean);
    if (validPlayers.length < 3) {
      setErrorMsg('no hay suficientes jugadores registrados');
      return;
    }
    // Ensure tableSizes are set
    let sizes = tableSizes;
    if (!sizes || sizes.length === 0) {
      sizes = computeInitialTableSizes(players.length);
      setTableSizes(sizes);
    }
    // block if pending results
    if (pendingRound) {
      alert('Debes guardar los resultados de la ronda actual antes de generar la siguiente.');
      return;
    }
    const standings = buildStandingsFromRounds();
    const ordered = standings.map((s) => s.name);
    const result: string[][] = [];
    let idx = 0;
    sizes.forEach((sz) => {
      const group = ordered.slice(idx, idx + sz);
      if (group.length > 0) result.push(group);
      idx += sz;
    });
    setTables(result);
    setNotice(`Ronda ${roundNumber}: mesas generadas automáticamente por standings.`);
    try {
      setCurrentPairings({ title: `${title} — Ronda ${roundNumber}`, mode: 'ffa', tables: result, generatedAt: Date.now() });
    } catch {}
    try { localStorage.setItem(PENDING_KEY, '1'); setPendingRound(true); } catch {}
  }

  // Two-Heads: generate teams by standings adjacency and place 2 teams per table
  function generateTwoHeadsRoundFromStandings(roundNumber: number) {
    const list = players.map((p) => p.trim()).filter(Boolean);
    if (list.length < 4) {
      setErrorMsg('no hay suficientes jugadores registrados');
      return;
    }
    if (pendingRound) {
      alert('Debes guardar los resultados de la ronda actual antes de generar la siguiente.');
      return;
    }
    // order by current standings (individual), filter to current participants order
    const standings = buildStandingsFromRounds();
    const order = standings
      .map((s) => s.name)
      .filter((nm) => list.some((p) => p === nm));
    // ensure any players without standings are appended (e.g., first round after reset?)
    const unseen = list.filter((p) => !order.includes(p));
    const ordered = [...order, ...unseen];
    // build teams: adjacent pairs
    const teams: string[][] = [];
    for (let i = 0; i < ordered.length; i += 2) {
      teams.push(ordered.slice(i, i + 2));
    }
    // tables: 2 teams per table
    const result: string[][] = [];
    let idx = 0;
    while (idx + 1 < teams.length) {
      const teamA = teams[idx];
      const teamB = teams[idx + 1];
      result.push([
        `Equipo: ${teamA.join(' y ')}`,
        `Equipo: ${teamB.join(' y ')}`,
      ]);
      idx += 2;
    }
    if (idx < teams.length) {
      const lone = teams[idx];
      result.push([`Equipo: ${lone.join(' y ')} (sin oponente)`]);
      setNotice('Aviso: número impar de equipos, una mesa con un solo equipo.');
    } else {
      setNotice('');
    }
    setTables(result);
    try {
      setCurrentPairings({ title: `${title} — Ronda ${roundNumber}`, mode: 'twoHeads', tables: result, generatedAt: Date.now() });
    } catch {}
    try { localStorage.setItem(PENDING_KEY, '1'); setPendingRound(true); } catch {}
  }

  // OneVsOne: generate 1v1 matches by standings adjacency
  function generateOneVsOneRoundFromStandings(roundNumber: number) {
    const list = players.map((p) => p.trim()).filter(Boolean);
    if (list.length < 2) {
      setErrorMsg('no hay suficientes jugadores registrados');
      return;
    }
    if (pendingRound) {
      alert('Debes guardar los resultados de la ronda actual antes de generar la siguiente.');
      return;
    }
    // order by current standings
    const standings = buildStandingsFromRounds();
    const order = standings
      .map((s) => s.name)
      .filter((nm) => list.some((p) => p === nm));
    // ensure any players without standings are appended
    const unseen = list.filter((p) => !order.includes(p));
    const ordered = [...order, ...unseen];
    
    // create 1v1 matches: pair adjacent players
    const result: string[][] = [];
    for (let i = 0; i < ordered.length; i += 2) {
      if (i + 1 < ordered.length) {
        result.push([ordered[i], ordered[i + 1]]);
      } else {
        // odd number of players, one bye
        result.push([ordered[i] + ' (bye)']);
        setNotice('Aviso: número impar de jugadores, un jugador recibe bye.');
      }
    }
    
    if (ordered.length % 2 === 0) {
      setNotice('');
    }
    
    setTables(result);
    try {
      setCurrentPairings({ title: `${title} — Ronda ${roundNumber}`, mode: 'oneVsOne', tables: result, generatedAt: Date.now() });
    } catch {}
    try { localStorage.setItem(PENDING_KEY, '1'); setPendingRound(true); } catch {}
  }

  function startTournament() {
    const list = players.map((p) => p.trim()).filter(Boolean);
    if (list.length === 0) {
      setTables([]);
      setNotice("No hay participantes");
      return;
    }
    const shuffled = shuffle(list);
    // If manual mode active for oneVsOne and R1 not yet generated, do not auto-generate
    if (mode === 'oneVsOne' && manualOneVsOne) {
      setNotice('Modo manual activo: arma los enfrentamientos seleccionando jugadores de a pares.');
      setTables([]);
      return;
    }
    if (mode === 'twoHeads') {
      // Form teams of 2
      const teams: string[][] = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        teams.push(shuffled.slice(i, i + 2));
      }
      // Group teams into tables of 2 teams
      const result: string[][] = [];
      let idx = 0;
      while (idx + 1 < teams.length) {
        const teamA = teams[idx];
        const teamB = teams[idx + 1];
        result.push([
          `Equipo: ${teamA.join(' y ')}`,
          `Equipo: ${teamB.join(' y ')}`,
        ]);
        idx += 2;
      }
      if (idx < teams.length) {
        // leftover single team
        const lone = teams[idx];
        result.push([`Equipo: ${lone.join(' y ')} (sin oponente)`]);
        setNotice('Aviso: número impar de equipos, una mesa con un solo equipo.');
      } else {
        setNotice('');
      }
      setTables(result);
      try {
        setCurrentPairings({ title, mode: 'twoHeads', tables: result, generatedAt: Date.now() });
      } catch {}
    } else if (mode === 'oneVsOne') {
      // Create 1v1 matches
      const result: string[][] = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          result.push([shuffled[i], shuffled[i + 1]]);
        } else {
          // odd number of players, one bye
          result.push([shuffled[i] + ' (bye)']);
          setNotice('Aviso: número impar de jugadores, un jugador recibe bye.');
        }
      }
      if (shuffled.length % 2 === 0) {
        setNotice('');
      }
      setTables(result);
      try {
        setCurrentPairings({ title, mode: 'oneVsOne', tables: result, generatedAt: Date.now() });
      } catch {}
    } else {
      const { groupsOf4, groupsOf3, fallback } = computeGroups(shuffled.length);
      const result: string[][] = [];
      let idx = 0;
      if (fallback && (fallback < 3 || fallback === 5)) {
        // Create a single fallback table with all players (sizes 1,2,5)
        result.push(shuffled.slice(0, fallback));
        idx = fallback;
        setNotice(`Aviso: Se creó una mesa de ${fallback} jugadores por ajuste de tamaño.`);
      } else {
        setNotice("");
      }
      for (let i = 0; i < groupsOf4; i++) {
        result.push(shuffled.slice(idx, idx + 4));
        idx += 4;
      }
      for (let i = 0; i < groupsOf3; i++) {
        result.push(shuffled.slice(idx, idx + 3));
        idx += 3;
      }
      if (idx < shuffled.length) {
        result.push(shuffled.slice(idx));
        if (!notice) setNotice("Aviso: Se ajustó una mesa para cubrir a todos los participantes.");
      }
      setTables(result);
      try {
        setCurrentPairings({ title, mode: 'ffa', tables: result, generatedAt: Date.now() });
      } catch {}
    }
  }

  function saveResultsToStorageAndExcel() {
    if (isSaving) return;
    // Basic guards
    if (!pendingRound) {
      setErrorMsg('No hay una ronda pendiente para guardar.');
      return;
    }
    if (!tables || tables.length === 0) {
      setErrorMsg('No hay mesas para guardar resultados.');
      return;
    }
    // Check at least one placement selected
    const anySelected = (placements || []).some((arr, ti) => Array.isArray(arr) && arr.some((v) => v !== -1 && tables[ti] && tables[ti][v] != null));
    if (!anySelected) {
      setErrorMsg('Debes seleccionar al menos un resultado antes de guardar.');
      return;
    }
    setIsSaving(true);
    // Build rows from placements + points per player
    const time = Date.now();
    // New scoring: 1st=4, 2nd=3, 3rd=2, 4th=1
    const SCORING = [4, 3, 2, 1];
    const rows: Array<{ Ronda: number; Titulo: string; Modo: string; Mesa: number; Puesto: number; Participante: string; Puntos: number; Victorias: number; Fecha: string }>
      = [];
    const pointsByPlayer = new Map<string, number>();
    const winsByPlayer = new Map<string, number>();

    const addPoints = (name: string, pts: number) => {
      const n = name.trim();
      if (!n) return;
      pointsByPlayer.set(n, (pointsByPlayer.get(n) || 0) + pts);
    };
    const addWin = (name: string, w: number) => {
      const n = name.trim();
      if (!n) return;
      winsByPlayer.set(n, (winsByPlayer.get(n) || 0) + w);
    };

    tables.forEach((table, ti) => {
      const p = placements[ti] || [];
      p.forEach((selIdx, pos) => {
        if (selIdx !== -1 && table[selIdx] != null) {
          const participante = table[selIdx];
          const puntos = SCORING[pos] ?? 0;
          const victoria = pos === 0 ? 1 : 0;
          rows.push({
            Ronda: 0, // temp, will fill after round number computed
            Titulo: title,
            Modo: mode === 'twoHeads' ? 'twoHeads' : (mode === 'oneVsOne' ? 'oneVsOne' : 'ffa'),
            Mesa: ti + 1,
            Puesto: pos + 1,
            Participante: participante,
            Puntos: puntos,
            Victorias: victoria,
            Fecha: new Date(time).toLocaleString(),
          });
          if (mode === 'twoHeads') {
            // participante string like "Equipo: A y B" (maybe with suffix)
            const cleaned = participante.replace(/\s*\(sin oponente\)\s*$/i, '');
            const m = cleaned.match(/^\s*Equipo:\s*(.+)$/i);
            const names = m ? m[1].split(/\s+y\s+/i) : [participante];
            names.forEach((nm) => addPoints(nm, puntos));
            if (victoria) names.forEach((nm) => addWin(nm, 1));
          } else {
            addPoints(participante, puntos);
            if (victoria) addWin(participante, 1);
          }
        }
      });
    });

    // Persist as a new round in localStorage
    try {
      const raw = localStorage.getItem(ROUNDS_KEY);
      const rounds = raw ? JSON.parse(raw) : [];
      const roundNumber = Array.isArray(rounds) ? rounds.length + 1 : 1;
      const isFinalRound = roundNumber === roundsTotal;
      // Fill Ronda
      rows.forEach(r => { r.Ronda = roundNumber; });
      const entry = {
        round: roundNumber,
        title,
        mode: mode,
        timestamp: time,
        tablesSnapshot: tables,
        placements,
        rows,
      };
      const nextRounds = Array.isArray(rounds) ? [...rounds, entry] : [entry];
      localStorage.setItem(ROUNDS_KEY, JSON.stringify(nextRounds));
      // Export CSV (detalle + resumen) ONLY when this was the final round
      if (isFinalRound) {
        const aoa: any[][] = [];
        aoa.push(["Ronda", "Titulo", "Modo", "Mesa", "Puesto", "Participante", "Puntos", "Victorias", "Fecha"]);
        // include ALL rounds played (detalle completo)
        try {
          const all = Array.isArray(nextRounds) ? nextRounds.slice().sort((a, b) => (a.round || 0) - (b.round || 0)) : [];
          all.forEach((ent: any) => {
            const rs: typeof rows = Array.isArray(ent?.rows) ? ent.rows : [];
            rs.forEach((r) => {
              aoa.push([r.Ronda, r.Titulo, r.Modo, r.Mesa, r.Puesto, r.Participante, r.Puntos, r.Victorias, r.Fecha]);
            });
          });
        } catch {
          // fallback to current round rows only
          rows.forEach((r) => aoa.push([r.Ronda, r.Titulo, r.Modo, r.Mesa, r.Puesto, r.Participante, r.Puntos, r.Victorias, r.Fecha]));
        }
        aoa.push([]);
        aoa.push(["Resumen por jugador (incluye desempates)"]);
        aoa.push(["Jugador", "Puntos", "OMW%", "Victorias", "PRF%", "Rondas"]);
        const namesSet = new Set<string>([...Array.from(pointsByPlayer.keys()), ...Array.from(winsByPlayer.keys())]);
        let standingsForExport: ReturnType<typeof buildStandingsFromRounds> = [];
        try { standingsForExport = buildStandingsFromRounds(); } catch {}
        const standingsMap = new Map<string, { omw: number; prf: number; points: number; wins: number; rounds: number }>();
        standingsForExport.forEach((s) => standingsMap.set(s.name, { omw: s.omw, prf: s.prf, points: s.points, wins: s.wins, rounds: s.rounds }));
        const summary = Array.from(namesSet)
          .map((nm) => {
            const s = standingsMap.get(nm) || { omw: 0, prf: 0, points: pointsByPlayer.get(nm) || 0, wins: winsByPlayer.get(nm) || 0, rounds: 0 };
            return { name: nm, pts: s.points, omw: s.omw, wins: s.wins, prf: s.prf, rounds: s.rounds };
          })
          .sort((a, b) => b.pts - a.pts || b.omw - a.omw || b.wins - a.wins || b.prf - a.prf || a.name.localeCompare(b.name));
        summary.forEach((row) => aoa.push([row.name, row.pts, Math.round(row.omw * 1000) / 10, row.wins, Math.round(row.prf * 1000) / 10, row.rounds]));
        const safeTitle = (title || 'Torneo').replace(/[^\w\-]+/g, '_').slice(0, 50);
        downloadCsv(`${safeTitle}_resultados.csv`, aoa);
      }
  } catch {}
    // refresh historical after saving
    try {
      const event = new StorageEvent('storage', { key: ROUNDS_KEY });
      window.dispatchEvent(event);
    } catch {}
    // persist current standings for display after save
    try {
      const s = buildStandingsFromRounds();
      setCurrentStandings({ title: `${title} — Clasificación`, generatedAt: Date.now(), rows: s });
    } catch {}
    // clear pending flag (results saved)
    try { localStorage.removeItem(PENDING_KEY); setPendingRound(false); } catch {}
    // Prevent double-save by clearing current tables and pairings (advance to clean state)
    try { startNewRound(); } catch {}
    setIsSaving(false);
  }

  function startNewRound() {
    // Clear current tables and pairings to allow re-asignar en nueva ronda
    setTables([]);
    setPlacements([]);
    setNotice('');
    try {
      localStorage.removeItem(TABLES_KEY);
      localStorage.removeItem(NOTICE_KEY);
    } catch {}
    try { clearCurrentPairings(); broadcast('hideModal'); } catch {}
    // Also clear pending flag to avoid blocking next generation
    try { localStorage.removeItem(PENDING_KEY); setPendingRound(false); } catch {}
  }

  // Discard current pending round without saving (clears tables, notice, pairings, and pending flag)
  function discardPendingRound() {
    startNewRound();
  }

  // Full reset: clears players, tables, rounds, config, notices, pairings, standings, and pending flag
  function resetAll() {
    if (!confirm('¿Reiniciar todo? Esto eliminará participantes, mesas, rondas guardadas y configuración.')) return;
    try {
      // Local state
      setPlayers([]);
      setTables([]);
      setPlacements([]);
      setNotice('');
      setTableSizes([]);
      setRoundsTotal(3);
      setPendingRound(false);
    } catch {}
    try {
      // LocalStorage keys
      localStorage.removeItem(storageKey); // players
      localStorage.removeItem(TABLES_KEY);
      localStorage.removeItem(NOTICE_KEY);
      localStorage.removeItem(ROUNDS_KEY);
      localStorage.removeItem(CONFIG_KEY);
      localStorage.removeItem(PENDING_KEY);
    } catch {}
    try { clearCurrentPairings(); } catch {}
    try { clearCurrentStandings(); } catch {}
    try { broadcast('hideModal'); } catch {}
    // Notify listeners (historical/standings recompute)
    try { window.dispatchEvent(new StorageEvent('storage', { key: ROUNDS_KEY })); } catch {}
  }

  return (<>
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-400">{title}</h1>
          <p className="text-sm text-gray-400 mt-1">Ingresa los nombres de los participantes</p>
        </div>

        {/* Recovery for pending state after refresh with no tables */}
        {pendingRound && tables.length === 0 && (
          <div className="bg-yellow-900/40 border border-yellow-700 rounded-lg p-3 text-yellow-200">
            <div className="text-sm mb-2">Hay una ronda marcada como pendiente, pero no hay mesas cargadas para guardar. ¿Qué deseas hacer?</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={discardPendingRound}
                className="px-3 py-1.5 rounded bg-yellow-700 hover:bg-yellow-800 text-sm"
              >
                Descartar ronda pendiente
              </button>
              <button
                onClick={() => {
                  try {
                    const p = getCurrentPairings();
                    if (p && Array.isArray(p.tables) && p.tables.length) {
                      setTables(p.tables);
                      setNotice(p.title || 'Pareos restaurados');
                      // store tables immediately for persistence
                      try { localStorage.setItem(TABLES_KEY, JSON.stringify(p.tables)); } catch {}
                    } else {
                      alert('No hay pareos guardados para restaurar.');
                    }
                  } catch {
                    alert('No se pudieron restaurar los pareos.');
                  }
                }}
                className="px-3 py-1.5 rounded bg-indigo-700 hover:bg-indigo-800 text-sm"
              >
                Restaurar mesas desde pareos
              </button>
            </div>
          </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Configuración del torneo */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Rondas totales:</label>
              <input
                type="number"
                min={1}
                value={roundsTotal}
                onChange={(e) => setRoundsTotal(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
              />
              <button
                onClick={initTournamentConfig}
                className="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-700 text-sm"
                title="Fijar el patrón de mesas para todas las rondas"
              >
                Fijar mesas
              </button>
              {tableSizes.length > 0 && (
                <span className="text-xs text-gray-400">Patrón: {tableSizes.join(' / ')} (total {tableSizes.reduce((a,b)=>a+b,0)})</span>
              )}
            </div>
            {pendingRound && (
              <button
                onClick={discardPendingRound}
                className="px-3 py-1.5 rounded bg-yellow-700 hover:bg-yellow-800 text-sm"
                title="Descarta la ronda pendiente para desbloquear la UI"
              >
                Descartar ronda pendiente
              </button>
            )}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) {
                  setPlayers((prev) => [...prev, name.trim()]);
                  setName("");
                }
              }}
              placeholder="Nombre del participante"
              className="flex-1 min-w-[220px] bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
            <button
              disabled={!canAdd}
              onClick={() => {
                if (!canAdd) return;
                setPlayers((prev) => [...prev, name.trim()]);
                setName("");
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                canAdd ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              Agregar
            </button>
            <button
              onClick={() => setPlayers([])}
              className="px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700"
            >
              Limpiar lista
            </button>
            <button
              onClick={resetAll}
              className="px-4 py-2 rounded-lg font-semibold bg-red-700 hover:bg-red-800"
              title="Reinicia participantes, mesas, rondas y configuración"
            >
              Reiniciar todo
            </button>
            {mode === 'twoHeads' && (
              <>
                {roundsSavedCount === 0 && !pendingRound && tables.length === 0 && (
                  <button
                    onClick={() => {
                      const list = players.map((p)=>p.trim()).filter(Boolean);
                      if (list.length < 4) { setErrorMsg('no hay suficientes jugadores registrados'); return; }
                      // Generate R1 for two heads (teams + tables of 2 teams)
                      startTournament();
                      try { localStorage.setItem(PENDING_KEY, '1'); setPendingRound(true); } catch {}
                    }}
                    className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-sm"
                  >
                    Generar Ronda 1 (aleatoria)
                  </button>
                )}
                {roundsSavedCount >= 1 && roundsSavedCount < roundsTotal && !pendingRound && (
                  <button
                    onClick={() => {
                      const next = roundsSavedCount + 1;
                      generateTwoHeadsRoundFromStandings(next);
                    }}
                    className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-sm"
                  >
                    Generar siguiente ronda (auto)
                  </button>
                )}
              </>
            )}
            {mode === 'ffa' && (
              <>
                {/* Show Generate R1 only if no rounds saved yet and no pending/tables */}
                {roundsSavedCount === 0 && !pendingRound && tables.length === 0 && (
                  <button
                    onClick={() => {
                      if (pendingRound) { alert('Debes guardar los resultados de la ronda actual antes de generar una nueva.'); return; }
                      const list = players.map((p)=>p.trim()).filter(Boolean);
                      if (list.length < 3) { setErrorMsg('no hay suficientes jugadores registrados'); return; }
                      // Generar Ronda 1 aleatoria con patrón de mesas
                      const count = list.length;
                      const sizes = tableSizes.length ? tableSizes : computeInitialTableSizes(count);
                      setTableSizes(sizes);
                      const pool = shuffle(list);
                      const res: string[][] = [];
                      let i = 0;
                      sizes.forEach((sz)=>{ const g = pool.slice(i, i+sz); if (g.length) res.push(g); i += sz; });
                      setTables(res);
                      setNotice('Ronda 1 generada aleatoriamente.');
                      try { setCurrentPairings({ title: `${title} — Ronda 1`, mode: 'ffa', tables: res, generatedAt: Date.now() }); } catch {}
                      try { localStorage.setItem(PENDING_KEY, '1'); setPendingRound(true); } catch {}
                    }}
                    className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-sm"
                  >
                    Generar Ronda 1 (aleatoria)
                  </button>
                )}
                {/* Show Generate next only when at least 1 round saved, under total, and not pending */}
                {roundsSavedCount >= 1 && roundsSavedCount < roundsTotal && !pendingRound && (
                  <button
                    onClick={() => {
                      const next = roundsSavedCount + 1;
                      generateRoundFromStandings(next);
                    }}
                    className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-sm"
                  >
                    Generar siguiente ronda (auto)
                  </button>
                )}
              </>
            )}
            {mode === 'oneVsOne' && (
              <>
                {roundsSavedCount === 0 && !pendingRound && tables.length === 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const list = players.map((p)=>p.trim()).filter(Boolean);
                        if (list.length < 2) { setErrorMsg('no hay suficientes jugadores registrados'); return; }
                        // Generar Ronda 1 aleatoria 1vs1
                        startTournament();
                        try { localStorage.setItem(PENDING_KEY, '1'); setPendingRound(true); } catch {}
                      }}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      Generar Ronda 1 (aleatoria)
                    </button>
                    <button
                      onClick={() => {
                        if (pendingRound) { alert('Debes guardar los resultados de la ronda actual antes de generar una nueva.'); return; }
                        setManualOneVsOne(true);
                        setTables([]);
                        setManualPick([]);
                        setNotice('Modo manual 1vs1 activo: selecciona 2 jugadores para crear un enfrentamiento.');
                      }}
                      className="px-3 py-1.5 rounded bg-teal-700 hover:bg-teal-800 text-sm"
                      title="Construir pareos manualmente"
                    >
                      Emparejamiento manual (1vs1)
                    </button>
                  </div>
                )}
                {roundsSavedCount >= 1 && roundsSavedCount < roundsTotal && !pendingRound && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = roundsSavedCount + 1;
                        generateOneVsOneRoundFromStandings(next);
                      }}
                      className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-sm"
                    >
                      Generar siguiente ronda (auto)
                    </button>
                    <button
                      onClick={() => {
                        setManualOneVsOne(true);
                        setTables([]);
                        setManualPick([]);
                        setNotice(`Modo manual 1vs1 activo para Ronda ${roundsSavedCount + 1}: selecciona 2 jugadores para crear un enfrentamiento.`);
                      }}
                      className="px-3 py-1.5 rounded bg-teal-700 hover:bg-teal-800 text-sm"
                    >
                      Emparejamiento manual (1vs1)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3 text-blue-300">Participantes ({players.length})</h2>
          {players.length === 0 ? (
            <div className="text-sm text-gray-400">No hay participantes aún.</div>
          ) : (
            <ul className="space-y-2">
              {players.map((p, idx) => (
                <li key={`${p}-${idx}`} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                  <span className="truncate mr-3">{idx + 1}. {p}</span>
                  <button
                    onClick={() => setPlayers((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-sm px-2 py-1 rounded bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 1vs1 manual pairing builder */}
        {mode === 'oneVsOne' && manualOneVsOne && !pendingRound && (
          <div className="bg-gray-800 border border-teal-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-teal-300">Constructor de emparejamientos (1vs1)</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // confirm pairings
                    const allPlayers = players.map((p)=>p.trim()).filter(Boolean);
                    const used = new Set<string>();
                    tables.forEach((tbl) => {
                      tbl.forEach((line) => {
                        const nm = line.replace(/\s*\(bye\)\s*$/i, '').trim();
                        if (nm) used.add(nm);
                      });
                    });
                    // all players must be used, except optionally one bye
                    const available = allPlayers.filter((p) => !used.has(p));
                    if (manualPick.length > 0) {
                      alert('Tienes un jugador seleccionado sin asignar. Empareja o asigna bye antes de confirmar.');
                      return;
                    }
                    if (available.length > 0) {
                      alert('Faltan jugadores por emparejar.');
                      return;
                    }
                    // lock as pending and publish pairings
                    const nextRound = roundsSavedCount + 1;
                    setNotice(`Ronda ${nextRound}: pareos configurados manualmente.`);
                    try { setCurrentPairings({ title: `${title} — Ronda ${nextRound}`, mode: 'oneVsOne', tables, generatedAt: Date.now() }); } catch {}
                    try { localStorage.setItem(PENDING_KEY, '1'); setPendingRound(true); } catch {}
                    setManualOneVsOne(false);
                  }}
                  disabled={tables.length === 0}
                  className={`px-3 py-1.5 rounded text-sm ${tables.length === 0 ? 'bg-gray-700 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
                >
                  Confirmar pareos
                </button>
                <button
                  onClick={() => { setManualOneVsOne(false); setManualPick([]); setTables([]); setNotice(''); }}
                  className="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-700 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
            {/* Available players and current pairs */}
            {(() => {
              const usedNow = new Set<string>();
              tables.forEach((tbl) => tbl.forEach((line) => usedNow.add(line.replace(/\s*\(bye\)\s*$/i, '').trim())));
              const available = players.map((p)=>p.trim()).filter(Boolean).filter((p) => !usedNow.has(p) && !manualPick.includes(p));
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-300 mb-2">Jugadores disponibles ({available.length})</div>
                    {available.length === 0 ? (
                      <div className="text-xs text-gray-500">No hay jugadores disponibles.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {available.map((p) => (
                          <button
                            key={p}
                            onClick={() => {
                              setManualPick((prev) => {
                                if (prev.includes(p)) return prev;
                                const next = [...prev, p].slice(0, 2);
                                if (next.length === 2) {
                                  // create a pair (idempotent)
                                  setTables((prevTables) => {
                                    const a = next[0];
                                    const b = next[1];
                                    const exists = prevTables.some((tbl) => (
                                      tbl.length === 2 && (
                                        (tbl[0] === a && tbl[1] === b) || (tbl[0] === b && tbl[1] === a)
                                      )
                                    ));
                                    if (exists) return prevTables;
                                    return [...prevTables, [a, b]];
                                  });
                                  return [];
                                }
                                return next;
                              });
                            }}
                            className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      <div className="text-sm text-gray-300 mb-1">Selección actual ({manualPick.length}/2)</div>
                      <div className="flex flex-wrap gap-2">
                        {manualPick.map((p) => (
                          <span key={p} className="px-2 py-1 bg-indigo-700 rounded text-xs">{p}</span>
                        ))}
                        {manualPick.length === 1 && (
                          <button
                            onClick={() => {
                              const p = manualPick[0];
                              setTables((prev) => {
                                const exists = prev.some((tbl) => tbl.length === 1 && tbl[0].replace(/\s*\(bye\)\s*$/i,'').trim() === p);
                                if (exists) return prev;
                                return [...prev, [`${p} (bye)`]];
                              });
                              setManualPick([]);
                            }}
                            className="px-2 py-1 bg-yellow-700 hover:bg-yellow-800 rounded text-xs"
                            title="Asignar bye al jugador seleccionado"
                          >
                            Asignar bye
                          </button>
                        )}
                        {manualPick.length > 0 && (
                          <button
                            onClick={() => setManualPick([])}
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                          >
                            Limpiar selección
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300 mb-2">Pareos actuales ({tables.length})</div>
                    {tables.length === 0 ? (
                      <div className="text-xs text-gray-500">Aún no hay mesas creadas.</div>
                    ) : (
                      <div className="space-y-2">
                        {tables.map((tbl, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded px-3 py-2">
                            <div className="text-sm text-gray-200 truncate">Mesa {i+1}: {tbl.join(' vs ')}</div>
                            <button
                              onClick={() => {
                                // remove table i
                                setTables((prev) => prev.filter((_, idx) => idx !== i));
                              }}
                              className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {tables.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-green-300">Mesas</h2>
              <div className="flex items-center gap-2">
                {roundsSavedCount === 0 && (
                  <button
                    onClick={startTournament}
                    className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-sm"
                    title="Re-asignar aleatoriamente solo para la Ronda 1"
                  >
                    Re-asignar aleatorio
                  </button>
                )}
                {pairingsModalOpen ? (
                  <button
                    onClick={() => { setPairingsModalOpen(false); try { broadcast('hideModal'); } catch {} }}
                    className="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-700 text-sm"
                    title="Ocultar los pareos en la pantalla"
                  >
                    Dejar de mostrar
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      try {
                        // Ensure current pairings reflect current view
                        setCurrentPairings({ title, mode, tables, generatedAt: Date.now() });
                      } catch {}
                      setPairingsModalOpen(true); // optimistic
                      try { broadcast('showModal', { type: 'pairings' }); } catch {}
                    }}
                    className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-sm"
                    title="Mostrar los pareos en la pantalla del Timer/Slider"
                  >
                    Mostrar en pantalla
                  </button>
                )}
                <button
                  onClick={saveResultsToStorageAndExcel}
                  disabled={isSaving}
                  className={`px-3 py-1.5 rounded text-sm ${isSaving ? 'bg-teal-900 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
                  title={roundsSavedCount + 1 === roundsTotal ? 'Guardar resultados y exportar Excel/CSV' : 'Guardar resultados de esta ronda'}
                >
                  {isSaving ? 'Guardando…' : (roundsSavedCount + 1 === roundsTotal ? 'Guardar y exportar' : 'Guardar resultados')}
                </button>
              </div>
            </div>
            {notice && (
              <div className="mb-3 text-xs text-yellow-300">{notice}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tables.map((table, i) => (
                <div key={i} className="border border-gray-700 rounded p-3 bg-gray-900">
                  <div className="font-semibold text-gray-200 mb-2">Mesa {i + 1} ({table.length} {mode === 'twoHeads' ? 'equipos' : 'jugadores'})</div>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {table.map((p, idx) => (
                      <li key={idx} className="truncate">• {p}</li>
                    ))}
                  </ul>
                  {/* Resultados: 1ro a 4to si es posible */}
                  <div className="mt-3 border-t border-gray-800 pt-3">
                    <div className="text-sm text-gray-400 mb-2">Resultados</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Array.from({ length: Math.min(4, table.length) }, (_, pos) => pos).map((pos) => {
                        const selectedForTable = placements[i] || [];
                        const used = new Set(selectedForTable.slice(0, pos).filter((x) => x !== -1));
                        const options = table.map((name, idx) => ({ name, idx })).filter((o) => !used.has(o.idx));
                        const value = selectedForTable[pos] ?? -1;
                        return (
                          <div key={pos} className="flex flex-col sm:flex-row gap-2 sm:items-center min-w-0">
                            <label className="sm:w-24 w-full text-xs text-gray-400 shrink-0">{pos + 1}º lugar</label>
                            <select
                              value={value}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                setPlacements((prev) => {
                                  const copy = prev.map((arr) => arr.slice());
                                  if (!copy[i]) copy[i] = Array(Math.min(4, table.length)).fill(-1);
                                  // remove v from other positions in this table to keep uniqueness
                                  if (!Number.isNaN(v) && v !== -1) {
                                    for (let k = 0; k < copy[i].length; k++) {
                                      if (k !== pos && copy[i][k] === v) copy[i][k] = -1;
                                    }
                                  }
                                  copy[i][pos] = Number.isNaN(v) ? -1 : v;
                                  // Auto-asignar segundo lugar en 1vs1 cuando se selecciona el primero
                                  if (mode === 'oneVsOne' && table.length === 2) {
                                    // Si ya se eligió primer lugar y aún no se asignó segundo, completarlo automáticamente
                                    const firstIdx = copy[i][0];
                                    if (firstIdx !== -1) {
                                      const otherIdx = firstIdx === 0 ? 1 : 0;
                                      // Solo asignar si el segundo lugar está vacío o apunta al mismo jugador que el primero
                                      if (copy[i][1] === -1 || copy[i][1] === firstIdx) {
                                        copy[i][1] = otherIdx;
                                      }
                                      // Si el usuario seleccionó primero el segundo lugar, y luego el primero, asegurar coherencia
                                      if (pos === 1 && copy[i][1] !== -1 && copy[i][0] !== -1) {
                                        // Recalcular por si se invierte orden manualmente
                                        const f = copy[i][0];
                                        const expectedSecond = f === 0 ? 1 : 0;
                                        copy[i][1] = expectedSecond;
                                      }
                                    }
                                  }
                                  return copy;
                                });
                              }}
                              className="w-full min-w-0 max-w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                            >
                              <option value={-1}>— Sin seleccionar —</option>
                              {options.map((o) => (
                                <option key={o.idx} value={o.idx}>{o.name}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detalle por ronda (único bloque, sin histórico acumulado) */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-semibold text-blue-300">Detalle por ronda</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!confirm('¿Limpiar histórico de rondas? Los participantes permanecerán.')) return;
                  try { localStorage.removeItem(ROUNDS_KEY); } catch {}
                  // force recompute
                  try {
                    const event = new StorageEvent('storage', { key: ROUNDS_KEY });
                    window.dispatchEvent(event);
                  } catch {}
                }}
                className="px-3 py-1.5 rounded bg-red-700 hover:bg-red-800 text-sm"
              >
                Limpiar histórico
              </button>
            </div>
          </div>
          {roundsDetail.length === 0 ? (
            <div className="text-sm text-gray-400">Sin datos de rondas aún.</div>
          ) : (
            <div className="space-y-3">
              {roundsDetail.map((rd) => (
                <div key={rd.round} className="border border-gray-700 rounded p-3 bg-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-200">Ronda {rd.round}</div>
                    <div className="text-xs text-gray-400">{new Date(rd.timestamp).toLocaleString()}</div>
                  </div>
                  {/* Mesas jugadas en la ronda */}
                  <div className="mb-2">
                    <div className="text-xs text-gray-400 mb-1">Mesas</div>
                    {rd.tables.length === 0 ? (
                      <div className="text-xs text-gray-500">Sin mesas registradas.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rd.tables.map((tbl, i) => (
                          <div key={i} className="bg-gray-800 border border-gray-700 rounded p-2">
                            <div className="text-xs font-semibold text-gray-200 mb-1">Mesa {i + 1}</div>
                            <ul className="space-y-0.5">
                              {tbl.map((line, idx) => (
                                <li key={idx} className="text-xs text-gray-300 truncate">• {line}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {rd.players.length === 0 ? (
                    <div className="text-xs text-gray-500">No hubo puntuaciones registradas.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rd.players.map((p) => (
                        <div key={p.name} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-2 py-1">
                          <div className="text-xs text-gray-200 truncate" title={p.name}>{p.name}</div>
                          <div className="text-xs font-semibold text-green-300">{p.points} pts</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clasificación en vivo */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-green-300">Clasificación</h2>
            <div className="flex items-center gap-2">
              {roundsSavedCount >= roundsTotal && (
                <button
                  onClick={() => {
                    try {
                      const s = buildStandingsFromRounds();
                      const aoa: any[][] = [];
                      aoa.push(["#", "Jugador", "Puntos", "OMW%", "Victorias", "PRF%", "Rondas"]);
                      s.forEach((row, i) => aoa.push([
                        i + 1,
                        row.name,
                        row.points,
                        Math.round(row.omw * 1000) / 10,
                        row.wins,
                        Math.round(row.prf * 1000) / 10,
                        row.rounds,
                      ]));
                      const d = new Date();
                      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                      downloadCsv(`${dateStr}.csv`, aoa);
                    } catch {}
                  }}
                  className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-700 text-sm"
                  title="Exportar clasificación final"
                >
                  Exportar clasificación
                </button>
              )}
              {standingsModalOpen ? (
                <button
                  onClick={() => {
                    setStandingsModalOpen(false);
                    try { broadcast('hideModal'); } catch {}
                  }}
                  className="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-700 text-sm"
                  title="Ocultar la clasificación en la pantalla"
                >
                  Dejar de mostrar
                </button>
              ) : (
                <button
                  onClick={() => {
                    try {
                      const s = buildStandingsFromRounds();
                      setCurrentStandings({ title: `${title} — Clasificación`, generatedAt: Date.now(), rows: s });
                    } catch {}
                    setStandingsModalOpen(true); // optimistic (we don't receive our own broadcast)
                    try { 
                      // show standings on display
                      broadcast('showModal', { type: 'standings' });
                    } catch {}
                  }}
                  className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-sm"
                  title="Mostrar la clasificación en la pantalla del Timer/Slider"
                >
                  Mostrar en pantalla
                </button>
              )}
              <a
                href="/clasificacion"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-700 text-sm"
                title="Abrir vista dedicada de clasificación"
              >
                Abrir vista
              </a>
            </div>
          </div>
          {liveStandings.length === 0 ? (
            <div className="text-sm text-gray-400">Sin datos aún. Guarda resultados de al menos una ronda.</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-300">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Jugador</th>
                    <th className="py-2 pr-3">Puntos</th>
                    <th className="py-2 pr-3">OMW%</th>
                    <th className="py-2 pr-3">Victorias</th>
                    <th className="py-2 pr-3">PRF%</th>
                    <th className="py-2 pr-3">Rondas</th>
                  </tr>
                </thead>
                <tbody>
                  {liveStandings.map((r, i) => (
                    <tr key={r.name} className="border-t border-gray-700">
                      <td className="py-1.5 pr-3 text-gray-300">{i + 1}</td>
                      <td className="py-1.5 pr-3 text-gray-100 truncate" title={r.name}>{r.name}</td>
                      <td className="py-1.5 pr-3 text-green-300 font-semibold">{r.points}</td>
                      <td className="py-1.5 pr-3 text-gray-200">{(r.omw * 100).toFixed(1)}%</td>
                      <td className="py-1.5 pr-3 text-gray-200">{r.wins}</td>
                      <td className="py-1.5 pr-3 text-gray-200">{(r.prf * 100).toFixed(1)}%</td>
                      <td className="py-1.5 pr-3 text-gray-400">{r.rounds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-center">
          <a href="/control" className="text-sm text-gray-300 underline underline-offset-4 hover:text-white">Volver al Panel</a>
        </div>
      </div>
    </div>
    {errorMsg && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setErrorMsg(null)}>
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-5 w-[90%] max-w-sm" onClick={(e) => e.stopPropagation()}>
          <div className="text-lg font-semibold text-red-400 mb-2">Error</div>
          <div className="text-sm text-gray-200 mb-4">{errorMsg}</div>
          <div className="text-right">
            <button
              onClick={() => setErrorMsg(null)}
              className="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-700 text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )}
  </>);
}
