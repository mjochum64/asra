import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white shadow-md mt-8">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center text-solr-secondary">
              <div className="w-6 h-6 bg-solr-primary rounded-md flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-sm font-medium">ASRA</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Apache Solr Research Application
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <a href="#" className="text-xs text-gray-500 hover:text-solr-primary">
              Dokumentation
            </a>
            <a href="http://localhost:8983/solr/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-solr-primary">
              Solr Admin
            </a>
            <a href="https://solr.apache.org/guide/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-solr-primary">
              Solr Guide
            </a>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          <p>© {currentYear} ASRA. Powered by Apache Solr, React, and Vite.</p>
        </div>
      </div>
    </footer>
  );
}
