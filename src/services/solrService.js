import axios from 'axios';

const solrClient = axios.create({
  baseURL: 'http://solar.saaro.net:8983/solr/',
  timeout: 10000,
});

export const searchDocuments = async (query) => {
  try {
    const response = await solrClient.get('select', {
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
