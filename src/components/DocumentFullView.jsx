import React, { useState, useRef } from 'react';
import { uiConfig, uiHelpers } from '../config/uiConfig';
import TableOfContents from './TableOfContents';
import DocumentExport from './DocumentExport';

/**
 * DocumentFullView Component - Structured full-text display of a document
 */
export default function DocumentFullView({ document, onClose }) {
  const [searchInContent, setSearchInContent] = useState('');
  const [highlightedContent, setHighlightedContent] = useState(null);
  const [selectedNorm, setSelectedNorm] = useState(null);
  
  // Ref für das Main Content Area Element
  const mainContentRef = useRef(null);

  const fullTextConfig = uiConfig.fulltext;
  
  // Erkenne Dokumenttyp und Framework-ID
  const documentType = uiHelpers.getDocumentType(document.id);
  const isFramework = documentType === 'framework';
  const frameworkId = isFramework ? document.id : uiHelpers.getFrameworkId(document.id);

  // Helper function to check field conditions
  const shouldShowField = (field, document) => {
    if (!field.condition) return true;
    
    switch (field.condition) {
      case 'if_different_from_kurzue':
        return document[field.solrField] && document[field.solrField] !== document.kurzue;
      case 'if_exists':
        return document[field.solrField] && document[field.solrField].length > 0;
      default:
        return true;
    }
  };

  // Search within document content
  const handleContentSearch = (query) => {
    setSearchInContent(query);
    const currentDoc = getCurrentDocument();
    if (query && currentDoc.text_content) {
      const regex = new RegExp(`(${query})`, 'gi');
      const highlighted = currentDoc.text_content.replace(regex, '<mark>$1</mark>');
      setHighlightedContent(highlighted);
    } else {
      setHighlightedContent(null);
    }
  };

  const handleNormSelection = (norm) => {
    setSelectedNorm(norm);
    // Scroll zum Volltext-Bereich mit useRef für sichere DOM-Manipulation
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  };

  const getCurrentDocument = () => {
    return selectedNorm || document;
  };

  // Grund: Hilfsfunktion um bevorzugt HTML-Felder zu verwenden
  const getContentForDisplay = (document, fieldType = 'text_content') => {
    // Bevorzuge HTML-Felder wenn verfügbar
    const htmlField = fieldType + '_html';
    if (document[htmlField]) {
      return (
        <div 
          className="prose prose-sm max-w-none text-gray-700 leading-relaxed" 
          dangerouslySetInnerHTML={{ __html: document[htmlField] }}
        />
      );
    }
    
    // Fallback auf Textfelder mit manueller Formatierung
    if (document[fieldType]) {
      return formatLegalTextAsFallback(document[fieldType]);
    }
    
    return null;
  };

  // Grund: Fallback-Formatierung nur wenn keine HTML-Felder verfügbar sind
  const formatLegalTextAsFallback = (text) => {
    if (!text) return '';
    
    // Entferne HTML-Tags falls vorhanden
    let cleanText = text.replace(/<[^>]*>/g, '');
    
    // Erkenne numerierte Absätze: (1), (2), (3) etc. oder 1., 2., 3. etc.
    // Auch römische Ziffern: I., II., III. oder (I), (II), (III)
    const paragraphPatterns = [
      /(\(\d+\))/g,           // (1), (2), (3)
      /(\d+\.)/g,             // 1., 2., 3.
      /(\([IVX]+\))/g,        // (I), (II), (III), (IV), (V)
      /([IVX]+\.)/g,          // I., II., III., IV., V.
      /(\([a-z]\))/g,         // (a), (b), (c)
      /([a-z]\.)/g            // a., b., c.
    ];
    
    // Erstelle Absätze vor jedem nummerierten Absatz
    paragraphPatterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, '\n\n$1');
    });
    
    // Entferne mehrfache Zeilenwechsel und normalisiere
    cleanText = cleanText
      .replace(/\n{3,}/g, '\n\n')  // Maximal 2 Zeilenwechsel
      .replace(/^\n+/, '')          // Entferne führende Zeilenwechsel
      .trim();
    
    // Konvertiere zu JSX mit <p> Tags
    const paragraphs = cleanText.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-4 leading-relaxed">
        {paragraph.trim()}
      </p>
    ));
  };

  const getFieldStyle = (style) => {
    const styles = {
      'title': 'text-2xl font-bold text-gray-900 mb-3',
      'subtitle': 'text-lg font-semibold text-gray-700 mb-2',
      'badge-primary': 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-solr-primary text-white mr-2 mb-2',
      'badge-secondary': 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700 mr-2 mb-2',
      'main-content': 'prose prose-sm max-w-none text-gray-700 leading-relaxed',
      'structured-content': 'bg-gray-50 p-4 rounded-lg mt-4',
      'technical': 'text-xs text-gray-500 font-mono'
    };
    return styles[style] || '';
  };

  if (!document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Dokumentenansicht</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          
          {/* Linke Sidebar - Inhaltsverzeichnis für Framework-Dokumente */}
          {isFramework && (
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Inhaltsverzeichnis</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {uiHelpers.getDocumentTypeLabel(documentType)}
                </p>
              </div>
              <TableOfContents
                frameworkId={frameworkId}
                onNormSelect={handleNormSelection}
                selectedNormId={selectedNorm?.id}
              />
            </div>
          )}
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 main-content-area" ref={mainContentRef}>
            
            {/* Document Type Badge und Framework Info */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  documentType === 'framework' 
                    ? 'bg-blue-100 text-blue-800' 
                    : documentType === 'norm'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {uiHelpers.getDocumentTypeLabel(documentType)}
                </span>
                {!isFramework && frameworkId && (
                  <span className="text-sm text-gray-500">
                    Gehört zu: {frameworkId}
                  </span>
                )}
              </div>
              
              {selectedNorm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      Ausgewählte Norm: {selectedNorm.title || selectedNorm.id}
                    </span>
                    <button
                      onClick={() => setSelectedNorm(null)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Zurück zur Übersicht
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Document Header */}
            <div className="mb-6">
              {fullTextConfig.header.map((field) => 
                shouldShowField(field, getCurrentDocument()) && getCurrentDocument()[field.solrField] && (
                  <div key={field.solrField} className={getFieldStyle(field.style)}>
                    {field.style?.includes('badge') ? (
                      <span className={getFieldStyle(field.style)}>
                        {uiHelpers.formatFieldValue(getCurrentDocument()[field.solrField], field.format)}
                      </span>
                    ) : (
                      uiHelpers.formatFieldValue(getCurrentDocument()[field.solrField], field.format)
                    )}
                  </div>
                )
              )}
            </div>

            {/* Content Search */}
            {fullTextConfig.content.some(field => field.searchable && getCurrentDocument()[field.solrField]) && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Im Dokument suchen:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchInContent}
                    onChange={(e) => handleContentSearch(e.target.value)}
                    placeholder="Suchbegriff eingeben..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-solr-primary focus:border-transparent"
                  />
                  {searchInContent && (
                    <button
                      onClick={() => handleContentSearch('')}
                      className="px-3 py-2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="space-y-6">
              {fullTextConfig.content.map((field) => 
                shouldShowField(field, getCurrentDocument()) && getCurrentDocument()[field.solrField] && (
                  <div key={field.solrField}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{field.label}</h3>
                    <div className={getFieldStyle(field.style)}>
                      {field.searchable && highlightedContent && field.solrField === 'text_content' ? (
                        <div dangerouslySetInnerHTML={{ __html: highlightedContent }} />
                      ) : field.solrField === 'text_content_html' || field.solrField === 'fussnoten_content_html' ? (
                        // Render HTML content fields with preserved formatting
                        <div 
                          className="prose prose-sm max-w-none" 
                          dangerouslySetInnerHTML={{ __html: getCurrentDocument()[field.solrField] }} 
                        />
                      ) : field.solrField === 'text_content' ? (
                        // Grund: Verwende bevorzugt HTML-Felder, mit Fallback auf Textformatierung
                        getContentForDisplay(getCurrentDocument(), 'text_content')
                      ) : (
                        <div>
                          {uiHelpers.formatFieldValue(getCurrentDocument()[field.solrField], field.format)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Rechte Sidebar - Metadaten und Export */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
            
            {/* Export-Bereich */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Export</h3>
              <DocumentExport 
                document={getCurrentDocument()}
                frameworkId={frameworkId}
                documentType={documentType}
              />
            </div>
            
            {/* Metadaten */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadaten</h3>
              
              {fullTextConfig.sidebar.map((section) => (
                <div key={section.section} className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 pb-1 border-b border-gray-300">
                    {section.section}
                  </h4>
                  <div className="space-y-3">
                    {section.fields.map((field) => 
                      shouldShowField(field, getCurrentDocument()) && getCurrentDocument()[field.solrField] && (
                        <div key={field.solrField}>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {field.label}
                          </dt>
                          <dd className={`mt-1 text-sm ${getFieldStyle(field.style) || 'text-gray-900'}`}>
                            {uiHelpers.formatFieldValue(getCurrentDocument()[field.solrField], field.format)}
                          </dd>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
              
              {/* Framework-Navigation für einzelne Normen */}
              {!isFramework && frameworkId && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 pb-1 border-b border-gray-300">
                    Navigation
                  </h4>
                  <button
                    onClick={() => {
                      // Hier könnte eine Funktion zum Navigieren zum Framework-Dokument implementiert werden
                      console.log('Navigate to framework:', frameworkId);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    → Zum Rahmendokument ({frameworkId})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>Dokument-ID: {getCurrentDocument().id}</span>
              <span>{Object.keys(getCurrentDocument()).length} Felder verfügbar</span>
              {selectedNorm && (
                <span className="text-blue-600">• Einzelne Norm angezeigt</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {documentType === 'framework' && (
                <span className="text-blue-600 text-xs">
                  📋 Hierarchisches Dokument mit Inhaltsverzeichnis
                </span>
              )}
              {documentType === 'norm' && (
                <span className="text-green-600 text-xs">
                  📄 Einzelne Rechtsnorm
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
