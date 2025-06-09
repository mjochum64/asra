/**
 * Formatiert Feldwerte basierend auf der Konfiguration
 */
export const formatFieldValue = (value, format) => {
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
};
