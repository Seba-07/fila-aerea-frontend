'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { flightsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function VuelosPage() {
  const router = useRouter();
  const { user, tickets, isAuthenticated } = useAuthStore();
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [isAuthenticated, router]);

  const fetchData = async () => {
    try {
      const { data } = await flightsAPI.getFlights();
      setFlights(data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeState = async (flightId: string, newState: string) => {
    try {
      await flightsAPI.updateFlight(flightId, { estado: newState });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar vuelo');
    }
  };

  // Agrupar vuelos por número de tanda
  const flightsByTanda = flights.reduce((acc, flight) => {
    const tandaNum = flight.numero_tanda;
    if (!acc[tandaNum]) {
      acc[tandaNum] = [];
    }
    acc[tandaNum].push(flight);
    return acc;
  }, {} as Record<number, any[]>);

  const tandasOrdenadas = Object.keys(flightsByTanda)
    .map(Number)
    .sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-white hover:text-primary transition">
            ← Volver
          </button>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold text-white">Tandas de Vuelo</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {flights.length === 0 ? (
          <div className="text-center text-slate-300 py-12">
            <p className="text-xl">No hay tandas disponibles</p>
          </div>
        ) : (
          <div className="space-y-8">
            {tandasOrdenadas.map((tandaNum) => {
              const vuelosTanda = flightsByTanda[tandaNum];

              return (
                <div key={tandaNum} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
                  {/* Header de la Tanda */}
                  <div className="mb-6 pb-4 border-b border-slate-700">
                    <h2 className="text-3xl font-bold text-white">Tanda #{tandaNum}</h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {new Date(vuelosTanda[0].fecha_hora).toLocaleString('es-ES')}
                    </p>
                  </div>

                  {/* Fichas de Aviones */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vuelosTanda.map((flight: any) => {
                      const asientosOcupados = flight.asientos_ocupados || 0;
                      const capacidadTotal = flight.capacidad_total || 0;
                      const asientosDisponibles = capacidadTotal - asientosOcupados;
                      const isExpanded = expandedFlight === flight._id;

                      return (
                        <div
                          key={flight._id}
                          className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border border-slate-600 p-5 hover:shadow-xl hover:scale-105 transition-all"
                        >
                          {/* Info del Avión */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-lg text-white">{flight.aircraftId?.matricula}</h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  flight.estado === 'abierto'
                                    ? 'bg-green-400 text-green-900'
                                    : flight.estado === 'programado'
                                    ? 'bg-blue-400 text-blue-900'
                                    : flight.estado === 'boarding'
                                    ? 'bg-yellow-400 text-yellow-900'
                                    : flight.estado === 'en_vuelo'
                                    ? 'bg-purple-400 text-purple-900'
                                    : 'bg-gray-400 text-gray-900'
                                }`}
                              >
                                {flight.estado.toUpperCase().replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400">{flight.aircraftId?.modelo}</p>
                          </div>

                          {/* Asientos */}
                          <div className="flex items-center justify-center my-4 p-4 bg-slate-900/50 rounded-lg">
                            <div className="text-center">
                              <p className="text-3xl font-black text-primary">{asientosDisponibles}</p>
                              <p className="text-xs text-slate-400">asientos libres</p>
                            </div>
                          </div>

                          {/* Acciones Pasajero */}
                          {user?.rol === 'passenger' && flight.estado === 'abierto' && asientosDisponibles > 0 && (
                            <button
                              onClick={() => router.push(`/vuelos/${flight._id}`)}
                              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                            >
                              Inscribirse
                            </button>
                          )}

                          {/* Controles Staff */}
                          {user?.rol === 'staff' && (
                            <div className="space-y-2">
                              <button
                                onClick={() => setExpandedFlight(isExpanded ? null : flight._id)}
                                className="w-full text-sm text-slate-300 hover:text-white transition"
                              >
                                {isExpanded ? '▲ Ocultar' : '▼ Ver pasajeros'}
                              </button>

                              <div className="flex gap-2 flex-wrap">
                                {flight.estado === 'programado' && (
                                  <button
                                    onClick={() => handleChangeState(flight._id, 'abierto')}
                                    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                                  >
                                    Abrir
                                  </button>
                                )}
                                {flight.estado === 'abierto' && (
                                  <button
                                    onClick={() => handleChangeState(flight._id, 'boarding')}
                                    className="flex-1 px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs font-medium"
                                  >
                                    Boarding
                                  </button>
                                )}
                                {flight.estado === 'boarding' && (
                                  <button
                                    onClick={() => handleChangeState(flight._id, 'en_vuelo')}
                                    className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium"
                                  >
                                    En Vuelo
                                  </button>
                                )}
                                {flight.estado === 'en_vuelo' && (
                                  <button
                                    onClick={() => handleChangeState(flight._id, 'finalizado')}
                                    className="flex-1 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium"
                                  >
                                    Finalizado
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Panel expandido */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-600">
                              <p className="text-xs font-semibold text-slate-300 mb-2">
                                Pasajeros: {flight.pasajeros_inscritos?.length || 0}
                              </p>
                              {flight.pasajeros_inscritos && flight.pasajeros_inscritos.length > 0 ? (
                                <div className="space-y-2">
                                  {flight.pasajeros_inscritos.map((inscrito: any, idx: number) => (
                                    <div key={idx} className="bg-slate-600/50 rounded p-2">
                                      <p className="text-xs font-medium text-white">
                                        {inscrito.pasajeros && inscrito.pasajeros[0]?.nombre}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {inscrito.usuario?.nombre} ({inscrito.usuario?.email})
                                      </p>
                                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                                        {inscrito.estado}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400">Sin pasajeros inscritos</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
