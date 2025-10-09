'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { staffAPI } from '@/lib/api';

export default function PasajerosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [passengers, setPassengers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para editar info básica
  const [editingInfoId, setEditingInfoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Estado para editar tickets
  const [editingTicketsId, setEditingTicketsId] = useState<string | null>(null);
  const [editTicketCount, setEditTicketCount] = useState(0);
  const [montoAjuste, setMontoAjuste] = useState<number | ''>('');
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'tarjeta' | 'efectivo'>('efectivo');

  // Estado para eliminar
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [montoDevolucion, setMontoDevolucion] = useState<number | ''>('');
  const [metodoDevolucion, setMetodoDevolucion] = useState<'transferencia' | 'tarjeta' | 'efectivo'>('efectivo');

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
      return;
    }

    fetchPassengers();
  }, [user, router]);

  const fetchPassengers = async () => {
    try {
      const { data } = await staffAPI.getPassengers();
      setPassengers(data);
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
        {passengers.length === 0 ? (
          <div className="text-center theme-text-secondary py-12">
            <p className="text-xl">No hay pasajeros registrados</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {passengers.map((passenger) => (
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
                        <button
                          onClick={() => handleEditInfo(passenger)}
                          className="mt-1 text-blue-400 hover:text-blue-300 text-xs"
                        >
                          Editar
                        </button>
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
                            <option value="tarjeta">Tarjeta</option>
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
                            <option value="tarjeta">Tarjeta</option>
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
                                ? 'bg-green-400 text-green-900'
                                : ticket.estado === 'asignado'
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
                          {ticket.pasajeros && ticket.pasajeros.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs theme-text-muted">Pasajero:</p>
                              {ticket.pasajeros.map((p: any, idx: number) => (
                                <p key={idx} className="text-xs theme-text-primary font-medium">{p.nombre}</p>
                              ))}
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
