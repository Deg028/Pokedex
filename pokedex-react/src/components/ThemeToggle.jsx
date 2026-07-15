import { useState, useEffect } from 'react';

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

const ThemeToggle = () => {
  // Inicializa leyendo la preferencia guardada (igual que tu versión original en JS puro)
  const [isDark, setIsDark] = useState(() => safeGet('pokedex-theme') === 'dark');

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark', isDark);
    safeSet('pokedex-theme', theme);
  }, [isDark]);

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label="Cambiar tema"
      onClick={() => setIsDark((prev) => !prev)}
    >
      <span className="theme-icon" aria-hidden="true">
        {isDark ? (
          <img src="/sprites/Gardevoir.webp" alt="" />
        ) : (
          <img src="/sprites/Charmander.png" alt="" />
        )}
      </span>
      <span className="theme-label">
        {isDark ? 'Modo claro' : 'Modo oscuro'}
      </span>
    </button>
  );
};

export default ThemeToggle;