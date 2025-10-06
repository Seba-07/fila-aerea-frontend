'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api, flightsAPI } from '@/lib/api';

export default function TandasPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [aircrafts, setAircrafts] = useState<any[]>([]);
  const [tandas, setTandas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [numeroTanda, setNumeroTanda] = useState<number>(1);
  const [fechaHora, setFechaHora] = useState('');
  const [selectedAircrafts, setSelectedAircrafts] = useState<string[]>([]);

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
      return;
    }

    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      const [aircraftsRes, flightsRes] = await Promise.all([
        api.get('/staff/aircrafts'),
        flightsAPI.getFlights(),
      ]);

      setAircrafts(aircraftsRes.data);

      // Agrupar vuelos por tanda
      const flightsByTanda = flightsRes.data.reduce((acc: any, flight: any) => {
        const tandaNum = flight.numero_tanda;
        if (!acc[tandaNum]) {
          acc[tandaNum] = {
            numero_tanda: tandaNum,
            fecha_hora: flight.fecha_hora,
            vuelos: [],
          };
        }
        acc[tandaNum].vuelos.push(flight);
        return acc;
      }, {});

      setTandas(Object.values(flightsByTanda).sort((a: any, b: any) => a.numero_tanda - b.numero_tanda));

      // Sugerir siguiente número de tanda
      if (Object.keys(flightsByTanda).length > 0) {
        const maxTanda = Math.max(...Object.keys(flightsByTanda).map(Number));
        setNumeroTanda(maxTanda + 1);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAircraft = (aircraftId: string) => {
    setSelectedAircrafts((prev) =>
      prev.includes(aircraftId)
        ? prev.filter((id) => id !== aircraftId)
        : [...prev, aircraftId]
    );
  };

  const handleCreateTanda = async () => {
    if (!numeroTanda || !fechaHora || selectedAircrafts.length === 0) {
      alert('Completa todos los campos y selecciona al menos un avión');
      return;
    }

    try {
      await api.post('/staff/tandas', {
        numero_tanda: numeroTanda,
        fecha_hora: fechaHora,
        aircraftIds: selectedAircrafts,
      });

      alert('Tanda creada exitosamente');
      setShowCreateForm(false);
      setSelectedAircrafts([]);
      setFechaHora('');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear tanda');
    }
  };

  const handleDeleteTanda = async (numero_tanda: number) => {
    if (!confirm(`¿Eliminar la Tanda #${numero_tanda}?`)) return;

    try {
      await api.delete(`/staff/tandas/${numero_tanda}`);
      alert('Tanda eliminada exitosamente');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar tanda');
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
          <h1 className="text-2xl font-bold text-white">Gestión de Tandas</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            {showCreateForm ? 'Cancelar' : '+ Crear Nueva Tanda'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Nueva Tanda</h2>

            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Número de Tanda:</label>
                <input
                  type="number"
                  min="1"
                  value={numeroTanda}
                  onChange={(e) => setNumeroTanda(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Fecha y Hora:</label>
                <input
                  type="datetime-local"
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Seleccionar Aviones:</label>
              <div className="grid gap-2 md:grid-cols-3">
                {aircrafts.map((aircraft) => (
                  <label
                    key={aircraft._id}
                    className={`flex items-center gap-2 p-3 rounded cursor-pointer transition ${
                      selectedAircrafts.includes(aircraft._id)
                        ? 'bg-primary text-white'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAircrafts.includes(aircraft._id)}
                      onChange={() => handleToggleAircraft(aircraft._id)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium text-sm">{aircraft.matricula}</p>
                      <p className="text-xs opacity-80">{aircraft.modelo} ({aircraft.capacidad} asientos)</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateTanda}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Crear Tanda
            </button>
          </div>
        )}

        <div className="space-y-6">
          {tandas.map((tanda: any) => (
            <div
              key={tanda.numero_tanda}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">Tanda #{tanda.numero_tanda}</h3>
                  <p className="text-sm text-slate-400">
                    {new Date(tanda.fecha_hora).toLocaleString('es-ES')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTanda(tanda.numero_tanda)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                >
                  Eliminar Tanda
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {tanda.vuelos.map((vuelo: any) => (
                  <div key={vuelo._id} className="bg-slate-700/50 rounded-lg p-4">
                    <p className="font-bold text-white">{vuelo.aircraftId?.matricula}</p>
                    <p className="text-xs text-slate-400">{vuelo.aircraftId?.modelo}</p>
                    <p className="text-sm text-slate-300 mt-2">
                      Asientos: {vuelo.asientos_ocupados}/{vuelo.capacidad_total}
                    </p>
                    <span
                      className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold ${
                        vuelo.estado === 'abierto'
                          ? 'bg-green-400 text-green-900'
                          : vuelo.estado === 'programado'
                          ? 'bg-blue-400 text-blue-900'
                          : 'bg-gray-400 text-gray-900'
                      }`}
                    >
                      {vuelo.estado.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {tandas.length === 0 && (
            <div className="text-center text-slate-300 py-12">
              <p className="text-xl">No hay tandas creadas</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
