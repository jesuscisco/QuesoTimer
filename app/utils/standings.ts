// Utilities for saving and reading current tournament standings for display/printing

export type StandingRow = {
  name: string;
  points: number;
  wins: number;
  rounds: number;
  prf: number; // 0..1
  omw: number; // 0..1
};

export type StandingsPayload = {
  title: string;
  generatedAt: number;
  rows: StandingRow[];
};

const CURRENT_STANDINGS_KEY = 'standings.current.v1';

export function getCurrentStandings(): StandingsPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_STANDINGS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.rows)) return null;
    return obj as StandingsPayload;
  } catch {
    return null;
  }
}

export function setCurrentStandings(s: StandingsPayload) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(CURRENT_STANDINGS_KEY, JSON.stringify(s)); } catch {}
}

export function clearCurrentStandings() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(CURRENT_STANDINGS_KEY); } catch {}
}

export const STANDINGS_STORAGE_KEY = CURRENT_STANDINGS_KEY;
