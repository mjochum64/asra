import axios from 'axios';
import { getContextualFacets } from './schemaService';
import { buildGermanLegalQuery } from '../utils/queryUtils'; // Import the centralized function

// buildGermanLegalQuery has been moved to ../utils/queryUtils.js

// Konfigurierbare API-URL für gefilterte Suchanfragen
// Verwendet die Backend-API mit Index-Time-Filterung statt direkter Solr-Zugriffe
const getApiBaseUrl = () => {
  // Verwende die Backend-API, die bereits Index-Time-Filterung implementiert hat
  // Prüfe ob wir in Development sind und verwende localhost:3001
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api/';
  }
  return '/api/';
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

export const searchDocuments = async (query, searchMode = 'all', filters = {}, options = {}) => {
  try {
    console.log(`Searching for "${query}" in mode "${searchMode}" with filters:`, filters, 'options:', options);
    
    // Verwende die Backend-API-Route mit Index-Time-Filterung
    const searchParams = new URLSearchParams({
      q: query,
      searchMode: searchMode,
      rows: options.rows || 20,
      start: options.start || 0,
      _: Date.now() // Cache buster
    });
    
    // Füge Filter als separate Parameter hinzu
    Object.keys(filters).forEach(fieldName => {
      const filterValues = filters[fieldName];
      if (filterValues && filterValues.length > 0) {
        filterValues.forEach(value => {
          searchParams.append(`filter_${fieldName}`, value);
        });
      }
    });
    
    // Füge alle anderen options Parameter hinzu (für Export-Funktionen wie fl)
    Object.keys(options).forEach(key => {
      if (key !== 'rows' && key !== 'start') {  // Diese sind bereits hinzugefügt
        searchParams.append(key, options[key]);
      }
    });
    
    // Nutze die gefilterte Backend-API
    const response = await apiClient.get(`search?${searchParams.toString()}`);
    
    console.log(`📊 API Response status: ${response.status}`);
    console.log(`📊 API Response structure:`, {
      hasResults: !!response.data.results,
      hasResultsDocs: !!response.data.results?.docs,
      docsLength: response.data.results?.docs?.length || 0,
      total: response.data.total
    });
    
    // Backend API gibt {results: {numFound, docs}, facets, total} zurück
    // Frontend erwartet {results: [], facets, total}
    return {
      results: response.data.results?.docs || [],  // Extrahiere docs Array aus results Objekt
      facets: response.data.facets || {},
      total: response.data.total || 0
    };
    
  } catch (error) {
    console.error('API Search Error:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

/**
 * Hybrid Search - spezieller Endpoint für semantische und kombinierte Suche
 * @param {string} query - Suchanfrage
 * @param {Object} options - Suchoptionen (rows, start, keyword_weight, semantic_weight)
 * @returns {Promise<Object>} Suchergebnisse im einheitlichen Format
 */
export const searchDocumentsHybrid = async (query, options = {}) => {
  try {
    console.log(`🔄 Hybrid search for "${query}" with options:`, options);
    
    // Verwende die hybride Backend-API-Route
    const searchParams = new URLSearchParams({
      q: query,
      rows: options.rows || 20,
      start: options.start || 0,
      keyword_weight: options.keyword_weight || 0.5,
      semantic_weight: options.semantic_weight || 0.5,
      _: Date.now() // Cache buster
    });
    
    // Nutze die hybride Backend-API
    const response = await apiClient.get(`hybrid/search?${searchParams.toString()}`);
    
    console.log(`📊 Hybrid API Response status: ${response.status}`);
    console.log(`📊 Hybrid API Response full data:`, response.data);
    console.log(`📊 Hybrid API Response numFound: ${response.data.numFound}`);
    
    // Die hybride API gibt bereits die korrekte Struktur zurück: {numFound, docs, start}
    // Konvertiere zu einheitlichem Format für Frontend-Kompatibilität
    console.log('📊 DEBUG - Creating return object with:');
    console.log('📊 DEBUG - results (docs):', response.data.docs?.length || 0, 'items');
    console.log('📊 DEBUG - total (numFound):', response.data.numFound);
    console.log('📊 DEBUG - start:', response.data.start);
    
    const returnObject = {
      results: response.data.docs || [], // Hybride API nutzt "docs" direkt
      facets: {}, // Hybride Suche hat keine Facetten
      total: response.data.numFound || 0, // Hybride API nutzt "numFound"
      start: response.data.start || 0 // Paginierungsstart
    };
    
    console.log('📊 DEBUG - Final return object:', returnObject);
    
    return returnObject;
    
  } catch (error) {
    console.error('Hybrid Search Error:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

/**
 * Manuelle Phrase-Highlighting-Funktion als Fallback
 * Wird verwendet, wenn Solr das Phrase-Highlighting nicht korrekt durchführt
 */
function manualPhraseHighlight(text, phrase) {
  if (!text || !phrase) return text;
  
  // Entferne Anführungszeichen aus der Phrase
  const cleanPhrase = phrase.replace(/['"]/g, '');
  
  // Erstelle Regex für case-insensitive Suche
  const regex = new RegExp(cleanPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  
  // Ersetze alle Vorkommen mit <mark>-Tags
  return text.replace(regex, '<mark>$&</mark>');
}

/**
 * Verbessert Phrase-Highlighting in Solr-Response
 * Prüft, ob die Phrase vollständig hervorgehoben wurde, und korrigiert bei Bedarf
 */
function enhancePhraseHighlighting(highlights, originalQuery) {
  if (!highlights || !originalQuery || !originalQuery.includes('"')) {
    return highlights;
  }
  
  // Extrahiere Phrase aus der Query
  const phraseMatch = originalQuery.match(/"([^"]+)"/);
  if (!phraseMatch) return highlights;
  
  const phrase = phraseMatch[1];
  console.log(`🎨 MANUAL HIGHLIGHT - Attempting to enhance phrase highlighting for: "${phrase}"`);
  
  const enhanced = {};
  
  Object.keys(highlights).forEach(field => {
    if (Array.isArray(highlights[field])) {
      enhanced[field] = highlights[field].map(snippet => {
        // Prüfe, ob die vollständige Phrase bereits hervorgehoben ist
        const hasCompletePhrase = snippet.includes(`<mark>${phrase}</mark>`);
        
        if (!hasCompletePhrase) {
          console.log(`🎨 MANUAL HIGHLIGHT - Field ${field}: phrase not fully highlighted, applying manual highlighting`);
          console.log(`🎨 MANUAL HIGHLIGHT - Original snippet:`, snippet);
          
          // Entferne vorhandene <mark>-Tags und füge korrekte hinzu
          const cleaned = snippet.replace(/<\/?mark>/g, '');
          const enhanced = manualPhraseHighlight(cleaned, phrase);
          
          console.log(`🎨 MANUAL HIGHLIGHT - Enhanced snippet:`, enhanced);
          return enhanced;
        }
        
        return snippet;
      });
    } else {
      enhanced[field] = highlights[field];
    }
  });
  
  return enhanced;
}

function processSearchResponse(response) {
  const docs = response.data.response.docs;
  let responseHighlighting = response.data.highlighting || {};
  
  // Debug: Log highlighting response
  console.log('🎨 HIGHLIGHTING DEBUG - Response highlighting keys:', Object.keys(responseHighlighting));
  if (Object.keys(responseHighlighting).length > 0) {
    const firstDocId = Object.keys(responseHighlighting)[0];
    console.log('🎨 HIGHLIGHTING DEBUG - First document highlights:', responseHighlighting[firstDocId]);
  }
  
  // Füge Highlighting zu den Dokumenten hinzu und normalisiere Array-Felder
  return docs.map(doc => {
    let docHighlights = responseHighlighting[doc.id] || {};
    
    // Verbessere Phrase-Highlighting falls notwendig
    const originalQuery = response.config?.params?.q || '';
    docHighlights = enhancePhraseHighlighting(docHighlights, originalQuery);
    
    // Normalisiere Array-Felder zu Strings (Solr gibt Arrays zurück)
    const normalizedDoc = {
      ...doc,
      // Legacy fields for compatibility (map to existing fields if they exist)
      title: Array.isArray(doc.titel) ? doc.titel[0] : (doc.titel || (Array.isArray(doc.title) ? doc.title[0] : doc.title)),
      content: Array.isArray(doc.text_content) ? doc.text_content[0] : (doc.text_content || (Array.isArray(doc.content) ? doc.content[0] : doc.content)),
      // Standard fields
      category: Array.isArray(doc.category) ? doc.category[0] : doc.category,
      author: Array.isArray(doc.author) ? doc.author[0] : doc.author,
      created_date: Array.isArray(doc.created_date) ? doc.created_date[0] : doc.created_date,
      last_modified: Array.isArray(doc.last_modified) ? doc.last_modified[0] : doc.last_modified,
      // Deutsche Rechtsfelder hinzufügen
      kurzue: Array.isArray(doc.kurzue) ? doc.kurzue[0] : doc.kurzue,
      langue: Array.isArray(doc.langue) ? doc.langue[0] : doc.langue,
      amtabk: Array.isArray(doc.amtabk) ? doc.amtabk[0] : doc.amtabk,
      jurabk: Array.isArray(doc.jurabk) ? doc.jurabk[0] : doc.jurabk,
      text_content: Array.isArray(doc.text_content) ? doc.text_content[0] : doc.text_content,
      titel: Array.isArray(doc.titel) ? doc.titel[0] : doc.titel
    };
    
    // Debug: Log highlights for this document
    if (Object.keys(docHighlights).length > 0) {
      console.log(`🎨 HIGHLIGHTING DEBUG - Doc ${doc.id} highlights:`, docHighlights);
    }
    
    // Ersetze Inhalte mit hervorgehobenem Text, falls verfügbar
    if (docHighlights.titel && docHighlights.titel.length > 0) {
      normalizedDoc.titel = docHighlights.titel[0];
      normalizedDoc.title = docHighlights.titel[0]; // Legacy compatibility
    }
    
    // Legacy title field support
    if (docHighlights.title && docHighlights.title.length > 0) {
      normalizedDoc.title = docHighlights.title[0];
    }
    
    if (docHighlights.text_content && docHighlights.text_content.length > 0) {
      // Verwende das erste und beste Highlight-Snippet für text_content
      normalizedDoc.text_content = docHighlights.text_content[0];
      normalizedDoc.content = docHighlights.text_content[0]; // Legacy compatibility
      
      console.log(`🎨 HIGHLIGHTING DEBUG - text_content highlight for doc ${doc.id}:`, docHighlights.text_content[0]);
      
      // Falls mehrere Snippets vorhanden sind, zeige sie zusammen
      if (docHighlights.text_content.length > 1) {
        normalizedDoc.contentSnippets = docHighlights.text_content;
        console.log(`🎨 HIGHLIGHTING DEBUG - Multiple text_content snippets for doc ${doc.id}:`, docHighlights.text_content);
      }
    }
    
    // Legacy content field support
    if (docHighlights.content && docHighlights.content.length > 0) {
      normalizedDoc.content = docHighlights.content[0];
      
      if (docHighlights.content.length > 1) {
        normalizedDoc.contentSnippets = docHighlights.content;
      }
    }
    
    // Deutsche Rechtsfelder mit Highlighting unterstützen
    if (docHighlights.kurzue && docHighlights.kurzue.length > 0) {
      normalizedDoc.kurzue = docHighlights.kurzue[0];
    }
    
    if (docHighlights.langue && docHighlights.langue.length > 0) {
      normalizedDoc.langue = docHighlights.langue[0];
    }
    
    if (docHighlights.amtabk && docHighlights.amtabk.length > 0) {
      normalizedDoc.amtabk = docHighlights.amtabk[0];
    }
    
    if (docHighlights.jurabk && docHighlights.jurabk.length > 0) {
      normalizedDoc.jurabk = docHighlights.jurabk[0];
    }
    
    return normalizedDoc;
  });
}

/**
 * DEAKTIVIERT - Mock-Funktion für Produktion entfernt
 * Diese Funktion wurde deaktiviert um sicherzustellen, dass nur echte Solr-Daten verwendet werden
 */
export const mockSearch = () => {
  console.error('❌ Mock-Daten sind deaktiviert. Verwenden Sie echte Solr-Daten.');
  throw new Error('Mock-Daten sind in der Produktionsversion deaktiviert. Bitte stellen Sie sicher, dass Solr verfügbar ist.');
};

/**
 * DEAKTIVIERT - Mock-Suche mit Filter-Unterstützung für Produktion entfernt
 * Diese Funktion wurde deaktiviert um sicherzustellen, dass nur echte Solr-Daten verwendet werden
 */
export const mockSearchWithFilters = (query, filters = {}) => {
  console.error('❌ Mock-Daten mit Filtern sind deaktiviert. Verwenden Sie echte Solr-Daten.');
  throw new Error('Mock-Daten sind in der Produktionsversion deaktiviert. Bitte stellen Sie sicher, dass Solr verfügbar ist.');
};



/**
 * Holt verfügbare Facetten für Filter von Solr
 * @param {string[]} facetFields - Array der Felder für die Facetten abgerufen werden sollen
 * @returns {Promise<Object>} Facetten-Daten gruppiert nach Feldern
 */
export const getFacets = async (facetFields = ['category', 'author']) => {
  try {
    const queryParams = {
      q: '*:*',  // Alle Dokumente
      wt: 'json',
      rows: 0,   // Keine Dokumente zurückgeben, nur Facetten
      facet: 'true',
      'facet.field': facetFields,
      'facet.limit': 50,  // Maximal 50 Facetten pro Feld
      'facet.mincount': 1  // Nur Facetten mit mindestens 1 Dokument
    };
    
    console.log('Facet query params:', queryParams);
    
    const response = await solrClient.get('documents/select', {
      params: queryParams
    });
    
    console.log('Facet response:', response.data.facet_counts);
    
    // Verarbeite Facetten-Daten
    const solrFacetFields = response.data.facet_counts?.facet_fields || {};
    const processedFacets = {};
    
    // Konvertiere Solr-Facetten-Format in benutzbares Objekt
    Object.keys(solrFacetFields).forEach(field => {
      const facetArray = solrFacetFields[field];
      const facetItems = [];
      
      // Solr gibt Facetten als Array zurück: [term1, count1, term2, count2, ...]
      for (let i = 0; i < facetArray.length; i += 2) {
        facetItems.push({
          value: facetArray[i],
          count: facetArray[i + 1]
        });
      }
      
      processedFacets[field] = facetItems;
    });
    
    return processedFacets;
  } catch (error) {
    console.error('Facets API Error:', error);
    throw error;
  }
};

/**
 * DEAKTIVIERT - Mock-Facetten für Produktion entfernt
 * Diese Funktion wurde deaktiviert um sicherzustellen, dass nur echte Solr-Daten verwendet werden
 */
export const mockGetFacets = () => {
  console.error('❌ Mock-Facetten sind deaktiviert. Verwenden Sie echte Solr-Daten.');
  throw new Error('Mock-Facetten sind in der Produktionsversion deaktiviert. Bitte stellen Sie sicher, dass Solr verfügbar ist.');
};

/**
 * Fetches a single document by its ID from Solr.
 * @param {string} documentId - The ID of the document to fetch.
 * @returns {Promise<Object|null>} The document object if found, otherwise null.
 */
export const fetchDocumentById = async (documentId) => {
  try {
    console.log(`Fetching document by ID: ${documentId}`);
    
    // Verwende die Backend-API für konsistente Filterung
    const response = await apiClient.get(`search?q=id:"${documentId}"&rows=1`);
    
    console.log('📊 fetchDocumentById response structure:', {
      hasResults: !!response.data.results,
      hasResultsDocs: !!response.data.results?.docs,
      docsLength: response.data.results?.docs?.length || 0
    });
    
    // Backend API gibt {results: {numFound, docs}} zurück
    const docs = response.data.results?.docs || [];
    
    if (docs.length === 1) {
      return docs[0];
    } else {
      console.warn(`Document with ID ${documentId} not found.`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching document by ID ${documentId}:`, error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    throw error;
  }
};
