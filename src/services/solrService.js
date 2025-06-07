import axios from 'axios';

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
    console.log(`Using Solr URL: ${getSolrBaseUrl()}`);
    
    // DEBUG: Log the incoming filters
    console.log('DEBUG - Received filters:', JSON.stringify(filters, null, 2));
    
    // Bestimme, welches Feld durchsucht werden soll, basierend auf searchMode
    let queryField = '*'; // Standard: Alle Felder
    
    if (searchMode === 'title') {
      queryField = 'title';
    } else if (searchMode === 'content') {
      queryField = 'content';
    }
    
    // Baue die Solr-Query basierend auf dem Suchmodus
    let baseQuery = queryField === '*' ? query : `${queryField}:${query}`;
    
    // Füge Filter hinzu
    const filterQueries = [];
    if (filters.categories && filters.categories.length > 0) {
      const categoryFilter = filters.categories.map(cat => `category:"${cat}"`).join(' OR ');
      filterQueries.push(`(${categoryFilter})`);
      console.log('DEBUG - Added category filter:', `(${categoryFilter})`);
    }
    
    if (filters.authors && filters.authors.length > 0) {
      const authorFilter = filters.authors.map(author => `author:"${author}"`).join(' OR ');
      filterQueries.push(`(${authorFilter})`);
      console.log('DEBUG - Added author filter:', `(${authorFilter})`);
    }
    
    if (filters.dateRange) {
      // Datum-Range-Filter implementieren
      const { startDate, endDate } = filters.dateRange;
      if (startDate || endDate) {
        const start = startDate ? startDate : '*';
        const end = endDate ? endDate : '*';
        filterQueries.push(`created_date:[${start} TO ${end}]`);
        console.log('DEBUG - Added date filter:', `created_date:[${start} TO ${end}]`);
      }
    }
    
    console.log('DEBUG - All filter queries:', filterQueries);
    
    let queryParams = {
      q: baseQuery,
      wt: 'json',
      rows: 20,
      hl: 'true',  // Aktiviere Highlighting
      'hl.fl': 'title,content',  // Felder für Highlighting
      'hl.simple.pre': '<mark>',
      'hl.simple.post': '</mark>'
    };
    
    // Füge Filter-Queries hinzu
    if (filterQueries.length > 0) {
      queryParams.fq = filterQueries;
    }
    
    console.log('Query parameters:', queryParams);
    
    const response = await solrClient.get('documents/select', {
      params: queryParams
    });
    
    console.log('Solr response:', response.data);
    
    // Verarbeite Highlighting-Informationen (falls vorhanden)
    const docs = response.data.response.docs;
    const highlighting = response.data.highlighting || {};
    
    // Füge Highlighting zu den Dokumenten hinzu, falls verfügbar
    return docs.map(doc => {
      const docHighlights = highlighting[doc.id] || {};
      
      // Ersetze Inhalte mit hervorgehobenem Text, falls verfügbar
      if (docHighlights.title && docHighlights.title.length > 0) {
        doc.title = docHighlights.title[0];
      }
      
      if (docHighlights.content && docHighlights.content.length > 0) {
        doc.content = docHighlights.content[0];
      }
      
      return doc;
    });
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
  
  // Alle Mock-Dokumente
  const allDocs = [
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
    console.log('Fetching facets for fields:', facetFields);
    
    const queryParams = {
      q: '*:*',  // Alle Dokumente
      wt: 'json',
      rows: 0,   // Keine Dokumente zurückgeben, nur Facetten
      facet: 'true',
      'facet.field': facetFields,
      'facet.limit': 50,  // Maximal 50 Facetten pro Feld
      'facet.mincount': 1  // Nur Facetten mit mindestens 1 Dokument
    };
    
    console.log('Facet query parameters:', queryParams);
    
    const response = await solrClient.get('documents/select', {
      params: queryParams
    });
    
    console.log('Facets response:', response.data);
    
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
 * @returns {Promise<Object>} Mock-Facetten-Daten
 */
export const mockGetFacets = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Facetten-Counts sollten mit den tatsächlichen Mock-Dokumenten übereinstimmen
      const facetData = {
        category: [
          { value: 'technologie', count: 2 },      // mock1, mock7
          { value: 'programmierung', count: 1 },   // mock2
          { value: 'devops', count: 1 },           // mock3
          { value: 'api', count: 1 },              // mock4
          { value: 'datenbank', count: 1 },        // mock5
          { value: 'cloud', count: 1 }             // mock6
        ],
        author: [
          { value: 'John Smith', count: 1 },       // mock1
          { value: 'Jane Doe', count: 1 },         // mock2
          { value: 'David Green', count: 1 },      // mock3
          { value: 'Emma Black', count: 1 },       // mock4
          { value: 'Carol White', count: 1 },      // mock5
          { value: 'Frank Gray', count: 1 },       // mock6
          { value: 'Grace Lee', count: 1 }         // mock7
        ]
      };
      resolve(facetData);
    }, 500);
  });
};
