/**
 * UI-Konfiguration für ASRA
 * Definiert welche Solr-Felder in welchen UI-Bereichen verwendet werden
 * 
 * Struktur:
 * - SUCHE: Felder die in der Suchoberfläche angeboten werden
 * - TREFFERLISTE: Felder die in den Suchergebnissen angezeigt werden
 * - VOLLTEXT: Felder die in der Dokumentenansicht verfügbar sind
 */

export const uiConfig = {
  
  /**
   * SUCHE - Suchfelder für normale Benutzer
   * Reduziert auf die wichtigsten, benutzerfreundlichen Optionen
   */
  search: {
    // Standard-Suchmodi für normale Benutzer
    modes: [
      {
        id: 'all',
        label: 'Alle Felder',
        description: 'Durchsucht Titel, Inhalt und deutsche Rechtsfelder',
        icon: '🔍',
        primary: true
      },
      {
        id: 'text_content',
        label: 'Volltext',
        description: 'Durchsucht den gesamten Dokumentinhalt',
        icon: '📄'
      },
      {
        id: 'kurzue',
        label: 'Kurztitel',
        description: 'Suche in deutschen Rechtsdokument-Kurztiteln',
        icon: '📋'
      },
      {
        id: 'amtabk',
        label: 'Amtliche Abkürzung',
        description: 'z.B. "1. BImSchV", "GG", "BGB"',
        icon: '⚖️'
      },
      {
        id: 'jurabk',
        label: 'Juristische Abkürzung', 
        description: 'Juristische Kurznamen für Gesetze',
        icon: '📚'
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
        priority: 1
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
        solrField: 'document_type',
        label: 'Typ',
        format: 'capitalize'
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
      }
    ],

    // Hauptinhalt
    content: [
      {
        solrField: 'text_content',
        label: 'Volltext',
        style: 'main-content',
        highlight: true,
        searchable: true // ermöglicht Suche im Text
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
        solrField: 'document_type',
        label: 'Dokumenttyp',
        icon: '📋',
        priority: 1
      },
      {
        solrField: 'xml_lang',
        label: 'Sprache', 
        icon: '🌐',
        priority: 2,
        format: 'language'
      },
      {
        solrField: 'fundstelle_periodikum',
        label: 'Fundstelle',
        icon: '📚',
        priority: 3,
        limit: 10 // maximal 10 Optionen anzeigen
      }
    ],

    // Erweiterte Filter für Expertenansicht
    expert: [
      {
        solrField: 'text_format',
        label: 'Textformat',
        icon: '🔧'
      },
      {
        solrField: 'ausfertigung_datum_manuell',
        label: 'Manuelle Datierung',
        icon: '✋',
        type: 'boolean'
      }
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

  /**
   * Formatiert Feldwerte basierend auf der Konfiguration
   */
  formatFieldValue(value, format) {
    if (!value) return '';
    
    switch (format) {
      case 'date':
        return new Date(value).toLocaleDateString('de-DE');
      case 'datetime':
        return new Date(value).toLocaleString('de-DE');
      case 'language':
        return value === 'de' ? 'Deutsch' : value.toUpperCase();
      case 'capitalize':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'table':
        // Spezielle Formatierung für Tabellendaten
        return Array.isArray(value) ? value.join('\n') : value;
      default:
        return value;
    }
  }
};

export default uiConfig;
