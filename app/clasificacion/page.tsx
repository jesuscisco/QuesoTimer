"use client";

import { useEffect, useState } from "react";
import { getCurrentStandings, type StandingsPayload } from "../utils/standings";

export default function ClasificacionPage() {
  const [data, setData] = useState<StandingsPayload | null>(null);

  useEffect(() => {
    try { setData(getCurrentStandings()); } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'standings.current.v1') {
        try { setData(getCurrentStandings()); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 print:bg-white print:text-black">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4 print:mb-2">
          <h1 className="text-2xl font-bold text-green-400 print:text-black">{data?.title || 'Clasificación'}</h1>
          <div className="text-xs text-gray-400 print:text-black">{data ? new Date(data.generatedAt).toLocaleString() : ''}</div>
        </div>
        {data && data.rows.length > 0 ? (
          <div className="overflow-auto bg-gray-800 border border-gray-700 rounded-lg p-3 print:bg-white print:border-0 print:p-0">
            <table className="min-w-full text-sm print:text-black">
              <thead>
                <tr className="text-left text-gray-300 print:text-black">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Jugador</th>
                  <th className="py-2 pr-3">Puntos</th>
                  <th className="py-2 pr-3">OMW%</th>
                  <th className="py-2 pr-3">Victorias</th>
                  <th className="py-2 pr-3">PRF%</th>
                  <th className="py-2 pr-3">Rondas</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r, i) => (
                  <tr key={r.name} className="border-t border-gray-700 print:border-black/10">
                    <td className="py-1.5 pr-3 text-gray-300 print:text-black">{i + 1}</td>
                    <td className="py-1.5 pr-3 text-gray-100 print:text-black" title={r.name}>{r.name}</td>
                    <td className="py-1.5 pr-3 text-green-300 font-semibold print:text-black">{r.points}</td>
                    <td className="py-1.5 pr-3 text-gray-200 print:text-black">{(r.omw * 100).toFixed(1)}%</td>
                    <td className="py-1.5 pr-3 text-gray-200 print:text-black">{r.wins}</td>
                    <td className="py-1.5 pr-3 text-gray-200 print:text-black">{(r.prf * 100).toFixed(1)}%</td>
                    <td className="py-1.5 pr-3 text-gray-400 print:text-black">{r.rounds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-gray-400 print:text-black">No hay clasificación disponible. Guarda resultados o presiona "Mostrar en pantalla" desde el editor.</div>
        )}
        <div className="mt-4 flex gap-2 print:hidden">
          <button
            onClick={() => { try { window.print(); } catch {} }}
            className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600 text-sm"
          >
            Imprimir
          </button>
          <a href="/control" className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600 text-sm">Volver al Panel</a>
        </div>
      </div>
    </div>
  );
}
