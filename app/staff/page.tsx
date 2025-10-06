'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { staffAPI } from '@/lib/api';

export default function StaffPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [passengers, setPassengers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cantidadTickets, setCantidadTickets] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.rol !== 'staff') {
      router.push('/');
      return;
    }

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

    fetchPassengers();
  }, [isAuthenticated, user, router]);

  const handleRegisterPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await staffAPI.registerPassenger({
        nombre,
        email: email.toLowerCase(),
        cantidad_tickets: cantidadTickets,
      });

      alert(`✓ Pasajero ${nombre} registrado con ${cantidadTickets} tickets`);

      // Reset form
      setNombre('');
      setEmail('');
      setCantidadTickets(1);

      // Refresh list
      const { data } = await staffAPI.getPassengers();
      setPassengers(data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar pasajero');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-secondary text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="text-white hover:opacity-80">
              ← Inicio
            </button>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
              alt="Cessna"
              className="h-8"
            />
            <h1 className="text-2xl font-bold">Panel Staff</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Formulario de Registro */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Registrar Nuevo Pasajero</h2>
            <form onSubmit={handleRegisterPassenger} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                  placeholder="juan@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cantidad de Tickets (1-10)
                </label>
                <input
                  type="number"
                  value={cantidadTickets}
                  onChange={(e) => setCantidadTickets(parseInt(e.target.value))}
                  min={1}
                  max={10}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-secondary text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Registrando...' : 'Registrar Pasajero'}
              </button>
            </form>
          </div>

          {/* Lista de Pasajeros */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Pasajeros Registrados</h2>
            <div className="space-y-3">
              {passengers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay pasajeros registrados
                </p>
              ) : (
                passengers.map((passenger) => (
                  <div
                    key={passenger.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{passenger.nombre}</h3>
                        <p className="text-sm text-gray-600">{passenger.email}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {passenger.tickets_count} {passenger.tickets_count === 1 ? 'ticket' : 'tickets'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
