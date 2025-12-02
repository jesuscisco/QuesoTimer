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
    adsCurrentSlide,
    adsTotalSlides,
    adsAutoSlidePaused,
    customAlertSeconds,
    timerTitle,
    startTimer,
    pauseTimer,
    resetTimer,
    addTime,
    subtractTime,
    addSeconds,
    subtractSeconds,
    nextSlide,
    prevSlide,
    goToSlide,
    toggleAutoSlide,
  adsNextSlide,
  adsPrevSlide,
  adsGoToSlide,
  adsToggleAutoSlide,
    setCustomAlert,
    clearCustomAlert,
    setTimerTitle,
    showSliderModal,
    showPairingsModal,
    showStandingsModal,
    hideSliderModal,
  } = useAppStore();

  return (
    <ControlPanel
      onStartTimer={() => { startTimer(); broadcast('start'); }}
      onPauseTimer={() => { pauseTimer(); broadcast('pause'); }}
      onResetTimer={() => { resetTimer(); broadcast('reset'); }}
      onAddTime={(m) => { addTime(m); broadcast('add', { minutes: m }); }}
      onSubtractTime={(m) => { subtractTime(m); broadcast('sub', { minutes: m }); }}
  onAddSeconds={(s) => { addSeconds(s); broadcast('addSec', { seconds: s }); }}
  onSubtractSeconds={(s) => { subtractSeconds(s); broadcast('subSec', { seconds: s }); }}
      onNextSlide={() => { nextSlide(); broadcast('nextSlide'); }}
      onPrevSlide={() => { prevSlide(); broadcast('prevSlide'); }}
      onGoToSlide={(idx) => { goToSlide(idx); broadcast('goToSlide', { index: idx }); }}
      onToggleAutoSlide={() => { toggleAutoSlide(); broadcast('toggleAuto'); }}
  // Ads slider controls
  adsCurrentSlide={adsCurrentSlide}
  adsTotalSlides={adsTotalSlides}
  adsAutoSlidePaused={adsAutoSlidePaused}
  onAdsNextSlide={() => { adsNextSlide(); broadcast('ads_nextSlide'); }}
  onAdsPrevSlide={() => { adsPrevSlide(); broadcast('ads_prevSlide'); }}
  onAdsGoToSlide={(idx: number) => { adsGoToSlide(idx); broadcast('ads_goToSlide', { index: idx }); }}
  onAdsToggleAutoSlide={() => { adsToggleAutoSlide(); broadcast('ads_toggleAuto'); }}
  onSetCustomAlert={(m: number, s: number) => { setCustomAlert(m, s); broadcast('setCustomAlert', { minutes: m, seconds: s }); }}
      onClearCustomAlert={() => { clearCustomAlert(); broadcast('clearCustomAlert'); }}
      timerState={timer}
      currentSlide={currentSlide}
      totalSlides={totalSlides}
      autoSlidePaused={autoSlidePaused}
      customAlertSeconds={customAlertSeconds}
      currentTitle={timerTitle}
      onSetTitle={(t) => { setTimerTitle(t); broadcast('setTitle', { title: t }); }}
      onShowSliderModal={(image?: string) => { showSliderModal(image); broadcast('showModal', { image }); }}
      onShowSliderModalPairings={() => { showPairingsModal(); broadcast('showModal', { type: 'pairings' }); }}
      onShowSliderModalStandings={() => { showStandingsModal(); broadcast('showModal', { type: 'standings' }); }}
      onHideSliderModal={() => { hideSliderModal(); broadcast('hideModal'); }}
    />
  );
}