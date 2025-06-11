/**
 * Standard Solr Search Routes
 * Provides compatibility with existing frontend calls
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Configure Solr endpoint
const SOLR_ENDPOINT = process.env.SOLR_ENDPOINT || 'http://localhost:8983/solr/documents';

/**
 * GET /api/search - Standard Solr search with repealed document filtering
 * Query parameters:
 * - q: search query
 * - searchMode: search mode (all, kurzue, langue, etc.)
 * - rows: number of results to return
 * - start: starting position for pagination
 * - hl: enable highlighting
 * - facet: enable faceting
 */
router.get('/', async (req, res) => {
  try {
    const {
      q = '*:*',
      searchMode = 'all',
      rows = 20,
      start = 0,
      hl = 'true',
      facet = 'false',
      ...otherParams
    } = req.query;

    console.log(`[SEARCH] Query: "${q}", Mode: ${searchMode}, Rows: ${rows}`);

    // Build Solr query parameters
    const solrParams = {
      q: q,
      wt: 'json',
      rows: parseInt(rows),
      start: parseInt(start),
      hl: hl,
      'hl.fl': 'kurzue,langue,amtabk,jurabk,text_content,titel',
      'hl.simple.pre': '<mark>',
      'hl.simple.post': '</mark>',
      'hl.fragsize': 200,
      'hl.snippets': 1,
      ...otherParams
    };

    // Enable faceting if requested
    if (facet === 'true') {
      solrParams.facet = 'true';
      solrParams['facet.field'] = ['jurabk', 'amtabk', 'document_type', 'norm_type'];
      solrParams['facet.mincount'] = 1;
      solrParams['facet.limit'] = 50;
    }

    // Use URLSearchParams to properly handle multiple fq parameters
    const params = new URLSearchParams();
    Object.keys(solrParams).forEach(key => {
      if (Array.isArray(solrParams[key])) {
        solrParams[key].forEach(value => params.append(key, value));
      } else {
        params.append(key, solrParams[key]);
      }
    });
    
    // Add filter queries for excluding weggefallene/repealed and BJNG documents
    // (Qdrant uses Index-Time filtering, but Backend API makes direct Solr requests)
    params.append('fq', '-norm_type:repealed');           // Exclude repealed documents
    params.append('fq', '-titel:"(weggefallen)"');        // Exclude documents with "(weggefallen)" in title
    params.append('fq', '-text_content:"(weggefallen)"'); // Exclude documents with "(weggefallen)" in content
    params.append('fq', '-id:*BJNG*');                    // Exclude BJNG (structural/outline) documents

    // Debug: Log the actual parameters being sent to Solr
    console.log(`[SEARCH DEBUG] URLSearchParams being sent:`, params.toString());
    console.log(`[SEARCH DEBUG] Full Solr URL: ${SOLR_ENDPOINT}/select`);

    // Make request to Solr using URLSearchParams
    const solrResponse = await axios.get(`${SOLR_ENDPOINT}/select?${params.toString()}`, {
      timeout: 10000
    });

    // Log search results
    const numFound = solrResponse.data.response?.numFound || 0;
    console.log(`[SEARCH] Found ${numFound} results for query "${q}"`);

    // Return response in expected format
    res.json({
      results: solrResponse.data.response || {},
      highlighting: solrResponse.data.highlighting || {},
      facets: solrResponse.data.facet_counts || {},
      total: numFound,
      params: {
        q,
        searchMode,
        rows: parseInt(rows),
        start: parseInt(start)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SEARCH] Error:', error.message);
    
    // Handle different types of errors
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: true,
        message: 'Solr service is not available',
        code: 'SOLR_UNAVAILABLE'
      });
    }

    if (error.response?.status === 400) {
      return res.status(400).json({
        error: true,
        message: 'Invalid search query',
        details: error.response.data,
        code: 'INVALID_QUERY'
      });
    }

    res.status(500).json({
      error: true,
      message: 'Internal search error',
      code: 'SEARCH_ERROR'
    });
  }
});

/**
 * POST /api/search - Search with request body (for complex queries)
 */
router.post('/', async (req, res) => {
  try {
    const {
      query: q = '*:*',
      searchMode = 'all',
      rows = 20,
      start = 0,
      filters = {},
      highlighting = true,
      faceting = false
    } = req.body;

    console.log(`[SEARCH POST] Query: "${q}", Mode: ${searchMode}`);

    // Build filter queries
    const filterQueries = [];
    
    // Filter weggefallene/repealed und BJNG Dokumente für direkte Solr-Anfragen
    // (Qdrant verwendet Index-Time-Filterung, aber Backend API macht direkte Solr-Anfragen)
    filterQueries.push('-norm_type:repealed');           // Exclude repealed documents
    filterQueries.push('-titel:"(weggefallen)"');        // Exclude documents with "(weggefallen)" in title
    filterQueries.push('-text_content:"(weggefallen)"'); // Exclude documents with "(weggefallen)" in content
    filterQueries.push('-id:*BJNG*');                    // Exclude BJNG (structural/outline) documents

    // Add dynamic filters
    Object.keys(filters).forEach(fieldName => {
      const filterValues = filters[fieldName];
      if (filterValues && filterValues.length > 0) {
        const fieldFilter = filterValues.map(value => `${fieldName}:"${value}"`).join(' OR ');
        filterQueries.push(`(${fieldFilter})`);
      }
    });

    // Build Solr parameters
    const solrParams = {
      q: q,
      wt: 'json',
      rows: parseInt(rows),
      start: parseInt(start),
      fq: filterQueries
    };

    // Add highlighting if enabled
    if (highlighting) {
      solrParams.hl = 'true';
      solrParams['hl.fl'] = 'kurzue,langue,amtabk,jurabk,text_content,titel';
      solrParams['hl.simple.pre'] = '<mark>';
      solrParams['hl.simple.post'] = '</mark>';
      solrParams['hl.fragsize'] = 200;
    }

    // Add faceting if enabled
    if (faceting) {
      solrParams.facet = 'true';
      solrParams['facet.field'] = ['jurabk', 'amtabk', 'document_type', 'norm_type'];
      solrParams['facet.mincount'] = 1;
      solrParams['facet.limit'] = 50;
    }

    // Debug: Log the actual parameters being sent to Solr
    console.log(`[SEARCH POST DEBUG] Solr params being sent:`, JSON.stringify(solrParams, null, 2));
    console.log(`[SEARCH POST DEBUG] Full Solr URL: ${SOLR_ENDPOINT}/select`);

    // Make request to Solr
    const solrResponse = await axios.get(`${SOLR_ENDPOINT}/select`, {
      params: solrParams,
      timeout: 10000
    });

    const numFound = solrResponse.data.response?.numFound || 0;
    console.log(`[SEARCH POST] Found ${numFound} results`);

    res.json({
      results: solrResponse.data.response || {},
      highlighting: solrResponse.data.highlighting || {},
      facets: solrResponse.data.facet_counts || {},
      total: numFound,
      params: {
        query: q,
        searchMode,
        rows: parseInt(rows),
        start: parseInt(start),
        filtersApplied: Object.keys(filters).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[SEARCH POST] Error:', error.message);
    
    res.status(500).json({
      error: true,
      message: 'Search failed',
      code: 'SEARCH_ERROR'
    });
  }
});

module.exports = router;
