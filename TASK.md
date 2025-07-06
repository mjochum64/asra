# Project Tasks: ASRA – German Laws

## 🎯 Project Status: Phase 1.2 FULLY COMPLETED ✅
**Date**: June 11, 2025
**Version**: 1.2.0 PRODUCTION READY with Project Cleanup & Hybrid Search
**Status**: Complete project cleanup and Hybrid Search restoration finished ✅

### 🏆 Successfully Completed Main Goals:
- ✅ **Configurable UI Structure**: Normal Mode (5 fields) vs. Expert Mode (all fields)
- ✅ **German Legal Abbreviations**: Full support ("1. BImSchV", "GG", "BGB")
- ✅ **Dynamic Facet Filters**: Contextual filters based on search results
- ✅ **Content Highlighting**: Highlighting of search terms in full text
- ✅ **Production Docker Environment**: Stable container architecture
- ✅ **Final Verification**: 11/11 tests passed, 0 critical bugs
- ✅ **Repository Organization**: Documentation cleaned up, [`docs/`](docs/) structure established
- ✅ **Norm-Level Indexing**: Granular indexing of individual legal norms with XHTML formatting
- ✅ **Export Functionality**: PDF/HTML export with correct paragraph formatting and table of contents
- ✅ **HTML Fields Integration**: Optimal use of text_content_html fields for perfect formatting
- ✅ **Project Cleanup**: 27 empty files removed, Docker configuration unified
- ✅ **Hybrid Search Restoration**: Full restoration of hybrid search functionality

### 🎯 Newly Completed: Norm-Level Indexing
- ✅ **Granular Search**: Search results show specific articles/paragraphs instead of entire laws
- ✅ **XHTML Formatting Preserved**: Original formatting from XML sources maintained
- ✅ **Norm-Specific Badges**: Green badges for article identification (e.g., "Art 70", "§ 1")
- ✅ **Extended Metadata**: Norm type, source, norm number for improved navigation
- ✅ **Frontend Integration**: Full display with formatted HTML content

### 📊 Norm-Level Indexing Success Statistics:
- **Data Transformation**: 2 documents → 263 individual norms
- **Formatting**: XHTML markup successfully preserved (`text_content_html`, `fussnoten_content_html`)
- **Granularity**: Search now finds specific articles instead of entire law books
- **UI Integration**: Norm badges, type display, and improved metadata implemented

### 🎯 Newly Completed: Export Functionality & HTML Fields Integration (June 9, 2025)
- ✅ **PDF Export Optimization**: Correct paragraph formatting with (1), (2), (3) numbering
- ✅ **HTML Export**: Clean HTML output with preserved original formatting
- ✅ **Intelligent Content Conversion**: Preference for `text_content_html` fields over fallback
- ✅ **PDF Navigation**: Detailed table of contents with page numbers for all PDF viewers
- ✅ **Content Filtering**: Consistent filtering of redundant tables of contents between all views
- ✅ **Meaningful Filenames**: Automatic generation of meaningful filenames based on document IDs
- ✅ **Cross-Platform Compatibility**: Universal PDF navigation without proprietary features
- ✅ **Import Path Corrections**: Export functions fully corrected after refactoring
- ✅ **Full-Text View Optimization**: XHTML fields are preferred for perfect formatting
- ✅ **Document Type Distinction**: Correct distinction between framework document and individual norms during export

### 🎯 Newly Completed: Project Cleanup & Hybrid Search Restoration (June 11, 2025)
- ✅ **Massive File Cleanup**: 27 empty/obsolete files successfully removed
  - 4 empty shell scripts removed from root directory
  - 3 empty Docker scripts removed from scripts/
  - 2 empty Python analysis scripts removed
  - 4 redundant Docker files removed from root
  - Complete obsolete directories removed (/api, /docker, /src)
- ✅ **Docker Configuration Unified**: docker-compose-hybrid.yml → docker-compose.yml as standard
- ✅ **Frontend Container Repair**: 500 Internal Server Error fixed by container rebuild
- ✅ **API Route Restoration**: POST /api/hybrid/search route added for Hybrid Search
- ✅ **Path Corrections**: Python script paths corrected from /search-engines/ to /app/scripts/qdrant/
- ✅ **Nginx Proxy Configuration**: API proxy route implemented for seamless frontend-API communication
- ✅ **System Verification**: All services (Frontend, API, Solr, Qdrant, Ollama) successfully tested
- ✅ **Hybrid Search Functionality**: Both GET and POST API endpoints fully functional
- ✅ **Web Interface Validation**: Browser access to http://localhost:8080 successful with correct API connection

### 📊 Project Cleanup Success Statistics:
- **Removed Files**: 27 total (100% empty or obsolete)
- **Cleaned Directories**: 3 complete obsolete structures removed
- **Docker Simplification**: From 2 parallel docker-compose files to 1 standard configuration
- **API Endpoints**: Hybrid Search available via both GET (frontend) and POST (direct API access)
- **Container Status**: 6/6 services running stable (Frontend, API, Solr, Qdrant, Ollama, OpenWebUI)
- **Proxy Configuration**: Nginx reverse proxy configured for /api/ and /solr/ routes
- ✅ **Table of Contents Bug Fixed**: TableOfContents now reliably displayed in full-text view
- ✅ **Import Error Corrected**: Consistent ES6 module syntax in documentService.js instead of mixed imports
- ✅ **Defensive Programming**: Robust null checks and default values for the TableOfContents component
- ✅ **Service Modularization**: Specialized documentService.js for centralized document processing
- ✅ **Error Handling Improved**: Complete error handling in loadDocumentContents function

### 🚀 Next Phase: Sprint 2 (Auto-Suggest & Sorting)
- [ ] Auto-suggest/autocomplete functionality
- [ ] Advanced sorting options
- [ ] Search history with LocalStorage

---

## Phase 2: Hybrid Search Implementation (Qdrant & Ollama)

### Backend Development (Hybrid Search)
- [ ] Implement API endpoint for hybrid search (Solr + Qdrant).
- [ ] Develop logic for optional LLM-based query expansion (Ollama).
- [ ] Implement parallel querying to Solr and Qdrant.
- [ ] Create logic for merging and ranking results from Solr and Qdrant.
- [ ] Develop API endpoint for optional RAG-based answer generation (Ollama).

### Data Pipeline (Qdrant)
- [ ] Develop scripts/processes to generate vector embeddings for legal documents.
  - [ ] Choose an appropriate embedding model (e.g., Sentence-Transformers for German).
    - [x] **Selected Model**: `qllama/multilingual-e5-large-instruct:latest` via local Ollama instance.
    - [ ] **Ollama Endpoint**: `http://ollama:11434` (within Docker network)
  - [ ] Create a Python script (e.g., `docker/qdrant/qdrant_indexer.py` or in a new `docker/qdrant/` directory).
    - [ ] Script should fetch documents (from Solr or original sources like XML).
    - [ ] Script should extract relevant text for embedding.
    - [ ] Script should generate embeddings using the chosen model via Ollama endpoint.
- [ ] Implement indexing of embeddings into Qdrant.
  - [ ] Script should connect to the Qdrant service.
    - [ ] **Qdrant Endpoint**: `http://qdrant:6333` (within Docker network)
  - [ ] Script should define and create a Qdrant collection if it doesn't exist (specify vector size, distance metric).
  - [ ] Script should store embeddings along with a payload (e.g., document ID, title) in Qdrant.

### Frontend Development (Hybrid Search)
- [ ] Adapt UI to display combined/RAG results if necessary.
- [ ] Integrate new API endpoints for hybrid search and RAG.

**📋 Detailed Task List:**

---

## 1. Core Application Setup (Completed)

- [x] Create basic React project with Vite
- [x] Configure Tailwind CSS for styling
- [x] Set up project folder structure
- [x] Implement React component base system

## 2. Solr Integration (Completed)

- [x] Docker-Compose configuration for Solr
- [x] Solr schema definition for document indexing
- [x] REST API connection from frontend to Solr
- [x] Start script for Solr with automatic data loading

## 3. Search Functionality (Completed)

- [x] Implement search bar
- [x] Implement results display
- [x] Process search queries to Solr
- [x] Error handling and loading states

## 4. Docker Integration and Deployment (Completed)

- [x] Configure frontend as a Docker container
- [x] Set up Nginx as a reverse proxy for Solr
- [x] Docker-Compose setup for the entire application
- [x] Deployment scripts for development and production
- [x] Configurable Solr URL for different environments
- [x] Correction of environment detection for Vite applications (`import.meta.env.MODE`)
- [x] Implementation of the correct path to the Solr core (`documents/select`)

## 5. UI/UX Improvements (Completed)

- [x] Modernized UI design implemented (May 18, 2025)
- [x] Responsive layout with sidebar for filters created (May 18, 2025)
- [x] Pagination for larger result sets (May 18, 2025)
- [x] Improved result display with highlighting (May 18, 2025)
- [x] Simple search filters (search by title/content) implemented (May 18, 2025)
- [x] Developer mode with mock data for easier testing (May 18, 2025)
- [x] CORS problem in development mode solved by proxy (May 18, 2025)
- [x] Basic filter UI implemented in sidebar (May 18, 2025)

## 6. Code Splitting and Performance (Completed)

- [x] React.lazy import for ResultsDisplay component implemented (June 7, 2025)
- [x] Suspense wrapper with fallback UI added (June 7, 2025)
- [x] Bundle size optimization through dynamic loading (June 7, 2025)

## 7. Advanced Search Functionalities (In Progress - Phase 1)

### 7.1 Facet Filters (✅ FULLY COMPLETED - June 7, 2025)
- [x] Retrieve dynamic facets from Solr data (with mock fallback)
- [x] Category filter implemented in sidebar
- [x] Author filter with counters added
- [x] Filter state management between search queries
- [x] Filter bug fixed: Race condition between state updates and search function resolved (June 7, 2025)
- [x] Filters now work immediately after selection without a manual search click (June 7, 2025)
- [x] Solr DisMax Query integration for better full-text search (June 7, 2025)
- [x] Solr array field normalization implemented (June 7, 2025)
- [x] Category mapping from English (Solr) to German (UI) implemented (June 7, 2025)
- [x] Code cleanup: Debug logs removed (June 7, 2025)
- [x] **CRITICAL ISSUES FIXED (June 7, 2025)**:
  - [x] Dynamic, contextual filters instead of static filter display
  - [x] Content highlighting works correctly
  - [x] Author filters no longer disappear
  - [x] Uniform search syntax between main search and facets
- [x] **ARCHITECTURE REVISION (June 7, 2025)**:
  - [x] Contextual facets function `getContextualFacets()` implemented
  - [x] Unified Search Response with `{results, facets, total}` structure
  - [x] Component architecture switched to props-based facets
- [ ] Implement date range filter (→ Sprint 3)

### 7.2 German Legal Abbreviations Search (✅ FULLY COMPLETED - June 8, 2025)
- [x] **CRITICAL ISSUE FIXED**: Operator precedence error with German legal abbreviations containing spaces
- [x] Queries like "1. BImSchV" now generate correct Solr syntax with parentheses: `(amtabk:"1. BImSchV" OR (amtabk:*1* AND amtabk:*BImSchV*))`
- [x] URL encoding problem in axios requests solved
- [x] `buildGermanLegalQuery()` helper function implemented for consistent query creation
- [x] Official abbreviations (amtabk) and legal abbreviations (jurabk) work correctly
- [x] 400 Bad Request error with spaces in abbreviations fixed
- [x] Minimal URL encoding implemented: only spaces are encoded, Solr syntax remains intact

### 7.3 Configurable UI Structure (🚀 NEW PRIORITY - June 8, 2025) ✅ FULLY COMPLETED
- [x] **PROBLEM**: Current dynamic schema generation is too complex for normal users (37+ search fields)
- [x] **SOLUTION**: Structured UI configuration file with three sections:
  - [x] **SEARCH**: Reduced, user-friendly search fields with descriptions
  - [x] **HIT LIST**: Configurable display of relevant fields with highlighting options
  - [x] **FULL TEXT**: Structured document view with header, content, and sidebar
- [x] **Implement UI Modes**:
  - [x] Normal Mode: Simplified search for general users
  - [x] Expert Mode: Full access to all Solr fields (as currently)
- [x] **uiConfig.js created** ✅ - Configuration file with structured definition of all UI areas
- [x] **Component Integration**:
  - [x] DynamicSearchBar: Use UI configuration for search fields ✅ (June 8, 2025)
  - [x] DynamicResultsDisplay: Implement configurable result display ✅ (June 8, 2025)
  - [x] DynamicSidebar: UI-configured filters with mode support ✅ (June 8, 2025)
  - [x] New component: DocumentFullView for full-text view ✅ (already present)
- [x] **Mode-Switcher**: Toggle between Normal and Expert search ✅ (June 8, 2025)
- [x] **Formatting Helpers**: Format field values according to configuration (date, language, etc.) ✅ (June 8, 2025)

**🎉 IMPLEMENTATION COMPLETE**: The configurable UI structure is successfully implemented!
- **Normal Mode**: Shows only 5 user-friendly search fields + 3 primary filters
- **Expert Mode**: Provides full access to all Solr fields + advanced filters
- **All components** now use the central UI configuration from `uiConfig.js`
- **Mode-Switcher** allows easy toggling between modes
- **Icons and labels** significantly improve usability

**🔧 CRITICAL BUGFIX COMPLETED (June 8, 2025)**: German legal abbreviation search repaired
- **Problem**: "1. BImSchV" search gave HTTP 400 error due to URL encoding issues
- **Solution**: Parameter serializer implemented in solrService.js for correct phrase query encoding
- **Fixing**: Highlighting fields reduced to existing schema fields (removed non-existent "content" and "title")
- **Result**: ✅ amtabk:"1. BImSchV" now works completely (HTTP 200, 1 hit)
- **Validation**: All search modes (field-specific, general, highlighting) work correctly

**🧪 FINAL VERIFICATION SUITE COMPLETED (June 8, 2025)**: Complete final check successful
- [x] **Infrastructure Tests**: Docker containers, development server, Solr backend (all ✅)
- [x] **Functionality Tests**: German legal abbreviations, faceting, highlighting (all ✅)
- [x] **UI Configuration Tests**: uiConfig.js, component integration, mode-switcher (all ✅)
- [x] **End-to-End Tests**: Combined search/filter/highlighting functionality (✅)
- [x] **Production Readiness**: 11/11 tests passed, 0 critical errors remaining
- **Documentation**: FINAL_VERIFICATION_SUITE_RESULTS.md created
- **Status**: 🚀 READY FOR PRODUCTION

### 7.4 Advanced Search Options
- [ ] Auto-suggest / Autocomplete functionality
- [ ] Advanced sorting options (relevance, date, title)
- [ ] Wildcards and Boolean operators in search
- [ ] Search history and saved searches

### 7.5 Document Preview and Interaction
- [x] Highlight function for search terms in full text (✅ COMPLETED - June 7, 2025)
- [ ] Implement modal for document preview
- [ ] Document download functionality
- [ ] Related Documents feature

## 8. Norm-Level Indexing (✅ FULLY COMPLETED - June 8, 2025)

### 8.1 Architectural Problems Identified:
- [x] **Problem 1 - Granularity**: Search found entire laws instead of specific articles/paragraphs
- [x] **Problem 2 - Formatting Loss**: XHTML markup from XML sources was removed during import

### 8.2 Solr Schema Extension:
- [x] New norm-specific fields added:
  - [x] `norm_doknr` - Unique norm identification
  - [x] `norm_builddate` - Creation date of the norm
  - [x] `parent_document_id` - Reference to parent document
  - [x] `norm_type` - Type of the norm (article, section, etc.)
  - [x] `text_content_html` - Preserved XHTML formatting
  - [x] `fussnoten_content_html` - Formatted footnotes

### 8.3 New Import Algorithm:
- [x] **`solr_import_norms.py`** created - processes `<norm>` elements individually
- [x] **XHTML Formatting Preserved**: No text extraction, direct HTML mapping
- [x] **Metadata Inheritance**: Law-level metadata (jurabk, amtabk) inherited by individual norms
- [x] **Document Relationships**: Parent-child relationships maintained via `parent_document_id`

### 8.4 Data Transformation Successful:
- [x] **Before**: 2 document-level entries (entire laws)
- [x] **After**: 263 individual norm entries (specific articles/paragraphs)
- [x] **Granularity Achieved**: Search now finds e.g., "Art 70", "Art 79", "Art 83" individually
- [x] **Formatting Preserved**: HTML markup from XML sources maintained

### 8.5 Frontend Integration:
- [x] **UI Configuration Extended**: `uiConfig.js` with norm-specific display fields
- [x] **Norm Badges Implemented**: Green badges for article identification (`enbez` field)
- [x] **Display Types Extended**: `norm-badge`, `small-badge` for specialized display
- [x] **DynamicResultsDisplay Extended**: `renderFieldBadge()` for norm-specific representation
- [x] **DocumentFullView Updated**: HTML formatting is rendered correctly
- [x] **Metadata Integration**: Norm type, source, norm number in sidebar display

### 8.6 Success Measurement:
- [x] **Granular Search Results**: "Verantwortung" finds specific articles (Art 65, Art 20a, Art 46)
- [x] **XHTML Formatting Preserved**: `text_content_html` contains `<p>` tags and other formatting
- [x] **Norm Identification**: `enbez` field shows "Art 70", "Eingangsformel", "Präambel"
- [x] **Type Distinction**: `norm_type` distinguishes "article", "norm", etc.
- [x] **Full-Text View**: HTML formatting is rendered correctly in DocumentFullView

**🎯 RESULT**: Norm-level indexing fully implemented - users now find specific legal norms instead of entire law books, with original formatting preserved.

## 9. Future Features (After Phase 1)

- [ ] User management and authentication
- [ ] Saved searches for logged-in users
- [ ] Export options (PDF, CSV)
- [ ] Advanced search statistics and analytics
- [ ] Web crawler for Gesetze-im-Internet.de integration

## 10. Documentation and Tests (Partially Completed)

- [x] Update `README.md` with:
  - [x] Project overview
  - [x] Installation instructions
  - [x] Technology stack details
  - [x] Docker deployment instructions
- [x] Documentation of Solr configuration
- [x] Introduction of CHANGELOG.md for versioning
- [ ] Inline code documentation for all modules and functions
- [ ] Unit and integration tests for:
  - [ ] React components
  - [ ] Solr service functions
  - [ ] End-to-end search flow

## 11. DevOps and Deployment (Partially Completed)

- [x] Production deployment with Docker Compose
- [x] Nginx configuration for frontend and proxy
- [ ] CI/CD pipeline for automated builds
- [ ] Monitoring and logging setup
- [ ] Performance optimization for larger data sets

## 12. System Improvements (Planned)

- [x] Refactoring of the API service layer for configurable endpoints
- [x] Implementation of environment-specific configurations
- [ ] Error reporting and telemetry
- [ ] Internationalization support
- [ ] Advanced security configuration (HTTPS, CSP)

## Discovered During Work

- [x] Connection problems on slow networks require improved timeout handling (May 18, 2025) - Solved by configurable timeouts in Nginx
- [x] Need for a configurable Solr URL for different environments (May 18, 2025) - Implemented with environment variables
- [x] Error in Vite's environment detection and in the Solr core path (May 18, 2025) - Solved by adjusting solrService.js
- [x] CORS problems in development mode (May 18, 2025) - Solved by setting up a proxy in the Vite configuration
- [x] (HIGH) Optimization of loading times by implementing code splitting required (May 18, 2025) - **Completed (June 7, 2025)**
- [x] (HIGH) TableOfContents does not work in the document view (June 10, 2025) - **Solved by correcting import methods in documentService.js and more robust implementation**
- [ ] (HIGH) Implement better error handling for network problems (May 18, 2025)
- [ ] (MEDIUM) Allow Solr schema updates without container restart (May 18, 2025)
- [x] (MEDIUM) Integration of sidebar filters with Solr facets for dynamic filtering (May 19, 2025) - **✅ FULLY COMPLETED (June 7, 2025)**
- [ ] (LOW) Possibility to export search results as CSV or JSON (May 19, 2025)
- [ ] (LOW) Implement a theme switcher for light/dark mode (May 19, 2025)

## Current Sprint: Export Correction and Expert Search Revision (✅ FULLY COMPLETED - June 10, 2025)

### 8.1 Export Functions Correction (✅ COMPLETED - June 10, 2025)
- [x] **Import Paths Corrected**: DocumentExport.jsx now uses correct modular import paths
- [x] **Export Logic Revised**: Distinction between framework document vs. individual norm
- [x] **Filename Problem Fixed**: generateFilename() uses the first document as a fallback
- [x] **Full-Text View Optimized**: getContentForDisplay() prioritizes HTML fields
- [x] **HTML Tag Cleanup**: formatFieldValue() removes unwanted `<mark>` tags
- [x] **UI Improvements**: Framework document link as an icon in the header

### 8.2 Stopword Problem Fixed (✅ COMPLETED - June 10, 2025)
- [x] **Root Cause Identified**: Frontend validation blocked short terms
- [x] **Solution Implemented**: `.trim()` validation relaxed for stopword tests
- [x] **Functionality Confirmed**: German articles "der", "die", "das" can be tested

### 8.3 Expert Search Revision (✅ COMPLETED - June 10, 2025)
- [x] **Layout Simplified**: Search field selection cards in expert mode removed
- [x] **Direct Solr Syntax**: Support for `field:"value" AND/OR ...` queries
- [x] **Automatic Multi-Field Search**: Search across all German legal fields
- [x] **Advanced Highlighting**: Additional fields for expert mode
- [x] **Syntax Help**: User-friendly guide with examples
- [x] **Build Optimization**: Mixed import warnings fixed

### 8.4 Expert Search Examples Correction (✅ COMPLETED - Jan 12, 2025)
- [x] **Problem Recognized**: Syntax help used empty fields `kurzue` and `amtabk`
- [x] **Data Analysis**: Available fields identified: `jurabk:"GG"`, `langue:"Grundgesetz"`
- [x] **Examples Updated**: Syntax help now shows working examples with actual data
- [x] **Usability Improved**: Users see results immediately with demo queries

**Result**: All export and display functions work correctly. Expert search offers professional Solr query syntax with advanced features and working examples.

### Sprint 1: Facet Filters (CW 23-24) - ✅ FULLY COMPLETED
**Goal**: Dynamic filter functionality with Solr integration

**All priorities successfully completed**:
- [x] Solr facets API endpoint implemented
- [x] Category filter in sidebar with real data
- [x] Author filter with document counters
- [x] Filter state management for search queries
- [x] Filter race condition bug fixed
- [x] Solr DisMax Query integration
- [x] Array field normalization for Solr responses
- [x] Multi-filter combinations
- [x] **CRITICAL BUGFIXES**: Contextual filters, content highlighting, filter persistence
- [x] **ARCHITECTURE IMPROVEMENT**: Unified Search Response, props-based facets

**Sprint Result**: Fully functional dynamic facets with contextual filtering

### 7.4 German Legal Document Support (✅ FULLY COMPLETED - Jan 12, 2025)
- [x] **Problem Diagnosis**: German legal documents were not found in specific searches (only with *:* wildcard)
- [x] **Schema Analysis**: German legal document fields identified:
  - `kurzue`, `langue`, `text_content`: `text_de` (German text analysis)
  - `amtabk`, `jurabk`: `string` (exact strings)
- [x] **Schema Service Extended** (`schemaService.js`):
  - `analyzeSchemaForUI()` recognizes `text_de` and `text_de_exact` field types
  - `getDisplayFields()` prioritizes German legal document fields
  - `getContextualFacets()` uses German fields in an explicit OR query
- [x] **Solr Service Adjusted** (`solrService.js`):
  - Explicit OR query for combined text and string field search
  - Text fields: `kurzue:(${query}) OR langue:(${query}) OR text_content:(${query})`
  - String fields: `amtabk:"${query}" OR jurabk:"${query}"`
  - Highlighting fields extended with German fields
- [x] **URL Encoding Problems Fixed**: 400 Bad Request error fixed by correct `encodeURIComponent()` usage
- [x] **Query Syntax Optimized**: From DisMax/eDisMax to explicit OR query for better string field control
- [x] **Successful Search**: Search for "BImSchV" and other German legal terms works completely
- [x] **Field-Specific Wildcard Support**: String fields (`amtabk`, `jurabk`) use wildcard matching

**Result**: German legal document search fully functional with correct field prioritization and wildcard support

### 7.5 German Legal Document Abbreviations Fix (✅ FULLY COMPLETED - Jan 12, 2025)
- [x] **Problem Identified**: Complete German legal abbreviations like "1. BImSchV" yielded no search results
- [x] **Filter Problem Diagnosed**: Filters only worked in "All Fields" mode, not in field-specific searches
- [x] **Root Cause Analysis**: Wildcard queries with spaces (`amtabk:*1. BImSchV*`) fail in Solr string fields
- [x] **Solr Query Tests**: Validation of different query patterns:
  - `amtabk:"1. BImSchV"` (exact) ✅
  - `amtabk:*BImSchV*` (simple) ✅
  - `amtabk:*1.*` (simple) ✅
  - `amtabk:*1. BImSchV*` (with space) ❌
  - `amtabk:*1.* AND amtabk:*BImSchV*` (compound AND) ✅
- [x] **Helper Function Implemented**: `buildGermanLegalQuery()` in both services:
  - Automatically detects spaces in queries
  - Splits queries with spaces into compound AND patterns
  - Supports both exact matches and wildcard variants
- [x] **SolrService Updated**:
  - Field-specific searches for `amtabk` and `jurabk` use compound queries
  - General search uses helper function for German legal fields
  - Combines exact and wildcard approaches: `exact OR wildcard`
- [x] **SchemaService Updated**:
  - Same helper function implemented for consistency
  - `getContextualFacets()` uses helper function for German legal fields
- [x] **UI Tests Successful**: Web interface shows correct search results for "1. BImSchV"
- [x] **Filter Functionality Validated**: Filters work correctly in field-specific modes

**Query Pattern Solution**: `amtabk:*1.* AND amtabk:*BImSchV*` for queries with spaces
**Result**: German legal abbreviations with spaces work completely in all search modes

## 8. Norm-Level Indexing (✅ FULLY COMPLETED - June 8, 2025)

### 8.1 Architectural Problems Identified
- [x] **Problem 1 - Granularity**: Search found entire laws instead of specific articles/paragraphs
- [x] **Problem 2 - Formatting Loss**: XHTML markup from XML sources was removed during import

### 8.2 Solr Schema Extension
- [x] New norm-specific fields added:
  - [x] `norm_doknr` - Unique norm identification
  - [x] `norm_builddate` - Creation date of the norm
  - [x] `parent_document_id` - Reference to parent document
  - [x] `norm_type` - Type of the norm (article, section, etc.)
  - [x] `text_content_html` - Preserved XHTML formatting
  - [x] `fussnoten_content_html` - Formatted footnotes

### 8.3 New Import Algorithm
- [x] **`solr_import_norms.py`** created - processes `<norm>` elements individually
- [x] **XHTML Formatting Preserved**: No text extraction, direct HTML mapping
- [x] **Metadata Inheritance**: Law-level metadata (jurabk, amtabk) inherited by individual norms
- [x] **Document Relationships**: Parent-child relationships maintained via `parent_document_id`

### 8.4 Data Transformation Successful
- [x] **Before**: 2 document-level entries (entire laws)
- [x] **After**: 263 individual norm entries (specific articles/paragraphs)
- [x] **Granularity Achieved**: Search now finds e.g., "Art 70", "Art 79", "Art 83" individually
- [x] **Formatting Preserved**: HTML markup from XML sources maintained

### 8.5 Frontend Integration
- [x] **UI Configuration Extended**: `uiConfig.js` with norm-specific display fields
- [x] **Norm Badges Implemented**: Green badges for article identification (`enbez` field)
- [x] **Display Types Extended**: `norm-badge`, `small-badge` for specialized display
- [x] **DynamicResultsDisplay Extended**: `renderFieldBadge()` for norm-specific representation
- [x] **DocumentFullView Updated**: HTML formatting is rendered correctly
- [x] **Metadata Integration**: Norm type, source, norm number in sidebar display

### 8.6 Success Measurement
- [x] **Granular Search Results**: "Verantwortung" finds specific articles (Art 65, Art 20a, Art 46)
- [x] **XHTML Formatting Preserved**: `text_content_html` contains `<p>` tags and other formatting
- [x] **Norm Identification**: `enbez` field shows "Art 70", "Eingangsformel", "Präambel"
- [x] **Type Distinction**: `norm_type` distinguishes "article", "norm", etc.
- [x] **Full-Text View**: HTML formatting is rendered correctly in DocumentFullView

**🎯 RESULT**: Norm-level indexing fully implemented - users now find specific legal norms instead of entire law books, with original formatting preserved.

### Sprint 2: Auto-Suggest and Sorting (CW 25-26)
**Goal**: Improved user experience during search

**Features**:
- [ ] Autocomplete functionality based on Solr terms
- [ ] Advanced sorting options in ResultsDisplay
- [ ] Search history in LocalStorage

## 13. Code Quality & Refactoring (Added on 2025-06-09)

### 13.1 Frontend Modularization (✅ FULLY COMPLETED - 2025-06-09)
- **Goal**: Improve code structure, readability, and maintainability through modularization.
- [x] **DocumentExport.jsx Refactoring**:
    - [x] HTML export logic extracted to `src/lib/htmlExporter.js`.
    - [x] PDF export logic extracted to `src/lib/pdfExporter.js`.
    - [x] Related text formatting and file utilities moved to `src/utils/textFormatters.jsx` and `src/utils/fileUtils.js`.
- [x] **DynamicResultsDisplay.jsx Refactoring**:
    - [x] `ResultItem.jsx` component created for individual search results.
    - [x] Text utilities (`highlightSearchTerms`, `truncateText`) moved to `src/utils/textFormatters.jsx`.
- [x] **DocumentFullView.jsx Refactoring**:
    - [x] Text formatting helpers (`getContentForDisplay`, `formatLegalTextAsFallback`) moved to `src/utils/textFormatters.jsx`.
- [x] **Centralization of Utility Functions**:
    - [x] `src/utils/queryUtils.js` created for `buildGermanLegalQuery`.
    - [x] `src/utils/documentUtils.js` for document-specific helpers (from `uiHelpers`).
    - [x] `src/utils/formatUtils.js` for `formatFieldValue` (from `uiHelpers`).
    - [x] `uiHelpers` in `src/config/uiConfig.js` cleaned up.
- [x] **Service Clarification**:
    - [x] Comments added in `schemaService.js` to clarify the division of roles vs. `uiConfig.js`.
- [x] **Build Fix**:
    - [x] `textFormatters.js` renamed to `textFormatters.jsx` and imports corrected to fix build errors.
- **Result**: Significantly improved code organization, reduction of duplicates, and clearer module responsibilities.

### 13.2 Bugfixes and Robustness (✅ FULLY COMPLETED - 2025-06-10)
- **Goal**: Improve application stability and fix critical bugs.
- [x] **TableOfContents Bugfix**:
    - [x] Problem identified: Table of contents disappeared when opening the full-text view with TypeError "Cannot read properties of undefined (reading 'map')".
    - [x] Cause diagnosed: Mix of ES Module imports and CommonJS require in documentService.js.
    - [x] Solution implemented:
        - [x] New documentService.js created with consistent ES module syntax.
        - [x] Import of isFrameworkDocument corrected (from require to import).
        - [x] Defensive programming with null checks and default values added in TableOfContents.jsx.
    - [x] Tests performed: Full functionality of the table of contents confirmed.
- **Result**: Full-text view now works stably with a correctly displayed table of contents.


### 13.3 Project Cleanup & Hybrid Search Restoration (✅ FULLY COMPLETED - 2025-06-11)
- **Goal**: Remove obsolete files, unify Docker configuration, and restore Hybrid Search.
- [x] **File Cleanup**:
    - [x] 27 empty/obsolete files removed (shell scripts, Docker files, Python scripts).
    - [x] Obsolete directories (`/api`, `/docker`, `/src`) removed.
- [x] **Docker Configuration**:
    - [x] `docker-compose-hybrid.yml` renamed to `docker-compose.yml` as standard.
    - [x] Frontend container rebuild to fix the 500 Internal Server Error.
- [x] **API Restoration**:
    - [x] POST `/api/hybrid/search` route added in `backend/api/routes/hybrid.js`.
    - [x] Path corrections in Python scripts (`/search-engines/` -> `/app/scripts/qdrant/`).
    - [x] Nginx proxy configuration for `/api/` route implemented.
- [x] **System Verification**:
    - [x] All 6 services (Frontend, API, Solr, Qdrant, Ollama, OpenWebUI) successfully tested.
    - [x] Hybrid Search validated via GET (frontend) and POST (API).
    - [x] Web interface on `http://localhost:8080` successfully connected.
- **Result**: A clean, lean repository with a single, working Docker configuration and fully restored hybrid search functionality.