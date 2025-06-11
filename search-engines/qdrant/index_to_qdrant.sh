#!/bin/bash

# Script to run the Qdrant indexer
# Usage: ./index_to_qdrant.sh [--source solr|xml] [--limit N] [--docker] [--qdrant URL] [--ollama URL] [--solr URL] [--recreate]

# Display help if requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  echo "Usage: ./index_to_qdrant.sh [OPTIONS] [QUERY]"
  echo ""
  echo "Options:"
  echo "  --source solr|xml    Source of documents (default: solr)"
  echo "  --limit N            Maximum number of documents to process"
  echo "  --docker             Use Docker network endpoints (ollama, qdrant, solr)"
  echo "  --qdrant URL         Qdrant endpoint URL (default: http://localhost:6333)"
  echo "  --ollama URL         Ollama endpoint URL (default: http://localhost:11434)"
  echo "  --solr URL           Solr endpoint URL (default: http://localhost:8983/solr/documents)"
  echo "  --recreate           Recreate the collection if it exists"
  exit 0
fi

# Ensure we have the required Python packages
pip install -r requirements.txt

# Check if we're running in local development mode or need a specific configuration
if [[ "$*" == *"--docker"* ]]; then
    echo "Using Docker network configuration (ollama, qdrant, solr)"
    python3 qdrant_indexer.py "$@"
else
    # Default to localhost endpoints for local development
    echo "Using local endpoints (you can override with --qdrant, --ollama, --solr parameters)"
    python3 qdrant_indexer.py "$@"
fi
