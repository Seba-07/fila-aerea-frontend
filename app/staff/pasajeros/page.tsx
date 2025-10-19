'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { staffAPI, flightsAPI, api } from '@/lib/api';

export default function PasajerosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [passengers, setPassengers] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'todos' | 'volados' | 'pendientes'>('pendientes');

  // Estado para editar info básica
  const [editingInfoId, setEditingInfoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Estado para editar tickets
  const [editingTicketsId, setEditingTicketsId] = useState<string | null>(null);
  const [editTicketCount, setEditTicketCount] = useState(0);
  const [montoAjuste, setMontoAjuste] = useState<number | ''>('');
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'passline' | 'efectivo'>('efectivo');

  // Estado para editar pago
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editMontoPagado, setEditMontoPagado] = useState(0);
  const [editMetodoPago, setEditMetodoPago] = useState<'transferencia' | 'passline' | 'efectivo'>('efectivo');

  // Estado para editar pasajeros del ticket
  const [editingTicketPassengerId, setEditingTicketPassengerId] = useState<string | null>(null);
  const [editTicketPassengers, setEditTicketPassengers] = useState<any[]>([]);

  // Estado para eliminar
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [montoDevolucion, setMontoDevolucion] = useState<number | ''>('');
  const [metodoDevolucion, setMetodoDevolucion] = useState<'transferencia' | 'passline' | 'efectivo'>('efectivo');

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
      return;
    }

    fetchPassengers();
  }, [user, router]);

  const fetchPassengers = async () => {
    try {
      const [passengersRes, flightsRes] = await Promise.all([
        staffAPI.getPassengers(),
        flightsAPI.getFlights()
      ]);
      setPassengers(passengersRes.data);
      const sortedFlights = flightsRes.data
        .filter((f: any) => f.estado !== 'finalizado')
        .sort((a: any, b: any) => a.numero_circuito - b.numero_circuito);
      setFlights(sortedFlights);
    } catch (error) {
      console.error('Error al cargar pasajeros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInfo = (passenger: any) => {
    setEditingInfoId(passenger.id);
    setEditNombre(passenger.nombre);
    setEditEmail(passenger.email);
  };

  const handleSaveInfo = async (passengerId: string) => {
    try {
      await staffAPI.updatePassenger(passengerId, {
        nombre: editNombre,
        email: editEmail,
      });
      alert('Información actualizada exitosamente');
      setEditingInfoId(null);
      fetchPassengers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar información');
    }
  };

  const handleEditTickets = (passenger: any) => {
    setEditingTicketsId(passenger.id);
    setEditTicketCount(passenger.tickets_count);
    setMontoAjuste('');
    setMetodoPago('efectivo');
  };

  const handleSaveTickets = async (passengerId: string, currentCount: number) => {
    const diferencia = editTicketCount - currentCount;

    if (diferencia === 0) {
      alert('No hay cambios en la cantidad de tickets');
      return;
    }

    if (!montoAjuste || Number(montoAjuste) <= 0) {
      alert('Debes ingresar el monto del ajuste');
      return;
    }

    try {
      await staffAPI.updatePassengerTickets(passengerId, {
        cantidad_tickets: editTicketCount,
        monto_ajuste: Number(montoAjuste),
        metodo_pago: metodoPago,
      });

      const accion = diferencia > 0 ? 'agregados' : 'eliminados';
      alert(`${Math.abs(diferencia)} tickets ${accion} exitosamente`);
      setEditingTicketsId(null);
      fetchPassengers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar tickets');
    }
  };

  const handleDeleteConfirm = (passengerId: string) => {
    setDeletingId(passengerId);
    setMontoDevolucion('');
    setMetodoDevolucion('efectivo');
  };

  const handleEditPayment = (passenger: any) => {
    setEditingPaymentId(passenger.id);
    setEditMontoPagado(passenger.pago_inicial?.monto || 0);
    setEditMetodoPago(passenger.pago_inicial?.metodo_pago || 'efectivo');
  };

  const handleSavePayment = async (passengerId: string) => {
    try {
      await staffAPI.updatePassengerPayment(passengerId, {
        nuevo_monto: editMontoPagado,
        metodo_pago: editMetodoPago,
      });
      alert('Pago actualizado exitosamente');
      setEditingPaymentId(null);
      fetchPassengers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar pago');
    }
  };

  const handleInscribirTicket = async (ticketId: string, flightId: string) => {
    try {
      await api.patch(`/tickets/${ticketId}`, { flightId });
      alert('Ticket inscrito exitosamente');
      fetchPassengers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al inscribir ticket');
    }
  };

  const handleDesinscribirTicket = async (ticketId: string) => {
    if (!confirm('¿Desinscribir este ticket del vuelo?')) return;
    try {
      await api.delete(`/tickets/${ticketId}/flight`);
      alert('Ticket desinscrito exitosamente');
      fetchPassengers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al desinscribir ticket');
    }
  };

  const handleEditTicketPassengers = (ticket: any) => {
    setEditingTicketPassengerId(ticket.id);
    // Si el ticket tiene pasajeros, usarlos; si no, crear uno vacío
    setEditTicketPassengers(
      ticket.pasajeros && ticket.pasajeros.length > 0
        ? ticket.pasajeros.map((p: any) => ({
            nombre: p.nombre || '',
            apellido: p.apellido || '',
            rut: p.rut || '',
            esMenor: p.esMenor || false,
            esInfante: p.esInfante || false, // Asegurar que siempre sea boolean
          }))
        : [{ nombre: '', apellido: '', rut: '', esMenor: false, esInfante: false }]
    );
  };

  const handleSaveTicketPassengers = async (ticketId: string) => {
    // Filtrar pasajeros vacíos
    const pasajerosValidos = editTicketPassengers.filter(
      p => p.nombre.trim() || p.apellido.trim() || p.rut.trim()
    );

    console.log('Guardando pasajeros:', pasajerosValidos);

    try {
      await staffAPI.updateTicketPassengers(ticketId, {
        pasajeros: pasajerosValidos,
      });
      alert('Información actualizada exitosamente');
      setEditingTicketPassengerId(null);
      fetchPassengers();
    } catch (error: any) {
      console.error('Error al actualizar:', error);
      alert(error.response?.data?.error || 'Error al actualizar información');
    }
  };

  const updateTicketPassengerField = (index: number, field: string, value: any) => {
    const updated = [...editTicketPassengers];
    updated[index] = { ...updated[index], [field]: value };
    console.log(`Actualizando campo ${field} en índice ${index}:`, value, 'Pasajero actualizado:', updated[index]);
    setEditTicketPassengers(updated);
  };

  const handleDelete = async (passengerId: string) => {
    try {
      await staffAPI.deletePassenger(passengerId, {
        monto_devolucion: montoDevolucion ? Number(montoDevolucion) : undefined,
        metodo_pago: montoDevolucion ? metodoDevolucion : undefined,
      });
      alert('Pasajero eliminado exitosamente');
      setDeletingId(null);
      fetchPassengers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar pasajero');
    }
  };

  // Filtrar pasajeros según estado
  const filteredPassengers = passengers.filter(passenger => {
    if (filterStatus === 'todos') return true;

    const hasVoladoTicket = passenger.tickets?.some((t: any) => t.estado === 'volado');
    const hasPendingTicket = passenger.tickets?.some((t: any) =>
      ['disponible', 'inscrito'].includes(t.estado)
    );

    if (filterStatus === 'volados') {
      return hasVoladoTicket;
    } else if (filterStatus === 'pendientes') {
      return hasPendingTicket;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">Cargando pasajeros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      <header className="theme-bg-card backdrop-blur-sm border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="theme-text-primary hover:text-primary transition">
            Volver
          </button>
          <img
            src="/logo.png"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold theme-text-primary">Pasajeros Registrados</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setFilterStatus('todos')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'todos'
                ? 'bg-blue-600 text-white'
                : 'theme-bg-card theme-text-primary hover:theme-bg-secondary'
            }`}
          >
            Todos ({passengers.length})
          </button>
          <button
            onClick={() => setFilterStatus('volados')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'volados'
                ? 'bg-green-600 text-white'
                : 'theme-bg-card theme-text-primary hover:theme-bg-secondary'
            }`}
          >
            Ya volaron ({passengers.filter(p => p.tickets?.some((t: any) => t.estado === 'volado')).length})
          </button>
          <button
            onClick={() => setFilterStatus('pendientes')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'pendientes'
                ? 'bg-yellow-600 text-white'
                : 'theme-bg-card theme-text-primary hover:theme-bg-secondary'
            }`}
          >
            Pendientes por volar ({passengers.filter(p => {
              const hasPending = p.tickets?.some((t: any) => ['disponible', 'inscrito'].includes(t.estado));
              return hasPending;
            }).length})
          </button>
        </div>

        {filteredPassengers.length === 0 ? (
          <div className="text-center theme-text-secondary py-12">
            <p className="text-xl">No hay pasajeros en esta categoría</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPassengers.map((passenger) => (
              <div
                key={passenger.id}
                className="theme-bg-card backdrop-blur-sm theme-border rounded-xl p-4"
              >
                {/* Info básica - Más compacta */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    {editingInfoId === passenger.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          className="w-full px-2 py-1 theme-input border theme-border rounded theme-text-primary text-sm"
                          placeholder="Nombre"
                        />
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-2 py-1 theme-input border theme-border rounded theme-text-primary text-sm"
                          placeholder="Email"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveInfo(passenger.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs font-medium"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingInfoId(null)}
                            className="px-3 py-1 bg-gray-600 theme-text-primary rounded hover:bg-gray-700 transition text-xs font-medium"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-lg theme-text-primary truncate">{passenger.nombre}</h3>
                        <p className="text-xs theme-text-muted truncate">{passenger.email}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <button
                            onClick={() => handleEditInfo(passenger)}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                          >
                            Editar info
                          </button>
                          {passenger.pago_inicial && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs theme-text-secondary">
                                Pagado: ${passenger.total_pagado?.toLocaleString() || 0}
                              </span>
                              <button
                                onClick={() => handleEditPayment(passenger)}
                                className="text-green-400 hover:text-green-300 text-xs"
                              >
                                Editar pago
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Tickets - Más compacto */}
                  <div className="flex items-center gap-2">
                    {editingTicketsId === passenger.id ? (
                      <div className="theme-bg-secondary/50 p-4 rounded-lg space-y-3">
                        <div>
                          <label className="text-xs theme-text-secondary block mb-1">Cantidad de tickets</label>
                          <input
                            type="number"
                            value={editTicketCount}
                            onChange={(e) => setEditTicketCount(parseInt(e.target.value) || 0)}
                            min={0}
                            max={20}
                            className="w-24 px-3 py-2 theme-bg-secondary border theme-border rounded-lg theme-text-primary text-center"
                          />
                        </div>
                        <div>
                          <label className="text-xs theme-text-secondary block mb-1">
                            Monto ajuste * {editTicketCount > passenger.tickets_count ? '(pago extra)' : editTicketCount < passenger.tickets_count ? '(devolución)' : ''}
                          </label>
                          <input
                            type="number"
                            value={montoAjuste}
                            onChange={(e) => setMontoAjuste(e.target.value ? Number(e.target.value) : '')}
                            min={0}
                            required
                            className="w-32 px-3 py-2 theme-bg-secondary border theme-border rounded-lg theme-text-primary"
                            placeholder="$"
                          />
                        </div>
                        <div>
                          <label className="text-xs theme-text-secondary block mb-1">Método de pago</label>
                          <select
                            value={metodoPago}
                            onChange={(e) => setMetodoPago(e.target.value as any)}
                            className="w-full px-3 py-2 theme-bg-secondary border theme-border rounded-lg theme-text-primary"
                          >
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="passline">PassLine</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveTickets(passenger.id, passenger.tickets_count)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingTicketsId(null)}
                            className="px-4 py-2 bg-gray-600 theme-text-primary rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="bg-primary theme-text-primary px-4 py-2 rounded-full text-sm font-bold">
                          {passenger.tickets_count} {passenger.tickets_count === 1 ? 'ticket' : 'tickets'}
                        </span>
                        <button
                          onClick={() => handleEditTickets(passenger)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          Editar tickets
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Modal editar pago */}
                {editingPaymentId === passenger.id && (
                  <div className="mt-4 p-4 theme-bg-secondary/50 border theme-border rounded-lg">
                    <p className="text-sm font-semibold theme-text-primary mb-3">Editar Pago Inicial</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs theme-text-secondary block mb-1">Monto pagado</label>
                        <input
                          type="number"
                          value={editMontoPagado}
                          onChange={(e) => setEditMontoPagado(Number(e.target.value) || 0)}
                          min={0}
                          className="w-full px-3 py-2 theme-input border theme-border rounded-lg theme-text-primary"
                          placeholder="$"
                        />
                      </div>
                      <div>
                        <label className="text-xs theme-text-secondary block mb-1">Método de pago</label>
                        <select
                          value={editMetodoPago}
                          onChange={(e) => setEditMetodoPago(e.target.value as any)}
                          className="w-full px-3 py-2 theme-input border theme-border rounded-lg theme-text-primary"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="passline">PassLine</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSavePayment(passenger.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingPaymentId(null)}
                          className="px-4 py-2 bg-gray-600 theme-text-primary rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal eliminar */}
                {deletingId === passenger.id ? (
                  <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                    <p className="text-red-400 font-semibold mb-3">¿Eliminar pasajero?</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs theme-text-secondary block mb-1">Monto devolución (opcional)</label>
                        <input
                          type="number"
                          value={montoDevolucion}
                          onChange={(e) => setMontoDevolucion(e.target.value ? Number(e.target.value) : '')}
                          min={0}
                          className="w-32 px-3 py-2 theme-input border theme-border rounded-lg theme-text-primary"
                          placeholder="$"
                        />
                      </div>
                      {montoDevolucion && (
                        <div>
                          <label className="text-xs theme-text-secondary block mb-1">Método devolución</label>
                          <select
                            value={metodoDevolucion}
                            onChange={(e) => setMetodoDevolucion(e.target.value as any)}
                            className="w-full px-3 py-2 theme-input border theme-border rounded-lg theme-text-primary"
                          >
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="passline">PassLine</option>
                          </select>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(passenger.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                        >
                          Confirmar eliminación
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-4 py-2 bg-gray-600 theme-text-primary rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDeleteConfirm(passenger.id)}
                    className="mt-2 px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                  >
                    Eliminar pasajero
                  </button>
                )}

                {/* Lista de tickets */}
                {passenger.tickets && passenger.tickets.length > 0 && (
                  <div className="mt-3 pt-3 border-t theme-border">
                    <p className="text-xs font-semibold theme-text-secondary mb-2">Tickets:</p>
                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {passenger.tickets.map((ticket: any) => (
                        <div
                          key={ticket.id}
                          className="theme-bg-secondary/50 rounded-lg p-2 border theme-border"
                        >
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                              ticket.estado === 'disponible'
                                ? 'bg-yellow-400 text-yellow-900'
                                : ticket.estado === 'inscrito'
                                ? 'bg-blue-400 text-blue-900'
                                : ticket.estado === 'volado'
                                ? 'bg-gray-400 text-gray-900'
                                : 'bg-red-400 text-red-900'
                            }`}
                          >
                            {ticket.estado.toUpperCase()}
                          </span>

                          {/* Editar pasajeros del ticket */}
                          {editingTicketPassengerId === ticket.id ? (
                            <div className="mt-2 space-y-2">
                              <p className="text-xs theme-text-muted font-semibold">Editar Pasajero:</p>
                              {editTicketPassengers.map((p: any, idx: number) => {
                                console.log('Renderizando pasajero en edición:', p);
                                return (
                                <div key={idx} className="space-y-1 p-2 theme-bg-primary/30 rounded">
                                  <input
                                    type="text"
                                    value={p.nombre}
                                    onChange={(e) => updateTicketPassengerField(idx, 'nombre', e.target.value)}
                                    placeholder="Nombre"
                                    className="w-full px-2 py-1 text-xs theme-input border theme-border rounded theme-text-primary"
                                  />
                                  <input
                                    type="text"
                                    value={p.apellido}
                                    onChange={(e) => updateTicketPassengerField(idx, 'apellido', e.target.value)}
                                    placeholder="Apellido"
                                    className="w-full px-2 py-1 text-xs theme-input border theme-border rounded theme-text-primary"
                                  />
                                  <input
                                    type="text"
                                    value={p.rut}
                                    onChange={(e) => updateTicketPassengerField(idx, 'rut', e.target.value)}
                                    placeholder="RUT"
                                    className="w-full px-2 py-1 text-xs theme-input border theme-border rounded theme-text-primary"
                                  />
                                  <div className="space-y-2">
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id={`menor-${idx}`}
                                          checked={!!p.esMenor}
                                          onChange={(e) => {
                                            console.log('Checkbox esMenor clicked:', e.target.checked);
                                            updateTicketPassengerField(idx, 'esMenor', e.target.checked);
                                          }}
                                          className="w-4 h-4 cursor-pointer"
                                        />
                                        <label htmlFor={`menor-${idx}`} className="text-xs theme-text-primary cursor-pointer">
                                          Es menor
                                        </label>
                                      </div>

                                      <div className="flex items-center gap-2 relative z-10">
                                        <input
                                          type="checkbox"
                                          id={`infante-${idx}`}
                                          checked={!!p.esInfante}
                                          onClick={(e) => {
                                            console.log('CLICK EVENT - esInfante checkbox clicked!', e);
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Forzar el toggle
                                            updateTicketPassengerField(idx, 'esInfante', !p.esInfante);
                                            if (!p.esInfante) {
                                              updateTicketPassengerField(idx, 'esMenor', true);
                                            }
                                          }}
                                          onChange={(e) => {
                                            console.log('ONCHANGE EVENT - This should not show if onClick works');
                                          }}
                                          className="w-4 h-4 cursor-pointer relative z-20 pointer-events-auto"
                                          style={{ position: 'relative', zIndex: 9999 }}
                                        />
                                        <label
                                          onClick={(e) => {
                                            e.preventDefault();
                                            console.log('Label clicked');
                                            updateTicketPassengerField(idx, 'esInfante', !p.esInfante);
                                            if (!p.esInfante) {
                                              updateTicketPassengerField(idx, 'esMenor', true);
                                            }
                                          }}
                                          className="text-xs theme-text-primary cursor-pointer"
                                        >
                                          👶 No ocupa asiento (infante {"<"} 2 años)
                                        </label>
                                      </div>
                                    </div>
                                    <div className="text-xs theme-text-muted bg-yellow-500/10 p-1 rounded">
                                      DEBUG - Estado: esInfante = {String(!!p.esInfante)} | esMenor = {String(!!p.esMenor)}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        console.log('TEST BUTTON - Toggling esInfante');
                                        updateTicketPassengerField(idx, 'esInfante', !p.esInfante);
                                      }}
                                      className="text-xs px-2 py-1 bg-purple-600 text-white rounded"
                                    >
                                      TEST: Toggle infante
                                    </button>
                                  </div>
                                </div>
                              );
                              })}
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleSaveTicketPassengers(ticket.id)}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditingTicketPassengerId(null)}
                                  className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {ticket.pasajeros && ticket.pasajeros.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs theme-text-muted">Pasajero:</p>
                                  {ticket.pasajeros.map((p: any, idx: number) => (
                                    <div key={idx}>
                                      <p className="text-xs theme-text-primary font-medium">{p.nombre} {p.apellido}</p>
                                      {p.rut && (
                                        <p className="text-xs theme-text-muted">RUT: {p.rut}</p>
                                      )}
                                      <div className="flex gap-1 mt-1">
                                        {p.esMenor && (
                                          <span className="inline-block text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                            Menor
                                          </span>
                                        )}
                                        {p.esInfante && (
                                          <span className="inline-block text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                            👶 No ocupa asiento
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {ticket.estado !== 'volado' && (
                                    <button
                                      onClick={() => handleEditTicketPassengers(ticket)}
                                      className="mt-1 text-xs text-blue-400 hover:text-blue-300"
                                    >
                                      Editar pasajero
                                    </button>
                                  )}
                                </div>
                              )}
                              {(!ticket.pasajeros || ticket.pasajeros.length === 0) && ticket.estado === 'disponible' && (
                                <button
                                  onClick={() => handleEditTicketPassengers(ticket)}
                                  className="mt-2 text-xs text-green-400 hover:text-green-300"
                                >
                                  + Asignar pasajero
                                </button>
                              )}
                            </>
                          )}

                          {/* Inscripción de vuelo */}
                          {ticket.estado !== 'volado' && editingTicketPassengerId !== ticket.id && (
                            <div className="mt-2">
                              {ticket.flightId ? (
                                <div>
                                  <p className="text-xs theme-text-muted">
                                    Vuelo: Circuito #{ticket.flightNumber || 'N/A'}
                                  </p>
                                  {ticket.estado !== 'volado' && (
                                    <button
                                      onClick={() => handleDesinscribirTicket(ticket.id)}
                                      className="mt-1 text-xs text-red-400 hover:text-red-300"
                                    >
                                      Desinscribir
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleInscribirTicket(ticket.id, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="mt-1 w-full px-2 py-1 text-xs theme-bg-secondary border theme-border rounded theme-text-primary"
                                  defaultValue=""
                                >
                                  <option value="">-- Inscribir en vuelo --</option>
                                  {flights.map((flight) => {
                                    const asientosDisponibles = flight.capacidad_total - flight.asientos_ocupados;
                                    return (
                                      <option
                                        key={flight._id}
                                        value={flight._id}
                                        disabled={asientosDisponibles <= 0}
                                      >
                                        C#{flight.numero_circuito} | {flight.aircraftId?.matricula} ({asientosDisponibles}/{flight.capacidad_total})
                                      </option>
                                    );
                                  })}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
