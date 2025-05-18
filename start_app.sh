#!/bin/bash

# Start the Solr container using Docker Compose
echo "Starting ASRA containers..."
docker-compose up -d solr

# Wait for Solr to fully start
echo "Waiting for Solr to start..."
while ! curl -s http://localhost:8983/solr/ > /dev/null; do
  echo "Solr is not yet available, waiting..."
  sleep 2
done

# Wait a bit more to make sure Solr is fully operational
sleep 5

# Make the sample data loader executable
chmod +x ./docker/solr/load_sample_data.py

# Load sample data
echo "Loading sample data into Solr..."
python ./docker/solr/load_sample_data.py

# Start the frontend container
echo "Starting frontend container..."
docker-compose up -d frontend

echo "ASRA is ready for testing with sample data loaded!"
echo "Access Solr Admin UI at: http://localhost:8983/solr/"
echo "Access ASRA frontend at: http://localhost:8080/"