import React, { useState, useRef } from 'react';
import { uiConfig } from '../config/uiConfig'; // uiHelpers will be removed or replaced by specific imports
import TableOfContents from './TableOfContents';
import DocumentExport from './DocumentExport';
import { getContentForDisplay, formatLegalTextAsFallback } from '../utils/textFormatters.jsx';
import { getDocumentType, getFrameworkId, getDocumentTypeLabel } from '../utils/documentUtils'; // Import document utils
import { formatFieldValue } from '../utils/formatUtils'; // Import format utils

/**
 * DocumentFullView Component - Structured full-text display of a document
 */
export default function DocumentFullView({ document, onClose }) {
  const [searchInContent, setSearchInContent] = useState('');
  const [highlightedContent, setHighlightedContent] = useState(null);
  const [selectedNorm, setSelectedNorm] = useState(null);
  const [isMetadataVisible, setIsMetadataVisible] = useState(true);
  
  // Ref für das Main Content Area Element
  const mainContentRef = useRef(null);

  const fullTextConfig = uiConfig.fulltext;
  
  // Erkenne Dokumenttyp und Framework-ID
  const localDocumentType = getDocumentType(document.id); // Renamed to avoid conflict with prop if any, and use imported
  const isFramework = localDocumentType === 'framework';
  const frameworkId = isFramework ? document.id : getFrameworkId(document.id); // Use imported

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

  // getContentForDisplay and formatLegalTextAsFallback moved to ../utils/textFormatters.js

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
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center flex-grow min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 mr-3 truncate">Dokumentenansicht</h2>
            <div className="flex items-center space-x-1"> {/* Wrapper for export and toggle */}
              <DocumentExport
                document={getCurrentDocument()}
                frameworkId={frameworkId}
                documentType={localDocumentType}
              />
              <button
                onClick={() => setIsMetadataVisible(!isMetadataVisible)}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                title={isMetadataVisible ? "Metadaten ausblenden" : "Metadaten einblenden"}
              >
                {isMetadataVisible ? (
                  // Icon for "hide sidebar" (e.g., layout-sidebar-left-collapse)
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <path d="m14 9-3 3 3 3"></path>
                  </svg>
                ) : (
                  // Icon for "show sidebar" (e.g., layout-sidebar-left-expand)
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <path d="m15 9 3 3-3 3"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0"
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
                  {getDocumentTypeLabel(localDocumentType)}
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
                  localDocumentType === 'framework'
                    ? 'bg-blue-100 text-blue-800' 
                    : localDocumentType === 'norm'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {getDocumentTypeLabel(localDocumentType)}
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
                        {formatFieldValue(getCurrentDocument()[field.solrField], field.format)}
                      </span>
                    ) : (
                      formatFieldValue(getCurrentDocument()[field.solrField], field.format)
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
                          {formatFieldValue(getCurrentDocument()[field.solrField], field.format)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Rechte Sidebar - Metadaten und Export */}
          <div className={`bg-gray-50 border-l border-gray-200 overflow-y-auto transition-all duration-300 ease-in-out ${isMetadataVisible ? 'w-80' : 'w-0 overflow-hidden'}`}>
            
            {/* Metadaten */}
            {/* Child div for content, controls opacity and padding */}
            <div className={`transition-opacity duration-300 ease-in-out overflow-hidden ${isMetadataVisible ? 'opacity-100 p-6' : 'opacity-0 p-0'}`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadaten</h3>
              
              {/* Content of metadata, will be hidden by opacity-0 and p-0 and overflow-hidden on parent */}
              <>
                {/*
                Metadata rendering section assessed for potential extraction into MetadataDisplay.jsx.
                Decision: For this subtask, the complexity is manageable within DocumentFullView.jsx.
                Extraction is not performed at this time to keep focus on text formatter centralization.
                This section can be a candidate for future refactoring if it grows in complexity or
                if a similar metadata display is needed elsewhere.
              */}
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
                                {formatFieldValue(getCurrentDocument()[field.solrField], field.format)}
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
                </>
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
              {localDocumentType === 'framework' && (
                <span className="text-blue-600 text-xs">
                  📋 Hierarchisches Dokument mit Inhaltsverzeichnis
                </span>
              )}
              {localDocumentType === 'norm' && (
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
