// Grund: Generiere aussagekräftige Dateinamen basierend auf Dokument-Informationen
export const generateFilename = (framework, extension) => {
    let filename = 'dokument';

    if (framework?.id) {
      // Verwende Dokument-ID als Basis
      filename = framework.id;

      // Falls ein Kurztitel vorhanden ist, füge ihn hinzu
      if (framework.kurzue) {
        const cleanTitle = framework.kurzue
          .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '') // Entferne Sonderzeichen
          .replace(/\s+/g, '_') // Leerzeichen zu Unterstrichen
          .substring(0, 50); // Begrenzen auf 50 Zeichen

        filename = `${framework.id}_${cleanTitle}`;
      }
    } else if (framework?.kurzue) {
      // Fallback: Nur Kurztitel wenn keine ID verfügbar
      filename = framework.kurzue
        .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
    }

    return `${filename}.${extension}`;
  };

export const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    // Grund: Verwende window.document um Namenskonflikt mit React-Prop zu vermeiden
    const link = window.document.createElement('a');
    link.href = url;
    link.download = filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
