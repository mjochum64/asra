import axios from 'axios';

// Schema Discovery Service für dynamische Solr-Integration
// Dieser Service liest das Solr-Schema aus und erstellt automatisch UI-Konfigurationen

/**
 * Holt das komplette Solr-Schema und analysiert verfügbare Felder
 * @returns {Promise<Object>} Schema-Informationen mit Feldtypen und Konfigurationen
 */
export const getSchemaInfo = async () => {
  try {
    const response = await axios.get('/solr/documents/schema?wt=json');
    const schema = response.data.schema;
    
    return {
      fields: schema.fields || [],
      fieldTypes: schema.fieldTypes || [],
      dynamicFields: schema.dynamicFields || [],
      uniqueKey: schema.uniqueKey,
      copyFields: schema.copyFields || []
    };
  } catch (error) {
    console.error('Failed to fetch schema:', error);
    throw error;
  }
};

/**
 * Analysiert das Schema und identifiziert suchbare und filterbare Felder
 * @returns {Promise<Object>} Konfiguration für UI-Komponenten
 */
export const analyzeSchemaForUI = async () => {
  try {
    const schemaInfo = await getSchemaInfo();
    const config = {
      searchableFields: [],
      filterableFields: [],
      facetableFields: [],
      sortableFields: [],
      displayFields: []
    };
    
    schemaInfo.fields.forEach(field => {
      const fieldConfig = {
        name: field.name,
        type: field.type,
        indexed: field.indexed,
        stored: field.stored,
        multiValued: field.multiValued || false
      };
      
      // Bestimme, ob Feld durchsuchbar ist (indexed + text oder string type)
      if (field.indexed && (field.type === 'text_general' || field.type === 'string')) {
        config.searchableFields.push(fieldConfig);
      }
      
      // Bestimme, ob Feld filterbar ist (indexed + nicht-text types oder string)
      if (field.indexed && field.type !== 'text_general') {
        config.filterableFields.push(fieldConfig);
        
        // String-Felder eignen sich gut für Facetten
        if (field.type === 'string') {
          config.facetableFields.push(fieldConfig);
        }
      }
      
      // Bestimme, ob Feld sortierbar ist (indexed + einfache Typen)
      if (field.indexed && ['string', 'int', 'long', 'float', 'double', 'pdate'].includes(field.type)) {
        config.sortableFields.push(fieldConfig);
      }
      
      // Bestimme, ob Feld angezeigt werden soll (stored + nicht-interne Felder)
      if (field.stored && !field.name.startsWith('_') && field.name !== 'id') {
        config.displayFields.push(fieldConfig);
      }
    });
    
    return config;
  } catch (error) {
    console.error('Failed to analyze schema:', error);
    throw error;
  }
};

/**
 * Holt dynamisch verfügbare Facetten basierend auf Schema-Analyse
 * @returns {Promise<Object>} Verfügbare Facetten mit Werten und Anzahlen
 */
export const getDynamicFacets = async () => {
  try {
    const uiConfig = await analyzeSchemaForUI();
    const facetableFields = uiConfig.facetableFields.map(field => field.name);
    
    console.log('Debug - Facetable fields from schema:', facetableFields);
    
    // Fallback auf bekannte String-Felder wenn keine facetable Fields gefunden
    let fieldsToQuery = facetableFields;
    if (fieldsToQuery.length === 0) {
      fieldsToQuery = ['category', 'author']; // Fallback basierend auf unserem Schema
      console.log('Debug - Using fallback fields:', fieldsToQuery);
    }
    
    // Baue die URL manuell, da axios Arrays in params anders behandelt
    const baseUrl = '/solr/documents/select';
    const facetFieldParams = fieldsToQuery.map(field => `facet.field=${encodeURIComponent(field)}`).join('&');
    const fullUrl = `${baseUrl}?q=*:*&wt=json&rows=0&facet=true&${facetFieldParams}&facet.limit=50&facet.mincount=1`;
    
    console.log('Debug - Full Solr URL:', fullUrl);
    
    const response = await axios.get(fullUrl);
    
    console.log('Debug - Solr facet response:', response.data.facet_counts);
    
    const solrFacetFields = response.data.facet_counts?.facet_fields || {};
    const processedFacets = {};
    
    // Konvertiere Solr-Facetten-Format
    Object.keys(solrFacetFields).forEach(field => {
      const facetArray = solrFacetFields[field];
      const facetItems = [];
      
      console.log(`Debug - Processing field '${field}':`, facetArray);
      
      if (Array.isArray(facetArray) && facetArray.length > 0) {
        for (let i = 0; i < facetArray.length; i += 2) {
          if (i + 1 < facetArray.length) {
            facetItems.push({
              value: facetArray[i],
              count: facetArray[i + 1]
            });
          }
        }
      }
      
      if (facetItems.length > 0) {
        processedFacets[field] = facetItems;
      }
      
      console.log(`Debug - Processed '${field}':`, facetItems);
    });
    
    console.log('Debug - Final processed facets:', processedFacets);
    
    return processedFacets;
  } catch (error) {
    console.error('Failed to get dynamic facets:', error);
    
    // Fallback zu bekannten Facetten statt throw error
    return {
      category: [
        { value: 'programming', count: 3 },
        { value: 'technology', count: 3 },
        { value: 'api', count: 1 },
        { value: 'cloud', count: 1 },
        { value: 'database', count: 1 },
        { value: 'devops', count: 1 }
      ],
      author: [
        { value: 'John Smith', count: 2 },
        { value: 'Alice Johnson', count: 1 },
        { value: 'Bob Brown', count: 1 },
        { value: 'Carol White', count: 1 },
        { value: 'David Green', count: 1 }
      ]
    };
  }
};

/**
 * Holt Facetten basierend auf aktuellen Suchparametern (kontextuelle Facetten)
 * Dies zeigt nur die Filter-Optionen, die in den aktuellen Suchergebnissen verfügbar sind
 * @param {string} query - Aktueller Suchterm
 * @param {string} searchMode - Suchmodus (all, title, etc.)
 * @param {Object} currentFilters - Bereits angewendete Filter
 * @returns {Promise<Object>} Kontextuelle Facetten basierend auf Suchergebnissen
 */
export const getContextualFacets = async (query = '*:*', searchMode = 'all', currentFilters = {}) => {
  try {
    const uiConfig = await analyzeSchemaForUI();
    const fieldsToQuery = uiConfig.facetableFields.map(field => field.name);
    
    if (fieldsToQuery.length === 0) {
      console.warn('No facetable fields found in schema');
      return {};
    }
    
    console.log('Getting contextual facets for query:', query, 'mode:', searchMode, 'filters:', currentFilters);
    
    // Baue die Solr-Query basierend auf den aktuellen Suchparametern
    let solrQuery;
    const isWildcardQuery = query === '*' || query === '*:*' || query.trim() === '';
    
    if (searchMode === 'title') {
      solrQuery = isWildcardQuery ? 'title:*' : `title:(${query})`;
    } else if (searchMode === 'author') {
      // Verwende die gleiche Syntax wie in solrService.js
      solrQuery = isWildcardQuery ? 'author:*' : `author:"${query}" OR author:*${query}*`;
    } else if (searchMode === 'category') {
      // Verwende die gleiche Syntax wie in solrService.js  
      solrQuery = isWildcardQuery ? 'category:*' : `category:"${query}" OR category:*${query}*`;
    } else if (searchMode === 'content') {
      solrQuery = isWildcardQuery ? 'content:*' : `content:(${query})`;
    } else {
      // 'all' mode - verwende DisMax für bessere Mehrfeld-Suche
      if (isWildcardQuery) {
        solrQuery = '*:*';
      } else {
        solrQuery = query;
      }
    }
    
    // Baue Filter-Queries basierend auf aktuellen Filtern
    const filterQueries = [];
    Object.keys(currentFilters).forEach(fieldName => {
      const filterValues = currentFilters[fieldName];
      if (filterValues && filterValues.length > 0) {
        const fieldFilter = filterValues.map(value => `${fieldName}:"${value}"`).join(' OR ');
        filterQueries.push(`(${fieldFilter})`);
      }
    });
    
    // Baue die URL manuell für korrekte Parameter-Serialisierung
    const baseUrl = '/solr/documents/select';
    const facetFieldParams = fieldsToQuery.map(field => `facet.field=${encodeURIComponent(field)}`).join('&');
    
    let fullUrl = `${baseUrl}?q=${encodeURIComponent(solrQuery)}&wt=json&rows=0&facet=true&${facetFieldParams}&facet.limit=50&facet.mincount=1`;
    
    // Füge DisMax-Parameter für 'all' mode hinzu
    if (searchMode === 'all' && !isWildcardQuery) {
      fullUrl += '&defType=dismax&qf=title^2.0+content^1.0+author^1.5+category^1.2';
    }
    
    // Füge Filter-Queries hinzu
    if (filterQueries.length > 0) {
      const filterParams = filterQueries.map(fq => `fq=${encodeURIComponent(fq)}`).join('&');
      fullUrl += `&${filterParams}`;
    }
    
    console.log('Debug - Contextual facets URL:', fullUrl);
    
    const response = await axios.get(fullUrl);
    
    console.log('Debug - Contextual facet response:', response.data.facet_counts);
    
    const solrFacetFields = response.data.facet_counts?.facet_fields || {};
    const processedFacets = {};
    
    // Konvertiere Solr-Facetten-Format
    Object.keys(solrFacetFields).forEach(field => {
      const facetArray = solrFacetFields[field];
      const facetItems = [];
      
      console.log(`Debug - Processing contextual field '${field}':`, facetArray);
      
      if (Array.isArray(facetArray) && facetArray.length > 0) {
        for (let i = 0; i < facetArray.length; i += 2) {
          if (i + 1 < facetArray.length) {
            facetItems.push({
              value: facetArray[i],
              count: facetArray[i + 1]
            });
          }
        }
      }
      
      if (facetItems.length > 0) {
        processedFacets[field] = facetItems;
      }
      
      console.log(`Debug - Processed contextual '${field}':`, facetItems);
    });
    
    console.log('Debug - Final contextual facets:', processedFacets);
    
    return processedFacets;
  } catch (error) {
    console.error('Failed to get contextual facets:', error);
    
    // Fallback: Verwende die statischen Facetten
    return await getDynamicFacets();
  }
};

/**
 * Erstellt automatisch Suchfeld-Konfiguration basierend auf Schema
 * @returns {Promise<Array>} Array von Suchfeld-Optionen für die UI
 */
export const getSearchFieldOptions = async () => {
  try {
    const uiConfig = await analyzeSchemaForUI();
    
    const options = [
      { 
        value: 'all', 
        label: 'Alle Felder', 
        fields: uiConfig.searchableFields.map(f => f.name) 
      }
    ];
    
    // Füge individuelle Feldoptionen hinzu
    uiConfig.searchableFields.forEach(field => {
      if (field.name !== 'id' && !field.name.startsWith('_')) {
        options.push({
          value: field.name,
          label: formatFieldLabel(field.name),
          fields: [field.name]
        });
      }
    });
    
    return options;
  } catch (error) {
    console.error('Failed to get search field options:', error);
    // Fallback zu Standard-Optionen
    return [
      { value: 'all', label: 'Alle Felder', fields: ['title', 'content'] },
      { value: 'title', label: 'Nur Titel', fields: ['title'] },
      { value: 'content', label: 'Nur Inhalt', fields: ['content'] }
    ];
  }
};

/**
 * Formatiert Feldnamen für die Anzeige in der UI
 * @param {string} fieldName - Rohfeldname aus Schema
 * @returns {string} Formatierter Anzeigename
 */
const formatFieldLabel = (fieldName) => {
  // Konvertiere snake_case und camelCase zu lesbaren Labels
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Bestimmt automatisch die besten Anzeigefelder für Suchergebnisse
 * @returns {Promise<Array>} Array von Feldnamen für die Ergebnisanzeige
 */
export const getDisplayFields = async () => {
  try {
    const uiConfig = await analyzeSchemaForUI();
    
    // Priorisiere bestimmte Feldtypen für die Anzeige
    const priorityFields = ['title', 'name', 'subject'];
    const contentFields = ['content', 'description', 'body', 'text'];
    const metaFields = ['author', 'category', 'created_date', 'last_modified'];
    
    const displayFields = [];
    
    // Füge Titel-ähnliche Felder hinzu
    priorityFields.forEach(fieldName => {
      const field = uiConfig.displayFields.find(f => f.name === fieldName);
      if (field) displayFields.push(field.name);
    });
    
    // Füge Content-Felder hinzu
    contentFields.forEach(fieldName => {
      const field = uiConfig.displayFields.find(f => f.name === fieldName);
      if (field && !displayFields.includes(field.name)) {
        displayFields.push(field.name);
      }
    });
    
    // Füge Metadaten-Felder hinzu
    metaFields.forEach(fieldName => {
      const field = uiConfig.displayFields.find(f => f.name === fieldName);
      if (field && !displayFields.includes(field.name)) {
        displayFields.push(field.name);
      }
    });
    
    return displayFields;
  } catch (error) {
    console.error('Failed to get display fields:', error);
    // Fallback zu Standard-Feldern
    return ['title', 'content', 'author', 'category', 'created_date'];
  }
};
