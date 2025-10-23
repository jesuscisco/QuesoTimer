'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStoreSimple';
import { playWarning, playOver } from '../utils/sound';

export function useSimpleTimer() {
  const { timer } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timer.isRunning && !timer.isFinished) {
      intervalRef.current = setInterval(() => {
        const currentState = useAppStore.getState();
        const { timer: currentTimer } = currentState;
        
        if (!currentTimer.isRunning || currentTimer.isFinished) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }
        
        const totalSeconds = currentTimer.minutes * 60 + currentTimer.seconds;
        
        // Custom alert check: if current time matches alert threshold and not fired, play alarm (only after user gesture)
        const { customAlertSeconds, customAlertFired, audioUnlocked } = useAppStore.getState();
        if (!customAlertFired && customAlertSeconds != null && totalSeconds === customAlertSeconds) {
          if (audioUnlocked) {
            playWarning();
          } else {
            console.warn('Custom alert reached but audio is locked by browser; waiting for user interaction');
          }
          useAppStore.setState({ customAlertFired: true });
        }
        console.log(`⏱️ SIMPLE: Tick - ${currentTimer.minutes}:${currentTimer.seconds.toString().padStart(2, '0')}`);
        
        if (totalSeconds <= 1) {
          if (currentTimer.isFirstTimer) {
            console.log('🔔 SIMPLE: First timer finished, switching to overtime');
            // Reproducir alarma si el audio está desbloqueado
            if (useAppStore.getState().audioUnlocked) {
              playWarning();
            }
            
            useAppStore.setState({
              timer: {
                minutes: 10,
                seconds: 0,
                isFirstTimer: false,
                isRunning: true,
                isFinished: false,
              },
              // Allow custom alert to trigger again in next phase
              customAlertFired: false,
            });
          } else {
            console.log('🏁 SIMPLE: Game finished');
            
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            
            // Reproducir sonido de fin (over)
            if (useAppStore.getState().audioUnlocked) {
              playOver();
            }

            useAppStore.setState({
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
          useAppStore.setState({
            timer: {
              ...currentTimer,
              minutes: Math.floor(newTotalSeconds / 60),
              seconds: newTotalSeconds % 60,
            },
          });
        }
      }, 1000);

      console.log('⏰ SIMPLE: Timer interval started');
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏹️ SIMPLE: Timer interval stopped');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.isRunning, timer.isFinished]);
}