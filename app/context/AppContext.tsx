'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TimerState {
  minutes: number;
  seconds: number;
  isFirstTimer: boolean;
  isRunning: boolean;
  isFinished: boolean;
}

interface AppContextType {
  // Timer State
  timer: TimerState;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  addTime: (minutes: number) => void;
  subtractTime: (minutes: number) => void;
  setCustomTime: (minutes: number, seconds: number) => void;
  
  // Slider State
  currentSlide: number;
  totalSlides: number;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (slideIndex: number) => void;
  isSliderTransitioning: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [timer, setTimer] = useState<TimerState>({
    minutes: 50,
    seconds: 0,
    isFirstTimer: true,
    isRunning: false,
    isFinished: false
  });

  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const [isSliderTransitioning, setIsSliderTransitioning] = useState<boolean>(false);
  const totalSlides = 4;

  // Auto-advance slider every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSliderTransitioning) {
        nextSlide();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isSliderTransitioning, currentSlide]);

  // Timer logic
  useEffect(() => {
    let intervalRef: NodeJS.Timeout | null = null;

    if (timer.isRunning && !timer.isFinished) {
      intervalRef = setInterval(() => {
        setTimer(prev => {
          const totalSeconds = prev.minutes * 60 + prev.seconds;
          
          if (totalSeconds <= 1) {
            if (prev.isFirstTimer) {
              // Reproducir alarma (simplificado para el contexto)
              try {
                const audio = new Audio('data:audio/wav;base64,UklGRvIGAABXQVZFZm10IBIAAACEAQACAABEC7QgC4wBIgKBAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzuU3fPLdCEFKoHO8tiJOAY');
                audio.play().catch(console.error);
              } catch (error) {
                console.error('Audio error:', error);
              }

              return {
                minutes: 10,
                seconds: 0,
                isFirstTimer: false,
                isRunning: true,
                isFinished: false
              };
            } else {
              return {
                ...prev,
                minutes: 0,
                seconds: 0,
                isRunning: false,
                isFinished: true
              };
            }
          }
          
          const newTotalSeconds = totalSeconds - 1;
          return {
            ...prev,
            minutes: Math.floor(newTotalSeconds / 60),
            seconds: newTotalSeconds % 60
          };
        });
      }, 1000);
    }

    return () => {
      if (intervalRef) {
        clearInterval(intervalRef);
      }
    };
  }, [timer.isRunning, timer.isFinished]);

  // Timer controls
  const startTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: true }));
  };

  const pauseTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: false }));
  };

  const resetTimer = () => {
    setTimer({
      minutes: 50,
      seconds: 0,
      isFirstTimer: true,
      isRunning: false,
      isFinished: false
    });
  };

  const addTime = (minutes: number) => {
    setTimer(prev => ({
      ...prev,
      minutes: prev.minutes + minutes
    }));
  };

  const subtractTime = (minutes: number) => {
    setTimer(prev => {
      const newMinutes = Math.max(0, prev.minutes - minutes);
      return {
        ...prev,
        minutes: newMinutes
      };
    });
  };

  const setCustomTime = (minutes: number, seconds: number) => {
    setTimer(prev => ({
      ...prev,
      minutes: Math.max(0, minutes),
      seconds: Math.max(0, Math.min(59, seconds))
    }));
  };

  // Slider controls
  const handleSlideChange = (newSlide: number) => {
    if (isSliderTransitioning) return;
    
    setIsSliderTransitioning(true);
    
    // Trigger slide animation logic
    const allSlides = document.querySelectorAll('.slider--el');
    allSlides.forEach(slide => {
      (slide as HTMLElement).style.display = 'block';
      (slide as HTMLElement).offsetTop;
    });
    
    const activeSlide = document.querySelector('.slider--el.active');
    if (activeSlide) {
      activeSlide.classList.add('removed');
    }
    
    const nextSlideEl = document.querySelector(`.slider--el-${newSlide}`);
    if (nextSlideEl) {
      nextSlideEl.classList.add('next');
    }
    
    setTimeout(() => {
      const removedSlides = document.querySelectorAll('.slider--el.removed');
      removedSlides.forEach(slide => {
        (slide as HTMLElement).style.display = 'none';
      });
      
      allSlides.forEach(slide => {
        slide.classList.remove('active', 'next', 'removed');
      });
      
      const newActiveSlide = document.querySelector(`.slider--el-${newSlide}`);
      if (newActiveSlide) {
        newActiveSlide.classList.add('active');
      }
      
      setCurrentSlide(newSlide);
      setIsSliderTransitioning(false);
    }, 1800);
  };

  const nextSlide = () => {
    const newSlide = currentSlide >= totalSlides ? 1 : currentSlide + 1;
    handleSlideChange(newSlide);
  };

  const prevSlide = () => {
    const newSlide = currentSlide <= 1 ? totalSlides : currentSlide - 1;
    handleSlideChange(newSlide);
  };

  const goToSlide = (slideIndex: number) => {
    if (slideIndex >= 1 && slideIndex <= totalSlides && slideIndex !== currentSlide) {
      handleSlideChange(slideIndex);
    }
  };

  const value: AppContextType = {
    timer,
    startTimer,
    pauseTimer,
    resetTimer,
    addTime,
    subtractTime,
    setCustomTime,
    currentSlide,
    totalSlides,
    nextSlide,
    prevSlide,
    goToSlide,
    isSliderTransitioning
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}