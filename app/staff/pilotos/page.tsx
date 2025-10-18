'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { pilotsAPI } from '@/lib/api';

interface Pilot {
  _id: string;
  nombre: string;
  numero_licencia: string;
  activo: boolean;
}

export default function PilotosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPilot, setEditingPilot] = useState<Pilot | null>(null);
  const [formData, setFormData] = useState({ nombre: '', numero_licencia: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
      return;
    }

    fetchPilots();
  }, [user, router]);

  const fetchPilots = async () => {
    try {
      const { data } = await pilotsAPI.getAll();
      setPilots(data);
    } catch (error) {
      console.error('Error al cargar pilotos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingPilot) {
        await pilotsAPI.update(editingPilot._id, formData);
        alert('Piloto actualizado exitosamente');
      } else {
        await pilotsAPI.create(formData);
        alert('Piloto creado exitosamente');
      }

      setShowModal(false);
      setEditingPilot(null);
      setFormData({ nombre: '', numero_licencia: '' });
      fetchPilots();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar piloto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (pilot: Pilot) => {
    setEditingPilot(pilot);
    setFormData({ nombre: pilot.nombre, numero_licencia: pilot.numero_licencia });
    setShowModal(true);
  };

  const handleDelete = async (pilotId: string) => {
    if (!confirm('¿Estás seguro de desactivar este piloto?')) return;

    try {
      await pilotsAPI.delete(pilotId);
      alert('Piloto desactivado exitosamente');
      fetchPilots();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al desactivar piloto');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPilot(null);
    setFormData({ nombre: '', numero_licencia: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">Cargando pilotos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      <header className="theme-bg-card backdrop-blur-sm border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="theme-text-primary hover:text-primary transition">
              Volver
            </button>
            <img src="/logo.png" alt="Cessna" className="h-8" />
            <h1 className="text-2xl font-bold theme-text-primary">Gestión de Pilotos</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
          >
            + Nuevo Piloto
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {pilots.length === 0 ? (
          <div className="text-center theme-text-secondary py-12">
            <p className="text-xl">No hay pilotos registrados</p>
            <p className="text-sm theme-text-muted mt-2">Crea el primer piloto para comenzar</p>
          </div>
        ) : (
          <div className="theme-bg-card backdrop-blur-sm theme-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="theme-bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium theme-text-muted uppercase">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium theme-text-muted uppercase">Número de Licencia</th>
                    <th className="px-4 py-3 text-left text-xs font-medium theme-text-muted uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium theme-text-muted uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {pilots.map((pilot) => (
                    <tr key={pilot._id} className="hover:theme-bg-secondary/30 transition">
                      <td className="px-4 py-3 theme-text-primary font-medium">{pilot.nombre}</td>
                      <td className="px-4 py-3 theme-text-primary">{pilot.numero_licencia}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          pilot.activo ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {pilot.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(pilot)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium transition"
                          >
                            Editar
                          </button>
                          {pilot.activo && (
                            <button
                              onClick={() => handleDelete(pilot._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium transition"
                            >
                              Desactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="theme-bg-card rounded-2xl theme-border max-w-md w-full p-6">
            <h2 className="text-2xl font-bold theme-text-primary mb-4">
              {editingPilot ? 'Editar Piloto' : 'Nuevo Piloto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm theme-text-muted mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="w-full px-3 py-2 theme-input border theme-border rounded-lg theme-text-primary"
                  placeholder="Ej: Juan Pérez González"
                />
              </div>

              <div>
                <label className="block text-sm theme-text-muted mb-1">Número de Licencia</label>
                <input
                  type="text"
                  value={formData.numero_licencia}
                  onChange={(e) => setFormData({ ...formData, numero_licencia: e.target.value })}
                  required
                  className="w-full px-3 py-2 theme-input border theme-border rounded-lg theme-text-primary"
                  placeholder="Ej: PPL-12345"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 theme-bg-secondary theme-text-primary rounded-lg hover:theme-input font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
