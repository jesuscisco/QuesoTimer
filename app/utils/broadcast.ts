'use client';

// Simple BroadcastChannel helper to sync actions across tabs/windows
// Includes a per-tab senderId to avoid processing our own messages.

type BroadcastMessage = {
  senderId: string;
  action:
    | 'start'
    | 'pause'
    | 'reset'
    | 'add'
    | 'sub'
    | 'addSec'
    | 'subSec'
    | 'nextSlide'
    | 'prevSlide'
    | 'goToSlide'
    | 'toggleAuto'
    | 'setCustomAlert'
  | 'clearCustomAlert'
  | 'unlockAudio'
  | 'setTitle'
  | 'showModal'
  | 'hideModal';
  payload?: any;
};

const senderId = Math.random().toString(36).slice(2);

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!('BroadcastChannel' in window)) return null;
  if (!channel) channel = new BroadcastChannel('mtg-timer');
  return channel;
}

export function broadcast(action: BroadcastMessage['action'], payload?: any) {
  const ch = getChannel();
  if (!ch) return;
  const msg: BroadcastMessage = { senderId, action, payload };
  ch.postMessage(msg);
}

export function subscribe(handler: (msg: Omit<BroadcastMessage, 'senderId'>) => void) {
  const ch = getChannel();
  if (!ch) return () => {};
  const listener = (event: MessageEvent<BroadcastMessage>) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.senderId === senderId) return; // ignore own messages
    handler({ action: data.action, payload: data.payload });
  };
  ch.addEventListener('message', listener as EventListener);
  return () => ch.removeEventListener('message', listener as EventListener);
}
