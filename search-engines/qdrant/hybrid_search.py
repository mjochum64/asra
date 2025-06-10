#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ASRA Hybrid Search Service

This script provides a unified API for searching both Solr (keyword-based search)
and Qdrant (semantic vector search) and combining the results intelligently.

It accepts a query string and returns ranked results from both systems.

Usage:
    python3 hybrid_search.py [--query "search query"] [--limit N] [--weights keyword,semantic]

Options:
    --query     The search query text
    --limit     Maximum number of results to return (default: 10)
    --weights   Relative weights for keyword vs semantic results, comma-separated (default: 0.5,0.5)
    --docker    Use Docker network endpoints instead of localhost
"""

import argparse
import json
import logging
import math
import os
import re
import time
from typing import Dict, List, Optional, Tuple, Union

import requests
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models

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
DEFAULT_SOLR_ENDPOINT = "http://localhost:8983/solr/documents"

# Docker network endpoints (when running inside Docker)
DOCKER_OLLAMA_ENDPOINT = "http://ollama:11434"
DOCKER_QDRANT_ENDPOINT = "http://qdrant:6333"
DOCKER_SOLR_ENDPOINT = "http://solr:8983/solr/documents"

# Read from environment variables or use defaults
OLLAMA_ENDPOINT = os.environ.get("OLLAMA_ENDPOINT", DEFAULT_OLLAMA_ENDPOINT)
QDRANT_ENDPOINT = os.environ.get("QDRANT_ENDPOINT", DEFAULT_QDRANT_ENDPOINT) 
SOLR_ENDPOINT = os.environ.get("SOLR_ENDPOINT", DEFAULT_SOLR_ENDPOINT)
COLLECTION_NAME = "deutsche_gesetze"
EMBEDDING_MODEL = "qllama/multilingual-e5-large-instruct:latest"

# Default search parameters
DEFAULT_LIMIT = 10  # Default number of results to return
DEFAULT_WEIGHTS = (0.5, 0.5)  # Default weights for keyword vs semantic search


class HybridSearcher:
    """Class for hybrid search combining keyword and semantic search."""
    
    def __init__(self, weights: Tuple[float, float] = DEFAULT_WEIGHTS):
        """Initialize the hybrid search service.
        
        Args:
            weights: Tuple of weights (keyword_weight, semantic_weight) for combining results
        """
        self.qdrant_client = QdrantClient(url=QDRANT_ENDPOINT)
        self.keyword_weight, self.semantic_weight = weights
        # Normalize weights to sum to 1.0
        weight_sum = self.keyword_weight + self.semantic_weight
        self.keyword_weight /= weight_sum
        self.semantic_weight /= weight_sum
        
        logger.info(f"Initialized hybrid search with weights: keyword={self.keyword_weight:.2f}, "
                  f"semantic={self.semantic_weight:.2f}")
    
    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate an embedding for the search query.
        
        Args:
            text: The search query text
            
        Returns:
            List of embedding values or None if generation failed
        """
        if not text or text.strip() == "":
            logger.warning("Empty text provided for embedding generation.")
            return None
        
        try:
            response = requests.post(
                f"{OLLAMA_ENDPOINT}/api/embeddings",
                json={"model": EMBEDDING_MODEL, "prompt": text},
                timeout=10  # shorter timeout for search queries
            )
            response.raise_for_status()
            embedding = response.json().get("embedding", [])
            
            if not embedding:
                logger.warning(f"Empty embedding returned for query: {text}")
                return None
                
            return embedding
        except requests.exceptions.RequestException as e:
            logger.error(f"Error generating embedding: {e}")
            return None
    
    def solr_search(self, query: str, limit: int = DEFAULT_LIMIT) -> List[Dict]:
        """Perform keyword search using Solr.
        
        Args:
            query: Search query text
            limit: Maximum number of results to return
            
        Returns:
            List of document dicts with search scores
        """
        try:
            start_time = time.time()
            
            # Build query parameters with more optimized field boosting
            params = {
                "q": query,
                "rows": limit,
                "fl": "id,enbez,kurzue,langue,norm_type,parent_document_id,jurabk,amtabk,score",
                "defType": "edismax",
                "qf": "text_content^1.0 enbez^2.0 kurzue^1.5 amtabk^1.8 jurabk^1.8",
                "mm": "2<70%",  # Match at least 70% of terms for multi-term queries
                "pf": "enbez^4.0 text_content^2.0",  # Phrase fields
                "ps": "2",  # Phrase slop
                "wt": "json"
            }
            
            response = requests.get(
                f"{SOLR_ENDPOINT}/select",
                params=params
            )
            response.raise_for_status()
            
            result = response.json()
            docs = result.get("response", {}).get("docs", [])
            
            # Add search source to each document
            for doc in docs:
                doc["search_source"] = "keyword"
                
            logger.info(f"Solr search returned {len(docs)} results in {time.time() - start_time:.2f} seconds")
            return docs
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error in Solr search: {e}")
            return []
    
    def semantic_search(self, query: str, limit: int = DEFAULT_LIMIT) -> List[Dict]:
        """Perform semantic search using Qdrant.
        
        Args:
            query: Search query text
            limit: Maximum number of results to return
            
        Returns:
            List of document dicts with search scores
        """
        try:
            start_time = time.time()
            
            # Generate embedding for the query
            embedding = self.generate_embedding(query)
            if not embedding:
                logger.warning("Could not generate embedding for semantic search.")
                return []
            
            # Search in Qdrant using the correct parameters for query_points
            search_results = self.qdrant_client.query_points(
                collection_name=COLLECTION_NAME,
                query=embedding,  # Changed from query_vector to query
                limit=limit,
                with_payload=True,
                score_threshold=0.5  # Set minimum similarity threshold
            )
            
            # Convert Qdrant results to a format similar to Solr (updated for query_points return structure)
            docs = []
            for point in search_results.points:
                # Extract payload
                payload = point.payload
                
                # Create a document dict similar to Solr's output
                doc = {
                    "id": payload.get("original_id", ""),
                    "enbez": payload.get("enbez", ""),
                    "kurzue": payload.get("kurzue", ""),
                    "langue": payload.get("langue", ""),
                    "norm_type": payload.get("norm_type", ""),
                    "parent_document_id": payload.get("parent_document_id", ""),
                    "jurabk": payload.get("jurabk", ""),
                    "amtabk": payload.get("amtabk", ""),
                    "score": point.score,  # Similarity score from Qdrant (0-1)
                    "search_source": "semantic"
                }
                docs.append(doc)
            
            logger.info(f"Semantic search returned {len(docs)} results in {time.time() - start_time:.2f} seconds")
            return docs
            
        except Exception as e:
            logger.error(f"Error in semantic search: {e}")
            return []
    
    def combined_search(self, query: str, limit: int = DEFAULT_LIMIT) -> List[Dict]:
        """Perform hybrid search combining results from both keyword and semantic search.
        
        Args:
            query: Search query text
            limit: Maximum number of results to return
            
        Returns:
            List of document dicts with combined ranking
        """
        # Start both searches
        start_time = time.time()
        
        # Get results from both sources - increase the limit to get more candidates for hybrid ranking
        fetch_limit = max(limit * 3, 20)  # Get at least 20 results or 3x requested limit
        
        # Run keyword (Solr) search
        solr_results = self.solr_search(query, limit=fetch_limit)
        
        # Run semantic (Qdrant) search
        semantic_results = self.semantic_search(query, limit=fetch_limit)
        
        # Create a dictionary to combine results by document ID
        combined_results = {}
        
        # Process Solr results
        for doc in solr_results:
            doc_id = doc["id"]
            # Normalize Solr score (typically 0-20) to 0-1 scale
            # Use a more robust normalization strategy
            raw_score = float(doc["score"])
            
            # Sigmoid normalization (ensures values between 0-1 with a smoother curve)
            normalized_score = 1.0 / (1.0 + math.exp(-raw_score / 5 + 1))
            
            combined_results[doc_id] = {
                **doc,
                "keyword_score": normalized_score,
                "semantic_score": 0.0,
                "combined_score": normalized_score * self.keyword_weight
            }
        
        # Process semantic results and combine with existing entries or add new ones
        for doc in semantic_results:
            doc_id = doc["id"]
            if doc_id in combined_results:
                # Document exists in both result sets - update scores
                combined_results[doc_id]["semantic_score"] = doc["score"]
                combined_results[doc_id]["combined_score"] += doc["score"] * self.semantic_weight
                combined_results[doc_id]["search_source"] = "hybrid"
            else:
                # New document from semantic search
                doc["keyword_score"] = 0.0
                doc["semantic_score"] = doc["score"]
                doc["combined_score"] = doc["score"] * self.semantic_weight
                combined_results[doc_id] = doc
        
        # Convert dict to list and sort by combined score
        result_list = list(combined_results.values())
        result_list.sort(key=lambda x: x["combined_score"], reverse=True)
        
        # Limit results
        final_results = result_list[:limit]
        
        logger.info(f"Hybrid search returned {len(final_results)} results "
                   f"(from {len(solr_results)} keyword and {len(semantic_results)} semantic) "
                   f"in {time.time() - start_time:.2f} seconds")
        
        return final_results


def main():
    """Main function to run the hybrid search."""
    parser = argparse.ArgumentParser(description="ASRA Hybrid Search")
    parser.add_argument(
        "--query",
        type=str,
        required=True,
        help="Search query text"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_LIMIT,
        help=f"Maximum number of results to return (default: {DEFAULT_LIMIT})"
    )
    parser.add_argument(
        "--weights",
        type=str,
        default=f"{DEFAULT_WEIGHTS[0]},{DEFAULT_WEIGHTS[1]}",
        help=f"Relative weights for keyword vs semantic search as comma-separated values "
             f"(default: {DEFAULT_WEIGHTS[0]},{DEFAULT_WEIGHTS[1]})"
    )
    parser.add_argument(
        "--docker",
        action="store_true",
        help="Use Docker network endpoints (ollama, qdrant, solr)"
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
        "--solr",
        type=str,
        default=None,
        help="Solr endpoint URL (default: from env or localhost)"
    )
    
    args = parser.parse_args()
    
    # Set endpoints based on arguments
    global QDRANT_ENDPOINT, OLLAMA_ENDPOINT, SOLR_ENDPOINT
    
    if args.docker:
        logger.info("Using Docker network endpoints")
        QDRANT_ENDPOINT = DOCKER_QDRANT_ENDPOINT
        OLLAMA_ENDPOINT = DOCKER_OLLAMA_ENDPOINT
        SOLR_ENDPOINT = DOCKER_SOLR_ENDPOINT
    else:
        if args.qdrant:
            QDRANT_ENDPOINT = args.qdrant
        if args.ollama:
            OLLAMA_ENDPOINT = args.ollama
        if args.solr:
            SOLR_ENDPOINT = args.solr
    
    logger.info(f"Using Qdrant endpoint: {QDRANT_ENDPOINT}")
    logger.info(f"Using Ollama endpoint: {OLLAMA_ENDPOINT}")
    logger.info(f"Using Solr endpoint: {SOLR_ENDPOINT}")
    
    # Parse weights
    try:
        keyword_weight, semantic_weight = map(float, args.weights.split(',', 1))
        weights = (keyword_weight, semantic_weight)
    except ValueError:
        logger.warning(f"Invalid weights format: {args.weights}. Using default: {DEFAULT_WEIGHTS}")
        weights = DEFAULT_WEIGHTS
    
    # Initialize hybrid searcher
    hybrid_searcher = HybridSearcher(weights=weights)
    
    # Perform search
    results = hybrid_searcher.combined_search(args.query, args.limit)
    
    # Print results
    if results:
        logger.info(f"Top {len(results)} results for query: '{args.query}'")
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        logger.info(f"No results found for query: '{args.query}'")


if __name__ == "__main__":
    main()
