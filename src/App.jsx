import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import ResultsDisplay from './components/ResultsDisplay';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import { searchDocuments, mockSearch } from './services/solrService';

export default function App() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const [useMock, setUseMock] = useState(false);
  
  const handleSearch = async (query, searchMode = 'all') => {
    setIsLoading(true);
    setError(null);
    setLastQuery(query);
    
    try {
      // Verwende die Mock-Suche, wenn useMock aktiviert ist
      const data = useMock ? await mockSearch(query) : await searchDocuments(query, searchMode);
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
      setError(err);
      setResults([]);
    } finally {
      setIsLoading(false);
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
            {/* Sidebar on larger screens */}
            <div className="hidden md:block md:w-1/4">
              <Sidebar />
            </div>
            
            {/* Main content area */}
            <div className="w-full md:w-3/4">
              {lastQuery && !isLoading && results.length > 0 && (
                <div className="mb-4 px-2">
                  <p className="text-sm text-gray-600">
                    Suchergebnisse für <span className="font-semibold">"{lastQuery}"</span>
                  </p>
                </div>
              )}
              
              <ResultsDisplay 
                results={results} 
                isLoading={isLoading} 
                error={error} 
              />
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
