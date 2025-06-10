/**
 * Entfernt HTML-Tags und Highlighting aus einem Wert
 */
export const cleanHtmlTags = (value) => {
  if (!value) return '';
  if (typeof value !== 'string') return value;
  
  // Entferne <mark> und andere HTML-Tags
  return value.replace(/<[^>]*>/g, '');
};

/**
 * Formatiert Feldwerte basierend auf der Konfiguration
 */
export const formatFieldValue = (value, format, options = {}) => {
  if (!value) return '';

  // Standardmäßig HTML-Tags entfernen, außer explizit gewünscht
  const cleanValue = options.preserveHtml ? value : cleanHtmlTags(value);

  switch (format) {
    case 'date':
      return new Date(cleanValue).toLocaleDateString('de-DE');
    case 'datetime':
      return new Date(cleanValue).toLocaleString('de-DE');
    case 'language':
      return cleanValue === 'de' ? 'Deutsch' : cleanValue.toUpperCase();
    case 'capitalize':
      return cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1);
    case 'array':
      return Array.isArray(value) ? value.map(v => cleanHtmlTags(v)).join(', ') : cleanValue;
    case 'table':
      // Spezielle Formatierung für Tabellendaten
      return Array.isArray(value) ? value.map(v => cleanHtmlTags(v)).join('\n') : cleanValue;
    default:
      return cleanValue;
  }
};
