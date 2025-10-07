'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { api } from '@/lib/api';

export default function ConfiguracionesPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [duracionTanda, setDuracionTanda] = useState(20);
  const [maxTandasDefault, setMaxTandasDefault] = useState(4);
  const [horaInicio, setHoraInicio] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.rol !== 'staff') {
      router.push('/');
      return;
    }

    loadSettings();
  }, [user, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/settings');
      setSettings(data);

      setDuracionTanda(data.duracion_tanda_minutos || 20);
      setMaxTandasDefault(data.max_tandas_sin_reabastecimiento_default || 4);

      if (data.hora_inicio_primera_tanda) {
        const fecha = new Date(data.hora_inicio_primera_tanda);
        const horaStr = fecha.toTimeString().substring(0, 5); // HH:MM
        setHoraInicio(horaStr);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Convertir hora_inicio a Date
      let hora_inicio_primera_tanda;
      if (horaInicio) {
        const [horas, minutos] = horaInicio.split(':');
        const fecha = new Date();
        fecha.setHours(parseInt(horas), parseInt(minutos), 0, 0);
        hora_inicio_primera_tanda = fecha.toISOString();
      }

      await api.patch('/settings', {
        duracion_tanda_minutos: duracionTanda,
        max_tandas_sin_reabastecimiento_default: maxTandasDefault,
        hora_inicio_primera_tanda,
      });

      alert('✅ Configuración guardada exitosamente');
      await loadSettings();
    } catch (error: any) {
      console.error('Error guardando configuración:', error);
      alert(error.response?.data?.error || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">⚙️ Configuraciones</h1>
            <p className="text-slate-300">Configuración global del sistema</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            ← Volver
          </button>
        </div>

        {/* Formulario de configuración */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 space-y-6">
          {/* Duración de tanda */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              ⏱️ Duración de cada tanda (minutos)
            </label>
            <p className="text-slate-400 text-sm mb-3">
              Tiempo estimado que tarda cada vuelo. Se usa para calcular las horas previstas.
            </p>
            <input
              type="number"
              min="5"
              max="60"
              value={duracionTanda}
              onChange={(e) => setDuracionTanda(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Máximo de tandas sin reabastecimiento */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              ⛽ Máximo de tandas consecutivas sin reabastecimiento (default)
            </label>
            <p className="text-slate-400 text-sm mb-3">
              Número de tandas que un avión puede volar antes de requerir reabastecimiento. Se mostrará una alerta al alcanzar este límite.
            </p>
            <input
              type="number"
              min="1"
              max="20"
              value={maxTandasDefault}
              onChange={(e) => setMaxTandasDefault(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-slate-400 text-xs mt-2">
              💡 Este es el valor por defecto. Puedes configurar un valor específico para cada avión en la sección de Aviones.
            </p>
          </div>

          {/* Hora de inicio de primera tanda */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              🕐 Hora de inicio de la primera tanda
            </label>
            <p className="text-slate-400 text-sm mb-3">
              Hora a la que despega la tanda #1. Las demás tandas se calcularán automáticamente sumando la duración configurada.
            </p>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {horaInicio && (
              <p className="text-blue-400 text-sm mt-2">
                📅 Con duración de {duracionTanda} min, la tanda #2 sería a las{' '}
                {(() => {
                  const [h, m] = horaInicio.split(':');
                  const fecha = new Date();
                  fecha.setHours(parseInt(h), parseInt(m) + duracionTanda, 0, 0);
                  return fecha.toTimeString().substring(0, 5);
                })()}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Guardando...' : '💾 Guardar Configuración'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>

          {/* Advertencia */}
          <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-4">
            <p className="text-amber-300 text-sm">
              ⚠️ <strong>Importante:</strong> Al cambiar la hora de inicio, se recalcularán automáticamente las horas previstas de TODAS las tandas abiertas. Los pasajeros inscritos recibirán una notificación con la nueva hora.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
