// Helper function to build German legal abbreviation queries
// Grund: Wildcard queries with spaces fail in Solr, so we split them into compound AND queries
// This version is based on the schemaService.js definition, which handles multi-term wildcards.
export const buildGermanLegalQuery = (fieldName, query, isWildcard = false) => {
  if (!query || query.trim() === '') {
    return `${fieldName}:*`;
  }

  // If the query contains spaces and we're doing a wildcard search,
  // split it into separate terms and combine with AND
  if (isWildcard && query.includes(' ')) {
    const terms = query.trim().split(/\s+/);
    const wildcardTerms = terms.map(term => `${fieldName}:*${term}*`);
    return wildcardTerms.join(' AND ');
  }

  // For exact match or simple wildcard (no spaces)
  if (isWildcard) {
    return `${fieldName}:*${query}*`;
  } else {
    // Prefer exact search for non-wildcard queries or queries with dots
    // (dots often indicate specific abbreviations that need exact match)
    return `${fieldName}:"${query}"`;
  }
};
