'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function ConfiguracionesPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [duracionTanda, setDuracionTanda] = useState(20);
  const [maxTandasDefault, setMaxTandasDefault] = useState(4);
  const [precioTicket, setPrecioTicket] = useState(15000);
  const [timezoneOffset, setTimezoneOffset] = useState(3);

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
      setPrecioTicket(data.precio_ticket || 15000);
      setTimezoneOffset(data.timezone_offset_hours || 3);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await api.patch('/settings', {
        duracion_tanda_minutos: duracionTanda,
        max_tandas_sin_reabastecimiento_default: maxTandasDefault,
        precio_ticket: precioTicket,
        timezone_offset_hours: timezoneOffset,
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
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="text-white text-xl font-medium">Cargando configuración...</p>
        </div>
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

          {/* Precio del ticket */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              💰 Precio del Ticket (CLP)
            </label>
            <p className="text-slate-400 text-sm mb-3">
              Precio que se cobrará por cada ticket en la pasarela de pago.
            </p>
            <input
              type="number"
              min="0"
              step="1000"
              value={precioTicket}
              onChange={(e) => setPrecioTicket(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-slate-400 text-xs mt-2">
              💡 El precio se mostrará en la página de compra y se aplicará automáticamente en los pagos.
            </p>
          </div>

          {/* Offset de zona horaria */}
          <div className="border-t border-slate-700 pt-6">
            <label className="block text-slate-300 font-semibold mb-2">
              🌍 Offset de Zona Horaria (horas)
            </label>
            <p className="text-slate-400 text-sm mb-3">
              Diferencia horaria con UTC. Chile: <strong>3 horas en verano (UTC-3)</strong>, <strong>4 horas en invierno (UTC-4)</strong>.
            </p>
            <div className="flex items-center gap-4">
              <select
                value={timezoneOffset}
                onChange={(e) => setTimezoneOffset(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="3">UTC-3 (Horario de Verano)</option>
                <option value="4">UTC-4 (Horario de Invierno)</option>
              </select>
            </div>
            <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <p className="text-yellow-300 text-xs">
                ⚠️ <strong>Importante:</strong> Cambia este valor cuando Chile cambie entre horario de verano e invierno para mantener las horas correctas.
              </p>
            </div>
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

          {/* Nota informativa */}
          <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              💡 <strong>Nota:</strong> La hora de salida de las tandas se configura directamente en la página de Tandas de Vuelo. La Tanda #1 determina la hora base y las demás se calculan automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
