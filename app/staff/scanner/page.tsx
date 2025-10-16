'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Html5Qrcode } from 'html5-qrcode';
import { staffAPI } from '@/lib/api';

export default function QRScannerPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraId, setCameraId] = useState<string>('');

  useEffect(() => {
    if (user?.rol !== 'staff') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [scanning]);

  const startScanner = async () => {
    try {
      setError('');
      setResult(null);
      setValidationResult(null);

      // Get camera devices
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        // Prefer back camera (environment facing)
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        const selectedCamera = backCamera || devices[0];
        setCameraId(selectedCamera.id);

        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          selectedCamera.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            // Stop scanning after successful scan
            await html5QrCode.stop();
            setScanning(false);

            try {
              const qrData = JSON.parse(decodedText);
              setResult(qrData);

              // Validate with backend
              const validation = await staffAPI.validateQR(qrData);
              setValidationResult(validation.data);
            } catch (err: any) {
              setError('Error al validar el QR: ' + (err.response?.data?.error || err.message));
            }
          },
          (errorMessage) => {
            // Scanning errors (not critical)
          }
        );

        setScanning(true);
      } else {
        setError('No se encontraron cámaras disponibles');
      }
    } catch (err: any) {
      setError('Error al iniciar el scanner: ' + err.message);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scanning) {
      await scannerRef.current.stop();
      scannerRef.current = null;
      setScanning(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setValidationResult(null);
    setError('');
  };

  if (user?.rol !== 'staff') {
    return null;
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      <header className="theme-bg-card backdrop-blur-sm border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="theme-text-primary hover:text-primary transition">
            ← Inicio
          </button>
          <img src="/logo.png" alt="Cessna" className="h-8" />
          <h1 className="text-2xl font-bold theme-text-primary">Escanear QR</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="theme-bg-card backdrop-blur-sm rounded-2xl theme-border p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold theme-text-primary mb-2">
              Validación de Pasajeros
            </h2>
            <p className="theme-text-muted text-sm">
              Escanea el código QR del pase de embarque del pasajero
            </p>
          </div>

          {/* Scanner Area */}
          <div className="mb-6">
            <div id="qr-reader" className={`${scanning ? '' : 'hidden'} rounded-lg overflow-hidden`}></div>

            {!scanning && !result && (
              <div className="bg-slate-700 rounded-lg p-12 text-center">
                <div className="mb-4">
                  <svg className="w-24 h-24 mx-auto theme-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <p className="theme-text-muted">
                  Presiona "Iniciar Escaneo" para activar la cámara
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-6">
            {!scanning && !result && (
              <button
                onClick={startScanner}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                📷 Iniciar Escaneo
              </button>
            )}

            {scanning && (
              <button
                onClick={stopScanner}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition"
              >
                ⏹ Detener
              </button>
            )}

            {result && (
              <button
                onClick={() => {
                  resetScanner();
                  startScanner();
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                🔄 Escanear Otro
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Validation Result */}
          {validationResult && (
            <div className={`border rounded-lg p-6 ${
              validationResult.valido
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="text-center mb-4">
                {validationResult.valido ? (
                  <div className="text-6xl mb-2">✅</div>
                ) : (
                  <div className="text-6xl mb-2">❌</div>
                )}
                <h3 className={`text-xl font-bold ${
                  validationResult.valido ? 'text-green-400' : 'text-red-400'
                }`}>
                  {validationResult.valido ? 'PASAJERO VÁLIDO' : 'PASAJERO INVÁLIDO'}
                </h3>
              </div>

              {validationResult.valido && result && (
                <div className="space-y-3">
                  <div className="theme-bg-secondary rounded-lg p-3">
                    <p className="text-sm theme-text-muted">Pasajero</p>
                    <p className="text-lg font-bold theme-text-primary">{result.pasajero}</p>
                  </div>
                  <div className="theme-bg-secondary rounded-lg p-3">
                    <p className="text-sm theme-text-muted">Ticket</p>
                    <p className="text-lg font-medium theme-text-primary">{result.codigo}</p>
                  </div>
                  <div className="theme-bg-secondary rounded-lg p-3">
                    <p className="text-sm theme-text-muted">Circuito</p>
                    <p className="text-lg font-medium theme-text-primary">#{result.circuito}</p>
                  </div>
                </div>
              )}

              {!validationResult.valido && (
                <div className="mt-4">
                  <p className="text-red-300 text-center">{validationResult.mensaje}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
