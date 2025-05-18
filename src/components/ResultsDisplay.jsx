import React, { useState } from 'react';
import Pagination from './Pagination';

export default function ResultsDisplay({ results, isLoading, error }) {
  const resultsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('relevance');

  // Pagination logic
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(results.length / resultsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of results
    document.getElementById('results-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sorting logic
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }).format(date);
  };

  // Highlighting function to mark search terms in text
  const highlightText = (text, query) => {
    if (!text || !query) return text;
    // Simple highlight function - in a real app, use a more robust solution
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-100 px-0.5">{part}</mark> 
        : part
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-md">
        <div className="w-16 h-16 border-4 border-solr-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg text-gray-600">Durchsuche Dokumente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 shadow-md">
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-bold">Suchfehler</p>
        </div>
        <p>{error.message || "Bei der Suche ist ein Fehler aufgetreten."}</p>
        <div className="mt-4 text-sm">
          <p>Mögliche Lösungen:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Überprüfen Sie Ihre Internetverbindung</li>
            <li>Stellen Sie sicher, dass der Solr-Server läuft</li>
            <li>Versuchen Sie es später erneut</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 shadow-md">
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-bold">Keine Ergebnisse gefunden</p>
        </div>
        <p>Die Suche ergab keine Treffer.</p>
        <div className="mt-4 text-sm">
          <p>Tipps für bessere Ergebnisse:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Versuchen Sie andere Suchbegriffe</li>
            <li>Verwenden Sie allgemeinere Suchbegriffe</li>
            <li>Prüfen Sie die Rechtschreibung</li>
            <li>Reduzieren Sie die Anzahl der Filterbedingungen</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div id="results-container" className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div>
          <p className="text-gray-600 font-semibold text-sm">
            {results.length} {results.length === 1 ? 'Ergebnis' : 'Ergebnisse'} gefunden
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Seite {currentPage} von {totalPages}
          </p>
        </div>
        
        <div className="mt-3 sm:mt-0">
          <label htmlFor="sort-select" className="text-sm text-gray-500 mr-2">
            Sortieren nach:
          </label>
          <select
            id="sort-select"
            className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-solr-primary"
            value={sortOption}
            onChange={handleSortChange}
          >
            <option value="relevance">Relevanz</option>
            <option value="date">Datum (neueste zuerst)</option>
            <option value="title">Titel (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {currentResults.map((doc) => (
          <div key={doc.id} className="p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-solr-primary">{highlightText(doc.title, "")}</h3>
              <div className="mt-1 md:mt-0 text-xs text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(doc.last_modified || doc.created_date)}
              </div>
            </div>
            
            <p className="text-gray-600 mt-2 text-sm">
              {highlightText(doc.content, "")}
            </p>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {doc.category && (
                <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">
                  {doc.category}
                </span>
              )}
              {doc.author && (
                <span className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-full flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {doc.author}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {results.length > resultsPerPage && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange} 
        />
      )}
    </div>
  );
}
