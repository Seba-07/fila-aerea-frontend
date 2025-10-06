'use client';

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
        return 'bg-orange-500 text-white';
      case 'devolucion':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-white hover:text-primary transition">
            Volver
          </button>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNnOw7rZE9JPq7XN_ruUQKkzF0Ahxov4RxQw&s"
            alt="Cessna"
            className="h-8"
          />
          <h1 className="text-2xl font-bold text-white">Historial de Pagos</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Totales */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Total recaudado */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-2xl">
            <h2 className="text-sm opacity-90 mb-1">Total Recaudado</h2>
            <p className="text-4xl font-black">${totalRecaudado.toLocaleString('es-CL')}</p>
            <p className="text-xs opacity-75 mt-2">Dinero total ingresado</p>
          </div>

          {/* Total confirmado */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-700 rounded-2xl p-6 text-white shadow-2xl">
            <h2 className="text-sm opacity-90 mb-1">Total Confirmado</h2>
            <p className="text-4xl font-black">${totalConfirmado.toLocaleString('es-CL')}</p>
            <p className="text-xs opacity-75 mt-2">De pasajeros que volaron</p>
          </div>

          {/* Pendiente devolución */}
          <div className="bg-gradient-to-r from-orange-600 to-red-700 rounded-2xl p-6 text-white shadow-2xl">
            <h2 className="text-sm opacity-90 mb-1">Pendiente Devolución</h2>
            <p className="text-4xl font-black">${pendienteDevolucion.toLocaleString('es-CL')}</p>
            <p className="text-xs opacity-75 mt-2">Posibles reembolsos</p>
          </div>
        </div>

        {/* Tabla de transacciones */}
        {payments.length === 0 ? (
          <div className="text-center text-slate-300 py-12">
            <p className="text-xl">No hay pagos registrados</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Fecha</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Pasajero</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Email</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Tipo</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Tickets</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Método</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition"
                    >
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(payment.fecha).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {payment.usuario.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{payment.usuario.email}</td>
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
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            payment.metodo_pago === 'efectivo'
                              ? 'bg-green-400 text-green-900'
                              : payment.metodo_pago === 'transferencia'
                              ? 'bg-blue-400 text-blue-900'
                              : 'bg-purple-400 text-purple-900'
                          }`}
                        >
                          {payment.metodo_pago.toUpperCase()}
                        </span>
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
            <div className="p-6 border-t border-slate-700">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Últimas transacciones con descripción:</h3>
              <div className="space-y-2">
                {payments
                  .filter(p => p.descripcion)
                  .slice(0, 5)
                  .map(payment => (
                    <div key={payment.id} className="text-sm text-slate-400">
                      <span className="text-white font-medium">{payment.usuario.nombre}:</span> {payment.descripcion}
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
