// Simple Web Audio API beeper to avoid media decode errors.
// Must be unlocked by a user gesture (resume AudioContext).

let audioCtx: (AudioContext | null) = null;
const bufferCache: Map<string, AudioBuffer> = new Map();

function getOrCreateContext(): AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext not available on server');
  }
  if (!audioCtx) {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    audioCtx = new Ctx();
  }
  return audioCtx!;
}

export async function unlockAudioContext(): Promise<boolean> {
  try {
    const ctx = getOrCreateContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

export function isAudioUnlocked(): boolean {
  try {
    const ctx = getOrCreateContext();
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

export function playBeep(durationMs = 300, frequency = 880, volume = 0.2): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const ctx = getOrCreateContext();
      if (ctx.state !== 'running') {
        // If locked, try to resume; may still fail without gesture
        try { await ctx.resume(); } catch {}
      }
      if (ctx.state !== 'running') {
        // Can't play without unlock
        return resolve();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = frequency;
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);

      const now = ctx.currentTime;
      const attack = 0.01;
      const release = 0.08;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + attack);
      const endTime = now + durationMs / 1000;
      gain.gain.setTargetAtTime(0, endTime - release, release / 5);

      osc.start(now);
      osc.stop(endTime);
      osc.onended = () => {
        try { osc.disconnect(); gain.disconnect(); } catch {}
        resolve();
      };
    } catch (e) {
      resolve();
    }
  });
}

export async function playAudioFile(url: string, volume = 0.5): Promise<void> {
  try {
    const ctx = getOrCreateContext();
    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch {}
    }
    if (ctx.state !== 'running') {
      // Cannot play without user gesture
      return;
    }

    let buffer = bufferCache.get(url);
    if (!buffer) {
      const res = await fetch(url);
      const data = await res.arrayBuffer();
      buffer = await ctx.decodeAudioData(data);
      bufferCache.set(url, buffer);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(gain).connect(ctx.destination);

    const now = ctx.currentTime;
    const attack = 0.01;
    const release = Math.min(0.08, (buffer.duration || 0.2) / 4);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    const endTime = now + (buffer.duration || 0.2);
    gain.gain.setTargetAtTime(0, endTime - release, release / 5);

    src.start(now);
    src.stop(endTime + 0.02);
    await new Promise<void>((resolve) => {
      src.onended = () => {
        try { src.disconnect(); gain.disconnect(); } catch {}
        resolve();
      };
    });
  } catch (e) {
    // Swallow errors to avoid breaking flow
  }
}

export function playWarning(volume = 0.6): Promise<void> {
  return playAudioFile('/sound/warning.mp3', volume);
}

export function playOver(volume = 0.7): Promise<void> {
  return playAudioFile('/sound/over.mp3', volume);
}
