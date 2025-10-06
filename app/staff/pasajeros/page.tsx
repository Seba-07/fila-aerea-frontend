'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { staffAPI } from '@/lib/api';

export default function PasajerosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [passengers, setPassengers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);

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

  const handleEdit = (passengerId: string, currentCount: number) => {
    setEditingId(passengerId);
    setEditValue(currentCount);
  };

  const handleSave = async (passengerId: string) => {
    try {
      await staffAPI.updatePassengerTickets(passengerId, editValue);
      alert('Tickets actualizados');
      setEditingId(null);
      fetchPassengers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar tickets');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue(0);
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
            Volver
          </button>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold text-white">Pasajeros Registrados</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {passengers.length === 0 ? (
          <div className="text-center text-slate-300 py-12">
            <p className="text-xl">No hay pasajeros registrados</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {passengers.map((passenger) => (
              <div
                key={passenger.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-white">{passenger.nombre}</h3>
                    <p className="text-sm text-slate-400">{passenger.email}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {editingId === passenger.id ? (
                      <>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value))}
                          min={0}
                          max={20}
                          className="w-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-center"
                        />
                        <button
                          onClick={() => handleSave(passenger.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold">
                          {passenger.tickets_count} {passenger.tickets_count === 1 ? 'ticket' : 'tickets'}
                        </span>
                        <button
                          onClick={() => handleEdit(passenger.id, passenger.tickets_count)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          Editar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {passenger.tickets && passenger.tickets.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-sm font-semibold text-slate-300 mb-3">Tickets:</p>
                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {passenger.tickets.map((ticket: any) => (
                        <div
                          key={ticket.id}
                          className="bg-slate-700/50 rounded-lg p-3 border border-slate-600"
                        >
                          <p className="text-xs font-mono text-white font-bold">{ticket.codigo_ticket}</p>
                          <span
                            className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold ${
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
