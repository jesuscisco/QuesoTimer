// Utilities for saving and reading current tournament pairings to show in the slider modal

export type Pairings = {
  title: string;
  mode: 'ffa' | 'twoHeads' | 'oneVsOne';
  tables: string[][]; // array of tables, each table is array of strings (players or team lines)
  generatedAt: number;
};

const CURRENT_PAIRINGS_KEY = 'pairings.current.v1';

export function getCurrentPairings(): Pairings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_PAIRINGS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.tables)) return null;
    return p as Pairings;
  } catch {
    return null;
  }
}

export function setCurrentPairings(p: Pairings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_PAIRINGS_KEY, JSON.stringify(p));
  } catch {}
}

export function clearCurrentPairings() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(CURRENT_PAIRINGS_KEY); } catch {}
}

export const PAIRINGS_STORAGE_KEY = CURRENT_PAIRINGS_KEY;
