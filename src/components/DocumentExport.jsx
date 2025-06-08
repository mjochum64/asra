import React, { useState } from 'react';
import { searchDocuments } from '../services/solrService';
import { uiHelpers } from '../config/uiConfig';

/**
 * DocumentExport Component - Export-Funktionen für Rahmendokumente
 * Ermöglicht Export als PDF oder HTML mit allen Untergliederungen
 */
export default function DocumentExport({ document, frameworkId }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('html');

  const handleExport = async (format) => {
    setIsExporting(true);
    setExportFormat(format);

    try {
      // Lade alle Unterdokumente des Rahmendokuments
      const query = frameworkId ? 
        `parent_document_id:"${frameworkId}" OR id:${frameworkId}*` :
        `id:"${document.id}"`;
        
      const response = await searchDocuments(query, 'all', {});

      if (response?.docs) {
        if (format === 'html') {
          await exportAsHTML(response.docs);
        } else if (format === 'pdf') {
          await exportAsPDF(response.docs);
        }
      }
    } catch (error) {
      console.error('Export-Fehler:', error);
      alert('Export fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsHTML = async (docs) => {
    const framework = docs.find(doc => uiHelpers.isFrameworkDocument(doc.id));
    const sections = docs.filter(doc => uiHelpers.getDocumentType(doc.id) === 'section');
    const norms = docs.filter(doc => uiHelpers.getDocumentType(doc.id) === 'norm');

    let htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${framework?.kurzue || 'Rechtsdokument'}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .metadata {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
        }
        .toc {
            background: #f5f5f5;
            padding: 15px;
            margin-bottom: 30px;
            border-radius: 5px;
        }
        .toc h2 {
            margin-top: 0;
            color: #333;
        }
        .toc ul {
            list-style-type: none;
            padding-left: 0;
        }
        .toc li {
            margin: 5px 0;
        }
        .toc a {
            color: #0066cc;
            text-decoration: none;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        .section {
            margin: 30px 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .norm {
            margin: 20px 0;
            padding: 15px;
            border-left: 3px solid #0066cc;
            background: #fafafa;
        }
        .norm-title {
            font-size: 16px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 10px;
        }
        .norm-content {
            line-height: 1.8;
        }
        .norm-content p {
            margin: 10px 0;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        @media print {
            body { font-size: 12pt; }
            .toc { break-after: page; }
            .section { break-before: auto; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${framework?.kurzue || 'Rechtsdokument'}</div>
        ${framework?.langue ? `<div class="metadata">${framework.langue}</div>` : ''}
        <div class="metadata">
            Dokument-ID: ${framework?.id || document.id} | 
            Exportiert am: ${new Date().toLocaleDateString('de-DE')}
        </div>
    </div>

    <div class="toc">
        <h2>Inhaltsverzeichnis</h2>
        <ul>
`;

    // Generiere Inhaltsverzeichnis
    sections.forEach(section => {
      htmlContent += `            <li><a href="#section-${section.id}">${section.enbez || 'Gliederungseinheit'}</a></li>\n`;
    });

    norms.forEach(norm => {
      if (!sections.some(section => norm.id.startsWith(section.id))) {
        htmlContent += `            <li><a href="#norm-${norm.id}">${norm.enbez || 'Norm'}</a></li>\n`;
      }
    });

    htmlContent += `
        </ul>
    </div>

    <div class="content">
`;

    // Generiere Hauptinhalt
    sections.forEach(section => {
      htmlContent += `
        <div class="section">
            <h2 id="section-${section.id}" class="section-title">${section.enbez || 'Gliederungseinheit'}</h2>
`;

      // Untergliederungen dieser Sektion
      const sectionNorms = norms.filter(norm => norm.id.startsWith(section.id));
      sectionNorms.forEach(norm => {
        htmlContent += `
            <div id="norm-${norm.id}" class="norm">
                <div class="norm-title">${norm.enbez || 'Norm'}</div>
                <div class="norm-content">
                    ${norm.text_content_html || norm.text_content || ''}
                </div>
            </div>
`;
      });

      htmlContent += `        </div>\n`;
    });

    // Direkte Normen (ohne übergeordnete Sektion)
    const orphanNorms = norms.filter(norm => 
      !sections.some(section => norm.id.startsWith(section.id))
    );

    orphanNorms.forEach(norm => {
      htmlContent += `
        <div id="norm-${norm.id}" class="norm">
            <div class="norm-title">${norm.enbez || 'Norm'}</div>
            <div class="norm-content">
                ${norm.text_content_html || norm.text_content || ''}
            </div>
        </div>
`;
    });

    htmlContent += `
    </div>

    <div class="footer">
        Generiert von ASRA (Apache Solr Research Application)<br>
        ${new Date().toLocaleString('de-DE')}
    </div>
</body>
</html>`;

    // Download der HTML-Datei
    downloadFile(htmlContent, `${framework?.kurzue || 'dokument'}.html`, 'text/html');
  };

  const exportAsPDF = async (docs) => {
    // Für PDF-Export nutzen wir HTML-zu-PDF-Konvertierung
    // Erst HTML generieren, dann print-optimiert anzeigen
    await exportAsHTML(docs);
    
    // Anweisung für Benutzer
    setTimeout(() => {
      alert(
        'HTML-Datei wurde heruntergeladen.\n\n' +
        'Für PDF-Export:\n' +
        '1. Öffnen Sie die HTML-Datei im Browser\n' +
        '2. Drücken Sie Strg+P (Drucken)\n' +
        '3. Wählen Sie "Als PDF speichern"\n\n' +
        'Das Layout ist bereits für den Druck optimiert.'
      );
    }, 500);
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isFramework = uiHelpers.isFrameworkDocument(document?.id);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-gray-900 flex items-center">
            📥 Dokument exportieren
            {isFramework && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Vollständiges Gesetz
              </span>
            )}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {isFramework 
              ? 'Exportiert das gesamte Gesetz mit allen Artikeln und Gliederungen'
              : 'Exportiert diese einzelne Norm'
            }
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('html')}
            disabled={isExporting}
            className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting && exportFormat === 'html' ? (
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            HTML
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting && exportFormat === 'pdf' ? (
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            PDF
          </button>
        </div>
      </div>
      
      {isFramework && (
        <div className="mt-3 p-3 bg-blue-50 rounded-md">
          <div className="text-sm text-blue-800">
            <strong>💡 Hinweis:</strong> Als Rahmendokument werden alle zugehörigen Artikel und Gliederungen mit exportiert.
          </div>
        </div>
      )}
    </div>
  );
}
