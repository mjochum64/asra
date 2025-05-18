import React, { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('all');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm, searchMode);
    }
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
              disabled={!searchTerm.trim()}
              className="px-6 py-3 bg-solr-primary text-white rounded-lg hover:bg-solr-accent transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] shadow-sm font-medium"
            >
              Suchen
            </button>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="search-all"
                name="search-mode"
                checked={searchMode === 'all'}
                onChange={() => setSearchMode('all')}
                className="h-4 w-4 text-solr-primary focus:ring-solr-primary border-gray-300"
              />
              <label htmlFor="search-all" className="ml-2 text-sm text-gray-700">
                Alle Felder
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="search-title"
                name="search-mode"
                checked={searchMode === 'title'}
                onChange={() => setSearchMode('title')}
                className="h-4 w-4 text-solr-primary focus:ring-solr-primary border-gray-300"
              />
              <label htmlFor="search-title" className="ml-2 text-sm text-gray-700">
                Nur Titel
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="search-content"
                name="search-mode"
                checked={searchMode === 'content'}
                onChange={() => setSearchMode('content')}
                className="h-4 w-4 text-solr-primary focus:ring-solr-primary border-gray-300"
              />
              <label htmlFor="search-content" className="ml-2 text-sm text-gray-700">
                Nur Inhalt
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
