'use client';

import { useState, useEffect } from 'react';
import { playWarning, playOver } from '../utils/sound';

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
  onSetCustomAlert: (minutes: number, seconds: number) => void;
  onClearCustomAlert: () => void;
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
  customAlertSeconds: number | null;
}

export default function ControlPanel(props: TimerControlProps) {
  const [timeToAdd, setTimeToAdd] = useState<number>(1);
  const [secondsToAdjust, setSecondsToAdjust] = useState<number>(10);
  const [customTime, setCustomTime] = useState<{ minutes: number; seconds: number }>({
    minutes: 50,
    seconds: 0
  });
  const [images, setImages] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);
  const [installAvailable, setInstallAvailable] = useState<boolean>(false);

  // Cargar imágenes del slider para el preview
  useEffect(() => {
    let mounted = true;
    fetch('/api/slider-images')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const list: string[] = Array.isArray(data?.images) ? data.images : [];
        setImages(list);
      })
      .catch(() => setImages([]));
    return () => { mounted = false; };
  }, []);

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
          window.open('/', '_blank', 'noopener,noreferrer');
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
                      try { window.open('/', '_blank', 'noopener,noreferrer'); } catch {}
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
                try { window.open('/', '_blank', 'noopener,noreferrer'); } catch {}
              }}
              className="px-3 py-1.5 rounded-md border text-xs transition-colors bg-green-700 hover:bg-green-800 border-green-600"
              title="Abrir pantalla del Timer y Slider"
            >
              Abrir pantalla
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
                  ➕ Agregar segundos
                </button>

                <button
                  onClick={() => props.onSubtractSeconds(secondsToAdjust)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-all duration-200"
                >
                  ➖ Quitar segundos
                </button>
              </div>

              {/* Custom Time Set */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-gray-300">Tiempo personalizado:</span>
                <input
                  type="number"
                  value={customTime.minutes}
                  onChange={(e) => setCustomTime(prev => ({ ...prev, minutes: Math.max(0, Number(e.target.value)) }))}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-20"
                  min="0"
                  max="99"
                />
                <span className="text-gray-300">:</span>
                <input
                  type="number"
                  value={customTime.seconds}
                  onChange={(e) => setCustomTime(prev => ({ ...prev, seconds: Math.max(0, Math.min(59, Number(e.target.value))) }))}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-20"
                  min="0"
                  max="59"
                />
                <button
                  onClick={() => props.onSetCustomAlert(customTime.minutes, customTime.seconds)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-all duration-200"
                >
                  ⏰ Establecer
                </button>
                {typeof props.customAlertSeconds === 'number' && (
                  <>
                    <span className="text-gray-400 text-sm">
                      Objetivo: {Math.floor((props.customAlertSeconds || 0) / 60).toString().padStart(2,'0')}:{((props.customAlertSeconds || 0) % 60).toString().padStart(2,'0')}
                    </span>
                    <button
                      onClick={props.onClearCustomAlert}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm"
                    >
                      Limpiar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
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

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm border-t border-gray-700 pt-4">
          Panel de Control - Magic: The Gathering Timer & Slider
        </div>
      </div>
    </div>
  );
}