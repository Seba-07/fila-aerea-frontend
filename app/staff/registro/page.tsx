'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { staffAPI } from '@/lib/api';

export default function RegistroPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cantidadTickets, setCantidadTickets] = useState(1);
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'tarjeta' | 'efectivo'>('efectivo');
  const [monto, setMonto] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  if (user?.rol !== 'staff') {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await staffAPI.registerPassenger({
        nombre,
        email: email.toLowerCase(),
        cantidad_tickets: cantidadTickets,
        metodo_pago: metodoPago,
        monto,
      });

      alert(`✓ Pasajero ${nombre} registrado con ${cantidadTickets} tickets`);

      // Reset form
      setNombre('');
      setEmail('');
      setCantidadTickets(1);
      setMetodoPago('efectivo');
      setMonto(0);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar pasajero');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-white hover:text-primary transition">
            ← Inicio
          </button>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold text-white">Registrar Pasajero</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre Completo
                </label>
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
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Monto Pagado ($)
                </label>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(parseFloat(e.target.value))}
                  min={0}
                  step={0.01}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['efectivo', 'transferencia', 'tarjeta'] as const).map((metodo) => (
                  <button
                    key={metodo}
                    type="button"
                    onClick={() => setMetodoPago(metodo)}
                    className={`py-3 px-4 rounded-lg font-medium transition ${
                      metodoPago === metodo
                        ? 'bg-primary text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-secondary to-red-700 text-white py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50"
            >
              {submitting ? 'Registrando...' : 'Registrar Pasajero'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
