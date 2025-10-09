'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import ThemeToggle from '@/components/ThemeToggle';

interface Flight {
  _id: string;
  aircraftId: {
    _id: string;
    matricula: string;
    modelo: string;
  };
  numero_circuito: number;
  fecha_hora: string;
  hora_prevista_salida?: string;
  capacidad_total: number;
  asientos_ocupados: number;
  estado: string;
}

export default function SeleccionarVueloPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);

  // Obtener datos de la compra desde la URL
  const cantidadPasajeros = parseInt(searchParams.get('pasajeros') || '1');

  useEffect(() => {
    fetchAvailableFlights();
  }, []);

  const fetchAvailableFlights = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/flights/available`
      );
      setFlights(response.data);
    } catch (error) {
      console.error('Error al cargar vuelos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFlight = async (flightId: string) => {
    if (reserving) return;

    try {
      setReserving(true);
      setSelectedFlight(flightId);

      // Crear reserva temporal de 5 minutos
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/flights/reserve`,
        {
          flightId,
          cantidadPasajeros,
        }
      );

      // Guardar ID de reserva y redirigir a comprar
      localStorage.setItem('reservationId', response.data.reservationId);
      localStorage.setItem('selectedFlightId', flightId);

      router.push('/comprar');
    } catch (error: any) {
      console.error('Error al reservar:', error);
      alert(
        error.response?.data?.error ||
          'Error al reservar cupos. Por favor intenta de nuevo.'
      );
      setSelectedFlight(null);
    } finally {
      setReserving(false);
    }
  };

  const groupByCircuito = () => {
    const grouped: { [key: number]: Flight[] } = {};
    flights.forEach((flight) => {
      if (!grouped[flight.numero_circuito]) {
        grouped[flight.numero_circuito] = [];
      }
      grouped[flight.numero_circuito].push(flight);
    });
    return grouped;
  };

  const circuitos = groupByCircuito();
  const circuitosOrdenados = Object.keys(circuitos)
    .map(Number)
    .sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">
            Cargando vuelos disponibles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary p-4 relative">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="theme-text-primary hover:opacity-70 transition"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold theme-text-primary">
            Selecciona tu Circuito de Vuelo
          </h1>
        </div>

        <div className="theme-bg-card rounded-2xl p-6 mb-6 theme-shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="theme-text-muted text-sm">Pasajeros a inscribir</p>
              <p className="text-2xl font-bold theme-text-primary">
                {cantidadPasajeros} {cantidadPasajeros === 1 ? 'pasajero' : 'pasajeros'}
              </p>
            </div>
            <div className="text-right">
              <p className="theme-text-muted text-sm">Tiempo de reserva</p>
              <p className="text-lg font-bold text-blue-600">5 minutos</p>
            </div>
          </div>
          <p className="theme-text-muted text-sm mt-4">
            Al seleccionar un vuelo, los cupos quedarán reservados por 5 minutos
            mientras completas tu compra.
          </p>
        </div>

        {flights.length === 0 ? (
          <div className="theme-bg-card rounded-2xl p-12 text-center theme-shadow-md">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-2xl font-bold theme-text-primary mb-2">
              No hay vuelos disponibles
            </h2>
            <p className="theme-text-muted">
              Por favor intenta más tarde o contacta al staff.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {circuitosOrdenados.map((circuitoNum) => {
              const vuelosCircuito = circuitos[circuitoNum];
              const primerVuelo = vuelosCircuito[0];
              const fechaVuelo = new Date(primerVuelo.fecha_hora);

              return (
                <div
                  key={circuitoNum}
                  className="theme-bg-card rounded-2xl p-6 theme-shadow-md"
                >
                  <div className="mb-4 pb-4 border-b theme-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold theme-text-primary">
                          Circuito #{circuitoNum}
                        </h2>
                        <p className="theme-text-muted text-sm mt-1">
                          {fechaVuelo.toLocaleDateString('es-CL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {primerVuelo.hora_prevista_salida && (
                        <div className="text-right">
                          <p className="theme-text-muted text-sm">Hora prevista</p>
                          <p className="text-2xl font-bold theme-text-primary">
                            {new Date(
                              primerVuelo.hora_prevista_salida
                            ).toLocaleTimeString('es-CL', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vuelosCircuito.map((flight) => {
                      const cuposDisponibles =
                        flight.capacidad_total - flight.asientos_ocupados;
                      const tieneCupos = cuposDisponibles >= cantidadPasajeros;
                      const isSelected = selectedFlight === flight._id;

                      return (
                        <button
                          key={flight._id}
                          onClick={() => handleSelectFlight(flight._id)}
                          disabled={!tieneCupos || reserving}
                          className={`
                            relative p-6 rounded-xl border-2 transition-all text-left
                            ${
                              tieneCupos
                                ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1'
                                : 'opacity-50 cursor-not-allowed'
                            }
                            ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'theme-border hover:border-blue-400'
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-3xl">✈️</div>
                            <div>
                              <p className="font-bold theme-text-primary text-lg">
                                {flight.aircraftId.matricula}
                              </p>
                              <p className="theme-text-muted text-sm">
                                {flight.aircraftId.modelo}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="theme-text-muted text-sm">
                                Capacidad
                              </span>
                              <span className="theme-text-primary font-semibold">
                                {flight.capacidad_total} asientos
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="theme-text-muted text-sm">
                                Disponibles
                              </span>
                              <span
                                className={`font-bold ${
                                  tieneCupos
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {cuposDisponibles}
                              </span>
                            </div>
                          </div>

                          {!tieneCupos && (
                            <div className="mt-3 pt-3 border-t theme-border">
                              <p className="text-xs text-red-600 font-medium">
                                No hay cupos suficientes
                              </p>
                            </div>
                          )}

                          {tieneCupos && !isSelected && (
                            <div className="mt-4">
                              <div className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold text-center">
                                Seleccionar
                              </div>
                            </div>
                          )}

                          {isSelected && (
                            <div className="mt-4">
                              <div className="w-full py-2 bg-blue-500 text-white rounded-lg font-semibold text-center">
                                Reservando...
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
