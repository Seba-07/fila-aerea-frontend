'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { userAPI, flightsAPI, api } from '@/lib/api';

export default function MisTicketsPage() {
  const router = useRouter();
  const { user, tickets: storeTickets, updateTickets } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pasajeroNombre, setPasajeroNombre] = useState('');
  const [pasajeroRut, setPasajeroRut] = useState('');
  const [selectedFlight, setSelectedFlight] = useState('');
  const [rescheduleModalTicket, setRescheduleModalTicket] = useState<any | null>(null);
  const [selectedTanda, setSelectedTanda] = useState<number | ''>('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundMethod, setRefundMethod] = useState<string>('efectivo');

  useEffect(() => {
    if (user?.rol !== 'passenger') {
      router.push('/');
      return;
    }

    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      const [profileRes, flightsRes] = await Promise.all([
        userAPI.getMe(),
        flightsAPI.getFlights('abierto')
      ]);

      if (profileRes.data.tickets) {
        setTickets(profileRes.data.tickets);
        updateTickets(profileRes.data.tickets);
      }
      setFlights(flightsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ticket: any) => {
    setEditingId(ticket.id);
    if (ticket.pasajeros && ticket.pasajeros[0]) {
      setPasajeroNombre(ticket.pasajeros[0].nombre || '');
      setPasajeroRut(ticket.pasajeros[0].rut || '');
    } else {
      setPasajeroNombre('');
      setPasajeroRut('');
    }
    setSelectedFlight(ticket.flightId || '');
  };

  const handleSave = async (ticketId: string) => {
    try {
      if (!pasajeroNombre.trim()) {
        alert('Debes ingresar el nombre del pasajero');
        return;
      }

      await api.patch(`/tickets/${ticketId}`, {
        pasajeros: [{ nombre: pasajeroNombre, rut: pasajeroRut }],
        flightId: selectedFlight || undefined,
      });

      alert('Ticket actualizado exitosamente');
      setEditingId(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar ticket');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setPasajeroNombre('');
    setPasajeroRut('');
    setSelectedFlight('');
  };

  const handleAcceptReschedule = async (ticketId: string) => {
    try {
      await api.post(`/tickets/${ticketId}/accept-reschedule`);
      alert('Reprogramación aceptada exitosamente');
      setRescheduleModalTicket(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al aceptar reprogramación');
    }
  };

  const handleRescheduleToTanda = async (ticketId: string) => {
    if (!selectedTanda) {
      alert('Debes seleccionar una tanda');
      return;
    }

    try {
      await api.post(`/tickets/${ticketId}/reschedule`, {
        numero_tanda: selectedTanda,
      });
      alert('Ticket reprogramado exitosamente');
      setRescheduleModalTicket(null);
      setSelectedTanda('');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al reprogramar ticket');
    }
  };

  const handleRejectReschedule = async (ticketId: string) => {
    if (!refundAmount || refundAmount <= 0) {
      alert('Debes ingresar el monto de devolución');
      return;
    }

    try {
      await api.post(`/tickets/${ticketId}/reject-reschedule`, {
        monto_devolucion: refundAmount,
        metodo_pago: refundMethod,
      });
      alert(`Reprogramación rechazada. Se registró una devolución de $${refundAmount}`);
      setRescheduleModalTicket(null);
      setRefundAmount(0);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al rechazar reprogramación');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          <h1 className="text-2xl font-bold text-white">Mis Tickets</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg text-slate-300">
            Aquí puedes asignar nombres de pasajeros y seleccionar vuelos para tus tickets
          </h2>
        </div>

        {/* Alerta de reprogramaciones pendientes */}
        {tickets.filter(t => t.reprogramacion_pendiente).map((ticket) => (
          <div key={ticket.id} className="mb-6 bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl border border-orange-400/30 p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Reprogramación Pendiente - Ticket {ticket.codigo_ticket}</h3>
                <p className="text-orange-100 text-sm mb-2">
                  Tu vuelo de la <strong>Tanda {ticket.reprogramacion_pendiente.numero_tanda_anterior}</strong> ha sido reprogramado a la <strong>Tanda {ticket.reprogramacion_pendiente.numero_tanda_nueva}</strong>.
                </p>
                <p className="text-orange-100 text-xs mb-4">
                  Fecha de reprogramación: {new Date(ticket.reprogramacion_pendiente.fecha_reprogramacion).toLocaleString('es-ES')}
                </p>
                <button
                  onClick={() => setRescheduleModalTicket(ticket)}
                  className="bg-white text-orange-700 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition"
                >
                  Gestionar Reprogramación
                </button>
              </div>
            </div>
          </div>
        ))}

        {tickets.length === 0 ? (
          <div className="text-center text-slate-300 py-12">
            <p className="text-xl">No tienes tickets disponibles</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
              >
                <div className="text-center mb-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Ticket</p>
                  <p className="text-2xl font-black text-white tracking-tight mb-3">{ticket.codigo_ticket}</p>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-medium border ${
                    ticket.estado === 'disponible' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    ticket.estado === 'asignado' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    ticket.estado === 'inscrito' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    ticket.estado === 'volado' ? 'bg-slate-500/20 text-slate-300 border-slate-500/30' :
                    'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {ticket.estado.toUpperCase()}
                  </span>
                </div>

                {editingId === ticket.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Nombre del Pasajero *
                      </label>
                      <input
                        type="text"
                        value={pasajeroNombre}
                        onChange={(e) => setPasajeroNombre(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        RUT (opcional)
                      </label>
                      <input
                        type="text"
                        value={pasajeroRut}
                        onChange={(e) => setPasajeroRut(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="12.345.678-9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Seleccionar Vuelo (opcional)
                      </label>
                      <select
                        value={selectedFlight}
                        onChange={(e) => setSelectedFlight(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      >
                        <option value="">Sin asignar</option>
                        {flights.map((flight) => (
                          <option key={flight._id} value={flight._id}>
                            {flight.nombre} - {new Date(flight.fecha_hora).toLocaleDateString('es-CL')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(ticket.id)}
                        className="flex-1 px-4 py-2 bg-blue-600/90 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 bg-slate-700/80 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {ticket.pasajeros && ticket.pasajeros.length > 0 ? (
                      <div className="mb-4 pt-4 border-t border-slate-700">
                        <p className="text-xs text-slate-400 mb-1">Pasajero:</p>
                        <p className="text-sm font-medium text-white">{ticket.pasajeros[0].nombre}</p>
                        {ticket.pasajeros[0].rut && (
                          <p className="text-xs text-slate-400">{ticket.pasajeros[0].rut}</p>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4 pt-4 border-t border-slate-700">
                        <p className="text-sm text-slate-400">Sin pasajero asignado</p>
                      </div>
                    )}

                    {ticket.estado !== 'volado' && ticket.estado !== 'cancelado' && (
                      <button
                        onClick={() => handleEdit(ticket)}
                        className="w-full px-4 py-2 bg-indigo-600/80 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
                      >
                        {ticket.pasajeros && ticket.pasajeros.length > 0 ? 'Editar' : 'Asignar Pasajero'}
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de reprogramación */}
        {rescheduleModalTicket && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-4">Gestionar Reprogramación</h2>
              <p className="text-slate-300 mb-6">
                Ticket: <strong className="text-white">{rescheduleModalTicket.codigo_ticket}</strong>
                <br />
                Tanda Anterior: <strong className="text-orange-400">#{rescheduleModalTicket.reprogramacion_pendiente.numero_tanda_anterior}</strong>
                <br />
                Tanda Nueva Propuesta: <strong className="text-green-400">#{rescheduleModalTicket.reprogramacion_pendiente.numero_tanda_nueva}</strong>
              </p>

              <div className="space-y-4">
                {/* Opción 1: Aceptar */}
                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <h3 className="text-lg font-bold text-white mb-2">1. Aceptar Reprogramación</h3>
                  <p className="text-sm text-slate-300 mb-3">
                    Tu ticket será movido automáticamente a la Tanda #{rescheduleModalTicket.reprogramacion_pendiente.numero_tanda_nueva}.
                  </p>
                  <button
                    onClick={() => handleAcceptReschedule(rescheduleModalTicket.id)}
                    className="w-full px-6 py-3 bg-emerald-600/80 text-white rounded-lg hover:bg-emerald-600 font-medium transition-colors"
                  >
                    Aceptar
                  </button>
                </div>

                {/* Opción 2: Reprogramar a otra tanda */}
                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <h3 className="text-lg font-bold text-white mb-2">2. Reprogramar a Otra Tanda</h3>
                  <p className="text-sm text-slate-300 mb-3">
                    Selecciona una tanda diferente para tu vuelo.
                  </p>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Número de Tanda:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedTanda}
                    onChange={(e) => setSelectedTanda(Number(e.target.value))}
                    placeholder="Ej: 5"
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white mb-3"
                  />
                  <button
                    onClick={() => handleRescheduleToTanda(rescheduleModalTicket.id)}
                    className="w-full px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                  >
                    Reprogramar
                  </button>
                </div>

                {/* Opción 3: Rechazar con devolución */}
                <div className="bg-slate-700/50 rounded-xl p-4 border border-red-600/50">
                  <h3 className="text-lg font-bold text-white mb-2">3. Rechazar y Solicitar Devolución</h3>
                  <p className="text-sm text-slate-300 mb-3">
                    Tu ticket será cancelado y se registrará una devolución.
                  </p>
                  <div className="space-y-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Monto de Devolución:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(Number(e.target.value))}
                        placeholder="Ej: 50000"
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Método de Pago:
                      </label>
                      <select
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="tarjeta">Tarjeta</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRejectReschedule(rescheduleModalTicket.id)}
                    className="w-full px-6 py-3 bg-red-600/80 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
                  >
                    Rechazar y Devolver
                  </button>
                </div>
              </div>

              <button
                onClick={() => setRescheduleModalTicket(null)}
                className="mt-6 w-full px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
