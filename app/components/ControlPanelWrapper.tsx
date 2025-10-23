'use client';

import { useAppStore } from '../store/useAppStoreSimple';
import { broadcast } from '../utils/broadcast';
import ControlPanel from './ControlPanel';

export default function ControlPanelWrapper() {
  const {
    timer,
    currentSlide,
    totalSlides,
    autoSlidePaused,
    customAlertSeconds,
    startTimer,
    pauseTimer,
    resetTimer,
    addTime,
    subtractTime,
    nextSlide,
    prevSlide,
    goToSlide,
    toggleAutoSlide,
    setCustomAlert,
    clearCustomAlert,
  } = useAppStore();

  return (
    <ControlPanel
      onStartTimer={() => { startTimer(); broadcast('start'); }}
      onPauseTimer={() => { pauseTimer(); broadcast('pause'); }}
      onResetTimer={() => { resetTimer(); broadcast('reset'); }}
      onAddTime={(m) => { addTime(m); broadcast('add', { minutes: m }); }}
      onSubtractTime={(m) => { subtractTime(m); broadcast('sub', { minutes: m }); }}
      onNextSlide={() => { nextSlide(); broadcast('nextSlide'); }}
      onPrevSlide={() => { prevSlide(); broadcast('prevSlide'); }}
      onGoToSlide={(idx) => { goToSlide(idx); broadcast('goToSlide', { index: idx }); }}
      onToggleAutoSlide={() => { toggleAutoSlide(); broadcast('toggleAuto'); }}
  onSetCustomAlert={(m: number, s: number) => { setCustomAlert(m, s); broadcast('setCustomAlert', { minutes: m, seconds: s }); }}
      onClearCustomAlert={() => { clearCustomAlert(); broadcast('clearCustomAlert'); }}
      timerState={timer}
      currentSlide={currentSlide}
      totalSlides={totalSlides}
      autoSlidePaused={autoSlidePaused}
      customAlertSeconds={customAlertSeconds}
    />
  );
}