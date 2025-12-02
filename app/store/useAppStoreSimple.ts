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
  // Custom title for main phase
  timerTitle: string;
  // Slider Modal
  sliderModalVisible: boolean;
  sliderModalImage: string | null;
  sliderModalType: 'image' | 'pairings' | 'standings';
  
  // Slider State
  currentSlide: number;
  totalSlides: number;
  isSliderTransitioning: boolean;
  autoSlidePaused: boolean;
  // Custom alert
  customAlertSeconds: number | null;
  customAlertFired: boolean;
  audioUnlocked: boolean;
  
  // Ads Slider State (independent fullscreen anuncios)
  adsCurrentSlide: number;
  adsTotalSlides: number;
  adsIsSliderTransitioning: boolean;
  adsAutoSlidePaused: boolean;
  
  // Timer Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  addTime: (minutes: number) => void;
  subtractTime: (minutes: number) => void;
  addSeconds: (seconds: number) => void;
  subtractSeconds: (seconds: number) => void;
  
  // Slider Actions
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (slideIndex: number) => void;
  setTotalSlides: (n: number) => void;
  pauseAutoSlide: () => void;
  resumeAutoSlide: () => void;
  toggleAutoSlide: () => void;
  
  // Ads Slider Actions
  adsNextSlide: () => void;
  adsPrevSlide: () => void;
  adsGoToSlide: (slideIndex: number) => void;
  setAdsTotalSlides: (n: number) => void;
  adsPauseAutoSlide: () => void;
  adsResumeAutoSlide: () => void;
  adsToggleAutoSlide: () => void;
  
  // Custom alert actions
  setCustomAlert: (minutes: number, seconds: number) => void;
  clearCustomAlert: () => void;
  markAudioUnlocked: () => void;
  setTimerTitle: (title: string) => void;
  showSliderModal: (image?: string | null) => void;
  showPairingsModal: () => void;
  showStandingsModal: () => void;
  hideSliderModal: () => void;
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
  // Initial Timer Title (persisted)
  timerTitle: (typeof window !== 'undefined' && localStorage.getItem('timerTitle')) || 'MAGIC TIMER',
  
  // Initial Slider State
  currentSlide: 1,
  totalSlides: 4,
  isSliderTransitioning: false,
  autoSlidePaused: false,
  sliderModalVisible: false,
  sliderModalImage: null,
  sliderModalType: 'image',
  customAlertSeconds: null,
  customAlertFired: false,
  audioUnlocked: false,
  
  // Ads initial state
  adsCurrentSlide: 1,
  adsTotalSlides: 0,
  adsIsSliderTransitioning: false,
  adsAutoSlidePaused: false,
  
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
  
  addSeconds: (seconds: number) => {
    set((state) => {
      const clamped = Math.max(0, Math.floor(seconds));
      const total = state.timer.minutes * 60 + state.timer.seconds + clamped;
      return {
        timer: {
          ...state.timer,
          minutes: Math.floor(total / 60),
          seconds: total % 60,
        },
      };
    });
  },
  
  subtractSeconds: (seconds: number) => {
    set((state) => {
      const clamped = Math.max(0, Math.floor(seconds));
      const total = Math.max(0, state.timer.minutes * 60 + state.timer.seconds - clamped);
      return {
        timer: {
          ...state.timer,
          minutes: Math.floor(total / 60),
          seconds: total % 60,
        },
      };
    });
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
  
  // Ads Slider Actions
  adsNextSlide: () => {
    const { adsCurrentSlide, adsTotalSlides, adsIsSliderTransitioning } = get();
    if (adsIsSliderTransitioning) return;
    const newSlide = adsCurrentSlide >= adsTotalSlides ? 1 : adsCurrentSlide + 1;
    get().adsGoToSlide(newSlide);
  },
  adsPrevSlide: () => {
    const { adsCurrentSlide, adsTotalSlides, adsIsSliderTransitioning } = get();
    if (adsIsSliderTransitioning) return;
    const newSlide = adsCurrentSlide <= 1 ? adsTotalSlides : adsCurrentSlide - 1;
    get().adsGoToSlide(newSlide);
  },
  adsGoToSlide: (slideIndex: number) => {
    const { adsCurrentSlide, adsTotalSlides, adsIsSliderTransitioning } = get();
    if (adsIsSliderTransitioning || slideIndex === adsCurrentSlide) return;
    if (slideIndex < 1 || slideIndex > adsTotalSlides) return;
    set({ adsIsSliderTransitioning: true });
    const allSlides = document.querySelectorAll('.slider--el');
    allSlides.forEach(slide => {
      (slide as HTMLElement).style.display = 'block';
      (slide as HTMLElement).offsetTop;
    });
    const activeSlide = document.querySelector('.slider--el.active');
    if (activeSlide) activeSlide.classList.add('removed');
    const nextSlideEl = document.querySelector(`.slider--el-${slideIndex}`);
    if (nextSlideEl) nextSlideEl.classList.add('next');
    setTimeout(() => {
      const removedSlides = document.querySelectorAll('.slider--el.removed');
      removedSlides.forEach(slide => { (slide as HTMLElement).style.display = 'none'; });
      allSlides.forEach(slide => { slide.classList.remove('active', 'next', 'removed'); });
      const newActiveSlide = document.querySelector(`.slider--el-${slideIndex}`);
      if (newActiveSlide) newActiveSlide.classList.add('active');
      set({ adsCurrentSlide: slideIndex, adsIsSliderTransitioning: false });
    }, 1800);
  },
  setAdsTotalSlides: (n: number) => {
    set((state) => ({
      adsTotalSlides: n,
      adsCurrentSlide: n === 0 ? 1 : Math.min(Math.max(1, state.adsCurrentSlide), n),
    }));
  },
  adsPauseAutoSlide: () => set({ adsAutoSlidePaused: true }),
  adsResumeAutoSlide: () => set({ adsAutoSlidePaused: false }),
  adsToggleAutoSlide: () => set((s) => ({ adsAutoSlidePaused: !s.adsAutoSlidePaused })),
  
  // Custom alert controls
  setCustomAlert: (minutes: number, seconds: number) => set({
    customAlertSeconds: Math.max(0, Math.floor(minutes) * 60 + Math.floor(seconds)),
    customAlertFired: false,
  }),
  clearCustomAlert: () => set({ customAlertSeconds: null, customAlertFired: false }),
  markAudioUnlocked: () => set({ audioUnlocked: true }),
  setTimerTitle: (title: string) => {
    const t = String(title || '').slice(0, 60);
    try { if (typeof window !== 'undefined') localStorage.setItem('timerTitle', t); } catch {}
    set({ timerTitle: t });
  },
  showSliderModal: (image?: string | null) => set({ sliderModalVisible: true, sliderModalType: 'image', sliderModalImage: image || null }),
  showPairingsModal: () => set({ sliderModalVisible: true, sliderModalType: 'pairings', sliderModalImage: null }),
  showStandingsModal: () => set({ sliderModalVisible: true, sliderModalType: 'standings', sliderModalImage: null }),
  hideSliderModal: () => set({ sliderModalVisible: false }),
}));