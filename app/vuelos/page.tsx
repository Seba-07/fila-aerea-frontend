'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { flightsAPI, api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function VuelosPage() {
  const router = useRouter();
  const { user, tickets, isAuthenticated } = useAuthStore();
  const [flights, setFlights] = useState<any[]>([]);
  const [aircrafts, setAircrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTanda, setShowCreateTanda] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState<string | null>(null);
  const [newCapacity, setNewCapacity] = useState<number>(0);
  const [editingTanda, setEditingTanda] = useState<number | null>(null);
  const [editingHoraTanda, setEditingHoraTanda] = useState<number | null>(null);
  const [newHoraPrevista, setNewHoraPrevista] = useState<string>('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleFlightId, setRescheduleFlightId] = useState<string | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState<'combustible' | 'meteorologia' | 'mantenimiento'>('combustible');

  // Form state para nueva tanda
  const [numeroTanda, setNumeroTanda] = useState<number>(1);
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

      const [flightsRes, aircraftsRes] = await Promise.all([
        flightsAPI.getFlights(estadosFilter),
        api.get('/staff/aircrafts').catch(() => ({ data: [] })), // Ignorar error si no es staff
      ]);

      setFlights(flightsRes.data);
      setAircrafts(aircraftsRes.data);

      // Calcular siguiente número de tanda
      if (flightsRes.data.length > 0) {
        const maxTanda = Math.max(...flightsRes.data.map((f: any) => f.numero_tanda));
        setNumeroTanda(maxTanda + 1);
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
      alert(`Vuelo reprogramado exitosamente a Tanda ${data.tanda_nueva}.\n${data.pasajeros_afectados} pasajero(s) notificado(s).`);
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

  const handleCreateTanda = async () => {
    if (!numeroTanda || !fecha || !horaPrevista || selectedAircrafts.length === 0) {
      alert('Completa todos los campos y selecciona al menos un avión');
      return;
    }

    try {
      // Crear fecha con hora local (sin conversión UTC)
      const [year, month, day] = fecha.split('-');
      const [hours, minutes] = horaPrevista.split(':');

      const fechaHora = new Date(
        parseInt(year),
        parseInt(month) - 1, // Los meses en JS son 0-indexed
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        0,
        0
      );

      await api.post('/staff/tandas', {
        numero_tanda: numeroTanda,
        fecha_hora: fechaHora.toISOString(),
        hora_prevista: horaPrevista,
        aircraftIds: selectedAircrafts,
      });

      alert('Tanda creada exitosamente');
      setShowCreateTanda(false);
      setSelectedAircrafts([]);
      setFecha('');
      setHoraPrevista('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear tanda');
    }
  };

  const handleEditTanda = (numero_tanda: number) => {
    // Solo incluir vuelos activos (no reprogramados ni cancelados)
    const tandaFlights = flights.filter(
      f => f.numero_tanda === numero_tanda &&
      f.estado !== 'reprogramado' &&
      f.estado !== 'cancelado'
    );
    setSelectedAircrafts(tandaFlights.map(f => f.aircraftId._id || f.aircraftId));
    setEditingTanda(numero_tanda);
  };

  const handleAddAircraftToTanda = async (numero_tanda: number, aircraftId: string) => {
    try {
      const tanda = flights.find(f => f.numero_tanda === numero_tanda);
      await api.post('/staff/tandas', {
        numero_tanda,
        fecha_hora: tanda.fecha_hora,
        aircraftIds: [aircraftId],
      });
      alert('Avión agregado a la tanda exitosamente');

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
      alert('Avión eliminado de la tanda exitosamente');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar avión de la tanda');
    }
  };

  const handleDeleteTanda = async (numero_tanda: number) => {
    if (!confirm(`¿Eliminar la Tanda #${numero_tanda}?`)) return;

    try {
      await api.delete(`/staff/tandas/${numero_tanda}`);
      alert('Tanda eliminada exitosamente');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar tanda');
    }
  };

  const handleEditHoraPrevista = (numero_tanda: number, hora_actual: string) => {
    setEditingHoraTanda(numero_tanda);
    // Convertir a formato HH:MM para el input
    const fecha = new Date(hora_actual);
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    setNewHoraPrevista(`${horas}:${minutos}`);
  };

  const handleSaveHoraPrevista = async (numero_tanda: number) => {
    if (!newHoraPrevista) {
      alert('Debes ingresar una hora válida');
      return;
    }

    try {
      await api.patch(`/settings/flights/tanda/${numero_tanda}/hora-prevista`, {
        nueva_hora: newHoraPrevista,
      });
      alert('Hora prevista actualizada. Las siguientes tandas han sido recalculadas.');
      setEditingHoraTanda(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar hora prevista');
    }
  };

  // Agrupar vuelos por número de tanda
  const flightsByTanda = flights.reduce((acc, flight) => {
    const tandaNum = flight.numero_tanda;
    if (!acc[tandaNum]) {
      acc[tandaNum] = [];
    }
    acc[tandaNum].push(flight);
    return acc;
  }, {} as Record<number, any[]>);

  const tandasOrdenadas = Object.keys(flightsByTanda)
    .map(Number)
    .sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="text-white text-xl font-medium">Cargando vuelos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-white hover:text-primary transition">
            ← Volver
          </button>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold text-white">Tandas de Vuelo</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Botón para crear tanda (solo staff) */}
        {user?.rol === 'staff' && (
          <div className="mb-6">
            <button
              onClick={() => setShowCreateTanda(!showCreateTanda)}
              className="px-6 py-3 bg-blue-600/90 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
            >
              {showCreateTanda ? 'Cancelar' : '+ Crear Nueva Tanda'}
            </button>
          </div>
        )}

        {/* Formulario crear tanda */}
        {showCreateTanda && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Nueva Tanda</h2>

            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Número de Tanda:</label>
                <input
                  type="text"
                  value={numeroTanda}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setNumeroTanda(val ? Number(val) : 1);
                  }}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Fecha:</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora Prevista de Salida:</label>
                <input
                  type="time"
                  value={horaPrevista}
                  onChange={(e) => setHoraPrevista(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Seleccionar Aviones:</label>
              <div className="grid gap-2 md:grid-cols-3">
                {aircrafts.filter(a => a.habilitado).map((aircraft) => (
                  <label
                    key={aircraft._id}
                    className={`flex items-center gap-2 p-3 rounded cursor-pointer transition ${
                      selectedAircrafts.includes(aircraft._id)
                        ? 'bg-primary text-white'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
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
              onClick={handleCreateTanda}
              className="w-full px-6 py-3 bg-blue-600/90 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
            >
              Crear Tanda
            </button>
          </div>
        )}

        {/* Listado de tandas */}
        {flights.length === 0 ? (
          <div className="text-center text-slate-300 py-12">
            <p className="text-xl">No hay tandas disponibles</p>
          </div>
        ) : (
          <div className="space-y-8">
            {tandasOrdenadas.map((tandaNum) => {
              const vuelosTanda = flightsByTanda[tandaNum];

              return (
                <div key={tandaNum} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
                  {/* Header de la Tanda */}
                  <div className="mb-6 pb-4 border-b border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold text-white">Tanda #{tandaNum}</h2>
                        <p className="text-sm text-slate-400 mt-1">
                          {new Date(vuelosTanda[0].fecha_hora).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      {user?.rol === 'staff' && (
                        <div className="flex gap-2">
                          {editingTanda === tandaNum ? (
                            <button
                              onClick={() => {
                                setEditingTanda(null);
                                setSelectedAircrafts([]);
                              }}
                              className="px-4 py-2 bg-slate-600/80 text-white rounded hover:bg-slate-600 text-sm font-medium transition-colors"
                            >
                              Cancelar Edición
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEditTanda(tandaNum)}
                              className="px-4 py-2 bg-blue-600/80 text-white rounded hover:bg-blue-600 text-sm font-medium transition-colors"
                            >
                              Editar Tanda
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTanda(tandaNum)}
                            className="px-4 py-2 bg-red-600/80 text-white rounded hover:bg-red-600 text-sm font-medium transition-colors"
                          >
                            Eliminar Tanda
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hora prevista - Editable para staff */}
                    {editingHoraTanda === tandaNum ? (
                      <div className="flex items-center gap-3 mt-3">
                        <label className="text-sm text-slate-400">🕐 Hora prevista:</label>
                        <input
                          type="time"
                          value={newHoraPrevista}
                          onChange={(e) => setNewHoraPrevista(e.target.value)}
                          className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        />
                        <button
                          onClick={() => handleSaveHoraPrevista(tandaNum)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingHoraTanda(null)}
                          className="px-3 py-1 bg-slate-600 text-white rounded hover:bg-slate-700 text-xs font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-3">
                        {vuelosTanda[0].hora_prevista_salida ? (
                          <>
                            <p className="text-lg text-blue-400 font-semibold">
                              🕐 Hora prevista: {new Date(vuelosTanda[0].hora_prevista_salida).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </p>
                            {user?.rol === 'staff' && vuelosTanda[0].estado === 'abierto' && (
                              <button
                                onClick={() => handleEditHoraPrevista(tandaNum, vuelosTanda[0].hora_prevista_salida)}
                                className="text-xs text-blue-400 hover:text-blue-300 ml-2"
                              >
                                ✏️ Editar
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-slate-400">🕐 Sin hora prevista configurada</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sección de agregar avión */}
                  {user?.rol === 'staff' && editingTanda === tandaNum && (
                    <div className="mb-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                      <h3 className="text-white font-medium mb-3">Agregar Avión a la Tanda</h3>
                      <div className="grid gap-2 md:grid-cols-3">
                        {aircrafts
                          .filter(a => a.habilitado && !selectedAircrafts.includes(a._id))
                          .map((aircraft) => (
                            <button
                              key={aircraft._id}
                              onClick={() => handleAddAircraftToTanda(tandaNum, aircraft._id)}
                              className="flex items-center gap-2 p-3 rounded bg-slate-600 text-slate-300 hover:bg-slate-500 transition text-left"
                            >
                              <div>
                                <p className="font-medium text-sm">{aircraft.matricula}</p>
                                <p className="text-xs opacity-80">{aircraft.modelo} ({aircraft.capacidad} asientos)</p>
                              </div>
                            </button>
                          ))}
                      </div>
                      {aircrafts.filter(a => a.habilitado && !selectedAircrafts.includes(a._id)).length === 0 && (
                        <p className="text-slate-400 text-sm">No hay más aviones disponibles para agregar</p>
                      )}
                    </div>
                  )}

                  {/* Fichas de Aviones */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vuelosTanda.map((flight: any) => {
                      const asientosOcupados = flight.asientos_ocupados || 0;
                      const capacidadTotal = flight.capacidad_total || 0;
                      const asientosDisponibles = capacidadTotal - asientosOcupados;

                      return (
                        <div
                          key={flight._id}
                          className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border border-slate-600 p-5 hover:shadow-xl hover:scale-105 transition-all relative"
                        >
                          {/* Botón eliminar avión de tanda */}
                          {user?.rol === 'staff' && editingTanda === tandaNum && flight.asientos_ocupados === 0 && (
                            <button
                              onClick={() => handleRemoveAircraftFromTanda(flight._id)}
                              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-600/80 text-white rounded-full hover:bg-red-600 text-xs font-bold transition-colors"
                              title="Eliminar avión de la tanda"
                            >
                              ✕
                            </button>
                          )}

                          {/* Info del Avión */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-lg text-white">{flight.aircraftId?.matricula}</h3>
                              {/* Botón cancelar avión por el día */}
                              {user?.rol === 'staff' && flight.estado === 'abierto' && (
                                <button
                                  onClick={() => handleCancelAircraftForDay(flight._id, flight.aircraftId?.matricula)}
                                  className="px-3 py-1 bg-red-600/80 text-white rounded hover:bg-red-600 text-xs font-medium transition-colors"
                                  title="Cancelar avión por el día"
                                >
                                  Cancelar Día
                                </button>
                              )}
                              {(!user || user?.rol !== 'staff' || flight.estado !== 'abierto') && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium border bg-transparent">
                                  {/* Placeholder vacío */}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">{flight.aircraftId?.modelo}</p>
                          </div>

                          {/* Asientos */}
                          {editingCapacity === flight._id ? (
                            <div className="my-4 p-4 bg-slate-900/50 rounded-lg">
                              <label className="block text-xs text-slate-400 mb-1">Nueva capacidad:</label>
                              <input
                                type="number"
                                min="1"
                                value={newCapacity}
                                onChange={(e) => setNewCapacity(Number(e.target.value))}
                                className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleUpdateFlightCapacity(flight._id)}
                                  className="flex-1 px-2 py-1 bg-blue-600/80 text-white rounded hover:bg-blue-600 text-xs transition-colors"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditingCapacity(null)}
                                  className="flex-1 px-2 py-1 bg-slate-700/80 text-white rounded hover:bg-slate-700 text-xs transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center my-4 p-4 bg-slate-900/50 rounded-lg">
                              <div className="text-center flex-1">
                                <p className="text-3xl font-black text-primary">{asientosDisponibles}</p>
                                <p className="text-xs text-slate-400">asientos libres</p>
                              </div>
                              {user?.rol === 'staff' && flight.estado === 'abierto' && (
                                <button
                                  onClick={() => {
                                    setEditingCapacity(flight._id);
                                    setNewCapacity(capacidadTotal);
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300"
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
                              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                            >
                              Inscribirse
                            </button>
                          )}

                          {/* Controles Staff */}
                          {user?.rol === 'staff' && (
                            <div className="space-y-2">
                                {flight.estado === 'abierto' && (
                                  <>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleOpenRescheduleModal(flight._id)}
                                        className="flex-1 px-3 py-1.5 bg-amber-600/80 text-white rounded hover:bg-amber-600 text-xs font-medium transition-colors"
                                      >
                                        Reprogramar
                                      </button>
                                      <button
                                        onClick={() => handleChangeState(flight._id, 'en_vuelo')}
                                        className="flex-1 px-3 py-1.5 bg-blue-600/80 text-white rounded hover:bg-blue-600 text-xs font-medium transition-colors"
                                      >
                                        En Vuelo
                                      </button>
                                    </div>
                                    {/* Badge de estado */}
                                    <div className="w-full flex justify-center">
                                      <span
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                                          flight.estado === 'abierto'
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                            : flight.estado === 'en_vuelo'
                                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                            : flight.estado === 'finalizado'
                                            ? 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                                            : flight.estado === 'reprogramado'
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                            : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                                        }`}
                                      >
                                        {flight.estado.toUpperCase().replace('_', ' ')}
                                      </span>
                                    </div>
                                  </>
                                )}
                                {flight.estado === 'en_vuelo' && (
                                  <button
                                    onClick={() => handleChangeState(flight._id, 'finalizado')}
                                    className="w-full px-3 py-1.5 bg-slate-600/80 text-white rounded hover:bg-slate-600 text-xs font-medium transition-colors"
                                  >
                                    Finalizado
                                  </button>
                                )}
                            </div>
                          )}

                          {/* Lista de Pasajeros - Siempre visible */}
                          <div className="mt-3 pt-3 border-t border-slate-600">
                            <p className="text-xs font-semibold text-slate-300 mb-2">
                              Pasajeros: {flight.pasajeros_inscritos?.length || 0}
                            </p>
                            {flight.pasajeros_inscritos && flight.pasajeros_inscritos.length > 0 ? (
                              <div className="space-y-2">
                                {flight.pasajeros_inscritos.map((inscrito: any, idx: number) => (
                                  <div key={idx} className="bg-slate-600/50 rounded p-2 flex items-center justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-white">
                                        {inscrito.pasajeros && inscrito.pasajeros[0]?.nombre}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {inscrito.usuario?.nombre} ({inscrito.usuario?.email})
                                      </p>
                                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                                        {inscrito.estado}
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
                              <p className="text-xs text-slate-400">Sin pasajeros inscritos</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Reprogramación */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-4">Reprogramar Vuelo</h2>
              <p className="text-slate-300 text-sm mb-4">
                Selecciona la razón de la reprogramación:
              </p>

              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition">
                  <input
                    type="radio"
                    name="razon"
                    value="combustible"
                    checked={rescheduleReason === 'combustible'}
                    onChange={(e) => setRescheduleReason(e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-white font-medium">Combustible</p>
                    <p className="text-slate-400 text-xs">Falta de combustible</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition">
                  <input
                    type="radio"
                    name="razon"
                    value="meteorologia"
                    checked={rescheduleReason === 'meteorologia'}
                    onChange={(e) => setRescheduleReason(e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-white font-medium">Meteorología</p>
                    <p className="text-slate-400 text-xs">Condiciones climáticas adversas</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition">
                  <input
                    type="radio"
                    name="razon"
                    value="mantenimiento"
                    checked={rescheduleReason === 'mantenimiento'}
                    onChange={(e) => setRescheduleReason(e.target.value as any)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-white font-medium">Mantenimiento</p>
                    <p className="text-slate-400 text-xs">Problemas técnicos o mantenimiento requerido</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmReschedule}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium transition"
                >
                  Confirmar Reprogramación
                </button>
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setRescheduleFlightId(null);
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition"
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
