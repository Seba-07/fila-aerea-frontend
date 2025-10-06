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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
              alt="Cessna"
              className="h-10"
            />
            <h1 className="text-2xl font-bold text-primary">Fila Aérea</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600">
                {connected ? 'Conectado' : 'Sin conexión'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usuario Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Bienvenido, {user?.nombre}
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p>
              <span className="font-medium">Rol:</span>{' '}
              <span className="capitalize">{user?.rol}</span>
            </p>
          </div>
        </div>

        {/* Tickets del pasajero */}
        {user?.rol === 'passenger' && tickets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Mis Tickets</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-gradient-to-r from-primary to-blue-700 rounded-lg shadow-lg p-6 text-white"
                >
                  <div className="text-center">
                    <p className="text-sm uppercase tracking-wide opacity-90">Ticket</p>
                    <p className="text-3xl font-bold my-2">{ticket.codigo_ticket}</p>
                    <div className="mt-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        ticket.estado === 'disponible' ? 'bg-green-500' :
                        ticket.estado === 'asignado' ? 'bg-yellow-500' :
                        ticket.estado === 'inscrito' ? 'bg-blue-500' :
                        ticket.estado === 'volado' ? 'bg-gray-500' :
                        'bg-red-500'
                      }`}>
                        {ticket.estado.toUpperCase()}
                      </span>
                    </div>
                    {ticket.pasajeros && ticket.pasajeros.length > 0 && (
                      <div className="mt-3 text-sm opacity-90">
                        {ticket.pasajeros.map((p, i) => (
                          <p key={i}>{p.nombre} ({p.rut})</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => router.push('/vuelos')}
            className="bg-primary text-white rounded-lg p-6 hover:bg-blue-700 transition text-left"
          >
            <div className="text-2xl mb-2">🛫</div>
            <h3 className="text-xl font-semibold mb-1">Ver Vuelos</h3>
            <p className="text-sm opacity-90">Explora vuelos disponibles y reserva tu asiento</p>
          </button>

          {user?.rol === 'passenger' && (
            <button
              onClick={() => router.push('/mi-pase')}
              className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition text-left"
            >
              <div className="text-2xl mb-2">🎫</div>
              <h3 className="text-xl font-semibold mb-1">Mi Pase</h3>
              <p className="text-sm opacity-90">Ver pase de embarque y código QR</p>
            </button>
          )}

          {user?.rol === 'staff' && (
            <button
              onClick={() => router.push('/staff')}
              className="bg-secondary text-white rounded-lg p-6 hover:bg-red-700 transition text-left md:col-span-2"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="text-xl font-semibold mb-1">Panel Staff</h3>
              <p className="text-sm opacity-90">Gestión de pasajeros y vuelos</p>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
