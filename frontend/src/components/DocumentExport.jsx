import React, { useState } from 'react';
import { searchDocuments } from '../services/solrService';
import { exportAsHTML } from '../lib/htmlExporter';
import { exportAsPDF } from '../lib/pdfExporter';
import { generateFilename } from '../utils/fileUtils';
import { isFrameworkDocument } from '../utils/documentUtils';

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
      const currentDocumentIsFramework = isFrameworkDocument(document.id);
      let query;

      if (currentDocumentIsFramework) {
        // Aktuelles Dokument ist ein Rahmendokument, exportiere es und alle Kinder
        query = `id:"${document.id}" OR id:${document.id}*`;
      } else {
        // Aktuelles Dokument ist eine Norm, exportiere nur diese Norm
        query = `id:"${document.id}"`;
      }
        
      const response = await searchDocuments(query, 'all', {}, {
        rows: 1000,
        fl: 'id,kurzue,langue,text_content,text_content_html,fussnoten_content_html,enbez,norm_type'
      });

      // Backend-API gibt response.results zurück (nicht response.docs)
      if (response?.results && response.results.length > 0) {
        if (format === 'html') {
          // Verwende die importierte Funktion
          await exportAsHTML(response.results);
        } else if (format === 'pdf') {
          // Verwende die importierte Funktion
          await exportAsPDF(response.results);
        }
      } else {
        console.warn('Keine Dokumente für Export gefunden:', response);
        alert('Keine Dokumente für Export gefunden.');
      }
    } catch (error) {
      console.error('Export-Fehler:', error);
      alert('Export fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsExporting(false);
    }
  };

  // generateFilename und downloadFile wurden in fileUtils.js verschoben
  // exportAsHTML wurde in htmlExporter.js verschoben
  // exportAsPDF wurde in pdfExporter.js verschoben
  // Die textFormatierungsfunktionen wurden in textFormatters.js verschoben

  const isFramework = isFrameworkDocument(document?.id); // Use imported function

  return (
    <div className="flex items-center space-x-1"> {/* Adjusted: More compact, flex layout for buttons */}
      <button
        onClick={() => handleExport('html')}
        disabled={isExporting}
        className="flex items-center justify-center p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={isFramework ? "Gesamtes Gesetz als HTML exportieren" : "Norm als HTML exportieren"}
      >
        {isExporting && exportFormat === 'html' ? (
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"> {/* Adjusted spinner size */}
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          // HTML Icon (Code)
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        )}
      </button>
      
      <button
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
        className="flex items-center justify-center p-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={isFramework ? "Gesamtes Gesetz als PDF exportieren" : "Norm als PDF exportieren"}
      >
        {isExporting && exportFormat === 'pdf' ? (
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"> {/* Adjusted spinner size */}
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          // PDF Icon (File Text)
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
