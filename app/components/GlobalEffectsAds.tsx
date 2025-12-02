'use client';

import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStoreSimple';
import { broadcast, subscribe } from '../utils/broadcast';
import { getCustomImagesAds } from '../utils/customImages';

let adsInterval: NodeJS.Timeout | null = null;

export default function GlobalEffectsAds() {
  // Sync images count for ads slider
  useEffect(() => {
    const recompute = async () => {
      try {
        const r = await fetch('/api/slider-images');
        const data = await r.json();
        const list: string[] = Array.isArray(data?.images) ? data.images : [];
  const custom = getCustomImagesAds().map((c) => c.dataUrl!).filter(Boolean) as string[];
        useAppStore.getState().setAdsTotalSlides(list.length + custom.length);
      } catch {
  const custom = getCustomImagesAds();
        useAppStore.getState().setAdsTotalSlides(custom.length as unknown as number);
      }
    };
    recompute();
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('customSliderImagesAds')) {
        recompute();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const unsub = subscribe(({ action, payload }) => {
      switch (action) {
        case 'ads_nextSlide':
          useAppStore.getState().adsNextSlide();
          break;
        case 'ads_prevSlide':
          useAppStore.getState().adsPrevSlide();
          break;
        case 'ads_goToSlide':
          if (typeof payload?.index === 'number') useAppStore.getState().adsGoToSlide(payload.index);
          break;
        case 'ads_toggleAuto':
          useAppStore.getState().adsToggleAutoSlide();
          break;
      }
    });

    if (typeof window !== 'undefined' && !adsInterval) {
      adsInterval = setInterval(() => {
        const s = useAppStore.getState();
        if (!s.adsIsSliderTransitioning && !s.adsAutoSlidePaused && s.adsTotalSlides > 1) {
          s.adsNextSlide();
        }
      }, 10000);
    }

    return () => {
      if (unsub) unsub();
      if (adsInterval) { clearInterval(adsInterval); adsInterval = null; }
    };
  }, []);

  return null;
}
