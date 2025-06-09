import jsPDF from 'jspdf';
import { searchDocuments } from '../services/solrService'; // Path adjusted
import { uiHelpers } from '../config/uiConfig'; // Path adjusted
import { getContentForPDF } from '../utils/textFormatters'; // Path adjusted
import { generateFilename } from '../utils/fileUtils'; // Path adjusted

export const exportAsPDF = async (docs) => {
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
      addTextWithWrap(`Dokument-ID: ${framework?.id || 'N/A'}`, 10);
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
      addTextWithWrap('Generiert von ASRA – Deutsche Gesetze', 8);
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
