'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { userAPI, flightsAPI } from '@/lib/api';
import { useSocket } from '@/lib/hooks/useSocket';
import { useNotifications } from '@/lib/hooks/useNotifications';

interface EditingTicket {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  esMenor: boolean;
  flightId?: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user, tickets, isAuthenticated, updateTickets, logout } = useAuthStore();
  const { connected } = useSocket();
  useNotifications(user?.id); // Solicitar permisos de notificaciones
  const [loading, setLoading] = useState(true);
  const [editingTicket, setEditingTicket] = useState<EditingTicket | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingRefuelings, setPendingRefuelings] = useState<any[]>([]);
  const [reschedulingNotifications, setReschedulingNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data } = await userAPI.getMe();
        if (data.tickets) {
          updateTickets(data.tickets);
        }

        // Cargar notificaciones
        try {
          const { api } = await import('@/lib/api');
          const notificationsRes = await api.get('/notifications');

          // Si es staff, cargar notificaciones de reabastecimiento pendiente
          if (user?.rol === 'staff') {
            const refuelingNotifs = notificationsRes.data.filter(
              (n: any) => n.tipo === 'reabastecimiento_pendiente' && !n.leido
            );
            setPendingRefuelings(refuelingNotifs);
          }

          // Si es passenger, cargar notificaciones de reprogramación
          if (user?.rol === 'passenger') {
            const reschedulingNotifs = notificationsRes.data.filter(
              (n: any) => n.tipo === 'reprogramacion' && !n.leido
            );
            setReschedulingNotifications(reschedulingNotifs);
          }
        } catch (error) {
          console.error('Error al cargar notificaciones:', error);
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, router, updateTickets, user?.rol]);

  // Recargar notificaciones cuando el usuario regresa a la página
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { api } = await import('@/lib/api');
        const notificationsRes = await api.get('/notifications');

        if (user?.rol === 'staff') {
          const refuelingNotifs = notificationsRes.data.filter(
            (n: any) => n.tipo === 'reabastecimiento_pendiente' && !n.leido
          );
          setPendingRefuelings(refuelingNotifs);
        }

        if (user?.rol === 'passenger') {
          const reschedulingNotifs = notificationsRes.data.filter(
            (n: any) => n.tipo === 'reprogramacion' && !n.leido
          );
          setReschedulingNotifications(reschedulingNotifs);
        }
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
      }
    };

    // Recargar cuando la página vuelve a ser visible
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.rol) {
        loadNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.rol]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleEditTicket = (ticket: any) => {
    const pasajero = ticket.pasajeros?.[0];
    setEditingTicket({
      id: ticket.id,
      nombre: pasajero?.nombre || '',
      apellido: pasajero?.apellido || '',
      rut: pasajero?.rut || '',
      esMenor: pasajero?.esMenor || false,
      flightId: ticket.flightId,
    });
  };

  const handleSaveTicket = async () => {
    if (!editingTicket) return;

    setSaving(true);
    try {
      await userAPI.updateTicket(editingTicket.id, {
        pasajeros: [{
          nombre: editingTicket.nombre,
          apellido: editingTicket.apellido,
          rut: editingTicket.rut,
          esMenor: editingTicket.esMenor,
        }],
      });

      // Refresh tickets
      const { data } = await userAPI.getMe();
      if (data.tickets) {
        updateTickets(data.tickets);
      }

      setEditingTicket(null);
      alert('✓ Ticket actualizado exitosamente');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar ticket');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="text-white text-xl font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0 && user?.rol === 'passenger') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sin Tickets</h1>
          <p className="text-gray-600 mb-6">
            No tienes tickets activos. Contacta con el organizador.
          </p>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
              alt="Cessna"
              className="h-10"
            />
            <h1 className="text-2xl font-bold text-white">Fila Aérea</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              <span className="text-sm text-slate-300">
                {connected ? 'Conectado' : 'Sin conexión'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-300 hover:text-white transition"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Usuario Info */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Bienvenido, {user?.nombre}
          </h2>
          <div className="flex gap-6 text-sm text-slate-300">
            <p>
              <span className="text-slate-400">Email:</span> {user?.email}
            </p>
            <p>
              <span className="text-slate-400">Rol:</span>{' '}
              <span className="capitalize text-primary font-medium">{user?.rol}</span>
            </p>
          </div>
        </div>

        {/* Alerta de reprogramaciones para pasajeros */}
        {user?.rol === 'passenger' && reschedulingNotifications.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl border border-amber-400/30 p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✈️</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    🔄 Vuelos Reprogramados
                  </h3>
                  <p className="text-white/90 text-sm mb-4">
                    {reschedulingNotifications.length === 1
                      ? 'Tu vuelo ha sido reprogramado'
                      : `Tienes ${reschedulingNotifications.length} vuelos reprogramados`
                    }
                  </p>
                  <div className="space-y-3">
                    {reschedulingNotifications.map((notif) => (
                      <div key={notif._id} className="bg-white/10 rounded-lg p-4">
                        <p className="text-white font-medium mb-1">
                          Tanda {notif.metadata?.tanda_anterior} → Tanda {notif.metadata?.tanda_nueva}
                        </p>
                        <p className="text-white/80 text-sm mb-3">{notif.mensaje}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const { api } = await import('@/lib/api');
                                await api.patch(`/notifications/${notif._id}/read`);
                                setReschedulingNotifications(prev =>
                                  prev.filter(n => n._id !== notif._id)
                                );
                              } catch (error) {
                                console.error('Error:', error);
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-white text-amber-600 rounded-lg hover:bg-white/90 font-medium transition-colors"
                          >
                            Entendido
                          </button>
                          <button
                            onClick={() => router.push('/mi-pase')}
                            className="flex-1 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 font-medium transition-colors border border-white/30"
                          >
                            Ver Mis Pases
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de reabastecimientos pendientes para staff */}
        {user?.rol === 'staff' && pendingRefuelings.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl border border-red-400/30 p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    ⛽ Reabastecimientos Pendientes
                  </h3>
                  <p className="text-white/90 text-sm mb-4">
                    Hay {pendingRefuelings.length} avión(es) que requieren reabastecimiento por reprogramación por combustible.
                  </p>
                  <div className="space-y-3">
                    {pendingRefuelings.map((notif) => (
                      <div key={notif._id} className="bg-white/10 rounded-lg p-4">
                        <p className="text-white font-medium mb-1">
                          Avión {notif.metadata?.matricula}
                        </p>
                        <p className="text-white/80 text-sm mb-3">{notif.mensaje}</p>
                        <button
                          onClick={() => {
                            let aircraftId = notif.metadata?.aircraftId;

                            // Si es un objeto, extraer el _id
                            if (typeof aircraftId === 'object' && aircraftId !== null) {
                              aircraftId = aircraftId._id;
                            }
                            // Si es un string que contiene "ObjectId('...')", parsearlo
                            else if (typeof aircraftId === 'string' && aircraftId.includes('ObjectId')) {
                              // Extraer el ID del formato: "{ _id: new ObjectId('68e3ee67fbdb0a2fbcf92e5f'), ... }"
                              const match = aircraftId.match(/ObjectId\('([a-f0-9]+)'\)/);
                              if (match && match[1]) {
                                aircraftId = match[1];
                              }
                            }

                            router.push(`/staff/reabastecimientos?aircraftId=${aircraftId}`);
                          }}
                          className="w-full px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-white/90 font-medium transition-colors"
                        >
                          Registrar Reabastecimiento
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notificaciones de reprogramación */}
        {user?.rol === 'passenger' && tickets.some(t => t.reprogramacion_pendiente) && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl border border-orange-400/30 p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="text-4xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Reprogramaciones Pendientes</h3>
                  <p className="text-orange-100 text-sm mb-4">
                    Tienes {tickets.filter(t => t.reprogramacion_pendiente).length} ticket(s) con reprogramaciones pendientes que requieren tu atención.
                  </p>
                  <button
                    onClick={() => router.push('/mis-tickets')}
                    className="bg-white text-orange-700 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition"
                  >
                    Ver y Gestionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tickets del pasajero */}
        {user?.rol === 'passenger' && tickets.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">Mis Tickets</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tickets.map((ticket) => {
                const pasajero = ticket.pasajeros?.[0];
                const isEditing = editingTicket?.id === ticket.id;
                const nombreCompleto = pasajero
                  ? `${pasajero.nombre} ${pasajero.apellido}`.trim() || 'Sin asignar'
                  : 'Sin asignar';

                return (
                  <div
                    key={ticket.id}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 text-white"
                  >
                    {isEditing ? (
                      // Modo edición
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Editando Ticket</p>
                          <p className="text-sm text-slate-300">{ticket.codigo_ticket}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                          <input
                            type="text"
                            value={editingTicket.nombre}
                            onChange={(e) => setEditingTicket({ ...editingTicket, nombre: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                            placeholder="Juan"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Apellido</label>
                          <input
                            type="text"
                            value={editingTicket.apellido}
                            onChange={(e) => setEditingTicket({ ...editingTicket, apellido: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                            placeholder="Pérez"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">RUT</label>
                          <input
                            type="text"
                            value={editingTicket.rut}
                            onChange={(e) => setEditingTicket({ ...editingTicket, rut: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                            placeholder="12.345.678-9"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingTicket.esMenor}
                            onChange={(e) => setEditingTicket({ ...editingTicket, esMenor: e.target.checked })}
                            className="w-4 h-4 bg-slate-700 border-slate-600 rounded"
                          />
                          <label className="ml-2 text-sm text-slate-300">Es menor de edad</label>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleSaveTicket}
                            disabled={saving}
                            className="flex-1 bg-blue-600/90 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                          >
                            {saving ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => setEditingTicket(null)}
                            disabled={saving}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Modo vista
                      <div>
                        <div className="text-center mb-4">
                          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Ticket</p>
                          <p className="text-3xl font-black tracking-tight mb-1">{nombreCompleto}</p>
                          <p className="text-xs text-slate-400">{ticket.codigo_ticket}</p>
                        </div>
                        <div className="mb-4 text-center">
                          <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-medium ${
                            ticket.estado === 'disponible' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            ticket.estado === 'asignado' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            ticket.estado === 'inscrito' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            ticket.estado === 'volado' ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' :
                            'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {ticket.estado.toUpperCase()}
                          </span>
                        </div>
                        {pasajero && (
                          <div className="mt-4 pt-4 border-t border-slate-700 text-sm space-y-1 text-center">
                            <p className="text-slate-400">RUT: <span className="text-white">{pasajero.rut || 'No especificado'}</span></p>
                            {pasajero.esMenor && (
                              <p className="text-amber-400 text-xs">⚠️ Menor de edad</p>
                            )}
                          </div>
                        )}
                        {ticket.estado === 'disponible' && (
                          <button
                            onClick={() => handleEditTicket(ticket)}
                            className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition"
                          >
                            ✏️ Editar Datos
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acciones - Botones Modernos */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => router.push('/vuelos')}
            className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-blue-500/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="relative">
              <div className="text-5xl mb-4">✈️</div>
              <h3 className="text-2xl font-bold text-white mb-2">Tandas de Vuelo</h3>
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Explora y reserva en las tandas disponibles</p>
            </div>
          </button>

          {user?.rol === 'passenger' && (
            <button
              onClick={() => router.push('/mi-pase')}
              className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-emerald-500/50"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="relative">
                <div className="text-5xl mb-4">🎫</div>
                <h3 className="text-2xl font-bold text-white mb-2">Mis Pases</h3>
                <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Ver pases de embarque de tus vuelos</p>
              </div>
            </button>
          )}

          {user?.rol === 'staff' && (
            <>
              <button
                onClick={() => router.push('/staff/registro')}
                className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-blue-500/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">➕</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Registrar Pasajero</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Crear nuevo pasajero con tickets</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/staff/pasajeros')}
                className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-violet-500/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-violet-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">👥</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Ver Pasajeros</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Gestionar tickets de pasajeros</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/staff/inscribir')}
                className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-sky-500/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-sky-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">📝</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Inscribir Pasajeros</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Asignar pasajeros a vuelos</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/staff/pagos')}
                className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-teal-500/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-teal-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">💰</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Historial Pagos</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Ver transacciones y total recaudado</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/staff/aviones')}
                className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-cyan-500/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-cyan-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">✈️</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Gestión Aviones</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Configurar capacidad de asientos</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/staff/reabastecimientos')}
                className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-amber-500/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">⛽</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Reabastecimientos</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Gestionar combustible de aviones</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/staff/configuraciones')}
                className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-purple-500/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">⚙️</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Configuraciones</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Ajustes del sistema</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/staff/manifiestos')}
                className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-orange-500/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">📋</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Manifiestos</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Manifiestos de vuelo</p>
                </div>
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
