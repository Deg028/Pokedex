import { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  // Estados locales para guardar lo que el usuario escribe y selecciona
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('');

  // Función que se ejecuta al presionar "Buscar" o dar Enter
  const handleSearch = () => {
    const trimmedQuery = query.toLowerCase().trim();
    if (trimmedQuery) {
      // Ejecutamos la función fetchPokemon que viene desde App.jsx
      onSearch(trimmedQuery, generation);
    }
  };

  // Función para detectar la tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Función para disparar la búsqueda automáticamente al cambiar el select
  const handleGenerationChange = (e) => {
    const newGen = e.target.value;
    setGeneration(newGen);
    
    const trimmedQuery = query.toLowerCase().trim();
    if (trimmedQuery) {
      onSearch(trimmedQuery, newGen);
    }
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Busca por nombre o número..."
        value={query}
        // Cada vez que el usuario teclea, guardamos el texto en el estado 'query'
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      
      <select 
        value={generation} 
        onChange={handleGenerationChange}
      >
        <option value="">Todas las generaciones</option>
        <option value="1">Gen I</option>
        <option value="2">Gen II</option>
        <option value="3">Gen III</option>
        <option value="4">Gen IV</option>
        <option value="5">Gen V</option>
        <option value="6">Gen VI</option>
        <option value="7">Gen VII</option>
        <option value="8">Gen VIII</option>
        <option value="9">Gen IX</option>
      </select>

      <button onClick={handleSearch}>Buscar</button>
    </div>
  );
};

export default SearchBar;