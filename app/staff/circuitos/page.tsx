'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { flightsAPI, staffAPI } from '@/lib/api';
import { Html5Qrcode } from 'html5-qrcode';

export default function CircuitosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [flights, setFlights] = useState<any[]>([]);
  const [groupedCircuits, setGroupedCircuits] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [scanningCircuito, setScanningCircuito] = useState<number | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
      return;
    }
    fetchFlights();
  }, [user, router]);

  const fetchFlights = async () => {
    try {
      const { data } = await flightsAPI.getFlights();

      // Filtrar solo vuelos activos (abierto, en_vuelo)
      const activeFlights = data.filter((f: any) =>
        f.estado === 'abierto' || f.estado === 'en_vuelo'
      );

      setFlights(activeFlights);

      // Agrupar vuelos por circuito
      const grouped = activeFlights.reduce((acc: any, flight: any) => {
        const existing = acc.find((g: any) => g.numero_circuito === flight.numero_circuito);
        if (existing) {
          existing.flights.push(flight);
        } else {
          acc.push({
            numero_circuito: flight.numero_circuito,
            flights: [flight],
            fecha_hora: flight.fecha_hora,
          });
        }
        return acc;
      }, []);

      // Ordenar circuitos por fecha/hora más próxima
      grouped.sort((a: any, b: any) =>
        new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
      );

      setGroupedCircuits(grouped);

      // Seleccionar el primer circuito (más próximo) por defecto
      if (grouped.length > 0) {
        setSelectedTab(0);
      }
    } catch (error) {
      console.error('Error al cargar vuelos:', error);
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async (numeroCircuito: number) => {
    try {
      setScanError('');
      setScanResult(null);
      setScanningCircuito(numeroCircuito);

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('environment')
        );
        const selectedCamera = backCamera || devices[0];

        const html5QrCode = new Html5Qrcode(`qr-reader-${numeroCircuito}`);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          selectedCamera.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            await html5QrCode.stop();
            setScanningCircuito(null);

            try {
              const qrData = JSON.parse(decodedText);

              // Validar con backend
              const validation = await staffAPI.validateQR(qrData);
              setScanResult(validation.data);

              // Recargar vuelos para actualizar estados
              setTimeout(() => {
                fetchFlights();
              }, 2000);
            } catch (err: any) {
              setScanError('Error al validar el QR: ' + (err.response?.data?.error || err.message));
            }
          },
          (errorMessage) => {
            // Scanning errors (not critical)
          }
        );
      } else {
        setScanError('No se encontraron cámaras disponibles');
      }
    } catch (err: any) {
      setScanError('Error al iniciar el scanner: ' + err.message);
      setScanningCircuito(null);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scanningCircuito) {
      await scannerRef.current.stop();
      scannerRef.current = null;
      setScanningCircuito(null);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setScanError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">Cargando circuitos...</p>
        </div>
      </div>
    );
  }

  if (user?.rol !== 'staff') {
    return null;
  }

  const currentCircuit = groupedCircuits[selectedTab];

  return (
    <div className="min-h-screen theme-bg-primary">
      <header className="theme-bg-card backdrop-blur-sm border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="theme-text-primary hover:text-primary transition">
            ← Inicio
          </button>
          <img src="/logo.png" alt="Cessna" className="h-8" />
          <h1 className="text-2xl font-bold theme-text-primary">Circuitos de Vuelo</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {groupedCircuits.length === 0 ? (
          <div className="theme-bg-card rounded-2xl theme-border p-8 text-center">
            <p className="theme-text-primary text-xl">No hay circuitos activos</p>
          </div>
        ) : (
          <>
            {/* Tabs para circuitos */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-2">
                {groupedCircuits.map((circuit, index) => {
                  const isPast = new Date(circuit.fecha_hora) < new Date();
                  return (
                    <button
                      key={circuit.numero_circuito}
                      onClick={() => {
                        setSelectedTab(index);
                        resetScan();
                      }}
                      className={`px-6 py-3 rounded-lg font-medium transition-all ${
                        selectedTab === index
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'theme-bg-card theme-text-primary hover:theme-bg-secondary'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold">Circuito #{circuit.numero_circuito}</div>
                        <div className="text-xs opacity-80">
                          {new Date(circuit.fecha_hora).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {index === 0 && !isPast && (
                          <div className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded mt-1">
                            Próximo
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contenido del circuito seleccionado */}
            {currentCircuit && (
              <div className="space-y-6">
                {/* Header del circuito */}
                <div className="theme-bg-card rounded-2xl theme-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-3xl font-bold theme-text-primary">
                        Circuito #{currentCircuit.numero_circuito}
                      </h2>
                      <p className="theme-text-muted">
                        {new Date(currentCircuit.fecha_hora).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-blue-400">
                        {new Date(currentCircuit.fecha_hora).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <p className="text-sm theme-text-muted">{currentCircuit.flights.length} vuelo(s)</p>
                    </div>
                  </div>

                  {/* Scanner QR */}
                  <div className="mt-6 pt-6 border-t theme-border">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold theme-text-primary mb-2">
                        📱 Validación de Embarque
                      </h3>
                      <p className="text-sm theme-text-muted">
                        Escanea el código QR del pase de embarque del pasajero
                      </p>
                    </div>

                    {/* Scanner Area */}
                    <div className="mb-4">
                      <div
                        id={`qr-reader-${currentCircuit.numero_circuito}`}
                        className={`${scanningCircuito === currentCircuit.numero_circuito ? '' : 'hidden'} rounded-lg overflow-hidden`}
                      ></div>

                      {scanningCircuito !== currentCircuit.numero_circuito && !scanResult && (
                        <div className="bg-slate-700 rounded-lg p-8 text-center">
                          <svg className="w-20 h-20 mx-auto theme-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          <p className="theme-text-muted">
                            Presiona &quot;Iniciar Escaneo&quot; para activar la cámara
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-3 mb-4">
                      {scanningCircuito !== currentCircuit.numero_circuito && !scanResult && (
                        <button
                          onClick={() => startScanner(currentCircuit.numero_circuito)}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                          📷 Iniciar Escaneo
                        </button>
                      )}

                      {scanningCircuito === currentCircuit.numero_circuito && (
                        <button
                          onClick={stopScanner}
                          className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition"
                        >
                          ⏹ Detener
                        </button>
                      )}

                      {scanResult && (
                        <button
                          onClick={() => {
                            resetScan();
                            startScanner(currentCircuit.numero_circuito);
                          }}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                          🔄 Escanear Otro
                        </button>
                      )}
                    </div>

                    {/* Error */}
                    {scanError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                        <p className="text-red-400 text-sm">{scanError}</p>
                      </div>
                    )}

                    {/* Result */}
                    {scanResult && (
                      <div className={`border rounded-lg p-6 ${
                        scanResult.valido
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <div className="text-center mb-4">
                          {scanResult.valido ? (
                            <div className="text-6xl mb-2">✅</div>
                          ) : (
                            <div className="text-6xl mb-2">❌</div>
                          )}
                          <h3 className={`text-xl font-bold ${
                            scanResult.valido ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {scanResult.valido ? 'PASAJERO EMBARCADO' : 'PASAJERO INVÁLIDO'}
                          </h3>
                        </div>

                        {scanResult.valido && scanResult.ticket && (
                          <div className="space-y-3">
                            <div className="theme-bg-secondary rounded-lg p-3">
                              <p className="text-sm theme-text-muted">Pasajero</p>
                              <p className="text-lg font-bold theme-text-primary">
                                {scanResult.ticket.pasajero?.nombre} {scanResult.ticket.pasajero?.apellido}
                              </p>
                            </div>
                            <div className="theme-bg-secondary rounded-lg p-3">
                              <p className="text-sm theme-text-muted">Ticket</p>
                              <p className="text-lg font-medium theme-text-primary">{scanResult.ticket.codigo}</p>
                            </div>
                            <div className="theme-bg-secondary rounded-lg p-3">
                              <p className="text-sm theme-text-muted">Estado</p>
                              <p className="text-lg font-medium text-green-400">
                                {scanResult.ticket.estado?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        )}

                        {!scanResult.valido && (
                          <div className="mt-4">
                            <p className="text-red-300 text-center">{scanResult.mensaje}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lista de vuelos del circuito */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold theme-text-primary">Vuelos del Circuito</h3>
                  {currentCircuit.flights.map((flight: any) => (
                    <div key={flight._id} className="theme-bg-card rounded-xl theme-border p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold theme-text-primary">
                            {flight.aircraftId?.matricula} - {flight.aircraftId?.modelo}
                          </h4>
                          <p className="text-sm theme-text-muted">
                            {flight.asientos_ocupados} / {flight.capacidad_total} pasajeros
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                          flight.estado === 'abierto' ? 'bg-green-500/20 text-green-300' :
                          flight.estado === 'en_vuelo' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-gray-500/20 theme-text-secondary'
                        }`}>
                          {flight.estado.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>

                      {/* Lista de pasajeros */}
                      {flight.pasajeros && flight.pasajeros.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium theme-text-muted mb-2">Pasajeros:</p>
                          <div className="space-y-2">
                            {flight.pasajeros.map((pasajero: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between theme-bg-secondary/50 rounded-lg p-3"
                              >
                                <div>
                                  <p className="font-medium theme-text-primary">
                                    {pasajero.nombre} {pasajero.apellido}
                                  </p>
                                  <p className="text-xs theme-text-muted">
                                    Ticket: {pasajero.codigo_ticket}
                                  </p>
                                </div>
                                <div>
                                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                    pasajero.estado === 'embarcado'
                                      ? 'bg-green-500/20 text-green-300'
                                      : pasajero.estado === 'inscrito'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'bg-gray-500/20 theme-text-secondary'
                                  }`}>
                                    {pasajero.estado === 'embarcado' ? '✓ Embarcado' :
                                     pasajero.estado === 'inscrito' ? 'Inscrito' :
                                     pasajero.estado?.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
