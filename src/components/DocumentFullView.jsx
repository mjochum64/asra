import React, { useState } from 'react';
import { uiConfig, uiHelpers } from '../config/uiConfig';

/**
 * DocumentFullView Component - Structured full-text display of a document
 */
export default function DocumentFullView({ document, onClose }) {
  const [searchInContent, setSearchInContent] = useState('');
  const [highlightedContent, setHighlightedContent] = useState(null);

  const fullTextConfig = uiConfig.fulltext;

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
    if (query && document.text_content) {
      const regex = new RegExp(`(${query})`, 'gi');
      const highlighted = document.text_content.replace(regex, '<mark>$1</mark>');
      setHighlightedContent(highlighted);
    } else {
      setHighlightedContent(null);
    }
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
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* Document Header */}
            <div className="mb-6">
              {fullTextConfig.header.map((field) => 
                shouldShowField(field, document) && document[field.solrField] && (
                  <div key={field.solrField} className={getFieldStyle(field.style)}>
                    {field.style?.includes('badge') ? (
                      <span className={getFieldStyle(field.style)}>
                        {uiHelpers.formatFieldValue(document[field.solrField], field.format)}
                      </span>
                    ) : (
                      uiHelpers.formatFieldValue(document[field.solrField], field.format)
                    )}
                  </div>
                )
              )}
            </div>

            {/* Content Search */}
            {fullTextConfig.content.some(field => field.searchable && document[field.solrField]) && (
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
                shouldShowField(field, document) && document[field.solrField] && (
                  <div key={field.solrField}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{field.label}</h3>
                    <div className={getFieldStyle(field.style)}>
                      {field.searchable && highlightedContent && field.solrField === 'text_content' ? (
                        <div dangerouslySetInnerHTML={{ __html: highlightedContent }} />
                      ) : (
                        <div>
                          {uiHelpers.formatFieldValue(document[field.solrField], field.format)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadaten</h3>
            
            {fullTextConfig.sidebar.map((section) => (
              <div key={section.section} className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3 pb-1 border-b border-gray-300">
                  {section.section}
                </h4>
                <div className="space-y-3">
                  {section.fields.map((field) => 
                    shouldShowField(field, document) && document[field.solrField] && (
                      <div key={field.solrField}>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {field.label}
                        </dt>
                        <dd className={`mt-1 text-sm ${getFieldStyle(field.style) || 'text-gray-900'}`}>
                          {uiHelpers.formatFieldValue(document[field.solrField], field.format)}
                        </dd>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Dokument-ID: {document.id}</span>
            <span>{Object.keys(document).length} Felder verfügbar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
