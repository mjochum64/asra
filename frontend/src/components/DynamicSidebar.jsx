import React, { useState, useEffect } from 'react';
import { uiHelpers } from '../config/uiConfig';

/**
 * UI-konfigurierter Sidebar - zeigt Filter basierend auf UI-Modus
 * Unterstützt Normal- und Expertenanicht mit konfigurierten Filtern
 */
export default function DynamicSidebar({ onFiltersChange, activeFilters = {}, facets = {}, schemaInfo = null, uiMode = 'normal' }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(activeFilters);

  // Synchronisiere mit aktiven Filtern von der Parent-Komponente
  useEffect(() => {
    setSelectedFilters(activeFilters);
  }, [activeFilters]);

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

  const formatFieldName = (fieldName, filterConfig) => {
    // Verwende das Label aus der UI-Konfiguration, falls verfügbar
    if (filterConfig && filterConfig.label) {
      return filterConfig.label;
    }
    
    // Fallback zu alten Labels für Kompatibilität
    const labels = {
      category: 'Kategorien',
      author: 'Autoren',
      created_date: 'Erstellungsdatum',
      last_modified: 'Letzte Änderung',
      content_type: 'Inhaltstyp',
      tags: 'Tags',
      document_type: 'Dokumenttyp',
      jurabk: 'Juristische Abkürzung',
      fundstelle_typ: 'Fundstellen-Typ',
      gliederungskennzahl: 'Gliederungskennzahl',
      enbez: 'Einzelnorm-Bezeichnung',
      standangabe_typ: 'Standangabe-Typ',
      xml_lang: 'Sprache',
      fundstelle_periodikum: 'Fundstelle',
      text_format: 'Textformat',
      ausfertigung_datum_manuell: 'Manuelle Datierung'
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

  // Verwende die UI-Konfiguration um zu bestimmen, welche Filter angezeigt werden sollen
  const configuredFilters = uiHelpers.getFilterFields(uiMode);
  
  // Kombiniere Konfiguration mit verfügbaren Facetten
  const availableFilters = configuredFilters
    .filter(filterConfig => facets[filterConfig.solrField] && facets[filterConfig.solrField].length > 0)
    .map(filterConfig => ({
      ...filterConfig,
      facetItems: facets[filterConfig.solrField] || []
    }));

  if (availableFilters.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="bg-solr-primary text-white p-4 -m-6 mb-4">
          <h3 className="text-lg font-semibold">Filter</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">
            {schemaInfo && Object.keys(facets).length === 0 ? 
              'Keine Filter verfügbar für die aktuellen Suchergebnisse' : 
              'Führen Sie eine Suche durch, um Filter zu sehen'
            }
          </p>
        </div>
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
        {availableFilters.map((filterConfig) => (
          <div key={filterConfig.solrField} className="p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              {filterConfig.icon && (
                <span className="mr-2" role="img" aria-label={filterConfig.label}>
                  {filterConfig.icon}
                </span>
              )}
              {formatFieldName(filterConfig.solrField, filterConfig)}
              {selectedFilters[filterConfig.solrField] && selectedFilters[filterConfig.solrField].length > 0 && (
                <span className="ml-2 text-sm text-solr-primary">
                  ({selectedFilters[filterConfig.solrField].length})
                </span>
              )}
            </h4>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filterConfig.facetItems
                .slice(0, filterConfig.limit || 20) // Verwende das konfigurierte Limit
                .map((facet) => (
                <label key={facet.value} className="flex items-center group cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFilters[filterConfig.solrField]?.includes(facet.value) || false}
                    onChange={(e) => handleFilterChange(filterConfig.solrField, facet.value, e.target.checked)}
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
      <div className="bg-gray-50 px-4 py-3 text-xs text-gray-500 flex items-center justify-between">
        <span>
          UI-konfigurierte Filter • {availableFilters.length} aktiv
        </span>
        <span className="text-solr-primary font-medium">
          {uiMode === 'expert' ? '🔧 Experte' : '👤 Normal'}
        </span>
      </div>
    </div>
  );
}
