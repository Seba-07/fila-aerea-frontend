'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { boardingAPI } from '@/lib/api';
import QRCode from 'qrcode.react';

function MiPaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardingPassId = searchParams.get('id');

  const [boardingPass, setBoardingPass] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boardingPassId) {
      setLoading(false);
      return;
    }

    const fetchBoardingPass = async () => {
      try {
        const { data } = await boardingAPI.getBoardingPass(boardingPassId);
        setBoardingPass(data);
      } catch (error) {
        console.error('Error al cargar pase:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoardingPass();
  }, [boardingPassId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!boardingPass) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
          <p className="text-xl mb-4">No tienes un pase de embarque activo</p>
          <button
            onClick={() => router.push('/vuelos')}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Ver Vuelos
          </button>
        </div>
      </div>
    );
  }

  const flight = boardingPass.flightId;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-primary">
            ← Volver
          </button>
          <h1 className="text-2xl font-bold">Pase de Embarque</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* QR Code */}
          <div className="bg-gradient-to-b from-blue-600 to-blue-800 text-white p-8 text-center">
            <div className="bg-white p-4 inline-block rounded-lg">
              <QRCode value={boardingPass.qr_token} size={200} />
            </div>
            <p className="mt-4 text-sm opacity-90">Presenta este código al embarcar</p>
          </div>

          {/* Detalles */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Asiento</p>
                <p className="text-2xl font-bold">{boardingPass.seatNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className={`text-lg font-medium ${
                  boardingPass.estado === 'escaneado' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {boardingPass.estado === 'escaneado' ? '✓ Embarcado' : 'Listo'}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Detalles del Vuelo</p>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Avión:</span> {flight.aircraftId?.alias}</p>
                <p><span className="font-medium">Zona:</span> {flight.zona}</p>
                {flight.puerta && <p><span className="font-medium">Puerta:</span> {flight.puerta}</p>}
                <p><span className="font-medium">Hora:</span> {new Date(flight.fechaHoraProg).toLocaleString('es-ES')}</p>
                <p><span className="font-medium">Estado:</span> <span className="capitalize">{flight.estado}</span></p>
              </div>
            </div>

            {flight.estado === 'boarding' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✓ ¡Embarque abierto! Dirígete a la zona {flight.zona}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MiPasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <MiPaseContent />
    </Suspense>
  );
}
