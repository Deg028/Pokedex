# Pokédex Web

Una Pokédex interactiva con estética retro/pixel inspirada en el dispositivo clásico de la franquicia Pokémon. Permite buscar, explorar y escuchar a los Pokémon de todas las generaciones, con un reproductor de música de temas de batalla integrado.

## Funcionalidades

- **Búsqueda de Pokémon** por nombre o número de Pokédex, con debounce para evitar peticiones innecesarias mientras se escribe.
- **Filtro por generación** (Gen I a Gen IX) mediante un dropdown estilo Pokédex.
- **Scroll infinito**: los resultados se cargan en páginas a medida que el usuario se desplaza, usando `IntersectionObserver`.
- **Tarjetas de Pokémon** con número, sprite, nombre y tipos, con colores dinámicos según el tipo.
- **Modal de detalle**: al hacer clic en una tarjeta se abre una vista ampliada con altura, peso, experiencia base, habilidades y barras de estadísticas animadas.
- **Sonido de grito (cry)** del Pokémon al abrir su detalle, con múltiples fuentes de respaldo (PokeAPI y PokémonShowdown) por si alguna falla.
- **Reproductor de música integrado** con playlist de temas de batalla y rivales de distintos juegos de la saga (controles de reproducir/pausar, siguiente y anterior), que se reposiciona automáticamente en la parte inferior de la pantalla en dispositivos móviles.
- **Modo claro / oscuro** con paleta de colores propia para cada tema, persistido en `localStorage`, y un botón de cambio de tema con ícono animado.
- **Diseño responsive**, adaptado a distintos tamaños de pantalla (escritorio, tablet y móvil).
- **Favicon** e identidad visual personalizada con tipografías pixel (`Press Start 2P`, `VT323`).
- Consumo de datos en tiempo real desde la [PokeAPI](https://pokeapi.co/).

## Tecnologías utilizadas

- **HTML5** — estructura semántica de la aplicación.
- **CSS3** — estilos, variables CSS (custom properties) para theming claro/oscuro, animaciones y diseño responsive con media queries.
- **JavaScript (Vanilla, ES6+)** — lógica de la aplicación: fetch a la API, manejo del DOM, estado de la búsqueda, scroll infinito, reproductor de audio y modal de detalle, sin frameworks ni librerías externas de JS.
- **Bootstrap 5** — sistema de grillas y componentes base (inputs, dropdowns, botones).
- **PokeAPI** — fuente de datos de todos los Pokémon (sprites, tipos, estadísticas, habilidades, cries).
- **PokémonShowdown Audio** y **GitHub (raw content)** — fuentes de audio para los cries y la playlist de música de fondo.

## Estructura del proyecto

```
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── sprites/
    └── (imágenes e íconos usados en la interfaz)
```
