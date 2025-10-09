'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import ThemeToggle from '@/components/ThemeToggle';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen theme-bg-primary flex items-center justify-center p-4 relative">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Cessna"
              className="h-24 drop-shadow-2xl"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-black theme-text-primary mb-4 drop-shadow-lg">
            Fila Aérea
          </h1>
          <p className="text-xl theme-text-secondary mb-2">
            Sistema de Gestión de Vuelos
          </p>
          <p className="text-lg theme-text-muted">
            Compra tu ticket y vive la experiencia de volar
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Comprar Ticket Card */}
          <button
            onClick={() => router.push('/seleccionar-vuelo?pasajeros=1')}
            className="group relative bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 rounded-3xl p-8 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:bg-white/20 transition-colors"></div>
            <div className="relative">
              <div className="text-6xl mb-4">🎫</div>
              <h2 className="text-3xl font-bold text-white mb-3">Comprar Ticket</h2>
              <p className="text-green-100 text-sm mb-4">
                Adquiere tu ticket de vuelo de forma rápida y segura
              </p>
              <div className="flex items-center text-white font-semibold">
                <span>Comprar ahora</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Iniciar Sesión Card */}
          <button
            onClick={() => router.push('/login')}
            className="group relative bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 rounded-3xl p-8 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:bg-white/20 transition-colors"></div>
            <div className="relative">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-3xl font-bold text-white mb-3">Iniciar Sesión</h2>
              <p className="text-blue-100 text-sm mb-4">
                Accede a tu cuenta para gestionar tus tickets y vuelos
              </p>
              <div className="flex items-center text-white font-semibold">
                <span>Ingresar</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 text-center">
          <div className="theme-bg-card rounded-2xl p-6 theme-shadow-sm">
            <div className="text-4xl mb-3">✈️</div>
            <h3 className="theme-text-primary font-bold mb-2">Múltiples Vuelos</h3>
            <p className="theme-text-muted text-sm">
              Elige entre diferentes circuitos de vuelo disponibles
            </p>
          </div>
          <div className="theme-bg-card rounded-2xl p-6 theme-shadow-sm">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="theme-text-primary font-bold mb-2">Pago Seguro</h3>
            <p className="theme-text-muted text-sm">
              Transacciones protegidas con Webpay Plus
            </p>
          </div>
          <div className="theme-bg-card rounded-2xl p-6 theme-shadow-sm">
            <div className="text-4xl mb-3">📱</div>
            <h3 className="theme-text-primary font-bold mb-2">Gestión Digital</h3>
            <p className="theme-text-muted text-sm">
              Administra tus tickets desde cualquier dispositivo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
