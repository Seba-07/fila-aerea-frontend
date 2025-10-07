'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function ComprarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [precioTicket, setPrecioTicket] = useState(15000);

  // Datos del comprador
  const [email, setEmail] = useState('');
  const [nombreComprador, setNombreComprador] = useState('');
  const [telefono, setTelefono] = useState('');

  // Datos de pasajeros
  const [cantidadTickets, setCantidadTickets] = useState(1);
  const [pasajeros, setPasajeros] = useState([
    { nombre: '', apellido: '', rut: '', esMenor: false }
  ]);

  // Cargar precio del ticket desde configuración
  useEffect(() => {
    const fetchPrecio = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
        setPrecioTicket(response.data.precio_ticket || 15000);
      } catch (error) {
        console.error('Error al cargar precio:', error);
        setPrecioTicket(15000); // Fallback al precio por defecto
      } finally {
        setLoadingPrice(false);
      }
    };
    fetchPrecio();
  }, []);

  const agregarPasajero = () => {
    setPasajeros([...pasajeros, { nombre: '', apellido: '', rut: '', esMenor: false }]);
    setCantidadTickets(pasajeros.length + 1);
  };

  const eliminarPasajero = (index: number) => {
    const nuevos = pasajeros.filter((_, i) => i !== index);
    setPasajeros(nuevos);
    setCantidadTickets(nuevos.length);
  };

  const actualizarPasajero = (index: number, campo: string, valor: any) => {
    const nuevos = [...pasajeros];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setPasajeros(nuevos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!email || !nombreComprador) {
      alert('Email y nombre del comprador son obligatorios');
      return;
    }

    for (const p of pasajeros) {
      if (!p.nombre || !p.apellido || !p.rut) {
        alert('Todos los datos de los pasajeros son obligatorios');
        return;
      }
    }

    try {
      setLoading(true);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/payment/iniciar`, {
        email,
        nombre_comprador: nombreComprador,
        telefono,
        cantidad_tickets: cantidadTickets,
        pasajeros,
      });

      // Redirigir a Webpay
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = response.data.url;

      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token_ws';
      tokenInput.value = response.data.token;

      form.appendChild(tokenInput);
      document.body.appendChild(form);
      form.submit();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al iniciar el pago');
      setLoading(false);
    }
  };

  const montoTotal = cantidadTickets * precioTicket;

  if (loadingPrice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="text-white text-xl font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-white hover:text-blue-300 transition"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-white">Comprar Tickets</h1>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Precio por ticket</p>
              <p className="text-2xl font-bold text-white">${precioTicket.toLocaleString('es-CL')}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total a pagar</p>
              <p className="text-3xl font-bold text-blue-400">${montoTotal.toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del comprador */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Datos del Comprador</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                  placeholder="tu@email.com"
                />
                <p className="text-xs text-slate-500 mt-1">Recibirás tus tickets en este correo</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={nombreComprador}
                  onChange={(e) => setNombreComprador(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>
          </div>

          {/* Pasajeros */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Pasajeros ({cantidadTickets})</h2>
              <button
                type="button"
                onClick={agregarPasajero}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                + Agregar Pasajero
              </button>
            </div>

            <div className="space-y-4">
              {pasajeros.map((pasajero, index) => (
                <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">Pasajero {index + 1}</h3>
                    {pasajeros.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarPasajero(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={pasajero.nombre}
                        onChange={(e) => actualizarPasajero(index, 'nombre', e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Apellido *</label>
                      <input
                        type="text"
                        value={pasajero.apellido}
                        onChange={(e) => actualizarPasajero(index, 'apellido', e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">RUT *</label>
                      <input
                        type="text"
                        value={pasajero.rut}
                        onChange={(e) => actualizarPasajero(index, 'rut', e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                        placeholder="12345678-9"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pasajero.esMenor}
                      onChange={(e) => actualizarPasajero(index, 'esMenor', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-400">Es menor de edad</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Botón pagar */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold text-lg rounded-lg transition"
            >
              {loading ? 'Redirigiendo a Webpay...' : `Pagar $${montoTotal.toLocaleString('es-CL')}`}
            </button>
            <p className="text-xs text-slate-400 text-center mt-3">
              Serás redirigido a Webpay para completar tu pago de forma segura
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
