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

# German stopwords list - common words that should not trigger semantic search
GERMAN_STOPWORDS = {
    'aber', 'alle', 'allem', 'allen', 'aller', 'alles', 'als', 'also', 'am', 'an', 'ander', 'andere', 
    'anderem', 'anderen', 'anderer', 'anderes', 'anderm', 'andern', 'anderr', 'anders', 'auch', 'auf', 
    'aus', 'bei', 'bin', 'bis', 'bist', 'da', 'damit', 'dann', 'das', 'dass', 'dasselbe', 'dazu', 
    'den', 'denn', 'der', 'des', 'dessen', 'desselben', 'dem', 'demselben', 'die', 'dies', 'diese', 
    'dieselbe', 'dieselben', 'diesem', 'diesen', 'dieser', 'dieses', 'dir', 'doch', 'dort', 'durch', 
    'ein', 'eine', 'einem', 'einen', 'einer', 'eines', 'einig', 'einige', 'einigem', 'einigen', 
    'einiger', 'einiges', 'einmal', 'er', 'es', 'etwas', 'für', 'gegen', 'gewesen', 'hab', 'habe', 
    'haben', 'hat', 'hatte', 'hatten', 'hier', 'hin', 'hinter', 'ich', 'ihm', 'ihn', 'ihnen', 'ihr', 
    'ihre', 'ihrem', 'ihren', 'ihrer', 'ihres', 'im', 'in', 'indem', 'ins', 'ist', 'ja', 'je', 'jeden', 
    'jedem', 'jeder', 'jedes', 'jene', 'jenem', 'jenen', 'jener', 'jenes', 'jetzt', 'kann', 'kein', 
    'keine', 'keinem', 'keinen', 'keiner', 'keines', 'können', 'könnte', 'machen', 'man', 'manche', 
    'manchem', 'manchen', 'mancher', 'manches', 'mein', 'meine', 'meinem', 'meinen', 'meiner', 'meines', 
    'mit', 'muss', 'musste', 'nach', 'nicht', 'nichts', 'noch', 'nun', 'nur', 'ob', 'oder', 'ohne', 
    'sehr', 'sein', 'seine', 'seinem', 'seinen', 'seiner', 'seines', 'selbst', 'sich', 'sie', 'sind', 
    'so', 'solche', 'solchem', 'solchen', 'solcher', 'solches', 'soll', 'sollte', 'sondern', 'sonst', 
    'über', 'um', 'und', 'uns', 'unse', 'unsem', 'unsen', 'unser', 'unses', 'unter', 'viel', 'vom', 
    'von', 'vor', 'war', 'waren', 'warst', 'was', 'weg', 'weil', 'weiter', 'welche', 'welchem', 'welchen', 
    'welcher', 'welches', 'wenn', 'werde', 'werden', 'wie', 'wieder', 'will', 'wir', 'wird', 'wirst', 
    'wo', 'wollen', 'wollte', 'würde', 'würden', 'zu', 'zum', 'zur', 'zwar', 'zwischen'
}


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
    
    def is_stopword_query(self, query: str) -> bool:
        """Check if the query consists mainly of stopwords.
        
        Args:
            query: The search query text
            
        Returns:
            True if query is mainly stopwords, False otherwise
        """
        if not query or not query.strip():
            return True
            
        # Split query into words and normalize to lowercase
        words = [word.strip().lower() for word in query.split() if word.strip()]
        
        if not words:
            return True
            
        # Count stopwords
        stopword_count = sum(1 for word in words if word in GERMAN_STOPWORDS)
        
        # If more than 80% are stopwords, consider it a stopword query
        stopword_ratio = stopword_count / len(words)
        
        logger.info(f"Query '{query}': {stopword_count}/{len(words)} stopwords ({stopword_ratio:.1%})")
        
        return stopword_ratio > 0.8
    
    def should_use_semantic_search(self, query: str) -> bool:
        """Determine if semantic search should be used for this query.
        
        Args:
            query: The search query text
            
        Returns:
            True if semantic search should be used, False otherwise
        """
        # Don't use semantic search for stopword queries
        if self.is_stopword_query(query):
            logger.info(f"Skipping semantic search for stopword query: '{query}'")
            return False
            
        # Don't use semantic search for very short queries (1-2 characters)
        if len(query.strip()) <= 2:
            logger.info(f"Skipping semantic search for very short query: '{query}'")
            return False
            
        # Don't use semantic search for single common words
        words = query.strip().lower().split()
        if len(words) == 1 and words[0] in GERMAN_STOPWORDS:
            logger.info(f"Skipping semantic search for single stopword: '{query}'")
            return False
            
        return True
    
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
                "fl": "id,enbez,kurzue,langue,norm_type,parent_document_id,jurabk,amtabk,text_content,text_content_html,fussnoten_content_html,score",
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
    
    def get_solr_documents_by_ids(self, doc_ids: List[str]) -> Dict[str, Dict]:
        """Retrieve full document data from Solr by document IDs.
        
        Args:
            doc_ids: List of document IDs to retrieve
            
        Returns:
            Dictionary mapping document ID to full document data
        """
        if not doc_ids:
            return {}
            
        try:
            start_time = time.time()
            
            # Build query to fetch documents by IDs
            id_query = " OR ".join([f'id:"{doc_id}"' for doc_id in doc_ids])
            
            params = {
                "q": id_query,
                "rows": len(doc_ids),
                "fl": "*",  # Get all fields for complete document data
                "wt": "json"
            }
            
            response = requests.get(
                f"{SOLR_ENDPOINT}/select",
                params=params
            )
            response.raise_for_status()
            
            result = response.json()
            docs = result.get("response", {}).get("docs", [])
            
            # Create dictionary mapping ID to document
            doc_dict = {doc["id"]: doc for doc in docs}
            
            logger.info(f"Retrieved {len(doc_dict)} full documents from Solr in {time.time() - start_time:.2f} seconds")
            return doc_dict
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error retrieving documents from Solr: {e}")
            return {}
    
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
        
        This method uses a two-stage approach:
        1. Get relevance scores from both Solr (keyword) and Qdrant (semantic)
        2. Retrieve full document data from Solr for all relevant documents
        
        Smart filtering is applied to avoid irrelevant semantic matches for stopword queries.
        
        Args:
            query: Search query text
            limit: Maximum number of results to return
            
        Returns:
            List of document dicts with combined ranking and full content
        """
        # Start both searches
        start_time = time.time()
        
        # Always run keyword search
        fetch_limit = max(limit * 3, 20)  # Get at least 20 results or 3x requested limit
        solr_results = self.solr_search(query, limit=fetch_limit)
        
        # Determine if we should use semantic search based on query quality
        use_semantic = self.should_use_semantic_search(query)
        
        if use_semantic:
            # Run semantic search only for meaningful queries
            semantic_results = self.semantic_search(query, limit=fetch_limit)
        else:
            # Skip semantic search for stopword/low-quality queries
            semantic_results = []
            logger.info("Semantic search skipped - using keyword results only")
        
        # Create a dictionary to combine results by document ID
        combined_results = {}
        all_doc_ids = set()
        
        # Process Solr results
        for doc in solr_results:
            doc_id = doc["id"]
            all_doc_ids.add(doc_id)
            # Normalize Solr score (typically 0-20) to 0-1 scale
            raw_score = float(doc["score"])
            
            # Sigmoid normalization (ensures values between 0-1 with a smoother curve)
            normalized_score = 1.0 / (1.0 + math.exp(-raw_score / 5 + 1))
            
            # If semantic search was skipped, give full weight to keyword results
            if not use_semantic:
                combined_results[doc_id] = {
                    "keyword_score": normalized_score,
                    "semantic_score": 0.0,
                    "combined_score": normalized_score,  # Full score since no semantic
                    "search_source": "keyword"
                }
            else:
                combined_results[doc_id] = {
                    "keyword_score": normalized_score,
                    "semantic_score": 0.0,
                    "combined_score": normalized_score * self.keyword_weight,
                    "search_source": "keyword"
                }
        
        # Process semantic results only if semantic search was used
        if use_semantic:
            for doc in semantic_results:
                doc_id = doc["id"]
                all_doc_ids.add(doc_id)
                
                if doc_id in combined_results:
                    # Document exists in both result sets - update scores
                    combined_results[doc_id]["semantic_score"] = doc["score"]
                    combined_results[doc_id]["combined_score"] += doc["score"] * self.semantic_weight
                    combined_results[doc_id]["search_source"] = "hybrid"
                else:
                    # New document from semantic search only
                    combined_results[doc_id] = {
                        "keyword_score": 0.0,
                        "semantic_score": doc["score"],
                        "combined_score": doc["score"] * self.semantic_weight,
                        "search_source": "semantic"
                    }
        
        # Retrieve full document data from Solr for all document IDs
        logger.info(f"Retrieving full document data for {len(all_doc_ids)} documents from Solr")
        full_documents = self.get_solr_documents_by_ids(list(all_doc_ids))
        
        # Merge scoring information with full document data
        final_results = []
        for doc_id, score_info in combined_results.items():
            if doc_id in full_documents:
                # Merge full document data with hybrid search scores
                full_doc = full_documents[doc_id]
                full_doc.update({
                    "keyword_score": score_info["keyword_score"],
                    "semantic_score": score_info["semantic_score"], 
                    "combined_score": score_info["combined_score"],
                    "search_source": score_info["search_source"],
                    "score": score_info["combined_score"]  # Set score to combined score for sorting
                })
                final_results.append(full_doc)
            else:
                logger.warning(f"Document {doc_id} not found in Solr but was in search results")
        
        # Sort by combined score
        final_results.sort(key=lambda x: x["combined_score"], reverse=True)
        
        # Limit results
        final_results = final_results[:limit]
        
        search_type = "keyword-only" if not use_semantic else "hybrid"
        logger.info(f"{search_type.title()} search returned {len(final_results)} results "
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
