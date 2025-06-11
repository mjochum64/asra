# README: ASRA - Deutsche Gesetze Hybrid Search System

## Overview

This extension of the ASRA project adds semantic vector search capabilities to the existing full-text search system. It uses:

1. **Solr** for traditional keyword-based search (existing)
2. **Qdrant** for vector-based semantic search (new)
3. **Ollama** for embedding generation using multilingual-e5-large-instruct model (new)
4. **Hybrid Search API** to combine results from both systems (new)

## Components

### Indexing System
- `qdrant_indexer.py` - Python script to extract legal documents from Solr/XML and index them to Qdrant
- `index_to_qdrant.sh` - Helper script to run the indexer

### Search System
- `qdrant_search.py` - Python script for semantic search via Qdrant
- `hybrid_search.py` - Python script that combines results from both search systems
- `search_hybrid.sh` - Helper script to run hybrid searches
- `/api/routes/hybrid.js` - Node.js API endpoint for hybrid search

### Frontend Integration
- `hybridSearchService.js` - Frontend service to communicate with the hybrid search API
- Enhanced `DynamicSearchBar.jsx` with search engine toggle

## Setup and Usage

### Local Development Setup

1. **Start the required services:**
   ```bash
   ./start_hybrid.sh
   ```

2. **Index documents to Qdrant:**
   ```bash
   cd docker/qdrant
   ./index_to_qdrant.sh [--limit N]
   ```

3. **Test hybrid search:**
   ```bash
   cd docker/qdrant
   ./search_hybrid.sh "your search query" [limit] [keyword_weight,semantic_weight]
   ```

### Docker Setup

1. **Start all services with Docker:**
   ```bash
   ./start_hybrid_docker.sh
   ```

2. **Index documents to Qdrant:**
   ```bash
   docker exec -it asra_api python /app/scripts/qdrant/qdrant_indexer.py
   ```

## Architecture

```
User Query
    │
    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ React UI    │────▶│ Hybrid API  │────▶│ Solr Search │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           │            ┌─────────────┐
                           ├───────────▶│ Qdrant      │
                           │            └─────────────┘
                           │
                           │            ┌─────────────┐
                           └───────────▶│ Ollama      │
                                        └─────────────┘
```

## Search Engine Types

1. **Keyword Search (Solr)**: Traditional full-text search with exact keyword matching
2. **Semantic Search (Qdrant)**: Finds documents based on meaning, not just keywords
3. **Hybrid Search**: Combines both approaches for comprehensive results

## Customization

You can adjust the weights between keyword and semantic search:
- Higher weight on keyword search (e.g., 0.8,0.2) for more precise results
- Higher weight on semantic search (e.g., 0.2,0.8) for more conceptual matches
