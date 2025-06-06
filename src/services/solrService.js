import axios from 'axios';
import { getContextualFacets } from './schemaService';

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

export const searchDocuments = async (query, searchMode = 'all', filters = {}) => {
  try {
    console.log(`Searching for "${query}" in mode "${searchMode}" with filters:`, filters);
    
    // Bestimme, welches Feld durchsucht werden soll, basierend auf searchMode
    let queryParams;
    
    // Spezielle Behandlung für Wildcard-Suche
    const isWildcardQuery = query === '*' || query === '*:*' || query.trim() === '';
    
    if (searchMode === 'title') {
      queryParams = {
        q: isWildcardQuery ? 'title:*' : `title:(${query})`,
        wt: 'json',
        rows: 20
      };
    } else if (searchMode === 'content') {
      queryParams = {
        q: isWildcardQuery ? 'content:*' : `content:(${query})`,
        wt: 'json',
        rows: 20
      };
    } else if (searchMode === 'author') {
      queryParams = {
        q: isWildcardQuery ? 'author:*' : `author:"${query}" OR author:*${query}*`,
        wt: 'json',
        rows: 20
      };
    } else if (searchMode === 'category') {
      queryParams = {
        q: isWildcardQuery ? 'category:*' : `category:"${query}" OR category:*${query}*`,
        wt: 'json',
        rows: 20
      };
    } else {
      // Für allgemeine Suche
      if (isWildcardQuery) {
        queryParams = {
          q: '*:*',  // Alle Dokumente
          wt: 'json',
          rows: 20
        };
      } else {
        // DisMax Query Parser für bessere Relevanz
        queryParams = {
          q: query,
          wt: 'json',
          rows: 20,
          defType: 'dismax',
          qf: 'title^2 content author category',  // Query Fields mit Boosting
          mm: '1'  // Minimum Should Match
        };
      }
    }
    
    // Füge Highlighting hinzu (für alle Suchmodi)
    queryParams.hl = 'true';
    queryParams['hl.fl'] = 'title,content';
    queryParams['hl.simple.pre'] = '<mark>';
    queryParams['hl.simple.post'] = '</mark>';
    queryParams['hl.fragsize'] = 200;
    queryParams['hl.maxAnalyzedChars'] = 1000000;
    queryParams['hl.snippets'] = 3;  // Mehr Snippets für bessere Highlighting-Abdeckung
    
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
      
      const searchParams = new URLSearchParams(baseParams);
      queryParams.fq.forEach(filter => {
        searchParams.append('fq', filter);
      });
      
      console.log('Final URL params:', searchParams.toString());
      
      const response = await solrClient.get(`documents/select?${searchParams.toString()}`);
      
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
      const response = await solrClient.get('documents/select', {
        params: queryParams
      });
      
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
    }
  } catch (error) {
    console.error('Solr API Error:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received');
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
      title: Array.isArray(doc.title) ? doc.title[0] : doc.title,
      content: Array.isArray(doc.content) ? doc.content[0] : doc.content,
      category: Array.isArray(doc.category) ? doc.category[0] : doc.category,
      author: Array.isArray(doc.author) ? doc.author[0] : doc.author,
      created_date: Array.isArray(doc.created_date) ? doc.created_date[0] : doc.created_date,
      last_modified: Array.isArray(doc.last_modified) ? doc.last_modified[0] : doc.last_modified
    };
    
    // Ersetze Inhalte mit hervorgehobenem Text, falls verfügbar
    if (docHighlights.title && docHighlights.title.length > 0) {
      normalizedDoc.title = docHighlights.title[0];
    }
    
    if (docHighlights.content && docHighlights.content.length > 0) {
      // Verwende das erste und beste Highlight-Snippet für content
      normalizedDoc.content = docHighlights.content[0];
      
      // Falls mehrere Snippets vorhanden sind, zeige sie zusammen
      if (docHighlights.content.length > 1) {
        normalizedDoc.contentSnippets = docHighlights.content;
      }
    }
    
    return normalizedDoc;
  });
}

// Mock API for testing without real Solr connection
export const mockSearch = (query) => {
  const currentDate = new Date().toISOString();
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString();
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { 
          id: 'mock1', 
          title: `<mark>${query}</mark> - Erster Mock-Ergebnis-Titel`, 
          content: `Dies ist der Inhalt des ersten Mock-Dokuments über <mark>${query}</mark>. Es enthält alle notwendigen Informationen.`,
          category: 'technologie',
          author: 'John Smith',
          created_date: yesterdayDate,
          last_modified: currentDate
        },
        { 
          id: 'mock2', 
          title: `Zweiter Mock-Ergebnis-Titel zu <mark>${query}</mark>`, 
          content: `Ein weiteres Dokument mit Informationen über <mark>${query}</mark> und verwandten Themen.`,
          category: 'programmierung',
          author: 'Jane Doe',
          created_date: yesterdayDate,
          last_modified: currentDate
        },
        { 
          id: 'mock3', 
          title: `<mark>${query}</mark> Anwendungsfälle`, 
          content: `Verschiedene Anwendungsfälle für <mark>${query}</mark> in unterschiedlichen Kontexten.`,
          category: 'devops',
          author: 'David Green',
          created_date: yesterdayDate,
          last_modified: currentDate
        },
        { 
          id: 'mock4', 
          title: `Einführung in <mark>${query}</mark>`, 
          content: `Eine ausführliche Einführung in <mark>${query}</mark> für Anfänger und Fortgeschrittene.`,
          category: 'api',
          author: 'Emma Black',
          created_date: yesterdayDate,
          last_modified: currentDate
        },
        { 
          id: 'mock5', 
          title: `Fortgeschrittene <mark>${query}</mark> Techniken`, 
          content: `Dieses Dokument beschreibt fortgeschrittene Techniken für <mark>${query}</mark> in professionellen Umgebungen.`,
          category: 'datenbank',
          author: 'Carol White',
          created_date: yesterdayDate,
          last_modified: currentDate
        },
        { 
          id: 'mock6', 
          title: `<mark>${query}</mark> Dokumentation`, 
          content: `Die vollständige Dokumentation für <mark>${query}</mark> mit Beispielen und Anleitungen.`,
          category: 'cloud',
          author: 'Frank Gray',
          created_date: yesterdayDate,
          last_modified: currentDate
        },
        { 
          id: 'mock7', 
          title: `<mark>${query}</mark> in der Praxis`, 
          content: `Praktische Anwendungsfälle für <mark>${query}</mark> in realen Projekten.`,
          category: 'technologie',
          author: 'Grace Lee',
          created_date: yesterdayDate,
          last_modified: currentDate
        }
      ]);
    }, 800); // Etwas längere Verzögerung für realistischere Suche
  });
};

/**
 * Mock-Suche mit Filter-Unterstützung
 * @param {string} query - Suchbegriff
 * @param {Object} filters - Filter-Objekt mit categories und authors
 * @returns {Promise<Array>} Gefilterte Mock-Suchergebnisse
 */
export const mockSearchWithFilters = (query, filters = {}) => {
  const currentDate = new Date().toISOString();
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString();
  
  // Alle Mock-Dokumente (angepasst an echte Solr-Daten)
  const allDocs = [
    { 
      id: 'mock1', 
      title: `Introduction to Apache <mark>${query}</mark>`, 
      content: `Apache Solr is an open-source search platform built on Apache Lucene. <mark>${query}</mark> provides powerful search capabilities.`,
      category: 'technology',  // Englisch wie in Solr
      author: 'John Smith',
      created_date: yesterdayDate,
      last_modified: currentDate
    },
    { 
      id: 'mock2', 
      title: `Machine Learning Basics with <mark>${query}</mark>`, 
      content: `Machine learning is a method of data analysis that automates analytical model building using <mark>${query}</mark>.`,
      category: 'technology',  // Englisch wie in Solr
      author: 'Jane Doe',
      created_date: yesterdayDate,
      last_modified: currentDate
    },
    { 
      id: 'mock3', 
      title: `Python Programming Guide for <mark>${query}</mark>`, 
      content: `Python is an interpreted, high-level, general-purpose programming language perfect for <mark>${query}</mark>.`,
      category: 'programming',  // Englisch wie in Solr
      author: 'John Smith',
      created_date: yesterdayDate,
      last_modified: currentDate
    },
    { 
      id: 'mock4', 
      title: `Data Structures and Algorithms in <mark>${query}</mark>`, 
      content: `A data structure is a particular way of organizing data in a computer for <mark>${query}</mark> applications.`,
      category: 'programming',
      author: 'Alice Johnson',
      created_date: yesterdayDate,
      last_modified: currentDate
    },
    { 
      id: 'mock5', 
      title: `Web Development with JavaScript and <mark>${query}</mark>`, 
      content: `JavaScript is a programming language used to create dynamic content for websites with <mark>${query}</mark>.`,
      category: 'programming',
      author: 'Bob Brown',
      created_date: yesterdayDate,
      last_modified: currentDate
    }
  ];
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Filter anwenden
      let filteredDocs = allDocs;
      
      // Kategorie-Filter
      if (filters.categories && filters.categories.length > 0) {
        filteredDocs = filteredDocs.filter(doc => 
          filters.categories.includes(doc.category)
        );
      }
      
      // Autor-Filter  
      if (filters.authors && filters.authors.length > 0) {
        filteredDocs = filteredDocs.filter(doc => 
          filters.authors.includes(doc.author)
        );
      }
      
      resolve(filteredDocs);
    }, 800);
  });
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
 * Mock-Facetten für Tests ohne echte Solr-Verbindung
 * Angepasst an die echten Solr-Kategorienamen (englisch)
 * @returns {Promise<Object>} Mock-Facetten-Daten
 */
export const mockGetFacets = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Facetten verwenden jetzt englische Kategorienamen wie in echten Solr-Daten
      const facetData = {
        category: [
          { value: 'technology', count: 2 },       // Entspricht den Solr-Daten
          { value: 'programming', count: 3 },      // Entspricht den Solr-Daten
          { value: 'devops', count: 1 },          // Mock-spezifisch
          { value: 'api', count: 1 },             // Mock-spezifisch
          { value: 'database', count: 1 },        // Mock-spezifisch (englisch)
          { value: 'cloud', count: 1 }            // Mock-spezifisch
        ],
        author: [
          { value: 'John Smith', count: 2 },       // Entspricht Solr-Daten
          { value: 'Jane Doe', count: 1 },         // Entspricht Solr-Daten
          { value: 'Alice Johnson', count: 1 },    // Entspricht Solr-Daten
          { value: 'Bob Brown', count: 1 },        // Entspricht Solr-Daten
          { value: 'David Green', count: 1 },      // Mock-spezifisch
          { value: 'Emma Black', count: 1 },       // Mock-spezifisch
          { value: 'Carol White', count: 1 }       // Mock-spezifisch
        ]
      };
      resolve(facetData);
    }, 500);
  });
};
