const searchBtn = document.getElementById("search-btn");
const pokemonInput = document.getElementById("pokemon-input");
const generationFilter = document.getElementById("generation-filter");
const pokemonGrid = document.getElementById("pokemon-grid");
const errorMessage = document.getElementById("error-message");
const themeToggle = document.getElementById("theme-toggle");

// Diccionario de colores para los tipos de Pokémon
const typeColors = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705898",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

// Rangos de la Pokédex Nacional por generación [inicio, fin]
const GEN_RANGES = {
  "": [1, 1025],
  1: [1, 151],
  2: [152, 251],
  3: [252, 386],
  4: [387, 493],
  5: [494, 649],
  6: [650, 721],
  7: [722, 809],
  8: [810, 905],
  9: [906, 1025],
};

const GRID_SIZE = 9; // Cuadrícula de 3x3
const SEARCH_RESULT_LIMIT = 18;
const CRY_COOLDOWN_MS = 900;
const API_TIMEOUT_MS = 10000;

// Caché de logos de tipos para evitar peticiones repetidas
const typeLogoCache = new Map();
const speciesCache = new Map();
let pokemonListCache = null;
const lastCryByPokemon = new Map();
const pokemonCryPlayer = new Audio();
pokemonCryPlayer.preload = "none";
pokemonCryPlayer.volume = 0.45;

// ---------- Eventos ----------

searchBtn.addEventListener("click", () => {
  const query = pokemonInput.value.toLowerCase().trim();
  if (query) {
    searchPokemon(query);
  } else {
    loadGrid(generationFilter.dataset.value);
  }
});

// Permitir búsqueda al presionar "Enter"
pokemonInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

// Dropdown de generaciones (Bootstrap)
document.querySelectorAll(".gen-option").forEach((option) => {
  option.addEventListener("click", () => {
    generationFilter.dataset.value = option.dataset.value;
    generationFilter.textContent = option.textContent;

    document
      .querySelectorAll(".gen-option")
      .forEach((el) => el.classList.remove("active"));
    option.classList.add("active");

    // Al cambiar de generación, recargar la cuadrícula
    pokemonInput.value = "";
    loadGrid(option.dataset.value);
  });
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  const icon = themeToggle.querySelector(".theme-icon");
  const label = themeToggle.querySelector(".theme-label");

  if (isDark) {
    icon.innerHTML = '<img src="sprites/Gardevoir.webp" alt="" />';
    label.textContent = "Modo claro";
  } else {
    icon.innerHTML = '<img src="sprites/Charmander.png" alt="" />';
    label.textContent = "Modo oscuro";
  }
});

// ---------- Carga de datos ----------

// Carga una cuadrícula de Pokémon según la generación seleccionada
async function loadGrid(genValue) {
  errorMessage.classList.add("hidden");
  showSpinner();

  const [start, end] = GEN_RANGES[genValue] || GEN_RANGES[""];
  const ids = [];
  for (let id = start; id < start + GRID_SIZE && id <= end; id++) {
    ids.push(id);
  }

  try {
    const results = await Promise.all(
      ids.map((id) =>
        fetchJsonWithTimeout(`https://pokeapi.co/api/v2/pokemon/${id}`),
      ),
    );

    pokemonGrid.innerHTML = "";
    results.filter(Boolean).forEach(addCard);
  } catch {
    pokemonGrid.innerHTML = "";
    errorMessage.classList.remove("hidden");
  }
}

// Busca un Pokémon concreto y lo muestra solo en la cuadrícula
async function searchPokemon(query) {
  errorMessage.classList.add("hidden");
  showSpinner();

  const selectedGen = generationFilter.dataset.value;
  const [start, end] = GEN_RANGES[selectedGen] || GEN_RANGES[""];

  try {
    const normalizedQuery = normalizePokemonQuery(query);
    if (!normalizedQuery) throw new Error("Consulta vacia");

    // Búsqueda exacta por nombre o número directamente en la REST API.
    const exactData = await fetchJsonWithTimeout(
      `https://pokeapi.co/api/v2/pokemon/${normalizedQuery}`,
    );

    if (exactData) {
      if (selectedGen && (exactData.id < start || exactData.id > end)) {
        throw new Error("No pertenece a esa generación");
      }
      pokemonGrid.innerHTML = "";
      addCard(exactData);
      return;
    }

    // Búsqueda parcial por nombre en la lista completa.
    const pokemonList = await getPokemonList();
    const matchingIds = pokemonList
      .map((p) => ({ name: p.name, id: extractPokemonId(p.url) }))
      .filter(
        (p) =>
          p.id &&
          p.name.includes(normalizedQuery) &&
          (!selectedGen || (p.id >= start && p.id <= end)),
      )
      .slice(0, SEARCH_RESULT_LIMIT)
      .map((p) => p.id);

    if (!matchingIds.length) throw new Error("Pokémon no encontrado");

    const results = await Promise.all(
      matchingIds.map((id) =>
        fetchJsonWithTimeout(`https://pokeapi.co/api/v2/pokemon/${id}`),
      ),
    );

    const validResults = results.filter(Boolean);
    if (!validResults.length) throw new Error("Pokémon no encontrado");

    pokemonGrid.innerHTML = "";
    validResults.forEach(addCard);
  } catch {
    pokemonGrid.innerHTML = "";
    errorMessage.classList.remove("hidden");
  }
}

// ---------- Render ----------

// Muestra un spinner de carga en la cuadrícula
function showSpinner() {
  pokemonGrid.innerHTML =
    '<div class="col-12 text-center py-5">' +
    '<div class="spinner-border text-danger" role="status">' +
    '<span class="visually-hidden">Cargando...</span></div></div>';
}

// Crea y añade una card de Pokémon a la cuadrícula
function addCard(data) {
  const col = document.createElement("div");
  col.className = "col";

  const card = document.createElement("div");
  card.className = "card pokemon-card grid-card h-100 border-0 p-2 text-center";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute(
    "aria-label",
    `Reproducir grito de ${data.name} y seleccionar card`,
  );

  // Número de la Pokédex
  const id = document.createElement("span");
  id.className = "poke-id d-block";
  id.textContent = `#${String(data.id).padStart(3, "0")}`;
  card.appendChild(id);

  // Imagen
  const imgWrap = document.createElement("div");
  imgWrap.className =
    "image-container-sm mx-auto rounded-circle d-flex align-items-center justify-content-center mb-2";
  const img = document.createElement("img");
  img.className = "img-fluid";
  img.alt = data.name;
  img.src =
    data.sprites?.other?.["official-artwork"]?.front_default ||
    data.sprites?.front_default ||
    "";
  imgWrap.appendChild(img);
  card.appendChild(imgWrap);

  // Nombre
  const name = document.createElement("h3");
  name.className = "poke-name text-capitalize mb-2";
  name.textContent = data.name;
  card.appendChild(name);

  // Tipos
  const types = document.createElement("div");
  types.className = "d-flex flex-wrap justify-content-center gap-1";
  data.types.forEach((typeInfo) => {
    const typeName = typeInfo.type.name;

    const badge = document.createElement("span");
    badge.className = "type-badge";
    badge.textContent = typeName;
    badge.style.backgroundColor = typeColors[typeName] || "#777";
    types.appendChild(badge);

    // Reemplazar por el logo oficial del tipo (con caché)
    getTypeLogo(typeInfo.type).then((logoUrl) => {
      if (!logoUrl) return;
      const logo = document.createElement("img");
      logo.src = logoUrl;
      logo.alt = typeName;
      logo.className = "type-logo";
      badge.replaceWith(logo);
    });
  });

  addSpecialBadges(data.id, card, types);
  card.appendChild(types);

  // Efecto y grito al pasar el mouse.
  card.addEventListener("mouseenter", () => {
    animateCardCry(card);
    playPokemonCry(data);
  });

  // Efecto y grito al seleccionar con click o teclado.
  card.addEventListener("click", () => {
    animateCardCry(card);
    playPokemonCry(data, { force: true });
  });

  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    animateCardCry(card);
    playPokemonCry(data, { force: true });
  });

  col.appendChild(card);
  pokemonGrid.appendChild(col);
}

function getCryUrl(data) {
  return data?.cries?.latest || data?.cries?.legacy || null;
}

function canPlayCry(pokemonId, force) {
  if (force) return true;

  const now = Date.now();
  const lastPlayedAt = lastCryByPokemon.get(pokemonId) || 0;
  if (now - lastPlayedAt < CRY_COOLDOWN_MS) return false;

  lastCryByPokemon.set(pokemonId, now);
  return true;
}

function playPokemonCry(data, { force = false } = {}) {
  const cryUrl = getCryUrl(data);
  if (!cryUrl || !canPlayCry(data.id, force)) return;

  if (pokemonCryPlayer.src !== cryUrl) {
    pokemonCryPlayer.src = cryUrl;
  }

  pokemonCryPlayer.currentTime = 0;
  pokemonCryPlayer.play().catch(() => {
    // Algunos navegadores bloquean autoplay si no detectan gesto de usuario.
  });
}

function animateCardCry(card) {
  card.classList.remove("card-crying");
  // Forzar reflow para reiniciar la animación en eventos consecutivos.
  void card.offsetWidth;
  card.classList.add("card-crying");
}

function addSpecialBadges(pokemonId, card, typesElement) {
  getPokemonSpecies(pokemonId).then((speciesData) => {
    if (!speciesData) return;

    const badges = [];
    if (speciesData.is_legendary) {
      badges.push({ text: "Legendario", className: "legendary-badge" });
    }
    if (speciesData.is_mythical) {
      badges.push({ text: "Mitico", className: "mythical-badge" });
    }
    if (!badges.length) return;

    const wrap = document.createElement("div");
    wrap.className = "d-flex flex-wrap justify-content-center gap-1 mb-1";

    badges.forEach((badgeData) => {
      const badge = document.createElement("span");
      badge.className = `special-badge ${badgeData.className}`;
      badge.textContent = badgeData.text;
      wrap.appendChild(badge);
    });

    card.insertBefore(wrap, typesElement);
  });
}

// Obtiene el logo oficial de un tipo desde la PokeAPI (cacheado)
function getTypeLogo(type) {
  if (typeLogoCache.has(type.name)) {
    return typeLogoCache.get(type.name);
  }

  const promise = fetchJsonWithTimeout(type.url, 7000)
    .then((typeData) => {
      if (!typeData) return null;
      const sprites = typeData.sprites || {};
      return (
        sprites["generation-viii"]?.["sword-shield"]?.name_icon ||
        sprites["generation-ix"]?.["scarlet-violet"]?.name_icon ||
        null
      );
    })
    .catch(() => null);

  typeLogoCache.set(type.name, promise);
  return promise;
}

function getPokemonSpecies(pokemonId) {
  if (speciesCache.has(pokemonId)) {
    return speciesCache.get(pokemonId);
  }

  const promise = fetchJsonWithTimeout(
    `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`,
    7000,
  ).catch(() => null);

  speciesCache.set(pokemonId, promise);
  return promise;
}

async function getPokemonList() {
  if (pokemonListCache) {
    return pokemonListCache;
  }

  pokemonListCache = fetchJsonWithTimeout(
    "https://pokeapi.co/api/v2/pokemon?limit=2000",
  )
    .then((data) => data?.results || [])
    .catch(() => []);

  return pokemonListCache;
}

function extractPokemonId(url) {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

function normalizePokemonQuery(query) {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function fetchJsonWithTimeout(url, timeoutMs = API_TIMEOUT_MS, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal })
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null)
    .finally(() => clearTimeout(timeoutId));
}

function fetchPokemonByQuery(query) {
  return fetchJsonWithTimeout(`https://pokeapi.co/api/v2/pokemon/${query}`);
}

// ---------- Inicio ----------
loadGrid("");
