'use client';

import MTGTimer from './MTGTimer';
import PromoSlider from './PromoSlider';

export default function MTGLayout() {
  return (
    <div className="min-h-screen relative">
      {/* Enlace al panel de control eliminado a petición del usuario */}

      {/* Layout universal: siempre 50/50 lado a lado (timer izquierda / slider derecha) */}
      <div className="flex h-screen">
        <div className="w-1/2 relative border-r border-gray-600">
          <MTGTimer />
        </div>
        <div className="w-1/2 relative">
          <PromoSlider />
        </div>
      </div>
    </div>
  );
}