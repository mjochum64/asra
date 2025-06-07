import React, { useState, Suspense } from 'react';
import SearchBar from './components/SearchBar';
const ResultsDisplay = React.lazy(() => import('./components/ResultsDisplay'));
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import { searchDocuments, mockSearch, mockSearchWithFilters } from './services/solrService';

export default function App() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const [useMock, setUseMock] = useState(true);
  const [activeFilters, setActiveFilters] = useState({ categories: [], authors: [] });
  
  const handleSearch = async (query, searchMode = 'all', customFilters = null) => {
    setIsLoading(true);
    setError(null);
    setLastQuery(query);
    
    try {
      // Verwende customFilters falls übergeben, sonst activeFilters aus dem State
      const filtersToUse = customFilters !== null ? customFilters : activeFilters;
      
      // Verwende die Mock-Suche mit Filtern, wenn useMock aktiviert ist
      const data = useMock 
        ? await mockSearchWithFilters(query, filtersToUse)
        : await searchDocuments(query, searchMode, filtersToUse);
      
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
      setError(err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Behandle Filter-Änderungen
  const handleFiltersChange = (filters) => {
    setActiveFilters(filters);
    
    // Führe erneute Suche durch, wenn bereits eine Suche stattgefunden hat
    // Übergebe die neuen Filter direkt, um Race-Conditions zu vermeiden
    if (lastQuery) {
      handleSearch(lastQuery, 'all', filters);
    }
  };

  // Funktion zum Umschalten zwischen Mock und echter Suche
  const toggleMockSearch = () => {
    setUseMock(!useMock);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onToggleMock={toggleMockSearch} useMock={useMock} />
      
      <div className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-solr-primary to-solr-accent text-white py-12 shadow-md">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Apache Solr Research</h1>
              <p className="text-lg md:text-xl opacity-90 mb-2">Eine moderne Dokumenten-Suchoberfläche</p>
              <p className="text-sm md:text-base opacity-75">
                Durchsuchen Sie Ihre Solr-Dokumente schnell und effizient
                {useMock && <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">Mock-Modus</span>}
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <SearchBar onSearch={handleSearch} />
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar - now visible on all screen sizes */}
            <div className="w-full md:w-1/4">
              <Sidebar 
                onFiltersChange={handleFiltersChange}
                useMock={useMock}
                activeFilters={activeFilters}
              />
            </div>
            
            {/* Main content area */}
            <div className="w-full md:w-3/4">
              {lastQuery && !isLoading && results.length > 0 && (
                <div className="mb-4 px-2">
                  <p className="text-sm text-gray-600">
                    Suchergebnisse für <span className="font-semibold">"{lastQuery}"</span>
                    {(activeFilters.categories?.length > 0 || activeFilters.authors?.length > 0) && (
                      <span className="ml-2 text-xs">
                        mit {activeFilters.categories?.length + activeFilters.authors?.length} Filtern
                      </span>
                    )}
                  </p>
                  
                  {/* Aktive Filter mobil anzeigen */}
                  {(activeFilters.categories?.length > 0 || activeFilters.authors?.length > 0) && (
                    <div className="mt-2 md:hidden">
                      <div className="text-xs text-gray-500 mb-1">Aktive Filter:</div>
                      <div className="flex flex-wrap gap-1">
                        {activeFilters.categories?.map(cat => (
                          <span key={cat} className="inline-block bg-solr-primary text-white px-2 py-0.5 rounded text-xs">
                            {cat}
                          </span>
                        ))}
                        {activeFilters.authors?.map(author => (
                          <span key={author} className="inline-block bg-solr-accent text-white px-2 py-0.5 rounded text-xs">
                            {author}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solr-primary"></div>
                  <span className="ml-3 text-gray-600">Lade Suchergebnisse...</span>
                </div>
              }>
                <ResultsDisplay 
                  results={results} 
                  isLoading={isLoading} 
                  error={error} 
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
