import { create } from 'zustand';

interface TimerState {
  minutes: number;
  seconds: number;
  isFirstTimer: boolean;
  isRunning: boolean;
  isFinished: boolean;
}

interface AppStore {
  // Timer State
  timer: TimerState;
  
  // Slider State
  currentSlide: number;
  totalSlides: number;
  isSliderTransitioning: boolean;
  autoSlidePaused: boolean;
  // Custom alert
  customAlertSeconds: number | null;
  customAlertFired: boolean;
  audioUnlocked: boolean;
  
  // Timer Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  addTime: (minutes: number) => void;
  subtractTime: (minutes: number) => void;
  
  // Slider Actions
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (slideIndex: number) => void;
  setTotalSlides: (n: number) => void;
  pauseAutoSlide: () => void;
  resumeAutoSlide: () => void;
  toggleAutoSlide: () => void;
  
  // Custom alert actions
  setCustomAlert: (minutes: number, seconds: number) => void;
  clearCustomAlert: () => void;
  markAudioUnlocked: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial Timer State
  timer: {
    minutes: 50,
    seconds: 0,
    isFirstTimer: true,
    isRunning: false,
    isFinished: false,
  },
  
  // Initial Slider State
  currentSlide: 1,
  totalSlides: 4,
  isSliderTransitioning: false,
  autoSlidePaused: false,
  customAlertSeconds: null,
  customAlertFired: false,
  audioUnlocked: false,
  
  // Timer Actions
  startTimer: () => {
    console.log('🚀 SIMPLE: Start Timer Called');
    set((state) => ({
      timer: { ...state.timer, isRunning: true },
    }));
  },
  
  pauseTimer: () => {
    console.log('⏸️ SIMPLE: Pause Timer Called');
    set((state) => ({
      timer: { ...state.timer, isRunning: false },
    }));
  },
  
  resetTimer: () => {
    console.log('🔄 SIMPLE: Reset Timer Called');
    set({
      timer: {
        minutes: 50,
        seconds: 0,
        isFirstTimer: true,
        isRunning: false,
        isFinished: false,
      },
      customAlertFired: false,
    });
  },
  
  addTime: (minutes: number) => {
    set((state) => ({
      timer: {
        ...state.timer,
        minutes: state.timer.minutes + minutes,
      },
    }));
  },
  
  subtractTime: (minutes: number) => {
    set((state) => ({
      timer: {
        ...state.timer,
        minutes: Math.max(0, state.timer.minutes - minutes),
      },
    }));
  },
  
  // Slider Actions
  nextSlide: () => {
    const { currentSlide, totalSlides, isSliderTransitioning } = get();
    if (isSliderTransitioning) return;
    
    const newSlide = currentSlide >= totalSlides ? 1 : currentSlide + 1;
    get().goToSlide(newSlide);
  },
  
  prevSlide: () => {
    const { currentSlide, totalSlides, isSliderTransitioning } = get();
    if (isSliderTransitioning) return;
    
    const newSlide = currentSlide <= 1 ? totalSlides : currentSlide - 1;
    get().goToSlide(newSlide);
  },
  
  goToSlide: (slideIndex: number) => {
    const { currentSlide, totalSlides, isSliderTransitioning } = get();
    if (isSliderTransitioning || slideIndex === currentSlide) return;
    if (slideIndex < 1 || slideIndex > totalSlides) return;
    
    console.log(`🎠 SIMPLE: Going to slide ${slideIndex}`);
    
    set({ isSliderTransitioning: true });
    
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
    
    const nextSlideEl = document.querySelector(`.slider--el-${slideIndex}`);
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
      
      const newActiveSlide = document.querySelector(`.slider--el-${slideIndex}`);
      if (newActiveSlide) {
        newActiveSlide.classList.add('active');
      }
      
      set({
        currentSlide: slideIndex,
        isSliderTransitioning: false,
      });
      
      console.log(`✅ SIMPLE: Slide ${slideIndex} activated`);
    }, 1800);
  },
  
  setTotalSlides: (n: number) => {
    set((state) => ({
      totalSlides: n,
      // clamp current slide if out of range
      currentSlide: n === 0 ? 1 : Math.min(Math.max(1, state.currentSlide), n),
    }));
  },
  
  pauseAutoSlide: () => set({ autoSlidePaused: true }),
  resumeAutoSlide: () => set({ autoSlidePaused: false }),
  toggleAutoSlide: () => set((s) => ({ autoSlidePaused: !s.autoSlidePaused })),
  
  // Custom alert controls
  setCustomAlert: (minutes: number, seconds: number) => set({
    customAlertSeconds: Math.max(0, Math.floor(minutes) * 60 + Math.floor(seconds)),
    customAlertFired: false,
  }),
  clearCustomAlert: () => set({ customAlertSeconds: null, customAlertFired: false }),
  markAudioUnlocked: () => set({ audioUnlocked: true }),
}));