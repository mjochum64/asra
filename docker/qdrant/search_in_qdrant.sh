#!/bin/bash

# Script to run the Qdrant search
# Usage: ./search_in_qdrant.sh "your search query" [--limit N] [--docker] [--qdrant URL] [--ollama URL]

# Display help if requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  echo "Usage: ./search_in_qdrant.sh [OPTIONS] QUERY"
  echo ""
  echo "Options:"
  echo "  --limit N            Number of results to return (default: 5)"
  echo "  --docker             Use Docker network endpoints (ollama, qdrant)"
  echo "  --qdrant URL         Qdrant endpoint URL (default: http://localhost:6333)"
  echo "  --ollama URL         Ollama endpoint URL (default: http://localhost:11434)"
  exit 0
fi

# Ensure we have the required Python packages
pip install -r requirements.txt

# Check if we're running in local development mode or need a specific configuration
if [[ "$*" == *"--docker"* ]]; then
    echo "Using Docker network configuration (ollama, qdrant)"
    python3 qdrant_search.py "$@"
else
    # Default to localhost endpoints for local development
    echo "Using local endpoints (you can override with --qdrant, --ollama parameters)"
    python3 qdrant_search.py "$@"
fi
