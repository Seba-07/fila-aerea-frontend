'use client';

import ThemeToggle from '@/components/ThemeToggle';
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
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state para nuevo avión
  const [matricula, setMatricula] = useState('');
  const [modelo, setModelo] = useState('');
  const [capacidad, setCapacidad] = useState<number>(3);

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
      return;
    }

    fetchAircrafts();
  }, [user, router]);

  const fetchAircrafts = async () => {
    try {
      const { data } = await api.get('/staff/aircrafts?includeDisabled=true');
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

  const handleCreateAircraft = async () => {
    if (!matricula || !modelo || capacidad < 1 || capacidad > 10) {
      alert('Completa todos los campos. Capacidad debe estar entre 1 y 10');
      return;
    }

    try {
      await api.post('/staff/aircrafts', {
        matricula: matricula.toUpperCase(),
        modelo,
        capacidad,
      });
      alert('Avión creado exitosamente');
      setShowCreateForm(false);
      setMatricula('');
      setModelo('');
      setCapacidad(3);
      fetchAircrafts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear avión');
    }
  };

  const handleToggleStatus = async (aircraftId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deshabilitar' : 'habilitar';
    if (!confirm(`¿Seguro que deseas ${action} este avión?`)) return;

    try {
      const { data } = await api.patch(`/staff/aircrafts/${aircraftId}/toggle`);
      alert(data.message);
      fetchAircrafts();
    } catch (error: any) {
      if (error.response?.data?.suggestion) {
        alert(`${error.response.data.error}\n\n${error.response.data.suggestion}`);
      } else {
        alert(error.response?.data?.error || 'Error al cambiar estado del avión');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">Cargando aviones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      <header className="theme-bg-card backdrop-blur-sm border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="theme-text-primary hover:text-primary transition">
            ← Volver
          </button>
          <img
            src="/logo.png"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold theme-text-primary">Gestión de Aviones</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Botón crear avión */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-green-600 theme-text-primary rounded-lg hover:bg-green-700 font-medium"
          >
            {showCreateForm ? 'Cancelar' : '+ Crear Nuevo Avión'}
          </button>
        </div>

        {/* Formulario crear avión */}
        {showCreateForm && (
          <div className="theme-bg-card backdrop-blur-sm rounded-xl theme-border p-6 mb-8">
            <h2 className="text-xl font-bold theme-text-primary mb-4">Nuevo Avión</h2>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div>
                <label className="block text-sm theme-text-muted mb-1">Matrícula:</label>
                <input
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                  placeholder="CC-XXX"
                  className="w-full px-3 py-2 theme-bg-secondary border theme-border rounded theme-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm theme-text-muted mb-1">Modelo:</label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Cessna 172"
                  className="w-full px-3 py-2 theme-bg-secondary border theme-border rounded theme-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm theme-text-muted mb-1">Capacidad (1-10):</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={capacidad}
                  onChange={(e) => setCapacidad(Number(e.target.value))}
                  className="w-full px-3 py-2 theme-bg-secondary border theme-border rounded theme-text-primary"
                />
              </div>
            </div>
            <button
              onClick={handleCreateAircraft}
              className="w-full px-6 py-3 bg-green-600 theme-text-primary rounded-lg hover:bg-green-700 font-medium"
            >
              Crear Avión
            </button>
          </div>
        )}

        <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-300 mb-2">
            ℹ️ Información Importante
          </h2>
          <p className="text-sm text-blue-200 mb-2">
            • Al cambiar la capacidad de un avión, solo se actualizarán los vuelos en estado
            <span className="font-semibold"> ABIERTO</span>.
          </p>
          <p className="text-sm text-blue-200">
            • Los aviones con vuelos realizados no se pueden eliminar, solo deshabilitar.
            Los aviones deshabilitados no aparecerán para nuevas inscripciones pero se mantendrán en el historial.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {aircrafts.map((aircraft) => (
            <div
              key={aircraft._id}
              className={`backdrop-blur-sm rounded-xl border p-6 ${
                aircraft.habilitado
                  ? 'theme-bg-card theme-border'
                  : 'bg-red-900/20 border-red-700'
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold theme-text-primary">{aircraft.matricula}</h3>
                  <p className="text-sm theme-text-muted">{aircraft.modelo}</p>
                </div>
                {!aircraft.habilitado && (
                  <span className="px-2 py-1 bg-red-600 theme-text-primary text-xs rounded">
                    DESHABILITADO
                  </span>
                )}
              </div>

              {editingId === aircraft._id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs theme-text-muted mb-1">
                      Nueva Capacidad (1-10):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 theme-bg-secondary border theme-border rounded theme-text-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateCapacity(aircraft._id)}
                      className="flex-1 px-4 py-2 bg-green-600 theme-text-primary rounded hover:bg-green-700 text-sm font-medium"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 px-4 py-2 theme-bg-secondary theme-text-primary rounded hover:theme-input text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="theme-bg-secondary/50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-black text-primary">{aircraft.capacidad}</p>
                    <p className="text-xs theme-text-muted">asientos</p>
                  </div>
                  {aircraft.habilitado && (
                    <button
                      onClick={() => {
                        setEditingId(aircraft._id);
                        setNewCapacity(aircraft.capacidad);
                      }}
                      className="w-full px-4 py-2 bg-primary theme-text-primary rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      Cambiar Capacidad
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleStatus(aircraft._id, aircraft.habilitado)}
                    className={`w-full px-4 py-2 rounded text-sm font-medium ${
                      aircraft.habilitado
                        ? 'bg-red-600 theme-text-primary hover:bg-red-700'
                        : 'bg-green-600 theme-text-primary hover:bg-green-700'
                    }`}
                  >
                    {aircraft.habilitado ? 'Deshabilitar Avión' : 'Habilitar Avión'}
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
