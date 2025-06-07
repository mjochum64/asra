import React, { useState, useEffect } from 'react';
import { getSearchFieldOptions } from '../services/schemaService';

/**
 * Schema-driven SearchBar - automatisch basierend auf verfügbaren durchsuchbaren Feldern
 */
export default function DynamicSearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('all');
  const [fieldOptions, setFieldOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lade verfügbare Suchfelder beim Mount
  useEffect(() => {
    loadSearchFieldOptions();
  }, []);

  const loadSearchFieldOptions = async () => {
    try {
      setIsLoading(true);
      const options = await getSearchFieldOptions();
      setFieldOptions(options);
      
      // Setze den ersten verfügbaren Modus als Standard
      if (options.length > 0) {
        setSearchMode(options[0].value);
      }
    } catch (error) {
      console.error('Failed to load search field options:', error);
      // Fallback zu Standard-Optionen
      setFieldOptions([
        { value: 'all', label: 'Alle Felder', fields: ['title', 'content'] },
        { value: 'title', label: 'Nur Titel', fields: ['title'] },
        { value: 'content', label: 'Nur Inhalt', fields: ['content'] }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Finde die entsprechende Option für den ausgewählten Modus
      const selectedOption = fieldOptions.find(opt => opt.value === searchMode);
      onSearch(searchTerm, searchMode, selectedOption?.fields || []);
    }
  };

  const getFieldInfo = () => {
    const selectedOption = fieldOptions.find(opt => opt.value === searchMode);
    if (!selectedOption) return '';
    
    if (selectedOption.value === 'all') {
      return `Durchsucht: ${selectedOption.fields.join(', ')}`;
    }
    return `Durchsucht: ${selectedOption.fields[0]}`;
  };

  return (
    <div className="mb-6">
      <div className="bg-white p-5 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Suche nach Dokumenten..."
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-solr-primary focus:border-transparent shadow-sm text-gray-700"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!searchTerm.trim() || isLoading}
              className="px-6 py-3 bg-solr-primary text-white rounded-lg hover:bg-solr-accent transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] shadow-sm font-medium"
            >
              {isLoading ? 'Lädt...' : 'Suchen'}
            </button>
          </div>
          
          {/* Dynamische Suchfeld-Optionen */}
          {!isLoading && fieldOptions.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-3 mb-2">
                {fieldOptions.map((option) => (
                  <div key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      id={`search-${option.value}`}
                      name="search-mode"
                      checked={searchMode === option.value}
                      onChange={() => setSearchMode(option.value)}
                      className="h-4 w-4 text-solr-primary focus:ring-solr-primary border-gray-300"
                    />
                    <label htmlFor={`search-${option.value}`} className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              
              {/* Dynamische Feldinfo */}
              <div className="text-xs text-gray-500 flex items-center">
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {getFieldInfo()}
              </div>
            </div>
          )}
        </form>
        
        {/* Schema-Info */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Schema-basierte Suche</span>
            <span>{fieldOptions.length} Suchfeld{fieldOptions.length !== 1 ? 'er' : ''} verfügbar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
