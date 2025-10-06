'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { userAPI } from '@/lib/api';
import { useSocket } from '@/lib/hooks/useSocket';

export default function HomePage() {
  const router = useRouter();
  const { user, tickets, isAuthenticated, updateTickets, logout } = useAuthStore();
  const { connected } = useSocket();
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error('Error al cargar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, router, updateTickets]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-gradient-to-br from-primary via-blue-600 to-blue-700 rounded-2xl shadow-2xl p-6 text-white border border-blue-400/20"
                >
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-widest opacity-80 mb-2">Ticket</p>
                    <p className="text-3xl font-black tracking-tight mb-4">{ticket.codigo_ticket}</p>
                    <div className="mb-4">
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
                    {ticket.pasajeros && ticket.pasajeros.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/20 text-sm space-y-1">
                        {ticket.pasajeros.map((p, i) => (
                          <p key={i} className="font-medium">{p.nombre} <span className="opacity-70">({p.rut})</span></p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
            <>
              <button
                onClick={() => router.push('/mis-tickets')}
                className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-indigo-500/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">✏️</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Mis Tickets</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Editar pasajeros y asignar vuelos</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/mi-pase')}
                className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 text-left overflow-hidden border border-slate-700 hover:border-emerald-500/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">🎫</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Mi Pase</h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Ver pase de embarque y código QR</p>
                </div>
              </button>
            </>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
