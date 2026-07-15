import { useState, useEffect } from 'react';

const ThemeToggle = () => {
  // Estado para saber si el modo oscuro está activo o no
  const [isDark, setIsDark] = useState(false);

  // useEffect "escucha" el estado isDark. Cada vez que cambia, 
  // le agrega o le quita la clase 'dark' a la etiqueta <body> del HTML
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
      // Al hacer clic, invertimos el valor (de true a false, o de false a true)
      onClick={() => setIsDark(!isDark)}
    >
      <span className="theme-icon" aria-hidden="true">
        {/* Renderizado condicional: Si isDark es true, muestra a Gardevoir, sino a Charmander */}
        {isDark ? (
          <img src="/sprites/Gardevoir.webp" alt="Modo claro" />
        ) : (
          <img src="/sprites/Charmander.png" alt="Modo oscuro" />
        )}
      </span>
      <span className="theme-label">
        {/* Renderizado condicional del texto */}
        {isDark ? 'Modo claro' : 'Modo oscuro'}
      </span>
    </button>
  );
};

export default ThemeToggle;