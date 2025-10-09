'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { staffAPI } from '@/lib/api';

export default function PagosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [totalRecaudado, setTotalRecaudado] = useState(0);
  const [totalConfirmado, setTotalConfirmado] = useState(0);
  const [pendienteDevolucion, setPendienteDevolucion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
      return;
    }

    fetchPayments();
  }, [user, router]);

  const fetchPayments = async () => {
    try {
      const { data } = await staffAPI.getPayments();
      setPayments(data.payments);
      setTotalRecaudado(data.total_recaudado);
      setTotalConfirmado(data.total_confirmado);
      setPendienteDevolucion(data.pendiente_devolucion);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'compra':
        return 'Compra';
      case 'ajuste_positivo':
        return 'Ajuste +';
      case 'ajuste_negativo':
        return 'Ajuste -';
      case 'devolucion':
        return 'Devolución';
      default:
        return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'compra':
        return 'bg-green-500 text-white';
      case 'ajuste_positivo':
        return 'bg-blue-500 text-white';
      case 'ajuste_negativo':
        return 'bg-orange-500 theme-text-primary';
      case 'devolucion':
        return 'bg-red-500 theme-text-primary';
      default:
        return 'bg-gray-500 theme-text-primary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
          <p className="theme-text-primary text-xl font-medium">Cargando pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      <header className="theme-bg-card backdrop-blur-sm border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="theme-text-primary hover:text-primary transition">
            Volver
          </button>
          <img
            src="/logo.png"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold theme-text-primary">Historial de Pagos</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Totales */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Total recaudado */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 theme-text-primary shadow-2xl">
            <h2 className="text-sm opacity-90 mb-1">Total Recaudado</h2>
            <p className="text-4xl font-black">${totalRecaudado.toLocaleString('es-CL')}</p>
            <p className="text-xs opacity-75 mt-2">Dinero total ingresado</p>
          </div>

          {/* Total confirmado */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-700 rounded-2xl p-6 theme-text-primary shadow-2xl">
            <h2 className="text-sm opacity-90 mb-1">Total Confirmado</h2>
            <p className="text-4xl font-black">${totalConfirmado.toLocaleString('es-CL')}</p>
            <p className="text-xs opacity-75 mt-2">De pasajeros que volaron</p>
          </div>

          {/* Pendiente devolución */}
          <div className="bg-gradient-to-r from-orange-600 to-red-700 rounded-2xl p-6 theme-text-primary shadow-2xl">
            <h2 className="text-sm opacity-90 mb-1">Pendiente Devolución</h2>
            <p className="text-4xl font-black">${pendienteDevolucion.toLocaleString('es-CL')}</p>
            <p className="text-xs opacity-75 mt-2">Posibles reembolsos</p>
          </div>
        </div>

        {/* Tabla de transacciones */}
        {payments.length === 0 ? (
          <div className="text-center theme-text-secondary py-12">
            <p className="text-xl">No hay pagos registrados</p>
          </div>
        ) : (
          <div className="theme-bg-card backdrop-blur-sm theme-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b theme-border">
                    <th className="px-6 py-4 text-left text-sm font-semibold theme-text-secondary">Fecha</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold theme-text-secondary">Pasajero</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold theme-text-secondary">Email</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold theme-text-secondary">Tipo</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold theme-text-secondary">Tickets</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold theme-text-secondary">Método</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold theme-text-secondary">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b theme-border/50 hover:theme-input/30 transition"
                    >
                      <td className="px-6 py-4 text-sm theme-text-secondary">
                        {new Date(payment.fecha).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium theme-text-primary">
                        {payment.usuario.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm theme-text-muted">{payment.usuario.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getTipoColor(payment.tipo)}`}>
                          {getTipoLabel(payment.tipo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                          {payment.cantidad_tickets}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              payment.metodo_pago === 'efectivo'
                                ? 'bg-green-400 text-green-900'
                                : payment.metodo_pago === 'transferencia'
                                ? 'bg-blue-400 text-blue-900'
                                : payment.metodo_pago === 'webpay'
                                ? 'bg-indigo-400 text-indigo-900'
                                : 'bg-purple-400 text-purple-900'
                            }`}
                          >
                            {payment.metodo_pago === 'webpay' ? 'WEBPAY' : payment.metodo_pago.toUpperCase()}
                          </span>
                          {payment.metodo_pago === 'webpay' && (
                            <div className="text-xs theme-text-muted">
                              {payment.tipo_tarjeta && (
                                <span className="capitalize">{payment.tipo_tarjeta}</span>
                              )}
                              {payment.cuotas > 0 && (
                                <span> • {payment.cuotas}x</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right text-lg font-bold ${payment.monto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {payment.monto >= 0 ? '+' : ''}${payment.monto.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Descripción de transacciones */}
            <div className="p-6 border-t theme-border">
              <h3 className="text-sm font-semibold theme-text-secondary mb-3">Últimas transacciones con descripción:</h3>
              <div className="space-y-2">
                {payments
                  .filter(p => p.descripcion)
                  .slice(0, 5)
                  .map(payment => (
                    <div key={payment.id} className="text-sm theme-text-muted">
                      <span className="theme-text-primary font-medium">{payment.usuario.nombre}:</span> {payment.descripcion}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
