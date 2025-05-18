import React from 'react';

export default function Navbar({ onToggleMock, useMock }) {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-solr-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-semibold text-solr-secondary tracking-tight">ASRA</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          <button 
            className="px-3 py-1.5 text-sm text-solr-secondary hover:text-solr-primary"
            onClick={() => window.open('http://localhost:8983/solr/', '_blank')}
          >
            Solr Admin
          </button>
          <button 
            className={`px-3 py-1.5 text-sm ${useMock ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'} rounded-md hover:opacity-90 transition-colors`}
            onClick={onToggleMock}
          >
            {useMock ? 'Mock-Modus (Ein)' : 'Mock-Modus (Aus)'}
          </button>
        </div>
        
        <button className="md:hidden text-solr-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
