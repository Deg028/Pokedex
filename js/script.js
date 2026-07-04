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

// ---------- Audio ----------
const pokemonCryPlayer = new Audio();
pokemonCryPlayer.preload = "none";
pokemonCryPlayer.volume = 0.45;

// ---------- Fetch helper ----------
async function fetchJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
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
  await loadMore();
}

async function loadMore() {
  if (isLoading) return;
  const { ids, nameQuery } = currentList;
  if (!ids || renderedCount >= ids.length) return;

  isLoading = true;
  if (loader) loader.hidden = false;
  const myId = requestId;

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
        batch.map((id) => fetchJSON(`${API}/pokemon/${id}`).catch(() => null)),
      );
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
    if (pokemonGrid.children.length === 0 && empty) empty.hidden = false;
  } catch (e) {
    console.error(e);
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
  card.className = "card pokemon-card grid-card h-100 border-0 p-2 text-center";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", p.name);

  const idSpan = document.createElement("span");
  idSpan.className = "poke-id d-block";
  idSpan.textContent = `#${String(p.id).padStart(3, "0")}`;
  card.appendChild(idSpan);

  const imgWrap = document.createElement("div");
  imgWrap.className =
    "image-container-sm mx-auto rounded-circle d-flex align-items-center justify-content-center mb-2";
  const imgEl = document.createElement("img");
  imgEl.className = "img-fluid";
  imgEl.alt = p.name;
  imgEl.src = img;
  imgWrap.appendChild(imgEl);
  card.appendChild(imgWrap);

  const nameEl = document.createElement("h3");
  nameEl.className = "poke-name text-capitalize mb-2";
  nameEl.textContent = p.name;
  card.appendChild(nameEl);

  const typesDiv = document.createElement("div");
  typesDiv.className = "d-flex flex-wrap justify-content-center gap-1";
  (p.types || []).forEach((typeInfo) => {
    const typeName = typeInfo.type.name;
    const badge = document.createElement("span");
    badge.className = "type-badge";
    badge.textContent = typeName;
    badge.style.backgroundColor = typeColors[typeName] || "#777";
    typesDiv.appendChild(badge);
  });
  card.appendChild(typesDiv);

  card.addEventListener("mouseenter", () => tryPlayCry(p));
  card.addEventListener("click", () => {
    tryPlayCry(p, { force: true });
    openDetail(p);
  });
  return card;
}

// ---------- Detail modal ----------
function openDetail(p) {
  if (!modal || !modalContent) return;
  const img =
    p.sprites?.other?.["official-artwork"]?.front_default ||
    p.sprites?.front_default ||
    "";
  const stats = (p.stats || [])
    .map((s) => {
      const val = s.base_stat;
      const pct = Math.min(100, (val / 200) * 100);
      return `
      <div class="stat">
        <div class="stat__label">${s.stat.name.replace("-", " ")}</div>
        <div class="stat__bar"><div class="stat__fill" style="width:${pct}%"></div></div>
        <div class="stat__val">${val}</div>
      </div>`;
    })
    .join("");
  modalContent.innerHTML = `
    <div class="detail__hero">
      <img class="detail__img" src="${img}" alt="${p.name}"/>
      <div>
        <div class="detail__id">#${String(p.id).padStart(3, "0")}</div>
        <h2 class="detail__name">${p.name}</h2>
        <div class="types" style="justify-content:flex-start;">
          ${(p.types || []).map((t) => `<span class="type type-${t.type.name}"><span class="type__icon">${TYPE_ICONS[t.type.name] || "\u25cf"}</span>${t.type.name}</span>`).join("")}
        </div>
        <div class="meta">
          <span><b>Altura:</b> ${(p.height / 10).toFixed(1)} m</span>
          <span><b>Peso:</b> ${(p.weight / 10).toFixed(1)} kg</span>
          <span><b>Exp:</b> ${p.base_experience ?? "\u2014"}</span>
        </div>
        <div style="margin-top:10px;font-family:'VT323',monospace;font-size:18px;"><b>Habilidades:</b></div>
        <div class="abilities">
          ${(p.abilities || []).map((a) => `<span class="ability">${a.ability.name.replace("-", " ")}</span>`).join("")}
        </div>
      </div>
    </div>
    <div class="stats">${stats}</div>
  `;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
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
  localStorage.setItem("pokedex-theme", theme);
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
setTheme(localStorage.getItem("pokedex-theme") || "light");

// ---------- Init ----------
runSearch();
