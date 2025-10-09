'use client';

import { useTheme } from '@/lib/theme-context';

export default function ThemeToggle() {
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
