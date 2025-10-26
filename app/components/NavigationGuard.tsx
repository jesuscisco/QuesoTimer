"use client";

import { useEffect } from "react";

function hasPending(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (key.endsWith('.pendingRound')) {
        const val = localStorage.getItem(key);
        if (val) return true;
      }
    }
  } catch {}
  return false;
}

export default function NavigationGuard() {
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPending()) {
        e.preventDefault();
        // @ts-ignore: required for cross-browser support
        e.returnValue = '';
        return '';
      }
      return undefined;
    };
    window.addEventListener('beforeunload', beforeUnload);

    const onClick = (e: MouseEvent) => {
      if (!hasPending()) return;
      // Capture anchor clicks for internal navigation
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (!href) return;
      const isInternal = href.startsWith('/') && !anchor.target && anchor.target !== '_blank' && !href.startsWith('//');
      if (!isInternal) return;
      const ok = window.confirm('Hay resultados pendientes de guardar. ¿Seguro que deseas salir de esta página?');
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('click', onClick, true);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, []);
  return null;
}
