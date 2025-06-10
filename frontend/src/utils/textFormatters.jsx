import React from 'react'; // Added React import for JSX in new functions

// Grund: Hilfsfunktion um bevorzugt HTML-Felder zu verwenden
export const getContentForExport = (document, contentType = 'text') => {
  // Bevorzuge HTML-Felder wenn verfügbar
  if (contentType === 'text' && document.text_content_html) {
    return document.text_content_html;
  }
  if (contentType === 'fussnoten' && document.fussnoten_content_html) {
    return document.fussnoten_content_html;
  }

  // Fallback auf Textfelder mit manueller Formatierung
  if (contentType === 'text' && document.text_content) {
    return formatLegalTextForHTML(document.text_content);
  }

  return '';
};

// Formatiere Gesetzestext für HTML-Export (nur als Fallback)
export const formatLegalTextForHTML = (text) => {
  if (!text) return '';

  // Entferne HTML-Tags falls vorhanden
  let cleanText = text.replace(/<[^>]*>/g, '');

  // Erkenne numerierte Absätze: (1), (2), (3) etc. oder 1., 2., 3. etc.
  // Auch römische Ziffern: I., II., III. oder (I), (II), (III)
  const paragraphPatterns = [
    /(\(\d+\))/g,           // (1), (2), (3)
    /(\d+\.)/g,             // 1., 2., 3.
    /(\([IVX]+\))/g,        // (I), (II), (III), (IV), (V)
    /([IVX]+\.)/g,          // I., II., III., IV., V.
    /(\([a-z]\))/g,         // (a), (b), (c)
    /([a-z]\.)/g            // a., b., c.
  ];

  // Erstelle Absätze vor jedem nummerierten Absatz
  paragraphPatterns.forEach(pattern => {
    cleanText = cleanText.replace(pattern, '\n\n$1');
  });

  // Entferne mehrfache Zeilenwechsel und normalisiere
  cleanText = cleanText
    .replace(/\n{3,}/g, '\n\n')  // Maximal 2 Zeilenwechsel
    .replace(/^\n+/, '')          // Entferne führende Zeilenwechsel
    .trim();

  // Konvertiere zu HTML mit <p> Tags
  const paragraphs = cleanText.split('\n\n').filter(p => p.trim());
  return paragraphs.map(p => `<p style="margin-bottom: 1rem; line-height: 1.6;">${p.trim()}</p>`).join('');
};

// Grund: Hilfsfunktion um HTML-Content intelligent für PDF zu konvertieren
export const getContentForPDF = (document, contentType = 'text') => {
  let content = '';

  // Bevorzuge HTML-Felder wenn verfügbar
  if (contentType === 'text' && document.text_content_html) {
    content = document.text_content_html;
  } else if (contentType === 'fussnoten' && document.fussnoten_content_html) {
    content = document.fussnoten_content_html;
  } else if (contentType === 'text' && document.text_content) {
    // Fallback auf Textfelder
    content = document.text_content;
  }

  if (!content) return [];

  // Intelligente HTML zu Text Konvertierung für PDF
  let processedText = content
    // Konvertiere <p> Tags zu Absätzen
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    // Konvertiere <br> Tags zu Zeilenwechseln
    .replace(/<br\s*\/?>/gi, '\n')
    // Konvertiere Listenelemente
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    // Entferne alle anderen HTML-Tags
    .replace(/<[^>]*>/g, '')
    // Dekodiere HTML-Entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // Normalisiere Leerzeichen
    .replace(/[ \t]+/g, ' ')
    // Bereinige Zeilenwechsel
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  // Teile in Absätze auf
  let paragraphs = processedText.split(/\n\s*\n/);

  // Bereinige und filtere leere Absätze
  return paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0);
};

// Formatiere Gesetzestext für PDF-Export (nur als Fallback)
export const formatLegalTextForPDF = (text) => {
  if (!text) return [];

  // Entferne HTML-Tags falls vorhanden
  let cleanText = text.replace(/<[^>]*>/g, '');

  // Erkenne numerierte Absätze: (1), (2), (3) etc. oder 1., 2., 3. etc.
  // Auch römische Ziffern: I., II., III. oder (I), (II), (III)
  const paragraphPatterns = [
    /(\(\d+\))/g,           // (1), (2), (3)
    /(\d+\.)/g,             // 1., 2., 3.
    /(\([IVX]+\))/g,        // (I), (II), (III), (IV), (V)
    /([IVX]+\.)/g,          // I., II., III., IV., V.
    /(\([a-z]\))/g,         // (a), (b), (c)
    /([a-z]\.)/g            // a., b., c.
  ];

  // Erstelle Absätze vor jedem nummerierten Absatz
  paragraphPatterns.forEach(pattern => {
    cleanText = cleanText.replace(pattern, '\n\n$1');
  });

  // Entferne mehrfache Zeilenwechsel und normalisiere
  cleanText = cleanText
    .replace(/\n{3,}/g, '\n\n')  // Maximal 2 Zeilenwechsel
    .replace(/^\n+/, '')          // Entferne führende Zeilenwechsel
    .trim();

  // Konvertiere zu Array von Absätzen für PDF
  return cleanText.split('\n\n').filter(p => p.trim()).map(p => p.trim());
};

/**
 * Hilfsfunktion zum Hervorheben von Suchbegriffen in Text
 */
export const highlightSearchTerms = (text, searchQuery) => {
  if (!text || !searchQuery) return text;

  // Entferne bereits vorhandene <mark> Tags, um Doppelmarkierungen zu vermeiden
  const cleanText = text.replace(/<\/?mark[^>]*>/gi, '');

  // Splittet den Suchbegriff an Leerzeichen und behandelt jeden Begriff separat
  const terms = searchQuery.split(/\s+/).filter(term => term.length > 1);

  let highlightedText = cleanText;

  terms.forEach(term => {
    // Escape special regex characters
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Case-insensitive search with word boundaries
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  });

  return highlightedText;
};

/**
 * Hilfsfunktion zum Kürzen von Text
 */
export const truncateText = (text, maxLength = null) => {
  if (!text) return '';
  if (!maxLength) return text;

  if (text.length <= maxLength) return text;

  // Kürze bei Wortgrenze, nicht mitten im Wort
  const truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
};

// Grund: Hilfsfunktion um bevorzugt HTML-Felder zu verwenden (für DocumentFullView)
export const getContentForDisplay = (document, fieldType = 'text_content') => {
  // Bevorzuge HTML-Felder wenn verfügbar
  const htmlField = fieldType + '_html';
  
  // Prüfe explizit auf XHTML-Content in den _html Feldern
  if (document[htmlField]) {
    // Falls HTML-Content verfügbar ist, verwende ihn direkt
    return (
      <div
        className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: document[htmlField] }}
      />
    );
  }

  // Fallback auf Textfelder mit manueller Formatierung
  if (document[fieldType]) {
    return formatLegalTextAsFallback(document[fieldType]);
  }

  return null;
};

// Grund: Fallback-Formatierung nur wenn keine HTML-Felder verfügbar sind (für DocumentFullView)
export const formatLegalTextAsFallback = (text) => {
  if (!text) return '';

  // Entferne HTML-Tags falls vorhanden
  let cleanText = text.replace(/<[^>]*>/g, '');

  // Erkenne numerierte Absätze: (1), (2), (3) etc. oder 1., 2., 3. etc.
  // Auch römische Ziffern: I., II., III. oder (I), (II), (III)
  const paragraphPatterns = [
    /(\(\d+\))/g,           // (1), (2), (3)
    /(\d+\.)/g,             // 1., 2., 3.
    /(\([IVX]+\))/g,        // (I), (II), (III), (IV), (V)
    /([IVX]+\.)/g,          // I., II., III., IV., V.
    /(\([a-z]\))/g,         // (a), (b), (c)
    /([a-z]\.)/g            // a., b., c.
  ];

  // Erstelle Absätze vor jedem nummerierten Absatz
  paragraphPatterns.forEach(pattern => {
    cleanText = cleanText.replace(pattern, '\n\n$1');
  });

  // Entferne mehrfache Zeilenwechsel und normalisiere
  cleanText = cleanText
    .replace(/\n{3,}/g, '\n\n')  // Maximal 2 Zeilenwechsel
    .replace(/^\n+/, '')          // Entferne führende Zeilenwechsel
    .trim();

  // Konvertiere zu JSX mit <p> Tags
  const paragraphs = cleanText.split('\n\n').filter(p => p.trim());

  return paragraphs.map((paragraph, index) => (
    <p key={index} className="mb-4 leading-relaxed">
      {paragraph.trim()}
    </p>
  ));
};
