/**
 * UI-Konfiguration für ASRA
 * Definiert welche Solr-Felder in welchen UI-Bereichen verwendet werden
 * 
 * Struktur:
 * - SUCHE: Felder die in der Suchoberfläche angeboten werden
 * - TREFFERLISTE: Felder die in den Suchergebnissen angezeigt werden
 * - VOLLTEXT: Felder die in der Dokumentenansicht verfügbar sind
 * - HYBRID_SEARCH: Konfiguration für die hybride Suche (Solr + Qdrant)
 */

export const uiConfig = {
  
  /**
   * HYBRID_SEARCH - Konfiguration für die hybride Suche
   * Kombiniert Solr (keyword) und Qdrant (semantic) Suchergebnisse
   */
  hybridSearch: {
    // Verfügbare Such-Engines
    engines: [
      {
        id: 'keyword',
        name: 'Solr (Klassisch)',
        description: 'Klassische Volltextsuche nach Schlüsselwörtern',
        icon: '🔍',
        default: true
      },
      {
        id: 'semantic',
        name: 'Qdrant (Semantisch)',
        description: 'Semantische Suche nach Bedeutung mit Vektorembeddings',
        icon: '🧠'
      },
      {
        id: 'hybrid',
        name: 'Hybrid',
        description: 'Kombinierte Suche aus klassischer und semantischer Suche',
        icon: '⚡'
      }
    ],
    
    // Standardgewichtungen für die hybride Suche
    defaultWeights: {
      keyword: 0.7,  // Solr Gewichtung
      semantic: 0.3  // Qdrant Gewichtung
    }
  },
  
  /**
   * SUCHE - Suchfelder für normale Benutzer
   * Reduziert auf die wichtigsten, benutzerfreundlichen Optionen
   */
  search: {
    // Standard-Suchmodi für normale Benutzer
    modes: [
      {
        id: 'text_content',
        label: 'Volltext',
        description: 'Durchsucht den gesamten Dokumentinhalt',
        icon: '📄',
        primary: true  // Volltext als Standard
      },
      {
        id: 'all',
        label: 'Wichtige Felder',
        description: 'Durchsucht Titel, Inhalt und deutsche Rechtsfelder',
        icon: '🔍'
      },
      {
        id: 'amtabk',
        label: 'Amtliche Abkürzung',
        description: 'z.B. "1. BImSchV", "GG", "BGB"',
        icon: '⚖️'
      }
    ],
    
    // Erweiterte Suchmodi für Expertenansicht
    expertModes: [
      {
        id: 'langue',
        label: 'Langtitel',
        description: 'Vollständige Gesetzestittel',
        solrField: 'langue'
      },
      {
        id: 'content_paragraphs',
        label: 'Absätze',
        description: 'Dokumentenabsätze',
        solrField: 'content_paragraphs'
      },
      {
        id: 'fundstelle_dokst',
        label: 'Fundstelle',
        description: 'Rechtliche Fundstellen',
        solrField: 'fundstelle_dokst'
      }
    ]
  },

  /**
   * TREFFERLISTE - Felder für Suchergebnis-Anzeige
   * Definiert welche Informationen in der Ergebnisliste angezeigt werden
   */
  results: {
    // Primäre Felder - immer angezeigt
    primary: [
      {
        solrField: 'kurzue',
        label: 'Kurztitel',
        highlight: true,
        maxLength: 120,
        priority: 1,
        fallbackFields: ['langue', 'amtabk', 'jurabk'] // Fallback wenn kurzue fehlt
      },
      {
        solrField: 'enbez',
        label: 'Norm',
        highlight: true,
        display: 'norm-badge', // spezielle Norm-Anzeige
        priority: 1.5 // zwischen Titel und Abkürzung
      },
      {
        solrField: 'amtabk', 
        label: 'Abkürzung',
        highlight: true,
        display: 'badge', // als Badge anzeigen
        priority: 2
      },
      {
        solrField: 'text_content',
        label: 'Auszug',
        highlight: true,
        maxLength: 200,
        fallback: 'content', // Fallback-Feld wenn leer
        priority: 3
      }
    ],

    // Sekundäre Felder - optional angezeigt
    secondary: [
      {
        solrField: 'langue',
        label: 'Vollständiger Titel',
        highlight: true,
        maxLength: 180,
        showCondition: 'different_from_kurzue' // nur zeigen wenn anders als Kurztitel
      },
      {
        solrField: 'norm_type',
        label: 'Norm-Typ',
        highlight: false,
        display: 'small-badge',
        format: 'capitalize'
      },
      {
        solrField: 'jurabk',
        label: 'Juristische Abkürzung',
        highlight: false,
        display: 'small'
      },
      {
        solrField: 'ausfertigung_datum',
        label: 'Datum',
        highlight: false,
        format: 'date',
        display: 'meta'
      }
    ],

    // Metadaten - in kleiner Schrift/Farbe
    metadata: [
      {
        solrField: 'parent_document_id',
        label: 'Quelle',
        format: 'document-link'
      },
      {
        solrField: 'document_type',
        label: 'Typ',
        format: 'capitalize'
      },
      {
        solrField: 'norm_doknr',
        label: 'Norm-ID',
        format: 'truncate'
      },
      {
        solrField: 'xml_lang',
        label: 'Sprache',
        format: 'language'
      },
      {
        solrField: 'id',
        label: 'ID',
        display: 'technical' // nur für Entwickler
      }
    ]
  },

  /**
   * VOLLTEXT - Felder für Dokumenten-Vollansicht
   * Definiert wie das komplette Dokument angezeigt wird
   */
  fulltext: {
    // Header-Bereich
    header: [
      {
        solrField: 'enbez',
        label: 'Norm-Bezeichnung',
        style: 'badge-primary',
        condition: 'if_exists'
      },
      {
        solrField: 'kurzue',
        label: 'Kurztitel',
        style: 'title',
        size: 'large'
      },
      {
        solrField: 'langue', 
        label: 'Vollständiger Titel',
        style: 'subtitle',
        condition: 'if_different_from_kurzue'
      },
      {
        solrField: 'amtabk',
        label: 'Amtliche Abkürzung',
        style: 'badge-primary'
      },
      {
        solrField: 'jurabk',
        label: 'Juristische Abkürzung', 
        style: 'badge-secondary'
      },
      {
        solrField: 'norm_type',
        label: 'Norm-Typ',
        style: 'badge-secondary',
        format: 'capitalize',
        condition: 'if_exists'
      }
    ],

    // Hauptinhalt
    content: [
      {
        solrField: 'text_content',
        label: 'Volltext',
        style: 'main-content',
        highlight: true,
        searchable: true, // ermöglicht Suche im Text
        preferHtmlField: true // bevorzuge text_content_html falls vorhanden
      },
      {
        solrField: 'fussnoten_content_html',
        label: 'Fußnoten (formatiert)',
        style: 'structured-content',
        highlight: false,
        searchable: false,
        condition: 'if_exists'
      },
      {
        solrField: 'table_content',
        label: 'Tabellen',
        style: 'structured-content',
        format: 'table',
        condition: 'if_exists'
      }
    ],

    // Sidebar-Informationen
    sidebar: [
      {
        section: 'Rechtliche Informationen',
        fields: [
          {
            solrField: 'fundstelle_periodikum',
            label: 'Fundstelle (Periodikum)',
            format: 'array'
          },
          {
            solrField: 'fundstelle_zitstelle', 
            label: 'Zitstelle',
            format: 'array'
          },
          {
            solrField: 'ausfertigung_datum',
            label: 'Ausfertigung',
            format: 'date'
          }
        ]
      },
      {
        section: 'Verweise und Kommentare',
        fields: [
          {
            solrField: 'standangabe_kommentar',
            label: 'Standangaben',
            format: 'array'
          },
          {
            solrField: 'fussnoten_content',
            label: 'Fußnoten',
            format: 'text',
            condition: 'if_exists'
          }
        ]
      },
      {
        section: 'Norm-Informationen',
        fields: [
          {
            solrField: 'parent_document_id',
            label: 'Quelle',
            format: 'text',
            style: 'technical'
          },
          {
            solrField: 'norm_doknr',
            label: 'Norm-Nummer',
            format: 'text',
            style: 'technical'
          },
          {
            solrField: 'norm_builddate',
            label: 'Norm-Erstellung',
            format: 'date',
            style: 'technical'
          }
        ]
      },
      {
        section: 'Technische Daten',
        fields: [
          {
            solrField: 'builddate',
            label: 'Indexiert am',
            format: 'datetime'
          },
          {
            solrField: 'xml_lang',
            label: 'Dokumentsprache',
            format: 'language'
          },
          {
            solrField: 'id',
            label: 'Dokument-ID',
            style: 'technical'
          }
        ]
      }
    ]
  },

  /**
   * FILTER - Konfiguration für Facetten-Filter
   * Definiert welche Filter angeboten werden
   */
  filters: {
    enabled: [
      {
        solrField: 'xml_lang',
        label: 'Sprache',
        icon: '🌐',
        priority: 1
      },
      {
        solrField: 'jurabk',
        label: 'Juristische Abkürzung', 
        icon: '⚖️',
        priority: 2,
        limit: 15 // maximal 15 Optionen anzeigen
      },
      {
        solrField: 'document_type',
        label: 'Dokumenttyp',
        icon: '📋',
        priority: 3
      }
    ],

    // Erweiterte Filter für Expertenansicht
    expert: [
      {
        solrField: 'text_format',
        label: 'Textformat',
        icon: '🔧',
        priority: 1
      }
      // Auskommentiert: Filter ohne Daten in Demo-Dokumenten
      /*
      {
        solrField: 'gliederungskennzahl',
        label: 'Gliederungskennzahl',
        icon: '🔢'
      },
      {
        solrField: 'enbez',
        label: 'Einzelnorm-Bezeichnung',
        icon: '📖'
      },
      {
        solrField: 'standangabe_typ',
        label: 'Standangabe-Typ',
        icon: '📅'
      }
      */
    ]
  },

  /**
   * UI-Modi - Schaltet zwischen Normal- und Expertenansicht
   */
  modes: {
    normal: {
      title: 'Normale Suche',
      description: 'Vereinfachte Suche für allgemeine Benutzer',
      enabledSections: ['search.modes', 'results.primary', 'results.secondary', 'filters.enabled']
    },
    expert: {
      title: 'Expertensuche',
      description: 'Vollzugriff auf alle Solr-Felder',
      enabledSections: ['search.modes', 'search.expertModes', 'results.primary', 'results.secondary', 'results.metadata', 'filters.enabled', 'filters.expert']
    }
  }
};

/**
 * Helper-Funktionen für UI-Konfiguration
 */
export const uiHelpers = {
  
  /**
   * Holt die Suchfelder basierend auf dem UI-Modus
   */
  getSearchFields(mode = 'normal') {
    const config = uiConfig.modes[mode];
    const sections = config.enabledSections;
    
    let fields = [];
    
    if (sections.includes('search.modes')) {
      fields.push(...uiConfig.search.modes);
    }
    
    if (sections.includes('search.expertModes')) {
      fields.push(...uiConfig.search.expertModes);
    }
    
    return fields;
  },

  /**
   * Holt die Ergebnis-Felder basierend auf dem UI-Modus
   */
  getResultFields(mode = 'normal') {
    const config = uiConfig.modes[mode];
    const sections = config.enabledSections;
    
    let fields = { primary: [], secondary: [], metadata: [] };
    
    if (sections.includes('results.primary')) {
      fields.primary = uiConfig.results.primary;
    }
    
    if (sections.includes('results.secondary')) {
      fields.secondary = uiConfig.results.secondary;
    }
    
    if (sections.includes('results.metadata')) {
      fields.metadata = uiConfig.results.metadata;
    }
    
    return fields;
  },

  /**
   * Holt die verfügbaren Filter basierend auf dem UI-Modus
   */
  getFilterFields(mode = 'normal') {
    const config = uiConfig.modes[mode];
    const sections = config.enabledSections;
    
    let filters = [];
    
    if (sections.includes('filters.enabled')) {
      filters.push(...uiConfig.filters.enabled);
    }
    
    if (sections.includes('filters.expert')) {
      filters.push(...uiConfig.filters.expert);
    }
    
    return filters.sort((a, b) => (a.priority || 999) - (b.priority || 999));
  },

  // formatFieldValue moved to src/utils/formatUtils.js

  /**
   * Holt den Wert für ein Feld mit Fallback-Unterstützung
   */
  getFieldValue(document, fieldConfig) {
    // Versuche zuerst das primäre Feld
    let value = document[fieldConfig.solrField];
    
    if (value) {
      return {
        value: Array.isArray(value) ? value[0] : value,
        sourceField: fieldConfig.solrField,
        label: fieldConfig.label
      };
    }
    
    // Fallback-Felder versuchen
    if (fieldConfig.fallbackFields) {
      for (const fallbackField of fieldConfig.fallbackFields) {
        const fallbackValue = document[fallbackField];
        if (fallbackValue) {
          return {
            value: Array.isArray(fallbackValue) ? fallbackValue[0] : fallbackValue,
            sourceField: fallbackField,
            label: this.getFieldLabel(fallbackField) // Still uses local getFieldLabel
          };
        }
      }
    }
    
    return null;
  },

  /**
   * Holt das Label für ein Solr-Feld
   */
  getFieldLabel(fieldName) {
    const labels = {
      kurzue: 'Kurztitel',
      langue: 'Vollständiger Titel',
      amtabk: 'Amtliche Abkürzung',
      jurabk: 'Juristische Abkürzung',
      text_content: 'Inhalt',
      document_type: 'Dokumenttyp',
      xml_lang: 'Sprache'
    };
    
    return labels[fieldName] || fieldName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // isFrameworkDocument moved to src/utils/documentUtils.js
  // getDocumentType moved to src/utils/documentUtils.js
  // getFrameworkId moved to src/utils/documentUtils.js
  // getDocumentTypeLabel moved to src/utils/documentUtils.js
};

// API configuration
export const apiBase = '/api'; // Always use the Nginx proxy path

export default uiConfig;
