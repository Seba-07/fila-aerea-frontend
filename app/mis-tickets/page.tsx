'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { userAPI, flightsAPI, api } from '@/lib/api';

export default function MisTicketsPage() {
  const router = useRouter();
  const { user, tickets: storeTickets, updateTickets } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pasajeroNombre, setPasajeroNombre] = useState('');
  const [pasajeroRut, setPasajeroRut] = useState('');
  const [selectedFlight, setSelectedFlight] = useState('');

  useEffect(() => {
    if (user?.rol !== 'passenger') {
      router.push('/');
      return;
    }

    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      const [profileRes, flightsRes] = await Promise.all([
        userAPI.getMe(),
        flightsAPI.getFlights('programado')
      ]);

      if (profileRes.data.tickets) {
        setTickets(profileRes.data.tickets);
        updateTickets(profileRes.data.tickets);
      }
      setFlights(flightsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ticket: any) => {
    setEditingId(ticket.id);
    if (ticket.pasajeros && ticket.pasajeros[0]) {
      setPasajeroNombre(ticket.pasajeros[0].nombre || '');
      setPasajeroRut(ticket.pasajeros[0].rut || '');
    } else {
      setPasajeroNombre('');
      setPasajeroRut('');
    }
    setSelectedFlight(ticket.flightId || '');
  };

  const handleSave = async (ticketId: string) => {
    try {
      if (!pasajeroNombre.trim()) {
        alert('Debes ingresar el nombre del pasajero');
        return;
      }

      await api.patch(`/tickets/${ticketId}`, {
        pasajeros: [{ nombre: pasajeroNombre, rut: pasajeroRut }],
        flightId: selectedFlight || undefined,
      });

      alert('Ticket actualizado exitosamente');
      setEditingId(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar ticket');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setPasajeroNombre('');
    setPasajeroRut('');
    setSelectedFlight('');
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
          <h1 className="text-2xl font-bold text-white">Mis Tickets</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg text-slate-300">
            Aquí puedes asignar nombres de pasajeros y seleccionar vuelos para tus tickets
          </h2>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center text-slate-300 py-12">
            <p className="text-xl">No tienes tickets disponibles</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
              >
                <div className="text-center mb-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Ticket</p>
                  <p className="text-2xl font-black text-white tracking-tight mb-3">{ticket.codigo_ticket}</p>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
                    ticket.estado === 'disponible' ? 'bg-green-400 text-green-900' :
                    ticket.estado === 'asignado' ? 'bg-yellow-400 text-yellow-900' :
                    ticket.estado === 'inscrito' ? 'bg-blue-300 text-blue-900' :
                    ticket.estado === 'volado' ? 'bg-slate-400 text-slate-900' :
                    'bg-red-400 text-red-900'
                  }`}>
                    {ticket.estado.toUpperCase()}
                  </span>
                </div>

                {editingId === ticket.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Nombre del Pasajero *
                      </label>
                      <input
                        type="text"
                        value={pasajeroNombre}
                        onChange={(e) => setPasajeroNombre(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        RUT (opcional)
                      </label>
                      <input
                        type="text"
                        value={pasajeroRut}
                        onChange={(e) => setPasajeroRut(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="12.345.678-9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Seleccionar Vuelo (opcional)
                      </label>
                      <select
                        value={selectedFlight}
                        onChange={(e) => setSelectedFlight(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      >
                        <option value="">Sin asignar</option>
                        {flights.map((flight) => (
                          <option key={flight._id} value={flight._id}>
                            {flight.nombre} - {new Date(flight.fecha_hora).toLocaleDateString('es-CL')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(ticket.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {ticket.pasajeros && ticket.pasajeros.length > 0 ? (
                      <div className="mb-4 pt-4 border-t border-slate-700">
                        <p className="text-xs text-slate-400 mb-1">Pasajero:</p>
                        <p className="text-sm font-medium text-white">{ticket.pasajeros[0].nombre}</p>
                        {ticket.pasajeros[0].rut && (
                          <p className="text-xs text-slate-400">{ticket.pasajeros[0].rut}</p>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4 pt-4 border-t border-slate-700">
                        <p className="text-sm text-slate-400">Sin pasajero asignado</p>
                      </div>
                    )}

                    {ticket.estado !== 'volado' && ticket.estado !== 'cancelado' && (
                      <button
                        onClick={() => handleEdit(ticket)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        {ticket.pasajeros && ticket.pasajeros.length > 0 ? 'Editar' : 'Asignar Pasajero'}
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
