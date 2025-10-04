'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { flightsAPI, boardingAPI } from '@/lib/api';

export default function StaffPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [flights, setFlights] = useState<any[]>([]);
  const [scanMode, setScanMode] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || (user?.rol !== 'staff' && user?.rol !== 'admin')) {
      router.push('/');
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
  }, [isAuthenticated, user, router]);

  const handleUpdateFlight = async (id: string, updates: any) => {
    try {
      await flightsAPI.updateFlight(id, updates);
      alert('Vuelo actualizado');
      const { data } = await flightsAPI.getFlights();
      setFlights(data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar vuelo');
    }
  };

  const handleScanQR = async () => {
    try {
      const { data } = await boardingAPI.scanQR(qrInput);
      alert(`✓ Embarque exitoso\nAsiento: ${data.boardingPass.seatNumber}`);
      setQrInput('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al escanear QR');
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
      <header className="bg-purple-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="text-white">
              ← Inicio
            </button>
            <h1 className="text-2xl font-bold">Panel Staff</h1>
          </div>
          <button
            onClick={() => setScanMode(!scanMode)}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
          >
            {scanMode ? 'Ver Vuelos' : 'Escanear QR'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {scanMode ? (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Escanear QR</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Token QR</label>
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Pega el token del QR"
                />
              </div>
              <button
                onClick={handleScanQR}
                disabled={!qrInput}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                Escanear
              </button>
              <p className="text-xs text-gray-500">
                Nota: En producción, usar cámara con librería de escaneo QR
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Gestión de Vuelos</h2>
            {flights.map((flight) => (
              <div key={flight._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{flight.aircraftId?.alias}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(flight.fechaHoraProg).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium capitalize">
                    {flight.estado}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Zona</p>
                    <p className="font-medium">{flight.zona}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Asientos libres</p>
                    <p className="font-medium">{flight.asientosLibres}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Turno máx</p>
                    <p className="font-medium">{flight.turno_max_permitido}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {flight.estado === 'draft' && (
                    <button
                      onClick={() => handleUpdateFlight(flight._id, { estado: 'abierto' })}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Abrir Vuelo
                    </button>
                  )}
                  {flight.estado === 'abierto' && (
                    <>
                      <button
                        onClick={() => handleUpdateFlight(flight._id, { estado: 'boarding' })}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Iniciar Boarding
                      </button>
                      <button
                        onClick={() => {
                          const newTurno = prompt('Nuevo turno_max_permitido:', flight.turno_max_permitido);
                          if (newTurno) handleUpdateFlight(flight._id, { turno_max_permitido: parseInt(newTurno) });
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                      >
                        Cambiar Turno Máx
                      </button>
                    </>
                  )}
                  {flight.estado === 'boarding' && (
                    <button
                      onClick={() => flightsAPI.closeFlight(flight._id).then(() => {
                        alert('Vuelo cerrado');
                        const fetch = async () => {
                          const { data } = await flightsAPI.getFlights();
                          setFlights(data);
                        };
                        fetch();
                      })}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Cerrar Vuelo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
