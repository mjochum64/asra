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

export const searchDocuments = async (query, searchMode = 'all') => {
  try {
    console.log(`Searching for "${query}" in mode "${searchMode}"`);
    console.log(`Using Solr URL: ${getSolrBaseUrl()}`);
    
    // Temporär: Verwende die Mock-Suche für Tests, wenn die Solr-Verbindung problematisch ist
    // Kommentieren Sie diese Zeile aus, um die echte Solr-Verbindung zu verwenden
    // return mockSearch(query);
    
    // Bestimme, welches Feld durchsucht werden soll, basierend auf searchMode
    let queryField = '*'; // Standard: Alle Felder
    
    if (searchMode === 'title') {
      queryField = 'title';
    } else if (searchMode === 'content') {
      queryField = 'content';
    }
    
    // Baue die Solr-Query basierend auf dem Suchmodus
    let queryParams = {
      q: queryField === '*' ? query : `${queryField}:${query}`,
      wt: 'json',
      rows: 20,
      hl: 'true',  // Aktiviere Highlighting
      'hl.fl': 'title,content',  // Felder für Highlighting
      'hl.simple.pre': '<mark>',
      'hl.simple.post': '</mark>'
    };
    
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
