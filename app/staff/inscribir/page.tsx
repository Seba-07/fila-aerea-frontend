'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { staffAPI, flightsAPI, api } from '@/lib/api';

export default function InscribirPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [passengersWithoutFlight, setPassengersWithoutFlight] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
      return;
    }

    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      const [passengersRes, flightsRes] = await Promise.all([
        staffAPI.getPassengersWithoutFlight(),
        flightsAPI.getFlights('programado')
      ]);

      setPassengersWithoutFlight(passengersRes.data);
      // Ordenar vuelos por número de tanda
      const sortedFlights = flightsRes.data.sort((a: any, b: any) => a.numero_tanda - b.numero_tanda);
      setFlights(sortedFlights);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInscribirPasajero = async (ticketId: string, flightId: string) => {
    try {
      await api.patch(`/tickets/${ticketId}`, { flightId });
      alert('Pasajero inscrito exitosamente');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al inscribir pasajero');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
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
          <h1 className="text-2xl font-bold text-white">Inscribir Pasajeros</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {passengersWithoutFlight.length === 0 ? (
          <div className="bg-green-900/20 backdrop-blur-sm rounded-xl border border-green-700 p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-300 mb-2">
              Todos los pasajeros están inscritos
            </h2>
            <p className="text-green-200">
              No hay pasajeros pendientes de inscripción en vuelos
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-orange-900/20 backdrop-blur-sm rounded-xl border border-orange-700 p-6">
              <h2 className="text-2xl font-bold text-orange-300 mb-2">
                ⚠️ Pasajeros Sin Inscribir ({passengersWithoutFlight.length})
              </h2>
              <p className="text-sm text-orange-200">
                Los siguientes pasajeros tienen nombres asignados pero no están inscritos en ningún vuelo
              </p>
            </div>

            <div className="space-y-4">
              {passengersWithoutFlight.map((passenger: any) => (
                <div
                  key={passenger.userId}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6"
                >
                  <div className="mb-4 pb-4 border-b border-slate-700">
                    <h3 className="font-bold text-xl text-white">{passenger.userName}</h3>
                    <p className="text-sm text-slate-400">{passenger.userEmail}</p>
                  </div>
                  <div className="space-y-3">
                    {passenger.tickets.map((ticket: any) => (
                      <div
                        key={ticket.ticketId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-700/50 rounded-lg p-4"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white mb-1">
                            Pasajero: <span className="text-primary">{ticket.pasajeros[0]?.nombre}</span>
                          </p>
                          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">
                            {ticket.estado.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 mb-1">
                            Seleccionar Vuelo:
                          </label>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleInscribirPasajero(ticket.ticketId, e.target.value);
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                            defaultValue=""
                          >
                            <option value="">-- Seleccionar --</option>
                            {flights.map((flight) => {
                              const asientosDisponibles = flight.capacidad_total - flight.asientos_ocupados;
                              return (
                                <option
                                  key={flight._id}
                                  value={flight._id}
                                  disabled={asientosDisponibles <= 0}
                                >
                                  Tanda #{flight.numero_tanda} | {flight.aircraftId?.matricula} ({flight.aircraftId?.modelo}) |
                                  Asientos: {asientosDisponibles}/{flight.capacidad_total}
                                  {asientosDisponibles <= 0 ? ' (LLENO)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
