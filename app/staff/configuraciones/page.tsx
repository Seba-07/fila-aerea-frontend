'use client';

import ThemeToggle from '@/components/ThemeToggle';
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

  const [duracionCircuito, setDuracionCircuito] = useState(20);
  const [maxCircuitosDefault, setMaxCircuitosDefault] = useState(4);
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

      setDuracionCircuito(data.duracion_circuito_minutos || 20);
      setMaxCircuitosDefault(data.max_circuitos_sin_reabastecimiento_default || 4);
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
        duracion_circuito_minutos: duracionCircuito,
        max_circuitos_sin_reabastecimiento_default: maxCircuitosDefault,
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
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold theme-text-primary mb-2">⚙️ Configuraciones</h1>
            <p className="theme-text-secondary">Configuración global del sistema</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 theme-input hover:theme-bg-secondary theme-text-primary rounded-lg transition-colors"
          >
            ← Volver
          </button>
        </div>

        {/* Formulario de configuración */}
        <div className="theme-bg-card backdrop-blur-sm rounded-2xl theme-border p-6 space-y-6">
          {/* Duración de circuito */}
          <div>
            <label className="block theme-text-secondary font-semibold mb-2">
              ⏱️ Duración de cada circuito (minutos)
            </label>
            <p className="theme-text-muted text-sm mb-3">
              Tiempo estimado que tarda cada vuelo. Se usa para calcular las horas previstas.
            </p>
            <input
              type="number"
              min="5"
              max="60"
              value={duracionCircuito}
              onChange={(e) => setDuracionCircuito(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 theme-border rounded-lg theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Máximo de circuitos sin reabastecimiento */}
          <div>
            <label className="block theme-text-secondary font-semibold mb-2">
              ⛽ Máximo de circuitos consecutivos sin reabastecimiento (default)
            </label>
            <p className="theme-text-muted text-sm mb-3">
              Número de circuitos que un avión puede volar antes de requerir reabastecimiento. Se mostrará una alerta al alcanzar este límite.
            </p>
            <input
              type="number"
              min="1"
              max="20"
              value={maxCircuitosDefault}
              onChange={(e) => setMaxCircuitosDefault(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 theme-border rounded-lg theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="theme-text-muted text-xs mt-2">
              💡 Este es el valor por defecto. Puedes configurar un valor específico para cada avión en la sección de Aviones.
            </p>
          </div>

          {/* Precio del ticket */}
          <div>
            <label className="block theme-text-secondary font-semibold mb-2">
              💰 Precio del Ticket (CLP)
            </label>
            <p className="theme-text-muted text-sm mb-3">
              Precio que se cobrará por cada ticket en la pasarela de pago.
            </p>
            <input
              type="number"
              min="0"
              step="1000"
              value={precioTicket}
              onChange={(e) => setPrecioTicket(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 theme-border rounded-lg theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="theme-text-muted text-xs mt-2">
              💡 El precio se mostrará en la página de compra y se aplicará automáticamente en los pagos.
            </p>
          </div>

          {/* Offset de zona horaria */}
          <div className="border-t theme-border pt-6">
            <label className="block theme-text-secondary font-semibold mb-2">
              🌍 Offset de Zona Horaria (horas)
            </label>
            <p className="theme-text-muted text-sm mb-3">
              Diferencia horaria con UTC. Chile: <strong>3 horas en verano (UTC-3)</strong>, <strong>4 horas en invierno (UTC-4)</strong>.
            </p>
            <div className="flex items-center gap-4">
              <select
                value={timezoneOffset}
                onChange={(e) => setTimezoneOffset(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-slate-900 theme-border rounded-lg theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:theme-bg-secondary theme-text-primary font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Guardando...' : '💾 Guardar Configuración'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 theme-input hover:theme-bg-secondary theme-text-primary font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              💡 <strong>Nota:</strong> La hora de salida de los circuitos se configura directamente en la página de Circuitos de Vuelo. El Circuito #1 determina la hora base y los demás se calculan automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
