#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ASRA Qdrant Search

This script performs a semantic search using Qdrant and Ollama.
It takes a query, converts it to a vector using Ollama embeddings,
and searches for similar documents in Qdrant.

Usage:
    python3 qdrant_search.py "Ihre Suchanfrage hier"
"""

import argparse
import json
import logging
import os
import sys
import time
from typing import Dict, List, Optional

import requests
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Configuration constants
# Default endpoints for local development
DEFAULT_OLLAMA_ENDPOINT = "http://localhost:11434"
DEFAULT_QDRANT_ENDPOINT = "http://localhost:6333"

# Docker network endpoints (when running inside Docker)
DOCKER_OLLAMA_ENDPOINT = "http://ollama:11434"
DOCKER_QDRANT_ENDPOINT = "http://qdrant:6333"

# Read from environment variables or use defaults
OLLAMA_ENDPOINT = os.environ.get("OLLAMA_ENDPOINT", DEFAULT_OLLAMA_ENDPOINT)
QDRANT_ENDPOINT = os.environ.get("QDRANT_ENDPOINT", DEFAULT_QDRANT_ENDPOINT)
COLLECTION_NAME = "deutsche_gesetze"
EMBEDDING_MODEL = "qllama/multilingual-e5-large-instruct"
MAX_RETRIES = 3  # Maximum number of retries for failed embedding requests
RETRY_DELAY = 2  # Delay in seconds between retries


def generate_embedding(text: str, retries: int = MAX_RETRIES) -> Optional[List[float]]:
    """Generate embeddings for text using Ollama.

    Args:
        text: Text to generate embeddings for
        retries: Number of retries left

    Returns:
        List of embedding values or None if generation failed
    """
    if not text or text.strip() == "":
        logger.warning("Empty query text provided. Cannot generate embedding.")
        return None
    
    current_retry = MAX_RETRIES - retries
    if current_retry > 0:
        logger.info(f"Retry {current_retry}/{MAX_RETRIES} for embedding generation")
        time.sleep(RETRY_DELAY)  # Wait before retrying
    
    try:
        response = requests.post(
            f"{OLLAMA_ENDPOINT}/api/embeddings",
            json={"model": EMBEDDING_MODEL, "prompt": text},
            timeout=30  # 30 second timeout
        )
        response.raise_for_status()
        embedding = response.json().get("embedding", [])
        
        if not embedding or len(embedding) == 0:
            logger.warning(f"Empty embedding returned from Ollama")
            if retries > 0:
                return generate_embedding(text, retries - 1)
            return None
        
        logger.info(f"Generated embedding with dimension: {len(embedding)}")
        return embedding
    except requests.exceptions.RequestException as e:
        logger.error(f"Error generating embedding: {e}")
        if retries > 0:
            return generate_embedding(text, retries - 1)
        return None


def search_qdrant(query_vector: List[float], limit: int = 5) -> List[Dict]:
    """Search for similar documents in Qdrant.

    Args:
        query_vector: Vector embedding of the query
        limit: Maximum number of results to return

    Returns:
        List of search results with metadata
    """
    try:
        client = QdrantClient(url=QDRANT_ENDPOINT)
        
        # Search in collection using the non-deprecated method
        search_results = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,  # Changed from query_vector to query
            limit=limit,
            with_payload=True
        )
        
        # Format results - the response format changed with query_points
        results = []
        for point in search_results.points:
            # Extract the original document ID from payload
            original_id = point.payload.get("original_id", str(point.id))
            
            results.append({
                "id": point.id,  # This is the numeric ID
                "original_id": original_id,  # This is the original string ID
                "score": point.score,
                "payload": point.payload
            })
        
        return results
    except Exception as e:
        logger.error(f"Error searching Qdrant: {e}")
        return []


def main():
    """Main function to run the search."""
    parser = argparse.ArgumentParser(description="ASRA Qdrant Search")
    parser.add_argument(
        "query",
        type=str,
        help="Search query"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Number of results to return (default: 5)"
    )
    parser.add_argument(
        "--qdrant",
        type=str,
        default=None,
        help="Qdrant endpoint URL (default: from env or localhost)"
    )
    parser.add_argument(
        "--ollama",
        type=str,
        default=None,
        help="Ollama endpoint URL (default: from env or localhost)"
    )
    parser.add_argument(
        "--docker",
        action="store_true",
        help="Use Docker network endpoints (ollama, qdrant)"
    )
    
    args = parser.parse_args()
    
    # Set endpoints based on arguments
    global QDRANT_ENDPOINT, OLLAMA_ENDPOINT
    
    if args.docker:
        logger.info("Using Docker network endpoints")
        QDRANT_ENDPOINT = DOCKER_QDRANT_ENDPOINT
        OLLAMA_ENDPOINT = DOCKER_OLLAMA_ENDPOINT
    else:
        if args.qdrant:
            QDRANT_ENDPOINT = args.qdrant
        if args.ollama:
            OLLAMA_ENDPOINT = args.ollama
    
    logger.info(f"Using Qdrant endpoint: {QDRANT_ENDPOINT}")
    logger.info(f"Using Ollama endpoint: {OLLAMA_ENDPOINT}")
    
    try:
        # Generate embedding for query
        logger.info(f"Generating embedding for query: '{args.query}'")
        query_vector = generate_embedding(args.query)
        
        if not query_vector:
            logger.error("Failed to generate embedding for the query. Exiting.")
            sys.exit(1)
        
        # Search Qdrant
        logger.info("Searching Qdrant...")
        results = search_qdrant(query_vector, args.limit)
        
        # Display results
        if not results:
            print("No results found")
            return
        
        print(f"\nSearch results for: '{args.query}'\n")
        for i, result in enumerate(results):
            print(f"Result {i+1} (Score: {result['score']:.4f}):")
            print(f"  ID: {result['original_id']}")
            print(f"  Title: {result['payload'].get('enbez', 'N/A')}")
            print(f"  Type: {result['payload'].get('norm_type', 'N/A')}")
            print(f"  Code: {result['payload'].get('jurabk', 'N/A')} - {result['payload'].get('amtabk', 'N/A')}")
            print()
            
    except Exception as e:
        logger.error(f"Error performing search: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
