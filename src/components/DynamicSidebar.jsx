import React, { useState, useEffect } from 'react';
import { getDynamicFacets } from '../services/schemaService';

/**
 * Schema-driven Sidebar - automatisch basierend auf verfügbaren Solr-Feldern
 */
export default function DynamicSidebar({ onFiltersChange, activeFilters = {} }) {
  const [facets, setFacets] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(activeFilters);

  // Synchronisiere mit aktiven Filtern von der Parent-Komponente
  useEffect(() => {
    setSelectedFilters(activeFilters);
  }, [activeFilters]);

  // Lade dynamische Facetten beim Mount
  useEffect(() => {
    loadDynamicFacets();
  }, []);

  const loadDynamicFacets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const facetData = await getDynamicFacets();
      setFacets(facetData);
      
      if (Object.keys(facetData).length === 0) {
        setError('Keine filterbaren Felder im Schema gefunden');
      }
    } catch (err) {
      console.error('Failed to load dynamic facets:', err);
      setError('Fehler beim Laden der Filter');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (fieldName, value, isChecked) => {
    const newFilters = { ...selectedFilters };
    
    if (!newFilters[fieldName]) {
      newFilters[fieldName] = [];
    }
    
    if (isChecked) {
      if (!newFilters[fieldName].includes(value)) {
        newFilters[fieldName] = [...newFilters[fieldName], value];
      }
    } else {
      newFilters[fieldName] = newFilters[fieldName].filter(item => item !== value);
    }
    
    setSelectedFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    onFiltersChange({});
  };

  const formatFieldName = (fieldName) => {
    // Konvertiere Feldnamen zu lesbaren Labels
    const labels = {
      category: 'Kategorien',
      author: 'Autoren',
      created_date: 'Erstellungsdatum',
      last_modified: 'Letzte Änderung',
      content_type: 'Inhaltstyp',
      tags: 'Tags'
    };
    
    return labels[fieldName] || fieldName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTotalSelectedFilters = () => {
    return Object.values(selectedFilters).reduce((total, filterArray) => {
      return total + (filterArray ? filterArray.length : 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={loadDynamicFacets}
            className="px-4 py-2 bg-solr-primary text-white rounded hover:bg-solr-accent transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const fieldEntries = Object.entries(facets);

  if (fieldEntries.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500 text-center">Keine Filter verfügbar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-solr-primary text-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filter</h3>
          {getTotalSelectedFilters() > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-solr-light hover:text-white transition-colors"
            >
              Alle löschen ({getTotalSelectedFilters()})
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Filter Sections */}
      <div className="divide-y divide-gray-200">
        {fieldEntries.map(([fieldName, facetItems]) => (
          <div key={fieldName} className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {formatFieldName(fieldName)}
              {selectedFilters[fieldName] && selectedFilters[fieldName].length > 0 && (
                <span className="ml-2 text-sm text-solr-primary">
                  ({selectedFilters[fieldName].length})
                </span>
              )}
            </h4>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {facetItems.map((facet) => (
                <label key={facet.value} className="flex items-center group cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFilters[fieldName]?.includes(facet.value) || false}
                    onChange={(e) => handleFilterChange(fieldName, facet.value, e.target.checked)}
                    className="h-4 w-4 text-solr-primary focus:ring-solr-primary border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 flex-grow">
                    {facet.value}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({facet.count})
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Schema Info Footer */}
      <div className="bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Schema-basierte Filter • {fieldEntries.length} Feld{fieldEntries.length !== 1 ? 'er' : ''} verfügbar
      </div>
    </div>
  );
}
