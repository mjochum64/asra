import React, { useState, useEffect } from 'react';
import { uiHelpers } from '../config/uiConfig';
import DocumentFullView from './DocumentFullView';

/**
 * UI-konfigurierte ResultsDisplay - basierend auf UI-Konfiguration statt dynamischem Schema
 */
export default function DynamicResultsDisplay({ 
  results = [], 
  isLoading = false, 
  searchQuery = '', 
  totalResults = 0,
  error = null,
  uiMode = 'normal'
}) {
  const [resultConfig, setResultConfig] = useState({ primary: [], secondary: [], metadata: [] });
  const [selectedDocument, setSelectedDocument] = useState(null);

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

  const formatFieldLabel = (fieldName) => {
    const labels = {
      // Standard englische Felder
      title: 'Titel',
      content: 'Inhalt',
      author: 'Autor',
      category: 'Kategorie',
      created_date: 'Erstellt',
      last_modified: 'Geändert',
      tags: 'Tags',
      content_type: 'Typ',
      description: 'Beschreibung',
      
      // Deutsche Rechtsdokument-Felder
      kurzue: 'Kurztitel',
      langue: 'Langtitel',
      amtabk: 'Amtliche Abkürzung',
      jurabk: 'Juristische Abkürzung',
      text_content: 'Gesetzestext',
      fussnoten_content: 'Fußnoten',
      table_content: 'Inhaltsverzeichnis',
      document_type: 'Dokumenttyp',
      xml_lang: 'Sprache',
      fundstelle_periodikum: 'Fundstelle (Periodikum)',
      fundstelle_zitstelle: 'Fundstelle (Zitstelle)',
      standangabe_kommentar: 'Standangabe',
      ausfertigung_datum_manuell: 'Ausfertigung (manuell)',
      text_format: 'Textformat',
      fussnoten_format: 'Fußnotenformat',
      builddate: 'Erstellungsdatum',
      id: 'Dokument-ID'
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
      case 'builddate':
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
      case 'text_content':
        // Kürze Content-Felder für bessere Lesbarkeit, aber behalte Highlighting-Tags
        // Entferne nur andere HTML-Tags, nicht <mark> Tags für Highlighting
        const contentWithHighlights = value.replace(/<(?!\/?(mark)\b)[^>]*>/g, '');
        return contentWithHighlights.length > 300 
          ? contentWithHighlights.substring(0, 300) + '...' 
          : contentWithHighlights;
      
      case 'fussnoten_content':
        // Fußnoten kürzer darstellen
        const footnotesWithHighlights = value.replace(/<(?!\/?(mark)\b)[^>]*>/g, '');
        return footnotesWithHighlights.length > 150 
          ? footnotesWithHighlights.substring(0, 150) + '...' 
          : footnotesWithHighlights;
      
      case 'table_content':
        // Tabellencontent als Liste formatieren
        if (Array.isArray(value)) {
          return value.slice(0, 3).join(' • ') + (value.length > 3 ? '...' : '');
        }
        return value.length > 200 ? value.substring(0, 200) + '...' : value;
      
      case 'category':
      case 'document_type':
        // Kapitalisiere erste Buchstaben
        return Array.isArray(value) 
          ? value.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ')
          : value.charAt(0).toUpperCase() + value.slice(1);
      
      case 'ausfertigung_datum_manuell':
        return value ? 'Ja' : 'Nein';
      
      case 'xml_lang':
        const langMap = { 'de': 'Deutsch', 'en': 'Englisch', 'fr': 'Französisch' };
        return langMap[value] || value;
      
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
      // Standard englische Felder
      title: 3,
      content: 2,
      author: 1,
      category: 1,
      created_date: 1,
      last_modified: 0,
      
      // Deutsche Rechtsdokument-Felder
      kurzue: 3,           // Kurztitel - höchste Priorität
      langue: 2,           // Langtitel - hohe Priorität  
      text_content: 2,     // Gesetzestext - hohe Priorität
      amtabk: 1,           // Amtliche Abkürzung - mittlere Priorität
      jurabk: 1,           // Juristische Abkürzung - mittlere Priorität
      fussnoten_content: 1, // Fußnoten - mittlere Priorität
      document_type: 1,    // Dokumenttyp - mittlere Priorität
      fundstelle_periodikum: 0, // Fundstelle - niedrige Priorität
      standangabe_kommentar: 0, // Standangabe - niedrige Priorität
      xml_lang: 0,         // Sprache - niedrige Priorität
      text_format: 0,      // Format - niedrige Priorität
      builddate: 0         // Erstellungsdatum - niedrige Priorität
    };
    return importance[field] || 0;
  };

  // Helper-Funktionen für Text-Verarbeitung
  const highlightSearchTerms = (text, searchQuery) => {
    if (!searchQuery || !text) return text;
    
    // Entferne bereits vorhandene <mark> Tags um Dopplungen zu vermeiden
    const cleanText = text.replace(/<\/?mark[^>]*>/g, '');
    
    // Erstelle Regex für Suchbegriffe (case insensitive)
    const searchTerms = searchQuery.split(/\s+/).filter(term => term.length > 2);
    if (searchTerms.length === 0) return cleanText;
    
    const pattern = new RegExp(`(${searchTerms.map(term => 
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('|')})`, 'gi');
    
    return cleanText.replace(pattern, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  const truncateText = (text, maxLength = null) => {
    if (!text) return '';
    if (!maxLength) return text;
    
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;
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
        <div key={result.id || index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          
          {/* Primäre Felder */}
          <div className="mb-4">
            {resultConfig.primary.map(fieldConfig => (
              result[fieldConfig.solrField] && (
                <div key={fieldConfig.solrField} className="mb-3">
                  {fieldConfig.priority === 1 ? (
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {fieldConfig.highlight ? (
                        <span dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerms(
                            truncateText(result[fieldConfig.solrField], fieldConfig.maxLength),
                            searchQuery
                          )
                        }} />
                      ) : (
                        truncateText(result[fieldConfig.solrField], fieldConfig.maxLength)
                      )}
                      {fieldConfig.display === 'badge' && (
                        <span className="ml-2 px-2 py-1 bg-solr-primary text-white text-xs rounded">
                          {fieldConfig.label}
                        </span>
                      )}
                    </h3>
                  ) : (
                    <div className="text-gray-700 leading-relaxed">
                      <span className="font-medium text-gray-500 mr-2">{fieldConfig.label}:</span>
                      {fieldConfig.highlight ? (
                        <span dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerms(
                            truncateText(result[fieldConfig.solrField], fieldConfig.maxLength),
                            searchQuery
                          )
                        }} />
                      ) : (
                        truncateText(result[fieldConfig.solrField], fieldConfig.maxLength)
                      )}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>

          {/* Sekundäre Felder */}
          {resultConfig.secondary.length > 0 && (
            <div className="mb-3 border-t border-gray-100 pt-3">
              <div className="space-y-2">
                {resultConfig.secondary.map(fieldConfig => (
                  result[fieldConfig.solrField] && (
                    <div key={fieldConfig.solrField} className="text-sm text-gray-600">
                      <span className="font-medium text-gray-500 mr-2">{fieldConfig.label}:</span>
                      {fieldConfig.display === 'badge' ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {result[fieldConfig.solrField]}
                        </span>
                      ) : (
                        <span>
                          {uiHelpers.formatFieldValue(result[fieldConfig.solrField], fieldConfig.format)}
                        </span>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Metadaten (nur im Experten-Modus) */}
          {uiMode === 'expert' && resultConfig.metadata.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                {resultConfig.metadata.map(fieldConfig => (
                  result[fieldConfig.solrField] && (
                    <div key={fieldConfig.solrField} className="flex items-center">
                      <span className="font-medium mr-1">{fieldConfig.label}:</span>
                      <span>
                        {uiHelpers.formatFieldValue(result[fieldConfig.solrField], fieldConfig.format)}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Volltext-Button */}
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <button
              onClick={() => setSelectedDocument(result)}
              className="text-solr-primary hover:text-solr-secondary font-medium text-sm transition-colors"
            >
              📄 Volltext anzeigen
            </button>
            <div className="text-xs text-gray-400">
              ID: {result.id}
            </div>
          </div>
        </div>
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
          onClose={() => setSelectedDocument(null)}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
}
