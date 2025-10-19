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
  const [totalEfectivo, setTotalEfectivo] = useState(0);
  const [totalTransferencia, setTotalTransferencia] = useState(0);
  const [totalPassline, setTotalPassline] = useState(0);
  const [totalSocio, setTotalSocio] = useState(0);
  const [totalCombinado, setTotalCombinado] = useState(0);
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

      // Calcular total recaudado
      const total = data.payments
        .filter((p: any) => p.tipo !== 'devolucion')
        .reduce((sum: number, p: any) => sum + p.monto, 0);
      setTotalRecaudado(total);

      // Calcular totales por método de pago
      const efectivo = data.payments
        .filter((p: any) => p.metodo_pago === 'efectivo' && p.tipo !== 'devolucion')
        .reduce((sum: number, p: any) => sum + p.monto, 0);
      setTotalEfectivo(efectivo);

      const transferencia = data.payments
        .filter((p: any) => p.metodo_pago === 'transferencia' && p.tipo !== 'devolucion')
        .reduce((sum: number, p: any) => sum + p.monto, 0);
      setTotalTransferencia(transferencia);

      const passline = data.payments
        .filter((p: any) => p.metodo_pago === 'passline' && p.tipo !== 'devolucion')
        .reduce((sum: number, p: any) => sum + p.monto, 0);
      setTotalPassline(passline);

      const socio = data.payments
        .filter((p: any) => p.metodo_pago === 'socio' && p.tipo !== 'devolucion')
        .reduce((sum: number, p: any) => sum + p.monto, 0);
      setTotalSocio(socio);

      const combinado = data.payments
        .filter((p: any) => p.metodo_pago === 'combinado' && p.tipo !== 'devolucion')
        .reduce((sum: number, p: any) => sum + p.monto, 0);
      setTotalCombinado(combinado);

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

  const handleDeletePayment = async (paymentId: string, pasajeroNombre: string, monto: number) => {
    if (!confirm(`¿Estás seguro de eliminar esta transacción de ${pasajeroNombre} por $${monto.toLocaleString('es-CL')}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await staffAPI.deletePayment(paymentId);
      alert('✓ Transacción eliminada correctamente');
      fetchPayments(); // Recargar lista
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar transacción');
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
        <div className="mb-8">
          {/* Total recaudado */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-2xl mb-4">
            <h2 className="text-sm opacity-90 mb-1">Total Recaudado</h2>
            <p className="text-4xl font-black">${totalRecaudado.toLocaleString('es-CL')}</p>
            <p className="text-xs opacity-75 mt-2">Dinero total ingresado</p>
          </div>

          {/* Desglose por método de pago */}
          <div className="grid md:grid-cols-4 gap-4">
            {/* Efectivo */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
              <h3 className="text-xs opacity-90 mb-1">💵 Efectivo</h3>
              <p className="text-2xl font-bold">${totalEfectivo.toLocaleString('es-CL')}</p>
            </div>

            {/* Transferencia */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
              <h3 className="text-xs opacity-90 mb-1">🏦 Transferencia</h3>
              <p className="text-2xl font-bold">${totalTransferencia.toLocaleString('es-CL')}</p>
            </div>

            {/* Passline */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
              <h3 className="text-xs opacity-90 mb-1">💳 Passline</h3>
              <p className="text-2xl font-bold">${totalPassline.toLocaleString('es-CL')}</p>
            </div>

            {/* Socio */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
              <h3 className="text-xs opacity-90 mb-1">🤝 Socio</h3>
              <p className="text-2xl font-bold">${totalSocio.toLocaleString('es-CL')}</p>
            </div>
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
                    <th className="px-6 py-4 text-center text-sm font-semibold theme-text-secondary">Acciones</th>
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
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeletePayment(payment.id, payment.usuario.nombre, payment.monto)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                          title="Eliminar transacción"
                        >
                          🗑️ Eliminar
                        </button>
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
