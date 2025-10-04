import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fila Aérea',
  description: 'Gestión de filas y embarques para festival aéreo',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
