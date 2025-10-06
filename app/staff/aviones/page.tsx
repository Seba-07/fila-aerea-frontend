'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function AvionesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [aircrafts, setAircrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCapacity, setNewCapacity] = useState<number>(0);

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
      return;
    }

    fetchAircrafts();
  }, [user, router]);

  const fetchAircrafts = async () => {
    try {
      const { data } = await api.get('/staff/aircrafts');
      setAircrafts(data);
    } catch (error) {
      console.error('Error al cargar aviones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCapacity = async (aircraftId: string) => {
    if (newCapacity < 1 || newCapacity > 10) {
      alert('La capacidad debe estar entre 1 y 10 asientos');
      return;
    }

    try {
      await api.patch(`/staff/aircrafts/${aircraftId}/capacity`, { capacidad: newCapacity });
      alert('Capacidad actualizada exitosamente');
      setEditingId(null);
      fetchAircrafts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar capacidad');
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
          <h1 className="text-2xl font-bold text-white">Gestión de Aviones</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-300 mb-2">
            ℹ️ Configuración de Asientos
          </h2>
          <p className="text-sm text-blue-200">
            Al cambiar la capacidad de un avión, solo se actualizarán los vuelos en estado
            <span className="font-semibold"> PROGRAMADO</span> o <span className="font-semibold">ABIERTO</span>.
            Los vuelos ya realizados o en curso mantendrán su configuración original.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {aircrafts.map((aircraft) => (
            <div
              key={aircraft._id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">{aircraft.matricula}</h3>
                <p className="text-sm text-slate-400">{aircraft.modelo}</p>
              </div>

              {editingId === aircraft._id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Nueva Capacidad (1-10):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateCapacity(aircraft._id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-black text-primary">{aircraft.capacidad}</p>
                    <p className="text-xs text-slate-400">asientos</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(aircraft._id);
                      setNewCapacity(aircraft.capacidad);
                    }}
                    className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    Cambiar Capacidad
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
