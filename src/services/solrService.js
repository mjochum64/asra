import axios from 'axios';
import { getContextualFacets } from './schemaService';
import { buildGermanLegalQuery } from '../utils/queryUtils'; // Import the centralized function

// buildGermanLegalQuery has been moved to ../utils/queryUtils.js

// Konfigurierbare Solr-URL basierend auf der Umgebung
// Im Produktionsbetrieb mit Docker wird "/solr/" verwendet (relativ zur gleichen Domain wie Frontend)
// Grund: Vermeidet CORS-Probleme durch Proxying über Nginx
const getSolrBaseUrl = () => {
  // In einer Produktionsumgebung verwenden wir den relativen Pfad
  // Vite verwendet import.meta.env.MODE statt process.env.NODE_ENV
  if (import.meta.env.MODE === 'production') {
    return '/solr/';
  }
  
  // Da wir jetzt einen Proxy-Server in der Vite-Konfiguration haben,
  // können wir auch im Entwicklungsmodus den relativen Pfad verwenden
  return '/solr/';
  
  // Die folgenden Zeilen sind jetzt nicht mehr notwendig, da wir immer den Proxy verwenden
  // Falls wir später direkt auf Solr zugreifen wollen, können wir sie wieder aktivieren
  /*
  // In der Entwicklung können wir die Umgebungsvariable verwenden (falls gesetzt)
  if (import.meta.env.VITE_SOLR_URL) {
    return import.meta.env.VITE_SOLR_URL;
  }
  
  // Fallback für lokale Entwicklung
  return 'http://localhost:8983/solr/';
  */
};

const solrClient = axios.create({
  baseURL: getSolrBaseUrl(),
  timeout: 10000,
  withCredentials: false, // Wichtig für CORS-Anfragen
  headers: {
    'Content-Type': 'application/json'
  }
});

export const searchDocuments = async (query, searchMode = 'all', filters = {}, options = {}) => {
  try {
    console.log(`Searching for "${query}" in mode "${searchMode}" with filters:`, filters, 'options:', options);
    
    // Standard-Parameter mit überschreibbaren Optionen
    const defaultParams = {
      wt: 'json',
      rows: 20,
      ...options // Überschreibt Standard-Parameter
    };
    
    // Spezielle Behandlung für bereits formatierte Solr-Queries
    if (query.includes(':') && (query.includes('OR') || query.includes('AND') || query.includes('"') || query.includes('*'))) {
      // Dies ist bereits eine formatierte Solr-Query, verwende sie direkt
      return await solrClient.get('/documents/select', {
        params: {
          q: query,
          ...defaultParams
        }
      }).then(response => response.data.response);
    }
    
    // Bestimme, welches Feld durchsucht werden soll, basierend auf searchMode
    let queryParams;
    
    // Spezielle Behandlung für Wildcard-Suche
    const isWildcardQuery = query === '*' || query === '*:*' || query.trim() === '';
    
    if (searchMode === 'title') {
      queryParams = {
        q: isWildcardQuery ? 'titel:*' : `titel:(${query})`,
        ...defaultParams
      };
    } else if (searchMode === 'content') {
      queryParams = {
        q: isWildcardQuery ? 'text_content:*' : `text_content:(${query})`,
        ...defaultParams
      };
    } else if (searchMode === 'author') {
      queryParams = {
        q: isWildcardQuery ? 'author:*' : `author:"${query}" OR author:*${query}*`,
        ...defaultParams
      };
    } else if (searchMode === 'category') {
      queryParams = {
        q: isWildcardQuery ? 'category:*' : `category:"${query}" OR category:*${query}*`,
        ...defaultParams
      };
    } else if (searchMode === 'kurzue') {
      // Deutsche Rechtsdokument: Kurztitel
      queryParams = {
        q: isWildcardQuery ? 'kurzue:*' : `kurzue:(${query})`,
        ...defaultParams
      };
    } else if (searchMode === 'langue') {
      // Deutsche Rechtsdokument: Langtitel
      queryParams = {
        q: isWildcardQuery ? 'langue:*' : `langue:(${query})`,
        ...defaultParams
      };
    } else if (searchMode === 'jurabk') {
      // Deutsche Rechtsdokument: Juristische Abkürzung
      let jurabkQuery;
      if (isWildcardQuery) {
        jurabkQuery = 'jurabk:*';
      } else {
        // Direkte Phrase-Suche mit korrekter Kodierung
        jurabkQuery = `jurabk:"${query}"`;
      }
      queryParams = {
        q: jurabkQuery,
        ...defaultParams
      };
    } else if (searchMode === 'amtabk') {
      // Deutsche Rechtsdokument: Amtliche Abkürzung - erweiterte Suche in amtabk und jurabk
      // Grund: Kombiniere amtabk und jurabk Felder für bessere Suchergebnisse
      let amtabkQuery;
      if (isWildcardQuery) {
        amtabkQuery = 'amtabk:* OR jurabk:*';
      } else {
        // Kombiniere exakte und Wildcard-Suche für beide Felder
        const exactQuery = `(amtabk:"${query}" OR jurabk:"${query}")`;
        const wildcardQuery = `(amtabk:*${query}* OR jurabk:*${query}*)`;
        amtabkQuery = `${exactQuery} OR ${wildcardQuery}`;
      }
      console.log(`🔍 AMTABK DEBUG - Input query: "${query}"`);
      console.log(`🔍 AMTABK DEBUG - isWildcardQuery: ${isWildcardQuery}`);
      console.log(`🔍 AMTABK DEBUG - Final Solr query: "${amtabkQuery}"`);
      queryParams = {
        q: amtabkQuery,
        ...defaultParams
      };
    } else if (searchMode === 'text_content') {
      // Deutsche Rechtsdokument: Textinhalt
      queryParams = {
        q: isWildcardQuery ? 'text_content:*' : `text_content:(${query})`,
        ...defaultParams
      };
    } else {
      // Für allgemeine Suche
      if (isWildcardQuery) {
        queryParams = {
          q: '*:*',  // Alle Dokumente
          ...defaultParams
        };
      } else {
        // Für allgemeine Suche: Kombiniere exakte und Wildcard-Suche
        // Grund: Deutsche Rechtsabkürzungen benötigen sowohl exakte als auch Teilstring-Suche
        const exactQuery = `(kurzue:"${query}" OR langue:"${query}" OR amtabk:"${query}" OR jurabk:"${query}")`;
        const wildcardQuery = `(kurzue:*${query}* OR langue:*${query}* OR amtabk:*${query}* OR jurabk:*${query}* OR text_content:*${query}*)`;
        const combinedQuery = `${exactQuery} OR ${wildcardQuery}`;
        
        queryParams = {
          q: combinedQuery,
          ...defaultParams
        };
      }
    }
    
    // Füge vereinfachtes Highlighting hinzu (für alle Suchmodi)
    // Grund: Entferne "content" und "title" da diese Felder nicht im deutschen Rechts-Schema existieren
    queryParams.hl = 'true';
    queryParams['hl.fl'] = 'kurzue,langue,amtabk,jurabk,text_content,titel';
    queryParams['hl.simple.pre'] = '<mark>';
    queryParams['hl.simple.post'] = '</mark>';
    queryParams['hl.fragsize'] = 200;
    queryParams['hl.maxAnalyzedChars'] = 100000;
    queryParams['hl.snippets'] = 1;  // Reduzierte Snippets für Stabilität
    
    // Grund: Vereinfachtes Highlighting ohne komplexe Parameter für bessere Kompatibilität
    
    // Füge Filter-Queries hinzu
    const filterQueries = [];
    
    // Dynamische Filter-Verarbeitung für alle verfügbaren Felder
    Object.keys(filters).forEach(fieldName => {
      const filterValues = filters[fieldName];
      if (filterValues && filterValues.length > 0) {
        const fieldFilter = filterValues.map(value => `${fieldName}:"${value}"`).join(' OR ');
        filterQueries.push(`(${fieldFilter})`);
        console.log(`Added filter for ${fieldName}:`, filterValues);
      }
    });
    
    if (filters.dateRange) {
      // Datum-Range-Filter implementieren
      const { startDate, endDate } = filters.dateRange;
      if (startDate || endDate) {
        const start = startDate ? startDate : '*';
        const end = endDate ? endDate : '*';
        filterQueries.push(`created_date:[${start} TO ${end}]`);
      }
    }
    
    // Füge Filter-Queries hinzu
    if (filterQueries.length > 0) {
      queryParams.fq = filterQueries;
    }
    
    console.log('Query parameters:', queryParams);
    
    // Verwende URLSearchParams für korrekte Kodierung bei Filter-Queries
    let finalParams;
    if (queryParams.fq && Array.isArray(queryParams.fq)) {
      // Erstelle URL manuell für korrekte Serialisierung von Array-Parametern
      const baseParams = { ...queryParams };
      delete baseParams.fq;
      
      const searchParams = new URLSearchParams();
      
      // Füge base parameters hinzu mit korrekter Kodierung
      Object.keys(baseParams).forEach(key => {
        let value = baseParams[key];
        if (key === 'q') {
          // Spezielle Behandlung für Query-Parameter
          searchParams.append(key, value);
        } else {
          searchParams.append(key, value);
        }
      });
      
      // Füge Filter-Queries hinzu
      queryParams.fq.forEach(filter => {
        searchParams.append('fq', filter);
      });
      
      // Korrigiere die Kodierung für Phrase-Queries
      let urlString = searchParams.toString();
      urlString = urlString.replace(/q=([^&]*)/g, (match, queryPart) => {
        const decodedQuery = decodeURIComponent(queryPart);
        if (decodedQuery.includes('"')) {
          return `q=${encodeURIComponent(decodedQuery).replace(/\+/g, '%20')}`;
        }
        return match;
      });
      
      console.log('Final URL params:', urlString);
      console.log(`🌐 Making request to: documents/select?${urlString}`);
      
      const response = await solrClient.get(`documents/select?${urlString}`);
      
      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response numFound: ${response.data.response.numFound}`);
      if (response.data.response.numFound > 0) {
        console.log(`📊 First document fields:`, Object.keys(response.data.response.docs[0]));
        console.log(`📊 First document amtabk:`, response.data.response.docs[0].amtabk);
        console.log(`📊 First document jurabk:`, response.data.response.docs[0].jurabk);
      } else {
        console.log(`❌ No documents found for query`);
      }
      
      // Hole kontextuelle Facetten basierend auf den Suchparametern
      const contextualFacets = await getContextualFacets(query, searchMode, filters);
      
      // Verarbeite die Suchergebnisse
      const searchResults = processSearchResponse(response);
      
      // Gebe sowohl Suchergebnisse als auch kontextuelle Facetten zurück
      return {
        results: searchResults,
        facets: contextualFacets,
        total: response.data.response.numFound
      };
    } else {
      // Einfache Lösung: Verwende direkte Solr-Query ohne komplexe Parameter-Serialisierung
      console.log('Query params (no filters):', queryParams);
      console.log('Full query string to be sent:', queryParams.q);
      
      // Debug: Erstelle die finale URL zum Logging
      const baseUrl = getSolrBaseUrl() + 'documents/select';
      const urlParams = new URLSearchParams();
      Object.keys(queryParams).forEach(key => {
        urlParams.append(key, queryParams[key]);
      });
      console.log('Final request URL would be:', baseUrl + '?' + urlParams.toString());
      
      const response = await solrClient.get('documents/select', {
        params: queryParams,
        // Grund: Verwende benutzerdefinierten Parameter-Serializer für korrekte Query-Kodierung
        paramsSerializer: {
          encode: (param, key) => {
            // Für Query-Parameter: Verwende normale Kodierung aber ersetze + mit %20
            if (key === 'q') {
              return encodeURIComponent(param).replace(/\+/g, '%20');
            }
            return encodeURIComponent(param);
          }
        }
      });
      
      // Hole kontextuelle Facetten basierend auf den Suchparametern
      const contextualFacets = await getContextualFacets(query, searchMode, filters);
      
      // Debug: Logge die Rohantwort von Solr
      console.log('Solr response numFound:', response.data.response.numFound);
      console.log('Solr response docs length:', response.data.response.docs.length);
      if (response.data.response.docs.length > 0) {
        console.log('First document fields:', Object.keys(response.data.response.docs[0]));
      }
      
      // Verarbeite die Suchergebnisse
      const searchResults = processSearchResponse(response);
      
      // Gebe sowohl Suchergebnisse als auch kontextuelle Facetten zurück
      return {
        results: searchResults,
        facets: contextualFacets,
        total: response.data.response.numFound
      };
    }
  } catch (error) {
    console.error('Solr API Error:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request params:', error.config?.params);
    } else if (error.request) {
      console.error('No response received');
      console.error('Request details:', error.request);
    }
    throw error;
  }
};

function processSearchResponse(response) {
  const docs = response.data.response.docs;
  const responseHighlighting = response.data.highlighting || {};
  
  // Füge Highlighting zu den Dokumenten hinzu und normalisiere Array-Felder
  return docs.map(doc => {
    const docHighlights = responseHighlighting[doc.id] || {};
    
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
      
      // Falls mehrere Snippets vorhanden sind, zeige sie zusammen
      if (docHighlights.text_content.length > 1) {
        normalizedDoc.contentSnippets = docHighlights.text_content;
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
