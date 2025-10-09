'use client';

import { useTheme } from '@/lib/theme-context';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
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
