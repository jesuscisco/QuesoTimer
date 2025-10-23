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
  
  // Timer Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  addTime: (minutes: number) => void;
  subtractTime: (minutes: number) => void;
  tickTimer: () => void;
  
  // Slider Actions
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (slideIndex: number) => void;
}

// Variable global para manejar el intervalo del timer
let timerInterval: NodeJS.Timeout | null = null;

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
  
  // Timer Actions
  startTimer: () => {
    console.log('🚀 ZUSTAND: Start Timer Called');
    
    // Actualizar estado
    set((state) => ({
      timer: { ...state.timer, isRunning: true },
    }));
    
    // Limpiar intervalo existente si existe
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    // Crear nuevo intervalo
    timerInterval = setInterval(() => {
      console.log('⏰ ZUSTAND: Timer Tick');
      get().tickTimer();
    }, 1000);
    
    console.log('✅ ZUSTAND: Timer interval started');
  },
  
  pauseTimer: () => {
    console.log('⏸️ ZUSTAND: Pause Timer Called');
    
    set((state) => ({
      timer: { ...state.timer, isRunning: false },
    }));
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      console.log('✅ ZUSTAND: Timer interval cleared');
    }
  },
  
  resetTimer: () => {
    console.log('🔄 ZUSTAND: Reset Timer Called');
    
    // Limpiar intervalo
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    // Resetear estado
    set({
      timer: {
        minutes: 50,
        seconds: 0,
        isFirstTimer: true,
        isRunning: false,
        isFinished: false,
      },
    });
    
    console.log('✅ ZUSTAND: Timer reset complete');
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
  
  tickTimer: () => {
    const { timer } = get();
    
    if (!timer.isRunning || timer.isFinished) {
      console.log('⏹️ ZUSTAND: Timer not running, stopping tick');
      return;
    }
    
    const totalSeconds = timer.minutes * 60 + timer.seconds;
    console.log(`⏱️ ZUSTAND: Tick - ${timer.minutes}:${timer.seconds.toString().padStart(2, '0')} (${totalSeconds}s total)`);
    
    if (totalSeconds <= 1) {
      if (timer.isFirstTimer) {
        console.log('🔔 ZUSTAND: First timer finished, switching to overtime');
        
        // Reproducir alarma
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRvIGAABXQVZFZm10IBIAAACEAQACAABEC7QgC4wBIgKBAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzuU3fPLdCEFKoHO8tiJOAY');
          audio.play().catch(console.error);
        } catch (error) {
          console.error('Audio error:', error);
        }
        
        set({
          timer: {
            minutes: 10,
            seconds: 0,
            isFirstTimer: false,
            isRunning: true,
            isFinished: false,
          },
        });
      } else {
        console.log('🏁 ZUSTAND: Game finished');
        
        // Limpiar intervalo
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        
        set({
          timer: {
            minutes: 0,
            seconds: 0,
            isFirstTimer: false,
            isRunning: false,
            isFinished: true,
          },
        });
      }
    } else {
      // Continuar cuenta regresiva
      const newTotalSeconds = totalSeconds - 1;
      set({
        timer: {
          ...get().timer,
          minutes: Math.floor(newTotalSeconds / 60),
          seconds: newTotalSeconds % 60,
        },
      });
    }
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
    
    console.log(`🎠 ZUSTAND: Going to slide ${slideIndex}`);
    
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
      
      console.log(`✅ ZUSTAND: Slide ${slideIndex} activated`);
    }, 1800);
  },
}));