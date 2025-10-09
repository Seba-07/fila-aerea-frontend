'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Componente interno que usa el contexto
function ThemeToggleButton() {
  const { useTheme } = require('@/lib/theme-context');
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Cambiar tema"
      title={theme === 'day' ? 'Cambiar a modo noche' : 'Cambiar a modo día'}
    >
      <div className="theme-toggle-slider">
        {theme === 'day' ? '☀️' : '🌙'}
      </div>
    </button>
  );
}

// Componente principal que maneja SSR
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // No renderizar en SSR
  if (!mounted) {
    return (
      <div className="theme-toggle">
        <div className="theme-toggle-slider">☀️</div>
      </div>
    );
  }

  return <ThemeToggleButton />;
}
