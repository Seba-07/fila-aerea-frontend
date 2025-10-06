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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="text-white hover:text-primary transition">
              ← Inicio
            </button>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
              alt="Cessna"
              className="h-8"
            />
            <h1 className="text-2xl font-bold text-white">Panel Staff</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Formulario de Registro */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Registrar Nuevo Pasajero</h2>
            <form onSubmit={handleRegisterPassenger} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-slate-400"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary text-white placeholder-slate-400"
                  placeholder="juan@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cantidad de Tickets (1-10)
                </label>
                <input
                  type="number"
                  value={cantidadTickets}
                  onChange={(e) => setCantidadTickets(parseInt(e.target.value))}
                  min={1}
                  max={10}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-secondary to-red-700 text-white py-3 rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50"
              >
                {submitting ? 'Registrando...' : 'Registrar Pasajero'}
              </button>
            </form>
          </div>

          {/* Lista de Pasajeros */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Pasajeros Registrados</h2>
            <div className="space-y-3">
              {passengers.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No hay pasajeros registrados
                </p>
              ) : (
                passengers.map((passenger) => (
                  <div
                    key={passenger.id}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white">{passenger.nombre}</h3>
                        <p className="text-sm text-slate-400">{passenger.email}</p>
                      </div>
                      <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
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
