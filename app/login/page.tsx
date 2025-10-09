'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, userAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authAPI.login(email);
      console.log('Login response:', data);

      // Guardar el token primero para que esté disponible en el interceptor
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }

      // Cargar perfil completo con tickets (ahora el interceptor tendrá el token)
      const profileData = await userAPI.getMe();
      console.log('Profile data:', profileData.data);

      setAuth(data.user, profileData.data.tickets || [], data.token);

      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al iniciar sesión';
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mb-4">
            <img
              src="/logo.png"
              alt="Cessna Logo"
              className="h-20 mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Fila Aérea</h1>
          <p className="text-gray-600 mt-2">Inicia sesión con tu email</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
