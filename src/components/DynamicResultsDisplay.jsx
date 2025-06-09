import React, { useState, useEffect } from 'react';
import { uiHelpers } from '../config/uiConfig';
import DocumentFullView from './DocumentFullView';
import ResultItem from './ResultItem'; // Import the new ResultItem component

// highlightSearchTerms and truncateText moved to src/utils/textFormatters.js
// renderFieldBadge moved to ResultItem.jsx

/**
 * UI-konfigurierte ResultsDisplay - basierend auf UI-Konfiguration statt dynamischem Schema
 */
export default function DynamicResultsDisplay({ 
  results = [],
  isLoading = false,
  searchQuery = '',
  totalResults = 0,
  error = null,
  uiMode = 'normal',
  onSearchExecuteRefine, // New prop for framework navigation
  onNavigateToDocumentById // Added prop from DynamicApp
  // onSelectedDocumentChange // Removed for revert
}) {
  const [resultConfig, setResultConfig] = useState({ primary: [], secondary: [], metadata: [] });
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Effect to call onSelectedDocumentChange when selectedDocument changes - REMOVED FOR REVERT
  // useEffect(() => {
  //   if (onSelectedDocumentChange) {
  //     onSelectedDocumentChange(selectedDocument);
  //   }
  // }, [selectedDocument, onSelectedDocumentChange]);

  useEffect(() => {
    loadDisplayConfiguration();
  }, [uiMode]);

  const loadDisplayConfiguration = () => {
    try {
      const config = uiHelpers.getResultFields(uiMode);
      setResultConfig(config);
    } catch (error) {
      console.error('Failed to load UI result configuration:', error);
      // Fallback-Konfiguration
      setResultConfig({
        primary: [
          { solrField: 'kurzue', label: 'Kurztitel', highlight: true, priority: 1 },
          { solrField: 'text_content', label: 'Inhalt', highlight: true, maxLength: 200, priority: 2 }
        ],
        secondary: [
          { solrField: 'amtabk', label: 'Abkürzung', display: 'badge' }
        ],
        metadata: [
          { solrField: 'document_type', label: 'Typ' }
        ]
      });
    }
  };

  // formatFieldLabel, formatFieldValue, and getFieldImportance are no longer needed here
  // as ResultItem handles its own rendering based on resultConfig and uiHelpers.
  // However, if they were used by parts of DynamicResultsDisplay that are NOT in ResultItem,
  // they would need to remain or be passed down. For this refactor, we assume they are
  // primarily for the item rendering itself.

  // const handleNavigateToFramework = (frameworkId) => { // This function is no longer used
  //   if (onSearchExecuteRefine) {
  //     setSelectedDocument(null);
  //     onSearchExecuteRefine(frameworkId, {});
  //   }
  // };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Fehler beim Laden der Suchergebnisse</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (results.length === 0 && searchQuery) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Ergebnisse gefunden</h3>
        <p className="text-gray-600">
          Für die Suche nach "<span className="font-medium">{searchQuery}</span>" wurden keine Dokumente gefunden.
        </p>
      </div>
    );
  }

  // Erstelle eine flache Liste aller konfigurierten Felder für Kompatibilität
  const getAllConfiguredFields = () => {
    return [
      ...resultConfig.primary.map(f => f.solrField),
      ...resultConfig.secondary.map(f => f.solrField),
      ...resultConfig.metadata.map(f => f.solrField)
    ];
  };

  const configuredFields = getAllConfiguredFields();

  return (
    <div className="space-y-6">
      {/* Ergebnis-Header */}
      {searchQuery && (
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-solr-primary">
          <h2 className="text-lg font-semibold text-gray-900">
            {totalResults} Ergebnis{totalResults !== 1 ? 'se' : ''} für "{searchQuery}"
          </h2>
          <div className="text-sm text-gray-600 mt-1 flex items-center">
            <span className="text-solr-primary font-medium mr-2">
              {uiMode === 'expert' ? '🔧 Experte' : '👤 Normal'}
            </span>
            {configuredFields.length} konfigurierte Anzeigefelder
          </div>
        </div>
      )}

      {/* UI-konfigurierte Ergebnisliste */}
      {results.map((result, index) => (
        <ResultItem
          key={result.id || index}
          result={result}
          searchQuery={searchQuery}
          uiMode={uiMode}
          resultConfig={resultConfig}
          onViewFullText={(doc) => {
            setSelectedDocument(doc);
            // Direct call also possible: if (onSelectedDocumentChange) onSelectedDocumentChange(doc);
            // but useEffect handles it.
          }}
          // uiHelpers can be passed if ResultItem needs more than getDocumentType, getFieldValue, getDocumentTypeLabel, formatFieldValue
          // For now, assuming uiHelpers is imported directly in ResultItem for those specific functions.
        />
      ))}

      {/* UI-Konfiguration Footer */}
      <div className="bg-gray-50 p-4 rounded-lg text-center">
        <div className="text-xs text-gray-500 flex items-center justify-center space-x-4">
          <span>UI-konfigurierte Anzeige</span>
          <span>•</span>
          <span>{configuredFields.length} Anzeigefelder</span>
          <span>•</span>
          <span className="text-solr-primary font-medium">
            {uiMode === 'expert' ? '🔧 Experten-Modus' : '👤 Normal-Modus'}
          </span>
        </div>
      </div>

      {/* DocumentFullView Modal */}
      {selectedDocument && (
        <DocumentFullView
          document={selectedDocument}
          onClose={() => {
            setSelectedDocument(null);
            // Direct call also possible: if (onSelectedDocumentChange) onSelectedDocumentChange(null);
            // but useEffect handles it.
          }}
          searchQuery={searchQuery}
          onNavigateToFrameworkId={onNavigateToDocumentById} // Wired up the prop
        />
      )}
    </div>
  );
}
