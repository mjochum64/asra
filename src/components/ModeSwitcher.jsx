import React from 'react';
import { uiConfig } from '../config/uiConfig';

/**
 * Mode Switcher Component - Toggles between Normal and Expert UI modes
 */
export default function ModeSwitcher({ currentMode, onModeChange }) {
  const modeConfig = uiConfig.modes;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Ansichtsmodus</h3>
        <div className="flex items-center space-x-1">
          {Object.entries(modeConfig).map(([modeKey, config]) => (
            <button
              key={modeKey}
              onClick={() => onModeChange(modeKey)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 ${
                currentMode === modeKey
                  ? 'bg-solr-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {config.title}
            </button>
          ))}
        </div>
      </div>
      
      <p className="text-xs text-gray-600">
        {modeConfig[currentMode]?.description}
      </p>
      
      {/* Mode-specific info */}
      <div className="mt-2 text-xs text-gray-500">
        {currentMode === 'normal' && (
          <div className="flex items-center">
            <svg className="h-3 w-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Vereinfachte Oberfläche für allgemeine Nutzer
          </div>
        )}
        {currentMode === 'expert' && (
          <div className="flex items-center">
            <svg className="h-3 w-3 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Vollzugriff auf alle Solr-Felder
          </div>
        )}
      </div>
    </div>
  );
}
