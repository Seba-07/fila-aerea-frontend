# Fila Aérea - Frontend

Aplicación web progresiva (PWA) para gestión de filas y embarques en festival aéreo.

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: Zustand
- **HTTP**: Axios
- **Tiempo Real**: Socket.IO Client
- **QR**: qrcode.react
- **PWA**: next-pwa
- **Tests**: Jest + Testing Library

## Requisitos

- Node.js 18+
- Backend corriendo en http://localhost:4000 (o URL configurada)

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/fila-aerea-frontend.git
cd fila-aerea-frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con la URL del backend
```

## Variables de Entorno

Crear archivo `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_PUSH_PROVIDER=none  # onesignal | fcm | none
NEXT_PUBLIC_ONESIGNAL_APP_ID=
NEXT_PUBLIC_FCM_VAPID_KEY=
```

## Comandos

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start

# Tests
npm run test

# Lint
npm run lint
```

## Estructura de Páginas

- `/` - Home (dashboard con turno y accesos rápidos)
- `/login` - Autenticación con OTP
- `/vuelos` - Lista de vuelos disponibles
- `/vuelos/[id]` - Detalle de vuelo y mapa de asientos
- `/mi-pase` - Pase de embarque con QR
- `/staff` - Panel de staff (requiere rol staff/admin)

## Funcionalidades

### Pasajeros

1. **Login con OTP**: Email → código 6 dígitos
2. **Ver turno**: Número de turno global asignado
3. **Explorar vuelos**: Filtrados por estado (abierto/boarding)
4. **Reservar asiento**: Hold por 5 minutos con temporizador
5. **Confirmar asiento**: Genera pase de embarque con QR
6. **Ver QR**: Pase listo para escaneo en embarque
7. **Tiempo real**: Actualizaciones automáticas de asientos vía Socket.IO

### Staff

1. **Gestión de vuelos**: Crear, abrir, cerrar, cambiar estado
2. **Incrementar turno_max_permitido**: Habilitar más pasajeros
3. **Escanear QR**: Validar pases de embarque
4. **Cerrar vuelo**: Procesa no-shows automáticamente

## Flujo de Usuario (Pasajero)

1. Ir a `/login`
2. Ingresar email → recibir código OTP en logs del backend
3. Verificar código (ingresar nombre si es nuevo usuario)
4. En Home: ver turno asignado
5. Ir a "Ver Vuelos"
6. Seleccionar un vuelo donde `turno_global ≤ turno_max_permitido`
7. Ver mapa de asientos
8. Click en asiento libre → queda en "hold" por 5 min
9. Confirmar antes de que expire
10. Se genera QR
11. Ir a "Mi Pase" para ver QR
12. Staff escanea QR y marca embarcado

## Tiempo Real (Socket.IO)

El frontend se suscribe automáticamente a eventos:

```typescript
// Eventos recibidos del backend
socket.on('flightUpdated', (data) => {
  // Actualizar estado del vuelo (boarding, zona, etc.)
});

socket.on('seatUpdated', (data) => {
  // Actualizar estado de asiento (libre, hold, confirmado, embarcado)
});
```

## PWA (Progressive Web App)

- **Manifest**: `/public/manifest.json`
- **Service Worker**: Generado automáticamente por `next-pwa` en producción
- **Instalable**: Agregar a pantalla de inicio en móviles
- **Offline**: Modo read-only (banners informativos)

Para testear PWA localmente:
```bash
npm run build && npm start
```

Luego abrir en Chrome y verificar en DevTools > Application > Manifest.

## Despliegue en Vercel

1. Push código a GitHub
2. Ir a [Vercel](https://vercel.com)
3. Importar repositorio `fila-aerea-frontend`
4. Configurar variables de entorno:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://tu-backend.railway.app/api
   NEXT_PUBLIC_SOCKET_URL=https://tu-backend.railway.app
   NEXT_PUBLIC_PUSH_PROVIDER=none
   ```
5. Deploy automático
6. URL asignada: `https://tu-proyecto.vercel.app`
7. Actualizar `CORS_ORIGIN` en backend con esta URL

## Configurar OneSignal (Push Notifications)

1. Crear app en [OneSignal](https://onesignal.com)
2. Configurar Web Push con dominio de Vercel
3. Copiar App ID
4. En `.env.local`:
   ```
   NEXT_PUBLIC_PUSH_PROVIDER=onesignal
   NEXT_PUBLIC_ONESIGNAL_APP_ID=tu_app_id
   ```
5. Agregar script de OneSignal en `app/layout.tsx` (ver docs OneSignal)

## Tests

```bash
npm run test
```

Tests incluidos:
- Componentes de login
- Store de autenticación
- Hooks de Socket.IO

## Optimizaciones

- **Code splitting**: Automático por Next.js App Router
- **Lazy loading**: Componentes pesados cargados bajo demanda
- **Imágenes**: Usar `next/image` para optimización automática
- **Fonts**: next/font para carga optimizada
- **Bundle size**: Analizar con `@next/bundle-analyzer`

## Soporte

- Issues: https://github.com/tu-usuario/fila-aerea-frontend/issues
- Docs Next.js: https://nextjs.org/docs

## Licencia

MIT
