import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiInfo, FiLoader, FiChevronDown } from 'react-icons/fi';
import useDebounce from '../../hooks/useDebounce';
import axios from 'axios';

const FilterPanel = ({ filters, onFilterChange, onSearch, onClear, loading, viewMode }) => {
  // State for autocomplete
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debouncedSearchTerm = useDebounce(filters.scientificName, 300);
  const autocompleteRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  // Fetch suggestions from iNaturalist API
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Only fetch if search term has at least 2 characters
      if (!debouncedSearchTerm || debouncedSearchTerm.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await axios.get(
          'https://api.inaturalist.org/v1/taxa/autocomplete',
          {
            params: {
              q: debouncedSearchTerm,
              per_page: 10,
              is_active: true,
              rank: 'species,subspecies,variety'
            }
          }
        );
        console.log(response)

        if (response.data && response.data.results) {
          const formattedSuggestions = response.data.results.map(taxon => ({
            id: taxon.id,
            scientificName: taxon.name,
            commonName: taxon.preferred_common_name || null,
            rank: taxon.rank,
            matchedTerm: taxon.matched_term,
            img: taxon?.default_photo?.square_url || ""
          }));
          setSuggestions(formattedSuggestions);
          console.log(suggestions)
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Error fetching species suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm]);

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    onFilterChange('scientificName', suggestion.scientificName);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span> : 
        part
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <FiSearch size={20} />
        Search Filters
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Species Name with Autocomplete */}
        <div ref={autocompleteRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Species Name (Scientific)
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.scientificName}
              onChange={(e) => onFilterChange('scientificName', e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="e.g., Mola mola"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
            />
            {isLoadingSuggestions && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FiLoader className="animate-spin text-gray-400" size={16} />
              </div>
            )}
            {!isLoadingSuggestions && filters.scientificName && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FiChevronDown className="text-gray-400" size={16} />
              </div>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-100'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div>
                        <img src={suggestion.img} alt={suggestion.scientificName} className="w-10 h-10 object-cover rounded-md" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {highlightMatch(suggestion.scientificName, debouncedSearchTerm)}
                      </p>
                      {suggestion.commonName && (
                        <p className="text-xs text-gray-600 truncate">
                          {suggestion.commonName}
                        </p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {suggestion.rank}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {showSuggestions && suggestions.length === 0 && debouncedSearchTerm.length >= 2 && !isLoadingSuggestions && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg px-3 py-2">
              <p className="text-sm text-gray-500 text-center">
                No species found. Try a different search term.
              </p>
            </div>
          )}
        </div>

        {/* Country/Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country/Region
          </label>
          <input
            type="text"
            value={filters.country}
            onChange={(e) => onFilterChange('country', e.target.value)}
            placeholder="e.g., India, Australia"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Overridden by Country ID if both provided
          </p>
        </div>

        {/* Country ID (MRGID) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country ID (MRGID)
          </label>
          <input
            type="number"
            value={filters.countryId}
            onChange={(e) => onFilterChange('countryId', e.target.value)}
            placeholder="e.g., 100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional. Find IDs at{' '}
            <a 
              href="https://www.marineregions.org/gazetteer.php" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Marine Regions
            </a>
          </p>
        </div>

        {/* Grid Precision (only in grid view) */}
        {viewMode === 'grid' && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              Grid Precision
              <span className="font-normal text-blue-600">({filters.precision})</span>
            </label>
            <input
              type="range"
              min="1"
              max="12"
              step="1"
              value={filters.precision}
              onChange={(e) => onFilterChange('precision', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 (Coarse)</span>
              <span>12 (Fine)</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
              <div className="flex items-start gap-1">
                <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" size={12} />
                <p className="text-xs text-blue-800">
                  {filters.precision <= 3 && 'Country/continent level (~156km cells)'}
                  {filters.precision === 4 && 'Large region level (~39km cells)'}
                  {filters.precision === 5 && 'Region level (~5km cells)'}
                  {filters.precision === 6 && 'City level (~1.2km cells)'}
                  {filters.precision === 7 && 'Neighborhood level (~153m cells)'}
                  {filters.precision === 8 && 'Street level (~38m cells)'}
                  {filters.precision >= 9 && 'Building level (~5m cells or smaller)'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Depth Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Depth Range (meters)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={filters.startDepth}
              onChange={(e) => onFilterChange('startDepth', e.target.value)}
              placeholder="Min depth"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              value={filters.endDepth}
              onChange={(e) => onFilterChange('endDepth', e.target.value)}
              placeholder="Max depth"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <FiSearch size={16} />
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FiX size={16} />
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterPanel;
