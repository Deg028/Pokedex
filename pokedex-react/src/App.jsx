import { useState } from 'react';
import ThemeToggle from './components/ThemeToggle';
import SearchBar from './components/SearchBar';
import PokemonCard from './components/PokemonCard';
import './index.css';

function App() {
  // 1. Reemplazamos las variables del DOM por Estados de React
  const [pokemonData, setPokemonData] = useState(null);
  const [speciesData, setSpeciesData] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 2. Traemos tu función fetchPokemon casi intacta, pero actualizando los estados
  const fetchPokemon = async (query, selectedGen) => {
    try {
      setError(false); // Limpiamos errores previos
      
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
      if (!response.ok) throw new Error("Pokémon no encontrado. Intenta de nuevo.");
      
      const data = await response.json();
      
      const speciesResponse = await fetch(data.species.url);
      const species = await speciesResponse.json();

      if (selectedGen && species.generation.name !== `generation-${selectedGen}`) {
        throw new Error("Pokémon no encontrado en esa generación");
      }

      // Si todo sale bien, guardamos los datos en el estado
      setPokemonData(data);
      setSpeciesData(species);
    } catch (err) {
      // Si hay un error, activamos el estado de error
      setError(true);
      setErrorMessage(err.message);
      setPokemonData(null);
      setSpeciesData(null);
    }
  };

  return (
    <>
      <div className="background-pokemon" aria-hidden="true"></div>
      <div className="background-pokemon-left" aria-hidden="true"></div>

      <ThemeToggle />

      <main className="pokedex-container">
        <h1>Pokédex</h1>

        {/* Le pasamos la función fetchPokemon a la barra de búsqueda */}
        <SearchBar onSearch={fetchPokemon} />

        {/* Renderizado condicional: Mostramos el error O la tarjeta del Pokémon */}
        {error ? (
          <p className="error">{errorMessage}</p>
        ) : (
          <PokemonCard pokemon={pokemonData} species={speciesData} />
        )}
      </main>
    </>
  );
}

export default App;