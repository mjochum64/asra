import React, { useState, useEffect } from 'react';
import { searchDocuments } from '../services/solrService';
// import { uiHelpers } from '../config/uiConfig'; // To be replaced
import { isFrameworkDocument, getDocumentTypeLabel } from '../utils/documentUtils'; // Import specific helpers

/**
 * TableOfContents Component - Inhaltsverzeichnis für Rahmendokumente
 * Zeigt alle Untergliederungen (BJNE/BJNG) eines Gesetzes mit Navigation
 */
export default function TableOfContents({ frameworkId, onNormSelect, currentNormId = null }) {
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set());

  useEffect(() => {
    if (frameworkId) {
      loadTableOfContents();
    }
  }, [frameworkId]);

  const loadTableOfContents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Suche alle Unterdokumente des Rahmendokuments
      // Grund: Verwende korrekte Solr-Query-Syntax für hierarchische Dokument-IDs
      const query = `id:"${frameworkId}" OR id:${frameworkId}*`;
      const response = await searchDocuments(query, 'all', {}, {
        rows: 1000,
        sort: 'id asc', // Sortierung nach ID für logische Reihenfolge
        fl: 'id,enbez,norm_type,kurzue,text_content,text_content_html'
      });

      if (response?.docs) {
        // Strukturiere die Ergebnisse hierarchisch
        const structured = structureContents(response.docs);
        setContents(structured);
      }
    } catch (err) {
      console.error('Fehler beim Laden des Inhaltsverzeichnisses:', err);
      setError('Inhaltsverzeichnis konnte nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const structureContents = (docs) => {
    console.log('🔍 DEBUG - All docs received:', docs.map(doc => ({ id: doc.id, norm_type: doc.norm_type, enbez: doc.enbez })));
    
    // Separiere die verschiedenen Dokumenttypen
    const framework = docs.find(doc => isFrameworkDocument(doc.id)); // Use imported
    const sections = docs.filter(doc => doc.norm_type === 'section');
    const articles = docs.filter(doc => doc.norm_type === 'article');
    const specialNorms = docs.filter(doc => doc.norm_type === 'norm' && !isFrameworkDocument(doc.id)); // Use imported
    
    console.log('🔍 DEBUG - Framework:', framework?.id);
    console.log('🔍 DEBUG - Sections found:', sections.length);
    console.log('🔍 DEBUG - Articles found:', articles.length);
    console.log('🔍 DEBUG - Special norms found:', specialNorms.length);

    // Vereinfachte Struktur: Nur sinnvolle Sections (mit Titel oder Inhalt) anzeigen
    const meaningfulSections = sections.filter(section => 
      section.enbez && section.enbez.trim() !== ''
    );
    
    // Für jede Section die zugehörigen Artikel finden
    const structuredSections = meaningfulSections.map(section => {
      const sectionArticles = articles.filter(article => 
        article.id.startsWith(section.id)
      );
      
      console.log(`🔍 DEBUG - Section ${section.id} "${section.enbez}" has ${sectionArticles.length} articles`);
      
      return {
        ...section,
        norms: sectionArticles
      };
    }).filter(section => section.norms.length > 0); // Nur Sections mit Artikeln anzeigen
    
    // Alle Artikel, die nicht zu einer Section gehören + spezielle Normen
    const orphanNorms = [
      ...articles.filter(article => 
        !meaningfulSections.some(section => article.id.startsWith(section.id))
      ),
      ...specialNorms
    ];
    
    console.log('🔍 DEBUG - Meaningful sections:', structuredSections.length);
    console.log('🔍 DEBUG - Orphan norms:', orphanNorms.length);
    
    const result = {
      framework,
      sections: structuredSections,
      orphanNorms
    };
    
    console.log('🔍 DEBUG - Final structure:', {
      framework: result.framework?.id,
      sectionsCount: result.sections.length,
      orphanNormsCount: result.orphanNorms.length
    });

    return result;
  };

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleNormClick = (norm) => {
    if (onNormSelect) {
      onNormSelect(norm);
    }
  };

  const getNormPreview = (textContent) => {
    if (!textContent) return '';
    return textContent.length > 100 ? 
      textContent.substring(0, 100) + '...' : 
      textContent;
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <div className="flex items-center text-red-600">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          📋 Inhaltsverzeichnis
          {contents.framework && (
            <span className="ml-2 text-sm text-gray-500">
              ({contents.sections.length + contents.orphanNorms.length} Einträge)
            </span>
          )}
        </h3>
        
        {contents.framework && (
          <div className="mt-2">
            <h4 className="font-medium text-gray-800">{contents.framework.kurzue}</h4>
            <div className="text-xs text-gray-500 mt-1">
              {getDocumentTypeLabel(contents.framework.id)} • ID: {contents.framework.id}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {/* Gliederungseinheiten mit Untergliederungen */}
        {contents.sections.map((section) => (
          <div key={section.id} className="border-l-2 border-gray-200 pl-3">
            <div
              onClick={() => toggleSection(section.id)}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer group"
            >
              <div className="flex items-center flex-1">
                <span className="text-gray-400 mr-2">
                  {expandedSections.has(section.id) ? '📂' : '📁'}
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    {section.enbez || `Abschnitt ${section.id.slice(-8)}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {section.norms.length} Artikel
                  </div>
                </div>
              </div>
              <svg 
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  expandedSections.has(section.id) ? 'rotate-90' : ''
                }`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Untergeordnete Normen */}
            {expandedSections.has(section.id) && (
              <div className="ml-4 border-l border-gray-100 pl-3 space-y-1">
                {section.norms.map((norm) => (
                  <div
                    key={norm.id}
                    onClick={() => handleNormClick(norm)}
                    className={`p-2 rounded text-sm cursor-pointer transition-colors ${
                      currentNormId === norm.id
                        ? 'bg-solr-primary bg-opacity-10 border-l-2 border-solr-primary'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="text-green-600 mr-2 mt-0.5">📄</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {norm.enbez || `Norm ${norm.id.slice(-6)}`}
                        </div>
                        {norm.text_content && (
                          <div className="text-xs text-gray-500 mt-1">
                            {getNormPreview(norm.text_content)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Direkte Normen (ohne übergeordnete Gliederung) */}
        {contents.orphanNorms.map((norm) => (
          <div
            key={norm.id}
            onClick={() => handleNormClick(norm)}
            className={`p-2 rounded text-sm cursor-pointer transition-colors border-l-2 border-gray-200 pl-3 ${
              currentNormId === norm.id
                ? 'bg-solr-primary bg-opacity-10 border-l-2 border-solr-primary'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start">
              <span className="text-green-600 mr-2 mt-0.5">📄</span>
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  {norm.enbez || `Norm ${norm.id.slice(-6)}`}
                </div>
                {norm.text_content && (
                  <div className="text-xs text-gray-500 mt-1">
                    {getNormPreview(norm.text_content)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {contents.sections.length === 0 && contents.orphanNorms.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Keine Untergliederungen gefunden
          </div>
        )}
      </div>
    </div>
  );
}
