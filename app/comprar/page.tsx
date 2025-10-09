'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import jsPDF from 'jspdf';

// Interfaces
interface Pasajero {
  nombre: string;
  apellido: string;
  rut: string;
  esMenor: boolean;
  autorizacionFile?: string; // base64
  autorizacionFileName?: string;
}

interface Flight {
  _id: string;
  aircraftId: {
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

interface Reservation {
  _id: string;
  flightId: string;
  cantidadPasajeros: number;
  expiresAt: string;
  status: string;
}

// Countdown Timer Component
function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 60;

  return (
    <div className={`text-2xl font-bold ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}

// PDF Generation Function
function generateAuthorizationPDF(
  nombreMenor: string,
  rutMenor: string,
  flightInfo?: Flight
): void {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORIZACIÓN DE VUELO PARA MENOR DE EDAD', 105, 30, { align: 'center' });

  // Body
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const startY = 60;
  const lineHeight = 10;

  doc.text(`Yo, __________________________________ (nombre del adulto responsable),`, 20, startY);
  doc.text(`RUT ____________________, autorizo a:`, 20, startY + lineHeight);

  doc.setFont('helvetica', 'bold');
  doc.text(`${nombreMenor} ${rutMenor ? `(RUT: ${rutMenor})` : ''}`, 20, startY + lineHeight * 2);

  doc.setFont('helvetica', 'normal');
  doc.text(`a volar en un avión del Club Aéreo de Castro`, 20, startY + lineHeight * 3);

  if (flightInfo) {
    doc.text(`en el Circuito #${flightInfo.numero_circuito}`, 20, startY + lineHeight * 4);
    doc.text(
      `el día ${new Date(flightInfo.fecha_hora).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`,
      20,
      startY + lineHeight * 5
    );
  } else {
    doc.text(`el día ______________________.`, 20, startY + lineHeight * 4);
  }

  // Signature section
  const signatureY = startY + lineHeight * 8;
  doc.text('_______________________________', 20, signatureY);
  doc.text('Firma del adulto responsable', 20, signatureY + 7);

  doc.text('_______________________________', 120, signatureY);
  doc.text('Fecha', 120, signatureY + 7);

  // Additional info
  const infoY = signatureY + lineHeight * 3;
  doc.setFontSize(10);
  doc.text('Teléfono de contacto: ____________________', 20, infoY);
  doc.text('Email: ____________________', 20, infoY + 7);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    'Este documento debe ser firmado, escaneado y subido al sistema antes de completar la compra.',
    105,
    280,
    { align: 'center', maxWidth: 170 }
  );

  // Save PDF
  const fileName = `autorizacion_${nombreMenor.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
}

export default function ComprarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [precioTicket, setPrecioTicket] = useState(15000);
  const [submitting, setSubmitting] = useState(false);

  // Reservation & Flight data
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [flightData, setFlightData] = useState<Flight | null>(null);
  const [reservationData, setReservationData] = useState<Reservation | null>(null);

  // Datos del comprador
  const [email, setEmail] = useState('');
  const [nombreComprador, setNombreComprador] = useState('');
  const [telefono, setTelefono] = useState('');

  // Datos de pasajeros
  const [cantidadTickets, setCantidadTickets] = useState(1);
  const [pasajeros, setPasajeros] = useState<Pasajero[]>([
    { nombre: '', apellido: '', rut: '', esMenor: false }
  ]);

  // Check for reservation and flight on mount
  useEffect(() => {
    const checkReservation = async () => {
      const flightId = localStorage.getItem('selectedFlightId');
      const resId = localStorage.getItem('reservationId');

      if (!flightId || !resId) {
        alert('No hay reserva activa. Serás redirigido a la selección de vuelo.');
        router.push('/seleccionar-vuelo?pasajeros=1');
        return;
      }

      setSelectedFlightId(flightId);
      setReservationId(resId);

      try {
        // Fetch flight data
        const flightResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/flights/${flightId}`
        );
        setFlightData(flightResponse.data);

        // Fetch reservation data
        const reservationResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/flights/reservation/${resId}`
        );
        setReservationData(reservationResponse.data);

        // Set passenger count based on reservation
        const numPasajeros = reservationResponse.data.cantidadPasajeros;
        setCantidadTickets(numPasajeros);
        setPasajeros(
          Array(numPasajeros)
            .fill(null)
            .map(() => ({ nombre: '', apellido: '', rut: '', esMenor: false }))
        );
      } catch (error: any) {
        console.error('Error al cargar datos:', error);
        alert(
          error.response?.data?.error ||
            'Error al cargar la reserva. Serás redirigido a la selección de vuelo.'
        );
        router.push('/seleccionar-vuelo?pasajeros=1');
      } finally {
        setLoading(false);
      }
    };

    checkReservation();
  }, [router]);

  // Cargar precio del ticket desde configuración
  useEffect(() => {
    const fetchPrecio = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/precio-ticket?t=${Date.now()}`;
        const response = await axios.get(url);
        setPrecioTicket(response.data.precio_ticket || 15000);
      } catch (error) {
        console.error('Error al cargar precio:', error);
        setPrecioTicket(15000);
      } finally {
        setLoadingPrice(false);
      }
    };
    fetchPrecio();
  }, []);

  // Handle reservation expiration
  const handleReservationExpire = async () => {
    try {
      if (reservationId) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/flights/release-reservation`,
          { reservationId }
        );
      }
    } catch (error) {
      console.error('Error al liberar reserva:', error);
    }

    localStorage.removeItem('selectedFlightId');
    localStorage.removeItem('reservationId');
    alert('Tu reserva ha expirado. Serás redirigido a la selección de vuelo.');
    router.push('/seleccionar-vuelo?pasajeros=1');
  };

  const agregarPasajero = () => {
    setPasajeros([
      ...pasajeros,
      { nombre: '', apellido: '', rut: '', esMenor: false },
    ]);
    setCantidadTickets(pasajeros.length + 1);
  };

  const eliminarPasajero = (index: number) => {
    const nuevos = pasajeros.filter((_, i) => i !== index);
    setPasajeros(nuevos);
    setCantidadTickets(nuevos.length);
  };

  const actualizarPasajero = (index: number, campo: string, valor: any) => {
    const nuevos = [...pasajeros];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setPasajeros(nuevos);
  };

  const handleGenerarAutorizacion = (index: number) => {
    const pasajero = pasajeros[index];
    const nombreCompleto = `${pasajero.nombre} ${pasajero.apellido}`.trim();
    generateAuthorizationPDF(nombreCompleto, pasajero.rut, flightData || undefined);
  };

  const handleFileUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo debe ser menor a 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      actualizarPasajero(index, 'autorizacionFile', base64);
      actualizarPasajero(index, 'autorizacionFileName', file.name);
    };
    reader.readAsDataURL(file);
  };

  // Validation functions
  const isPasajeroComplete = (pasajero: Pasajero) => {
    return pasajero.nombre && pasajero.apellido && pasajero.rut;
  };

  const isMenorWithAuthorization = (pasajero: Pasajero) => {
    return !pasajero.esMenor || (pasajero.esMenor && pasajero.autorizacionFile);
  };

  const canSubmit = () => {
    if (submitting) return false;
    if (!reservationData) return false;

    // Check if all passenger data is complete
    if (!pasajeros.every(isPasajeroComplete)) return false;

    // Check if all minors have authorization
    if (!pasajeros.every(isMenorWithAuthorization)) return false;

    // Check buyer data
    if (!email || !nombreComprador) return false;

    return true;
  };

  const getSubmitButtonText = () => {
    if (submitting) return 'Redirigiendo a Webpay...';
    if (!reservationData) return 'Cargando...';
    if (!pasajeros.every(isPasajeroComplete)) return 'Completa todos los datos';
    if (!pasajeros.every(isMenorWithAuthorization)) {
      return 'Faltan autorizaciones de menores';
    }
    if (!email || !nombreComprador) return 'Completa datos del comprador';

    return `Pagar $${montoTotal.toLocaleString('es-CL')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit()) return;

    try {
      setSubmitting(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/payment/iniciar`,
        {
          email,
          nombre_comprador: nombreComprador,
          telefono,
          cantidad_tickets: cantidadTickets,
          pasajeros,
          selectedFlightId,
          reservationId,
        }
      );

      // Clear localStorage
      localStorage.removeItem('selectedFlightId');
      localStorage.removeItem('reservationId');

      // Redirigir a Webpay
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = response.data.url;

      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token_ws';
      tokenInput.value = response.data.token;

      form.appendChild(tokenInput);
      document.body.appendChild(form);
      form.submit();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al iniciar el pago');
      setSubmitting(false);
    }
  };

  const montoTotal = cantidadTickets * precioTicket;

  if (loading || loadingPrice) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!flightData || !reservationData) {
    return null;
  }

  return (
    <div className="min-h-screen theme-bg-primary p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="theme-text-primary hover:opacity-70 transition"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold theme-text-primary">Comprar Tickets</h1>
        </div>

        {/* Flight Info & Timer */}
        <div className="theme-bg-card rounded-2xl p-6 mb-6 theme-shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="theme-text-muted text-sm">Vuelo Seleccionado</p>
              <p className="text-2xl font-bold theme-text-primary">
                Circuito #{flightData.numero_circuito}
              </p>
              <p className="theme-text-secondary text-sm">
                {flightData.aircraftId.matricula} - {flightData.aircraftId.modelo}
              </p>
              <p className="theme-text-muted text-xs mt-1">
                {new Date(flightData.fecha_hora).toLocaleDateString('es-CL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="theme-text-muted text-sm">Tiempo restante</p>
              <CountdownTimer
                expiresAt={reservationData.expiresAt}
                onExpire={handleReservationExpire}
              />
              <p className="theme-text-muted text-xs mt-1">Tu reserva expira pronto</p>
            </div>
          </div>
          <div className="pt-4 border-t theme-border flex items-center justify-between">
            <div>
              <p className="theme-text-muted text-sm">Precio por ticket</p>
              <p className="text-2xl font-bold theme-text-primary">
                ${precioTicket.toLocaleString('es-CL')}
              </p>
            </div>
            <div className="text-right">
              <p className="theme-text-muted text-sm">Total a pagar</p>
              <p className="text-3xl font-bold text-blue-600">
                ${montoTotal.toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del comprador */}
          <div className="theme-bg-card rounded-2xl p-6 theme-shadow-md">
            <h2 className="text-xl font-bold theme-text-primary mb-4">
              Datos del Comprador
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm theme-text-muted mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 theme-input rounded"
                  placeholder="tu@email.com"
                />
                <p className="text-xs theme-text-muted mt-1">
                  Recibirás tus tickets en este correo
                </p>
              </div>
              <div>
                <label className="block text-sm theme-text-muted mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={nombreComprador}
                  onChange={(e) => setNombreComprador(e.target.value)}
                  required
                  className="w-full px-3 py-2 theme-input rounded"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm theme-text-muted mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 theme-input rounded"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>
          </div>

          {/* Pasajeros */}
          <div className="theme-bg-card rounded-2xl p-6 theme-shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold theme-text-primary">
                Pasajeros ({cantidadTickets})
              </h2>
              <button
                type="button"
                onClick={agregarPasajero}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                + Agregar Pasajero
              </button>
            </div>

            <div className="space-y-4">
              {pasajeros.map((pasajero, index) => (
                <div
                  key={index}
                  className="theme-bg-secondary rounded-lg p-4 border theme-border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold theme-text-primary">
                      Pasajero {index + 1}
                    </h3>
                    {pasajeros.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarPasajero(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="block text-xs theme-text-muted mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={pasajero.nombre}
                        onChange={(e) =>
                          actualizarPasajero(index, 'nombre', e.target.value)
                        }
                        required
                        className="w-full px-3 py-2 theme-input rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs theme-text-muted mb-1">Apellido *</label>
                      <input
                        type="text"
                        value={pasajero.apellido}
                        onChange={(e) =>
                          actualizarPasajero(index, 'apellido', e.target.value)
                        }
                        required
                        className="w-full px-3 py-2 theme-input rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs theme-text-muted mb-1">RUT *</label>
                      <input
                        type="text"
                        value={pasajero.rut}
                        onChange={(e) => actualizarPasajero(index, 'rut', e.target.value)}
                        required
                        className="w-full px-3 py-2 theme-input rounded text-sm"
                        placeholder="12345678-9"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pasajero.esMenor}
                      onChange={(e) =>
                        actualizarPasajero(index, 'esMenor', e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm theme-text-muted">Es menor de edad</span>
                  </label>

                  {/* Minor Authorization Section */}
                  {pasajero.esMenor && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                          <p className="font-semibold text-yellow-900 text-sm">
                            Autorización Requerida
                          </p>
                          <p className="text-xs text-yellow-800 mt-1">
                            Los menores de edad requieren un formulario de autorización
                            firmado por un adulto responsable.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={() => handleGenerarAutorizacion(index)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                        >
                          Generar Formulario de Autorización (PDF)
                        </button>

                        <div>
                          <label className="block text-xs text-yellow-900 font-medium mb-1">
                            Subir autorización firmada (PDF) *
                          </label>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => handleFileUpload(index, e)}
                            className="w-full px-3 py-2 text-sm border border-yellow-300 rounded bg-white"
                          />
                          {pasajero.autorizacionFileName && (
                            <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                              <span>✓</span>
                              <span>Archivo subido: {pasajero.autorizacionFileName}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botón pagar */}
          <div className="theme-bg-card rounded-2xl p-6 theme-shadow-md">
            <button
              type="submit"
              disabled={!canSubmit()}
              className={`w-full py-4 font-bold text-lg rounded-lg transition ${
                canSubmit()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {getSubmitButtonText()}
            </button>
            <p className="text-xs theme-text-muted text-center mt-3">
              Serás redirigido a Webpay para completar tu pago de forma segura
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
