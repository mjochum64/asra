#!/bin/bash

# Script to reindex Qdrant with index-time filtering for weggefallen documents
# This removes the need for runtime filtering and improves performance

echo "=== ASRA Qdrant Reindexing with Index-Time Filtering ==="
echo
echo "This script will:"
echo "1. Remove weggefallen/repealed documents at index time"
echo "2. Improve search performance by reducing vector database size"
echo "3. Eliminate runtime filtering overhead"
echo

# Change to the qdrant directory
cd /home/mjochum/projekte/asra/search-engines/qdrant

# Check if the indexer exists
if [ ! -f "qdrant_indexer.py" ]; then
    echo "ERROR: qdrant_indexer.py not found in current directory"
    exit 1
fi

# Show current collection status
echo "Checking current Qdrant collection status..."
python3 -c "
from qdrant_client import QdrantClient
try:
    client = QdrantClient(url='http://localhost:6333')
    collections = client.get_collections()
    if 'deutsche_gesetze' in [c.name for c in collections.collections]:
        info = client.get_collection('deutsche_gesetze')
        print(f'Current collection has {info.points_count} points')
    else:
        print('Collection deutsche_gesetze does not exist')
except Exception as e:
    print(f'Error checking collection: {e}')
"

echo
echo "Starting reindexing with filtering..."
echo "Note: This will recreate the collection and may take several minutes."
echo

# Run the indexer with recreate flag to start fresh
python3 qdrant_indexer.py \
    --source solr \
    --recreate \
    --batch-size 5 \
    --max-text-length 1950

echo
echo "Reindexing completed!"
echo

# Show new collection status
echo "Checking new collection status..."
python3 -c "
from qdrant_client import QdrantClient
try:
    client = QdrantClient(url='http://localhost:6333')
    info = client.get_collection('deutsche_gesetze')
    print(f'New collection has {info.points_count} points')
    print('Index-time filtering is now active!')
except Exception as e:
    print(f'Error checking collection: {e}')
"

echo
echo "=== Benefits of Index-Time Filtering ==="
echo "✅ Smaller vector database size"
echo "✅ Faster semantic searches"  
echo "✅ No runtime filtering overhead"
echo "✅ Consistent results across all search modes"
echo
echo "Note: You may need to restart the API and frontend containers"
echo "to benefit from the improved performance."