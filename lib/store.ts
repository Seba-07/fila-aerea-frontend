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
  cantidad_pasajeros: number;
  flightId?: string;
  estado: 'pendiente' | 'inscrito' | 'volado' | 'cancelado';
}

interface AuthState {
  user: User | null;
  ticket: Ticket | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, ticket: Ticket | null, token: string) => void;
  logout: () => void;
  updateTicket: (ticket: Ticket) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Cargar estado inicial del localStorage (solo en cliente)
  let initialUser = null;
  let initialTicket = null;
  let initialToken = null;

  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('user');
    const storedTicket = localStorage.getItem('ticket');
    const storedToken = localStorage.getItem('token');

    if (storedUser) initialUser = JSON.parse(storedUser);
    if (storedTicket) initialTicket = JSON.parse(storedTicket);
    if (storedToken) initialToken = storedToken;
  }

  return {
    user: initialUser,
    ticket: initialTicket,
    token: initialToken,
    isAuthenticated: !!initialToken,

    setAuth: (user, ticket, token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        if (ticket) {
          localStorage.setItem('ticket', JSON.stringify(ticket));
        }
      }
      set({ user, ticket, token, isAuthenticated: true });
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('ticket');
        localStorage.removeItem('token');
      }
      set({ user: null, ticket: null, token: null, isAuthenticated: false });
    },

    updateTicket: (ticket) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ticket', JSON.stringify(ticket));
      }
      set({ ticket });
    },
  };
});
