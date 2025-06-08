import React, { useState, useEffect } from 'react';
import DynamicSearchBar from './components/DynamicSearchBar';
import DynamicSidebar from './components/DynamicSidebar';
import DynamicResultsDisplay from './components/DynamicResultsDisplay';
import ModeSwitcher from './components/ModeSwitcher';
import { searchDocuments } from './services/solrService';
import { analyzeSchemaForUI } from './services/schemaService';

/**
 * Dynamische, schema-basierte ASRA App - Proof of Concept
 * Diese App passt sich automatisch an das Solr-Schema an
 */
export default function DynamicApp() {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [lastSearchMode, setLastSearchMode] = useState('all');
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentFacets, setCurrentFacets] = useState({});
  const [uiMode, setUIMode] = useState('normal'); // UI mode state (normal | expert)

  // Lade Schema-Informationen beim Mount
  useEffect(() => {
    loadSchemaInfo();
  }, []);

  const loadSchemaInfo = async () => {
    try {
      const info = await analyzeSchemaForUI();
      setSchemaInfo(info);
      console.log('Schema Analysis:', info);
    } catch (error) {
      console.error('Failed to load schema info:', error);
    }
  };

  const handleSearch = async (query, searchMode, searchFields = []) => {
    try {
      setIsLoading(true);
      setError(null);
      setLastSearchQuery(query);
      setLastSearchMode(searchMode);
      
      console.log('Dynamic search:', { query, searchMode, searchFields, activeFilters });
      
      // Führe Suche durch - jetzt gibt searchDocuments ein Objekt mit results, facets und total zurück
      const searchResponse = await searchDocuments(query, searchMode, activeFilters);
      setSearchResults(searchResponse.results);
      setCurrentFacets(searchResponse.facets);
      setTotalResults(searchResponse.total);
      
    } catch (err) {
      console.error('Search failed:', err);
      setError(err.message || 'Suche fehlgeschlagen');
      setSearchResults([]);
      setCurrentFacets({});
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = async (newFilters) => {
    setActiveFilters(newFilters);
    
    // Führe Suche erneut aus, wenn bereits eine Suche stattgefunden hat
    if (lastSearchQuery) {
      try {
        setIsLoading(true);
        const searchResponse = await searchDocuments(lastSearchQuery, lastSearchMode, newFilters);
        setSearchResults(searchResponse.results);
        setCurrentFacets(searchResponse.facets);
        setTotalResults(searchResponse.total);
      } catch (err) {
        console.error('Filter search failed:', err);
        setError(err.message || 'Filterung fehlgeschlagen');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ASRA – GermanLaw
              </h1>
              <p className="text-sm text-gray-600">
                Recherchieren im Bundesrecht
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* UI Mode Switcher */}
              <ModeSwitcher 
                currentMode={uiMode} 
                onModeChange={setUIMode} 
              />
              
              {/* Schema Info Badge */}
              {schemaInfo && (
                <div className="bg-solr-primary text-white px-4 py-2 rounded-lg text-sm">
                  <div className="font-medium">Schema erkannt</div>
                  <div className="text-xs opacity-90">
                    {schemaInfo.searchableFields.length} durchsuchbare Felder •{' '}
                    {schemaInfo.facetableFields.length} filterbare Felder
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Hauptbereich */}
          <div className="lg:col-span-3 space-y-6">
            {/* Dynamische Suchleiste */}
            <DynamicSearchBar onSearch={handleSearch} uiMode={uiMode} />
            
            {/* Schema-Informationen */}
            {schemaInfo && !isLoading && uiMode === 'expert' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  🔍 Dynamische Schema-Konfiguration
                </h3>
                <div className="text-xs text-blue-700 space-y-1">
                  <div><strong>Durchsuchbare Felder:</strong> {schemaInfo.searchableFields.map(f => f.name).join(', ')}</div>
                  <div><strong>Filterbare Felder:</strong> {schemaInfo.filterableFields.map(f => f.name).join(', ')}</div>
                  <div><strong>Anzeigefelder:</strong> {schemaInfo.displayFields.map(f => f.name).join(', ')}</div>
                </div>
              </div>
            )}
            
            {/* Dynamische Ergebnisanzeige */}
            <DynamicResultsDisplay
              results={searchResults}
              isLoading={isLoading}
              searchQuery={lastSearchQuery}
              totalResults={totalResults}
              error={error}
              uiMode={uiMode}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <DynamicSidebar
              onFiltersChange={handleFiltersChange}
              activeFilters={activeFilters}
              facets={currentFacets}
              schemaInfo={schemaInfo}
              uiMode={uiMode}
            />
            
            {/* Debug-Info (nur in Entwicklung) */}
            {import.meta.env.MODE === 'development' && (
              <div className="mt-6 bg-gray-100 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Aktive Filter:</strong> {Object.keys(activeFilters).length}</div>
                  <div><strong>Letzte Suche:</strong> {lastSearchQuery || 'Keine'}</div>
                  <div><strong>Ergebnisse:</strong> {searchResults.length}</div>
                  {schemaInfo && (
                    <div><strong>Schema geladen:</strong> ✅</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
