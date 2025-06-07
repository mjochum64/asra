import React, { useState, useEffect } from 'react';
import { getFacets, mockGetFacets } from '../services/solrService';

export default function Sidebar({ onFiltersChange, useMock = true, activeFilters = { categories: [], authors: [] } }) {
  const [facets, setFacets] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Lokaler State für ausgewählte Filter
  const [selectedCategories, setSelectedCategories] = useState(activeFilters.categories || []);
  const [selectedAuthors, setSelectedAuthors] = useState(activeFilters.authors || []);

  // Synchronisiere mit aktiven Filtern von der Parent-Komponente
  useEffect(() => {
    setSelectedCategories(activeFilters.categories || []);
    setSelectedAuthors(activeFilters.authors || []);
  }, [activeFilters]);

  // Lade Facetten beim Komponenten-Mount
  useEffect(() => {
    const loadFacets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Verwende Mock-Facetten oder echte Solr-Facetten
        let facetData;
        if (useMock) {
          facetData = await mockGetFacets();
        } else {
          try {
            facetData = await getFacets(['category', 'author']);
            
            // Prüfe, ob Solr-Facetten leer sind und falle auf Mock-Daten zurück
            const hasCategories = facetData.category && facetData.category.length > 0;
            const hasAuthors = facetData.author && facetData.author.length > 0;
            
            if (!hasCategories && !hasAuthors) {
              console.log('Solr facets are empty, falling back to mock data');
              facetData = await mockGetFacets();
              setError('Solr-Facetten sind leer - verwende Mock-Daten');
            }
          } catch (solrError) {
            console.error('Solr facets failed, using mock data:', solrError);
            facetData = await mockGetFacets();
            setError('Solr-Facetten fehlgeschlagen - verwende Mock-Daten');
          }
        }
        
        setFacets(facetData);
      } catch (err) {
        console.error('Error loading facets:', err);
        setError(err);
        // Letzter Fallback zu Mock-Daten
        try {
          const mockFacetData = await mockGetFacets();
          setFacets(mockFacetData);
        } catch (mockErr) {
          console.error('Mock facets also failed:', mockErr);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFacets();
  }, [useMock]);

  // Behandle Kategorie-Filter-Änderungen
  const handleCategoryChange = (categoryValue, checked) => {
    console.log('Category change:', categoryValue, checked);
    const newCategories = checked 
      ? [...selectedCategories, categoryValue]
      : selectedCategories.filter(cat => cat !== categoryValue);
    
    setSelectedCategories(newCategories);
    notifyFiltersChange(newCategories, selectedAuthors);
  };

  // Behandle Autor-Filter-Änderungen
  const handleAuthorChange = (authorValue, checked) => {
    const newAuthors = checked 
      ? [...selectedAuthors, authorValue]
      : selectedAuthors.filter(author => author !== authorValue);
    
    setSelectedAuthors(newAuthors);
    notifyFiltersChange(selectedCategories, newAuthors);
  };

  // Benachrichtige Parent-Komponente über Filter-Änderungen
  const notifyFiltersChange = (categories, authors) => {
    console.log('notifyFiltersChange called with:', { categories, authors });
    if (onFiltersChange) {
      onFiltersChange({
        categories,
        authors
      });
    }
  };

  // Alle Filter zurücksetzen
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedAuthors([]);
    notifyFiltersChange([], []);
  };

  // Erzeuge Kategorie-Items mit deutschen Labels
  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      'technology': 'Technologie',
      'programming': 'Programmierung', 
      'database': 'Datenbank',
      'devops': 'DevOps',
      'api': 'API',
      'cloud': 'Cloud',
      // Fallback für deutsche Bezeichnungen (Mock-Modus Kompatibilität)
      'technologie': 'Technologie',
      'programmierung': 'Programmierung',
      'datenbank': 'Datenbank'
    };
    return categoryMap[category] || category;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-semibold text-solr-secondary mb-4">Filter</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-solr-primary"></div>
          <span className="ml-3 text-sm text-gray-600">Lade Filter...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-5">
      <h2 className="text-lg font-semibold text-solr-secondary mb-4">Filter</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 text-sm rounded">
          {typeof error === 'string' ? error : 'Filter konnten nicht geladen werden - verwende Fallback-Daten.'}
        </div>
      )}
      
      <div className="space-y-6">
        {/* Kategorie-Filter */}
        {facets.category && facets.category.length > 0 && (
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-md font-medium text-solr-secondary mb-2">Kategorie</h3>
            <div className="space-y-2">
              {facets.category.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      id={`category-${idx}`}
                      checked={selectedCategories.includes(item.value)}
                      onChange={(e) => handleCategoryChange(item.value, e.target.checked)}
                      className="rounded border-gray-300 text-solr-primary focus:ring-solr-primary"
                    />
                    <label 
                      htmlFor={`category-${idx}`}
                      className="ml-2 text-sm text-gray-600 hover:text-solr-primary cursor-pointer flex-1"
                    >
                      {getCategoryDisplayName(item.value)}
                    </label>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Autor-Filter */}
        {facets.author && facets.author.length > 0 && (
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-md font-medium text-solr-secondary mb-2">Autor</h3>
            <div className="space-y-2">
              {facets.author.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      id={`author-${idx}`}
                      checked={selectedAuthors.includes(item.value)}
                      onChange={(e) => handleAuthorChange(item.value, e.target.checked)}
                      className="rounded border-gray-300 text-solr-primary focus:ring-solr-primary"
                    />
                    <label 
                      htmlFor={`author-${idx}`}
                      className="ml-2 text-sm text-gray-600 hover:text-solr-primary cursor-pointer flex-1"
                    >
                      {item.value}
                    </label>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Datum-Filter (Placeholder für zukünftige Implementierung) */}
        <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
          <h3 className="text-md font-medium text-solr-secondary mb-2">Datum</h3>
          <div className="text-sm text-gray-500 italic">
            Datum-Filter folgen in einer späteren Version
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button 
          onClick={handleResetFilters}
          disabled={selectedCategories.length === 0 && selectedAuthors.length === 0}
          className="w-full px-4 py-2 bg-white border border-solr-primary text-solr-primary hover:bg-solr-primary hover:text-white rounded-md text-sm transition-colors duration-300 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-solr-primary"
        >
          Filter zurücksetzen
        </button>
        
        {/* Aktive Filter-Anzeige */}
        {(selectedCategories.length > 0 || selectedAuthors.length > 0) && (
          <div className="mt-3 text-xs text-gray-600">
            <div>Aktive Filter:</div>
            <div className="mt-1 space-x-1">
              {selectedCategories.map(cat => (
                <span key={cat} className="inline-block bg-solr-primary text-white px-2 py-0.5 rounded text-xs">
                  {getCategoryDisplayName(cat)}
                </span>
              ))}
              {selectedAuthors.map(author => (
                <span key={author} className="inline-block bg-solr-accent text-white px-2 py-0.5 rounded text-xs">
                  {author}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
