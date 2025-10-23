'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStoreSimple';
import './slider.css';

type AnimationType = 'anim-4parts' | 'anim-9parts' | 'anim-5parts' | 'anim-3parts';

interface SlideData {
  id: number;
  backgroundImage: string;
  animationType: AnimationType;
}

export default function PromoSlider() {
  const { currentSlide, setTotalSlides, goToSlide } = useAppStore();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]);

  // Load images from API and update store with total slides
  useEffect(() => {
    let mounted = true;
    fetch('/api/slider-images')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const list: string[] = Array.isArray(data?.images) ? data.images : [];
        setImages(list);
        setTotalSlides(list.length);
        if (list.length > 0 && (currentSlide < 1 || currentSlide > list.length)) {
          goToSlide(1);
        }
      })
      .catch((e) => {
        console.error('Error loading slider images', e);
        setImages([]);
        setTotalSlides(0);
      });
    return () => { mounted = false; };
  }, []);

  const slidesData: SlideData[] = useMemo(() => {
    const anims: AnimationType[] = ['anim-4parts', 'anim-9parts', 'anim-5parts', 'anim-3parts'];
    return images.map((url, i) => ({
      id: i + 1,
      backgroundImage: url,
      animationType: anims[i % anims.length],
    }));
  }, [images]);

  // Escuchar cambios del store para manejar las animaciones
  useEffect(() => {
    // Aplicar las animaciones cuando cambia el slide desde el store
    const allSlides = document.querySelectorAll('.slider--el');
    
    // Limpiar todas las clases
    allSlides.forEach(slide => {
      slide.classList.remove('active', 'next', 'removed');
    });
    
    // Activar slide actual
    const activeSlide = document.querySelector(`.slider--el-${currentSlide}`);
    if (activeSlide) {
      activeSlide.classList.add('active');
      (activeSlide as HTMLElement).style.display = 'block';
    }
  }, [currentSlide]);

  const renderParts = (slide: SlideData) => {  
    switch (slide.animationType) {
      case 'anim-4parts':
        return (
          <>
            <div className="part top left"></div>
            <div className="part top right"></div>
            <div className="part bot left"></div>
            <div className="part bot right"></div>
          </>
        );
      
      case 'anim-9parts':
        return (
          <>
            <div className="part left-top"></div>
            <div className="part mid-top"></div>
            <div className="part right-top"></div>
            <div className="part left-mid"></div>
            <div className="part mid-mid"></div>
            <div className="part right-mid"></div>
            <div className="part left-bot"></div>
            <div className="part mid-bot"></div>
            <div className="part right-bot"></div>
          </>
        );
      
      case 'anim-5parts':
        return (
          <>
            <div className="part part-1"></div>
            <div className="part part-2"></div>
            <div className="part part-3"></div>
            <div className="part part-4"></div>
            <div className="part part-5"></div>
          </>
        );
      
      case 'anim-3parts':
        return (
          <>
            <div className="part left"></div>
            <div className="part mid"></div>
            <div className="part right"></div>
          </>
        );
      
      default:
        return null;
    }
  };

  // Inyectar estilos para las imágenes de fondo dinámicamente
  useEffect(() => {
    const styles = slidesData.map(slide => `
      .slider--el-${slide.id} .part:before {
        background-image: url(${slide.backgroundImage}) !important;
      }
      .slider--el-${slide.id} .slider--el-bg::before {
        background-image: url(${slide.backgroundImage}) !important;
      }
    `).join('\n');
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [slidesData]);

  return (
    <div className={"slider"} ref={sliderRef}>
      {slidesData.map((slide) => (
        <div
          key={slide.id}
          className={`slider--el slider--el-${slide.id} ${slide.animationType} ${
            slide.id === currentSlide ? 'active' : ''
          }`}
        >
          <div className="slider--el-bg">
            {renderParts(slide)}
          </div>
        </div>
      ))}
    </div>
  );
}