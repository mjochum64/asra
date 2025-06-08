import React, { useState } from 'react';
import { searchDocuments } from '../services/solrService';
import { uiHelpers } from '../config/uiConfig';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Grund: Formatierungsfunktionen für Gesetzestexte mit korrekten Absätzen
 */

// Grund: Hilfsfunktion um bevorzugt HTML-Felder zu verwenden
const getContentForExport = (document, contentType = 'text') => {
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
const formatLegalTextForHTML = (text) => {
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
const getContentForPDF = (document, contentType = 'text') => {
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
const formatLegalTextForPDF = (text) => {
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
      // Grund: Verwende korrekte Solr-Query-Syntax ohne parent_document_id
      const query = frameworkId ? 
        `id:"${frameworkId}" OR id:${frameworkId}*` :
        `id:"${document.id}"`;
        
      const response = await searchDocuments(query, 'all', {}, {
        rows: 1000,
        fl: 'id,kurzue,langue,text_content,text_content_html,fussnoten_content_html,enbez,norm_type'
      });

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
            Dokument-ID: ${framework?.id || document.id} | 
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
        Generiert von ASRA (Apache Solr Research Application)<br>
        ${new Date().toLocaleString('de-DE')}
    </div>
</body>
</html>`;

    // Download der HTML-Datei mit aussagekräftigem Namen
    const filename = generateFilename(framework, 'html');
    downloadFile(htmlContent, filename, 'text/html');
  };

  const exportAsPDF = async (docs) => {
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

    try {
      // Verwende jsPDF mit optimierter Navigation
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Grund: Array für Seitenzuordnung und Navigation
      const navigationItems = [];

      // Helper-Funktion für Seitenumbruch
      const checkPageBreak = (requiredHeight = 10) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
      };

      // Helper-Funktion für Text mit Umbruch und Navigation-Tracking
      const addTextWithWrap = (text, fontSize = 12, isBold = false, trackForNavigation = false, navigationTitle = null) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont(undefined, 'bold');
        } else {
          pdf.setFont(undefined, 'normal');
        }
        
        pdf.setTextColor(0, 0, 0);
        
        const lines = pdf.splitTextToSize(text, maxWidth);
        const startY = yPosition;
        const currentPage = pdf.internal.getCurrentPageInfo().pageNumber;
        
        // Grund: Verfolge wichtige Abschnitte für Navigation
        if (trackForNavigation && navigationTitle) {
          navigationItems.push({
            title: navigationTitle,
            page: currentPage,
            y: startY
          });
        }
        
        lines.forEach(line => {
          checkPageBreak();
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.5; // Zeilenabstand
        });
        
        yPosition += 5; // Extra Abstand nach Absatz
        return startY;
      };

      // Titel
      addTextWithWrap(framework?.kurzue || 'Rechtsdokument', 18, true);
      yPosition += 10;

      // Metadaten
      if (framework?.langue) {
        addTextWithWrap(framework.langue, 10);
      }
      addTextWithWrap(`Dokument-ID: ${framework?.id || document.id}`, 10);
      addTextWithWrap(`Exportiert am: ${new Date().toLocaleDateString('de-DE')}`, 10);
      yPosition += 10;

      // Grund: Erstelle detailliertes Inhaltsverzeichnis mit Seitenzahlen
      addTextWithWrap('Inhaltsverzeichnis', 14, true);
      yPosition += 5;

      // Erste Durchgang: Sammle alle Navigation-Items
      const tempNavItems = [];
      let tempPageCount = pdf.internal.getCurrentPageInfo().pageNumber;
      
      // Schätze Seitenzahlen für Inhaltsverzeichnis (ungefähr)
      let estimatedTocLines = 0;
      meaningfulSections.forEach(section => {
        const sectionArticles = articles.filter(article => 
          article.id.startsWith(section.id)
        );
        if (sectionArticles.length > 0) {
          estimatedTocLines++;
          sectionArticles.forEach(article => {
            estimatedTocLines++;
          });
        }
      });
      orphanNorms.forEach(() => estimatedTocLines++);

      const tocPages = Math.ceil(estimatedTocLines / 35); // Etwa 35 Zeilen pro Seite
      let contentStartPage = tempPageCount + tocPages + 1;

      // Grund: Erstelle Inhaltsverzeichnis mit geschätzten Seitenzahlen
      meaningfulSections.forEach(section => {
        const sectionArticles = articles.filter(article => 
          article.id.startsWith(section.id)
        );
        if (sectionArticles.length > 0) {
          addTextWithWrap(`• ${section.enbez} .................................... Seite ${contentStartPage}`, 10);
          tempNavItems.push({ title: section.enbez, targetPage: contentStartPage });
          contentStartPage++;
          
          sectionArticles.forEach(article => {
            addTextWithWrap(`  → ${article.enbez || 'Artikel'} ........................... Seite ${contentStartPage}`, 9);
            tempNavItems.push({ title: article.enbez || 'Artikel', targetPage: contentStartPage });
            contentStartPage++;
          });
        }
      });

      orphanNorms.forEach(norm => {
        addTextWithWrap(`• ${norm.enbez || 'Norm'} .................................... Seite ${contentStartPage}`, 10);
        tempNavItems.push({ title: norm.enbez || 'Norm', targetPage: contentStartPage });
        contentStartPage++;
      });

      // Neue Seite für Hauptinhalt
      pdf.addPage();
      yPosition = margin;

      // Hauptinhalt mit korrekter Seitenverfolgung
      meaningfulSections.forEach(section => {
        const sectionArticles = articles.filter(article => 
          article.id.startsWith(section.id)
        );
        
        if (sectionArticles.length > 0) {
          checkPageBreak(20);
          
          // Section Titel
          addTextWithWrap(section.enbez, 14, true, true, section.enbez);
          yPosition += 5;
          
          // Section Artikel
          sectionArticles.forEach(norm => {
            checkPageBreak(15);
            
            // Norm Titel
            addTextWithWrap(norm.enbez || 'Norm', 12, true, true, norm.enbez || 'Norm');
            
            // Norm Inhalt - bevorzuge HTML-Felder
            const cleanContent = getContentForPDF(norm, 'text');
            if (cleanContent.length > 0) {
              cleanContent.forEach(paragraph => {
                addTextWithWrap(paragraph, 10);
              });
            }
            yPosition += 10; // Abstand zwischen Normen
          });
          yPosition += 10; // Abstand zwischen Sectionen
        }
      });

      // Direkte Normen
      orphanNorms.forEach(norm => {
        checkPageBreak(15);
        
        // Orphan Norm Titel
        addTextWithWrap(norm.enbez || 'Norm', 12, true, true, norm.enbez || 'Norm');
        
        // Norm Inhalt - bevorzuge HTML-Felder  
        const cleanContent = getContentForPDF(norm, 'text');
        if (cleanContent.length > 0) {
          cleanContent.forEach(paragraph => {
            addTextWithWrap(paragraph, 10);
          });
        }
        yPosition += 10;
      });

      // Footer
      checkPageBreak(15);
      yPosition += 20;
      addTextWithWrap('Generiert von ASRA (Apache Solr Research Application)', 8);
      addTextWithWrap(new Date().toLocaleString('de-DE'), 8);

      // Grund: Verwende jsPDF's outline/bookmark Feature (falls verfügbar)
      try {
        // Erstelle PDF-Outline für bessere Navigation
        if (pdf.outline && navigationItems.length > 0) {
          navigationItems.forEach((item, index) => {
            pdf.outline.add(null, item.title, { pageNumber: item.page });
          });
        }
      } catch (outlineError) {
        console.warn('⚠️ PDF-Outline nicht verfügbar:', outlineError);
      }

      // Speichere PDF mit aussagekräftigem Namen
      const filename = generateFilename(framework, 'pdf');
      pdf.save(filename);

      // Grund: Informiere Benutzer über Navigation mit spezifischen Tipps
      const navTips = `PDF erfolgreich erstellt! 🎉

📖 Navigation-Tipps:
• Verwenden Sie Ihr PDF-Viewer's Inhaltsverzeichnis (meist links im Seitenbereich)
• Nutzen Sie Strg+F (Cmd+F) zur Suche nach spezifischen Begriffen
• Das Inhaltsverzeichnis am Anfang zeigt alle Seitenzahlen

💡 Falls Ihr PDF-Viewer keine Navigation zeigt:
• Versuchen Sie Adobe Acrobat Reader, Foxit Reader oder einen anderen PDF-Viewer
• Die Seitenzahlen im Inhaltsverzeichnis helfen bei der manuellen Navigation`;

      alert(navTips);

    } catch (error) {
      console.error('PDF-Generierung fehlgeschlagen:', error);
      alert('PDF-Generierung fehlgeschlagen. Versuchen Sie es mit dem HTML-Export.');
    }
  };

  // Grund: Generiere aussagekräftige Dateinamen basierend auf Dokument-Informationen
  const generateFilename = (framework, extension) => {
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

  const downloadFile = (content, filename, mimeType) => {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 00-2 2z" />
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
          {document?.id && (
            <div className="text-xs text-blue-600 mt-1">
              📁 Dateiname: <code>{generateFilename({ id: document.id, kurzue: document.kurzue }, 'html/pdf')}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
