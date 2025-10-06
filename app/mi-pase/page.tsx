'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userAPI, flightsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function MiPasePage() {
  const router = useRouter();
  const { tickets } = useAuthStore();
  const [ticketsWithFlights, setTicketsWithFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlightsForTickets = async () => {
      try {
        // Filtrar solo tickets inscritos
        const inscritosTickets = tickets.filter(t => t.estado === 'inscrito' && t.flightId);

        // Cargar info de vuelos para cada ticket
        const ticketsConVuelo = await Promise.all(
          inscritosTickets.map(async (ticket) => {
            try {
              const { data: flight } = await flightsAPI.getFlightById(ticket.flightId);
              return { ...ticket, flight };
            } catch (error) {
              console.error('Error al cargar vuelo:', error);
              return { ...ticket, flight: null };
            }
          })
        );

        setTicketsWithFlights(ticketsConVuelo.filter(t => t.flight));
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlightsForTickets();
  }, [tickets]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (ticketsWithFlights.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-xl p-8 text-center">
          <p className="text-xl text-white mb-4">No tienes pases de embarque activos</p>
          <p className="text-sm text-slate-400 mb-6">Inscribe tus tickets en un vuelo para ver tus pases</p>
          <button
            onClick={() => router.push('/vuelos')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Ver Vuelos
          </button>
        </div>
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
          <h1 className="text-2xl font-bold text-white">
            Mis Pases de Embarque
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {ticketsWithFlights.map((ticket) => {
            const pasajero = ticket.pasajeros?.[0];
            const flight = ticket.flight;

            return (
              <div key={ticket.id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                {/* Header con info del pasajero */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {pasajero?.nombre} {pasajero?.apellido}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        Ticket: {ticket.codigo_ticket}
                      </p>
                      {pasajero?.esMenor && (
                        <span className="inline-block mt-2 text-xs bg-amber-500/20 text-amber-200 px-2 py-1 rounded">
                          Menor de edad
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                        flight.estado === 'abierto' ? 'bg-emerald-500/20 text-emerald-300' :
                        flight.estado === 'boarding' ? 'bg-blue-500/20 text-blue-300' :
                        flight.estado === 'volando' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-slate-500/20 text-slate-300'
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-current"></div>
                        <span className="text-sm font-medium capitalize">{flight.estado}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles del vuelo */}
                <div className="p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Avión</p>
                      <p className="text-lg font-bold text-white">{flight.aircraftId?.matricula}</p>
                      <p className="text-sm text-slate-400">{flight.aircraftId?.modelo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Tanda</p>
                      <p className="text-3xl font-bold text-blue-400">#{flight.numero_tanda}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Fecha y Hora</p>
                      <p className="text-lg font-medium text-white">
                        {new Date(flight.fecha_hora).toLocaleDateString('es-ES')}
                      </p>
                      <p className="text-sm text-slate-400">
                        {new Date(flight.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Asientos Ocupados</p>
                        <p className="text-lg font-medium text-white">
                          {flight.asientos_ocupados} / {flight.capacidad_total}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-2">Estado del Ticket</p>
                        <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium">
                          ✓ Inscrito
                        </span>
                      </div>
                    </div>
                  </div>

                  {flight.estado === 'boarding' && (
                    <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-blue-300 font-medium text-center">
                        🛫 ¡Abordaje en curso! Dirígete al área de embarque
                      </p>
                    </div>
                  )}

                  {flight.estado === 'volando' && (
                    <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <p className="text-purple-300 font-medium text-center">
                        ✈️ ¡Vuelo en progreso! Disfruta tu experiencia
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
