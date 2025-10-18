'use client';

import ThemeToggle from '@/components/ThemeToggle';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { flightsAPI, api, staffAPI, pilotsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Html5Qrcode } from 'html5-qrcode';

export default function VuelosPage() {
  const router = useRouter();
  const { user, tickets, isAuthenticated } = useAuthStore();
  const [flights, setFlights] = useState<any[]>([]);
  const [aircrafts, setAircrafts] = useState<any[]>([]);
  const [pilots, setPilots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTanda, setShowCreateTanda] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState<string | null>(null);
  const [newCapacity, setNewCapacity] = useState<number>(0);
  const [editingCircuito, setEditingCircuito] = useState<number | null>(null);
  const [editingHoraCircuito, setEditingHoraCircuito] = useState<number | null>(null);
  const [newHoraPrevista, setNewHoraPrevista] = useState<string>('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleFlightId, setRescheduleFlightId] = useState<string | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState<'combustible' | 'meteorologia' | 'mantenimiento'>('combustible');
  const [showCancelAircraftDay, setShowCancelAircraftDay] = useState(false);
  const [editingPilotoFlight, setEditingPilotoFlight] = useState<string | null>(null);
  const [newPilotId, setNewPilotId] = useState<string>('');
  const [editingHoraAterrizajeFlight, setEditingHoraAterrizajeFlight] = useState<string | null>(null);
  const [newHoraAterrizaje, setNewHoraAterrizaje] = useState<string>('');

  // QR Scanner state
  const [scanningCircuito, setScanningCircuito] = useState<number | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Tabs state
  const [selectedCircuitoTab, setSelectedCircuitoTab] = useState<number | null>(null);

  // Form state para nuevo circuito
  const [numeroCircuito, setNumeroCircuito] = useState<string>('');
  const [fecha, setFecha] = useState('');
  const [horaPrevista, setHoraPrevista] = useState('');
  const [selectedAircrafts, setSelectedAircrafts] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      // Para pasajeros, mostrar solo vuelos abiertos. Para staff, mostrar todos los estados activos.
      const estadosFilter = user?.rol === 'staff' ? undefined : 'abierto';

      const [flightsRes, aircraftsRes, pilotsRes] = await Promise.all([
        flightsAPI.getFlights(estadosFilter),
        api.get('/staff/aircrafts').catch(() => ({ data: [] })), // Ignorar error si no es staff
        pilotsAPI.getAll().catch(() => ({ data: [] })), // Ignorar error si no es staff
      ]);

      setFlights(flightsRes.data);
      setAircrafts(aircraftsRes.data);
      setPilots(pilotsRes.data);

      // Calcular siguiente número de circuito
      if (flightsRes.data.length > 0) {
        const maxCircuito = Math.max(...flightsRes.data.map((f: any) => f.numero_circuito));
        setNumeroCircuito(String(maxCircuito + 1));
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeState = async (flightId: string, newState: string) => {
    try {
      if (newState === 'en_vuelo') {
        // Usar endpoint especializado para iniciar vuelo
        await api.patch(`/settings/flights/${flightId}/iniciar`);
        alert('✈️ Vuelo iniciado');
      } else if (newState === 'finalizado') {
        // Usar endpoint especializado para finalizar vuelo (recalcula horas)
        await api.patch(`/settings/flights/${flightId}/finalizar`);
        alert('✅ Vuelo finalizado. Las horas previstas de las siguientes tandas se han recalculado.');
      } else {
        // Para otros estados, usar endpoint genérico
        await flightsAPI.updateFlight(flightId, { estado: newState });
      }
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar vuelo');
    }
  };

  const handleUpdatePiloto = async (flightId: string) => {
    try {
      await flightsAPI.updateFlight(flightId, {
        pilotId: newPilotId || null,
      });
      alert('Piloto actualizado exitosamente');
      setEditingPilotoFlight(null);
      setNewPilotId('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar piloto');
    }
  };

  const handleOpenRescheduleModal = (flightId: string) => {
    setRescheduleFlightId(flightId);
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleFlightId) return;

    try {
      const { data } = await api.post(`/flights/${rescheduleFlightId}/reschedule`, {
        razon: rescheduleReason,
      });
      alert(`Vuelo reprogramado exitosamente a Circuito ${data.circuito_nuevo}.\n${data.pasajeros_afectados} pasajero(s) notificado(s).`);
      setShowRescheduleModal(false);
      setRescheduleFlightId(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al reprogramar vuelo');
    }
  };

  const handleCancelAircraftForDay = async (flightId: string, matricula: string) => {
    if (!confirm(`¿Cancelar el avión ${matricula} por el resto del día?\n\nTodos los vuelos futuros de este avión serán cancelados y los pasajeros serán notificados.`)) return;

    try {
      const { data } = await api.post(`/flights/${flightId}/cancel-aircraft-day`);
      alert(`Avión cancelado por el día.\n${data.vuelos_cancelados} vuelo(s) cancelado(s).\n${data.pasajeros_afectados} pasajero(s) notificado(s).`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cancelar avión');
    }
  };

  const handleEliminarPasajero = async (ticketId: string, passengerName: string) => {
    if (!confirm(`¿Eliminar a ${passengerName} del vuelo?`)) return;

    try {
      await api.delete(`/tickets/${ticketId}/flight`);
      alert('Pasajero removido del vuelo exitosamente');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar pasajero del vuelo');
    }
  };

  const handleUpdateFlightCapacity = async (flightId: string) => {
    if (newCapacity < 1) {
      alert('La capacidad debe ser mayor a 0');
      return;
    }

    try {
      await api.patch(`/flights/${flightId}/capacity`, { capacidad_total: newCapacity });
      alert('Capacidad actualizada exitosamente');
      setEditingCapacity(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar capacidad');
    }
  };

  const handleToggleAircraft = (aircraftId: string) => {
    setSelectedAircrafts((prev) =>
      prev.includes(aircraftId)
        ? prev.filter((id) => id !== aircraftId)
        : [...prev, aircraftId]
    );
  };

  const handleCreateCircuito = async () => {
    // Validar campos obligatorios
    if (!numeroCircuito || !fecha || selectedAircrafts.length === 0) {
      alert('Completa todos los campos y selecciona al menos un avión');
      return;
    }

    // Si es circuito #1, requiere hora prevista
    if (numeroCircuito === '1' && !horaPrevista) {
      alert('Debes ingresar la hora prevista para el Circuito #1');
      return;
    }

    try {
      // Crear fecha con hora local (sin conversión UTC)
      const [year, month, day] = fecha.split('-');

      let fechaHora;
      if (numeroCircuito === '1' && horaPrevista) {
        // Para circuito #1, usar la hora prevista ingresada
        const [hours, minutes] = horaPrevista.split(':');
        fechaHora = new Date(
          parseInt(year),
          parseInt(month) - 1, // Los meses en JS son 0-indexed
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          0,
          0
        );
      } else {
        // Para otros circuitos, usar medianoche (el backend calculará la hora)
        fechaHora = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          0, 0, 0, 0
        );
      }

      await api.post('/staff/circuitos', {
        numero_circuito: parseInt(numeroCircuito),
        fecha_hora: fechaHora.toISOString(),
        hora_prevista: numeroCircuito === '1' ? horaPrevista : undefined,
        aircraftIds: selectedAircrafts,
      });

      alert('Circuito creado exitosamente');
      setShowCreateTanda(false);
      setSelectedAircrafts([]);
      setFecha('');
      setHoraPrevista('');
      setNumeroCircuito('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear circuito');
    }
  };

  const handleEditCircuito = (numero_circuito: number) => {
    // Solo incluir vuelos activos (no reprogramados ni cancelados)
    const circuitoFlights = flights.filter(
      f => f.numero_circuito === numero_circuito &&
      f.estado !== 'reprogramado' &&
      f.estado !== 'cancelado'
    );
    setSelectedAircrafts(circuitoFlights.map(f => f.aircraftId._id || f.aircraftId));
    setEditingCircuito(numero_circuito);
  };

  const handleAddAircraftToCircuito = async (numero_circuito: number, aircraftId: string) => {
    try {
      const circuito = flights.find(f => f.numero_circuito === numero_circuito);
      await api.post('/staff/circuitos', {
        numero_circuito,
        fecha_hora: circuito.fecha_hora,
        aircraftIds: [aircraftId],
      });
      alert('Avión agregado al circuito exitosamente');

      // Actualizar selectedAircrafts para incluir el nuevo avión
      setSelectedAircrafts([...selectedAircrafts, aircraftId]);

      // Recargar datos
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al agregar avión');
    }
  };

  const handleRemoveAircraftFromTanda = async (flightId: string) => {
    if (!confirm('¿Eliminar este avión de la tanda?')) return;

    try {
      await api.delete(`/flights/${flightId}`);
      alert('Avión eliminado del circuito exitosamente');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar avión del circuito');
    }
  };

  const handleDeleteCircuito = async (numero_circuito: number) => {
    if (!confirm(`¿Eliminar el Circuito #${numero_circuito}?`)) return;

    try {
      await api.delete(`/staff/circuitos/${numero_circuito}`);
      alert('Circuito eliminado exitosamente');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar circuito');
    }
  };

  const handleEditHoraPrevista = (numero_circuito: number, hora_actual: string) => {
    setEditingHoraCircuito(numero_circuito);
    // Convertir a formato HH:MM para el input usando UTC
    const fecha = new Date(hora_actual);
    const horas = String(fecha.getUTCHours()).padStart(2, '0');
    const minutos = String(fecha.getUTCMinutes()).padStart(2, '0');
    setNewHoraPrevista(`${horas}:${minutos}`);
  };

  const handleSaveHoraPrevista = async (numero_circuito: number) => {
    if (!newHoraPrevista) {
      alert('Debes ingresar una hora válida');
      return;
    }

    try {
      await api.patch(`/settings/flights/circuito/${numero_circuito}/hora-prevista`, {
        nueva_hora: newHoraPrevista,
      });
      alert('Hora prevista actualizada. Los siguientes circuitos han sido recalculados.');
      setEditingHoraCircuito(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar hora prevista');
    }
  };

  const handleEditHoraAterrizaje = (flightId: string, hora_actual?: string) => {
    setEditingHoraAterrizajeFlight(flightId);
    if (hora_actual) {
      const date = new Date(hora_actual);
      const horas = String(date.getUTCHours()).padStart(2, '0');
      const minutos = String(date.getUTCMinutes()).padStart(2, '0');
      setNewHoraAterrizaje(`${horas}:${minutos}`);
    } else {
      setNewHoraAterrizaje('');
    }
  };

  const handleSaveHoraAterrizaje = async (flightId: string) => {
    if (!newHoraAterrizaje) {
      alert('Debes ingresar una hora válida');
      return;
    }

    try {
      // Obtener el vuelo
      const flight = flights.find(f => f._id === flightId);
      if (!flight) {
        alert('Vuelo no encontrado');
        return;
      }

      // Obtener la fecha base del vuelo
      const fechaVuelo = new Date(flight.fecha_hora);
      const [hours, minutes] = newHoraAterrizaje.split(':');

      // Crear la fecha de aterrizaje usando la fecha del vuelo con la hora especificada
      const fechaAterrizaje = new Date(
        Date.UTC(
          fechaVuelo.getUTCFullYear(),
          fechaVuelo.getUTCMonth(),
          fechaVuelo.getUTCDate(),
          parseInt(hours),
          parseInt(minutes),
          0,
          0
        )
      );

      // Actualizar hora_arribo solo para este vuelo
      await flightsAPI.updateFlight(flightId, {
        hora_arribo: fechaAterrizaje.toISOString(),
      });

      alert('Hora de aterrizaje actualizada exitosamente');
      setEditingHoraAterrizajeFlight(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar hora de aterrizaje');
    }
  };

  // QR Scanner functions
  const startScanner = async (numeroCircuito: number) => {
    try {
      setScanError('');
      setScanResult(null);
      setScanningCircuito(numeroCircuito);

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        // Buscar cámara trasera (back/rear/environment)
        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );

        // Si no encuentra cámara trasera, usar la última (generalmente es la trasera en móviles)
        const selectedCamera = backCamera || devices[devices.length - 1];

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

              // Validar que el circuito del QR coincide con el circuito actual
              if (qrData.circuito && qrData.circuito !== numeroCircuito) {
                setScanError(`Este pasajero está inscrito en el circuito ${qrData.circuito}, no en el circuito ${numeroCircuito}`);
                return;
              }

              const validation = await staffAPI.validateQR(qrData);
              setScanResult(validation.data);

              // Recargar vuelos para actualizar estados
              setTimeout(() => {
                fetchData();
              }, 2000);
            } catch (err: any) {
              // Mejorar mensaje de error
              let errorMessage = 'Código QR inválido o no reconocido';

              if (err.response?.data?.mensaje) {
                errorMessage = err.response.data.mensaje;
              } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
              } else if (err.message && err.message.includes('JSON')) {
                errorMessage = 'El código QR escaneado no es válido para este sistema';
              }

              setScanError(errorMessage);
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

  // Agrupar vuelos por número de circuito
  const flightsByCircuito = flights.reduce((acc, flight) => {
    const circuitoNum = flight.numero_circuito;
    if (!acc[circuitoNum]) {
      acc[circuitoNum] = [];
    }
    acc[circuitoNum].push(flight);
    return acc;
  }, {} as Record<number, any[]>);

  const circuitosOrdenados = Object.keys(flightsByCircuito)
    .map(Number)
    .sort((a, b) => a - b);

  // Inicializar el tab seleccionado con el primer circuito si no hay uno seleccionado
  if (selectedCircuitoTab === null && circuitosOrdenados.length > 0) {
    setSelectedCircuitoTab(circuitosOrdenados[0]);
  }

  // Función para determinar el estado del circuito
  const getCircuitoStatus = (circuitoNum: number) => {
    const vuelos = flightsByCircuito[circuitoNum];
    if (!vuelos || vuelos.length === 0) return 'sin_estado';

    const enVuelo = vuelos.some((v: any) => v.estado === 'en_vuelo');
    const finalizado = vuelos.every((v: any) => v.estado === 'finalizado');
    const abierto = vuelos.some((v: any) => v.estado === 'abierto');

    if (enVuelo) return 'volando';
    if (finalizado) return 'finalizado';
    if (abierto) return 'activo';
    return 'pendiente';
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">Cargando vuelos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <header className="theme-bg-card backdrop-blur-sm border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="theme-text-primary hover:text-primary transition">
            ← Volver
          </button>
          <img
            src="/logo.png"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold theme-text-primary">Circuitos de Vuelo</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Botones para staff */}
        {user?.rol === 'staff' && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={() => setShowCreateTanda(!showCreateTanda)}
              className="px-6 py-3 bg-blue-600/90 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
            >
              {showCreateTanda ? 'Cancelar' : '+ Crear Nuevo Circuito'}
            </button>
            <button
              onClick={() => setShowCancelAircraftDay(!showCancelAircraftDay)}
              className="px-6 py-3 bg-red-600/90 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
            >
              {showCancelAircraftDay ? 'Cancelar' : 'Cancelar Día de Avión'}
            </button>
          </div>
        )}

        {/* Selector para cancelar día de avión */}
        {showCancelAircraftDay && (
          <div className="theme-bg-card backdrop-blur-sm rounded-xl theme-border p-6 mb-8">
            <h2 className="text-xl font-bold theme-text-primary mb-4">Cancelar Día de Avión</h2>
            <p className="text-sm theme-text-muted mb-4">
              Selecciona el avión que deseas cancelar por el resto del día. Todos los vuelos futuros abiertos de este avión serán cancelados.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {aircrafts.filter(a => a.habilitado).map((aircraft) => {
                // Buscar el primer vuelo abierto de este avión
                const firstOpenFlight = flights.find(
                  f => f.aircraftId?._id === aircraft._id && f.estado === 'abierto'
                );
                return (
                  <button
                    key={aircraft._id}
                    onClick={() => {
                      if (firstOpenFlight) {
                        handleCancelAircraftForDay(firstOpenFlight._id, aircraft.matricula);
                        setShowCancelAircraftDay(false);
                      } else {
                        alert(`El avión ${aircraft.matricula} no tiene vuelos abiertos para cancelar.`);
                      }
                    }}
                    className="p-4 theme-input hover:theme-bg-secondary rounded-lg transition-all text-left border theme-border"
                  >
                    <p className="font-bold theme-text-primary">{aircraft.matricula}</p>
                    <p className="text-xs theme-text-muted">{aircraft.modelo}</p>
                    {firstOpenFlight ? (
                      <span className="text-xs text-green-600 mt-1 block">Disponible para cancelar</span>
                    ) : (
                      <span className="text-xs theme-text-muted mt-1 block">Sin vuelos abiertos</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Formulario crear circuito */}
        {showCreateTanda && (
          <div className="theme-bg-card backdrop-blur-sm rounded-xl theme-border p-6 mb-8">
            <h2 className="text-xl font-bold theme-text-primary mb-4">Nuevo Circuito</h2>

            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div>
                <label className="block text-sm theme-text-muted mb-1">Número de Circuito:</label>
                <input
                  type="number"
                  min="1"
                  value={numeroCircuito}
                  onChange={(e) => setNumeroCircuito(e.target.value)}
                  className="w-full px-3 py-2 theme-bg-secondary border theme-border rounded theme-text-primary"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm theme-text-muted mb-1">Fecha:</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 theme-bg-secondary border theme-border rounded theme-text-primary"
                />
              </div>
            </div>

            {/* Campo de hora prevista solo para circuito #1 */}
            {numeroCircuito === '1' && (
              <div className="mb-4">
                <label className="block text-sm theme-text-muted mb-1">Hora Prevista de Salida (solo para Circuito #1):</label>
                <input
                  type="time"
                  value={horaPrevista}
                  onChange={(e) => setHoraPrevista(e.target.value)}
                  className="w-full px-3 py-2 theme-bg-secondary border theme-border rounded theme-text-primary"
                />
                <p className="text-xs theme-text-muted mt-1">
                  💡 Los siguientes circuitos calcularán su hora automáticamente según la duración configurada
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm theme-text-muted mb-2">Seleccionar Aviones:</label>
              <div className="grid gap-2 md:grid-cols-3">
                {aircrafts.filter(a => a.habilitado).map((aircraft) => (
                  <label
                    key={aircraft._id}
                    className={`flex items-center gap-2 p-3 rounded cursor-pointer transition ${
                      selectedAircrafts.includes(aircraft._id)
                        ? 'bg-primary theme-text-primary'
                        : 'theme-bg-secondary theme-text-secondary hover:bg-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAircrafts.includes(aircraft._id)}
                      onChange={() => handleToggleAircraft(aircraft._id)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium text-sm">{aircraft.matricula}</p>
                      <p className="text-xs opacity-80">{aircraft.modelo} ({aircraft.capacidad} asientos)</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateCircuito}
              className="w-full px-6 py-3 bg-blue-600/90 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
            >
              Crear Circuito
            </button>
          </div>
        )}

        {/* Tabs de circuitos */}
        {flights.length === 0 ? (
          <div className="text-center theme-text-secondary py-12">
            <p className="text-xl">No hay circuitos disponibles</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-2">
                {circuitosOrdenados.map((circuitoNum) => {
                  const vuelos = flightsByCircuito[circuitoNum];
                  const horaPrevista = vuelos[0]?.hora_prevista_salida;
                  const status = getCircuitoStatus(circuitoNum);
                  const isSelected = selectedCircuitoTab === circuitoNum;

                  return (
                    <button
                      key={circuitoNum}
                      onClick={() => {
                        setSelectedCircuitoTab(circuitoNum);
                        resetScan();
                      }}
                      className={`px-6 py-3 rounded-lg font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'theme-bg-card theme-text-primary hover:theme-bg-secondary'
                      }`}
                    >
                      <div className="text-center min-w-[120px]">
                        <div className="text-lg font-bold">Circuito #{circuitoNum}</div>
                        {horaPrevista && (
                          <div className="text-xs opacity-90 mt-1">
                            {(() => {
                              const date = new Date(horaPrevista);
                              const hours = String(date.getUTCHours()).padStart(2, '0');
                              const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                              return `${hours}:${minutes}`;
                            })()}
                          </div>
                        )}
                        <div className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${
                          status === 'activo' ? 'bg-green-500/20 text-green-300' :
                          status === 'volando' ? 'bg-blue-500/20 text-blue-300' :
                          status === 'finalizado' ? 'bg-gray-500/20 text-gray-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {status === 'activo' ? '● Activo' :
                           status === 'volando' ? '✈ Volando' :
                           status === 'finalizado' ? '✓ Finalizado' :
                           '○ Pendiente'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contenido del circuito seleccionado */}
            {selectedCircuitoTab !== null && flightsByCircuito[selectedCircuitoTab] && (
              <div className="theme-bg-card backdrop-blur-sm rounded-2xl theme-border p-6">
                {(() => {
                  const circuitoNum = selectedCircuitoTab;
                  const vuelosCircuito = flightsByCircuito[circuitoNum];

                  return (
                    <>
                  {/* Header del Circuito */}
                  <div className="mb-6 pb-4 border-b theme-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold theme-text-primary">Circuito #{circuitoNum}</h2>
                        <p className="text-sm theme-text-muted mt-1">
                          {new Date(vuelosCircuito[0].fecha_hora).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      {user?.rol === 'staff' && (
                        <div className="flex gap-2">
                          {editingCircuito === circuitoNum ? (
                            <button
                              onClick={() => {
                                setEditingCircuito(null);
                                setSelectedAircrafts([]);
                              }}
                              className="px-4 py-2 theme-bg-secondary/80 theme-text-primary rounded hover:theme-bg-secondary text-sm font-medium transition-colors"
                            >
                              Cancelar Edición
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEditCircuito(circuitoNum)}
                              className="px-4 py-2 bg-blue-600/80 text-white rounded hover:bg-blue-600 text-sm font-medium transition-colors"
                            >
                              Editar Circuito
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCircuito(circuitoNum)}
                            className="px-4 py-2 bg-red-600/80 text-white rounded hover:bg-red-600 text-sm font-medium transition-colors"
                          >
                            Eliminar Circuito
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hora prevista - Editable para staff */}
                    {editingHoraCircuito === circuitoNum ? (
                      <div className="flex items-center gap-3 mt-3">
                        <label className="text-sm theme-text-muted">🕐 Hora prevista:</label>
                        <input
                          type="time"
                          value={newHoraPrevista}
                          onChange={(e) => setNewHoraPrevista(e.target.value)}
                          className="px-3 py-1 theme-input border theme-border rounded theme-text-primary text-sm"
                        />
                        <button
                          onClick={() => handleSaveHoraPrevista(circuitoNum)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingHoraCircuito(null)}
                          className="px-3 py-1 theme-bg-secondary theme-text-primary rounded hover:theme-input text-xs font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-3">
                        {vuelosCircuito[0].hora_prevista_salida ? (
                          <>
                            <p className="text-lg text-blue-400 font-semibold">
                              🕐 Hora prevista: {(() => {
                              const date = new Date(vuelosCircuito[0].hora_prevista_salida);
                              const hours = String(date.getUTCHours()).padStart(2, '0');
                              const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                              return `${hours}:${minutes}`;
                            })()}
                            </p>
                            {user?.rol === 'staff' && vuelosCircuito[0].estado === 'abierto' && (
                              <button
                                onClick={() => handleEditHoraPrevista(circuitoNum, vuelosCircuito[0].hora_prevista_salida)}
                                className="text-xs text-blue-400 hover:text-blue-300 ml-2"
                              >
                                ✏️ Editar
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-sm theme-text-muted">🕐 Sin hora prevista configurada</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Scanner QR para staff - Solo botón */}
                  {user?.rol === 'staff' && (
                    <div className="mb-4 pb-4 border-b theme-border">
                      {/* Botón para activar scanner */}
                      {scanningCircuito !== circuitoNum && !scanResult && (
                        <button
                          onClick={() => startScanner(circuitoNum)}
                          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                          📱 Validar Embarque con QR
                        </button>
                      )}

                      {/* Modal/Ventana de scanner cuando está activo */}
                      {(scanningCircuito === circuitoNum || scanResult || scanError) && (
                        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                          <div className="bg-slate-800 rounded-xl max-w-lg w-full p-6 relative">
                            {/* Botón cerrar */}
                            <button
                              onClick={() => {
                                stopScanner();
                                resetScan();
                              }}
                              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
                            >
                              ✕
                            </button>

                            <h3 className="text-xl font-bold text-white mb-4">
                              📱 Validación de Embarque
                            </h3>

                            {/* Scanner Area */}
                            <div
                              id={`qr-reader-${circuitoNum}`}
                              className={`${scanningCircuito === circuitoNum ? '' : 'hidden'} rounded-lg overflow-hidden mb-4`}
                            ></div>

                            {/* Controles */}
                            {scanningCircuito === circuitoNum && (
                              <button
                                onClick={stopScanner}
                                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition mb-4"
                              >
                                ⏹ Detener Escaneo
                              </button>
                            )}

                            {/* Error */}
                            {scanError && (
                              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                                <p className="text-red-400">{scanError}</p>
                                <button
                                  onClick={() => {
                                    resetScan();
                                    startScanner(circuitoNum);
                                  }}
                                  className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
                                >
                                  🔄 Reintentar
                                </button>
                              </div>
                            )}

                            {/* Resultado */}
                            {scanResult && (
                              <div className={`border rounded-lg p-6 mb-4 ${
                                scanResult.valido
                                  ? 'bg-green-500/10 border-green-500/30'
                                  : 'bg-red-500/10 border-red-500/30'
                              }`}>
                                <div className="text-center mb-4">
                                  <div className="text-6xl mb-3">
                                    {scanResult.valido ? '✅' : '❌'}
                                  </div>
                                  <h4 className={`text-2xl font-bold mb-2 ${
                                    scanResult.valido ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {scanResult.valido ? 'EMBARCADO' : 'INVÁLIDO'}
                                  </h4>
                                  {scanResult.valido && scanResult.ticket && (
                                    <p className="text-lg text-white">
                                      {scanResult.ticket.pasajero?.nombre} {scanResult.ticket.pasajero?.apellido}
                                    </p>
                                  )}
                                  {!scanResult.valido && (
                                    <p className="text-red-300 mt-2">{scanResult.mensaje}</p>
                                  )}
                                </div>

                                <button
                                  onClick={() => {
                                    resetScan();
                                    startScanner(circuitoNum);
                                  }}
                                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
                                >
                                  🔄 Escanear Otro Pasajero
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sección de agregar avión */}
                  {user?.rol === 'staff' && editingCircuito === circuitoNum && (
                    <div className="mb-4 p-4 theme-input/50 rounded-xl border theme-border">
                      <h3 className="theme-text-primary font-medium mb-3">✈️ Agregar Avión al Circuito</h3>
                      <div className="grid gap-3 md:grid-cols-3">
                        {aircrafts
                          .filter(a => a.habilitado && !selectedAircrafts.includes(a._id))
                          .map((aircraft) => (
                            <button
                              key={aircraft._id}
                              onClick={() => handleAddAircraftToCircuito(circuitoNum, aircraft._id)}
                              className="flex items-center justify-between gap-2 p-4 rounded-xl theme-bg-card theme-text-primary border theme-border hover:theme-bg-card-hover hover:border-blue-400 theme-shadow-sm hover:shadow-md transition-all text-left"
                            >
                              <div className="flex-1">
                                <p className="font-bold text-sm">{aircraft.matricula}</p>
                                <p className="text-xs theme-text-muted">{aircraft.modelo} ({aircraft.capacidad} asientos)</p>
                              </div>
                              <div className="text-blue-500 dark:text-blue-400 text-xl font-bold">
                                ➕
                              </div>
                            </button>
                          ))}
                      </div>
                      {aircrafts.filter(a => a.habilitado && !selectedAircrafts.includes(a._id)).length === 0 && (
                        <p className="theme-text-muted text-sm">No hay más aviones disponibles para agregar</p>
                      )}
                    </div>
                  )}

                  {/* Fichas de Aviones */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vuelosCircuito.map((flight: any) => {
                      const asientosOcupados = flight.asientos_ocupados || 0;
                      const capacidadTotal = flight.capacidad_total || 0;
                      const asientosDisponibles = capacidadTotal - asientosOcupados;

                      return (
                        <div
                          key={flight._id}
                          className="theme-flight-card rounded-xl p-4 relative"
                        >
                          {/* Botón eliminar avión de circuito */}
                          {user?.rol === 'staff' && editingCircuito === circuitoNum && flight.asientos_ocupados === 0 && (
                            <button
                              onClick={() => handleRemoveAircraftFromTanda(flight._id)}
                              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full hover:bg-red-700 text-xs font-bold transition-all shadow-md"
                              title="Eliminar avión del circuito"
                            >
                              ✕
                            </button>
                          )}

                          {/* Info del Avión con Estado */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg theme-text-primary">{flight.aircraftId?.matricula}</h3>
                                <p className="text-xs theme-text-muted">{flight.aircraftId?.modelo}</p>
                              </div>
                              {/* Badge de estado - más prominente */}
                              <span
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                                  flight.estado === 'abierto'
                                    ? 'bg-green-600 text-white'
                                    : flight.estado === 'en_vuelo'
                                    ? 'bg-blue-600 text-white'
                                    : flight.estado === 'finalizado'
                                    ? 'bg-gray-600 text-white'
                                    : flight.estado === 'reprogramado'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-gray-500 text-white'
                                }`}
                              >
                                {flight.estado.toUpperCase().replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Asientos - Más compacto */}
                          {editingCapacity === flight._id ? (
                            <div className="my-3 p-3 theme-input rounded-lg">
                              <label className="block text-xs theme-text-muted mb-1">Nueva capacidad:</label>
                              <input
                                type="number"
                                min="1"
                                value={newCapacity}
                                onChange={(e) => setNewCapacity(Number(e.target.value))}
                                className="w-full px-2 py-1 theme-input border theme-border rounded theme-text-primary text-sm"
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleUpdateFlightCapacity(flight._id)}
                                  className="flex-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs transition-all shadow-sm"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditingCapacity(null)}
                                  className="flex-1 px-2 py-1 theme-input theme-text-primary rounded hover:theme-bg-secondary text-xs transition-all"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between my-3 p-2 theme-input rounded-lg">
                              <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-blue-600">{asientosDisponibles}</p>
                                <p className="text-xs theme-text-muted">asientos libres</p>
                              </div>
                              {user?.rol === 'staff' && flight.estado === 'abierto' && (
                                <button
                                  onClick={() => {
                                    setEditingCapacity(flight._id);
                                    setNewCapacity(capacidadTotal);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          )}

                          {/* Piloto - Editable por staff */}
                          {editingPilotoFlight === flight._id ? (
                            <div className="my-3 p-3 theme-input rounded-lg">
                              <label className="block text-xs theme-text-muted mb-1">Seleccionar piloto:</label>
                              <select
                                value={newPilotId}
                                onChange={(e) => setNewPilotId(e.target.value)}
                                className="w-full px-2 py-1 theme-input border theme-border rounded theme-text-primary text-sm"
                              >
                                <option value="">Sin asignar</option>
                                {pilots.map((pilot) => (
                                  <option key={pilot._id} value={pilot._id}>
                                    {pilot.nombre} - {pilot.numero_licencia}
                                  </option>
                                ))}
                              </select>
                              {pilots.length === 0 && (
                                <p className="text-xs text-yellow-500 mt-1">
                                  No hay pilotos registrados. <a href="/staff/pilotos" className="underline">Crear piloto</a>
                                </p>
                              )}
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleUpdatePiloto(flight._id)}
                                  className="flex-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs transition-all shadow-sm"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPilotoFlight(null);
                                    setNewPilotId('');
                                  }}
                                  className="flex-1 px-2 py-1 theme-input theme-text-primary rounded hover:theme-bg-secondary text-xs transition-all"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between my-3 p-2 theme-input rounded-lg">
                              <div>
                                <p className="text-xs theme-text-muted">Piloto al mando</p>
                                <p className="text-sm theme-text-primary font-medium">
                                  {flight.pilotId?.nombre || flight.piloto_nombre || 'Sin asignar'}
                                </p>
                                {flight.pilotId?.numero_licencia && (
                                  <p className="text-xs theme-text-muted">
                                    Lic: {flight.pilotId.numero_licencia}
                                  </p>
                                )}
                              </div>
                              {user?.rol === 'staff' && (
                                <button
                                  onClick={() => {
                                    setEditingPilotoFlight(flight._id);
                                    setNewPilotId(flight.pilotId?._id || '');
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          )}

                          {/* Hora de aterrizaje - Editable por staff */}
                          {editingHoraAterrizajeFlight === flight._id ? (
                            <div className="my-3 p-3 theme-input rounded-lg">
                              <label className="block text-xs theme-text-muted mb-1">Hora de aterrizaje:</label>
                              <input
                                type="time"
                                value={newHoraAterrizaje}
                                onChange={(e) => setNewHoraAterrizaje(e.target.value)}
                                className="w-full px-2 py-1 theme-input border theme-border rounded theme-text-primary text-sm"
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleSaveHoraAterrizaje(flight._id)}
                                  className="flex-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs transition-all shadow-sm"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingHoraAterrizajeFlight(null);
                                    setNewHoraAterrizaje('');
                                  }}
                                  className="flex-1 px-2 py-1 theme-input theme-text-primary rounded hover:theme-bg-secondary text-xs transition-all"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between my-3 p-2 theme-input rounded-lg">
                              <div>
                                <p className="text-xs theme-text-muted">Hora de aterrizaje</p>
                                {flight.hora_arribo ? (
                                  <p className="text-sm theme-text-primary font-medium">
                                    🛬 {(() => {
                                      const date = new Date(flight.hora_arribo);
                                      const hours = String(date.getUTCHours()).padStart(2, '0');
                                      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                                      return `${hours}:${minutes}`;
                                    })()}
                                  </p>
                                ) : (
                                  <p className="text-sm theme-text-muted">No registrada</p>
                                )}
                              </div>
                              {user?.rol === 'staff' && (
                                <button
                                  onClick={() => handleEditHoraAterrizaje(flight._id, flight.hora_arribo)}
                                  className="text-xs text-green-600 hover:text-green-700"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          )}

                          {/* Acciones Pasajero */}
                          {user?.rol === 'passenger' && flight.estado === 'abierto' && asientosDisponibles > 0 && (
                            <button
                              onClick={() => router.push(`/vuelos/${flight._id}`)}
                              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all font-medium text-sm shadow-sm"
                            >
                              Inscribirse
                            </button>
                          )}

                          {/* Controles Staff */}
                          {user?.rol === 'staff' && (
                            <div className="space-y-2">
                                {flight.estado === 'abierto' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleOpenRescheduleModal(flight._id)}
                                      className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-xs font-medium transition-all shadow-sm"
                                    >
                                      Reprogramar
                                    </button>
                                    <button
                                      onClick={() => handleChangeState(flight._id, 'en_vuelo')}
                                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-all shadow-sm"
                                    >
                                      En Vuelo
                                    </button>
                                  </div>
                                )}
                                {flight.estado === 'en_vuelo' && (
                                  <button
                                    onClick={() => handleChangeState(flight._id, 'finalizado')}
                                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs font-medium transition-all shadow-sm"
                                  >
                                    Finalizar
                                  </button>
                                )}
                            </div>
                          )}

                          {/* Lista de Pasajeros - Siempre visible */}
                          <div className="mt-3 pt-3 border-t theme-border">
                            <p className="text-xs font-semibold theme-text-secondary mb-2">
                              Pasajeros: {flight.pasajeros_inscritos?.length || 0}
                            </p>
                            {flight.pasajeros_inscritos && flight.pasajeros_inscritos.length > 0 ? (
                              <div className="space-y-2">
                                {flight.pasajeros_inscritos.map((inscrito: any, idx: number) => (
                                  <div key={idx} className="theme-bg-secondary/50 rounded p-2 flex items-center justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="text-xs font-medium theme-text-primary">
                                        {inscrito.pasajeros && inscrito.pasajeros[0]?.nombre}
                                      </p>
                                      <p className="text-xs theme-text-muted">
                                        {inscrito.usuario?.nombre} ({inscrito.usuario?.email})
                                      </p>
                                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                        inscrito.estado === 'embarcado'
                                          ? 'bg-green-500/20 text-green-300'
                                          : inscrito.estado === 'inscrito'
                                          ? 'bg-blue-500/20 text-blue-300'
                                          : 'bg-gray-500/20 theme-text-secondary'
                                      }`}>
                                        {inscrito.estado === 'embarcado' ? '✓ Embarcado' :
                                         inscrito.estado === 'inscrito' ? 'Inscrito' :
                                         inscrito.estado}
                                      </span>
                                    </div>
                                    {user?.rol === 'staff' && flight.estado === 'abierto' && (
                                      <button
                                        onClick={() => handleEliminarPasajero(inscrito.ticketId, inscrito.pasajeros[0]?.nombre)}
                                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs theme-text-muted">Sin pasajeros inscritos</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {/* Modal de Reprogramación */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="theme-bg-card rounded-2xl theme-border p-6 max-w-md w-full theme-shadow-lg">
              <h2 className="text-2xl font-bold theme-text-primary mb-4">⚠️ Reprogramar Vuelo</h2>
              <p className="theme-text-secondary text-sm mb-4">
                Selecciona la razón de la reprogramación:
              </p>

              <div className="space-y-3 mb-6">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  rescheduleReason === 'combustible'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'theme-border theme-input hover:border-amber-300'
                }`}>
                  <input
                    type="radio"
                    name="razon"
                    value="combustible"
                    checked={rescheduleReason === 'combustible'}
                    onChange={(e) => setRescheduleReason(e.target.value as any)}
                    className="w-4 h-4 text-amber-600"
                  />
                  <div className="flex-1">
                    <p className="theme-text-primary font-semibold">⛽ Combustible</p>
                    <p className="theme-text-muted text-xs">Falta de combustible</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  rescheduleReason === 'meteorologia'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'theme-border theme-input hover:border-amber-300'
                }`}>
                  <input
                    type="radio"
                    name="razon"
                    value="meteorologia"
                    checked={rescheduleReason === 'meteorologia'}
                    onChange={(e) => setRescheduleReason(e.target.value as any)}
                    className="w-4 h-4 text-amber-600"
                  />
                  <div className="flex-1">
                    <p className="theme-text-primary font-semibold">🌧️ Meteorología</p>
                    <p className="theme-text-muted text-xs">Condiciones climáticas adversas</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  rescheduleReason === 'mantenimiento'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'theme-border theme-input hover:border-amber-300'
                }`}>
                  <input
                    type="radio"
                    name="razon"
                    value="mantenimiento"
                    checked={rescheduleReason === 'mantenimiento'}
                    onChange={(e) => setRescheduleReason(e.target.value as any)}
                    className="w-4 h-4 text-amber-600"
                  />
                  <div className="flex-1">
                    <p className="theme-text-primary font-semibold">🔧 Mantenimiento</p>
                    <p className="theme-text-muted text-xs">Problemas técnicos o mantenimiento requerido</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmReschedule}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium transition shadow-md hover:shadow-lg"
                >
                  Confirmar Reprogramación
                </button>
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setRescheduleFlightId(null);
                  }}
                  className="flex-1 theme-input hover:theme-bg-secondary theme-text-primary py-3 rounded-lg font-medium transition border theme-border"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
