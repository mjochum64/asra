#!/bin/bash

# Start ASRA with Docker Hybrid setup
# This script starts all needed services using docker-compose

echo "Starting ASRA Hybrid Search System with Docker..."

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install docker and docker-compose."
    exit 1
fi

# Start services (using relative path to infrastructure directory)
docker-compose -f ../docker-compose.yml up -d

# Pull the Ollama model for embeddings if not already pulled
echo "Pulling Ollama embedding model (this may take a while)..."
sleep 5  # Give Ollama some time to start
curl -X POST http://localhost:11434/api/pull -d '{"name":"qllama/multilingual-e5-large-instruct:latest"}'

echo "ASRA Hybrid Search System started. Services available at:"
echo "- Frontend: http://localhost"
echo "- API server: http://localhost:3001"
echo "- Solr: http://localhost:8983"
echo "- Qdrant: http://localhost:6333"
echo "- Ollama: http://localhost:11434"
echo ""
echo "Run './search-engines/qdrant/index_to_qdrant.sh' to index documents to Qdrant"
