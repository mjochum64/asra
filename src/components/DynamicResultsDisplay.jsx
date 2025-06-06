import React, { useState, useEffect } from 'react';
import { getDisplayFields } from '../services/schemaService';

/**
 * Schema-driven ResultsDisplay - automatisch basierend auf verfügbaren Anzeigefeldern
 */
export default function DynamicResultsDisplay({ 
  results = [], 
  isLoading = false, 
  searchQuery = '', 
  totalResults = 0,
  error = null 
}) {
  const [displayFields, setDisplayFields] = useState([]);
  const [fieldLabels, setFieldLabels] = useState({});

  useEffect(() => {
    loadDisplayConfiguration();
  }, []);

  const loadDisplayConfiguration = async () => {
    try {
      const fields = await getDisplayFields();
      setDisplayFields(fields);
      
      // Erstelle benutzerfreundliche Labels für Felder
      const labels = {};
      fields.forEach(field => {
        labels[field] = formatFieldLabel(field);
      });
      setFieldLabels(labels);
    } catch (error) {
      console.error('Failed to load display configuration:', error);
      // Fallback zu Standard-Feldern
      setDisplayFields(['title', 'content', 'author', 'category', 'created_date']);
      setFieldLabels({
        title: 'Titel',
        content: 'Inhalt', 
        author: 'Autor',
        category: 'Kategorie',
        created_date: 'Erstellt'
      });
    }
  };

  const formatFieldLabel = (fieldName) => {
    const labels = {
      title: 'Titel',
      content: 'Inhalt',
      author: 'Autor',
      category: 'Kategorie',
      created_date: 'Erstellt',
      last_modified: 'Geändert',
      tags: 'Tags',
      content_type: 'Typ',
      description: 'Beschreibung'
    };
    
    return labels[fieldName] || fieldName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatFieldValue = (field, value) => {
    if (!value) return '-';
    
    // Spezielle Formatierung für verschiedene Feldtypen
    switch (field) {
      case 'created_date':
      case 'last_modified':
        try {
          return new Date(value).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch {
          return value;
        }
      
      case 'content':
        // Kürze Content-Felder für bessere Lesbarkeit, aber behalte Highlighting-Tags
        // Entferne nur andere HTML-Tags, nicht <mark> Tags für Highlighting
        const contentWithHighlights = value.replace(/<(?!\/?(mark)\b)[^>]*>/g, '');
        return contentWithHighlights.length > 200 
          ? contentWithHighlights.substring(0, 200) + '...' 
          : contentWithHighlights;
      
      case 'category':
        // Kapitalisiere erste Buchstaben
        return Array.isArray(value) 
          ? value.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ')
          : value.charAt(0).toUpperCase() + value.slice(1);
      
      default:
        // Handhabe Arrays
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value;
    }
  };

  const getFieldImportance = (field) => {
    // Bestimme die Wichtigkeit von Feldern für das Layout
    const importance = {
      title: 3,
      content: 2,
      author: 1,
      category: 1,
      created_date: 1,
      last_modified: 0
    };
    return importance[field] || 0;
  };

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

  // Sortiere Felder nach Wichtigkeit für die Anzeige
  const sortedDisplayFields = [...displayFields].sort((a, b) => 
    getFieldImportance(b) - getFieldImportance(a)
  );

  return (
    <div className="space-y-6">
      {/* Ergebnis-Header */}
      {searchQuery && (
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-solr-primary">
          <h2 className="text-lg font-semibold text-gray-900">
            {totalResults} Ergebnis{totalResults !== 1 ? 'se' : ''} für "{searchQuery}"
          </h2>
          <div className="text-sm text-gray-600 mt-1">
            Anzeige: {sortedDisplayFields.map(f => fieldLabels[f] || f).join(', ')}
          </div>
        </div>
      )}

      {/* Dynamische Ergebnisliste */}
      {results.map((result, index) => (
        <div key={result.id || index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          {/* Hauptfelder (title, content) */}
          <div className="mb-4">
            {sortedDisplayFields.filter(field => getFieldImportance(field) >= 2).map(field => (
              result[field] && (
                <div key={field} className={field === 'title' ? 'mb-3' : 'mb-2'}>
                  {field === 'title' ? (
                    <h3 
                      className="text-xl font-semibold text-gray-900 mb-2" 
                      dangerouslySetInnerHTML={{ __html: formatFieldValue(field, result[field]) }}
                    />
                  ) : (
                    <div>
                      <div 
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatFieldValue(field, result[field]) }}
                      />
                    </div>
                  )}
                </div>
              )
            ))}
          </div>

          {/* Metadaten */}
          <div className="border-t border-gray-100 pt-3">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {sortedDisplayFields.filter(field => getFieldImportance(field) < 2).map(field => (
                result[field] && (
                  <div key={field} className="flex items-center">
                    <span className="font-medium text-gray-500 mr-2">
                      {fieldLabels[field] || field}:
                    </span>
                    <span>{formatFieldValue(field, result[field])}</span>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Schema Info */}
          <div className="mt-2 pt-2 border-t border-gray-50">
            <div className="text-xs text-gray-400">
              ID: {result.id} • {Object.keys(result).length} Felder verfügbar
            </div>
          </div>
        </div>
      ))}

      {/* Schema-Footer */}
      <div className="bg-gray-50 p-4 rounded-lg text-center">
        <div className="text-xs text-gray-500">
          Schema-basierte Anzeige • {displayFields.length} konfigurierte Anzeigefeld{displayFields.length !== 1 ? 'er' : ''}
        </div>
      </div>
    </div>
  );
}
