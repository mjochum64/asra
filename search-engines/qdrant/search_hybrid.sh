#!/bin/bash

# Helper script to run hybrid search across Solr and Qdrant
# Usage: ./search_hybrid.sh "search query" [limit] [keyword_weight,semantic_weight]

QUERY="$1"
LIMIT="${2:-10}"
WEIGHTS="${3:-0.5,0.5}"

if [ -z "$QUERY" ]; then
    echo "Usage: ./search_hybrid.sh \"search query\" [limit] [keyword_weight,semantic_weight]"
    echo "Example: ./search_hybrid.sh \"Grundgesetz Artikel 1\" 5 0.7,0.3"
    exit 1
fi

# Make the script executable
chmod +x hybrid_search.py

# Run the search
python hybrid_search.py --query "$QUERY" --limit "$LIMIT" --weights "$WEIGHTS"
