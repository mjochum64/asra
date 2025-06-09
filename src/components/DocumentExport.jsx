import React, { useState } from 'react';
import { searchDocuments } from '../services/solrService';
// import { uiHelpers } from '../config/uiConfig'; // No longer needed directly
import { exportAsHTML } from '../lib/htmlExporter'; // Adjusted path
import { exportAsPDF } from '../lib/pdfExporter'; // Adjusted path
import { generateFilename } from '../utils/fileUtils'; // Adjusted path
import { isFrameworkDocument } from '../utils/documentUtils'; // Import specific helper

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
          // Verwende die importierte Funktion
          await exportAsHTML(response.docs);
        } else if (format === 'pdf') {
          // Verwende die importierte Funktion
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

  // generateFilename und downloadFile wurden in fileUtils.js verschoben
  // exportAsHTML wurde in htmlExporter.js verschoben
  // exportAsPDF wurde in pdfExporter.js verschoben
  // Die textFormatierungsfunktionen wurden in textFormatters.js verschoben

  const isFramework = isFrameworkDocument(document?.id); // Use imported function

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
