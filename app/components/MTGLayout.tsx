'use client';

import MTGTimer from './MTGTimer';
import PromoSlider from './PromoSlider';

export default function MTGLayout() {
  return (
    <div className="min-h-screen relative">
      {/* Enlace al panel de control eliminado a petición del usuario */}

      {/* Layout para pantallas grandes - lado a lado */}
      <div className="hidden lg:flex h-screen">
        {/* Timer - 25% del ancho */}
        <div className="w-[61%] relative border-r border-gray-600">
          <MTGTimer />
        </div>
        
        {/* Slider - 75% del ancho */}
        <div className="w-[39%] relative">
          <PromoSlider />
        </div>
      </div>

      {/* Layout para pantallas medianas - timer arriba, slider abajo */}
      <div className="hidden md:block lg:hidden h-screen">
        <div className="h-[60%] relative border-b border-gray-600">
          <MTGTimer />
        </div>
        <div className="h-[40%] relative">
          <PromoSlider />
        </div>
      </div>

      {/* Layout para pantallas pequeñas - portrait (timer arriba / slider abajo) */}
      <div className="only-portrait flex md:hidden h-screen flex-col">
        <div className="h-[60%] relative border-b border-gray-600">
          <MTGTimer />
        </div>
        <div className="h-[40%] relative">
          <PromoSlider />
        </div>
      </div>

      {/* Layout para pantallas pequeñas - landscape (imitando desktop lado a lado) */}
      <div className="only-landscape flex md:hidden h-screen">
        <div className="w-[61%] relative border-r border-gray-600">
          <MTGTimer />
        </div>
        <div className="w-[39%] relative">
          <PromoSlider />
        </div>
      </div>
    </div>
  );
}