'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

function ConfirmacionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token_ws = searchParams.get('token_ws');

    if (!token_ws) {
      setError('Token no encontrado');
      setLoading(false);
      return;
    }

    confirmarPago(token_ws);
  }, [searchParams]);

  const confirmarPago = async (token_ws: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/payment/confirmar`,
        { token_ws }
      );

      setResultado(response.data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Error al confirmar el pago');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">Confirmando pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-900/30 backdrop-blur-sm rounded-2xl border border-red-600 p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold theme-text-primary mb-4">Error en el Pago</h1>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={() => router.push('/comprar')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all"
          >
            Intentar de Nuevo
          </button>
        </div>
      </div>
    );
  }

  const { success, transaction } = resultado;

  if (success) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center p-4 relative">
        {/* Theme Toggle */}
        <div className="fixed top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <div className="max-w-2xl w-full theme-bg-card backdrop-blur-sm rounded-2xl theme-border overflow-hidden">
          <div className="bg-green-600 p-6 text-center">
            <div className="text-6xl mb-2">✅</div>
            <h1 className="text-3xl font-bold theme-text-primary">¡Pago Exitoso!</h1>
          </div>

          <div className="p-8">
            <div className="theme-bg-secondary rounded-lg p-6 mb-6 border theme-border">
              <h2 className="text-xl font-bold theme-text-primary mb-4">Detalles del Pago</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="theme-text-muted">Orden de Compra:</span>
                  <span className="theme-text-primary font-mono">{transaction.buy_order}</span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-muted">Monto:</span>
                  <span className="theme-text-primary font-bold">${transaction.amount?.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-muted">Código de Autorización:</span>
                  <span className="theme-text-primary font-mono">{transaction.authorization_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-muted">Tipo de Pago:</span>
                  <span className="theme-text-primary">{transaction.payment_type === 'VD' ? 'Débito' : transaction.payment_type === 'VN' ? 'Crédito' : transaction.payment_type}</span>
                </div>
                {transaction.installments > 0 && (
                  <div className="flex justify-between">
                    <span className="theme-text-muted">Cuotas:</span>
                    <span className="theme-text-primary">{transaction.installments}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="theme-text-muted">Tickets Generados:</span>
                  <span className="text-green-600 font-bold">{transaction.tickets_generados}</span>
                </div>
              </div>
            </div>

            <div className="theme-info-box rounded-lg p-4 mb-6">
              <p className="theme-info-text text-sm text-center">
                📧 Revisa tu correo electrónico donde recibirás tus tickets de vuelo y toda la información necesaria
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.push('/login')}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Ir al Login
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-3 theme-input hover:theme-bg-secondary theme-text-primary font-semibold rounded-lg transition"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pago rechazado
  return (
    <div className="min-h-screen theme-bg-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-amber-900/30 backdrop-blur-sm rounded-2xl border border-amber-600 p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold theme-text-primary mb-4">Pago Rechazado</h1>
        <p className="text-amber-200 mb-6">
          Tu pago no pudo ser procesado. Por favor verifica tus datos e intenta nuevamente.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/comprar')}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Intentar de Nuevo
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-6 py-3 theme-input theme-text-primary rounded-lg hover:theme-bg-secondary font-medium"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">Cargando...</p>
        </div>
      </div>
    }>
      <ConfirmacionContent />
    </Suspense>
  );
}
