/**
 * Erkennt ob es sich um ein Rahmendokument handelt (z.B. BJNR000010949)
 */
export const isFrameworkDocument = (documentId) => {
  if (!documentId) return false;
  // Rahmendokumente haben nur die Basis-BJNR-Kennung ohne BJNE/BJNG-Suffix
  return documentId.startsWith('BJNR') && !documentId.includes('BJNE') && !documentId.includes('BJNG');
};

/**
 * Erkennt Einzelnormen (BJNE) vs. Gliederungseinheiten (BJNG)
 * Note: This function uses isFrameworkDocument internally.
 */
export const getDocumentType = (documentId) => {
  if (!documentId) return 'unknown';

  if (isFrameworkDocument(documentId)) {
    return 'framework'; // Rahmendokument (ganzes Gesetz)
  } else if (documentId.includes('BJNE')) {
    return 'norm'; // Einzelnorm (Artikel, Paragraph)
  } else if (documentId.includes('BJNG')) {
    return 'section'; // Gliederungseinheit (Abschnitt, Kapitel)
  }

  return 'unknown';
};

/**
 * Extrahiert die Basis-BJNR-Kennung aus einer Dokument-ID
 */
export const getFrameworkId = (documentId) => {
  if (!documentId) return null;

  // Finde die Position des ersten BJNE oder BJNG
  const bjnePos = documentId.indexOf('BJNE');
  const bjngPos = documentId.indexOf('BJNG');

  let cutPos = documentId.length;
  if (bjnePos !== -1) cutPos = Math.min(cutPos, bjnePos);
  if (bjngPos !== -1) cutPos = Math.min(cutPos, bjngPos);

  return documentId.substring(0, cutPos);
};

/**
 * Generiert eine benutzerfreundliche Anzeige für Dokument-Typen
 * Note: This function uses getDocumentType internally.
 */
export const getDocumentTypeLabel = (documentId) => {
  const type = getDocumentType(documentId); // Use the local getDocumentType
  switch (type) {
    case 'framework': return '📋 Gesetz';
    case 'norm': return '📄 Artikel/Paragraph';
    case 'section': return '📂 Gliederung';
    default: return '📄 Dokument';
  }
};
