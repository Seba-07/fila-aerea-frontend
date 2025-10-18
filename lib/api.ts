import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password?: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
};

// Usuario
export const userAPI = {
  getMe: () => api.get('/me'),
  updateTicket: (ticketId: string, data: any) => api.patch(`/tickets/${ticketId}`, data),
  uploadAutorizacion: (ticketId: string, file: File) => {
    const formData = new FormData();
    formData.append('autorizacion', file);
    return api.post(`/tickets/${ticketId}/autorizacion`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Vuelos
export const flightsAPI = {
  getFlights: (estado?: string) => api.get('/flights', { params: { estado } }),
  getFlightById: (id: string) => api.get(`/flights/${id}`),
  createFlight: (data: any) => api.post('/flights', data),
  updateFlight: (id: string, data: any) => api.patch(`/flights/${id}`, data),
  closeFlight: (id: string) => api.post(`/flights/${id}/close`),
};

// Asientos
export const seatsAPI = {
  holdSeat: (flightId: string, seatNumber: string) =>
    api.post(`/flights/${flightId}/seats/hold`, { seatNumber }),
  confirmSeat: (flightId: string, seatNumber: string) =>
    api.post(`/flights/${flightId}/seats/confirm`, { seatNumber }),
  releaseSeat: (flightId: string, seatNumber: string) =>
    api.post(`/flights/${flightId}/seats/release`, { seatNumber }),
  markNoShow: (flightId: string, seatNumber: string) =>
    api.post(`/flights/${flightId}/no_show`, { seatNumber }),
};

// Boarding
export const boardingAPI = {
  getBoardingPass: (id: string) => api.get(`/boarding_pass/${id}`),
  scanQR: (qr_token: string) => api.post('/boarding_pass/scan', { qr_token }),
};

// Staff
export const staffAPI = {
  registerPassenger: (data: {
    nombre: string;
    apellido: string;
    rut?: string;
    email: string;
    cantidad_tickets: number;
    metodo_pago: 'transferencia' | 'passline' | 'efectivo';
    monto: number;
    pasajeros?: Array<{nombre: string; apellido: string; rut: string; esMenor: boolean}>;
    flightId?: string;
  }) => api.post('/staff/passengers', data),
  getPassengers: () => api.get('/staff/passengers'),
  getPassengersWithoutFlight: () => api.get('/staff/passengers-without-flight'),
  updatePassenger: (passengerId: string, data: { nombre?: string; email?: string }) =>
    api.patch(`/staff/passengers/${passengerId}`, data),
  updatePassengerTickets: (passengerId: string, data: {
    cantidad_tickets: number;
    monto_ajuste?: number;
    metodo_pago?: 'transferencia' | 'passline' | 'efectivo';
  }) => api.patch(`/staff/passengers/${passengerId}/tickets`, data),
  deletePassenger: (passengerId: string, data: {
    monto_devolucion?: number;
    metodo_pago?: 'transferencia' | 'passline' | 'efectivo';
  }) => api.delete(`/staff/passengers/${passengerId}`, { data }),
  getPayments: () => api.get('/staff/payments'),
  validateQR: (qrData: { ticketId: string; codigo: string; flightId: string; circuito: number }) =>
    api.post('/staff/validate-qr', qrData),
};

// Manifiestos
export const manifestsAPI = {
  getAll: () => api.get('/manifests'),
  getByFlight: (flightId: string) => api.get(`/manifests/flight/${flightId}`),
  getByCircuito: (numeroCircuito: number) => api.get(`/manifests/circuito/${numeroCircuito}`), // Deprecated
};

// Pilotos
export const pilotsAPI = {
  getAll: () => api.get('/pilots'),
  create: (data: { nombre: string; numero_licencia: string }) => api.post('/pilots', data),
  update: (pilotId: string, data: { nombre?: string; numero_licencia?: string }) =>
    api.patch(`/pilots/${pilotId}`, data),
  delete: (pilotId: string) => api.delete(`/pilots/${pilotId}`),
};
