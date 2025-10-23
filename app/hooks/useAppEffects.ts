import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useTimerEffect() {
  const { timer, tickTimer } = useAppStore();

  useEffect(() => {
    let intervalRef: NodeJS.Timeout | null = null;

    if (timer.isRunning && !timer.isFinished) {
      intervalRef = setInterval(() => {
        tickTimer();
      }, 1000);
    }

    return () => {
      if (intervalRef) {
        clearInterval(intervalRef);
      }
    };
  }, [timer.isRunning, timer.isFinished, tickTimer]);
}

export function useSliderAutoAdvance() {
  const { slider, nextSlide } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => {
      if (!slider.isTransitioning) {
        nextSlide();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [slider.isTransitioning, nextSlide]);
}