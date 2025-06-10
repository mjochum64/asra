import React from 'react';
import { uiConfig } from '../config/uiConfig';

/**
 * Mode Switcher Component - Kompakte Version als Dropdown
 */
export default function ModeSwitcher({ currentMode, onModeChange }) {
  const modeConfig = uiConfig.modes;
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      {/* Kompakter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-solr-primary focus:border-solr-primary"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">{modeConfig[currentMode]?.title}</span>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">Ansichtsmodus</h3>
          </div>
          
          {Object.entries(modeConfig).map(([modeKey, config]) => (
            <button
              key={modeKey}
              onClick={() => {
                onModeChange(modeKey);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                currentMode === modeKey ? 'bg-blue-50 border-r-2 border-solr-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-medium ${
                    currentMode === modeKey ? 'text-solr-primary' : 'text-gray-900'
                  }`}>
                    {config.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {config.description}
                  </div>
                </div>
                {currentMode === modeKey && (
                  <svg className="h-4 w-4 text-solr-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Overlay zum Schließen */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
