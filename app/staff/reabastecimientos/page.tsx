'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

function ReabastecimientosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [aircrafts, setAircrafts] = useState<any[]>([]);
  const [refuelings, setRefuelings] = useState<any[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [lockedAircraftId, setLockedAircraftId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    aircraftId: '',
    fecha: new Date().toISOString().split('T')[0],
    litros: '',
    notas: '',
  });

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
      return;
    }

    fetchData();
  }, [user, router]);

  // Separar efecto para manejar el aircraftId de la URL después de cargar datos
  useEffect(() => {
    const aircraftIdFromUrl = searchParams.get('aircraftId');
    console.log('🔍 DEBUG - aircraftId from URL:', aircraftIdFromUrl);
    console.log('🔍 DEBUG - aircrafts:', aircrafts);
    console.log('🔍 DEBUG - aircrafts IDs:', aircrafts.map(a => a._id));

    if (aircraftIdFromUrl && aircrafts.length > 0) {
      console.log('✅ Setting values...');
      setLockedAircraftId(aircraftIdFromUrl);
      setFormData(prev => {
        const newData = { ...prev, aircraftId: aircraftIdFromUrl };
        console.log('✅ New formData:', newData);
        return newData;
      });
      setShowForm(true);
    }
  }, [searchParams, aircrafts]);

  const fetchData = async () => {
    try {
      const [aircraftsRes, refuelingsRes] = await Promise.all([
        api.get('/staff/aircrafts'),
        api.get('/staff/refuelings'),
      ]);

      setAircrafts(aircraftsRes.data);
      setRefuelings(refuelingsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefuelingsByAircraft = async (aircraftId: string) => {
    try {
      const { data } = await api.get(`/staff/refuelings/${aircraftId}`);
      setRefuelings(data.refuelings);
      setStatistics(data.estadisticas);
    } catch (error) {
      console.error('Error al cargar reabastecimientos:', error);
    }
  };

  const handleAircraftChange = (aircraftId: string) => {
    setSelectedAircraft(aircraftId);
    if (aircraftId) {
      fetchRefuelingsByAircraft(aircraftId);
    } else {
      fetchData();
      setStatistics(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const litrosNum = Number(formData.litros);
    if (!formData.aircraftId || !formData.litros || litrosNum <= 0) {
      alert('Debes seleccionar un avión e ingresar litros válidos');
      return;
    }

    try {
      await api.post('/staff/refuelings', {
        ...formData,
        litros: litrosNum,
        fecha: new Date(formData.fecha).toISOString(),
      });

      alert('Reabastecimiento registrado exitosamente');

      // Si venía de una alerta, redirigir al home
      if (lockedAircraftId) {
        router.push('/');
        return;
      }

      setShowForm(false);
      setFormData({
        aircraftId: '',
        fecha: new Date().toISOString().split('T')[0],
        litros: '',
        notas: '',
      });

      if (selectedAircraft) {
        fetchRefuelingsByAircraft(selectedAircraft);
      } else {
        fetchData();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar reabastecimiento');
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
          <h1 className="text-2xl font-bold text-white">Gestión de Reabastecimientos</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Controles superiores */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Filtrar por Avión:
            </label>
            <select
              value={selectedAircraft}
              onChange={(e) => handleAircraftChange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="">Todos los aviones</option>
              {aircrafts.map((aircraft) => (
                <option key={aircraft._id} value={aircraft._id}>
                  {aircraft.matricula} - {aircraft.modelo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-2 bg-blue-600/90 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
            >
              {showForm ? 'Cancelar' : '+ Nuevo Reabastecimiento'}
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {statistics && (
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <p className="text-sm text-slate-400 mb-1">Total Litros</p>
              <p className="text-3xl font-bold text-white">{statistics.total_litros.toFixed(0)}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <p className="text-sm text-slate-400 mb-1">Total Costo</p>
              <p className="text-3xl font-bold text-green-400">${statistics.total_costo.toLocaleString()}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <p className="text-sm text-slate-400 mb-1">Reabastecimientos</p>
              <p className="text-3xl font-bold text-blue-400">{statistics.cantidad_reabastecimientos}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <p className="text-sm text-slate-400 mb-1">Promedio Litros</p>
              <p className="text-3xl font-bold text-purple-400">{statistics.promedio_litros.toFixed(0)}</p>
            </div>
          </div>
        )}

        {/* Formulario */}
        {showForm && (
          <div className="mb-8 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Registrar Reabastecimiento</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Avión * {lockedAircraftId && <span className="text-red-400 text-xs">(Preseleccionado por alerta de combustible)</span>}
                  </label>
                  <div className="text-xs text-yellow-300 mb-1">
                    DEBUG: formData.aircraftId={formData.aircraftId} | locked={lockedAircraftId}
                  </div>
                  <select
                    value={formData.aircraftId}
                    onChange={(e) => setFormData({ ...formData, aircraftId: e.target.value })}
                    required
                    disabled={!!lockedAircraftId}
                    className={`w-full px-3 py-2 border rounded-lg text-white ${
                      lockedAircraftId
                        ? 'bg-slate-600 border-slate-500 cursor-not-allowed opacity-75'
                        : 'bg-slate-700 border-slate-600'
                    }`}
                  >
                    <option value="">Seleccionar avión</option>
                    {aircrafts.map((aircraft) => (
                      <option key={aircraft._id} value={aircraft._id}>
                        {aircraft.matricula} - {aircraft.modelo} [ID: {aircraft._id}]
                      </option>
                    ))}
                  </select>
                  {lockedAircraftId && (
                    <p className="text-xs text-slate-400 mt-1">
                      Este avión fue reprogramado por falta de combustible y requiere reabastecimiento inmediato.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Litros *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.litros}
                    onChange={(e) => setFormData({ ...formData, litros: e.target.value })}
                    required
                    placeholder="Ej: 150.5"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                  placeholder="Información adicional..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600/90 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
              >
                Registrar Reabastecimiento
              </button>
            </form>
          </div>
        )}

        {/* Tabla de reabastecimientos */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">
              Historial de Reabastecimientos
              {selectedAircraft && aircrafts.find(a => a._id === selectedAircraft) && (
                <span className="text-primary ml-2">
                  - {aircrafts.find(a => a._id === selectedAircraft)?.matricula}
                </span>
              )}
            </h2>
          </div>

          {refuelings.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-lg">No hay reabastecimientos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Avión
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Litros
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Costo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Notas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Registrado Por
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {refuelings.map((refueling: any) => (
                    <tr key={refueling._id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {new Date(refueling.fecha).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {refueling.aircraftId?.matricula || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400 font-medium">
                        {refueling.litros.toFixed(1)} L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                        {refueling.costo ? `$${refueling.costo.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">
                        {refueling.notas || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {refueling.registradoPor?.nombre || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ReabastecimientosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <ReabastecimientosContent />
    </Suspense>
  );
}
