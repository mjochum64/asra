import React from 'react';

export default function Sidebar() {
  // Sample filter categories
  const categories = [
    { name: 'Kategorie', items: ['Technologie', 'Programmierung', 'Datenbank', 'DevOps', 'API', 'Cloud'] },
    { name: 'Autor', items: ['John Smith', 'Jane Doe', 'Alice Johnson', 'Bob Brown', 'Carol White'] },
    { name: 'Datum', items: ['Heute', 'Letzte Woche', 'Letzter Monat', 'Letztes Jahr'] }
  ];

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-5">
      <h2 className="text-lg font-semibold text-solr-secondary mb-4">Filter</h2>
      
      <div className="space-y-6">
        {categories.map((category, index) => (
          <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <h3 className="text-md font-medium text-solr-secondary mb-2">{category.name}</h3>
            <div className="space-y-2">
              {category.items.map((item, idx) => (
                <div key={idx} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`${category.name.toLowerCase()}-${idx}`}
                    className="rounded border-gray-300 text-solr-primary focus:ring-solr-primary"
                  />
                  <label 
                    htmlFor={`${category.name.toLowerCase()}-${idx}`}
                    className="ml-2 text-sm text-gray-600 hover:text-solr-primary cursor-pointer"
                  >
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full px-4 py-2 bg-white border border-solr-primary text-solr-primary hover:bg-solr-primary hover:text-white rounded-md text-sm transition-colors duration-300 flex justify-center items-center">
          Filter zurücksetzen
        </button>
      </div>
    </div>
  );
}
