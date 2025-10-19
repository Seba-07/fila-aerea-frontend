'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { staffAPI, api } from '@/lib/api';

export default function RegistroPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [cantidadTickets, setCantidadTickets] = useState(1);
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'passline' | 'efectivo' | 'socio' | 'combinado'>('efectivo');
  const [monto, setMonto] = useState(0);
  const [precioTicket, setPrecioTicket] = useState(0);
  const [pasajeros, setPasajeros] = useState<Array<{nombre: string; apellido: string; rut: string; esMenor: boolean; esInfante?: boolean}>>([]);
  const [submitting, setSubmitting] = useState(false);

  // Estados para pago combinado
  const [montoTransferencia, setMontoTransferencia] = useState(0);
  const [montoEfectivo, setMontoEfectivo] = useState(0);

  // Estado para nombre del socio
  const [nombreSocio, setNombreSocio] = useState('');

  // Estado para tickets bloqueados
  const [ticketsBloqueados, setTicketsBloqueados] = useState(0);

  // Cargar precio del ticket desde configuración
  useEffect(() => {
    const fetchPrecioTicket = async () => {
      try {
        const { data } = await api.get('/settings/precio-ticket');
        setPrecioTicket(data.precio_ticket);
        setMonto(data.precio_ticket * cantidadTickets);
      } catch (error) {
        console.error('Error al cargar precio del ticket:', error);
      }
    };
    fetchPrecioTicket();
  }, []);

  // Ajustar array de pasajeros cuando cambia la cantidad
  useEffect(() => {
    setPasajeros(Array(cantidadTickets).fill(null).map(() => ({
      nombre: '',
      apellido: '',
      rut: '',
      esMenor: false,
      esInfante: false
    })));
  }, [cantidadTickets]);

  // Calcular monto automáticamente según cantidad de tickets
  useEffect(() => {
    if (precioTicket > 0) {
      setMonto(precioTicket * cantidadTickets);
    }
  }, [cantidadTickets, precioTicket]);

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
        esMenor: false,
        esInfante: false
      };
      setPasajeros(nuevosPasajeros);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validar pago combinado
      if (metodoPago === 'combinado') {
        if (montoTransferencia + montoEfectivo !== monto) {
          alert('⚠️ La suma de Transferencia y Efectivo debe ser igual al monto total');
          setSubmitting(false);
          return;
        }
        if (montoTransferencia <= 0 || montoEfectivo <= 0) {
          alert('⚠️ Ambos montos deben ser mayores a 0 para pago combinado');
          setSubmitting(false);
          return;
        }
      }

      // Validar pago socio
      if (metodoPago === 'socio' && !nombreSocio.trim()) {
        alert('⚠️ Debes ingresar el nombre del socio');
        setSubmitting(false);
        return;
      }

      // Filtrar pasajeros con datos completos o vacíos completamente
      const pasajerosValidos = pasajeros.filter(p =>
        p.nombre.trim() !== '' || p.apellido.trim() !== '' || p.rut.trim() !== ''
      );

      const registroData: any = {
        nombre,
        apellido,
        rut,
        email: email.toLowerCase(),
        cantidad_tickets: cantidadTickets,
        metodo_pago: metodoPago,
        monto,
        ...(pasajerosValidos.length > 0 && { pasajeros: pasajerosValidos }),
      };

      // Agregar montos si es pago combinado
      if (metodoPago === 'combinado') {
        registroData.monto_transferencia = montoTransferencia;
        registroData.monto_efectivo = montoEfectivo;
      }

      // Agregar nombre del socio si es pago socio
      if (metodoPago === 'socio') {
        registroData.nombre_socio = nombreSocio.trim();
      }

      // Agregar tickets bloqueados si hay
      if (ticketsBloqueados > 0) {
        registroData.tickets_bloqueados = ticketsBloqueados;
      }

      await staffAPI.registerPassenger(registroData);

      // Mostrar opciones de navegación después de registrar
      const action = confirm(
        `✓ Pasajero ${nombre} ${apellido} registrado con ${cantidadTickets} tickets.\n\n` +
        `¿Deseas inscribir estos tickets en un vuelo ahora?\n\n` +
        `• OK: Ir a inscribir pasajeros\n` +
        `• Cancelar: Registrar otro pasajero`
      );

      if (action) {
        // Navegar a página de inscripciones
        router.push('/staff/inscribir');
      } else {
        // Reset form para registrar otro pasajero
        setNombre('');
        setApellido('');
        setRut('');
        setEmail('');
        setCantidadTickets(1);
        setMetodoPago('efectivo');
        setMonto(0);
        setPasajeros([]);
        setTicketsBloqueados(0);
      }
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
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || 1;
                      setCantidadTickets(newValue);
                      // Resetear tickets bloqueados si cambia la cantidad
                      if (ticketsBloqueados > newValue) {
                        setTicketsBloqueados(0);
                      }
                    }}
                    min={1}
                    max={10}
                    step={1}
                    required
                    className="w-full px-4 py-3 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary"
                  />
                </div>

                {cantidadTickets > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      🔒 Tickets Bloqueados (sin pasajero)
                    </label>
                    <input
                      type="number"
                      value={ticketsBloqueados}
                      onChange={(e) => setTicketsBloqueados(Math.min(parseInt(e.target.value) || 0, cantidadTickets))}
                      min={0}
                      max={cantidadTickets}
                      step={1}
                      className="w-full px-4 py-3 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary"
                    />
                    <p className="mt-2 text-xs theme-text-muted">
                      Tickets que ocupan asiento pero sin pasajero asignado (máx: {cantidadTickets})
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-1 mt-6">
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-2">
                    Monto Pagado ($)
                    {precioTicket > 0 && (
                      <span className="ml-2 text-xs theme-text-muted">
                        (Calculado automáticamente: ${precioTicket.toLocaleString()} × {cantidadTickets})
                      </span>
                    )}
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
                  <p className="mt-1 text-xs theme-text-muted">
                    El monto se calcula automáticamente pero puede modificarse si es necesario
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium theme-text-secondary mb-3">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {(['efectivo', 'transferencia', 'passline'] as const).map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setMetodoPago(metodo)}
                      className={`py-3 px-4 rounded-lg font-medium transition-all shadow-sm ${
                        metodoPago === metodo
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'theme-input theme-text-secondary hover:theme-bg-secondary'
                      }`}
                    >
                      {metodo === 'passline' ? 'PassLine' : metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['socio', 'combinado'] as const).map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setMetodoPago(metodo)}
                      className={`py-3 px-4 rounded-lg font-medium transition-all shadow-sm ${
                        metodoPago === metodo
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'theme-input theme-text-secondary hover:theme-bg-secondary'
                      }`}
                    >
                      {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Campo para nombre del socio */}
                {metodoPago === 'socio' && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Nombre del Socio
                    </label>
                    <input
                      type="text"
                      value={nombreSocio}
                      onChange={(e) => setNombreSocio(e.target.value)}
                      placeholder="Nombre completo del socio"
                      className="w-full px-4 py-2 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary"
                    />
                    <p className="mt-2 text-xs theme-text-muted">
                      Este nombre aparecerá en el historial de pagos para identificar a quién se debe cobrar
                    </p>
                  </div>
                )}

                {/* Campos para pago combinado */}
                {metodoPago === 'combinado' && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium theme-text-primary mb-3">Desglose del Pago Combinado</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium theme-text-secondary mb-2">
                          Monto Transferencia ($)
                        </label>
                        <input
                          type="number"
                          value={montoTransferencia === 0 ? '' : montoTransferencia}
                          onChange={(e) => setMontoTransferencia(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                          min={0}
                          step={1}
                          placeholder="0"
                          className="w-full px-3 py-2 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium theme-text-secondary mb-2">
                          Monto Efectivo ($)
                        </label>
                        <input
                          type="number"
                          value={montoEfectivo === 0 ? '' : montoEfectivo}
                          onChange={(e) => setMontoEfectivo(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                          min={0}
                          step={1}
                          placeholder="0"
                          className="w-full px-3 py-2 theme-input border theme-border rounded-lg focus:ring-2 focus:ring-primary theme-text-primary"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs theme-text-muted">
                      Total: ${(montoTransferencia + montoEfectivo).toLocaleString()}
                      {montoTransferencia + montoEfectivo !== monto && (
                        <span className="text-red-600 ml-2">⚠️ No coincide con el monto total (${monto.toLocaleString()})</span>
                      )}
                    </p>
                  </div>
                )}
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
                            className="text-xs px-3 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition"
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
                        <div>
                          <label className="block text-xs font-medium theme-text-muted mb-1">
                            Infante ({"<"} 2 años)
                          </label>
                          <div className="flex items-center h-10">
                            <input
                              type="checkbox"
                              checked={pasajeros[index]?.esInfante || false}
                              onChange={(e) => {
                                const nuevos = [...pasajeros];
                                nuevos[index] = {
                                  ...nuevos[index],
                                  esInfante: e.target.checked,
                                  // Si marca infante, automáticamente es menor
                                  esMenor: e.target.checked ? true : nuevos[index]?.esMenor
                                };
                                setPasajeros(nuevos);
                              }}
                              className="w-5 h-5 theme-input theme-border rounded focus:ring-2 focus:ring-primary"
                            />
                            <span className="ml-2 text-sm theme-text-secondary">
                              👶 No ocupa asiento
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
