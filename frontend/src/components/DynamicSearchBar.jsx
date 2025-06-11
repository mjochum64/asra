import React, { useState, useEffect } from 'react';
import { uiHelpers } from '../config/uiConfig';

/**
 * ConfigUI-driven SearchBar - basierend auf UI-Konfiguration statt dynamischem Schema
 */
export default function DynamicSearchBar({ onSearch, uiMode = 'normal', schemaInfo = null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('all');
  const [searchEngine, setSearchEngine] = useState('keyword'); // 'keyword', 'semantic', or 'hybrid'
  const [fieldOptions, setFieldOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchWeights, setSearchWeights] = useState({ keyword: 0.7, semantic: 0.3 });

  // Lade verfügbare Suchfelder basierend auf UI-Modus beim Mount oder Modus-Änderung
  useEffect(() => {
    loadSearchFieldOptions();
  }, [uiMode]);

  const loadSearchFieldOptions = () => {
    try {
      setIsLoading(true);
      const searchFields = uiHelpers.getSearchFields(uiMode);
      
      // Konvertiere UI-Konfiguration zu feldoptions Format
      const options = searchFields.map(field => ({
        value: field.id,
        label: field.label,
        description: field.description,
        icon: field.icon,
        fields: field.solrField ? [field.solrField] : ['all'], // einzelnes Feld oder alle
        primary: field.primary
      }));
      
      setFieldOptions(options);
      
      // Setze den ersten verfügbaren (primären) Modus als Standard
      const primaryField = options.find(opt => opt.primary) || options[0];
      if (primaryField) {
        setSearchMode(primaryField.value);
      }
    } catch (error) {
      console.error('Failed to load UI search configuration:', error);
      // Fallback zu Basis-Optionen
      setFieldOptions([
        { value: 'all', label: 'Alle Felder', description: 'Durchsucht alle verfügbaren Felder', icon: '🔍', fields: ['all'], primary: true },
        { value: 'text_content', label: 'Volltext', description: 'Durchsucht den Dokumentinhalt', icon: '📄', fields: ['text_content'] }
      ]);
      setSearchMode('all');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm) { // Entferne .trim() um auch Leerzeichen und kurze Begriffe zu erlauben
      if (uiMode === 'expert') {
        // Expertensuche: Verwende direkte Solr-Query-Syntax
        // Wenn die Query bereits Solr-Syntax enthält (Doppelpunkt), verwende sie direkt
        if (searchTerm.includes(':') || searchTerm.includes('AND') || searchTerm.includes('OR')) {
          onSearch(searchTerm, 'expert_query', ['all'], { searchEngine });
        } else {
          // Automatische Suche über alle durchsuchbaren Felder
          onSearch(searchTerm, 'expert_all_fields', ['all'], { searchEngine });
        }
      } else {
        // Normal-Modus: Verwende die ausgewählte Suchfeld-Option
        const selectedOption = fieldOptions.find(opt => opt.value === searchMode);
        
        // Pass additional search engine type and weights
        const searchOptions = {
          searchEngine,
          weights: searchWeights
        };
        
        onSearch(searchTerm, searchMode, selectedOption?.fields || [], searchOptions);
      }
    }
  };

  const getFieldInfo = () => {
    const selectedOption = fieldOptions.find(opt => opt.value === searchMode);
    if (!selectedOption) return '';
    
    return selectedOption.description || `Durchsucht: ${selectedOption.fields.join(', ')}`;
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
                placeholder={uiMode === 'expert' 
                  ? 'Solr-Query (z.B. kurzue:"Grundgesetz" OR amtabk:"GG")...' 
                  : 'Suche nach Dokumenten...'
                }
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
              disabled={!searchTerm || isLoading}
              className="px-6 py-3 bg-solr-primary text-white rounded-lg hover:bg-solr-accent transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] shadow-sm font-medium"
            >
              {isLoading ? 'Lädt...' : 'Suchen'}
            </button>
          </div>
          
          {/* UI-konfigurierte Suchfeld-Optionen - nur im Normal-Modus */}
          {uiMode === 'normal' && !isLoading && fieldOptions.length > 0 && (
            <div className="mt-4">
              {/* Search Engine Type Selector */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Suchmethode:</h3>
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <input
                      type="radio"
                      id="search-engine-keyword"
                      name="search-engine"
                      checked={searchEngine === 'keyword'}
                      onChange={() => setSearchEngine('keyword')}
                      className="sr-only"
                    />
                    <label
                      htmlFor="search-engine-keyword"
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        searchEngine === 'keyword'
                          ? 'border-solr-primary bg-solr-primary bg-opacity-5 text-solr-primary'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="mr-2">🔍</span>
                      <div>
                        <div className="font-medium">Solr (Klassisch)</div>
                        <div className="text-xs mt-1 text-gray-500">Volltextsuche nach Schlüsselwörtern</div>
                      </div>
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="radio"
                      id="search-engine-semantic"
                      name="search-engine"
                      checked={searchEngine === 'semantic'}
                      onChange={() => setSearchEngine('semantic')}
                      className="sr-only"
                    />
                    <label
                      htmlFor="search-engine-semantic"
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        searchEngine === 'semantic'
                          ? 'border-solr-primary bg-solr-primary bg-opacity-5 text-solr-primary'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="mr-2">🧠</span>
                      <div>
                        <div className="font-medium">Qdrant (Semantisch)</div>
                        <div className="text-xs mt-1 text-gray-500">Ähnlichkeitssuche nach Bedeutung</div>
                      </div>
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="radio"
                      id="search-engine-hybrid"
                      name="search-engine"
                      checked={searchEngine === 'hybrid'}
                      onChange={() => setSearchEngine('hybrid')}
                      className="sr-only"
                    />
                    <label
                      htmlFor="search-engine-hybrid"
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        searchEngine === 'hybrid'
                          ? 'border-solr-primary bg-solr-primary bg-opacity-5 text-solr-primary'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="mr-2">⚡</span>
                      <div>
                        <div className="font-medium">Hybrid</div>
                        <div className="text-xs mt-1 text-gray-500">Kombiniert beide Suchmethoden</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Search Field Options */}
              <h3 className="text-sm font-medium text-gray-600 mb-2">Suchfeld:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                {fieldOptions.map((option) => (
                  <div key={option.value} className="relative">
                    <input
                      type="radio"
                      id={`search-${option.value}`}
                      name="search-mode"
                      checked={searchMode === option.value}
                      onChange={() => setSearchMode(option.value)}
                      className="sr-only"
                    />
                    <label 
                      htmlFor={`search-${option.value}`} 
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        searchMode === option.value
                          ? 'border-solr-primary bg-solr-primary bg-opacity-5 text-solr-primary'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="text-lg mr-3">{option.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      </div>
                      {searchMode === option.value && (
                        <svg className="h-5 w-5 text-solr-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  </div>
                ))}
              </div>
              
              {/* Feldinfo */}
              <div className="text-xs text-gray-500 flex items-center bg-gray-50 p-2 rounded">
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {getFieldInfo()}
              </div>
            </div>
          )}

          {/* Expertensuche - Erweiterte Syntax-Hilfe */}
          {uiMode === 'expert' && (
            <div className="mt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-amber-800 mb-2">
                  🔬 Expertensuche - Erweiterte Solr-Syntax
                </h4>
                <div className="text-xs text-amber-700 space-y-1">
                  <div><strong>Feldspezifisch:</strong> <code>jurabk:"GG" OR langue:"Grundgesetz"</code></div>
                  <div><strong>Boolean-Operatoren:</strong> <code>AND</code>, <code>OR</code>, <code>NOT</code></div>
                  <div><strong>Wildcards:</strong> <code>langue:*Grundgesetz*</code></div>
                  <div><strong>Phrase:</strong> <code>text_content:"für die Bundesrepublik"</code></div>
                </div>
              </div>
            </div>
          )}
        </form>
        
        {/* UI-Modus Info und Schema-Info */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>UI-konfigurierte Suche • {uiMode === 'normal' ? 'Normal-Modus' : 'Experten-Modus'}</span>
              {schemaInfo && (
                <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Schema erkannt: {schemaInfo.searchableFields.length} durchsuchbare • {schemaInfo.facetableFields.length} filterbare Felder
                </span>
              )}
            </div>
            <span>{fieldOptions.length} Suchfeld{fieldOptions.length !== 1 ? 'er' : ''} verfügbar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
