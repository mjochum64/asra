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
  
  // In der Entwicklung können wir die Umgebungsvariable verwenden (falls gesetzt)
  if (import.meta.env.VITE_SOLR_URL) {
    return import.meta.env.VITE_SOLR_URL;
  }
  
  // Fallback für lokale Entwicklung
  return 'http://localhost:8983/solr/';
};

const solrClient = axios.create({
  baseURL: getSolrBaseUrl(),
  timeout: 10000,
});

export const searchDocuments = async (query) => {
  try {
    const response = await solrClient.get('documents/select', {
      params: {
        q: query,
        wt: 'json',
        rows: 10
      }
    });
    return response.data.response.docs;
  } catch (error) {
    console.error('Solr API Error:', error);
    throw error;
  }
};

// Mock API for testing without real Solr connection
export const mockSearch = (query) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', title: `Mock Result for "${query}"`, content: 'Sample document content...' },
        { id: '2', title: `Another Mock Result`, content: 'Additional sample content...' }
      ]);
    }, 500);
  });
};
