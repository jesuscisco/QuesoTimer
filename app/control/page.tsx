'use client';

import ControlPanelWrapper from '../components/ControlPanelWrapper';

export default function ControlPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Panel de Control MTG
          </h1>
          <p className="text-blue-200">
            Controla el timer y el slider desde aquí
          </p>
        </div>
        
        <ControlPanelWrapper />
      </div>
    </div>
  );
}