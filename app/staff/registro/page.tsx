'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { staffAPI } from '@/lib/api';

export default function RegistroPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [cantidadTickets, setCantidadTickets] = useState(1);
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'tarjeta' | 'efectivo'>('efectivo');
  const [monto, setMonto] = useState(0);
  const [pasajeros, setPasajeros] = useState<Array<{nombre: string; apellido: string; rut: string; esMenor: boolean}>>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Ajustar array de pasajeros cuando cambia la cantidad
    setPasajeros(Array(cantidadTickets).fill(null).map(() => ({
      nombre: '',
      apellido: '',
      rut: '',
      esMenor: false
    })));
  }, [cantidadTickets]);

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
    }
  }, [user, router]);

  if (user?.rol !== 'staff') {
    return null;
  }

  const copiarDatosUsuario = () => {
    if (pasajeros.length > 0) {
      const nuevosPasajeros = [...pasajeros];
      nuevosPasajeros[0] = {
        nombre: nombre,
        apellido: apellido,
        rut: rut,
        esMenor: false
      };
      setPasajeros(nuevosPasajeros);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validar que si hay menores, haya al menos un adulto
      const menores = pasajeros.filter(p => p.nombre.trim() && p.esMenor);
      const adultos = pasajeros.filter(p => p.nombre.trim() && !p.esMenor);

      if (menores.length > 0 && adultos.length === 0) {
        alert('⚠️ Si hay menores de edad, debe haber al menos un adulto en la reserva');
        setSubmitting(false);
        return;
      }

      // Filtrar pasajeros con datos completos o vacíos completamente
      const pasajerosValidos = pasajeros.filter(p =>
        p.nombre.trim() !== '' || p.apellido.trim() !== '' || p.rut.trim() !== ''
      );

      await staffAPI.registerPassenger({
        nombre,
        apellido,
        rut,
        email: email.toLowerCase(),
        cantidad_tickets: cantidadTickets,
        metodo_pago: metodoPago,
        monto,
        ...(pasajerosValidos.length > 0 && { pasajeros: pasajerosValidos }),
      });

      alert(`✓ Pasajero ${nombre} ${apellido} registrado con ${cantidadTickets} tickets`);

      // Reset form
      setNombre('');
      setApellido('');
      setRut('');
      setEmail('');
      setCantidadTickets(1);
      setMetodoPago('efectivo');
      setMonto(0);
      setPasajeros([]);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al registrar pasajero');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen theme-bg-primary">
      <header className="theme-bg-card backdrop-blur-sm border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="theme-text-primary hover:text-primary transition">
            ← Inicio
          </button>
          <img
            src="/logo.png"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold theme-text-primary">Registrar Pasajero</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="theme-bg-card backdrop-blur-sm rounded-2xl theme-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del comprador */}
            <div className="border-b theme-border pb-6">
              <h2 className="text-lg font-semibold theme-text-primary mb-4">Información del Comprador</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-2">
                    Nombre(s)
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full px-4 py-3 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary placeholder-slate-400"
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-2">
                    Apellido(s)
                  </label>
                  <input
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                    className="w-full px-4 py-3 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary placeholder-slate-400"
                    placeholder="Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-2">RUT</label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    className="w-full px-4 py-3 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary placeholder-slate-400"
                    placeholder="12.345.678-9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary placeholder-slate-400"
                    placeholder="juan@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Información de pago */}
            <div className="border-b theme-border pb-6">
              <h2 className="text-lg font-semibold theme-text-primary mb-4">Información de Pago</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-2">
                    Cantidad de Tickets (1-10)
                  </label>
                  <input
                    type="number"
                    value={cantidadTickets}
                    onChange={(e) => setCantidadTickets(parseInt(e.target.value) || 1)}
                    min={1}
                    max={10}
                    step={1}
                    required
                    className="w-full px-4 py-3 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-2">
                    Monto Pagado ($)
                  </label>
                  <input
                    type="number"
                    value={monto === 0 ? '' : monto}
                    onChange={(e) => setMonto(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                    min={0}
                    step={1}
                    required
                    placeholder="0"
                    className="w-full px-4 py-3 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium theme-text-secondary mb-3">
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
                          ? 'bg-primary theme-text-primary'
                          : 'theme-input theme-text-secondary hover:theme-bg-secondary'
                      }`}
                    >
                      {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Datos de pasajeros (opcional) */}
            {cantidadTickets > 0 && (
              <div className="pb-6">
                <h2 className="text-lg font-semibold theme-text-primary mb-2">
                  Datos de Pasajeros <span className="text-sm theme-text-muted">(opcional)</span>
                </h2>
                <p className="text-sm theme-text-muted mb-4">
                  Puedes asignar los datos de los pasajeros ahora o después. Si hay menores, debe haber al menos un adulto.
                </p>
                <div className="space-y-6">
                  {Array.from({ length: cantidadTickets }).map((_, index) => (
                    <div key={index} className="theme-input/30 p-4 rounded-xl border theme-border">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold theme-text-primary">
                          Ticket {index + 1}
                        </label>
                        {index === 0 && (
                          <button
                            type="button"
                            onClick={copiarDatosUsuario}
                            className="text-xs px-3 py-1 bg-blue-600/80 hover:bg-blue-600 theme-text-primary rounded-lg transition"
                          >
                            📋 Copiar datos del comprador
                          </button>
                        )}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium theme-text-muted mb-1">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={pasajeros[index]?.nombre || ''}
                            onChange={(e) => {
                              const nuevos = [...pasajeros];
                              nuevos[index] = { ...nuevos[index], nombre: e.target.value };
                              setPasajeros(nuevos);
                            }}
                            className="w-full px-4 py-2 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary placeholder-slate-400"
                            placeholder="Juan"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium theme-text-muted mb-1">
                            Apellido
                          </label>
                          <input
                            type="text"
                            value={pasajeros[index]?.apellido || ''}
                            onChange={(e) => {
                              const nuevos = [...pasajeros];
                              nuevos[index] = { ...nuevos[index], apellido: e.target.value };
                              setPasajeros(nuevos);
                            }}
                            className="w-full px-4 py-2 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary placeholder-slate-400"
                            placeholder="Pérez"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium theme-text-muted mb-1">
                            RUT
                          </label>
                          <input
                            type="text"
                            value={pasajeros[index]?.rut || ''}
                            onChange={(e) => {
                              const nuevos = [...pasajeros];
                              nuevos[index] = { ...nuevos[index], rut: e.target.value };
                              setPasajeros(nuevos);
                            }}
                            className="w-full px-4 py-2 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary placeholder-slate-400"
                            placeholder="12.345.678-9"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium theme-text-muted mb-1">
                            Menor de edad
                          </label>
                          <div className="flex items-center h-10">
                            <input
                              type="checkbox"
                              checked={pasajeros[index]?.esMenor || false}
                              onChange={(e) => {
                                const nuevos = [...pasajeros];
                                nuevos[index] = { ...nuevos[index], esMenor: e.target.checked };
                                setPasajeros(nuevos);
                              }}
                              className="w-5 h-5 theme-input theme-border rounded focus:ring-2 focus:ring-primary"
                            />
                            <span className="ml-2 text-sm theme-text-secondary">
                              Es menor de edad
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-secondary to-red-700 theme-text-primary py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50"
            >
              {submitting ? 'Registrando...' : 'Registrar Pasajero'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
