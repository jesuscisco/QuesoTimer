'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStoreSimple';
import './slider.css';
import { getCustomImages, ensureCustomImagesDataUrls } from '../utils/customImages';
import { getCurrentPairings, type Pairings } from '../utils/pairings';
import { getCurrentStandings, type StandingsPayload } from '../utils/standings';

type AnimationType = 'anim-4parts' | 'anim-9parts' | 'anim-5parts' | 'anim-3parts';

interface SlideData {
  id: number;
  backgroundImage: string;
  animationType: AnimationType;
}

export default function PromoSlider() {
  const { currentSlide, setTotalSlides, goToSlide, sliderModalVisible, sliderModalImage, hideSliderModal, sliderModalType } = useAppStore();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]); // merged: api + custom
  const [apiImages, setApiImages] = useState<string[]>([]);
  const [modalShown, setModalShown] = useState<boolean>(false);
  const [modalExiting, setModalExiting] = useState<boolean>(false);
  const [pairings, setPairings] = useState<Pairings | null>(null);
  const [standings, setStandings] = useState<StandingsPayload | null>(null);

  // Load images from API + local custom and update store
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch('/api/slider-images');
        const data = await r.json();
        const list: string[] = Array.isArray(data?.images) ? data.images : [];
        let customList = getCustomImages();
        try { customList = await ensureCustomImagesDataUrls(); } catch {}
        const custom = customList.map((c) => c.dataUrl || c.cachePath!).filter(Boolean) as string[];
        if (!mounted) return;
        setApiImages(list);
        const merged = [...list, ...custom];
        setImages(merged);
        setTotalSlides(merged.length);
        if (merged.length > 0 && (currentSlide < 1 || currentSlide > merged.length)) {
          goToSlide(1);
        }
      } catch (e) {
        console.error('Error loading slider images', e);
        let customList = getCustomImages();
        try { customList = await ensureCustomImagesDataUrls(); } catch {}
        const custom = customList.map((c) => c.dataUrl || c.cachePath!).filter(Boolean) as string[];
        if (!mounted) return;
        setApiImages([]);
        setImages(custom);
        setTotalSlides(custom.length);
      }
    };
    load();

    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('customSliderImages')) {
        const custom = getCustomImages().map((c) => c.dataUrl || c.cachePath!).filter(Boolean) as string[];
        const merged = [...apiImages, ...custom];
        setImages(merged);
        setTotalSlides(merged.length);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { mounted = false; window.removeEventListener('storage', onStorage); };
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

  // Control local para permitir animación de salida
  useEffect(() => {
    if (sliderModalVisible) {
      setModalExiting(false);
      setModalShown(true);
      if (sliderModalType === 'pairings') {
        // Load latest pairings when opening
        try { setPairings(getCurrentPairings()); } catch {}
      } else if (sliderModalType === 'standings') {
        try { setStandings(getCurrentStandings()); } catch {}
      }
    } else {
      if (modalShown) {
        setModalExiting(true);
        const t = setTimeout(() => {
          setModalShown(false);
          setModalExiting(false);
        }, 350);
        return () => clearTimeout(t);
      }
    }
  }, [sliderModalVisible, sliderModalType]);

  // Keep pairings in sync if localStorage changes while modal is open
  useEffect(() => {
    if (!modalShown) return;
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (sliderModalType === 'pairings' && e.key === 'pairings.current.v1') {
        try { setPairings(getCurrentPairings()); } catch {}
      } else if (sliderModalType === 'standings' && e.key === 'standings.current.v1') {
        try { setStandings(getCurrentStandings()); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [modalShown, sliderModalType]);

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

      {/* Modal overlay covering the slider area */}
      {modalShown && (
        <div
          className="absolute inset-0 z-20 overflow-hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={() => hideSliderModal()}
        >
          <div
            className={`h-full w-full flex items-center justify-center ${modalExiting ? 'slider-modal-exit' : 'slider-modal-enter'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {sliderModalType === 'pairings' ? (
              <div className="h-[96%] w-[96%] overflow-auto p-4 md:p-6">
                <div className="mx-auto max-w-6xl bg-gray-800 text-white border border-gray-700 rounded-lg shadow-xl p-4 md:p-6">
                  {pairings ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl md:text-2xl font-semibold text-green-400">{pairings.title || 'Pareos'}</h2>
                        <div className="text-xs text-gray-400">{new Date(pairings.generatedAt).toLocaleString()}</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pairings.tables.map((table, i) => (
                          <div key={i} className="border border-gray-700 rounded-md p-3 bg-gray-900">
                            <div className="font-semibold text-gray-100 mb-2">Mesa {i + 1} ({table.length}{pairings.mode === 'twoHeads' ? ' equipos' : ' jugadores'})</div>
                            <ul className="space-y-1 text-base text-gray-200">
                              {table.map((p, idx) => (
                                <li key={idx} className="truncate">• {p}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-300 text-center">No hay pareos guardados.</div>
                  )}
                </div>
              </div>
            ) : sliderModalType === 'standings' ? (
              <div className="h-[96%] w-[96%] overflow-auto p-4 md:p-6">
                <div className="mx-auto max-w-5xl bg-gray-800 text-white border border-gray-700 rounded-lg shadow-xl p-4 md:p-6">
                  {standings ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl md:text-2xl font-semibold text-green-400">{standings.title || 'Clasificación'}</h2>
                        <div className="text-xs text-gray-400">{new Date(standings.generatedAt).toLocaleString()}</div>
                      </div>
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
                            {standings.rows.map((r, i) => (
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
                    </div>
                  ) : (
                    <div className="text-gray-300 text-center">No hay clasificación disponible.</div>
                  )}
                </div>
              </div>
            ) : (
              sliderModalImage ? (
                <img src={sliderModalImage} alt="Modal" className="max-w-full max-h-full object-contain" />
              ) : null
            )}
            {/* Print action */}
            <button
              className="absolute top-4 right-4 bg-gray-900/80 hover:bg-gray-900 text-white text-xs px-3 py-1.5 rounded border border-gray-700 shadow"
              onClick={(e) => { e.stopPropagation(); try { window.print(); } catch {} }}
              title="Imprimir"
            >
              Imprimir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}