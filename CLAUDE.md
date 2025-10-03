# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ASRA (Apache Solr Research Application) is a hybrid search system for German legal documents combining traditional keyword search (Apache Solr) with semantic vector search (Qdrant) and optional LLM capabilities (Ollama).

**Key Technologies:**
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Express.js API server
- Search: Apache Solr 9.2 (keyword), Qdrant (semantic vectors), Ollama (embeddings)
- Infrastructure: Docker Compose, Nginx

## Essential Commands

### Development

```bash
# Start all services with Docker
./start_all.sh

# Frontend development (port 5173)
cd frontend && npm run dev

# Backend API development (port 3001)
cd backend/api && npm run dev

# Build frontend for production
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview
```

### Data Management

```bash
# Import demo data into Solr
./scripts/import_solr_data.sh

# Index documents to Qdrant (semantic search)
./scripts/reindex_qdrant.sh

# Test hybrid search from CLI
./scripts/hybrid_search.sh "search query"

# Reset Solr data (before reimport)
./scripts/reset_solr_data.sh

# Reset Qdrant data (before reindexing)
./scripts/reset_qdrant_data.sh

# System verification
./scripts/quick_system_check.sh
```

### Docker Services

```bash
# Start services
docker-compose -f infrastructure/docker-compose.yml up -d

# Stop services
docker-compose -f infrastructure/docker-compose.yml down

# View logs
docker-compose -f infrastructure/docker-compose.yml logs -f [service_name]

# Service URLs (when running):
# - Frontend: http://localhost:8080
# - API: http://localhost:3001
# - Solr: http://localhost:8983
# - Qdrant: http://localhost:6333
# - Ollama: http://localhost:11434
# - OpenWebUI: http://localhost:8181
```

## Architecture Overview

### Project Structure

```
/frontend           - React application (Vite)
  /src
    /components     - UI components (SearchBar, ResultItem, DocumentView, etc.)
    /config         - UI configuration (uiConfig.js - central config for fields/modes)
    /services       - API clients (solrService, hybridSearchService)
    /utils          - Helper functions (formatUtils, documentUtils)
/backend            - Express API server
  /api
    /routes         - API endpoints (search, hybrid)
    server.js       - Main Express server
/search-engines     - Search system implementations
  /solr             - Solr configuration and import scripts
  /qdrant           - Qdrant indexer and semantic search scripts
/infrastructure     - Docker configuration
  docker-compose.yml
  Dockerfile, Dockerfile.api, Dockerfile.ollama
  /nginx            - Nginx configuration
/scripts            - Convenience scripts for common operations
```

### Data Flow

1. User enters query in React frontend
2. Query sent to Express API (`/api/search` or `/api/hybrid/search`)
3. API routes request to appropriate search engine(s):
   - **Keyword mode**: Query Solr directly
   - **Semantic mode**: Query Qdrant via Python script
   - **Hybrid mode**: Query both, combine and rank results
4. Optional: Ollama generates embeddings for semantic search
5. Results returned to frontend and rendered

### Key Components

**Frontend:**
- `DynamicApp.jsx` - Main application component
- `DynamicSearchBar.jsx` - Search interface with mode switching (Normal/Expert)
- `DynamicResultsDisplay.jsx` - Results list rendering
- `DocumentFullView.jsx` - Full document display
- `ModeSwitcher.jsx` - Toggle between Normal and Expert UI modes
- `uiConfig.js` - **CENTRAL CONFIGURATION** for all UI fields and modes

**Backend:**
- `server.js` - Express server with CORS, routes registration
- `routes/search.js` - Standard Solr search endpoint
- `routes/hybrid.js` - Hybrid search orchestration

**Search Engines:**
- `solr_import_norms.py` - Import XML legal documents to Solr (norm-level indexing)
- `qdrant_indexer.py` - Extract documents from Solr and index to Qdrant
- `hybrid_search.py` - Combine Solr and Qdrant results with configurable weights

## Important Configuration Files

### uiConfig.js (frontend/src/config/uiConfig.js)

**This is the single source of truth** for UI behavior. It defines:
- **Search modes** (Normal vs Expert)
- **Search fields** available in each mode
- **Result display fields** (primary, secondary, metadata)
- **Full document view** layout (header, content, sidebar)
- **Filters** (facets) available
- **Hybrid search** engines and weights

**When modifying search behavior, always start here.**

### Solr Schema (search-engines/solr/configsets/documents/conf/)

Defines indexed fields for German legal documents:
- `amtabk` - Amtliche Abkürzung (Official abbreviation)
- `jurabk` - Juristische Abkürzung (Legal abbreviation)
- `kurzue` - Kurztitel (Short title)
- `langue` - Langtitel (Long title)
- `text_content` - Full text content
- `enbez` - Einzelnorm-Bezeichnung (Norm identifier)
- And many others...

### Docker Compose (infrastructure/docker-compose.yml)

Defines all services and their connections. Services communicate via `asra-network`.

## Development Guidelines

### React/Frontend

- Use functional components with hooks (no class components)
- Component file naming: PascalCase (e.g., `ResultItem.jsx`)
- Keep components under 500 lines - refactor if larger
- Use Tailwind utility classes for styling
- Configure fields/modes in `uiConfig.js`, not hardcoded in components
- API base URL: Use `/api` (proxied by Nginx in production)

### Backend/API

- Route handlers in `/backend/api/routes/`
- Use async/await for asynchronous operations
- Environment variables for service endpoints (SOLR_ENDPOINT, QDRANT_ENDPOINT, OLLAMA_ENDPOINT)
- CORS enabled for frontend communication

### Solr Integration

- Custom German language support in schema
- Special handling for legal abbreviations ("1. BImSchV" format)
- Content highlighting configured for search results
- Faceted search on: xml_lang, jurabk, document_type

### Qdrant/Semantic Search

- Uses Ollama with multilingual-e5-large-instruct model for embeddings
- Indexing script: `search-engines/qdrant/qdrant_indexer.py`
- Chunking strategy for long documents
- Metadata stored alongside vectors for filtering

### Hybrid Search

- Configurable weights (default: 0.7 keyword, 0.3 semantic)
- Results merged and deduplicated by document ID
- Score normalization across both systems
- Python implementation: `search-engines/qdrant/hybrid_search.py`

## Code Conventions

**From .github/copilot-instructions.md:**

1. **Read PLANNING.md** at start of new conversations for architecture/goals
2. **Check TASK.md** before new tasks - add if not listed
3. **File size limit**: Keep files under 500 lines
4. **Imports**: Use absolute imports, avoid relative paths
5. **Testing**: Write unit tests for new features (use Vitest)
6. **Naming**:
   - PascalCase for components
   - camelCase for variables/functions
   - kebab-case for CSS classes (when not Tailwind)
7. **Indentation**: 2 spaces
8. **Comments**: Use `// Grund:` to explain complex logic (focus on "why")
9. **Documentation**: Update README.md when adding features or changing setup

## Testing

Tests use Vitest + React Testing Library:

```bash
cd frontend
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

**Test organization** (from copilot-instructions.md):
- Mirror main application structure in `/tests` folder
- Each feature should have:
  - 1 test for expected behavior
  - 1 test for edge cases
  - 1 test for error cases

## Special Considerations

### Norm-Level Indexing

Documents are indexed at the norm level (individual legal provisions), not entire laws. Each norm has:
- Parent document reference (`parent_document_id`)
- Norm identifier (`enbez`, `norm_doknr`)
- Structured content with formatting (`text_content_html`, `fussnoten_content_html`)

### German Legal Document Structure

- **Abkürzungen**: amtabk (official), jurabk (legal usage)
- **Titel**: kurzue (short), langue (full)
- **Fundstellen**: Legal citations and references
- **Normen**: Individual provisions within laws
- **Gliederung**: Hierarchical structure

### UI Modes

**Normal Mode**: 5 user-friendly search fields, basic filters
**Expert Mode**: Full access to all Solr fields and advanced filters

Toggle between modes preserves search state.

## Common Tasks

### Adding a New Search Field

1. Update Solr schema if needed (search-engines/solr/configsets/documents/conf/)
2. Add field definition to `uiConfig.js` in appropriate section (search.modes or search.expertModes)
3. Update display logic if needed in components that use `uiConfig`
4. No component changes needed if using `uiConfig` properly

### Adding a New Filter/Facet

1. Ensure field is facetable in Solr schema
2. Add to `uiConfig.js` filters.enabled or filters.expert
3. Component will automatically pick it up via `uiHelpers.getFilterFields()`

### Modifying Hybrid Search Weights

- Update `uiConfig.hybridSearch.defaultWeights` for UI defaults
- Pass weights to hybrid search API: `/api/hybrid/search?weights=0.8,0.2`

### Debugging Search Issues

1. Check Solr admin UI: http://localhost:8983
2. Test direct Solr queries in admin interface
3. Check API logs: `docker logs asra_api`
4. Verify Qdrant collections: http://localhost:6333/dashboard
5. Test Ollama embeddings: `./scripts/test_ollama_embeddings.sh`

## Known Limitations

- API URLs were hardcoded in service layer (use `/api` prefix instead)
- Limited test coverage (Phase 1 complete, more tests needed)
- Environment configuration should be externalized (currently in code/docker-compose)
- No user authentication yet (planned for Phase 3)
- Docker GPU support configured for AMD (KFD/DRI devices)

## References

- **PLANNING.md**: Detailed project planning and roadmap
- **TASK.md**: Active tasks and completed work
- **CHANGELOG.md**: Version history and changes
- **search-engines/qdrant/README.md**: Hybrid search system details
- **Copilot instructions**: .github/copilot-instructions.md
