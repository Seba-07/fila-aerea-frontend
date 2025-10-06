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

    const fetchFlights = async () => {
      try {
        const { data } = await flightsAPI.getFlights();
        setFlights(data);
      } catch (error) {
        console.error('Error al cargar vuelos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [isAuthenticated, router]);

  const handleChangeState = async (flightId: string, newState: string) => {
    try {
      await flightsAPI.updateFlight(flightId, { estado: newState });
      const { data } = await flightsAPI.getFlights();
      setFlights(data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar vuelo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-primary hover:underline">
            ← Volver
          </button>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold text-gray-800">Tandas de Vuelo</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {flights.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <p className="text-xl">No hay tandas disponibles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flights.map((flight) => {
              const asientosOcupados = flight.asientos_ocupados || 0;
              const capacidadTotal = flight.capacidad_total || 0;
              const asientosDisponibles = capacidadTotal - asientosOcupados;
              const isExpanded = expandedFlight === flight._id;

              return (
                <div
                  key={flight._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition"
                >
                  <div className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* Info principal */}
                      <div className="flex items-center gap-6">
                        <div>
                          <h3 className="font-bold text-xl">Tanda #{flight.numero_tanda}</h3>
                          <p className="text-sm text-gray-600">{flight.aircraftId?.matricula} - {flight.aircraftId?.modelo}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(flight.fecha_hora).toLocaleString('es-ES')}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{asientosDisponibles}</p>
                          <p className="text-xs text-gray-500">asientos libres</p>
                        </div>
                      </div>

                      {/* Estado y acciones */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            flight.estado === 'abierto'
                              ? 'bg-green-100 text-green-800'
                              : flight.estado === 'programado'
                              ? 'bg-blue-100 text-blue-800'
                              : flight.estado === 'boarding'
                              ? 'bg-yellow-100 text-yellow-800'
                              : flight.estado === 'en_vuelo'
                              ? 'bg-purple-100 text-purple-800'
                              : flight.estado === 'finalizado'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {flight.estado.toUpperCase().replace('_', ' ')}
                        </span>

                        <button
                          onClick={() => setExpandedFlight(isExpanded ? null : flight._id)}
                          className="text-primary hover:underline text-sm"
                        >
                          {isExpanded ? 'Ocultar' : 'Ver detalles'}
                        </button>

                        {user?.rol === 'passenger' && flight.estado === 'abierto' && asientosDisponibles > 0 && (
                          <button
                            onClick={() => router.push(`/vuelos/${flight._id}`)}
                            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Inscribirse
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Controles Staff */}
                    {user?.rol === 'staff' && (
                      <div className="mt-4 pt-4 border-t flex gap-2 flex-wrap">
                        {flight.estado === 'programado' && (
                          <button
                            onClick={() => handleChangeState(flight._id, 'abierto')}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Abrir
                          </button>
                        )}
                        {flight.estado === 'abierto' && (
                          <button
                            onClick={() => handleChangeState(flight._id, 'boarding')}
                            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                          >
                            Boarding
                          </button>
                        )}
                        {flight.estado === 'boarding' && (
                          <button
                            onClick={() => handleChangeState(flight._id, 'en_vuelo')}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                          >
                            En Vuelo
                          </button>
                        )}
                        {flight.estado === 'en_vuelo' && (
                          <button
                            onClick={() => handleChangeState(flight._id, 'finalizado')}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                          >
                            Finalizado
                          </button>
                        )}
                      </div>
                    )}

                    {/* Panel expandido */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold mb-2">Pasajeros Registrados:</h4>
                        {/* TODO: Mostrar lista de pasajeros del manifest */}
                        <p className="text-sm text-gray-500">
                          {asientosOcupados > 0
                            ? `${asientosOcupados} pasajero(s) inscrito(s)`
                            : 'No hay pasajeros inscritos'}
                        </p>
                      </div>
                    )}
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
