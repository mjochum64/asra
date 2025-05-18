import React from 'react';

export default function ResultsDisplay({ results, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-solr-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg text-gray-600">Searching Solr documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border-l-4 border-red-500 text-red-700">
        <p className="font-bold">Search Error</p>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="p-6 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
        <p className="font-bold">No Results Found</p>
        <p>Try a different search term or check your Solr server connection</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">Found {results.length} results</p>
      <div className="space-y-4">
        {results.map((doc) => (
          <div key={doc.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-solr-primary">{doc.title}</h3>
            <p className="text-gray-600 mt-1">{doc.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
