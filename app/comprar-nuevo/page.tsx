'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import ThemeToggle from '@/components/ThemeToggle';
import jsPDF from 'jspdf';

interface Pasajero {
  nombre: string;
  apellido: string;
  rut: string;
  esMenor: boolean;
  autorizacionFile?: string;
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
}

// Función para generar PDF de autorización
function generateAuthorizationPDF(
  nombreMenor: string,
  rutMenor: string,
  flightInfo?: Flight
): void {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORIZACIÓN DE VUELO PARA MENOR DE EDAD', 105, 30, { align: 'center' });

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
  }

  const signatureY = startY + lineHeight * 8;
  doc.text('_______________________________', 20, signatureY);
  doc.text('Firma del adulto responsable', 20, signatureY + 7);

  doc.text('_______________________________', 120, signatureY);
  doc.text('Fecha', 120, signatureY + 7);

  const infoY = signatureY + lineHeight * 3;
  doc.setFontSize(10);
  doc.text('Teléfono de contacto: ____________________', 20, infoY);
  doc.text('Email: ____________________', 20, infoY + 7);

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    'Este documento debe ser firmado, escaneado y subido al sistema antes de completar la compra.',
    105,
    280,
    { align: 'center', maxWidth: 170 }
  );

  const fileName = `autorizacion_${nombreMenor.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
}

export default function ComprarNuevoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [precioTicket, setPrecioTicket] = useState(15000);
  const [loadingFlights, setLoadingFlights] = useState(false);

  // Paso 1: Cantidad de pasajeros
  const [cantidadPasajeros, setCantidadPasajeros] = useState(1);

  // Paso 2: Datos del comprador
  const [email, setEmail] = useState('');
  const [nombreComprador, setNombreComprador] = useState('');
  const [telefono, setTelefono] = useState('');

  // Paso 3: Datos de pasajeros
  const [pasajeros, setPasajeros] = useState<Pasajero[]>([
    { nombre: '', apellido: '', rut: '', esMenor: false }
  ]);

  // Paso 4: Vuelos disponibles
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);

  // Cargar precio
  useEffect(() => {
    const fetchPrecio = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/precio-ticket?t=${Date.now()}`
        );
        setPrecioTicket(response.data.precio_ticket || 15000);
      } catch (error) {
        console.error('Error al cargar precio:', error);
      }
    };
    fetchPrecio();
  }, []);

  // Actualizar array de pasajeros cuando cambia la cantidad
  useEffect(() => {
    const diff = cantidadPasajeros - pasajeros.length;
    if (diff > 0) {
      setPasajeros([
        ...pasajeros,
        ...Array(diff)
          .fill(null)
          .map(() => ({ nombre: '', apellido: '', rut: '', esMenor: false }))
      ]);
    } else if (diff < 0) {
      setPasajeros(pasajeros.slice(0, cantidadPasajeros));
    }
  }, [cantidadPasajeros]);

  const actualizarPasajero = (index: number, campo: string, valor: any) => {
    const nuevos = [...pasajeros];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setPasajeros(nuevos);
  };

  const handleGenerarAutorizacion = (index: number) => {
    const pasajero = pasajeros[index];
    const nombreCompleto = `${pasajero.nombre} ${pasajero.apellido}`.trim();
    generateAuthorizationPDF(nombreCompleto, pasajero.rut, selectedFlight || undefined);
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

  // Validaciones por paso
  const canGoToStep2 = () => {
    return cantidadPasajeros >= 1;
  };

  const canGoToStep3 = () => {
    return email.trim() !== '' && nombreComprador.trim() !== '';
  };

  const canGoToStep4 = () => {
    // Todos los pasajeros deben tener datos completos
    const allComplete = pasajeros.every(
      (p) => p.nombre.trim() && p.apellido.trim() && p.rut.trim()
    );
    // Todos los menores deben tener autorización
    const allMinorsAuthorized = pasajeros
      .filter((p) => p.esMenor)
      .every((p) => p.autorizacionFile);

    return allComplete && allMinorsAuthorized;
  };

  const handleGoToStep4 = async () => {
    if (!canGoToStep4()) return;

    setLoadingFlights(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/flights/available`
      );
      setFlights(response.data);
      setStep(4);
    } catch (error) {
      console.error('Error al cargar vuelos:', error);
      alert('Error al cargar vuelos disponibles');
    } finally {
      setLoadingFlights(false);
    }
  };

  const handleSelectFlight = async (flight: Flight) => {
    try {
      setLoading(true);

      // Crear reserva
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/flights/reserve`,
        {
          flightId: flight._id,
          cantidadPasajeros: cantidadPasajeros,
        }
      );

      setReservationId(response.data.reservationId);
      setSelectedFlight(flight);

      // Guardar en localStorage para la página de pago
      localStorage.setItem('reservationId', response.data.reservationId);
      localStorage.setItem('selectedFlightId', flight._id);

      setStep(5);
    } catch (error: any) {
      console.error('Error al reservar:', error);
      alert(error.response?.data?.error || 'Error al reservar cupos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/payment/iniciar`,
        {
          email,
          nombre_comprador: nombreComprador,
          telefono,
          cantidad_tickets: cantidadPasajeros,
          pasajeros,
          selectedFlightId: selectedFlight?._id,
          reservationId,
        }
      );

      // Limpiar localStorage
      localStorage.removeItem('reservationId');
      localStorage.removeItem('selectedFlightId');

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
      setLoading(false);
    }
  };

  const montoTotal = cantidadPasajeros * precioTicket;

  // Agrupar vuelos por circuito
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

  return (
    <div className="min-h-screen theme-bg-primary p-4">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (step > 1) {
                  setStep(step - 1);
                } else {
                  router.push('/');
                }
              }}
              className="theme-text-primary hover:opacity-70 transition"
            >
              ← {step > 1 ? 'Atrás' : 'Volver'}
            </button>
            <h1 className="text-3xl font-bold theme-text-primary">Comprar Tickets</h1>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 theme-bg-card rounded-2xl p-6 theme-shadow-md">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    s === step
                      ? 'bg-blue-600 text-white scale-110'
                      : s < step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 theme-text-muted'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 5 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      s < step ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs theme-text-muted">
            <span>Cantidad</span>
            <span>Comprador</span>
            <span>Pasajeros</span>
            <span>Vuelo</span>
            <span>Pagar</span>
          </div>
        </div>

        {/* Step 1: Cantidad de Pasajeros */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="theme-bg-card rounded-2xl p-8 theme-shadow-md">
              <h2 className="text-2xl font-bold theme-text-primary mb-6">
                ¿Cuántos pasajeros volarán?
              </h2>

              <div className="mb-6">
                <label className="block theme-text-secondary mb-2 font-medium">
                  Número de pasajeros
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCantidadPasajeros(Math.max(1, cantidadPasajeros - 1))}
                    className="w-12 h-12 rounded-full bg-gray-300 theme-text-primary font-bold text-xl hover:bg-gray-400 transition"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={cantidadPasajeros}
                    onChange={(e) => setCantidadPasajeros(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center text-3xl font-bold theme-input rounded-lg py-3"
                  />
                  <button
                    onClick={() => setCantidadPasajeros(cantidadPasajeros + 1)}
                    className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl hover:bg-blue-700 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="theme-bg-secondary rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="theme-text-muted">Precio por ticket:</span>
                  <span className="text-xl font-bold theme-text-primary">
                    ${precioTicket.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t theme-border">
                  <span className="font-bold theme-text-secondary">Total a pagar:</span>
                  <span className="text-3xl font-bold text-blue-600">
                    ${montoTotal.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canGoToStep2()}
              className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Step 2: Datos del Comprador */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="theme-bg-card rounded-2xl p-8 theme-shadow-md">
              <h2 className="text-2xl font-bold theme-text-primary mb-6">
                Datos del Comprador
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block theme-text-secondary mb-2 font-medium">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 theme-input rounded-lg"
                    placeholder="tu@email.com"
                  />
                  <p className="text-sm theme-text-muted mt-1">
                    Recibirás tus tickets en este correo
                  </p>
                </div>

                <div>
                  <label className="block theme-text-secondary mb-2 font-medium">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={nombreComprador}
                    onChange={(e) => setNombreComprador(e.target.value)}
                    className="w-full px-4 py-3 theme-input rounded-lg"
                    placeholder="Juan Pérez González"
                  />
                </div>

                <div>
                  <label className="block theme-text-secondary mb-2 font-medium">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-4 py-3 theme-input rounded-lg"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!canGoToStep3()}
              className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Step 3: Datos de Pasajeros */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="theme-bg-card rounded-2xl p-8 theme-shadow-md">
              <h2 className="text-2xl font-bold theme-text-primary mb-6">
                Datos de los Pasajeros ({cantidadPasajeros})
              </h2>

              <div className="space-y-6">
                {pasajeros.map((pasajero, index) => (
                  <div
                    key={index}
                    className="theme-bg-secondary rounded-xl p-6 border theme-border"
                  >
                    <h3 className="font-bold theme-text-primary mb-4 text-lg">
                      Pasajero {index + 1}
                    </h3>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block theme-text-muted text-sm mb-1">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          value={pasajero.nombre}
                          onChange={(e) =>
                            actualizarPasajero(index, 'nombre', e.target.value)
                          }
                          className="w-full px-3 py-2 theme-input rounded"
                        />
                      </div>

                      <div>
                        <label className="block theme-text-muted text-sm mb-1">
                          Apellido *
                        </label>
                        <input
                          type="text"
                          value={pasajero.apellido}
                          onChange={(e) =>
                            actualizarPasajero(index, 'apellido', e.target.value)
                          }
                          className="w-full px-3 py-2 theme-input rounded"
                        />
                      </div>

                      <div>
                        <label className="block theme-text-muted text-sm mb-1">RUT *</label>
                        <input
                          type="text"
                          value={pasajero.rut}
                          onChange={(e) => actualizarPasajero(index, 'rut', e.target.value)}
                          className="w-full px-3 py-2 theme-input rounded"
                          placeholder="12345678-9"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
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

                    {/* Autorización para menores */}
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
                              firmado.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => handleGenerarAutorizacion(index)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                          >
                            📄 Generar Formulario (PDF)
                          </button>

                          <div>
                            <label className="block text-xs text-yellow-900 font-medium mb-1">
                              Subir autorización firmada *
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
                                <span>Archivo: {pasajero.autorizacionFileName}</span>
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

            <button
              onClick={handleGoToStep4}
              disabled={!canGoToStep4() || loadingFlights}
              className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loadingFlights ? 'Cargando vuelos...' : 'Ver Vuelos Disponibles →'}
            </button>
          </div>
        )}

        {/* Step 4: Seleccionar Vuelo */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="theme-bg-card rounded-2xl p-6 theme-shadow-md">
              <h2 className="text-2xl font-bold theme-text-primary mb-4">
                Selecciona tu Circuito de Vuelo
              </h2>
              <p className="theme-text-muted text-sm">
                Al seleccionar un vuelo, los cupos quedarán reservados por 5 minutos.
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
              <div className="space-y-6">
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
                        <h3 className="text-2xl font-bold theme-text-primary">
                          Circuito #{circuitoNum}
                        </h3>
                        <p className="theme-text-muted text-sm mt-1">
                          {fechaVuelo.toLocaleDateString('es-CL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {vuelosCircuito.map((flight) => {
                          const cuposDisponibles =
                            flight.capacidad_total - flight.asientos_ocupados;
                          const tieneCupos = cuposDisponibles >= cantidadPasajeros;

                          return (
                            <button
                              key={flight._id}
                              onClick={() => tieneCupos && handleSelectFlight(flight)}
                              disabled={!tieneCupos || loading}
                              className={`p-6 rounded-xl border-2 text-left transition-all ${
                                tieneCupos
                                  ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 theme-border hover:border-blue-400'
                                  : 'opacity-50 cursor-not-allowed theme-border'
                              }`}
                            >
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
                                <div className="flex justify-between">
                                  <span className="theme-text-muted text-sm">
                                    Capacidad
                                  </span>
                                  <span className="theme-text-primary font-semibold">
                                    {flight.capacidad_total} asientos
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="theme-text-muted text-sm">
                                    Disponibles
                                  </span>
                                  <span
                                    className={`font-bold ${
                                      tieneCupos ? 'text-green-600' : 'text-red-600'
                                    }`}
                                  >
                                    {cuposDisponibles}
                                  </span>
                                </div>
                              </div>

                              {!tieneCupos && (
                                <p className="text-xs text-red-600 font-medium mt-3">
                                  No hay cupos suficientes
                                </p>
                              )}

                              {tieneCupos && (
                                <div className="mt-4 py-2 bg-blue-600 text-white rounded font-semibold text-center">
                                  Seleccionar
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
        )}

        {/* Step 5: Confirmar y Pagar */}
        {step === 5 && selectedFlight && (
          <div className="space-y-6">
            <div className="theme-bg-card rounded-2xl p-8 theme-shadow-md">
              <h2 className="text-2xl font-bold theme-text-primary mb-6">
                Confirmar Compra
              </h2>

              {/* Vuelo seleccionado */}
              <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  Vuelo Reservado
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  Circuito #{selectedFlight.numero_circuito} -{' '}
                  {selectedFlight.aircraftId.matricula}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedFlight.aircraftId.modelo}
                </p>
              </div>

              {/* Resumen */}
              <div className="space-y-3 mb-6">
                <h3 className="font-bold theme-text-primary">Resumen de Compra</h3>

                <div className="flex justify-between theme-text-secondary">
                  <span>Comprador:</span>
                  <span className="font-medium">{nombreComprador}</span>
                </div>

                <div className="flex justify-between theme-text-secondary">
                  <span>Email:</span>
                  <span className="font-medium">{email}</span>
                </div>

                <div className="flex justify-between theme-text-secondary">
                  <span>Pasajeros:</span>
                  <span className="font-medium">{cantidadPasajeros}</span>
                </div>

                <div className="flex justify-between theme-text-secondary">
                  <span>Precio por ticket:</span>
                  <span className="font-medium">${precioTicket.toLocaleString('es-CL')}</span>
                </div>

                <div className="pt-3 border-t theme-border flex justify-between">
                  <span className="font-bold theme-text-primary text-lg">Total:</span>
                  <span className="font-bold text-blue-600 text-2xl">
                    ${montoTotal.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Redirigiendo a Webpay...' : `Pagar $${montoTotal.toLocaleString('es-CL')}`}
              </button>

              <p className="text-xs theme-text-muted text-center mt-3">
                Serás redirigido a Webpay para completar tu pago de forma segura
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
