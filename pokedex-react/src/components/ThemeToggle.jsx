import { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label="Cambiar tema"
      onClick={() => setIsDark(!isDark)}
    >
      <span className="theme-icon" aria-hidden="true">
        {/* Rutas absolutas actualizadas con / al inicio */}
        {isDark ? (
          <img src="/sprites/Gardevoir.webp" alt="Modo claro" />
        ) : (
          <img src="/sprites/Charmander.png" alt="Modo oscuro" />
        )}
      </span>
      <span className="theme-label">
        {isDark ? 'Modo claro' : 'Modo oscuro'}
      </span>
    </button>
  );
};

export default ThemeToggle;