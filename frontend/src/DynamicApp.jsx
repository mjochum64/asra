import React, { useState, useEffect } from 'react';
import DynamicSearchBar from './components/DynamicSearchBar';
import DynamicSidebar from './components/DynamicSidebar';
import DynamicResultsDisplay from './components/DynamicResultsDisplay';
import ModeSwitcher from './components/ModeSwitcher';
import { searchDocuments, fetchDocumentById } from './services/solrService';
import hybridSearchService from './services/hybridSearchService';
import { analyzeSchemaForUI } from './services/schemaService';
// import { getFrameworkId, getDocumentType } from './utils/documentUtils'; // Removed for revert - no longer used here

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
  const [showSchemaInfo, setShowSchemaInfo] = useState(false); // Neuer State für aufklappbares Element
  // const [currentDocumentDetails, setCurrentDocumentDetails] = useState({ id: null, frameworkId: null, isFramework: false }); // Removed for revert

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

  const handleSearch = async (query, searchMode, searchFields = [], searchOptions = {}) => {
    try {
      // Clear previous search state immediately to prevent displaying old results
      setSearchResults([]);
      setCurrentFacets({});
      setTotalResults(0);
      setError(null);
      
      setIsLoading(true);
      setLastSearchQuery(query);
      setLastSearchMode(searchMode);
      
      console.log('Dynamic search:', { 
        query, 
        searchMode, 
        searchFields, 
        activeFilters,
        searchEngine: searchOptions.searchEngine || 'keyword',
        weights: searchOptions.weights 
      });
      
      // Check if we should use hybrid search service
      if (searchOptions.searchEngine === 'hybrid' || searchOptions.searchEngine === 'semantic') {
        console.log(`Using ${searchOptions.searchEngine} search engine`);
        
        try {
          // Use the hybrid search service
          const hybridResponse = await hybridSearchService.search(query, {
            start: 0,
            rows: 20,
            weights: searchOptions.weights,
            showScores: true
          });
          
          // Convert hybrid search results to the expected format
          const searchResponse = {
            results: hybridResponse.docs || [],
            facets: hybridResponse.facets || {},
            total: hybridResponse.numFound || hybridResponse.docs?.length || 0
          };
          
          setSearchResults(searchResponse.results);
          setCurrentFacets(searchResponse.facets);
          setTotalResults(searchResponse.total);
          
          return;
        } catch (hybridError) {
          console.error('Hybrid search failed, falling back to keyword search:', hybridError);
          // If hybrid search fails, we'll fall through to the standard search
        }
      }
      
      // Default: Use standard Solr search
      const searchResponse = await searchDocuments(query, searchMode, activeFilters);
      
      // Add search_source property to each result for consistent display
      const resultsWithSource = searchResponse.results.map(doc => ({
        ...doc,
        search_source: 'keyword'
      }));
      
      setSearchResults(resultsWithSource);
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

  // Function to handle navigation to a framework document
  const handleNavigateToFrameworkSearch = async (frameworkId) => {
    if (!frameworkId) {
      console.warn('handleNavigateToFrameworkSearch called with no frameworkId');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Navigating to framework document: ${frameworkId}`);

      const frameworkDocument = await fetchDocumentById(frameworkId);

      if (frameworkDocument) {
        setSearchResults([frameworkDocument]);
        setTotalResults(1);
        setCurrentFacets({});
        setLastSearchQuery(`id:${frameworkId}`); // Standardized query format
        setLastSearchMode('id_lookup_direct'); // Set search mode for this specific type of search
        // Automatically select the fetched framework document to open it in DocumentFullView
        // This assumes DocumentFullView will be shown if searchResults has one item and it's selected.
        // The selection logic itself is in DynamicResultsDisplay, which needs to be adapted
        // The logic to update currentDocumentDetails for the fetched framework document is removed as currentDocumentDetails itself is removed.
        // The primary purpose of handleNavigateToFrameworkSearch is now to fetch and display the framework document as a search result.
      } else {
        setError(`Rahmendokument mit ID ${frameworkId} nicht gefunden.`);
        setSearchResults([]);
        setTotalResults(0);
        setLastSearchMode('all'); // Reset search mode on failure
      }
    } catch (err) {
      console.error('Framework navigation search failed:', err);
      setError(err.message || `Fehler beim Laden des Rahmendokuments ${frameworkId}`);
      setSearchResults([]);
      setTotalResults(0);
      setLastSearchMode('all'); // Reset search mode on error
    } finally {
      setIsLoading(false);
    }
  };

  // const handleSelectedDocumentChange = (doc) => { // Removed for revert
  //   if (doc && doc.id) {
  //     const docType = getDocumentType(doc.id);
  //     const frameworkId = getFrameworkId(doc.id);
  //     setCurrentDocumentDetails({
  //       id: doc.id,
  //       frameworkId: frameworkId,
  //       isFramework: docType === 'framework',
  //     });
  //   } else {
  //     setCurrentDocumentDetails({ id: null, frameworkId: null, isFramework: false });
  //   }
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <img 
                src="/logo_small.png" 
                alt="ASRA – Deutsche Gesetze Logo" 
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ASRA – Deutsche Gesetze
                </h1>
                <p className="text-sm text-gray-600">
                  Recherchieren im Bundesrecht
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4"> {/* Reverted space-x-2 to space-x-4 */}
              {/* Rahmendokument Navigation Button - Removed */}
              {/* UI Mode Switcher - kompakter */}
              <ModeSwitcher 
                currentMode={uiMode} 
                onModeChange={setUIMode} 
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Hauptbereich */}
          <div className="lg:col-span-3 space-y-6">
            {/* Dynamische Suchleiste */}
            <DynamicSearchBar 
              onSearch={handleSearch} 
              uiMode={uiMode} 
              schemaInfo={schemaInfo}
            />
            
            {/* Schema-Informationen mit aufklappbarer Funktionalität */}
            {schemaInfo && !isLoading && uiMode === 'expert' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => setShowSchemaInfo(!showSchemaInfo)}
                >
                  <h3 className="text-sm font-medium text-blue-900 flex items-center">
                    🔍 Dynamische Schema-Konfiguration 
                    <span className="ml-2 text-xs text-blue-700">
                      ({schemaInfo.searchableFields.length} durchsuchbare • {schemaInfo.filterableFields.length} filterbare • {schemaInfo.displayFields.length} anzeigbare Felder)
                    </span>
                  </h3>
                  <span className="text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 transition-transform duration-200 ${showSchemaInfo ? 'transform rotate-180' : ''}`} 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
                {showSchemaInfo && (
                  <div className="px-4 pb-4 text-xs text-blue-700 space-y-1 border-t border-blue-200">
                    <div><strong>Durchsuchbare Felder:</strong> {schemaInfo.searchableFields.map(f => f.name).join(', ')}</div>
                    <div><strong>Filterbare Felder:</strong> {schemaInfo.filterableFields.map(f => f.name).join(', ')}</div>
                    <div><strong>Anzeigefelder:</strong> {schemaInfo.displayFields.map(f => f.name).join(', ')}</div>
                  </div>
                )}
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
              onSearchExecuteRefine={handleNavigateToFrameworkSearch}
              onNavigateToDocumentById={handleNavigateToFrameworkSearch}
              lastSearchMode={lastSearchMode} // Pass lastSearchMode to DynamicResultsDisplay
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
