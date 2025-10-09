'use client';

import { useState, useEffect, useRef } from 'react';
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

  // Logo optimizado en base64 (18KB)
  const logoBase64 = 'data:image/png;base64,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';

  try {
    // Logo pequeño y optimizado (120x109px, 18KB)
    doc.addImage(logoBase64, 'PNG', 75, 12, 60, 30);
  } catch (error) {
    console.log('Logo could not be added to PDF');
  }

  // Título principal
  doc.setTextColor(0, 0, 0); // Negro
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORIZACIÓN DE VUELO PARA MENOR DE EDAD', 105, 50, { align: 'center' });

  // Subtítulo
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Club Aéreo de Castro', 105, 57, { align: 'center' });

  // Línea decorativa
  doc.setLineWidth(0.5);
  doc.line(20, 62, 190, 62);

  // Contenido del documento
  const startY = 75;
  const lineHeight = 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // Línea 1: Yo, nombre del adulto
  doc.text('Yo, ________________________________________ (nombre del adulto responsable),', 20, startY);

  // Línea 2: RUT
  doc.text('RUT _________________________, autorizo a:', 20, startY + lineHeight);

  // Línea 3: Nombre del menor (en negrita)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${nombreMenor}${rutMenor ? ` (RUT: ${rutMenor})` : ''}`, 20, startY + lineHeight * 2.5);

  // Línea 4: a volar en...
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('a volar en un avión del Club Aéreo de Castro', 20, startY + lineHeight * 4);

  // Info del vuelo (si existe)
  if (flightInfo) {
    doc.text(`en el Circuito #${flightInfo.numero_circuito}`, 20, startY + lineHeight * 5.2);
    const fecha = new Date(flightInfo.fecha_hora).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc.text(`el día ${fecha}.`, 20, startY + lineHeight * 6.4);
  } else {
    doc.text('el día _______________________.', 20, startY + lineHeight * 5.2);
  }

  // Firmas
  const signatureY = startY + lineHeight * 10;

  // Firma adulto
  doc.text('_________________________________', 20, signatureY);
  doc.setFontSize(9);
  doc.text('Firma del adulto responsable', 20, signatureY + 6);

  // Fecha
  doc.setFontSize(11);
  doc.text('_________________________________', 120, signatureY);
  doc.setFontSize(9);
  doc.text('Fecha', 120, signatureY + 6);

  // Información de contacto
  const contactY = signatureY + lineHeight * 3.5;
  doc.setFontSize(10);
  doc.text('Teléfono de contacto: _______________________________', 20, contactY);
  doc.text('Email: _______________________________________________', 20, contactY + 8);

  // Nota al pie
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(
    'Este documento debe ser firmado por el adulto responsable. Puede tomar una foto o escanearlo',
    105,
    270,
    { align: 'center' }
  );
  doc.text(
    'y subirlo al sistema antes de completar la compra del ticket.',
    105,
    276,
    { align: 'center' }
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

  // Estados para cámara web
  const [showWebcam, setShowWebcam] = useState(false);
  const [currentPasajeroIndex, setCurrentPasajeroIndex] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
  const [viajanJuntos, setViajanJuntos] = useState(true);
  const [asignacionesIndividuales, setAsignacionesIndividuales] = useState<{ [pasajeroIndex: number]: Flight | null }>({});

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

  const copiarDatosComprador = (index: number) => {
    if (index !== 0) return; // Solo para pasajero 1
    const nuevos = [...pasajeros];
    nuevos[0] = {
      ...nuevos[0],
      nombre: nombreComprador.split(' ')[0] || '',
      apellido: nombreComprador.split(' ').slice(1).join(' ') || nombreComprador,
      rut: '', // RUT no se copia automáticamente
    };
    setPasajeros(nuevos);
    alert('✅ Datos del comprador copiados al Pasajero 1. Por favor completa el RUT.');
  };

  const handleCapturePhoto = async (index: number) => {
    // Detectar si es dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // En móvil, usar input con capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');

      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          handleFileUpload(index, { target: { files: [file] } } as any);
        }
      };

      input.click();
    } else {
      // En PC, abrir modal con webcam
      setCurrentPasajeroIndex(index);
      setShowWebcam(true);
    }
  };

  // Iniciar cámara web
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      alert('❌ No se pudo acceder a la cámara. Verifica los permisos del navegador.');
      setShowWebcam(false);
    }
  };

  // Detener cámara web
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Capturar foto desde webcam
  const capturePhotoFromWebcam = () => {
    if (!canvasRef.current || !videoRef.current || currentPasajeroIndex === null) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `autorizacion_foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const fakeEvent = {
            target: { files: [file] }
          } as any;

          handleFileUpload(currentPasajeroIndex, fakeEvent);
          closeWebcam();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Cerrar webcam
  const closeWebcam = () => {
    stopWebcam();
    setShowWebcam(false);
    setCurrentPasajeroIndex(null);
  };

  // Effect para iniciar webcam cuando se abre el modal
  useEffect(() => {
    if (showWebcam) {
      startWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [showWebcam]);

  const handleGenerarAutorizacion = (index: number) => {
    const pasajero = pasajeros[index];
    const nombreCompleto = `${pasajero.nombre} ${pasajero.apellido}`.trim();
    generateAuthorizationPDF(nombreCompleto, pasajero.rut, selectedFlight || undefined);
  };

  const handleFileUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      alert('❌ Solo se permiten archivos PDF o imágenes (JPG, PNG, HEIC)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('❌ El archivo debe ser menor a 5MB. Tu archivo pesa ' + (file.size / (1024 * 1024)).toFixed(2) + 'MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;

      // Actualizar pasajero con ambos campos a la vez
      const nuevos = [...pasajeros];
      nuevos[index] = {
        ...nuevos[index],
        autorizacionFile: base64,
        autorizacionFileName: file.name
      };
      setPasajeros(nuevos);

      console.log('✅ Archivo guardado para pasajero', index, ':', {
        nombre: file.name,
        tamaño: (file.size / 1024).toFixed(2) + 'KB',
        tipo: file.type,
        base64Length: base64.length
      });

      // Mostrar mensaje de éxito
      alert('✅ Documento subido correctamente: ' + file.name);
    };
    reader.onerror = () => {
      alert('❌ Error al leer el archivo. Por favor, intenta de nuevo.');
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
    const menores = pasajeros.filter((p) => p.esMenor);
    const menoresConAutorizacion = menores.filter(p => p.autorizacionFile && p.autorizacionFile.trim());
    const allMinorsAuthorized = menores.length === 0 || menores.length === menoresConAutorizacion.length;

    console.log('🔍 Validación para avanzar:');
    console.log('- Datos completos:', allComplete);
    console.log('- Total menores:', menores.length);
    console.log('- Menores con autorización:', menoresConAutorizacion.length);
    console.log('- Todos los menores autorizados:', allMinorsAuthorized);
    console.log('- Lista de pasajeros:', pasajeros.map((p, i) => ({
      index: i,
      nombre: p.nombre,
      esMenor: p.esMenor,
      tieneAutorizacion: !!p.autorizacionFile,
      archivoNombre: p.autorizacionFileName
    })));

    return allComplete && allMinorsAuthorized;
  };

  const getBotonDeshabilitadoMensaje = () => {
    const datosIncompletos = pasajeros.filter(p => !p.nombre.trim() || !p.apellido.trim() || !p.rut.trim());
    const menoresSinAutorizacion = pasajeros.filter(p => p.esMenor && (!p.autorizacionFile || !p.autorizacionFile.trim()));

    if (datosIncompletos.length > 0) {
      return `Completa los datos de ${datosIncompletos.length} pasajero(s)`;
    }
    if (menoresSinAutorizacion.length > 0) {
      return `Sube la autorización de ${menoresSinAutorizacion.length} menor(es)`;
    }
    return '';
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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold theme-text-primary text-lg">
                        Pasajero {index + 1}
                      </h3>
                      {index === 0 && (
                        <button
                          type="button"
                          onClick={() => copiarDatosComprador(0)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          📋 Copiar datos del comprador
                        </button>
                      )}
                    </div>

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
                            <label className="block text-xs text-yellow-900 font-medium mb-2">
                              Subir autorización firmada *
                            </label>

                            <div className="flex gap-2 mb-2">
                              <button
                                type="button"
                                onClick={() => handleCapturePhoto(index)}
                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center justify-center gap-2"
                              >
                                📸 Tomar Foto
                              </button>
                              <label className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                📁 Subir Archivo
                                <input
                                  type="file"
                                  accept="application/pdf,image/jpeg,image/jpg,image/png,image/heic,image/heif"
                                  onChange={(e) => handleFileUpload(index, e)}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <p className="text-xs text-yellow-800 mt-1">
                              💡 Usa &quot;Tomar Foto&quot; para capturar con la cámara o &quot;Subir Archivo&quot; para elegir uno existente (máx. 5MB)
                            </p>

                            {pasajero.autorizacionFileName && (
                              <div className="mt-3">
                                <p className="text-xs text-green-700 font-medium flex items-center gap-1 mb-2">
                                  <span>✅</span>
                                  <span>Documento subido: {pasajero.autorizacionFileName}</span>
                                </p>

                                {/* Vista previa del documento */}
                                {pasajero.autorizacionFile && (
                                  <div className="border-2 border-green-300 rounded-lg p-3 bg-green-50">
                                    {pasajero.autorizacionFile.startsWith('data:application/pdf') ? (
                                      <div>
                                        <p className="text-xs font-medium text-gray-700 mb-2">Vista previa PDF:</p>
                                        <iframe
                                          src={pasajero.autorizacionFile}
                                          className="w-full h-64 border border-gray-300 rounded"
                                          title="Vista previa PDF"
                                        />
                                        <a
                                          href={pasajero.autorizacionFile}
                                          download={pasajero.autorizacionFileName}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                                        >
                                          📥 Descargar PDF
                                        </a>
                                      </div>
                                    ) : (
                                      <div>
                                        <p className="text-xs font-medium text-gray-700 mb-2">Vista previa de imagen:</p>
                                        <img
                                          src={pasajero.autorizacionFile}
                                          alt="Vista previa"
                                          className="max-w-full h-48 object-contain rounded border border-gray-300 bg-white"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {!canGoToStep4() && getBotonDeshabilitadoMensaje() && (
              <div className="bg-amber-100 border border-amber-400 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800 font-medium">
                  ⚠️ {getBotonDeshabilitadoMensaje()}
                </p>
              </div>
            )}

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
              <p className="theme-text-muted text-sm mb-4">
                Al seleccionar un vuelo, los cupos quedarán reservados por 5 minutos.
              </p>

              {/* Información sobre reprogramación */}
              <div className="mt-4 p-4 theme-info-box rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">ℹ️</div>
                  <div>
                    <h3 className="font-semibold theme-info-text text-sm mb-2">
                      Información importante sobre horarios
                    </h3>
                    <p className="text-xs theme-info-text mb-2">
                      Las horas de vuelo indicadas son estimadas y pueden variar por motivos técnicos o meteorológicos.
                    </p>
                    <p className="text-xs theme-info-text">
                      En caso de cambios, serás notificado a través de esta aplicación y podrás:
                    </p>
                    <ul className="text-xs theme-info-text mt-2 ml-4 space-y-1">
                      <li>✓ Aceptar la nueva hora reprogramada</li>
                      <li>✓ Rechazar y solicitar devolución de tu pago</li>
                      <li>✓ Elegir un nuevo circuito disponible sin cargo adicional</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Opción de viajar juntos o separados */}
            {cantidadPasajeros > 1 && (
              <div className="theme-bg-card rounded-2xl p-6 theme-shadow-md">
                <h3 className="font-semibold theme-text-primary mb-4">
                  ¿Los pasajeros viajarán juntos o en vuelos separados?
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setViajanJuntos(true);
                      setAsignacionesIndividuales({});
                    }}
                    className={`py-4 px-6 rounded-xl font-medium transition-all ${
                      viajanJuntos
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'theme-input theme-text-secondary hover:theme-bg-secondary border theme-border'
                    }`}
                  >
                    <div className="text-3xl mb-2">👥</div>
                    <div className="font-bold mb-1">Viajar Juntos</div>
                    <div className="text-xs opacity-80">
                      Todos en el mismo vuelo
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setViajanJuntos(false);
                      setSelectedFlight(null);
                      setReservationId(null);
                    }}
                    className={`py-4 px-6 rounded-xl font-medium transition-all ${
                      !viajanJuntos
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'theme-input theme-text-secondary hover:theme-bg-secondary border theme-border'
                    }`}
                  >
                    <div className="text-3xl mb-2">✈️✈️</div>
                    <div className="font-bold mb-1">Vuelos Separados</div>
                    <div className="text-xs opacity-80">
                      Asignar individualmente
                    </div>
                  </button>
                </div>
              </div>
            )}

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
            ) : viajanJuntos ? (
              // UI para viajar juntos (todos en el mismo vuelo)
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
                        <div className="flex items-start justify-between">
                          <div>
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
                          {primerVuelo.hora_prevista_salida && (
                            <div className="text-right">
                              <p className="text-xs theme-text-muted">Hora prevista</p>
                              <p className="text-xl font-bold theme-text-primary">
                                {(() => {
                                  const date = new Date(primerVuelo.hora_prevista_salida);
                                  const hours = String(date.getUTCHours()).padStart(2, '0');
                                  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                                  return `${hours}:${minutes}`;
                                })()}
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
            ) : (
              // UI para asignación individual (pasajeros en vuelos separados)
              <div className="space-y-4">
                {pasajeros.map((pasajero, pasajeroIndex) => (
                  <div
                    key={pasajeroIndex}
                    className="theme-bg-card rounded-2xl p-6 theme-shadow-md"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-bold theme-text-primary">
                        {pasajero.nombre} {pasajero.apellido}
                      </h3>
                      <p className="text-sm theme-text-muted">
                        {pasajero.esMenor && '👶 Menor de edad • '}
                        RUT: {pasajero.rut || 'Sin especificar'}
                      </p>
                    </div>

                    {asignacionesIndividuales[pasajeroIndex] ? (
                      // Vuelo ya seleccionado
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-green-800 mb-1">
                              ✓ Vuelo asignado
                            </p>
                            <p className="text-lg font-bold theme-text-primary">
                              {asignacionesIndividuales[pasajeroIndex]?.aircraftId.matricula} - Circuito #{asignacionesIndividuales[pasajeroIndex]?.numero_circuito}
                            </p>
                            <p className="text-xs theme-text-muted mt-1">
                              {asignacionesIndividuales[pasajeroIndex]?.aircraftId.modelo}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevas = { ...asignacionesIndividuales };
                              delete nuevas[pasajeroIndex];
                              setAsignacionesIndividuales(nuevas);
                            }}
                            className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                          >
                            Cambiar
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Selector de vuelo
                      <div className="space-y-3">
                        <p className="text-sm theme-text-secondary font-medium">
                          Selecciona un vuelo:
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {flights
                            .filter(f => (f.capacidad_total - f.asientos_ocupados) >= 1)
                            .map((flight) => (
                              <button
                                key={flight._id}
                                type="button"
                                onClick={() => {
                                  setAsignacionesIndividuales({
                                    ...asignacionesIndividuales,
                                    [pasajeroIndex]: flight
                                  });
                                }}
                                className="p-4 rounded-lg border-2 theme-border hover:border-blue-400 text-left transition-all hover:shadow-lg"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">✈️</span>
                                  <div>
                                    <p className="font-bold theme-text-primary">
                                      {flight.aircraftId.matricula}
                                    </p>
                                    <p className="text-xs theme-text-muted">
                                      Circuito #{flight.numero_circuito}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-xs theme-text-muted">
                                  {new Date(flight.fecha_hora).toLocaleDateString('es-CL')}
                                  {flight.hora_prevista_salida && ` • ${new Date(flight.hora_prevista_salida).getUTCHours()}:${String(new Date(flight.hora_prevista_salida).getUTCMinutes()).padStart(2, '0')}`}
                                </div>
                                <div className="text-xs theme-text-secondary mt-2">
                                  {flight.capacidad_total - flight.asientos_ocupados} cupos disponibles
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Botón para continuar cuando todos están asignados */}
                {Object.keys(asignacionesIndividuales).length === pasajeros.length && (
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        // Crear reservaciones para cada vuelo único
                        const vuelosUnicos = Array.from(new Set(Object.values(asignacionesIndividuales).map(f => f?._id)));
                        // Por simplicidad, continuar a step 5 con las asignaciones
                        setStep(5);
                      } catch (error) {
                        alert('Error al procesar las reservaciones');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : 'Continuar a Confirmación'}
                  </button>
                )}
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

      {/* Modal de cámara web */}
      {showWebcam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="theme-bg-card rounded-2xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold theme-text-primary">📸 Capturar Foto</h3>
              <button
                onClick={closeWebcam}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="space-y-4">
              {/* Video preview */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
              </div>

              {/* Canvas oculto para capturar */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Botón para capturar */}
              <button
                onClick={capturePhotoFromWebcam}
                className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 transition"
              >
                📷 Capturar Foto
              </button>

              <p className="text-xs theme-text-muted text-center">
                Centra el documento en el cuadro y presiona &quot;Capturar Foto&quot;
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
