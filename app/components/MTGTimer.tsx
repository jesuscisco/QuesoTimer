'use client';

import { useAppStore } from '../store/useAppStoreSimple';

export default function MTGTimer() {
  const { timer } = useAppStore();

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
    <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-all duration-1000 ${getBackgroundClass()}`}>
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

      {/* Contenido principal */}
      <div className="relative z-10 text-center">
        {/* Título */}
        <h1 className={`text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 tracking-wider ${getTextColor()} drop-shadow-2xl`}>
          {timer.isFirstTimer ? 'MAGIC TIMER' : timer.isFinished ? 'TIME\'S UP!' : 'OVERTIME'}
        </h1>

        {/* Display del timer */}
        <div className={`relative mb-8 ${getTextColor()}`}>
          <div className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-mono font-bold tracking-wider drop-shadow-2xl transform transition-all duration-500 hover:scale-105">
            <span className="inline-block animate-pulse">
              {formatTime(timer.minutes, timer.seconds)}
            </span>
          </div>
          
          {/* Indicador de fase */}
          <div className={`text-lg md:text-xl lg:text-2xl mt-2 font-semibold ${getTextColor()} opacity-80`}>
            {timer.isFirstTimer ? 'Tiempo Ordinario' : timer.isFinished ? 'Game Over' : 'Tiempo Extra'}
          </div>
        </div>

        {/* Status visual - sin controles + debug */}
        <div className="flex flex-col items-center gap-2">
          <div className={`px-6 py-3 rounded-full ${getTextColor()} bg-black bg-opacity-30 text-lg font-semibold`}>
            {timer.isRunning ? '▶ En curso' : timer.isFinished ? '⏹ Terminado' : '⏸ Pausado'}
          </div>

        </div>

        {/* Información adicional */}
        <div className={`mt-8 text-sm md:text-base ${getTextColor()} opacity-60`}>
          {timer.isFirstTimer 
            ? `La ronda termina en ${formatTime(timer.minutes, timer.seconds)}` 
            : timer.isFinished
            ? 'La partida ha terminado'
            : `Tiempo extra: ${formatTime(timer.minutes, timer.seconds)} restantes`
          }
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