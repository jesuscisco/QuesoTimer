'use client';

import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStoreSimple';
import { useSimpleTimer } from '../hooks/useSimpleTimer';
import { broadcast, subscribe } from '../utils/broadcast';
import { getCustomImages } from '../utils/customImages';
import { unlockAudioContext } from '../utils/sound';

// Variable global para el slider interval (fuera del componente)
let sliderInterval: NodeJS.Timeout | null = null;

export default function GlobalEffects() {
  // Activar el hook del timer
  useSimpleTimer();
  
  useEffect(() => {
    // Sincronizar cantidad de imágenes del slider: API + personalizadas (localStorage)
    const recompute = async () => {
      try {
        const r = await fetch('/api/slider-images');
        const data = await r.json();
        const list: string[] = Array.isArray(data?.images) ? data.images : [];
        const custom = getCustomImages().map((c) => c.cachePath || c.dataUrl!).filter(Boolean) as string[];
        useAppStore.getState().setTotalSlides(list.length + custom.length);
      } catch {
        const custom = getCustomImages();
        useAppStore.getState().setTotalSlides(custom.length);
      }
    };
    recompute();
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('customSliderImages')) {
        recompute();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    // Suscribirse a mensajes de otras pestañas para replicar acciones
    const unsub = subscribe(({ action, payload }) => {
      switch (action) {
        case 'start':
          useAppStore.getState().startTimer();
          break;
        case 'pause':
          useAppStore.getState().pauseTimer();
          break;
        case 'reset':
          useAppStore.getState().resetTimer();
          break;
        case 'add':
          useAppStore.getState().addTime(payload?.minutes ?? 0);
          break;
        case 'sub':
          useAppStore.getState().subtractTime(payload?.minutes ?? 0);
          break;
        case 'addSec':
          useAppStore.getState().addSeconds(payload?.seconds ?? 0);
          break;
        case 'subSec':
          useAppStore.getState().subtractSeconds(payload?.seconds ?? 0);
          break;
        case 'nextSlide':
          useAppStore.getState().nextSlide();
          break;
        case 'prevSlide':
          useAppStore.getState().prevSlide();
          break;
        case 'goToSlide':
          if (typeof payload?.index === 'number') useAppStore.getState().goToSlide(payload.index);
          break;
        case 'toggleAuto':
          useAppStore.getState().toggleAutoSlide();
          break;
        case 'setCustomAlert':
          if (typeof payload?.minutes === 'number' && typeof payload?.seconds === 'number') {
            useAppStore.getState().setCustomAlert(payload.minutes, payload.seconds);
          }
          break;
        case 'clearCustomAlert':
          useAppStore.getState().clearCustomAlert();
          break;
        case 'unlockAudio':
          // Note: Real audio unlock needs a user gesture per tab, this flag only gates play() attempts
          useAppStore.getState().markAudioUnlocked();
          break;
        case 'setTitle':
          if (typeof payload?.title === 'string') useAppStore.getState().setTimerTitle(payload.title);
          break;
        case 'showModal':
          {
            const state = useAppStore.getState();
            if (payload?.type === 'pairings') {
              const fn = (state as any).showPairingsModal as undefined | (() => void);
              if (typeof fn === 'function') fn();
            } else if (payload?.type === 'standings') {
              const fn = (state as any).showStandingsModal as undefined | (() => void);
              if (typeof fn === 'function') fn();
            } else {
              const fn = state.showSliderModal as unknown;
              if (typeof fn === 'function') (fn as (img?: string) => void)(typeof payload?.image === 'string' ? payload.image : undefined);
            }
          }
          break;
        case 'hideModal':
          {
            const fn = useAppStore.getState().hideSliderModal as unknown;
            if (typeof fn === 'function') (fn as () => void)();
          }
          break;
      }
    });

    // Inicializar slider auto-advance solo en el cliente
    if (typeof window !== 'undefined' && !sliderInterval) {
      sliderInterval = setInterval(() => {
        const state = useAppStore.getState();
        if (!state.isSliderTransitioning && !state.autoSlidePaused && state.totalSlides > 1) {
          console.log('🎠 AUTO: Next slide');
          state.nextSlide();
        }
      }, 10000);
      
      console.log('🎠 GlobalEffects: Slider auto-advance started');
    }
    
    // Cleanup cuando se desmonta
    return () => {
      if (unsub) unsub();
      if (sliderInterval) {
        clearInterval(sliderInterval);
        sliderInterval = null;
        console.log('🎠 GlobalEffects: Slider auto-advance stopped');
      }
    };
  }, []); // Solo se ejecuta una vez al montar
  
  // Marcar audio como desbloqueado al primer gesto del usuario en esta pestaña
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      const { audioUnlocked } = useAppStore.getState();
      if (!audioUnlocked) {
        // Try to unlock Web Audio on gesture
        unlockAudioContext().finally(() => {
          useAppStore.getState().markAudioUnlocked();
        });
        // Informativo para otras pestañas (no desbloquea realmente el audio allí)
        broadcast('unlockAudio');
      }
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, []);
  
  // Atajo de teclado: Alt + 1 abre el panel de control en una nueva pestaña (solo fuera de /control)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      // Evitar repetidos cuando la tecla se mantiene presionada
      if (e.repeat) return;
      // Alt + 1 o Alt + Digit1 según el teclado
      if (e.altKey && (e.key === '1' || e.code === 'Digit1')) {
        if (window.location.pathname !== '/control') {
          window.open('/control', '_blank', 'noopener,noreferrer');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  
  // Registrar Service Worker para PWA offline
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        // Optionally: refresh on new sw installed, etc.
      } catch (e) {
        console.warn('SW registration failed', e);
      }
    };
    register();
  }, []);
  
  return null; // Este componente no renderiza nada, solo maneja efectos
}