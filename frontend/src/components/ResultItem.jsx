import React from 'react';
import { uiHelpers } from '../config/uiConfig'; // For getFieldValue, getFieldLabel
import { highlightSearchTerms, truncateText } from '../utils/textFormatters.jsx';
import { getDocumentType, getDocumentTypeLabel } from '../utils/documentUtils';
import { formatFieldValue } from '../utils/formatUtils';

// Moved renderFieldBadge function here
const renderFieldBadge = (fieldConfig, fieldData, isPrimary = false) => {
  if (!fieldConfig.display) return null;

  const value = fieldData.value;
  if (!value) return null;

  switch (fieldConfig.display) {
    case 'norm-badge':
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ${isPrimary ? 'ml-2' : ''}`}>
          📋 {value}
        </span>
      );

    case 'small-badge':
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 ${isPrimary ? 'ml-2' : ''}`}>
          {value}
        </span>
      );

    case 'badge':
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${isPrimary ? 'ml-2' : ''}`}>
          {value}
        </span>
      );

    case 'type-badge':
      const colorMap = {
        'article': 'bg-purple-100 text-purple-800',
        'norm': 'bg-green-100 text-green-800',
        'law': 'bg-blue-100 text-blue-800',
        'regulation': 'bg-orange-100 text-orange-800'
      };
      const colorClass = colorMap[value.toLowerCase()] || 'bg-gray-100 text-gray-700';

      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass} ${isPrimary ? 'ml-2' : ''}`}>
          {value}
        </span>
      );

    default:
      return null;
  }
};

export default function ResultItem({ result, searchQuery, uiMode, resultConfig, onViewFullText }) {
  const localDocumentType = getDocumentType(result.id); // Use imported
  const isFramework = localDocumentType === 'framework';
  const isNorm = localDocumentType === 'norm';

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ${
      isFramework ? 'border-l-4 border-blue-500' : isNorm ? 'border-l-4 border-green-500' : ''
    }`}>

      {/* Document Type and Search Source Indicator */}
      <div className="mb-3 flex flex-wrap gap-2">
        {(isFramework || isNorm) && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isFramework
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {getDocumentTypeLabel(localDocumentType)}
          </span>
        )}
        
        {/* Search Source Badge - only shown for hybrid search results */}
        {result.search_source && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            result.search_source === 'keyword' 
              ? 'bg-amber-100 text-amber-800'
              : result.search_source === 'semantic' 
                ? 'bg-purple-100 text-purple-800'
                : 'bg-indigo-100 text-indigo-800' // hybrid
          }`}>
            {result.search_source === 'keyword' && '🔍 Solr'}
            {result.search_source === 'semantic' && '🧠 Semantisch'}
            {result.search_source === 'hybrid' && '⚡ Hybrid'}
          </span>
        )}
        
        {/* Relevance Score Badge - if available and in expert mode */}
        {uiMode === 'expert' && result.score && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Score: {result.score.toFixed(2)}
          </span>
        )}
      </div>

      {/* Primäre Felder */}
      <div className="mb-4">
        {resultConfig.primary.map(fieldConfig => {
          const fieldData = uiHelpers.getFieldValue(result, fieldConfig);

          if (!fieldData) return null;

          return (
            <div key={fieldConfig.solrField} className="mb-3">
              {fieldConfig.priority === 1 ? (
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {fieldConfig.highlight ? (
                    <span dangerouslySetInnerHTML={{
                      __html: highlightSearchTerms(
                        truncateText(fieldData.value, fieldConfig.maxLength),
                        searchQuery
                      )
                    }} />
                  ) : (
                    truncateText(fieldData.value, fieldConfig.maxLength)
                  )}
                  {fieldData.sourceField !== fieldConfig.solrField && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      aus {fieldData.label}
                    </span>
                  )}
                  {renderFieldBadge(fieldConfig, fieldData, true)}
                </h3>
              ) : (
                <div className="text-gray-700 leading-relaxed">
                  <span className="font-medium text-gray-500 mr-2">{fieldData.label}:</span>
                  {fieldConfig.highlight ? (
                    <span dangerouslySetInnerHTML={{
                      __html: highlightSearchTerms(
                        truncateText(fieldData.value, fieldConfig.maxLength),
                        searchQuery
                      )
                    }} />
                  ) : (
                    truncateText(fieldData.value, fieldConfig.maxLength)
                  )}
                  {renderFieldBadge(fieldConfig, fieldData)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sekundäre Felder */}
      {resultConfig.secondary.length > 0 && (
        <div className="mb-3 border-t border-gray-100 pt-3">
          <div className="space-y-2">
            {resultConfig.secondary.map(fieldConfig => {
              const fieldData = uiHelpers.getFieldValue(result, fieldConfig);
              if (!fieldData) return null;

              return (
                <div key={fieldConfig.solrField} className="text-sm text-gray-600">
                  {renderFieldBadge(fieldConfig, fieldData) || (
                    <>
                      <span className="font-medium text-gray-500 mr-2">{fieldData.label}:</span>
                      <span>
                        {formatFieldValue(fieldData.value, fieldConfig.format)}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadaten (nur im Experten-Modus) */}
      {uiMode === 'expert' && resultConfig.metadata.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {resultConfig.metadata.map(fieldConfig =>
              result[fieldConfig.solrField] && (
                <div key={fieldConfig.solrField} className="flex items-center">
                  <span className="font-medium mr-1">{fieldConfig.label}:</span>
                  <span>
                    {formatFieldValue(result[fieldConfig.solrField], fieldConfig.format)}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Volltext-Button */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewFullText(result)}
            className="text-solr-primary hover:text-solr-secondary font-medium text-sm transition-colors"
          >
            📄 Volltext anzeigen
          </button>
          {isFramework && (
            <span className="text-blue-600 text-xs">
              📋 Mit Inhaltsverzeichnis
            </span>
          )}
          {isNorm && (
            <span className="text-green-600 text-xs">
              🔗 Teil eines Gesetzes
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400">
          ID: {result.id}
        </div>
      </div>
    </div>
  );
}
