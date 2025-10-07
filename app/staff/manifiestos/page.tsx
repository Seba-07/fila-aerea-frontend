'use client';

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
      const { data } = await manifestsAPI.getByTanda(manifest.numero_tanda);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="text-white text-xl font-medium">Cargando manifiestos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-white hover:text-primary transition">
            Volver
          </button>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold text-white">Manifiestos de Vuelo</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {manifests.length === 0 ? (
          <div className="text-center text-slate-300 py-12">
            <p className="text-xl">No hay manifiestos generados</p>
            <p className="text-sm text-slate-400 mt-2">Los manifiestos se generan automaticamente al iniciar los vuelos</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {manifests.map((manifest) => (
              <div
                key={manifest._id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 print:hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Tanda #{manifest.numero_tanda}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {new Date(manifest.fecha_vuelo).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewDetail(manifest)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                  >
                    Ver Detalle
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Hora Despegue</p>
                    <p className="text-lg text-white font-medium">
                      {new Date(manifest.hora_despegue).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Hora Aterrizaje</p>
                    <p className="text-lg text-white font-medium">
                      {manifest.hora_aterrizaje
                        ? new Date(manifest.hora_aterrizaje).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : 'Pendiente'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Pasajeros</p>
                    <p className="text-lg text-white font-medium">{manifest.pasajeros?.length || 0}</p>
                  </div>
                </div>

                {manifest.vuelos && manifest.vuelos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Aviones en esta tanda:</p>
                    <div className="flex flex-wrap gap-2">
                      {manifest.vuelos.map((vuelo: any, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-slate-700 text-white rounded text-sm">
                          {vuelo.matricula} ({vuelo.estado})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedManifest && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 print:static print:bg-white">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto print:max-h-full print:bg-white print:border-0">
              <div className="p-8 border-b border-slate-700 print:border-black">
                <div className="flex items-start justify-between mb-6 print:block">
                  <div>
                    <h2 className="text-3xl font-bold text-white print:text-black">
                      Manifiesto de Vuelo - Tanda #{selectedManifest.numero_tanda}
                    </h2>
                    <p className="text-slate-300 mt-2 print:text-black">
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
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 print:gap-4">
                  <div>
                    <p className="text-sm text-slate-400 print:text-gray-600">Hora de Despegue</p>
                    <p className="text-2xl text-white font-bold print:text-black">
                      {new Date(selectedManifest.hora_despegue).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 print:text-gray-600">Hora de Aterrizaje</p>
                    <p className="text-2xl text-white font-bold print:text-black">
                      {selectedManifest.hora_aterrizaje
                        ? new Date(selectedManifest.hora_aterrizaje).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 print:p-4">
                {selectedManifest.vuelos && selectedManifest.vuelos.length > 0 ? (
                  <div className="space-y-6 print:space-y-4">
                    {selectedManifest.vuelos.map((vuelo: any, idx: number) => (
                      <div key={idx} className="bg-slate-700/50 rounded-xl p-6 print:bg-gray-100 print:border print:border-gray-300">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white print:text-black">
                              {vuelo.matricula}
                            </h3>
                            <p className="text-sm text-slate-400 print:text-gray-600">{vuelo.modelo}</p>
                          </div>
                          <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm print:bg-gray-300 print:text-black">
                            {vuelo.pasajeros?.length || 0} pasajeros
                          </span>
                        </div>

                        {vuelo.pasajeros && vuelo.pasajeros.length > 0 ? (
                          <div className="grid md:grid-cols-2 gap-3 print:gap-2">
                            {vuelo.pasajeros.map((pasajero: any, pIdx: number) => (
                              <div
                                key={pIdx}
                                className="bg-slate-600/50 rounded p-3 print:bg-white print:border print:border-gray-300"
                              >
                                <p className="text-white font-medium print:text-black">{pasajero.nombre}</p>
                                <p className="text-xs text-slate-400 print:text-gray-600">RUT: {pasajero.rut}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-sm print:text-gray-600">Sin pasajeros</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center print:text-gray-600">No hay informacion de vuelos</p>
                )}
              </div>

              <div className="p-6 border-t border-slate-700 text-center print:border-black">
                <p className="text-sm text-slate-400 print:text-gray-600">
                  Generado el {new Date(selectedManifest.createdAt).toLocaleString('es-ES')}
                </p>
                {selectedManifest.createdBy && (
                  <p className="text-xs text-slate-500 mt-1 print:text-gray-500">
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
