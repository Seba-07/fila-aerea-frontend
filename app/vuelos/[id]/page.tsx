'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { flightsAPI, seatsAPI } from '@/lib/api';
import { useFlightRealtime } from '@/lib/hooks/useSocket';

export default function VueloDetallePage() {
  const router = useRouter();
  const params = useParams();
  const flightId = params.id as string;

  const [flight, setFlight] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFlight = useCallback(async () => {
    try {
      const { data } = await flightsAPI.getFlightById(flightId);
      setFlight(data);
      setSeats(data.seats || []);
    } catch (error) {
      console.error('Error al cargar vuelo:', error);
    } finally {
      setLoading(false);
    }
  }, [flightId]);

  const handleRealtimeUpdate = useCallback(
    (data: any) => {
      if (data.flightId === flightId || data.flightId?._id === flightId) {
        fetchFlight();
      }
    },
    [flightId, fetchFlight]
  );

  useFlightRealtime(flightId, handleRealtimeUpdate);

  useEffect(() => {
    fetchFlight();
  }, [fetchFlight]);

  useEffect(() => {
    if (!selectedSeat) return;

    const seat = seats.find((s) => s.seatNumber === selectedSeat);
    if (!seat || seat.status !== 'hold' || !seat.hold_expires_at) return;

    const expiresAt = new Date(seat.hold_expires_at).getTime();
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setHoldTimer(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        setSelectedSeat(null);
        fetchFlight();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSeat, seats, fetchFlight]);

  const handleHold = async (seatNumber: string) => {
    setActionLoading(true);
    try {
      await seatsAPI.holdSeat(flightId, seatNumber);
      setSelectedSeat(seatNumber);
      await fetchFlight();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al reservar asiento');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSeat) return;
    setActionLoading(true);
    try {
      const { data } = await seatsAPI.confirmSeat(flightId, selectedSeat);
      alert('¡Asiento confirmado! Pase de embarque generado');
      router.push(`/mi-pase?id=${data.boardingPass.id}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al confirmar asiento');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Vuelo no encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/vuelos')} className="text-primary">
            ← Volver
          </button>
          <div>
            <h1 className="text-xl font-bold">{flight.aircraftId?.alias}</h1>
            <p className="text-sm text-gray-600">
              {new Date(flight.fechaHoraProg).toLocaleString('es-ES')}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Estado</p>
              <p className="font-medium capitalize">{flight.estado}</p>
            </div>
            <div>
              <p className="text-gray-500">Zona</p>
              <p className="font-medium">{flight.zona}</p>
            </div>
            {flight.puerta && (
              <div>
                <p className="text-gray-500">Puerta</p>
                <p className="font-medium">{flight.puerta}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Asientos</p>
              <p className="font-medium">{flight.aircraftId?.seats}</p>
            </div>
          </div>
        </div>

        {/* Mapa de asientos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Selecciona tu asiento</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {seats.map((seat) => {
              const isSelected = selectedSeat === seat.seatNumber;
              const isAvailable = seat.status === 'libre';

              return (
                <button
                  key={seat.seatNumber}
                  onClick={() => isAvailable && handleHold(seat.seatNumber)}
                  disabled={!isAvailable || actionLoading}
                  className={`aspect-square rounded-lg font-medium text-sm transition ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : seat.status === 'libre'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : seat.status === 'hold'
                      ? 'bg-yellow-100 text-yellow-800'
                      : seat.status === 'confirmado'
                      ? 'bg-gray-300 text-gray-600'
                      : 'bg-red-100 text-red-800'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {seat.seatNumber}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span>Libre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 rounded"></div>
              <span>En hold</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>Ocupado</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        {selectedSeat && holdTimer !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="font-bold text-lg mb-2">
              Asiento {selectedSeat} reservado
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Tienes{' '}
              <span className="font-bold text-2xl text-blue-600">
                {Math.floor(holdTimer / 60)}:{String(holdTimer % 60).padStart(2, '0')}
              </span>{' '}
              para confirmar
            </p>
            <button
              onClick={handleConfirm}
              disabled={actionLoading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {actionLoading ? 'Confirmando...' : 'Confirmar Asiento'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
