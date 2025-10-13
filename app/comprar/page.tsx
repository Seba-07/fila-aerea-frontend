'use client';

import ThemeToggle from '@/components/ThemeToggle';

export default function ComprarPage() {
  const PASSLINE_URL = 'https://www.passline.com/view-event/vuelos-familiares-aerodromo-gamboa-castro';

  return (
    <div className="min-h-screen theme-bg-primary">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold theme-text-primary mb-4">
            ✈️ Comprar Tickets de Vuelo
          </h1>
          <p className="text-xl theme-text-muted">
            Club Aéreo de Castro - Vuelos Familiares
          </p>
        </div>

        {/* Main Card */}
        <div className="theme-bg-card rounded-2xl theme-shadow-lg overflow-hidden">
          {/* Hero Image Placeholder */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-12 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Adquiere tus Tickets
            </h2>
            <p className="text-blue-100">
              Sistema de venta seguro a través de Passline
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Información */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold theme-text-primary mb-4">
                ¿Cómo comprar?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold theme-text-primary mb-1">
                      Compra tus tickets en Passline
                    </h4>
                    <p className="theme-text-muted text-sm">
                      Haz clic en el botón "Ir a Passline" y completa tu compra de forma segura.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold theme-text-primary mb-1">
                      Recibe tu comprobante por email
                    </h4>
                    <p className="theme-text-muted text-sm">
                      Passline te enviará un correo con tu comprobante de compra.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold theme-text-primary mb-1">
                      Espera la confirmación del club
                    </h4>
                    <p className="theme-text-muted text-sm">
                      El staff del Club Aéreo validará tu compra y te enviará un email con acceso a la app para agendar tus vuelos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold theme-text-primary mb-1">
                      Ingresa a la app y agenda tus vuelos
                    </h4>
                    <p className="theme-text-muted text-sm">
                      Una vez validado, podrás ingresar con tu email y seleccionar los horarios de vuelo disponibles.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Importante */}
            <div className="theme-info-box rounded-lg p-6 mb-8">
              <h4 className="font-bold theme-info-text mb-3 flex items-center gap-2">
                <span className="text-2xl">ℹ️</span>
                Información Importante
              </h4>
              <ul className="space-y-2 theme-info-text text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Los horarios de vuelo están sujetos a condiciones climáticas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Recibirás notificaciones de cualquier cambio por email.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Los menores de edad requieren autorización de adulto responsable.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Presentarse 15 minutos antes de la hora de vuelo asignada.</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <a
                href={PASSLINE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                🎫 Ir a Passline para Comprar
              </a>
              <p className="text-sm theme-text-muted mt-4">
                Serás redirigido a la plataforma de venta segura
              </p>
            </div>

            {/* Contact Info */}
            <div className="mt-8 pt-8 border-t theme-border text-center">
              <p className="theme-text-muted text-sm">
                ¿Problemas con tu compra? Contacta al club:
              </p>
              <p className="theme-text-primary font-semibold mt-2">
                📧 contacto@clubaereocastro.cl
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-block px-6 py-3 theme-input rounded-lg hover:theme-bg-secondary theme-text-primary font-semibold transition"
          >
            ← Volver al Inicio
          </a>
        </div>
      </div>
    </div>
  );
}
