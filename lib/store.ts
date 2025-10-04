import { create } from 'zustand';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'passenger' | 'staff' | 'admin';
}

interface Ticket {
  id: string;
  codigo_ticket: string;
  turno_global: number;
  estado: string;
  cooldownUntil?: string;
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
  // DESARROLLO: bypass de autenticación
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

  // Cargar estado inicial del localStorage (solo en cliente)
  let initialUser = null;
  let initialTicket = null;
  let initialToken = null;

  if (bypassAuth) {
    initialUser = {
      id: '507f1f77bcf86cd799439011',
      nombre: 'Usuario Dev',
      email: 'dev@test.com',
      rol: 'passenger' as const,
    };
    initialToken = 'bypass-token';
  } else if (typeof window !== 'undefined') {
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
    isAuthenticated: bypassAuth || !!initialToken,

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
