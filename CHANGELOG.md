# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned for Sprint 2
- Auto-suggest/autocomplete functionality based on Solr terms
- Advanced sorting options (relevance, date, title)
- Search history with LocalStorage
- Advanced date range filters

### Long-term Planned
- Document preview modal
- Web crawler integration for automatic data import
- Theme switcher for light/dark mode

## [1.1.3] - 2025-06-10

### Fixed
- **Full-text view bugfix**: Fixed an issue with displaying the table of contents (TableOfContents)
  - Problem: The table of contents disappeared when opening the full-text view due to an error "Cannot read properties of undefined (reading 'map')"
  - Cause: Mix of ES module imports and CommonJS require in documentService.js
  - Solution: Implemented consistent import methods and fixed import error for isFrameworkDocument
  - Result: The table of contents is now displayed correctly and persists throughout the document view

## [1.1.2] - 2025-06-09

### Changed
- **Codebase Refactoring for Modularity**:
    - Refactored `DocumentExport.jsx`, `DynamicResultsDisplay.jsx`, and `DocumentFullView.jsx` to improve modularity and readability.
    - Extracted export logic (HTML/PDF) from `DocumentExport.jsx` into `src/lib/htmlExporter.js` and `src/lib/pdfExporter.js`.
    - Created `ResultItem.jsx` to handle individual search result rendering, simplifying `DynamicResultsDisplay.jsx`.
    - Centralized various utility functions into dedicated modules:
        - `src/utils/textFormatters.jsx` (for text manipulation, JSX formatting, highlighting, truncation - renamed from `.js` to `.jsx`).
        - `src/utils/fileUtils.js` (for `generateFilename`, `downloadFile`).
        - `src/utils/queryUtils.js` (for `buildGermanLegalQuery`).
        - `src/utils/documentUtils.js` (for document-specific helpers like `isFrameworkDocument`).
        - `src/utils/formatUtils.js` (for general value formatting like `formatFieldValue`).
    - Streamlined `uiHelpers` in `src/config/uiConfig.js`.
    - Added clarifying comments to `schemaService.js` regarding the roles of its dynamic functions versus `uiConfig`-driven approaches.

### Fixed
- **Build error**: Corrected the file extension for `textFormatters.js` to `textFormatters.jsx` because the file contains JSX syntax. This fixes a build error reported by Vite/Rollup.

## [1.1.1] - 2025-06-09

### 🚀 Feature Release: Optimized Export Functionality and Document View

### Added
- **Export Functions**: PDF and HTML export of document content with professional formatting
- **Intelligent Filename Generation**: Automatic creation of meaningful filenames based on document IDs
- **PDF Navigation**: Complete table of contents with precise page numbers for all PDF viewers
- **HTML Fields Integration**: Use of `text_content_html` and `fussnoten_content_html` for optimal formatting
- **Orphan Norm Structure**: Direct display of articles without parent sections
- **Full-text View**: Extended document view with correct paragraph formatting

### Changed
- **Export Content Optimization**: Both export functions use HTML fields instead of manual text formatting
- **Content Filtering**: Removal of redundant tables of contents and meaningless outline units
- **Data Retrieval Extension**: All relevant queries extended with HTML fields
- **Paragraph Formatting**: Numbered sections (1), (2), (3) are displayed as correct paragraphs

### Fixed
- **CRITICAL BUGFIX**: Removed redundant tables of contents in export files
- **Formatting Problem**: Filtered out excessive meaningless outline units
- **PDF Compatibility**: Universal PDF navigation without proprietary features
- **Content Consistency**: Identical formatting in full-text, HTML, and PDF views

### Technical Improvements
- **getContentForExport()**: New function for HTML export with HTML field prioritization
- **getContentForPDF()**: Intelligent HTML-to-PDF conversion with paragraph detection
- **generateFilename()**: Robust filename generation with special character cleanup
- **Fallback Mechanism**: Automatic use of manual formatting if HTML fields are missing

### Validated ✅
- **Export Functionality**: PDF and HTML export with correct formatting
- **Navigation**: PDF table of contents works in all PDF viewers
- **Content Filtering**: Only relevant sections and articles are exported
- **Paragraph Structure**: Numbered sections displayed as neat paragraphs

## [1.0.1] - 2025-06-08

### 🔧 Patch Release: Critical Search Function Bugfixes

### Fixed
- **CRITICAL BUGFIX**: Case-insensitive search for German legal abbreviations
  - Problem: Searching for "gg" did not find documents with "GG" in "Official Abbreviation" mode
  - Solution: Changed Solr schema fields `jurabk` and `amtabk` from `type="string"` to `type="text_de_exact"`
  - Result: Full case-insensitive functionality for all German legal abbreviations
- **Filter Display Configuration Fixed**
  - Problem: Only 1-2 filters were displayed instead of the configured filters
  - Solution: Updated `getContextualFacets()` in `schemaService.js` to use UI-configured filters
  - Result: Filters now display correctly based on available data

### Changed
- **Solr Schema**: Fields `jurabk` and `amtabk` now use `LowerCaseFilterFactory` for case-insensitive matching
- **schemaService.js**: `getContextualFacets()` function uses UI configuration instead of dynamic schema fields
- **Infrastructure**: Recreated Solr core and re-indexed demo data with updated schema

### Technical Details
- Restarted Solr container and created core with new schema configuration
- All demo documents successfully re-indexed with case-insensitive schema
- Removed debug logging after successful problem diagnosis

## [1.0.0] - 2025-06-08

### 🎉 Major Release: Configurable UI Structure PRODUCTION READY

### Added
- **Configurable UI Modes**: Normal mode (5 user-friendly fields) vs. Expert mode (all Solr fields)
- **ModeSwitcher Component**: Toggle between simplified and advanced search
- **uiConfig.js**: Central configuration file for UI areas (search, hit list, full text)
- **German Legal Abbreviations**: Full support for searches like "1. BImSchV", "GG", "BGB"
- **Helper Functions**: `highlightSearchTerms`, `truncateText`, field formatting, and value processing
- **Final Verification Suite**: 11/11 tests passed - all critical functionalities validated
- **Documentation Organization**: All reports moved to [`docs/`](docs/) folder

### Changed
- **DynamicSearchBar**: Full integration of UI configuration with icon support
- **DynamicResultsDisplay**: Configurable result display with content highlighting
- **DynamicSidebar**: Mode-aware filtering with UI configuration
- **DynamicApp**: Complete state management for uiMode change
- **Repository Structure**: Cleaned up and organized for production readiness

### Fixed
- **CRITICAL BUGFIX**: German legal abbreviation search (HTTP 400 → HTTP 200)
- **URL Encoding Problem**: Custom parameter serializer for phrase queries with spaces
- **Highlighting Configuration**: Corrected to existing schema fields (kurzue,langue,amtabk,jurabk,text_content)
- **Frontend Rendering Error**: `highlightSearchTerms` and `truncateText` functions implemented
- **Blank Webpage**: ReferenceError on missing helper functions fixed

### Validated ✅
- **Infrastructure**: Docker containers, development server, Solr backend
- **Search Functionality**: German legal abbreviations, faceting, highlighting
- **UI System**: All 5 components integrated with uiConfig.js
- **End-to-End**: Combined search/filter/highlighting functionality
- **Production Readiness**: 0 critical errors, all tests passed

### Removed
- Superfluous debug outputs and console logs
- Obsolete documentation files from root directory
- [`summary.sh`](summary.sh) - replaced by comprehensive Markdown documentation

## [0.3.1] - 2025-05-18

### Added
- Mock mode for development and testing purposes
- Extended logging for error diagnosis
- Improved mock data with highlighting and metadata

### Changed
- Vite configuration with proxy for Solr requests in development mode
- Improved error handling in the Solr service

### Fixed
- CORS issues in development mode by setting up a Vite proxy
- Improved error handling and debug outputs in the Solr service

## [0.3.0] - 2025-05-18

### Added
- Modern UI design with improved user experience
- New components: Navbar, Sidebar, Footer, Pagination
- Advanced search filters (search by title/content)
- Pagination for large result sets
- Result highlighting for search terms
- Improved document display with metadata
- Responsive layout with sidebar for desktop view

### Changed
- Revised SearchBar with additional search options
- Extended ResultsDisplay component with sorting options
- Improved error and empty state handling
- Optimized solrService.js for different search modes
- Comprehensive modernization of the layout and visual design

## [0.2.1] - 2025-05-18

### Fixed
- Fixed a bug in the Solr service configuration that affected environment detection in Vite
- Implemented the correct path to the Solr core (`documents/select`)
- Changed environment detection from `process.env.NODE_ENV` to `import.meta.env.MODE` to ensure correct function in Vite

## [0.2.0] - 2025-05-18

### Added
- Docker container for frontend with Nginx
- Reverse proxy configuration to avoid CORS issues
- Deployment script for production environments (`deploy.sh`)
- Renamed start script to `start_app.sh` (formerly `start_solr.sh`)
- Configurable Solr URL via environment variables
- Dynamic base URL configuration depending on the environment
- CHANGELOG.md for version tracking
- .gitignore file for clean project management

### Changed
- Docker-Compose configuration for both containers (Solr and frontend)
- README.md with updated installation instructions
- Updated development instructions for Docker and local development
- Solr service now uses a relative path in production mode

### Fixed
- CORS issues by using an Nginx reverse proxy
- Connection problems on slow networks through adjusted timeout settings
- Hardcoded Solr URL replaced with a configurable environment variable

## [0.1.0] - 2025-05-01

### Added
- Initial project structure with React and Vite
- Basic search functionality
- Integration with Apache Solr
- Solr schema for document indexing
- Docker container for Solr
- Sample data loader for Solr
- Responsive UI with Tailwind CSS
- Error handling and loading states for better UX