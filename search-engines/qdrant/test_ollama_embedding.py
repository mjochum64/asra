#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ASRA Ollama Embedding Test Script

This script tests the Ollama embedding API directly to diagnose issues with embedding generation.
It helps identify problems with the Ollama API and provides detailed diagnostics.

Usage:
    python3 test_ollama_embedding.py [--text "Your test text"] [--docker]

Options:
    --text      Text to generate embeddings for (default: uses sample text)
    --docker    Use Docker network endpoint instead of localhost
"""

import argparse
import json
import logging
import os
import sys
import time
import numpy as np
import requests
from typing import Dict, List, Optional, Union

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Configuration constants
DEFAULT_OLLAMA_ENDPOINT = "http://localhost:11434"
DOCKER_OLLAMA_ENDPOINT = "http://ollama:11434"
EMBEDDING_MODEL = "qllama/multilingual-e5-large-instruct:latest"

# Test parameters
MAX_RETRIES = 3
TEST_TEXT_LENGTHS = [100, 500, 1000, 2000, 4000]
TIMEOUT_BASE = 30  # Base timeout in seconds

def test_ollama_health(endpoint: str) -> bool:
    """Test if Ollama API is healthy and the model is available.
    
    Args:
        endpoint: Ollama API endpoint
        
    Returns:
        bool: True if Ollama is healthy, False otherwise
    """
    try:
        logger.info(f"Checking Ollama health at {endpoint}...")
        
        # Check if Ollama is running
        response = requests.get(f"{endpoint}/api/tags", timeout=5)
        response.raise_for_status()
        
        # Check if the model is available
        tags = response.json().get("models", [])
        available_models = [tag.get("name", "") for tag in tags]
        
        if EMBEDDING_MODEL not in available_models:
            logger.warning(f"Model {EMBEDDING_MODEL} not found in Ollama.")
            logger.info(f"Available models: {', '.join(available_models)}")
            return False
            
        logger.info(f"Ollama is healthy and model {EMBEDDING_MODEL} is available")
        return True
        
    except requests.exceptions.ConnectionError:
        logger.error(f"Could not connect to Ollama at {endpoint}. "
                    f"Make sure Ollama is running and accessible.")
        return False
    except requests.exceptions.RequestException as e:
        logger.error(f"Error checking Ollama health: {e}")
        return False

def generate_embedding(endpoint: str, text: str, retries: int = MAX_RETRIES) -> Optional[List[float]]:
    """Generate embedding for text using Ollama.
    
    Args:
        endpoint: Ollama API endpoint
        text: Text to generate embeddings for
        retries: Number of retries left
        
    Returns:
        List of embedding values or None if generation failed
    """
    if not text or text.strip() == "":
        logger.warning("Empty text provided for embedding. Skipping.")
        return None
        
    current_retry = MAX_RETRIES - retries
    if current_retry > 0:
        logger.info(f"Retry {current_retry}/{MAX_RETRIES}")
        time.sleep(2 ** current_retry)  # Exponential backoff
    
    text_length = len(text)
    
    # Adjust timeout based on text length
    timeout = TIMEOUT_BASE + (text_length // 200)
    
    request_data = {"model": EMBEDDING_MODEL, "prompt": text}
    logger.info(f"Generating embedding for text with {text_length} characters (timeout: {timeout}s)")
    
    try:
        # Log request details
        logger.info(f"Request to {endpoint}/api/embeddings with model {EMBEDDING_MODEL}")
        
        # Make the request
        start_time = time.time()
        response = requests.post(
            f"{endpoint}/api/embeddings",
            json=request_data,
            timeout=timeout
        )
        request_time = time.time() - start_time
        
        logger.info(f"Request completed in {request_time:.2f} seconds with status code {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Error from Ollama API: HTTP {response.status_code}: {response.text}")
            if retries > 0:
                return generate_embedding(endpoint, text, retries - 1)
            return None
        
        try:
            json_response = response.json()
            embedding = json_response.get("embedding", [])
            
            if not embedding or len(embedding) == 0:
                logger.warning(f"Empty embedding returned from Ollama")
                if retries > 0:
                    return generate_embedding(endpoint, text, retries - 1)
                return None
            
            logger.info(f"Successfully generated embedding with {len(embedding)} dimensions")
            return embedding
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Ollama response as JSON: {e}")
            logger.info(f"Raw response: {response.text[:200]}...")
            if retries > 0:
                return generate_embedding(endpoint, text, retries - 1)
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {e}")
        if retries > 0:
            return generate_embedding(endpoint, text, retries - 1)
        return None

def main():
    """Main function to run the test."""
    parser = argparse.ArgumentParser(description="Test Ollama embedding API")
    parser.add_argument("--text", type=str, default=None,
                      help="Text to generate embeddings for")
    parser.add_argument("--docker", action="store_true",
                      help="Use Docker network endpoint instead of localhost")
    parser.add_argument("--debug", action="store_true",
                      help="Enable debug logging")
    args = parser.parse_args()
    
    # Set log level
    if args.debug:
        logger.setLevel(logging.DEBUG)
    
    # Use Docker endpoint if specified
    endpoint = DOCKER_OLLAMA_ENDPOINT if args.docker else DEFAULT_OLLAMA_ENDPOINT
    logger.info(f"Using Ollama endpoint: {endpoint}")
    
    # Check Ollama health
    if not test_ollama_health(endpoint):
        logger.error("Ollama health check failed. Exiting.")
        sys.exit(1)
    
    # Generate sample text if not provided
    if args.text:
        test_text = args.text
        logger.info("Using user-provided text")
        
        # Generate embedding
        embedding = generate_embedding(endpoint, test_text)
        
        if embedding:
            logger.info(f"Successfully generated embedding with {len(embedding)} dimensions")
            logger.info(f"First few dimensions: {embedding[:5]}")
        else:
            logger.error("Failed to generate embedding for user-provided text")
    else:
        # Test with different text lengths
        logger.info("Running tests with various text lengths")
        
        sample_text = """
        Grundgesetz für die Bundesrepublik Deutschland
        
        Artikel 1
        (1) Die Würde des Menschen ist unantastbar. Sie zu achten und zu schützen ist Verpflichtung aller staatlichen Gewalt.
        (2) Das Deutsche Volk bekennt sich darum zu unverletzlichen und unveräußerlichen Menschenrechten als Grundlage jeder menschlichen Gemeinschaft, des Friedens und der Gerechtigkeit in der Welt.
        (3) Die nachfolgenden Grundrechte binden Gesetzgebung, vollziehende Gewalt und Rechtsprechung als unmittelbar geltendes Recht.
        
        Artikel 2
        (1) Jeder hat das Recht auf die freie Entfaltung seiner Persönlichkeit, soweit er nicht die Rechte anderer verletzt und nicht gegen die verfassungsmäßige Ordnung oder das Sittengesetz verstößt.
        (2) Jeder hat das Recht auf Leben und körperliche Unversehrtheit. Die Freiheit der Person ist unverletzlich. In diese Rechte darf nur auf Grund eines Gesetzes eingegriffen werden.
        """
        
        # Make sample text longer by repeating it
        long_sample_text = sample_text * 10
        
        results = []
        
        for length in TEST_TEXT_LENGTHS:
            test_text = long_sample_text[:length]
            logger.info(f"\n--- Testing with text length {length} ---")
            
            start_time = time.time()
            embedding = generate_embedding(endpoint, test_text)
            total_time = time.time() - start_time
            
            success = embedding is not None
            results.append({
                "length": length,
                "success": success,
                "time": round(total_time, 2),
                "dimensions": len(embedding) if embedding else 0
            })
            
            if embedding:
                logger.info(f"Success! Time: {total_time:.2f}s, Dimensions: {len(embedding)}")
            else:
                logger.error(f"Failed after {total_time:.2f}s")
            
            # Short pause between tests
            time.sleep(2)
        
        # Print summary
        logger.info("\n=== Test Summary ===")
        for result in results:
            status = "✓" if result["success"] else "✗"
            logger.info(f"{status} Length: {result['length']} chars, "
                        f"Time: {result['time']}s, "
                        f"Dimensions: {result['dimensions']}")
        
        success_rate = sum(1 for r in results if r["success"]) / len(results) * 100
        logger.info(f"Overall success rate: {success_rate:.1f}%")

if __name__ == "__main__":
    main()
