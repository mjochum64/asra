/**
 * Dokumenten-Service für die Volltextanzeige
 * Dieser Service enthält spezialisierte Funktionen für die Arbeit mit Dokumenten
 * in der Volltextanzeige und TableOfContents-Komponente.
 */

import { searchDocuments, fetchDocumentById } from './solrService';
import { getFrameworkId, isFrameworkDocument } from '../utils/documentUtils';

/**
 * Lädt die TableOfContents-Daten für ein Rahmendokument.
 * Diese Funktion stellt sicher, dass die Daten korrekt formatiert sind
 * und keine Map()-Fehler in der TableOfContents-Komponente auftreten.
 * 
 * @param {string} frameworkId - Die ID des Rahmendokuments
 * @returns {Promise<Object>} - Ein strukturiertes Objekt für die TableOfContents-Komponente
 */
export const loadDocumentContents = async (frameworkId) => {
  if (!frameworkId) {
    console.error('Kein Framework-ID für TableOfContents angegeben');
    return { framework: null, sections: [], orphanNorms: [] };
  }
  
  try {
    // Suche alle Unterdokumente des Rahmendokuments
    const query = `id:"${frameworkId}" OR id:${frameworkId}*`;
    const response = await searchDocuments(query, 'all', {}, {
      rows: 1000,
      sort: 'id asc',
      fl: 'id,enbez,norm_type,kurzue,text_content,text_content_html'
    });

    // Extrahiere die docs/results aus der Antwort und stelle sicher, dass es ein Array ist
    const docs = response?.docs || response?.results || [];
    
    // Wenn keine Dokumente gefunden wurden, gebe eine leere Struktur zurück
    if (!Array.isArray(docs) || docs.length === 0) {
      console.warn(`Keine Dokumente gefunden für Framework-ID: ${frameworkId}`);
      return { framework: null, sections: [], orphanNorms: [] };
    }
    
    // Debug-Informationen für Fehlersuche
    console.log(`📑 Gefundene Dokumente für Framework ${frameworkId}:`, docs.length);
    
    return processDocumentContentsData(docs);
  } catch (error) {
    console.error(`Fehler beim Laden der Inhaltsverzeichnisdaten für ${frameworkId}:`, error);
    // Rückgabe einer leeren aber gültigen Struktur im Fehlerfall
    return { framework: null, sections: [], orphanNorms: [] };
  }
};

/**
 * Verarbeitet die rohen Dokument-Daten zu einer strukturierten Form für die TableOfContents.
 * 
 * @param {Array} docs - Die Dokumente aus der Solr-Antwort
 * @returns {Object} - Ein strukturiertes Objekt für die TableOfContents-Komponente
 */
const processDocumentContentsData = (docs) => {
  if (!Array.isArray(docs) || docs.length === 0) {
    return { framework: null, sections: [], orphanNorms: [] };
  }
  
  // Separiere die verschiedenen Dokumenttypen
  const framework = docs.find(doc => doc?.id && isFrameworkDocument(doc.id));
  const sections = docs.filter(doc => doc?.norm_type === 'section');
  const articles = docs.filter(doc => doc?.norm_type === 'article');
  const specialNorms = docs.filter(doc => doc?.norm_type === 'norm' && doc?.id && !isFrameworkDocument(doc.id));
  
  console.log('🔍 DEBUG - Framework:', framework?.id);
  console.log('🔍 DEBUG - Sections found:', sections.length);
  console.log('🔍 DEBUG - Articles found:', articles.length);
  console.log('🔍 DEBUG - Special norms found:', specialNorms.length);
  
  // Vereinfachte Struktur: Nur sinnvolle Sections (mit Titel oder Inhalt) anzeigen
  const meaningfulSections = sections.filter(section => 
    section?.enbez && section.enbez.trim() !== ''
  );
  
  // Für jede Section die zugehörigen Artikel finden
  const structuredSections = meaningfulSections.map(section => {
    const sectionArticles = articles.filter(article => 
      article?.id && section?.id && article.id.startsWith(section.id)
    );
    
    console.log(`🔍 DEBUG - Section ${section.id} "${section.enbez}" has ${sectionArticles.length} articles`);
    
    return {
      ...section,
      norms: sectionArticles
    };
  }).filter(section => section.norms && section.norms.length > 0); // Nur Sections mit Artikeln anzeigen
  
  // Alle Artikel, die nicht zu einer Section gehören + spezielle Normen
  const orphanNorms = [
    ...articles.filter(article => 
      article?.id && !meaningfulSections.some(section => section?.id && article.id.startsWith(section.id))
    ),
    ...specialNorms
  ];
  
  console.log('🔍 DEBUG - Meaningful sections:', structuredSections.length);
  console.log('🔍 DEBUG - Orphan norms:', orphanNorms.length);
  
  return {
    framework,
    sections: structuredSections,
    orphanNorms
  };
};

// Der Named-Export wurde bereits oben mit "export const loadDocumentContents" definiert
// und kann von anderen Modulen mit "import { loadDocumentContents } from '../services/documentService';" importiert werden.
// Der Default-Export ist eigentlich nicht nötig, wird aber für Abwärtskompatibilität beibehalten.
export default {
  loadDocumentContents
};
