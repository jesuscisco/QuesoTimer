// Utilities to manage custom slider images stored locally (per device/browser)
// Uses localStorage with data URLs (resized) for simplicity and broad support.

export type CustomImage = {
  id: string;
  name: string;
  // Prefer cache-backed path handled by Service Worker, e.g. /custom-slider/<id>.jpg
  cachePath?: string;
  // Fallback for environments without Cache Storage
  dataUrl?: string; // image/png or image/jpeg data URL
  addedAt: number;
};

export type ModalImage = {
  name?: string;
  cachePath?: string;
  dataUrl?: string;
  addedAt: number;
};

const STORAGE_KEY = 'customSliderImages.v1';
// Separate storage for anuncios (ads) slider images
const ADS_STORAGE_KEY = 'customSliderImagesAds.v1';
const MODAL_IMG_KEY = 'customSliderModalImage.v1';

export function getCustomImages(): CustomImage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(Boolean);
  } catch {
    return [];
  }
}

// Ads variants
export function getCustomImagesAds(): CustomImage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ADS_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(Boolean);
  } catch {
    return [];
  }
}

export function setCustomImages(images: CustomImage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch {}
}

export function setCustomImagesAds(images: CustomImage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(images));
  } catch {}
}

export function addCustomImages(newImages: CustomImage[]) {
  const current = getCustomImages();
  setCustomImages([...current, ...newImages]);
}

export function addCustomImagesAds(newImages: CustomImage[]) {
  const current = getCustomImagesAds();
  setCustomImagesAds([...current, ...newImages]);
}

export function removeCustomImage(id: string) {
  const current = getCustomImages();
  setCustomImages(current.filter((img) => img.id !== id));
}

export function removeCustomImageAds(id: string) {
  const current = getCustomImagesAds();
  setCustomImagesAds(current.filter((img) => img.id !== id));
}

export function clearCustomImages() {
  setCustomImages([]);
}

export function clearCustomImagesAds() {
  setCustomImagesAds([]);
}

// Resize an image file to a max dimension and return a JPEG data URL
export async function fileToDataUrlResized(file: File, opts?: { maxW?: number; maxH?: number; quality?: number; type?: string; }): Promise<string> {
  const { maxW = 1600, maxH = 1600, quality = 0.85, type = 'image/jpeg' } = opts || {};
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(maxW / bitmap.width, maxH / bitmap.height, 1);
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<string>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(canvas.toDataURL(type, quality));
        return;
      }
      const fr = new FileReader();
      fr.onloadend = () => resolve(String(fr.result));
      fr.readAsDataURL(blob);
    }, type, quality);
  });
}

export function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Produce a resized Blob instead of data URL (more efficient for Cache Storage)
export async function fileToResizedBlob(file: File, opts?: { maxW?: number; maxH?: number; quality?: number; type?: string; }): Promise<Blob> {
  const { maxW = 1600, maxH = 1600, quality = 0.85, type = 'image/jpeg' } = opts || {};
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(maxW / bitmap.width, maxH / bitmap.height, 1);
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        try {
          const fallback = dataURItoBlob(canvas.toDataURL(type, quality));
          resolve(fallback);
        } catch (e) {
          reject(new Error('Failed to create blob'));
        }
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

function dataURItoBlob(dataURI: string): Blob {
  const byteString = atob(dataURI.split(',')[1] || '');
  const mimeString = dataURI.split(',')[0]?.split(':')[1]?.split(';')[0] || 'image/jpeg';
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mimeString });
}

const CUSTOM_CACHE = 'mtg-custom-slider-v1';
const ADS_CUSTOM_CACHE = 'mtg-custom-ads-v1';

export async function cacheCustomImage(id: string, blob: Blob, contentType = 'image/jpeg'): Promise<string> {
  if (typeof caches === 'undefined') throw new Error('Cache Storage not available');
  const cachePath = `/custom-slider/${id}.jpg`;
  const cache = await caches.open(CUSTOM_CACHE);
  const res = new Response(blob, { headers: { 'Content-Type': contentType } });
  await cache.put(new Request(cachePath, { method: 'GET' }), res);
  return cachePath;
}

export async function cacheCustomAdsImage(id: string, blob: Blob, contentType = 'image/jpeg'): Promise<string> {
  if (typeof caches === 'undefined') throw new Error('Cache Storage not available');
  const cachePath = `/custom-ads/${id}.jpg`;
  const cache = await caches.open(ADS_CUSTOM_CACHE);
  const res = new Response(blob, { headers: { 'Content-Type': contentType } });
  await cache.put(new Request(cachePath, { method: 'GET' }), res);
  return cachePath;
}

export async function cacheModalImage(blob: Blob, contentType = 'image/jpeg'): Promise<string> {
  if (typeof caches === 'undefined') throw new Error('Cache Storage not available');
  const cachePath = `/custom-slider/__modal.jpg`;
  const cache = await caches.open(CUSTOM_CACHE);
  const res = new Response(blob, { headers: { 'Content-Type': contentType } });
  await cache.put(new Request(cachePath, { method: 'GET' }), res);
  return cachePath;
}

export async function deleteCachedCustomImage(cachePath: string): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  const cache = await caches.open(CUSTOM_CACHE);
  return cache.delete(new Request(cachePath));
}

export async function deleteCachedCustomAdsImage(cachePath: string): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  const cache = await caches.open(ADS_CUSTOM_CACHE);
  return cache.delete(new Request(cachePath));
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onloadend = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error('Failed to read blob'));
    fr.readAsDataURL(blob);
  });
}

// Ensure dataUrl is present for any stored custom image by reading from Cache Storage
export async function ensureCustomImagesDataUrls(): Promise<CustomImage[]> {
  const imgs = getCustomImages();
  if (typeof caches === 'undefined') return imgs;
  const needs = imgs.filter((i) => !i.dataUrl && i.cachePath);
  if (needs.length === 0) return imgs;
  try {
    const cache = await caches.open(CUSTOM_CACHE);
    let changed = false;
    for (const img of needs) {
      try {
        const req = new Request(img.cachePath!);
        const res = await cache.match(req);
        if (res) {
          const blob = await res.blob();
          img.dataUrl = await blobToDataUrl(blob);
          changed = true;
        }
      } catch {}
    }
    if (changed) setCustomImages(imgs);
  } catch {}
  return imgs;
}

export async function ensureCustomImagesAdsDataUrls(): Promise<CustomImage[]> {
  const imgs = getCustomImagesAds();
  if (typeof caches === 'undefined') return imgs;
  const needs = imgs.filter((i) => !i.dataUrl && i.cachePath);
  if (needs.length === 0) return imgs;
  try {
    const cache = await caches.open(ADS_CUSTOM_CACHE);
    let changed = false;
    for (const img of needs) {
      try {
        const req = new Request(img.cachePath!);
        const res = await cache.match(req);
        if (res) {
          const blob = await res.blob();
          img.dataUrl = await blobToDataUrl(blob);
          changed = true;
        }
      } catch {}
    }
    if (changed) setCustomImagesAds(imgs);
  } catch {}
  return imgs;
}

export function getModalImage(): ModalImage | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MODAL_IMG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function setModalImage(img: ModalImage | null) {
  if (typeof window === 'undefined') return;
  try {
    if (img) localStorage.setItem(MODAL_IMG_KEY, JSON.stringify(img));
    else localStorage.removeItem(MODAL_IMG_KEY);
  } catch {}
}

export async function ensureModalImageDataUrl(): Promise<ModalImage | null> {
  const img = getModalImage();
  if (!img || img.dataUrl || !img.cachePath) return img;
  if (typeof caches === 'undefined') return img;
  try {
    const cache = await caches.open(CUSTOM_CACHE);
    const res = await cache.match(new Request(img.cachePath));
    if (res) {
      const blob = await res.blob();
      img.dataUrl = await blobToDataUrl(blob);
      setModalImage(img);
    }
  } catch {}
  return img;
}
