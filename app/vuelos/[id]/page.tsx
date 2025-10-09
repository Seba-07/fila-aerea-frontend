'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { flightsAPI, userAPI, api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function InscribirVueloPage() {
  const router = useRouter();
  const params = useParams();
  const flightId = params.id as string;
  const { user, tickets, updateTickets } = useAuthStore();

  const [flight, setFlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [inscribiendo, setInscribiendo] = useState(false);

  useEffect(() => {
    const fetchFlight = async () => {
      try {
        const { data } = await flightsAPI.getFlightById(flightId);
        setFlight(data);
      } catch (error) {
        console.error('Error al cargar vuelo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlight();
  }, [flightId]);

  const ticketsDisponibles = tickets.filter(t =>
    t.estado === 'disponible' &&
    t.pasajeros &&
    t.pasajeros.length > 0 &&
    t.pasajeros[0].nombre &&
    t.pasajeros[0].apellido
  );

  const handleToggleTicket = (ticketId: string) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleInscribir = async () => {
    if (selectedTickets.length === 0) {
      alert('Selecciona al menos un ticket');
      return;
    }

    if (selectedTickets.length > (flight.asientos_disponibles || 0)) {
      alert(`Solo hay ${flight.asientos_disponibles} asientos disponibles`);
      return;
    }

    setInscribiendo(true);
    try {
      // Inscribir cada ticket
      for (const ticketId of selectedTickets) {
        await api.post(`/tickets/${ticketId}/inscribir`, { flightId });
      }

      // Refrescar tickets del usuario
      const { data } = await userAPI.getMe();
      if (data.tickets) {
        updateTickets(data.tickets);
      }

      alert(`✓ ${selectedTickets.length} ticket(s) inscrito(s) exitosamente`);
      router.push('/');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al inscribir tickets');
    } finally {
      setInscribiendo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 theme-text-secondary">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg-primary">
        <div className="text-center theme-text-primary">
          <p className="text-xl">Vuelo no encontrado</p>
          <button
            onClick={() => router.push('/vuelos')}
            className="mt-4 text-blue-400 hover:text-blue-300"
          >
            ← Volver a tandas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      <header className="theme-bg-card backdrop-blur-sm border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/vuelos')}
            className="theme-text-primary hover:text-primary transition"
          >
            ← Volver
          </button>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
            alt="Cessna"
            className="h-8"
          />
          <div>
            <h1 className="text-xl font-bold theme-text-primary">Inscribir Vuelo</h1>
            <p className="text-sm theme-text-muted">
              {flight.aircraftId?.matricula} - Circuito #{flight.numero_circuito}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Info del vuelo */}
        <div className="theme-bg-card backdrop-blur-sm rounded-2xl theme-border p-6 mb-6">
          <h2 className="text-2xl font-bold theme-text-primary mb-4">Información del Vuelo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="theme-text-muted">Avión</p>
              <p className="font-medium theme-text-primary">{flight.aircraftId?.matricula}</p>
              <p className="text-xs theme-text-muted">{flight.aircraftId?.modelo}</p>
            </div>
            <div>
              <p className="theme-text-muted">Fecha</p>
              <p className="font-medium theme-text-primary">
                {new Date(flight.fecha_hora).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div>
              <p className="theme-text-muted">Estado</p>
              <p className="font-medium theme-text-primary capitalize">{flight.estado}</p>
            </div>
            <div>
              <p className="theme-text-muted">Asientos disponibles</p>
              <p className="font-medium theme-text-primary text-2xl">{flight.asientos_disponibles}</p>
            </div>
          </div>
        </div>

        {/* Selección de tickets */}
        <div className="theme-bg-card backdrop-blur-sm rounded-2xl theme-border p-6 mb-6">
          <h2 className="text-2xl font-bold theme-text-primary mb-4">Selecciona tus Tickets</h2>

          {ticketsDisponibles.length === 0 ? (
            <div className="text-center py-8">
              <p className="theme-text-muted mb-4">No tienes tickets disponibles para inscribir</p>
              <p className="text-sm theme-text-muted">
                Asegúrate de que tus tickets tengan los datos de pasajero completos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ticketsDisponibles.map((ticket) => {
                const pasajero = ticket.pasajeros[0];
                const isSelected = selectedTickets.includes(ticket.id);

                return (
                  <div
                    key={ticket.id}
                    onClick={() => handleToggleTicket(ticket.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'theme-border theme-input/30 hover:theme-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold theme-text-primary">
                          {pasajero.nombre} {pasajero.apellido}
                        </p>
                        <p className="text-sm theme-text-muted">
                          RUT: {pasajero.rut || 'No especificado'}
                        </p>
                        <p className="text-xs theme-text-muted">
                          Ticket: {ticket.codigo_ticket}
                        </p>
                        {pasajero.esMenor && (
                          <span className="inline-block mt-1 text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                            Menor de edad
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'theme-border'
                        }`}>
                          {isSelected && <span className="theme-text-primary text-sm">✓</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen y confirmación */}
        {ticketsDisponibles.length > 0 && (
          <div className="theme-bg-card backdrop-blur-sm rounded-2xl theme-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="theme-text-muted text-sm">Tickets seleccionados</p>
                <p className="text-3xl font-bold theme-text-primary">{selectedTickets.length}</p>
              </div>
              <div className="text-right">
                <p className="theme-text-muted text-sm">Asientos disponibles</p>
                <p className="text-3xl font-bold theme-text-primary">{flight.asientos_disponibles}</p>
              </div>
            </div>

            <button
              onClick={handleInscribir}
              disabled={selectedTickets.length === 0 || inscribiendo}
              className="w-full bg-blue-600/90 hover:bg-blue-600 disabled:theme-bg-secondary disabled:cursor-not-allowed theme-text-primary py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50"
            >
              {inscribiendo
                ? 'Inscribiendo...'
                : `Confirmar Inscripción (${selectedTickets.length} ticket${selectedTickets.length !== 1 ? 's' : ''})`
              }
            </button>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                ⓘ Mantente atento al estado de tu vuelo. La hora podría cambiar.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
