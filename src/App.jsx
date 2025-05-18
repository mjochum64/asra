import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import ResultsDisplay from './components/ResultsDisplay';
import { searchDocuments, mockSearch } from './services/solrService';

export default function App() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSearch = async (query) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For real Solr connection: const data = await searchDocuments(query);
      //const data = await mockSearch(query);
      const data = await searchDocuments(query);
      setResults(data);
    } catch (err) {
      setError(err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-solr-primary to-solr-accent text-solr-secondary">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Apache Solr Research</h1>
          <p className="text-solr-secondary text-lg">Real-time document search interface</p>
        </header>
        
        <main className="bg-white rounded-lg shadow-lg p-6">
          <SearchBar onSearch={handleSearch} />
          
          <div className="mt-8">
            <ResultsDisplay 
              results={results} 
              isLoading={isLoading} 
              error={error} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}
