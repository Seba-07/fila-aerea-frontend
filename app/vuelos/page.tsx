'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { flightsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function VuelosPage() {
  const router = useRouter();
  const { ticket, isAuthenticated } = useAuthStore();
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          <button onClick={() => router.push('/')} className="text-primary">
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Vuelos Disponibles</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {flights.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <p className="text-xl">No hay vuelos disponibles</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flights.map((flight) => {
              const asientosDisponibles = flight.asientos_disponibles || 0;
              const puedeInscribirse = ticket && ticket.cantidad_pasajeros <= asientosDisponibles;

              return (
                <div
                  key={flight._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Tanda #{flight.numero_tanda}</h3>
                      <p className="text-sm text-gray-600">{flight.aircraftId?.matricula}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(flight.fecha_hora).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        flight.estado === 'abierto'
                          ? 'bg-green-100 text-green-800'
                          : flight.estado === 'programado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {flight.estado}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <p>
                      <span className="font-medium">Avión:</span> {flight.aircraftId?.modelo}
                    </p>
                    <p>
                      <span className="font-medium">Asientos disponibles:</span> {asientosDisponibles}/{flight.capacidad_total}
                    </p>
                  </div>

                  {!puedeInscribirse && ticket && (
                    <p className="text-sm text-yellow-600 mb-3">
                      No hay espacio suficiente para tu grupo ({ticket.cantidad_pasajeros} pasajeros)
                    </p>
                  )}

                  <button
                    onClick={() => router.push(`/vuelos/${flight._id}`)}
                    disabled={!puedeInscribirse}
                    className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Inscribirse
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
