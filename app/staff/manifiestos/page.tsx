'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { manifestsAPI } from '@/lib/api';

export default function ManifiestosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [manifests, setManifests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedManifest, setSelectedManifest] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
      return;
    }

    fetchManifests();
  }, [user, router]);

  const fetchManifests = async () => {
    try {
      const { data } = await manifestsAPI.getAll();
      setManifests(data);
    } catch (error) {
      console.error('Error al cargar manifiestos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (manifest: any) => {
    try {
      setLoadingDetail(true);
      const { data } = await manifestsAPI.getByCircuito(manifest.numero_circuito);
      setSelectedManifest(data);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      alert('Error al cargar detalle del manifiesto');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">Cargando manifiestos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      <header className="theme-bg-card backdrop-blur-sm border-b theme-border print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="theme-text-primary hover:text-primary transition">
            Volver
          </button>
          <img
            src="/logo.png"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold theme-text-primary">Manifiestos de Vuelo</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {manifests.length === 0 ? (
          <div className="text-center theme-text-secondary py-12">
            <p className="text-xl">No hay manifiestos generados</p>
            <p className="text-sm theme-text-muted mt-2">Los manifiestos se generan automaticamente al iniciar los vuelos</p>
          </div>
        ) : (
          <div className="theme-bg-card backdrop-blur-sm theme-border rounded-xl overflow-hidden print:hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="theme-bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium theme-text-muted uppercase">Circuito</th>
                    <th className="px-4 py-3 text-left text-xs font-medium theme-text-muted uppercase">Avión</th>
                    <th className="px-4 py-3 text-left text-xs font-medium theme-text-muted uppercase">Fecha Vuelo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium theme-text-muted uppercase">Hora Despegue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium theme-text-muted uppercase">Hora Aterrizaje</th>
                    <th className="px-4 py-3 text-left text-xs font-medium theme-text-muted uppercase">Pasajeros</th>
                    <th className="px-4 py-3 text-left text-xs font-medium theme-text-muted uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {manifests.flatMap((manifest) =>
                    manifest.vuelos && manifest.vuelos.length > 0 ?
                      manifest.vuelos.map((vuelo: any, idx: number) => (
                        <tr key={`${manifest._id}-${idx}`} className="hover:theme-bg-secondary/30 transition">
                          <td className="px-4 py-3 theme-text-primary font-medium">#{manifest.numero_circuito}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="theme-text-primary font-medium">{vuelo.matricula}</p>
                              <p className="text-xs theme-text-muted">{vuelo.modelo}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm theme-text-primary">
                            {new Date(manifest.fecha_vuelo).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm theme-text-primary font-medium">
                            {(() => {
                              const date = new Date(manifest.hora_despegue);
                              const hours = String(date.getUTCHours()).padStart(2, '0');
                              const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                              return `${hours}:${minutes}`;
                            })()}
                          </td>
                          <td className="px-4 py-3 text-sm theme-text-primary">
                            {manifest.hora_aterrizaje ? (() => {
                              const date = new Date(manifest.hora_aterrizaje);
                              const hours = String(date.getUTCHours()).padStart(2, '0');
                              const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                              return `${hours}:${minutes}`;
                            })() : <span className="text-yellow-500">En vuelo</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm font-medium">
                              {vuelo.pasajeros?.length || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleViewDetail(manifest)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium transition"
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))
                    : (
                      <tr key={manifest._id}>
                        <td colSpan={7} className="px-4 py-3 text-center theme-text-muted text-sm">
                          No hay vuelos en este circuito
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedManifest && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 print:static print:bg-white">
            <div className="theme-bg-card rounded-2xl theme-border max-w-4xl w-full max-h-[90vh] overflow-y-auto print:max-h-full print:bg-white print:border-0">
              <div className="p-8 border-b theme-border print:border-black">
                <div className="flex items-start justify-between mb-6 print:block">
                  <div>
                    <h2 className="text-3xl font-bold theme-text-primary print:text-black">
                      Manifiesto de Vuelo - Circuito #{selectedManifest.numero_circuito}
                    </h2>
                    <p className="theme-text-secondary mt-2 print:text-black">
                      {new Date(selectedManifest.fecha_vuelo).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 print:hidden">
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Imprimir
                    </button>
                    <button
                      onClick={() => setSelectedManifest(null)}
                      className="px-4 py-2 theme-bg-secondary theme-text-primary rounded-lg hover:theme-input font-medium"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 print:gap-4">
                  <div>
                    <p className="text-sm theme-text-muted print:text-gray-600">Hora de Despegue</p>
                    <p className="text-2xl theme-text-primary font-bold print:text-black">
                      {(() => {
                        const date = new Date(selectedManifest.hora_despegue);
                        const hours = String(date.getUTCHours()).padStart(2, '0');
                        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                        return `${hours}:${minutes}`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm theme-text-muted print:text-gray-600">Hora de Aterrizaje</p>
                    <p className="text-2xl theme-text-primary font-bold print:text-black">
                      {selectedManifest.hora_aterrizaje ? (() => {
                        const date = new Date(selectedManifest.hora_aterrizaje);
                        const hours = String(date.getUTCHours()).padStart(2, '0');
                        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                        return `${hours}:${minutes}`;
                      })() : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 print:p-4">
                {selectedManifest.vuelos && selectedManifest.vuelos.length > 0 ? (
                  <div className="space-y-6 print:space-y-4">
                    {selectedManifest.vuelos.map((vuelo: any, idx: number) => (
                      <div key={idx} className="theme-bg-secondary/50 rounded-xl p-6 print:bg-gray-100 print:border print:border-gray-300">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold theme-text-primary print:text-black">
                                {vuelo.matricula}
                              </h3>
                              <p className="text-sm theme-text-muted print:text-gray-600">{vuelo.modelo}</p>
                            </div>
                            <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm print:bg-gray-300 print:text-black">
                              {vuelo.pasajeros?.length || 0} pasajeros
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2 p-2 theme-bg-secondary/30 rounded print:bg-gray-50">
                            <div>
                              <p className="text-xs theme-text-muted print:text-gray-600">Piloto al mando:</p>
                              <p className="text-sm theme-text-primary print:text-black font-medium">{vuelo.piloto_nombre}</p>
                            </div>
                            <div>
                              <p className="text-xs theme-text-muted print:text-gray-600">Licencia:</p>
                              <p className="text-sm theme-text-primary print:text-black font-medium">{vuelo.piloto_licencia}</p>
                            </div>
                            <div>
                              <p className="text-xs theme-text-muted print:text-gray-600">Aeródromo de salida:</p>
                              <p className="text-sm theme-text-primary print:text-black font-medium">{vuelo.aerodromo_salida}</p>
                            </div>
                            <div>
                              <p className="text-xs theme-text-muted print:text-gray-600">Aeródromo de llegada:</p>
                              <p className="text-sm theme-text-primary print:text-black font-medium">{vuelo.aerodromo_llegada}</p>
                            </div>
                          </div>
                        </div>

                        {vuelo.pasajeros && vuelo.pasajeros.length > 0 ? (
                          <div className="grid md:grid-cols-2 gap-3 print:gap-2">
                            {vuelo.pasajeros.map((pasajero: any, pIdx: number) => (
                              <div
                                key={pIdx}
                                className="theme-bg-secondary/50 rounded p-3 print:bg-white print:border print:border-gray-300"
                              >
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="theme-text-primary font-medium print:text-black">{pasajero.nombre}</p>
                                  {pasajero.esMenor && (
                                    <span className="px-2 py-0.5 bg-yellow-500 text-yellow-900 rounded text-xs font-bold print:bg-yellow-200">
                                      MENOR
                                    </span>
                                  )}
                                  {pasajero.estado === 'embarcado' && (
                                    <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-bold print:bg-green-200 print:text-black">
                                      ✓ EMBARCADO
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs theme-text-muted print:text-gray-600">RUT: {pasajero.rut}</p>
                                {pasajero.esMenor && (
                                  <div className="mt-2">
                                    {pasajero.autorizacion_url ? (
                                      <a
                                        href={pasajero.autorizacion_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:text-blue-300 underline print:text-blue-600"
                                      >
                                        📄 Ver autorización
                                      </a>
                                    ) : (
                                      <p className="text-xs text-red-400 print:text-red-600">
                                        ⚠️ Sin autorización subida
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="theme-text-muted text-sm print:text-gray-600">Sin pasajeros</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="theme-text-muted text-center print:text-gray-600">No hay informacion de vuelos</p>
                )}
              </div>

              <div className="p-6 border-t theme-border text-center print:border-black">
                <p className="text-sm theme-text-muted print:text-gray-600">
                  Generado el {new Date(selectedManifest.createdAt).toLocaleString('es-ES')}
                </p>
                {selectedManifest.createdBy && (
                  <p className="text-xs theme-text-muted mt-1 print:text-gray-500">
                    Por: {selectedManifest.createdBy.nombre} {selectedManifest.createdBy.apellido}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {loadingDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
