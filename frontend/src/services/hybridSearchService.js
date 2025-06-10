/**
 * Service for hybrid search operations combining Solr and Qdrant results
 */
import { apiBase } from '../config/uiConfig';

/**
 * API service for hybrid search functionality
 */
class HybridSearchService {
  /**
   * Base URL for hybrid search API
   * @type {string}
   */
  baseUrl = `${apiBase}/hybrid`;

  /**
   * Default weights for combining results
   * @type {Object}
   */
  defaultWeights = { keyword: 0.5, semantic: 0.5 };

  /**
   * Performs a hybrid search combining keyword and semantic results
   * 
   * @param {string} query - The search query
   * @param {Object} options - Search options
   * @param {number} options.start - Starting offset for pagination
   * @param {number} options.rows - Number of results per page
   * @param {Object} options.weights - Weights for keyword vs semantic (values 0-1)
   * @param {boolean} options.showScores - Whether to include scoring details in results
   * @returns {Promise<Object>} - Search results with combined ranking
   */
  async search(query, options = {}) {
    try {
      const {
        start = 0,
        rows = 10,
        weights = this.defaultWeights,
        showScores = false
      } = options;

      // Build query parameters
      const params = new URLSearchParams({
        q: query,
        start,
        rows,
        keyword_weight: weights.keyword || this.defaultWeights.keyword,
        semantic_weight: weights.semantic || this.defaultWeights.semantic,
        include_scores: showScores
      });

      // Perform the search request
      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Hybrid search failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Hybrid search error:', error);
      // Fall back to empty results with error info
      return {
        error: true,
        message: error.message,
        numFound: 0,
        docs: []
      };
    }
  }
}

export default new HybridSearchService();
