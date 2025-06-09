import { searchDocuments } from '../services/solrService';
import { uiHelpers } from '../config/uiConfig';
import { getContentForExport } from '../utils/textFormatters';
import { generateFilename, downloadFile } from '../utils/fileUtils';

export const exportAsHTML = async (docs) => {
    const framework = docs.find(doc => uiHelpers.isFrameworkDocument(doc.id));

    // Verwende norm_type Feld wie in TableOfContents
    const sections = docs.filter(doc => doc.norm_type === 'section');
    const articles = docs.filter(doc => doc.norm_type === 'article');
    const specialNorms = docs.filter(doc => doc.norm_type === 'norm' && !uiHelpers.isFrameworkDocument(doc.id));

    // Grund: Filtere Gliederungseinheiten ohne Titel aus (wie in TableOfContents)
    const meaningfulSections = sections.filter(section =>
      section.enbez && section.enbez.trim() !== ''
    );

    // Grund: Erstelle orphanNorms-Struktur für direkte Anzeige
    const orphanNorms = [
      ...articles.filter(article =>
        !meaningfulSections.some(section => article.id.startsWith(section.id))
      ),
      ...specialNorms
    ];

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
            Dokument-ID: ${framework?.id || 'N/A'} |
            Exportiert am: ${new Date().toLocaleDateString('de-DE')}
        </div>
    </div>

    <div class="toc">
        <h2>Inhaltsverzeichnis</h2>
        <ul>
`;

    // Grund: Generiere Inhaltsverzeichnis nur für meaningful sections mit Artikeln
    meaningfulSections.forEach(section => {
      const sectionArticles = articles.filter(article =>
        article.id.startsWith(section.id)
      );
      if (sectionArticles.length > 0) {
        htmlContent += `            <li><a href="#section-${section.id}">${section.enbez}</a></li>\n`;
      }
    });

    // Grund: Orphan norms als direkte Einträge (keine redundanten Inhaltsverzeichnisse)
    orphanNorms.forEach(norm => {
      htmlContent += `            <li><a href="#norm-${norm.id}">${norm.enbez || 'Norm'}</a></li>\n`;
    });

    htmlContent += `
        </ul>
    </div>

    <div class="content">
`;

    // Grund: Generiere Hauptinhalt nur für sections mit Artikeln
    meaningfulSections.forEach(section => {
      const sectionArticles = articles.filter(article =>
        article.id.startsWith(section.id)
      );

      if (sectionArticles.length > 0) {
        htmlContent += `
        <div class="section">
            <h2 id="section-${section.id}" class="section-title">${section.enbez}</h2>
`;

        sectionArticles.forEach(norm => {
          const cleanContent = getContentForExport(norm, 'text');

          htmlContent += `
            <div id="norm-${norm.id}" class="norm">
                <div class="norm-title">${norm.enbez || 'Norm'}</div>
                <div class="norm-content">
                    ${cleanContent}
                </div>
            </div>
`;
        });

        htmlContent += `        </div>\n`;
      }
    });

    // Grund: Orphan norms direkt ohne weitere Strukturierung
    orphanNorms.forEach(norm => {
      const cleanContent = getContentForExport(norm, 'text');

      htmlContent += `
        <div id="norm-${norm.id}" class="norm">
            <div class="norm-title">${norm.enbez || 'Norm'}</div>
            <div class="norm-content">
                ${cleanContent}
            </div>
        </div>
`;
    });

    htmlContent += `
    </div>

    <div class="footer">
        Generiert von ASRA – Deutsche Gesetze<br>
        ${new Date().toLocaleString('de-DE')}
    </div>
</body>
</html>`;

    // Download der HTML-Datei mit aussagekräftigem Namen
    const filename = generateFilename(framework, 'html');
    downloadFile(htmlContent, filename, 'text/html');
  };
