# ASRA - German Laws

A search engine and display platform for German laws with hybrid search (full-text and semantic).

## Project Structure

The project has been reorganized into a functional structure:

- `/frontend` - Frontend application (React/Vite)
- `/backend` - Backend services (Express API)
- `/search-engines` - Search engines (Solr, Qdrant, Hybrid Search)
- `/infrastructure` - Docker configuration and deployment scripts
- `/scripts` - Convenience scripts for common operations
- `/docs` - Project documentation

## Quick Start

```bash
# Start all components (with Docker)
./start_all.sh

# Start only the frontend (development)
./start_frontend.sh

# Start only the backend (development)
./start_backend.sh

# Available scripts
./scripts/reindex_qdrant.sh     # Re-index documents in Qdrant
./scripts/hybrid_search.sh      # Perform a hybrid search in the command line
./scripts/import_solr_data.sh   # Import demo data into Solr
./scripts/reset_solr_data.sh    # Delete all documents from Solr (before re-import)
./scripts/reset_qdrant_data.sh  # Delete all collections from Qdrant (before re-indexing)

# Note: The scripts are configured for use with Docker.
# The Docker configuration has been optimized and is located in the /infrastructure directory.
# For more information, see /docs/DOCKER_CONFIGURATION.md
```