# Pokédex Web (React)

Una Pokédex interactiva con estética retro/pixel inspirada en el dispositivo clásico de la franquicia Pokémon. Permite buscar y explorar Pokémon de todas las generaciones, con reproductor de música de temas de batalla integrado y soporte de modo claro/oscuro.

Migrada desde una versión original en HTML, CSS y JavaScript vanilla a **React + Vite**.

🔗 **Demo en vivo:** [pokedeg.netlify.app](https://pokedeg.netlify.app)

## Funcionalidades

- **Búsqueda de Pokémon** por nombre o número de Pokédex.
- **Filtro por generación** (Gen I a Gen IX) mediante un selector estilo Pokédex.
- **Tarjetas de Pokémon** con número, sprite, nombre y tipos, con colores dinámicos según el tipo.
- **Reproductor de música integrado** con controles de reproducir/pausar, siguiente y anterior.
- **Modo claro / oscuro** con paleta de colores propia para cada tema, persistido en `localStorage`, con botón de cambio de tema e ícono animado.
- **Diseño responsive**, adaptado a escritorio, tablet y móvil.
- **Favicon** e identidad visual personalizada con tipografías pixel (`Press Start 2P`, `VT323`).
- Consumo de datos en tiempo real desde la [PokeAPI](https://pokeapi.co/).

## Tecnologías utilizadas

- **React 19** — construcción de la interfaz mediante componentes y estado (`useState`, `useEffect`).
- **Vite** — entorno de desarrollo y build de la aplicación.
- **CSS3** — variables CSS (custom properties) para theming claro/oscuro, animaciones y diseño responsive.
- **PokeAPI** — fuente de datos de todos los Pokémon (sprites, tipos, generaciones, estadísticas).
- **ESLint** — linting del código.
- **Netlify** — hosting y despliegue continuo desde GitHub.

## Estructura del proyecto

```
pokedex-react/
├── index.html
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── sprites/          # Imágenes e íconos usados en la interfaz (fondos, tema, favicon)
├── src/
│   ├── main.jsx
│   ├── App.jsx            # Componente raíz: maneja el fetch a la PokeAPI y el estado global
│   ├── App.css
│   ├── index.css          # Estilos globales, theming y diseño responsive
│   ├── assets/
│   └── components/
│       ├── SearchBar.jsx      # Input de búsqueda + selector de generación
│       ├── PokemonCard.jsx    # Tarjeta con la información del Pokémon
│       └── ThemeToggle.jsx    # Botón de cambio entre modo claro/oscuro
├── package.json
└── vite.config.js
```

## Cómo correr el proyecto localmente

```bash
# Clonar el repositorio
git clone https://github.com/Deg028/Pokedex.git
cd Pokedex/pokedex-react

# Instalar dependencias
npm install

# Levantar el servidor de desarrollo
npm run dev
```

La app quedará disponible en `http://localhost:5173`.

### Otros comandos disponibles

```bash
npm run build     # Genera el build de producción en /dist
npm run preview   # Sirve localmente el build de producción
npm run lint      # Corre ESLint sobre el proyecto
```

## Despliegue

El proyecto se despliega automáticamente en **Netlify** con cada push a la rama principal. Como el proyecto React vive en la subcarpeta `pokedex-react/` dentro del repositorio, la configuración de build en Netlify es:

| Campo | Valor |
|---|---|
| Base directory | `pokedex-react` |
| Build command | `npm run build` |
| Publish directory | `dist` |

## Créditos

- Datos de Pokémon obtenidos de [PokeAPI](https://pokeapi.co/).
- Proyecto con fines educativos. Pokémon y todos los personajes relacionados son propiedad de Nintendo/Game Freak/Creatures Inc.
