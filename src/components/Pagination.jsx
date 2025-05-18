import React from 'react';

export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  // Generate page numbers array
  const generatePageNumbers = () => {
    const pages = [];
    const showMax = 5; // Maximum number of pages to show
    
    if (totalPages <= showMax) {
      // Show all pages if there are less than showMax
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      // Calculate start and end of the middle section
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(currentPage + 1, totalPages - 1);
      
      // Adjust to make sure we show showMax-2 pages (minus first and last)
      if (endPage - startPage < showMax - 3) {
        if (currentPage < totalPages / 2) {
          endPage = Math.min(startPage + showMax - 3, totalPages - 1);
        } else {
          startPage = Math.max(endPage - (showMax - 3), 2);
        }
      }
      
      // Add ellipsis before middle
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis after middle
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always include last page
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = generatePageNumbers();
  
  return (
    <div className="flex items-center justify-center space-x-1 mt-6">
      <button
        className={`px-3 py-1 rounded-md ${
          currentPage === 1 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-solr-secondary hover:bg-gray-100'
        }`}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>
      
      {pageNumbers.map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-3 py-1">...</span>
        ) : (
          <button
            key={page}
            className={`px-3 py-1 rounded-md ${
              page === currentPage 
                ? 'bg-solr-primary text-white' 
                : 'text-solr-secondary hover:bg-gray-100'
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        className={`px-3 py-1 rounded-md ${
          currentPage === totalPages 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-solr-secondary hover:bg-gray-100'
        }`}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
