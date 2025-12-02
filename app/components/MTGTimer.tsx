'use client';

import { useAppStore } from '../store/useAppStoreSimple';

export default function MTGTimer() {
  const { timer, timerTitle } = useAppStore();

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerPhase = () => {
    if (timer.isFinished) return 'finished';
    if (timer.isFirstTimer) return 'main';
    return 'overtime';
  };

  const getBackgroundClass = () => {
    const phase = getTimerPhase();
    switch (phase) {
      case 'main':
        return 'bg-gradient-to-br from-blue-900 via-purple-900 to-black';
      case 'overtime':
        return 'bg-gradient-to-br from-red-900 via-orange-900 to-black';
      case 'finished':
        return 'bg-gradient-to-br from-gray-800 via-gray-900 to-black';
      default:
        return 'bg-gradient-to-br from-blue-900 via-purple-900 to-black';
    }
  };

  const getTextColor = () => {
    const phase = getTimerPhase();
    switch (phase) {
      case 'main':
        return 'text-blue-100';
      case 'overtime':
        return 'text-red-100';
      case 'finished':
        return 'text-gray-300';
      default:
        return 'text-blue-100';
    }
  };

  return (
  <div className={`min-h-screen flex flex-col items-stretch justify-start relative overflow-hidden transition-all duration-1000 ${getBackgroundClass()}`}>
      {/* Imagen de fondo MTG */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="mtg" patternUnits="userSpaceOnUse" width="50" height="50"><polygon points="25,5 45,20 45,35 25,50 5,35 5,20" fill="none" stroke="white" stroke-width="1" opacity="0.3"/><circle cx="25" cy="25" r="8" fill="none" stroke="white" stroke-width="1" opacity="0.2"/></pattern></defs><rect width="100" height="100" fill="url(%23mtg)"/></svg>')`
        }}
      />
      
      {/* Efectos de partículas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-white rounded-full opacity-30 animate-pulse`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Contenido principal con título pegado arriba */}
      <div className="relative z-10 w-full px-4 pt-4 md:pt-5 lg:pt-6 xl:pt-8 flex flex-col items-center">
        <div className="flex flex-col items-center gap-4 md:gap-5 lg:gap-6 xl:gap-8">
          {/* Título */}
          <h1 className={`text-center text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-wider uppercase ${getTextColor()} drop-shadow-2xl select-none leading-tight`}>
            {timer.isFirstTimer ? ((timerTitle || 'MAGIC TIMER').toUpperCase()) : timer.isFinished ? "TIME'S UP!" : 'OVERTIME'}
          </h1>
          {/* Timer */}
          <div className="flex flex-col items-center justify-center mt-1 md:mt-6 lg:mt-8 xl:mt-10">
            <div className="text-[9rem] md:text-[11rem] lg:text-[13rem] xl:text-[15rem] font-mono font-bold tracking-wider drop-shadow-2xl transform transition-all duration-300 leading-none">
              <span className="inline-block animate-pulse">
                {formatTime(timer.minutes, timer.seconds)}
              </span>
            </div>
            <div className={`pt-10 text-2xl md:text-3xl lg:text-4xl mt-2 font-semibold ${getTextColor()} opacity-80`}>
              {timer.isFirstTimer ? 'Tiempo Ordinario' : timer.isFinished ? 'Game Over' : 'Tiempo Extra'}
            </div>
          </div>
          {/* Estado */}
          <div className="flex flex-col items-center gap-2">
            <div className={`px-6 py-3 rounded-full ${getTextColor()} bg-black/30 text-lg font-semibold backdrop-blur-sm`}>
              {timer.isRunning ? '▶ En curso' : timer.isFinished ? '⏹ Terminado' : '⏸ Pausado'}
            </div>
          </div>
          {/* Info adicional */}
          <div className={`text-base md:text-lg lg:text-xl ${getTextColor()} opacity-60 text-center`}>          
            {timer.isFirstTimer 
              ? `La ronda termina en ${formatTime(timer.minutes, timer.seconds)}` 
              : timer.isFinished
              ? 'La partida ha terminado'
              : `Tiempo extra: ${formatTime(timer.minutes, timer.seconds)} restantes`}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-black bg-opacity-50">
        <div 
          className={`h-full transition-all duration-1000 ${
            timer.isFirstTimer 
              ? 'bg-linear-to-r from-blue-500 to-purple-500' 
              : 'bg-linear-to-r from-red-500 to-orange-500'
          }`}
          style={{
            width: timer.isFirstTimer 
              ? `${((50 * 60 - (timer.minutes * 60 + timer.seconds)) / (50 * 60)) * 100}%`
              : `${((10 * 60 - (timer.minutes * 60 + timer.seconds)) / (10 * 60)) * 100}%`
          }}
        />
      </div>
    </div>
  );
}