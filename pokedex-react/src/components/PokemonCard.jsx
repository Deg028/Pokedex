// Diccionario de colores (lo sacamos de tu script.js original)
const typeColors = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705898",
  steel: "#B7B7CE", fairy: "#D685AD",
};

// Recibimos "pokemon" y "species" como propiedades (props) desde App.jsx
const PokemonCard = ({ pokemon, species }) => {
  
  // Si no hay datos de Pokémon (por ejemplo, al abrir la página por primera vez), 
  // devolvemos "null" para que la tarjeta no se renderice vacía.
  if (!pokemon || !species) return null;

  // Calculamos los datos que necesitamos mostrar
  const imageSrc = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default;
  const genName = species.generation.name.replace("generation-", "").toUpperCase();
  const height = (pokemon.height / 10).toFixed(1);
  const weight = (pokemon.weight / 10).toFixed(1);

  return (
    <div className="pokemon-card">
      <div className="image-container">
        <img id="pokemon-img" src={imageSrc} alt={pokemon.name} />
      </div>
      
      <h2 id="pokemon-name">{pokemon.name}</h2>
      <p id="pokemon-generation" className="generation-info">
        Generación: {genName}
      </p>
      
      <div id="pokemon-types" className="types">
        {/* Usamos .map() para iterar sobre el arreglo de tipos y crear un <span> por cada uno */}
        {pokemon.types.map((typeInfo) => {
          const typeName = typeInfo.type.name;
          return (
            <span 
              key={typeName} 
              className="type-badge" 
              // En React, los estilos en línea se pasan como un objeto
              style={{ backgroundColor: typeColors[typeName] || "#777" }}
            >
              {typeName}
            </span>
          );
        })}
      </div>

      <div className="stats">
        <p><strong>Altura:</strong> {height}m</p>
        <p><strong>Peso:</strong> {weight}kg</p>
      </div>
    </div>
  );
};

export default PokemonCard;