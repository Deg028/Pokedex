const API = "https://pokeapi.co/api/v2";
const TYPE_ICONS = {
  normal: "●",
  fire: "🔥",
  water: "💧",
  electric: "⚡",
  grass: "🌿",
  ice: "❄",
  fighting: "✊",
  poison: "☠",
  ground: "⛰",
  flying: "🕊",
  psychic: "✨",
  bug: "🐛",
  rock: "🪨",
  ghost: "👻",
  dragon: "🐉",
  dark: "🌙",
  steel: "⚙",
  fairy: "🧚",
};

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

const GEN_RANGES = {
  "": [1, 905],
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
const PAGE_SIZE = 9;

// ---------- DOM refs ----------
const pokemonGrid = document.getElementById("pokemon-grid");
const loader = document.getElementById("loader");
const empty = document.getElementById("empty");
const pokemonInput = document.getElementById("pokemon-input");
const generationFilter = document.getElementById("generation-filter");
const searchBtn = document.getElementById("search-btn");
const sentinel = document.getElementById("sentinel");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const themeToggleBtn = document.getElementById("theme-toggle");
const themeLabel = document.querySelector("#theme-toggle .theme-label");
const themeIcon = document.querySelector("#theme-toggle .theme-icon img");

// ---------- State ----------
const cache = new Map();
let currentList = {};
let renderedCount = 0;
let isLoading = false;
let requestId = 0;
let currentAbortController = null;

// ---------- Audio ----------
const pokemonCryPlayer = new Audio();
pokemonCryPlayer.preload = "none";
pokemonCryPlayer.volume = 0.45;

// ---------- Storage helpers (a prueba de localStorage bloqueado) ----------
function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* localStorage no disponible (modo incógnito estricto, etc.) */
  }
}

// ---------- Fetch helper ----------
async function fetchJSON(url, signal) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Fetch failed");
  const data = await res.json();
  cache.set(url, data);
  return data;
}

// ---------- Search / Grid ----------
function buildList() {
  const genValue = generationFilter?.dataset?.value ?? "";
  const [from, to] = GEN_RANGES[genValue] || GEN_RANGES[""];
  const q = pokemonInput.value.trim().toLowerCase();
  let ids = [];
  for (let i = from; i <= to; i++) ids.push(i);
  if (q) {
    const asNum = parseInt(q, 10);
    if (!isNaN(asNum)) ids = ids.filter((id) => String(id).includes(q));
  }
  return { ids, nameQuery: q && isNaN(parseInt(q, 10)) ? q : null };
}

function resetGrid() {
  pokemonGrid.innerHTML = "";
  renderedCount = 0;
  if (empty) empty.hidden = true;
}

async function runSearch() {
  resetGrid();
  const { ids, nameQuery } = buildList();
  currentList = { ids, nameQuery };
  requestId++;
  // Cancela cualquier búsqueda anterior que siga en curso
  if (currentAbortController) currentAbortController.abort();
  currentAbortController = new AbortController();
  await loadMore();
}

async function loadMore() {
  if (isLoading) return;
  const { ids, nameQuery } = currentList;
  if (!ids || renderedCount >= ids.length) return;

  isLoading = true;
  if (loader) loader.hidden = false;
  const myId = requestId;
  const signal = currentAbortController?.signal;

  try {
    let added = 0;
    while (
      added < PAGE_SIZE &&
      renderedCount < ids.length &&
      myId === requestId
    ) {
      const batch = ids.slice(renderedCount, renderedCount + PAGE_SIZE);
      renderedCount += batch.length;
      const results = await Promise.all(
        batch.map((id) =>
          fetchJSON(`${API}/pokemon/${id}`, signal).catch(() => null),
        ),
      );
      // Si esta búsqueda fue cancelada mientras esperábamos, detenerse aquí
      if (myId !== requestId) return;
      const filtered = results.filter((p) => {
        if (!p) return false;
        if (nameQuery) return p.name.includes(nameQuery);
        return true;
      });
      filtered.forEach((p) => pokemonGrid.appendChild(buildCard(p)));
      added += filtered.length;
      if (nameQuery && renderedCount < ids.length && added < PAGE_SIZE)
        continue;
      break;
    }
    // Solo mostrar "sin resultados" si esta llamada sigue siendo la vigente
    // y además todos los IDs fueron procesados (no hay más páginas)
    if (
      myId === requestId &&
      pokemonGrid.children.length === 0 &&
      renderedCount >= ids.length &&
      empty
    ) {
      empty.hidden = false;
      empty.textContent = navigator.onLine
        ? "No se encontraron resultados."
        : "Sin conexión a internet. Revisa tu red e intenta de nuevo.";
    }
  } catch (e) {
    if (e.name !== "AbortError") console.error(e);
  } finally {
    isLoading = false;
    if (loader) loader.hidden = true;
  }

  // Si el sentinel sigue dentro del rango visible al terminar la carga,
  // el IntersectionObserver no vuelve a disparar (no hubo transición).
  // Disparamos manualmente para continuar llenando la pantalla.
  if (currentList.ids && renderedCount < currentList.ids.length) {
    const rect = sentinel.getBoundingClientRect();
    if (rect.top < window.innerHeight + 400) loadMore();
  }
}

// ---------- Card builder (pokeball style) ----------
function buildCard(p) {
  const img =
    p.sprites?.other?.["official-artwork"]?.front_default ||
    p.sprites?.front_default ||
    "";

  const card = document.createElement("div");
  card.className = "pb-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", p.name);

  const chips = (p.types || [])
    .map((t) => {
      const n = t.type.name;
      return `<span class="pb-chip"><i style="background:${typeColors[n] || "#777"}"></i>${n}</span>`;
    })
    .join("");

  card.innerHTML = `
    <div class="pb-top">
      <span class="pb-acc pb-acc--l"></span><span class="pb-acc pb-acc--r"></span>
      <span class="pb-num">#${String(p.id).padStart(3, "0")}</span>
    </div>
    <div class="pb-band"></div>
    <div class="pb-bottom">
      <h3 class="pb-name"></h3>
      <div class="pb-chips">${chips}</div>
    </div>
    <div class="pb-ring"><img alt="" loading="lazy"></div>`;
  card.querySelector(".pb-name").textContent = p.name;
  card.querySelector(".pb-ring img").src = img;

  const openThisCard = () => {
    tryPlayCry(p, { force: true });
    openDetail(p);
  };

  card.addEventListener("click", openThisCard);
  // Accesibilidad: permitir abrir la tarjeta con teclado (Enter / Espacio)
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openThisCard();
    }
  });

  return card;
}

// ---------- Origen: generación, región y mapa del juego ----------
// Mapas de los juegos (sprites/maps). Las regiones sin imagen usan un mapa real
// de la zona que las inspiró.
const REGION_INFO = {
  kanto: { name: "Kanto", gen: "I", game: "HeartGold / SoulSilver", img: "sprites/maps/kanto.jpg" },
  johto: { name: "Johto", gen: "II", game: "Oro / Plata / Cristal", img: "sprites/maps/johto.png", pixel: true },
  hoenn: { name: "Hoenn", gen: "III", game: "Omega Rubí / Zafiro Alfa", img: "sprites/maps/hoenn.png" },
  sinnoh: { name: "Sinnoh", gen: "IV", game: "Diamante / Perla", img: "sprites/maps/sinnoh.jpg" },
  unova: { name: "Teselia (Unova)", gen: "V", inspired: "Nueva York, EE. UU.", bbox: "-74.3,40.5,-73.7,40.95" },
  kalos: { name: "Kalos", gen: "VI", game: "X / Y", img: "sprites/maps/kalos.png" },
  alola: { name: "Alola", gen: "VII", game: "Ultrasol / Ultraluna", img: "sprites/maps/alola.png" },
  galar: { name: "Galar", gen: "VIII", inspired: "Reino Unido", bbox: "-6.0,50.0,1.8,55.5" },
  paldea: { name: "Paldea", gen: "IX", inspired: "Península Ibérica", bbox: "-9.5,36.0,3.3,43.8" },
  hisui: { name: "Hisui", gen: "—", inspired: "Hokkaidō, Japón", bbox: "139.8,41.3,145.8,45.6" },
};
const GEN_REGION = {
  "generation-i": "kanto", "generation-ii": "johto", "generation-iii": "hoenn",
  "generation-iv": "sinnoh", "generation-v": "unova", "generation-vi": "kalos",
  "generation-vii": "alola", "generation-viii": "galar", "generation-ix": "paldea",
};
const HABITATS = {
  cave: "Cueva", forest: "Bosque", grassland: "Pradera", mountain: "Montaña",
  rare: "Raro", "rough-terrain": "Terreno escarpado", sea: "Mar",
  urban: "Urbano", "waters-edge": "Orilla del agua",
};

const prettyPlace = (slug) =>
  slug
    .replace(/-area$/, "")
    .replace(/-(\d+f|b\d+f|1|2|3)$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Región de cada zona de encuentro, consultada a PokeAPI (location-area → location → region)
async function resolveAreaRegion(area) {
  try {
    const a = await fetchJSON(area.location_area.url);
    const l = await fetchJSON(a.location.url);
    return { name: prettyPlace(area.location_area.name), region: l.region?.name || null };
  } catch {
    return { name: prettyPlace(area.location_area.name), region: null };
  }
}

async function loadOrigin(p, panel, token) {
  const [species, encounters] = await Promise.all([
    fetchJSON(`${API}/pokemon-species/${p.id}`).catch(() => null),
    fetchJSON(`${API}/pokemon/${p.id}/encounters`).catch(() => []),
  ]);
  if (panel.dataset.token !== token) return; // se abrió otro Pokémon

  const home = GEN_REGION[species?.generation?.name] || null;
  const uniqueAreas = [];
  const seen = new Set();
  (encounters || []).forEach((e) => {
    const n = prettyPlace(e.location_area.name);
    if (!seen.has(n)) { seen.add(n); uniqueAreas.push(e); }
  });
  const resolved = await Promise.all(uniqueAreas.slice(0, 16).map(resolveAreaRegion));
  if (panel.dataset.token !== token) return;

  // Zonas agrupadas por región
  const byRegion = {};
  resolved.forEach((r) => {
    if (!r.region) return;
    (byRegion[r.region] ||= []).push(r.name);
  });
  const regionList = [...new Set([home, ...Object.keys(byRegion)].filter((r) => r && REGION_INFO[r]))];
  const flavor = species?.flavor_text_entries?.find((f) => f.language.name === "es");
  const habitat = species?.habitat ? HABITATS[species.habitat.name] || species.habitat.name : null;
  const homeInfo = home ? REGION_INFO[home] : null;

  const placeChips = (title, arr) =>
    arr.length
      ? `<h4 class="pb-sub">${title}</h4><div class="pb-places">${arr.map((n) => `<span class="pb-place">${escapeHTML(n)}</span>`).join("")}</div>`
      : "";

  const renderRegion = (slug) => {
    const info = REGION_INFO[slug];
    const names = [...new Set(byRegion[slug] || [])];
    const towns = names.filter((n) => /(town|city|village)/i.test(n));
    const routes = names.filter((n) => !/(town|city|village)/i.test(n));
    const map = info.img
      ? `<img class="pb-map__img${info.pixel ? " pb-map__img--pixel" : ""}" src="${info.img}" alt="Mapa de ${info.name}">
         <div class="pb-map__cap">Mapa del juego — ${info.name} (Pokémon ${info.game})</div>`
      : `<iframe title="Mapa de ${info.name}" loading="lazy"
           src="https://www.openstreetmap.org/export/embed.html?bbox=${info.bbox}&layer=mapnik"></iframe>
         <div class="pb-map__cap">${info.name} — sin mapa de juego disponible; mapa real de la zona que inspiró la región (${info.inspired})</div>`;
    return `
      <div class="pb-map">${map}</div>
      ${placeChips("Pueblos y ciudades donde aparece", towns)}
      ${placeChips("Rutas y zonas donde aparece", routes)}
      ${names.length ? "" : '<p class="pb-flavor">Sin zonas de encuentro registradas en esta región.</p>'}`;
  };

  panel.innerHTML = `
    <div class="pb-info">
      <div class="pb-info__row"><span>Generación</span><b>${homeInfo ? "Gen " + homeInfo.gen : "—"}</b></div>
      <div class="pb-info__row"><span>Región de origen</span><b>${homeInfo ? homeInfo.name : "—"}</b></div>
      ${habitat ? `<div class="pb-info__row"><span>Hábitat</span><b>${habitat}</b></div>` : ""}
    </div>
    ${flavor ? `<p class="pb-flavor">${escapeHTML(flavor.flavor_text.replace(/[\n\f]/g, " "))}</p>` : ""}
    ${regionList.length > 1 ? `<div class="pb-regions" role="tablist">${regionList.map((r, i) => `<button type="button" class="${i ? "" : "active"}" data-region="${r}">${REGION_INFO[r].name}</button>`).join("")}</div>` : ""}
    <div class="pb-region-view">${regionList.length ? renderRegion(regionList[0]) : '<p class="pb-flavor">Sin datos de región para este Pokémon.</p>'}</div>`;

  const view = panel.querySelector(".pb-region-view");
  panel.querySelectorAll(".pb-regions button").forEach((btn) => {
    btn.addEventListener("click", () => {
      panel.querySelectorAll(".pb-regions button").forEach((b) => b.classList.toggle("active", b === btn));
      view.innerHTML = renderRegion(btn.dataset.region);
    });
  });
}

// ---------- Detail modal ----------
function openDetail(p) {
  if (!modal || !modalContent) return;
  const img =
    p.sprites?.other?.["official-artwork"]?.front_default ||
    p.sprites?.front_default ||
    "";
  const primaryType = (p.types || [])[0]?.type?.name || "normal";
  const barColor = typeColors[primaryType] || "#ee1515";
  const stats = (p.stats || [])
    .map((s, i) => {
      const val = s.base_stat;
      const pct = Math.min(100, (val / 200) * 100);
      return `
      <div class="stat">
        <div class="stat__label">${s.stat.name.replace("-", " ")}</div>
        <div class="stat__bar"><div class="stat__fill" data-pct="${pct}" style="transition-delay:${i * 90}ms"></div></div>
        <div class="stat__val">${val}</div>
      </div>`;
    })
    .join("");
  const chips = (p.types || [])
    .map((t) => `<span class="pb-chip"><i style="background:${typeColors[t.type.name] || "#777"}"></i>${t.type.name}</span>`)
    .join("");
  const token = `${p.id}-${Date.now()}`;

  modalContent.innerHTML = `
    <div class="pb-detail">
      <div class="pb-detail__top">
        <span class="pb-acc pb-acc--l"></span><span class="pb-acc pb-acc--r"></span>
        <span class="pb-detail__id">#${String(p.id).padStart(3, "0")}</span>
        <h2 class="pb-detail__name"></h2>
      </div>
      <div class="pb-band"></div>
      <div class="pb-detail__ring"><img src="${img}" alt="${escapeHTML(p.name)}"></div>
      <div class="pb-detail__body">
        <div class="pb-chips pb-chips--lg">${chips}</div>
        <div class="pb-tabs" role="tablist">
          <button type="button" role="tab" class="active" data-tab="stats">Estadísticas</button>
          <button type="button" role="tab" data-tab="map">Mapa y origen</button>
        </div>
        <section data-panel="stats">
          <div class="meta">
            <span><b>Altura:</b> ${(p.height / 10).toFixed(1)} m</span>
            <span><b>Peso:</b> ${(p.weight / 10).toFixed(1)} kg</span>
            <span><b>Exp:</b> ${p.base_experience ?? "—"}</span>
          </div>
          <div class="stats">${stats}</div>
          <h4 class="pb-sub">Habilidades</h4>
          <div class="abilities">
            ${(p.abilities || []).map((a) => `<span class="ability">${a.ability.name.replace("-", " ")}</span>`).join("")}
          </div>
        </section>
        <section data-panel="map" hidden data-token="${token}">
          <p class="pb-flavor">Cargando origen…</p>
        </section>
      </div>
    </div>`;
  modalContent.querySelector(".pb-detail__name").textContent = p.name;
  modal.querySelector(".modal__panel")?.classList.add("pb-modal");

  // Pestañas (el origen se carga al abrir la pestaña por primera vez)
  const mapPanel = modalContent.querySelector('[data-panel="map"]');
  let originLoaded = false;
  modalContent.querySelectorAll(".pb-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      modalContent.querySelectorAll(".pb-tabs button").forEach((b) => b.classList.toggle("active", b === btn));
      modalContent.querySelectorAll("[data-panel]").forEach((s) => (s.hidden = s.dataset.panel !== btn.dataset.tab));
      if (btn.dataset.tab === "map" && !originLoaded) {
        originLoaded = true;
        loadOrigin(p, mapPanel, token);
      }
    });
  });

  modal.hidden = false;
  document.body.style.overflow = "hidden";

  // Animar barras con el color del tipo principal
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modalContent.querySelectorAll(".stat__fill").forEach((bar) => {
        bar.style.background = barColor;
        bar.style.width = bar.dataset.pct + "%";
      });
    });
  });
}

// ---------- Audio / Cry ----------
function tryPlayCry(p, { force = false } = {}) {
  // Priority: PokeAPI cries.latest → PokemonShowdown by name → by id
  const sources = [];
  if (p.cries?.latest) sources.push(p.cries.latest);
  if (p.name)
    sources.push(
      `https://play.pokemonshowdown.com/audio/cries/${p.name.toLowerCase()}.mp3`,
    );
  if (p.id)
    sources.push(`https://play.pokemonshowdown.com/audio/cries/${p.id}.mp3`);
  if (!sources.length) return;
  const trySrc = async (i) => {
    if (i >= sources.length) return;
    try {
      const src = sources[i];
      if (!src) return trySrc(i + 1);
      if (pokemonCryPlayer.src !== src) pokemonCryPlayer.src = src;
      pokemonCryPlayer.currentTime = 0;
      await pokemonCryPlayer.play();
    } catch {
      trySrc(i + 1);
    }
  };
  trySrc(0);
}

// ---------- Modal (guarded — only active if #modal exists in HTML) ----------
function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target.dataset.close !== undefined) closeModal();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && !modal.hidden) closeModal();
});

// ---------- Infinite scroll ----------
const io = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) loadMore();
  },
  { rootMargin: "400px" },
);
io.observe(sentinel);

// ---------- Event listeners ----------
if (searchBtn) searchBtn.addEventListener("click", runSearch);

document.querySelectorAll(".gen-option").forEach((option) => {
  option.addEventListener("click", () => {
    generationFilter.dataset.value = option.dataset.value;
    generationFilter.textContent = option.textContent;
    document
      .querySelectorAll(".gen-option")
      .forEach((el) => el.classList.remove("active"));
    option.classList.add("active");
    pokemonInput.value = "";
    runSearch();
  });
});

let t;
if (pokemonInput) {
  pokemonInput.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(runSearch, 300);
  });
}

// ---------- Theme ----------
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.body.classList.toggle("dark", theme === "dark");
  if (theme === "dark") {
    if (themeLabel) themeLabel.textContent = "Modo claro";
    if (themeIcon) themeIcon.src = "sprites/Gardevoir.webp";
  } else {
    if (themeLabel) themeLabel.textContent = "Modo oscuro";
    if (themeIcon) themeIcon.src = "sprites/Charmander.png";
  }
  safeSetItem("pokedex-theme", theme);
}
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    setTheme(
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark",
    );
  });
}
setTheme(safeGetItem("pokedex-theme") || "light");

// ---------- Estilos de buscador y botón de tema ----------
const STYLE_PREFS = {
  search: { key: "pokedex-search-style", attr: "data-search-style", def: "classic" },
  toggle: { key: "pokedex-toggle-style", attr: "data-toggle-style", def: "classic" },
};
function applyStyle(kind, value) {
  const cfg = STYLE_PREFS[kind];
  document.documentElement.setAttribute(cfg.attr, value);
  safeSetItem(cfg.key, value);
}
document.querySelectorAll("[data-style-kind]").forEach((sel) => {
  const kind = sel.dataset.styleKind;
  const saved = safeGetItem(STYLE_PREFS[kind].key);
  const valid = [...sel.options].some((o) => o.value === saved);
  const value = valid ? saved : STYLE_PREFS[kind].def;
  sel.value = value;
  applyStyle(kind, value);
  sel.addEventListener("change", () => applyStyle(kind, sel.value));
});

// ---------- Init ----------
runSearch();

// ---------- Music player ----------
const MUSIC_BASE = "https://play.pokemonshowdown.com/audio/";
const musicPlaylist = [
  { name: "Pokémon B/W — Tema Entrenador", url: MUSIC_BASE + "bw-trainer.mp3" },
  {
    name: "Pokémon D/P/Pt — Tema Entrenador",
    url: MUSIC_BASE + "dpp-trainer.mp3",
  },
  {
    name: "Pokémon HG/SS — Entrenador Johto",
    url: MUSIC_BASE + "hgss-johto-trainer.mp3",
  },
  {
    name: "Pokémon HG/SS — Entrenador Kanto",
    url: MUSIC_BASE + "hgss-kanto-trainer.mp3",
  },
  { name: "Pokémon X/Y — Tema Entrenador", url: MUSIC_BASE + "xy-trainer.mp3" },
  {
    name: "Pokémon OR/AS — Tema Entrenador",
    url: MUSIC_BASE + "oras-trainer.mp3",
  },
  { name: "Pokémon S/M — Tema Entrenador", url: MUSIC_BASE + "sm-trainer.mp3" },
  { name: "Pokémon B/W — Rival", url: MUSIC_BASE + "bw-rival.mp3" },
  { name: "Pokémon D/P/Pt — Rival", url: MUSIC_BASE + "dpp-rival.mp3" },
  { name: "Pokémon X/Y — Rival", url: MUSIC_BASE + "xy-rival.mp3" },
  { name: "Pokémon B/W2 — Rival", url: MUSIC_BASE + "bw2-rival.mp3" },
  {
    name: "Pokémon B/W2 — Gym Leader Kanto",
    url: MUSIC_BASE + "bw2-kanto-gym-leader.mp3",
  },
  { name: "Pokémon SPL — Élite Cuatro", url: MUSIC_BASE + "spl-elite4.mp3" },
  {
    name: "Pokémon B/W — Metro Entrenador",
    url: MUSIC_BASE + "bw-subway-trainer.mp3",
  },
  { name: "Colosseum — Miror B.", url: MUSIC_BASE + "colosseum-miror-b.mp3" },
  { name: "Pokémon XD — Miror B.", url: MUSIC_BASE + "xd-miror-b.mp3" },
  {
    name: "Pokémon Scarlet & Violet — Penny (Battle Music)",
    url: "https://raw.githubusercontent.com/Deg028/pokedex-music/a5737e0174fc8cf369e522cb459b8f8f1ae6e055/Pok%C3%A9mon%20Scarlet%20%26%20Violet%20-%20Penny%20Battle%20Music%20(HQ).mp3",
  },
  {
    name: "Pokémon OR/AS — Team Aqua & Magma (Batalla)",
    url: "https://raw.githubusercontent.com/Deg028/pokedex-music/86fb379de2bffaf6dfd7b6e8ecdbeaef89b93947/Pok%C3%A9mon%20Omega%20Ruby%20%26%20Alpha%20Sapphire%20-%20Team%20Aqua%20%26%20Magma%20Battle.mp3",
  },
];

const musicAudio = new Audio();
musicAudio.volume = 0.35;
// Retoma la última canción reproducida, si existe
let musicIdx = parseInt(safeGetItem("pokedex-music-idx"), 10) || 0;
let musicIsPlaying = false;

const musicTrackEl = document.getElementById("musicTrackName");
const musicToggleBtn = document.getElementById("musicToggle");
const musicPrevBtn = document.getElementById("musicPrev");
const musicNextBtn = document.getElementById("musicNext");
const musicNoteEl = document.getElementById("musicNote");

function loadMusicTrack(idx) {
  musicIdx =
    ((idx % musicPlaylist.length) + musicPlaylist.length) %
    musicPlaylist.length;
  const track = musicPlaylist[musicIdx];
  musicAudio.src = track.url;
  if (musicTrackEl) musicTrackEl.textContent = track.name;
  safeSetItem("pokedex-music-idx", String(musicIdx));
}

function setMusicState(playing) {
  musicIsPlaying = playing;
  if (musicToggleBtn) musicToggleBtn.textContent = playing ? "⏸" : "▶";
  if (musicNoteEl) musicNoteEl.classList.toggle("playing", playing);
}

function playMusic() {
  musicAudio
    .play()
    .then(() => setMusicState(true))
    .catch(() => {});
}
function pauseMusic() {
  musicAudio.pause();
  setMusicState(false);
}

musicAudio.addEventListener("ended", () => {
  loadMusicTrack(musicIdx + 1);
  playMusic();
});
musicAudio.addEventListener("error", () => {
  setTimeout(() => {
    loadMusicTrack(musicIdx + 1);
    if (musicIsPlaying) playMusic();
  }, 300);
});

if (musicToggleBtn)
  musicToggleBtn.addEventListener("click", () =>
    musicIsPlaying ? pauseMusic() : playMusic(),
  );
if (musicPrevBtn)
  musicPrevBtn.addEventListener("click", () => {
    loadMusicTrack(musicIdx - 1);
    if (musicIsPlaying) playMusic();
  });
if (musicNextBtn)
  musicNextBtn.addEventListener("click", () => {
    loadMusicTrack(musicIdx + 1);
    if (musicIsPlaying) playMusic();
  });

loadMusicTrack(musicIdx);

// ---------- Pantalla de carga ----------
const loadingScreen = document.getElementById("loading-screen");
if (loadingScreen) {
  setTimeout(() => {
    loadingScreen.classList.add("hide");
    setTimeout(() => loadingScreen.remove(), 500);
  }, 1500);
}