'use client';

import PromoSliderAds from '../components/PromoSliderAds';
import GlobalEffectsAds from '../components/GlobalEffectsAds';

export default function AnunciosPage() {
  return (
    <div className="min-h-screen bg-black" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <GlobalEffectsAds />
      <PromoSliderAds />
    </div>
  );
}
