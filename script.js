const searchBtn = document.getElementById('search-btn');
const pokemonInput = document.getElementById('pokemon-input');
const pokemonCard = document.getElementById('pokemon-card');
const errorMessage = document.getElementById('error-message');

// Referencias a los elementos de la tarjeta
const imgElement = document.getElementById('pokemon-img');
const nameElement = document.getElementById('pokemon-name');
const typesElement = document.getElementById('pokemon-types');
const heightElement = document.getElementById('pokemon-height');
const weightElement = document.getElementById('pokemon-weight');

// Diccionario de colores para los tipos de Pokémon
const typeColors = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
    grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
    ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705898',
    steel: '#B7B7CE', fairy: '#D685AD'
};

searchBtn.addEventListener('click', () => {
    const query = pokemonInput.value.toLowerCase().trim();
    if (query) {
        fetchPokemon(query);
    }
});

// Permitir búsqueda al presionar "Enter"
pokemonInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

async function fetchPokemon(query) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
        if (!response.ok) throw new Error('Pokémon no encontrado');
        
        const data = await response.json();
        displayPokemon(data);
    } catch (error) {
        pokemonCard.classList.add('hidden');
        errorMessage.classList.remove('hidden');
    }
}

function displayPokemon(data) {
    errorMessage.classList.add('hidden');
    pokemonCard.classList.remove('hidden');

    // Asignar imagen (usamos el artwork oficial por su alta calidad)
    imgElement.src = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
    
    // Asignar textos (la API devuelve altura y peso en decímetros y hectogramos)
    nameElement.textContent = data.name;
    heightElement.textContent = (data.height / 10).toFixed(1);
    weightElement.textContent = (data.weight / 10).toFixed(1);

    // Limpiar tipos anteriores y crear los nuevos con su color correspondiente
    typesElement.innerHTML = '';
    data.types.forEach(typeInfo => {
        const typeName = typeInfo.type.name;
        const span = document.createElement('span');
        span.textContent = typeName;
        span.className = 'type-badge';
        span.style.backgroundColor = typeColors[typeName] || '#777';
        typesElement.appendChild(span);
    });
}