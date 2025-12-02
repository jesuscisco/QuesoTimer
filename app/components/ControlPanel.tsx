"use client";

import { useState, useEffect, useRef } from 'react';
import { playWarning, playOver } from '../utils/sound';
import { getCustomImages, addCustomImages, removeCustomImage, fileToResizedBlob, cacheCustomImage, deleteCachedCustomImage, blobToDataUrl, ensureCustomImagesDataUrls, makeId, getModalImage, setModalImage, cacheModalImage, ensureModalImageDataUrl, type CustomImage, type ModalImage, getCustomImagesAds, addCustomImagesAds, ensureCustomImagesAdsDataUrls, cacheCustomAdsImage, deleteCachedCustomAdsImage, removeCustomImageAds } from '../utils/customImages';
import { getCurrentPairings } from '../utils/pairings';
import { getCurrentStandings } from '../utils/standings';
import { subscribe } from '../utils/broadcast';

interface TimerControlProps {
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onAddTime: (minutes: number) => void;
  onSubtractTime: (minutes: number) => void;
  onAddSeconds: (seconds: number) => void;
  onSubtractSeconds: (seconds: number) => void;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onGoToSlide: (slideIndex: number) => void;
  onToggleAutoSlide: () => void;
  // Ads slider controls
  onAdsNextSlide: () => void;
  onAdsPrevSlide: () => void;
  onAdsGoToSlide: (slideIndex: number) => void;
  onAdsToggleAutoSlide: () => void;
  onShowSliderModal: (image?: string) => void;
  onShowSliderModalPairings: () => void;
  onShowSliderModalStandings: () => void;
  onHideSliderModal: () => void;
  onSetCustomAlert: (minutes: number, seconds: number) => void;
  onClearCustomAlert: () => void;
  onSetTitle: (title: string) => void;
  timerState: {
    minutes: number;
    seconds: number;
    isRunning: boolean;
    isFirstTimer: boolean;
    isFinished: boolean;
  };
  currentSlide: number;
  totalSlides: number;
  autoSlidePaused: boolean;
  // Ads slider state
  adsCurrentSlide: number;
  adsTotalSlides: number;
  adsAutoSlidePaused: boolean;
  customAlertSeconds: number | null;
  currentTitle: string;
}

export default function ControlPanel(props: TimerControlProps) {
  const [timeToAdd, setTimeToAdd] = useState<number>(1);
  const [secondsToAdjust, setSecondsToAdjust] = useState<number>(10);
  const [titleInput, setTitleInput] = useState<string>('');
  const [tournamentModalOpen, setTournamentModalOpen] = useState<boolean>(false);
  const [tournamentTitle, setTournamentTitle] = useState<string>('Boards and Hobbies');
  const [tournamentTarget, setTournamentTarget] = useState<string>('');
  const [customTime, setCustomTime] = useState<{ minutes: number; seconds: number }>({
    minutes: 50,
    seconds: 0
  });
  const [images, setImages] = useState<string[]>([]);
  const [customImages, setCustomImages] = useState<CustomImage[]>([]);
  const [adsCustomImages, setAdsCustomImages] = useState<CustomImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const adsFileInputRef = useRef<HTMLInputElement | null>(null);
  const modalFileRef = useRef<HTMLInputElement | null>(null);
  const [modalImage, setModalImageState] = useState<ModalImage | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);
  const [installAvailable, setInstallAvailable] = useState<boolean>(false);
  const [pairingsCount, setPairingsCount] = useState<number>(0);
  const [pairingsTitle, setPairingsTitle] = useState<string>('');
  const [standingsCount, setStandingsCount] = useState<number>(0);
  const [standingsTitle, setStandingsTitle] = useState<string>('');
  const [pairingsModalOpen, setPairingsModalOpen] = useState<boolean>(false);
  const [standingsModalOpen, setStandingsModalOpen] = useState<boolean>(false);
  const aggregateFilesRef = useRef<HTMLInputElement | null>(null);
  const [aggregating, setAggregating] = useState<boolean>(false);

  // Minimal CSV helpers (compatible with our exported CSVs)
  const toCsv = (aoa: any[][]): string => {
    const esc = (v: any) => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return aoa.map(row => row.map(esc).join(',')).join('\r\n');
  };
  const downloadCsv = (filename: string, aoa: any[][]) => {
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
  };
  const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    let i = 0; const n = text.length; let cur: string[] = []; let field = '';
    let inQuotes = false;
    const pushField = () => { cur.push(field); field = ''; };
    const pushRow = () => { rows.push(cur.slice()); cur = []; };
    while (i < n) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < n && text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        } else { field += ch; i++; continue; }
      } else {
        if (ch === '"') { inQuotes = true; i++; continue; }
        if (ch === ',') { pushField(); i++; continue; }
        if (ch === '\r') { i++; continue; }
        if (ch === '\n') { pushField(); pushRow(); i++; continue; }
        field += ch; i++; continue;
      }
    }
    // flush last
    pushField(); if (cur.length > 1 || (cur.length === 1 && cur[0] !== '')) pushRow();
    return rows;
  };
  const splitTwoHeads = (participante: string): string[] => {
    const cleaned = participante.replace(/\s*\(sin oponente\)\s*$/i, '');
    const m = cleaned.match(/^\s*Equipo:\s*(.+)$/i);
    const names = m ? m[1].split(/\s+y\s+/i) : [participante];
    return names.map((s) => s.trim()).filter(Boolean);
  };
  const yyyymmdd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const detectDateFromName = (name: string): { label: string; date: Date | null } => {
    const m = name.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const y = Number(m[1]); const mo = Number(m[2]); const da = Number(m[3]);
      const dt = new Date(y, mo - 1, da);
      if (!Number.isNaN(dt.getTime())) return { label: `${m[1]}-${m[2]}-${m[3]}`, date: dt };
    }
    return { label: '', date: null };
  };
  const aggregateCsvFiles = async (files: File[]) => {
    setAggregating(true);
    try {
      if (files.length < 2) {
        alert('Selecciona al menos 2 archivos CSV.');
        return;
      }
      // Detect dates from filenames and sort ascending by date when possible
      const withDates = files.map((f, idx) => ({ file: f, idx, meta: detectDateFromName(f.name) }));
      withDates.sort((a, b) => {
        const da = a.meta.date?.getTime();
        const db = b.meta.date?.getTime();
        if (da != null && db != null) return da - db;
        if (da != null) return -1;
        if (db != null) return 1;
        return a.idx - b.idx;
      });
      const perFechaPoints: Array<{ label: string; map: Map<string, number> }> = [];
      for (let fi = 0; fi < withDates.length; fi++) {
        const f = withDates[fi];
        const label = f.meta.label || `fecha ${fi + 1}`;
        const txt = await f.file.text();
        const table = parseCsv(txt);
        if (table.length === 0) { perFechaPoints.push({ label, map: new Map() }); continue; }
        // Expect header: Ronda, Titulo, Modo, Mesa, Puesto, Participante, Puntos, Victorias, Fecha
        const header = table[0].map((h) => h.trim());
        const idxParticipante = header.indexOf('Participante');
        const idxPuntos = header.indexOf('Puntos');
        const idxModo = header.indexOf('Modo');
        const fechaMap = new Map<string, number>();
        for (let r = 1; r < table.length; r++) {
          const row = table[r];
          if (!row || row.length === 0 || row.every((c) => c === '')) break; // stop at blank line before summary
          const participante = row[idxParticipante] || '';
          const puntos = Number(row[idxPuntos] || '0') || 0;
          const modo = (row[idxModo] || '').trim();
          const names = modo === 'twoHeads' ? splitTwoHeads(participante) : [participante];
          names.forEach((nm) => {
            const key = nm.trim();
            if (!key) return;
            fechaMap.set(key, (fechaMap.get(key) || 0) + puntos);
          });
        }
        perFechaPoints.push({ label, map: fechaMap });
      }
      // Union of all player names
      const names = new Set<string>();
      perFechaPoints.forEach((entry) => entry.map.forEach((_, k) => names.add(k)));
      const rows: any[][] = [];
      const headers = ['Jugador'];
      for (let i = 0; i < perFechaPoints.length; i++) headers.push(`Puntos ${perFechaPoints[i].label}`);
      headers.push('Total de puntos');
      rows.push(headers);
      const all = Array.from(names.values()).map((nm) => {
        const pts: number[] = perFechaPoints.map((m) => m.map.get(nm) || 0);
        return { name: nm, pts, total: pts.reduce((a, b) => a + b, 0) };
      }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
      all.forEach((rec, idx) => {
        rows.push([rec.name, ...rec.pts, rec.total]);
      });
      const today = yyyymmdd(new Date());
      downloadCsv(`tabla_acumulada_${today}.csv`, rows);
    } finally {
      setAggregating(false);
    }
  };

  // Cargar imágenes (API + personalizadas) para el preview del panel
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch('/api/slider-images');
  const data = await r.json();
  const list: string[] = Array.isArray(data?.images) ? data.images : [];
  let custom = getCustomImages();
    // Backfill missing dataUrls from Cache Storage so preview works before SW controls
    try { custom = await ensureCustomImagesDataUrls(); } catch {}
    // Load modal image (if any)
    let m = await ensureModalImageDataUrl();
        if (!mounted) return;
  setCustomImages(custom);
  setImages([...list, ...custom.map((c) => c.dataUrl || c.cachePath!).filter(Boolean) as string[]]);
  setModalImageState(m);
      } catch {
  let custom = getCustomImages();
    try { custom = await ensureCustomImagesDataUrls(); } catch {}
    let m = await ensureModalImageDataUrl();
        if (!mounted) return;
  setCustomImages(custom);
  setImages([...custom.map((c) => c.dataUrl || c.cachePath!).filter(Boolean) as string[]]);
  setModalImageState(m);
      }
    };
    load();
    // Escuchar cambios en otras pestañas mediante el evento storage
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('customSliderImages')) {
        let custom = getCustomImages();
        // try to ensure dataUrls so preview never 404s before SW is active
        // don't await in storage event for responsiveness
        ensureCustomImagesDataUrls().then((updated) => setCustomImages(updated)).catch(() => {});
        setCustomImages(custom);
        setImages((prev) => {
          // Asumimos que las primeras posiciones son del API (paths http/https)
          const apiEnd = prev.findIndex((u) => u.startsWith('data:') || u.startsWith('/custom-slider/'));
          const api = apiEnd === -1 ? prev : prev.slice(0, apiEnd);
          return [...api, ...custom.map((c) => c.dataUrl || c.cachePath!).filter(Boolean) as string[]];
        });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { mounted = false; window.removeEventListener('storage', onStorage); };
  }, []);

  // Cargar imágenes para anuncios (solo personalizadas)
  useEffect(() => {
    let mounted = true;
    const loadAds = async () => {
      try {
        let custom = getCustomImagesAds();
        try { custom = await ensureCustomImagesAdsDataUrls(); } catch {}
        if (!mounted) return;
        setAdsCustomImages(custom);
      } catch {
        let custom = getCustomImagesAds();
        try { custom = await ensureCustomImagesAdsDataUrls(); } catch {}
        if (!mounted) return;
        setAdsCustomImages(custom);
      }
    };
    loadAds();
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('customSliderImagesAds')) {
        ensureCustomImagesAdsDataUrls().then((updated) => setAdsCustomImages(updated)).catch(() => {
          const next = getCustomImagesAds();
          setAdsCustomImages(next);
        });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { mounted = false; window.removeEventListener('storage', onStorage); };
  }, []);

  // Cargar conteo de pareos actuales y escuchar cambios
  useEffect(() => {
    const loadPairings = () => {
      const p = getCurrentPairings();
      setPairingsCount(p?.tables?.length || 0);
      setPairingsTitle(p?.title || '');
    };
    loadPairings();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'pairings.current.v1') loadPairings();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Cargar conteo de clasificación actual
  useEffect(() => {
    const loadStandings = () => {
      const s = getCurrentStandings();
      setStandingsCount(s?.rows?.length || 0);
      setStandingsTitle(s?.title || '');
    };
    loadStandings();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'standings.current.v1') loadStandings();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Sync modal open state across tabs via broadcast
  useEffect(() => {
    const unsub = subscribe(({ action, payload }) => {
      if (action === 'showModal') {
        if (payload?.type === 'pairings') setPairingsModalOpen(true);
        if (payload?.type === 'standings') setStandingsModalOpen(true);
      }
      if (action === 'hideModal') {
        setPairingsModalOpen(false);
        setStandingsModalOpen(false);
      }
    });
    return () => { if (unsub) unsub(); };
  }, []);

  // Sync local title input with store value (kept for internal status display; editing removed)
  useEffect(() => {
    setTitleInput(props.currentTitle || '');
  }, [props.currentTitle]);

  // Estado online/offline del navegador
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Capturar el evento beforeinstallprompt para mostrar botón de instalación
  useEffect(() => {
    const handler = (e: any) => {
      // Chrome fires this; prevent auto prompt and save it for our button
      e.preventDefault?.();
      setDeferredPrompt(e);
      setInstallAvailable(true);
    };
    const onInstalled = () => {
      setInstallAvailable(false);
      setDeferredPrompt(null);
      // Tras instalar desde el panel, abre una ventana del Timer (/) adicional
          try {
        const key = 'postInstallOpenedTimer';
        if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
          window.open('/timer', '_blank', 'noopener,noreferrer');
          localStorage.setItem(key, '1');
        }
      } catch {}
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    window.addEventListener('appinstalled', onInstalled as EventListener);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
      window.removeEventListener('appinstalled', onInstalled as EventListener);
    };
  }, []);

  // Atajo Alt + 5 para reproducir sonido de advertencia en el Panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.altKey && (e.key === '5' || e.code === 'Digit5')) {
        playWarning();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerStatus = () => {
    if (props.timerState.isFinished) return 'FINALIZADO';
    if (props.timerState.isFirstTimer) return 'TIEMPO PRINCIPAL';
    return 'TIEMPO EXTRA';
  };

  const getStatusColor = () => {
    if (props.timerState.isFinished) return 'text-gray-400';
    if (props.timerState.isFirstTimer) return 'text-blue-400';
    return 'text-orange-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center border-b border-gray-700 pb-4">
          <img
            src="/logoboards.png"
            alt="Logoboards"
            className="mx-auto h-28 md:h-36 lg:h-48 w-auto mb-2"
          />
          {/* Barra superior: estado online/offline + botón instalar app */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-gray-300">{isOnline ? 'Online' : 'Offline (cache habilitado)'}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  if (deferredPrompt) {
                    await deferredPrompt.prompt();
                    const choice = await deferredPrompt.userChoice;
                    // choice.outcome: 'accepted' | 'dismissed'
                    setDeferredPrompt(null);
                    setInstallAvailable(false);
                    if (choice?.outcome === 'accepted') {
                      // Si se aceptó la instalación desde el panel, abrir una ventana del Timer ahora
                      try { window.open('/timer', '_blank', 'noopener,noreferrer'); } catch {}
                    }
                  } else {
                    // Fallback: añadir como app puede no estar disponible (p.ej. iOS Safari)
                    alert('Instalación no disponible ahora. En móviles Android/Chrome se mostrará cuando el sistema lo permita.');
                  }
                } catch (e) {
                  console.warn('Install prompt error', e);
                }
              }}
              className={`px-3 py-1.5 rounded-md border text-xs transition-colors ${installAvailable ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500' : 'bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed'}`}
              disabled={!installAvailable}
              title={installAvailable ? 'Instalar como app' : 'Instalación no disponible'}
            >
              Añadir a inicio
            </button>
            <button
              onClick={() => {
                try { window.open('/timer', '_blank', 'noopener,noreferrer'); } catch {}
              }}
              className="px-3 py-1.5 rounded-md border text-xs transition-colors bg-green-700 hover:bg-green-800 border-green-600"
              title="Abrir pantalla del Timer y Slider"
            >
              Abrir pantalla
            </button>
            <button
              onClick={() => {
                try { window.open('/anuncios', '_blank', 'noopener,noreferrer'); } catch {}
              }}
              className="px-3 py-1.5 rounded-md border text-xs transition-colors bg-pink-700 hover:bg-pink-800 border-pink-600"
              title="Abrir pantalla de anuncios (slider independiente)"
            >
              Abrir anuncios
            </button>
          </div>
        </div>

        {/* Timer Status */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Estado del Timer</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-3xl font-mono font-bold text-white mb-2">
                {formatTime(props.timerState.minutes, props.timerState.seconds)}
              </div>
              <div className={`text-sm font-medium ${getStatusColor()}`}>
                {getTimerStatus()}
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-lg font-semibold text-white mb-2">
                {props.timerState.isRunning ? 'CORRIENDO' : 'PAUSADO'}
              </div>
              <div className={`w-3 h-3 rounded-full mx-auto ${
                props.timerState.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-lg font-semibold text-white mb-2">Slide Actual</div>
              <div className="text-2xl font-bold text-blue-400">
                {props.currentSlide} / {props.totalSlides}
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400">Controles del Timer</h3>
            
            <div className="flex flex-wrap gap-3">
              {!props.timerState.isFinished && (
                <>
                  {!props.timerState.isRunning ? (
                    <button
                      onClick={props.onStartTimer}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      ▶️ Iniciar
                    </button>
                  ) : (
                    <button
                      onClick={props.onPauseTimer}
                      className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      ⏸️ Pausar
                    </button>
                  )}
                </>
              )}
              
              <button
                onClick={props.onResetTimer}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🔄 Resetear
              </button>
            </div>

            {/* Time Adjustment */}
            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-md font-medium text-gray-300 mb-3">Ajustar Tiempo</h4>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <label className="text-gray-300 text-sm">Minutos:</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={timeToAdd}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setTimeToAdd(Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
                  }}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2  ml-3.5 text-white w-24"
                />
                
                <button
                  onClick={() => props.onAddTime(timeToAdd)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all duration-200"
                >
                  ➕ Agregar
                </button>
                
                <button
                  onClick={() => props.onSubtractTime(timeToAdd)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all duration-200"
                >
                  ➖ Quitar
                </button>
              </div>

              {/* Seconds adjustment */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <label className="text-gray-300 text-sm">Segundos:</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={secondsToAdjust}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSecondsToAdjust(Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
                  }}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-24"
                />

                <button
                  onClick={() => props.onAddSeconds(secondsToAdjust)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-all duration-200"
                >
                  ➕ Agregar
                </button>

                <button
                  onClick={() => props.onSubtractSeconds(secondsToAdjust)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-all duration-200"
                >
                  ➖ Quitar
                </button>
              </div>

         
            </div>
          </div>

          {/* Timer Title editing removed as requested */}
        </div>

        {/* Slider Controls */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Control del Slider</h2>
          
          <div className="space-y-4">
            {/* Preview del slide actual */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-300 min-w-24">Preview actual</div>
              <div className="flex-1">
                <div className="w-full max-w-sm aspect-video bg-gray-700/60 border border-gray-600 rounded-md overflow-hidden">
                  {images[props.currentSlide - 1] ? (
                    <img
                      src={images[props.currentSlide - 1]}
                      alt={`Slide ${props.currentSlide}`}
                      className="w-full h-full object-contain"
                    />)
                  : (
                    <div className="w-full h-full grid place-items-center text-gray-400 text-sm">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Mostrando {props.currentSlide} / {props.totalSlides}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={props.onPrevSlide}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                ⬅️ Anterior
              </button>
              
              <button
                onClick={props.onNextSlide}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                ➡️ Siguiente
              </button>

              <button
                onClick={props.onToggleAutoSlide}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg ${props.autoSlidePaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
              >
                {props.autoSlidePaused ? '▶️ Reanudar auto' : '⏸️ Pausar auto'}
              </button>
            </div>

            {/* Direct Slide Selection */}
            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-md font-medium text-gray-300 mb-3">Ir a Slide Específico</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: props.totalSlides }, (_, i) => i + 1).map((slideNum) => (
                  <button
                    key={slideNum}
                    onClick={() => props.onGoToSlide(slideNum)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      slideNum === props.currentSlide
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {slideNum}
                  </button>
                ))}
              </div>
              {/* Blur always on - toggle removed as requested */}
            </div>

            {/* Pareos actuales (modal de pareos) */}
            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-md font-medium text-gray-300 mb-3">Pareos</h4>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    if (pairingsModalOpen) {
                      setPairingsModalOpen(false);
                      props.onHideSliderModal();
                    } else {
                      if (pairingsCount === 0) return;
                      setPairingsModalOpen(true); // optimistic
                      props.onShowSliderModalPairings();
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${pairingsModalOpen ? 'bg-gray-600 hover:bg-gray-700' : (pairingsCount > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 cursor-not-allowed')}`}
                  disabled={!pairingsModalOpen && pairingsCount === 0}
                  title={pairingsModalOpen ? 'Ocultar pareos en la pantalla' : 'Mostrar pareos en la pantalla'}
                >
                  {pairingsModalOpen ? '❌ Dejar de mostrar' : '📋 Mostrar pareos actuales'}
                </button>
                <div className="text-xs text-gray-400 ml-2">
                  {pairingsCount > 0 ? (
                    <span>{pairingsCount} mesa{pairingsCount === 1 ? '' : 's'}{pairingsTitle ? ` • ${pairingsTitle}` : ''}</span>
                  ) : (
                    <span>No hay pareos guardados</span>
                  )}
                </div>
              </div>
            </div>

            {/* Clasificación (modal de standings) */}
            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-md font-medium text-gray-300 mb-3">Clasificación</h4>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    if (standingsModalOpen) {
                      setStandingsModalOpen(false);
                      props.onHideSliderModal();
                    } else {
                      if (standingsCount === 0) return;
                      setStandingsModalOpen(true); // optimistic
                      props.onShowSliderModalStandings();
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${standingsModalOpen ? 'bg-gray-600 hover:bg-gray-700' : (standingsCount > 0 ? 'bg-green-700 hover:bg-green-800' : 'bg-gray-600 cursor-not-allowed')}`}
                  disabled={!standingsModalOpen && standingsCount === 0}
                  title={standingsModalOpen ? 'Ocultar clasificación en la pantalla' : 'Mostrar clasificación en la pantalla'}
                >
                  {standingsModalOpen ? '❌ Dejar de mostrar' : '🏆 Mostrar clasificación'}
                </button>
                <div className="text-xs text-gray-400 ml-2">
                  {standingsCount > 0 ? (
                    <span>{standingsCount} jugador{standingsCount === 1 ? '' : 'es'}{standingsTitle ? ` • ${standingsTitle}` : ''}</span>
                  ) : (
                    <span>Sin clasificación cargada</span>
                  )}
                </div>
              </div>
            </div>

            {/* Gestión de imágenes personalizadas */}
            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-md font-medium text-gray-300 mb-3">Imágenes Personalizadas</h4>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    // Procesar y redimensionar, guardar en Cache Storage
                    const added: CustomImage[] = [];
                    for (const f of files) {
                      try {
                        const id = makeId();
                        const blob = await fileToResizedBlob(f, { maxW: 1600, maxH: 1600, quality: 0.85 });
                        const cachePath = await cacheCustomImage(id, blob, blob.type || 'image/jpeg');
                        // data URL fallback for preview and when SW not yet controlling
                        let dataUrl: string | undefined;
                        try { dataUrl = await blobToDataUrl(blob); } catch {}
                        added.push({ id, name: f.name, cachePath, dataUrl, addedAt: Date.now() });
                      } catch {}
                    }
                    if (added.length) {
                      addCustomImages(added);
                      const next = getCustomImages();
                      setCustomImages(next);
                      // Volver a cargar imágenes combinadas para preview
                      try {
                        const r = await fetch('/api/slider-images');
                        const data = await r.json();
                        const list: string[] = Array.isArray(data?.images) ? data.images : [];
                        setImages([...list, ...next.map((c) => c.cachePath || c.dataUrl!).filter(Boolean) as string[]]);
                      } catch {
                        setImages([...next.map((c) => c.cachePath || c.dataUrl!).filter(Boolean) as string[]]);
                      }
                      // limpiar input
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all duration-200"
                >
                  📁 Selecciona imagen
                </button>
                {/* Modal image picker (single) */}
                <input
                  type="file"
                  accept="image/*"
                  ref={modalFileRef}
                  className="hidden"
                  onChange={async (e) => {
                    const file = (e.target.files && e.target.files[0]) || null;
                    if (!file) return;
                    try {
                      const blob = await fileToResizedBlob(file, { maxW: 1920, maxH: 1080, quality: 0.9 });
                      const cachePath = await cacheModalImage(blob, blob.type || 'image/jpeg');
                      let dataUrl: string | undefined;
                      try { dataUrl = await blobToDataUrl(blob); } catch {}
                      const mi: ModalImage = { name: file.name, cachePath, dataUrl, addedAt: Date.now() };
                      setModalImage(mi);
                      setModalImageState(mi);
                      if (modalFileRef.current) modalFileRef.current.value = '';
                    } catch {}
                  }}
                />
                <button
                  onClick={() => modalFileRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-all duration-200"
                  title="Seleccionar la imagen para el modal del slider"
                >
                  🖼 Seleccionar imagen de los pareos
                </button>
                <span className="text-xs text-gray-400">Se guardan localmente en este navegador/dispositivo y se suman al slider.</span>
              </div>
              {modalImage ? (
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-40 aspect-video bg-gray-800 rounded border border-gray-700 overflow-hidden">
                    <img src={modalImage.dataUrl || modalImage.cachePath} alt={modalImage.name || 'Modal'} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-gray-300 truncate" title={modalImage.name || ''}>{modalImage.name || 'Imagen del modal'}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => props.onShowSliderModal(modalImage.dataUrl || modalImage.cachePath)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
                      >
                        Mostrar pareos
                      </button>
                      <button
                        onClick={props.onHideSliderModal}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg  transition-all duration-200 transform hover:scale-105 shadow-lg"
                        title="Cerrar modal del slider"
                      >
                        ❌ Cerrar pareos
                      </button>
                      <button
                        onClick={async () => {
                          // Cerrar el modal si estuviera abierto
                          try { props.onHideSliderModal(); } catch {}
                          try {
                            if (modalImage.cachePath) await deleteCachedCustomImage(modalImage.cachePath);
                          } catch {}
                          setModalImage(null);
                          setModalImageState(null);
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm"
                      >
                        Quitar imagen
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              {customImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {customImages.map((img) => (
                    <div key={img.id} className="bg-gray-700 rounded-md border border-gray-600 overflow-hidden">
                      <div className="aspect-video w-full bg-gray-800">
                        <img src={img.dataUrl} alt={img.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="p-2 flex items-center justify-between gap-2">
                        <div className="truncate text-xs text-gray-300" title={img.name}>{img.name}</div>
                        <button
                          onClick={async () => {
                            removeCustomImage(img.id);
                            if (img.cachePath) { try { await deleteCachedCustomImage(img.cachePath); } catch {} }
                            const next = getCustomImages();
                            setCustomImages(next);
                            setImages((prev) => prev.filter((u) => u !== (img.cachePath || img.dataUrl)));
                          }}
                          className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">No hay imágenes personalizadas.</div>
              )}
            </div>
          </div>
        </div>

        {/* Pantalla de anuncios */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-fuchsia-400">Pantalla de anuncios</h2>

          <div className="space-y-4">
            {/* Preview del slide actual de anuncios */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-300 min-w-24">Preview actual</div>
              <div className="flex-1">
                <div className="w-full max-w-sm aspect-video bg-gray-700/60 border border-gray-600 rounded-md overflow-hidden">
                  {adsCustomImages[props.adsCurrentSlide - 1] ? (
                    <img
                      src={adsCustomImages[props.adsCurrentSlide - 1].dataUrl || adsCustomImages[props.adsCurrentSlide - 1].cachePath}
                      alt={`Anuncio ${props.adsCurrentSlide}`}
                      className="w-full h-full object-contain"
                    />)
                  : (
                    <div className="w-full h-full grid place-items-center text-gray-400 text-sm">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Mostrando {props.adsCurrentSlide} / {props.adsTotalSlides}
                </div>
                {/* Gestión de imágenes de anuncios */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-md font-medium text-gray-300 mb-3">Imágenes de anuncios</h4>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={adsFileInputRef}
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        const added: CustomImage[] = [];
                        for (const f of files) {
                          try {
                            const id = makeId();
                            const blob = await fileToResizedBlob(f, { maxW: 1600, maxH: 1600, quality: 0.85 });
                            const cachePath = await cacheCustomAdsImage(id, blob, blob.type || 'image/jpeg');
                            let dataUrl: string | undefined;
                            try { dataUrl = await blobToDataUrl(blob); } catch {}
                            added.push({ id, name: f.name, cachePath, dataUrl, addedAt: Date.now() });
                          } catch {}
                        }
                        if (added.length) {
                          addCustomImagesAds(added);
                          const next = getCustomImagesAds();
                          setAdsCustomImages(next);
                          // Touch storage key so other tabs update quickly
                          try { localStorage.setItem('customSliderImagesAds.touch', String(Date.now())); } catch {}
                          if (adsFileInputRef.current) adsFileInputRef.current.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => adsFileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all duration-200"
                    >
                      📁 Selecciona imagen
                    </button>
                    <span className="text-xs text-gray-400">Estas imágenes solo se usan en la pantalla de anuncios.</span>
                  </div>
                  {adsCustomImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {adsCustomImages.map((img) => (
                        <div key={img.id} className="bg-gray-700 rounded-md border border-gray-600 overflow-hidden">
                          <div className="aspect-video w-full bg-gray-800">
                            <img src={img.dataUrl || img.cachePath} alt={img.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="p-2 flex items-center justify-between gap-2">
                            <div className="truncate text-xs text-gray-300" title={img.name}>{img.name}</div>
                            <button
                              onClick={async () => {
                                removeCustomImageAds(img.id);
                                if (img.cachePath) { try { await deleteCachedCustomAdsImage(img.cachePath); } catch {} }
                                const next = getCustomImagesAds();
                                setAdsCustomImages(next);
                              }}
                              className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No hay imágenes de anuncios.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={props.onAdsPrevSlide}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                ⬅️ Anterior
              </button>
              
              <button
                onClick={props.onAdsNextSlide}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                ➡️ Siguiente
              </button>

              <button
                onClick={props.onAdsToggleAutoSlide}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg ${props.adsAutoSlidePaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
              >
                {props.adsAutoSlidePaused ? '▶️ Reanudar auto' : '⏸️ Pausar auto'}
              </button>
            </div>

            {/* Selección directa de anuncio */}
            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-md font-medium text-gray-300 mb-3">Ir a Anuncio</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: props.adsTotalSlides }, (_, i) => i + 1).map((slideNum) => (
                  <button
                    key={`ads-${slideNum}`}
                    onClick={() => props.onAdsGoToSlide(slideNum)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      slideNum === props.adsCurrentSlide
                        ? 'bg-fuchsia-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {slideNum}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Acciones Rápidas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                props.onResetTimer();
                props.onGoToSlide(1);
              }}
              className="px-6 py-4 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🔄 Reset Todo
            </button>
            
            <button
              onClick={() => {
                props.onStartTimer();
                props.onGoToSlide(1);
              }}
              className="px-6 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🚀 Comenzar Partida
            </button>
          </div>
        </div>

        {/* Torneos */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Torneos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setTournamentTarget('/torneos/multi');
                setTournamentTitle('Boards and Hobbies');
                setTournamentModalOpen(true);
              }}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Multi
            </button>
            <button
              onClick={() => {
                setTournamentTarget('/torneos/2cabezas');
                setTournamentTitle('Boards and Hobbies');
                setTournamentModalOpen(true);
              }}
              className="px-6 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              2 cabezas
            </button>
            <button
              onClick={() => {
                setTournamentTarget('/torneos/1vs1');
                setTournamentTitle('Boards and Hobbies');
                setTournamentModalOpen(true);
              }}
              className="px-6 py-4 bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              1 vs 1
            </button>
          </div>
          {/* Tournament title modal */}
          {tournamentModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setTournamentModalOpen(false)}></div>
              <div className="relative z-10 w-[90vw] max-w-md bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-3">Nombre del torneo</h3>
                <input
                  type="text"
                  value={tournamentTitle}
                  onChange={(e) => setTournamentTitle(e.target.value.slice(0, 60))}
                  placeholder="Boards and Hobbies"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
                <div className="text-xs text-gray-400 mt-2">Este nombre se usará como título del timer.</div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setTournamentModalOpen(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      // Guardar título en el store y abrir el torneo seleccionado
                      props.onSetTitle(tournamentTitle || 'Boards and Hobbies');
                      // Set one-time skip flag to avoid navigation guard prompt
                      try { localStorage.setItem('skipNavigationGuardOnce', '1'); } catch {}
                      setTournamentModalOpen(false);
                      try { window.open(tournamentTarget || '/torneos/multi', '_blank', 'noopener,noreferrer'); } catch {}
                    }}
                    className="px-4 py-2 bg-green-700 hover:bg-green-800 rounded"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Generar tabla acumulada de fechas */}
          <div className="mt-4 border-t border-gray-700 pt-4">
            <input
              ref={aggregateFilesRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                await aggregateCsvFiles(files);
                if (aggregateFilesRef.current) aggregateFilesRef.current.value = '';
              }}
            />
            <button
              onClick={() => aggregateFilesRef.current?.click()}
              disabled={aggregating}
              className={`px-6 py-4 ${aggregating ? 'bg-gray-600 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'} rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg`}
              title="Leer CSVs exportados y generar tabla consolidada por fecha"
            >
              {aggregating ? 'Procesando…' : 'Generar tabla'}
            </button>
            <div className="text-xs text-gray-400 mt-2">
              Sube 2 o más CSV exportados (cada archivo = una fecha). Etiquetamos cada columna con la fecha YYYY-MM-DD detectada en el nombre del archivo; si no la tiene, usamos orden de carga.
            </div>
            <div className="text-xs text-gray-500 mt-1">
              El archivo generado se descargará como tabla_acumulada_YYYY-MM-DD.csv con la fecha de creación.
            </div>
          </div>
        </div>

        {/* Prueba de sonidos */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Prueba de Sonidos</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => playWarning()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              ▶️ Reproducir Warning
            </button>
            <button
              onClick={() => playOver()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              ▶️ Reproducir Over
            </button>
          </div>
        </div>

        {/* Lista: sumar cartas desde Moxfield */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Lista</h2>
          <div className="space-y-3">
            <p className="text-sm text-gray-300">Pega una o varias URLs de Moxfield (una por línea). Ejemplo: https://moxfield.com/decks/TqIGnMi30EKaZE1OrBPd2g</p>
            <MoxfieldAggregator downloadCsv={downloadCsv} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm border-t border-gray-700 pt-4">
          Panel de Control - Magic: The Gathering Timer & Slider
        </div>
      </div>
    </div>
  );
}

// --- Subcomponente: Moxfield Aggregator ---
function MoxfieldAggregator({ downloadCsv }: { downloadCsv: (filename: string, aoa: any[][]) => void }) {
  const [urlsText, setUrlsText] = useState<string>("");
  const [includeSide, setIncludeSide] = useState<boolean>(true);
  const [onlyRepeated, setOnlyRepeated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [results, setResults] = useState<Array<{ name: string; qty: number }>>([]);
  const [details, setDetails] = useState<Array<{ name: string; qty: number; setName?: string; setCode?: string; rarity?: string; colors?: string[] }>>([]);
  const [rarityFilter, setRarityFilter] = useState<string>('');
  const [setCodeFilter, setSetCodeFilter] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<Record<string, boolean>>({ W: false, U: false, B: false, R: false, G: false, C: false });
  const [sortBy, setSortBy] = useState<'qty' | 'name' | 'setName' | 'setCode' | 'rarity' | 'colors'>('qty');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [diag, setDiag] = useState<{ processed: string[]; failures: Array<{ url: string; reason: string }> } | null>(null);

  const handleAnalyze = async () => {
    const lines = urlsText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setError('Ingresa al menos 1 URL de Moxfield.');
      try { alert('Ingresa al menos 1 URL de Moxfield.'); } catch {}
      return;
    }
    setLoading(true); setError(""); setResults([]);
    try {
      const r = await fetch('/api/moxfield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: lines, includeSideboard: includeSide, enrichScryfall: true })
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || `Error ${r.status}`);
      }
  const data = await r.json();
  const list: Array<{ name: string; qty: number }> = Array.isArray(data?.aggregated) ? data.aggregated : [];
  const det: Array<{ name: string; qty: number; setName?: string; setCode?: string; rarity?: string; colors?: string[] }> = Array.isArray(data?.aggregatedDetails) ? data.aggregatedDetails : [];
  setResults(list);
  setDetails(det);
  setDiag({ processed: Array.isArray(data?.processed) ? data.processed : [], failures: Array.isArray(data?.failures) ? data.failures : [] });
    } catch (e: any) {
      setError(e?.message || 'Error al procesar las listas.');
    } finally {
      setLoading(false);
    }
  };

  const listMerged = (() => {
    if (!results.length) return [] as Array<{ name: string; qty: number; setName?: string; setCode?: string; rarity?: string; colors?: string[] }>;
    const mapDet = new Map(details.map((d) => [d.name, d] as const));
    return results.map((r) => {
      const d = mapDet.get(r.name);
      return { name: r.name, qty: r.qty, setName: d?.setName, setCode: d?.setCode, rarity: d?.rarity, colors: d?.colors };
    });
  })();

  const filtered = listMerged
    .filter((rec) => (onlyRepeated ? (rec.qty || 0) >= 2 : true))
    .filter((rec) => (rarityFilter ? (rec.rarity || '') === rarityFilter : true))
    .filter((rec) => (setCodeFilter ? (rec.setCode || '') === setCodeFilter : true))
    .filter((rec) => {
      const selectedColors = Object.entries(colorFilter).filter(([k, v]) => v).map(([k]) => k);
      if (selectedColors.length === 0) return true;
      const rc = rec.colors && rec.colors.length ? rec.colors : ['C'];
      // Require All selected colors to be included in record colors
      return selectedColors.every((c) => rc.includes(c));
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const rarityRank = (r?: string) => {
        const x = (r || '').toLowerCase();
        const map: Record<string, number> = { mythic: 1, rare: 2, uncommon: 3, common: 4, special: 5, bonus: 6 };
        return map[x] || 99;
      };
      const colorKey = (c?: string[]) => (c && c.length ? c.join('') : '');
      let va: any; let vb: any;
      switch (sortBy) {
        case 'name': va = a.name; vb = b.name; break;
        case 'setName': va = a.setName || ''; vb = b.setName || ''; break;
        case 'setCode': va = a.setCode || ''; vb = b.setCode || ''; break;
        case 'rarity': va = rarityRank(a.rarity); vb = rarityRank(b.rarity); break;
        case 'colors': va = colorKey(a.colors); vb = colorKey(b.colors); break;
        case 'qty': default: va = a.qty; vb = b.qty; break;
      }
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      const sa = String(va); const sb = String(vb);
      return sa.localeCompare(sb) * dir;
    });

  const onSort = (key: 'qty' | 'name' | 'setName' | 'setCode' | 'rarity' | 'colors') => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'qty' ? 'desc' : 'asc');
    }
  };

  const download = () => {
    const rows: any[][] = [["Carta", "Cantidad"]];
    filtered.forEach((r) => rows.push([r.name, r.qty]));
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    downloadCsv(`lista_aggregada_${dateStr}.csv`, rows);
  };

  const downloadExcelLike = () => {
    // Build rows with columns: Código, Expansión, Rareza, Color, Carta, Cantidad
    const rows: any[][] = [["Código", "Expansión", "Rareza", "Color", "Carta", "Cantidad"]];
    filtered.forEach((r) => rows.push([
      r.setCode || '',
      r.setName || '',
      r.rarity || '',
      (r.colors && r.colors.length ? r.colors.join('') : ''),
      r.name,
      r.qty,
    ]));
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    downloadCsv(`lista_excel_${dateStr}.csv`, rows);
  };

  return (
    <div className="space-y-3">
      <textarea
        className="w-full min-h-28 bg-gray-700 border border-gray-600 rounded p-3 text-sm text-white"
        placeholder="Pega aquí las URLs de Moxfield, una por línea"
        value={urlsText}
        onChange={(e) => setUrlsText(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={includeSide} onChange={(e) => setIncludeSide(e.target.checked)} />
          Incluir sideboard
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={onlyRepeated} onChange={(e) => setOnlyRepeated(e.target.checked)} />
          Solo repetidas (≥ 2)
        </label>
      </div>
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-400">Rareza</label>
          <select
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
          >
            <option value="">Todas</option>
            {Array.from(new Set(details.map((d) => (d.rarity || '').trim()).filter(Boolean))).sort().map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400">Código expansión</label>
          <select
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
            value={setCodeFilter}
            onChange={(e) => setSetCodeFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {Array.from(new Set(details.map((d) => (d.setCode || '').trim()).filter(Boolean))).sort().map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="block text-xs text-gray-400">Color</label>
          <div className="flex flex-wrap gap-2 text-sm text-gray-300">
            {(['W','U','B','R','G','C'] as const).map((c) => (
              <label key={c} className="inline-flex items-center gap-1">
                <input type="checkbox" checked={!!colorFilter[c]} onChange={(e) => setColorFilter((prev) => ({ ...prev, [c]: e.target.checked }))} />
                {c}
              </label>
            ))}
          </div>
        </div>
        {(rarityFilter || setCodeFilter || Object.values(colorFilter).some(Boolean)) && (
          <button
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
            onClick={() => { setRarityFilter(''); setSetCodeFilter(''); setColorFilter({ W:false, U:false, B:false, R:false, G:false, C:false }); }}
          >
            Limpiar filtros
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`px-5 py-2 rounded ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'} font-semibold`}
        >
          {loading ? 'Procesando…' : 'Analizar listas'}
        </button>
        {filtered.length > 0 && (
          <button
            onClick={download}
            className="px-5 py-2 rounded bg-indigo-600 hover:bg-indigo-700 font-semibold"
          >
            Descargar CSV
          </button>
        )}
        {filtered.length > 0 && (
          <button
            onClick={downloadExcelLike}
            className="px-5 py-2 rounded bg-green-700 hover:bg-green-800 font-semibold"
            title="Exporta columnas: Expansión, Rareza, Carta, Cantidad (CSV compatible con Excel)"
          >
            Descargar Excel (Exp/Rareza/Carta)
          </button>
        )}
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {diag && (
        <div className="text-xs text-gray-400">
          {diag.processed?.length ? <div>Procesados: {diag.processed.join(', ')}</div> : null}
          {diag.failures?.length ? (
            <div className="text-red-300 mt-1">
              Fallidos: {diag.failures.map((f) => `${f.url} (${f.reason})`).join('; ')}
            </div>
          ) : null}
          {(!error && filtered.length === 0) ? (
            <div className="mt-1">No se encontraron cartas. Verifica que las listas sean públicas.</div>
          ) : null}
        </div>
      )}
      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-300">
                <th className="px-2 py-1 border-b border-gray-700 cursor-pointer" onClick={() => onSort('setName')}>Expansión {sortBy==='setName' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                <th className="px-2 py-1 border-b border-gray-700 cursor-pointer" onClick={() => onSort('setCode')}>Código {sortBy==='setCode' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                <th className="px-2 py-1 border-b border-gray-700 cursor-pointer" onClick={() => onSort('rarity')}>Rareza {sortBy==='rarity' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                <th className="px-2 py-1 border-b border-gray-700 cursor-pointer" onClick={() => onSort('colors')}>Color {sortBy==='colors' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                <th className="px-2 py-1 border-b border-gray-700 cursor-pointer" onClick={() => onSort('name')}>Carta {sortBy==='name' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
                <th className="px-2 py-1 border-b border-gray-700 cursor-pointer" onClick={() => onSort('qty')}>Cantidad {sortBy==='qty' ? (sortDir==='asc'?'▲':'▼') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.name} className="hover:bg-gray-700/40">
                  <td className="px-2 py-1 border-b border-gray-800">{r.setName || ''}</td>
                  <td className="px-2 py-1 border-b border-gray-800">{r.setCode || ''}</td>
                  <td className="px-2 py-1 border-b border-gray-800">{r.rarity || ''}</td>
                  <td className="px-2 py-1 border-b border-gray-800">{(r.colors && r.colors.length) ? r.colors.join('') : ''}</td>
                  <td className="px-2 py-1 border-b border-gray-800">{r.name}</td>
                  <td className="px-2 py-1 border-b border-gray-800">{r.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-gray-400 mt-2">{filtered.length} cartas</div>
        </div>
      )}
    </div>
  );
}