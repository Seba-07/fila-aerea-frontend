import { create } from 'zustand';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'passenger' | 'staff' | 'admin';
}

interface Pasajero {
  nombre: string;
  rut: string;
}

interface Ticket {
  id: string;
  codigo_ticket: string;
  pasajeros: Pasajero[];
  flightId?: string;
  estado: 'disponible' | 'asignado' | 'inscrito' | 'volado' | 'cancelado';
}

interface AuthState {
  user: User | null;
  tickets: Ticket[];
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tickets: Ticket[], token: string) => void;
  logout: () => void;
  updateTickets: (tickets: Ticket[]) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Cargar estado inicial del localStorage (solo en cliente)
  let initialUser = null;
  let initialTickets: Ticket[] = [];
  let initialToken = null;

  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('user');
    const storedTickets = localStorage.getItem('tickets');
    const storedToken = localStorage.getItem('token');

    if (storedUser) initialUser = JSON.parse(storedUser);
    if (storedTickets) initialTickets = JSON.parse(storedTickets);
    if (storedToken) initialToken = storedToken;
  }

  return {
    user: initialUser,
    tickets: initialTickets,
    token: initialToken,
    isAuthenticated: !!initialToken,

    setAuth: (user, tickets, token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('tickets', JSON.stringify(tickets));
      }
      set({ user, tickets, token, isAuthenticated: true });
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('tickets');
        localStorage.removeItem('token');
      }
      set({ user: null, tickets: [], token: null, isAuthenticated: false });
    },

    updateTickets: (tickets) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tickets', JSON.stringify(tickets));
      }
      set({ tickets });
    },
  };
});
