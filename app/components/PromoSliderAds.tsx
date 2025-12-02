"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStoreSimple';
import './slider.css';
import { getCustomImagesAds, ensureCustomImagesAdsDataUrls } from '../utils/customImages';

type AnimationType = 'anim-4parts' | 'anim-9parts' | 'anim-5parts' | 'anim-3parts';

interface SlideData {
  id: number;
  backgroundImage: string;
  animationType: AnimationType;
}

export default function PromoSliderAds() {
  const { adsCurrentSlide, setAdsTotalSlides, adsGoToSlide } = useAppStore();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]);
  // Ads slider uses only its own custom images, separate from main

  // Load images from local custom (ads-only)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        let customList = getCustomImagesAds();
        try { customList = await ensureCustomImagesAdsDataUrls(); } catch {}
        const custom = customList.map((c) => c.dataUrl!).filter(Boolean) as string[];
        if (!mounted) return;
        setImages(custom);
        setAdsTotalSlides(custom.length);
        if (custom.length > 0 && (adsCurrentSlide < 1 || adsCurrentSlide > custom.length)) {
          adsGoToSlide(1);
        }
      } catch (e) {
        let customList = getCustomImagesAds();
        try { customList = await ensureCustomImagesAdsDataUrls(); } catch {}
        const custom = customList.map((c) => c.dataUrl!).filter(Boolean) as string[];
        if (!mounted) return;
        setImages(custom);
        setAdsTotalSlides(custom.length);
      }
    };
    load();

    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('customSliderImagesAds')) {
        const custom = getCustomImagesAds().map((c) => c.dataUrl!).filter(Boolean) as string[];
        setImages(custom);
        setAdsTotalSlides(custom.length);
        const cur = useAppStore.getState().adsCurrentSlide;
        if (custom.length > 0 && (cur < 1 || cur > custom.length)) {
          useAppStore.getState().adsGoToSlide(1);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { mounted = false; window.removeEventListener('storage', onStorage); };
  }, []);

  const slidesData: SlideData[] = useMemo(() => {
    const anims: AnimationType[] = ['anim-4parts', 'anim-9parts', 'anim-5parts', 'anim-3parts'];
    return images.map((url, i) => ({ id: i + 1, backgroundImage: url, animationType: anims[i % anims.length] }));
  }, [images]);

  useEffect(() => {
    // Activate current slide classes
    const allSlides = document.querySelectorAll('.slider--el');
    allSlides.forEach(slide => slide.classList.remove('active', 'next', 'removed'));
    const activeSlide = document.querySelector(`.slider--el-${adsCurrentSlide}`);
    if (activeSlide) {
      activeSlide.classList.add('active');
      (activeSlide as HTMLElement).style.display = 'block';
    }
  }, [adsCurrentSlide]);

  // Inject background styles (use data URLs only for reliability)
  useEffect(() => {
    const styles = slidesData.map(slide => `
      .slider--el-${slide.id} .part:before { background-image: url("${slide.backgroundImage}") !important; }
      .slider--el-${slide.id} .slider--el-bg::before { background-image: url("${slide.backgroundImage}") !important; }
    `).join('\n');
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    return () => { document.head.removeChild(styleSheet); };
  }, [slidesData]);

  const renderParts = (slide: SlideData) => {
    switch (slide.animationType) {
      case 'anim-4parts':
        return (<>
          <div className="part top left"></div>
          <div className="part top right"></div>
          <div className="part bot left"></div>
          <div className="part bot right"></div>
        </>);
      case 'anim-9parts':
        return (<>
          <div className="part left-top"></div>
          <div className="part mid-top"></div>
          <div className="part right-top"></div>
          <div className="part left-mid"></div>
          <div className="part mid-mid"></div>
          <div className="part right-mid"></div>
          <div className="part left-bot"></div>
          <div className="part mid-bot"></div>
          <div className="part right-bot"></div>
        </>);
      case 'anim-5parts':
        return (<>
          <div className="part part-1"></div>
          <div className="part part-2"></div>
          <div className="part part-3"></div>
          <div className="part part-4"></div>
          <div className="part part-5"></div>
        </>);
      case 'anim-3parts':
        return (<>
          <div className="part left"></div>
          <div className="part mid"></div>
          <div className="part right"></div>
        </>);
      default:
        return null;
    }
  };

  return (
    <div className="slider" ref={sliderRef}>
      {slidesData.map((slide) => (
        <div key={slide.id} className={`slider--el slider--el-${slide.id} ${slide.animationType} ${slide.id === adsCurrentSlide ? 'active' : ''}`}>
          <div className="slider--el-bg">
            {renderParts(slide)}
          </div>
        </div>
      ))}
    </div>
  );
}
