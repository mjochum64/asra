#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ASRA Qdrant Indexer

This script indexes German legal documents from either Solr or source XML files into Qdrant
for semantic vector search. It fetches documents, generates vector embeddings using Ollama,
and stores them in Qdrant with relevant metadata.

Usage:
    python3 qdrant_indexer.py [--source solr|xml] [--limit N]

Options:
    --source    Data source: 'solr' fetches from Solr index, 'xml' from source XML files (default: 'solr')
    --limit     Maximum number of documents to process (default: all)
    --recreate  Recreate the Qdrant collection if it exists
    --docker    Use Docker network endpoints instead of localhost
"""

import argparse
import hashlib
import json
import logging
import os
import sys
import time
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple, Union

import requests
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
from qdrant_client.http.exceptions import UnexpectedResponse

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
XML_DIR = "../solr/demodata"
COLLECTION_NAME = "deutsche_gesetze"
EMBEDDING_MODEL = "qllama/multilingual-e5-large-instruct:latest"  # Updated to match exact model name with tag
# Vector dimension for E5 model (needs to be determined by testing)
VECTOR_SIZE = 1024  # This is an estimate, we'll verify after the first embedding
BATCH_SIZE = 10  # Number of documents to process in a batch
MAX_TEXT_LENGTH = 8000  # Maximum text length for embedding
MAX_RETRIES = 3  # Maximum number of retries for failed embedding requests
RETRY_DELAY = 2  # Delay in seconds between retries


def generate_consistent_numeric_id(id_string: str) -> int:
    """Generate a consistent numeric ID from a string.
    
    Args:
        id_string: Original document ID string
        
    Returns:
        int: A consistent numeric ID based on the hash of the string
    """
    # Use MD5 hash to generate a consistent numeric value from the string
    # We only need the first 16 characters (64 bits) of the hex digest
    hex_digest = hashlib.md5(id_string.encode()).hexdigest()[:16]
    # Convert to a positive integer (max 64 bits)
    return int(hex_digest, 16) % (2**63)


class QdrantIndexer:
    """Class to handle the indexing of documents into Qdrant."""
    
    def __init__(self, recreate: bool = False):
        """Initialize the Qdrant indexer.
        
        Args:
            recreate: Whether to recreate the collection if it exists
        """
        self.qdrant_client = QdrantClient(url=QDRANT_ENDPOINT)
        self.actual_vector_size = None  # Will be set after the first embedding
        self.recreate = recreate
        
        # Check Ollama API health
        self.check_ollama_health()
        
    def check_ollama_health(self) -> bool:
        """Check if Ollama API is healthy and the model is available.
        
        Returns:
            bool: True if Ollama is healthy, False otherwise
        """
        try:
            logger.info(f"Checking Ollama health at {OLLAMA_ENDPOINT}...")
            
            # Check if Ollama is running
            response = requests.get(f"{OLLAMA_ENDPOINT}/api/tags", timeout=5)
            response.raise_for_status()
            
            # Check if the model is available
            tags = response.json().get("models", [])
            model_available = False
            
            for tag in tags:
                if tag.get("name", "") == EMBEDDING_MODEL:
                    model_available = True
                    break
            
            if not model_available:
                logger.warning(f"Model {EMBEDDING_MODEL} not found in Ollama. "
                              f"Available models: {', '.join([tag.get('name', '') for tag in tags])}")
                logger.warning("Indexing may fail if the model is not available.")
                return False
                
            logger.info(f"Ollama is healthy and model {EMBEDDING_MODEL} is available.")
            return True
            
        except requests.exceptions.ConnectionError:
            logger.error(f"Could not connect to Ollama at {OLLAMA_ENDPOINT}. "
                        f"Make sure Ollama is running and accessible.")
            return False
        except requests.exceptions.RequestException as e:
            logger.error(f"Error checking Ollama health: {e}")
            return False
        self.recreate = recreate
    
    def create_collection_if_not_exists(self) -> None:
        """Check if the collection exists, if not create it."""
        try:
            # Check if collection already exists
            collections = self.qdrant_client.get_collections()
            if COLLECTION_NAME in [c.name for c in collections.collections]:
                if self.recreate:
                    logger.info(f"Recreating collection '{COLLECTION_NAME}'...")
                    self.qdrant_client.delete_collection(COLLECTION_NAME)
                else:
                    logger.info(f"Collection '{COLLECTION_NAME}' already exists.")
                    # Get actual vector size from existing collection
                    collection_info = self.qdrant_client.get_collection(COLLECTION_NAME)
                    self.actual_vector_size = collection_info.config.params.vectors.size
                    logger.info(f"Vector size in existing collection: {self.actual_vector_size}")
                    return
            
            # If we don't know the vector size yet, use the estimate
            vector_size = self.actual_vector_size or VECTOR_SIZE
            
            # Create a new collection
            self.qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=qdrant_models.VectorParams(
                    size=vector_size,
                    distance=qdrant_models.Distance.COSINE
                )
            )
            logger.info(f"Created collection '{COLLECTION_NAME}' with vector size {vector_size}")
        except Exception as e:
            logger.error(f"Error creating collection: {e}")
            raise
    
    def generate_embedding(self, text: str, retries: int = MAX_RETRIES) -> Optional[List[float]]:
        """Generate embeddings for text using Ollama.

        Args:
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
            logger.info(f"Retry {current_retry}/{MAX_RETRIES} for embedding generation")
            time.sleep(RETRY_DELAY * (2**current_retry))  # Exponential backoff
        
        # Prepare text excerpt for logging (first 50 chars)
        text_sample = text[:50] + "..." if len(text) > 50 else text
        
        try:
            logger.debug(f"Generating embedding for text: '{text_sample}'")
            
            response = requests.post(
                f"{OLLAMA_ENDPOINT}/api/embeddings",
                json={"model": EMBEDDING_MODEL, "prompt": text},
                timeout=30  # 30 second timeout
            )
            
            if response.status_code != 200:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                logger.error(f"Error from Ollama API: {error_msg}")
                if retries > 0:
                    return self.generate_embedding(text, retries - 1)
                return None
            
            json_response = response.json()
            embedding = json_response.get("embedding", [])
            
            if not embedding or len(embedding) == 0:
                logger.warning(f"Empty embedding returned from Ollama: {json_response}")
                if retries > 0:
                    return self.generate_embedding(text, retries - 1)
                return None
            
            # Update actual vector size if this is the first embedding
            if self.actual_vector_size is None:
                self.actual_vector_size = len(embedding)
                logger.info(f"Detected vector size: {self.actual_vector_size}")
            
            return embedding
        except requests.exceptions.RequestException as e:
            logger.error(f"Error generating embedding: {e}")
            if retries > 0:
                return self.generate_embedding(text, retries - 1)
            return None
    
    def index_document(self, doc_id: str, text: str, payload: Dict) -> bool:
        """Index a single document into Qdrant.

        Args:
            doc_id: Document ID
            text: Text to generate embeddings for
            payload: Additional metadata for the document
            
        Returns:
            bool: True if indexing succeeded, False otherwise
        """
        try:
            # Limit text length to avoid potential issues with large texts
            text_to_embed = text
            if len(text_to_embed) > MAX_TEXT_LENGTH:
                text_to_embed = text_to_embed[:MAX_TEXT_LENGTH]
                logger.info(f"Truncated text to {MAX_TEXT_LENGTH} chars (original length: {len(text)})")
            
            # Generate embedding
            embedding = self.generate_embedding(text_to_embed)
            
            if not embedding:
                logger.warning(f"Failed to generate embedding for document {doc_id}. Skipping.")
                return False
            
            # Generate a consistent numeric ID based on the original ID
            numeric_id = generate_consistent_numeric_id(doc_id)
            
            # Store original ID in payload
            payload_with_id = payload.copy()
            payload_with_id["original_id"] = doc_id
            
            # Store in Qdrant
            self.qdrant_client.upsert(
                collection_name=COLLECTION_NAME,
                points=[
                    qdrant_models.PointStruct(
                        id=numeric_id,
                        payload=payload_with_id,
                        vector=embedding
                    )
                ]
            )
            logger.info(f"Indexed document {doc_id} (numeric ID: {numeric_id})")
            return True
        except Exception as e:
            logger.error(f"Error indexing document {doc_id}: {e}")
            return False
    
    def index_batch(self, documents: List[Dict]) -> int:
        """Index a batch of documents into Qdrant.

        Args:
            documents: List of documents, each with id, text, and payload
            
        Returns:
            int: Number of documents successfully indexed
        """
        try:
            points = []
            success_count = 0
            
            for doc in documents:
                try:
                    doc_id = doc["id"]
                    
                    # Validate the doc has required fields
                    if not doc.get("text"):
                        logger.warning(f"Document {doc_id} has no text content. Skipping.")
                        continue
                    
                    # Limit text length to avoid potential issues with large texts
                    text_to_embed = doc["text"]
                    text_length = len(text_to_embed)
                    
                    if text_length < 10:  # Arbitrary minimum length for meaningful content
                        logger.warning(f"Document {doc_id} has too little text ({text_length} chars): '{text_to_embed}'. Skipping.")
                        continue
                    
                    if text_length > MAX_TEXT_LENGTH:
                        text_to_embed = text_to_embed[:MAX_TEXT_LENGTH]
                        logger.info(f"Truncated document {doc_id} text to {MAX_TEXT_LENGTH} chars (original length: {text_length})")
                    
                    # Generate embedding
                    embedding = self.generate_embedding(text_to_embed)
                    
                    if not embedding:
                        logger.warning(f"Failed to generate embedding for document {doc_id} with text length {text_length}. Skipping.")
                        continue
                    
                    if len(embedding) == 0:
                        logger.warning(f"Empty embedding returned for document {doc_id}. Skipping.")
                        continue
                    
                    # Generate a consistent numeric ID based on the original ID
                    numeric_id = generate_consistent_numeric_id(doc_id)
                    
                    # Add original ID to payload
                    payload = doc["payload"].copy()
                    payload["original_id"] = doc_id
                    
                    # Create point
                    point = qdrant_models.PointStruct(
                        id=numeric_id,
                        payload=payload,
                        vector=embedding
                    )
                    points.append(point)
                    success_count += 1
                except Exception as e:
                    logger.error(f"Error processing document {doc.get('id', 'unknown')}: {e}")
                    continue
            
            if not points:
                logger.warning("No valid points to index in this batch.")
                return 0
                
            # Store all points in one request
            self.qdrant_client.upsert(
                collection_name=COLLECTION_NAME,
                points=points
            )
            logger.info(f"Indexed batch of {len(points)} documents")
            return success_count
        except Exception as e:
            logger.error(f"Error indexing batch: {e}")
            return 0


class SolrDocumentFetcher:
    """Class to fetch documents from Solr."""
    
    def __init__(self, limit: Optional[int] = None):
        """Initialize the Solr document fetcher.
        
        Args:
            limit: Maximum number of documents to fetch (None for all)
        """
        self.limit = limit
    
    def fetch_documents(self) -> List[Dict]:
        """Fetch documents from Solr.
        
        Returns:
            List of documents with their metadata
        """
        try:
            # Determine how many documents to fetch
            rows = self.limit if self.limit else 10000  # Large number to get all docs
            
            # Query all documents
            response = requests.get(
                f"{SOLR_ENDPOINT}/select",
                params={
                    "q": "*:*",
                    "rows": rows,
                    "fl": "id,enbez,kurzue,langue,text_content,text_content_html,norm_type,parent_document_id,jurabk,amtabk"
                }
            )
            response.raise_for_status()
            
            # Parse response
            docs = response.json().get("response", {}).get("docs", [])
            logger.info(f"Fetched {len(docs)} documents from Solr")
            
            processed_docs = []
            for doc in docs:
                # Extract text content preferring HTML version if available
                text_content = doc.get("text_content_html", doc.get("text_content", ""))
                
                # Handle empty content
                if not text_content:
                    logger.warning(f"Empty text content for document {doc.get('id', 'unknown')}. Will attempt to use metadata.")
                
                # Handle list type content (sometimes Solr returns arrays)
                if isinstance(text_content, list):
                    text_content = " ".join(filter(None, text_content))
                
                # Create a clean version of the text (without HTML tags)
                # For simplicity, using a naive approach, consider using a proper HTML parser
                import re
                clean_text = re.sub(r'<[^>]+>', ' ', text_content)
                clean_text = ' '.join(clean_text.split())
                
                # If text is still empty, try to build some content from metadata
                if not clean_text.strip():
                    metadata_text = []
                    if doc.get("enbez"):
                        metadata_text.append(f"Titel: {doc.get('enbez')}")
                    if doc.get("kurzue"):
                        metadata_text.append(f"Kurzüberschrift: {doc.get('kurzue')}")
                    if doc.get("jurabk"):
                        metadata_text.append(f"Juristische Abkürzung: {doc.get('jurabk')}")
                    
                    # Use metadata as content if available
                    if metadata_text:
                        clean_text = " ".join(metadata_text)
                        logger.info(f"Using metadata as text content for document {doc.get('id', 'unknown')}")
                
                # Create payload with metadata
                payload = {
                    "id": doc.get("id", ""),
                    "enbez": doc.get("enbez", ""),
                    "kurzue": doc.get("kurzue", ""),
                    "langue": doc.get("langue", ""),
                    "norm_type": doc.get("norm_type", ""),
                    "parent_document_id": doc.get("parent_document_id", ""),
                    "jurabk": doc.get("jurabk", ""),
                    "amtabk": doc.get("amtabk", ""),
                }
                
                # Only include documents with actual content to embed
                if clean_text.strip():
                    processed_docs.append({
                        "id": doc.get("id", ""),
                        "text": clean_text,
                        "payload": payload
                    })
                else:
                    logger.warning(f"Skipping document {doc.get('id', 'unknown')} due to empty text content after processing")
                
            return processed_docs
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching documents from Solr: {e}")
            return []


class XMLDocumentFetcher:
    """Class to fetch documents from XML source files."""
    
    def __init__(self, xml_dir: str, limit: Optional[int] = None):
        """Initialize the XML document fetcher.
        
        Args:
            xml_dir: Directory containing XML files
            limit: Maximum number of documents to fetch (None for all)
        """
        self.xml_dir = xml_dir
        self.limit = limit
        # Counter for generating unique IDs
        self.id_counter = 0
    
    def fetch_documents(self) -> List[Dict]:
        """Fetch documents from XML files.
        
        Returns:
            List of documents with their metadata
        """
        processed_docs = []
        doc_count = 0
        
        try:
            # Find all XML files in the directory
            xml_files = []
            for file in os.listdir(self.xml_dir):
                if file.endswith(".xml"):
                    xml_files.append(os.path.join(self.xml_dir, file))
            
            logger.info(f"Found {len(xml_files)} XML files")
            
            # Process each XML file
            for xml_file in xml_files:
                try:
                    tree = ET.parse(xml_file)
                    root = tree.getroot()
                    
                    # Extract basic document metadata
                    doknr = root.find(".//doknr")
                    amtabk = root.find(".//amtabk")
                    jurabk = root.find(".//jurabk")
                    langue = root.find(".//langue")
                    kurzue = root.find(".//kurzue")
                    
                    base_metadata = {
                        "doknr": doknr.text if doknr is not None else "",
                        "amtabk": amtabk.text if amtabk is not None else "",
                        "jurabk": jurabk.text if jurabk is not None else "",
                        "langue": langue.text if langue is not None else "",
                        "kurzue": kurzue.text if kurzue is not None else "",
                    }
                    
                    # Process norms (articles, sections, etc.)
                    for norm in root.findall(".//norm"):
                        self.id_counter += 1
                        
                        # Extract norm metadata
                        enbez = norm.find("./enbez")
                        norm_text = norm.find("./textdaten/text/Content")
                        
                        # Extract text content
                        text_content = ""
                        if norm_text is not None:
                            # Convert the XML element to a string
                            text_content = ET.tostring(norm_text, encoding='unicode', method='text')
                        
                        # Create a normalized ID
                        norm_id = f"{base_metadata['doknr']}_{self.id_counter}"
                        
                        # Create payload with metadata
                        payload = {
                            **base_metadata,
                            "id": norm_id,
                            "enbez": enbez.text if enbez is not None else "",
                            "norm_type": "article",  # Simple assumption, might need more complex logic
                            "parent_document_id": base_metadata["doknr"],
                        }
                        
                        processed_docs.append({
                            "id": norm_id,
                            "text": text_content,
                            "payload": payload
                        })
                        
                        doc_count += 1
                        if self.limit and doc_count >= self.limit:
                            break
                    
                    # If we've reached the limit, stop processing
                    if self.limit and doc_count >= self.limit:
                        break
                        
                except Exception as e:
                    logger.error(f"Error processing XML file {xml_file}: {e}")
            
            logger.info(f"Extracted {len(processed_docs)} norms from XML files")
            return processed_docs
            
        except Exception as e:
            logger.error(f"Error fetching documents from XML: {e}")
            return []


def main():
    """Main function to run the indexer."""
    parser = argparse.ArgumentParser(description="ASRA Qdrant Indexer")
    parser.add_argument(
        "--source", 
        choices=["solr", "xml"], 
        default="solr",
        help="Source of documents: 'solr' for Solr index, 'xml' for source XML files"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum number of documents to process"
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
    parser.add_argument(
        "--docker",
        action="store_true",
        help="Use Docker network endpoints (ollama, qdrant, solr)"
    )
    parser.add_argument(
        "--recreate",
        action="store_true",
        help="Recreate the collection if it exists"
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
    
    try:
        # Initialize Qdrant indexer
        indexer = QdrantIndexer(recreate=args.recreate)
        indexer.create_collection_if_not_exists()
        
        # Fetch documents from source
        if args.source == "solr":
            logger.info("Fetching documents from Solr...")
            fetcher = SolrDocumentFetcher(limit=args.limit)
        else:  # xml
            logger.info("Fetching documents from XML files...")
            fetcher = XMLDocumentFetcher(xml_dir=XML_DIR, limit=args.limit)
        
        documents = fetcher.fetch_documents()
        
        if not documents:
            logger.warning("No documents found to index")
            return
        
        logger.info(f"Starting to index {len(documents)} documents")
        start_time = time.time()
        successful_docs = 0
        
        # Process in batches to improve performance
        total_batches = (len(documents) - 1) // BATCH_SIZE + 1
        for i in range(0, len(documents), BATCH_SIZE):
            batch = documents[i:i+BATCH_SIZE]
            current_batch = i // BATCH_SIZE + 1
            logger.info(f"Processing batch {current_batch}/{total_batches} ({i+1}-{min(i+BATCH_SIZE, len(documents))}/{len(documents)})")
            
            # Index batch and count successful documents
            success_count = indexer.index_batch(batch)
            successful_docs += success_count
            
            # Print progress
            elapsed = time.time() - start_time
            docs_per_second = i / elapsed if elapsed > 0 else 0
            estimated_total = elapsed / i * len(documents) if i > 0 else 0
            remaining = estimated_total - elapsed if estimated_total > 0 else 0
            
            logger.info(f"Progress: {i+1}/{len(documents)} documents processed "
                       f"({docs_per_second:.2f} docs/sec, {int(remaining/60)} mins remaining)")
        
        # Print summary
        total_time = time.time() - start_time
        logger.info(f"Indexing complete! {successful_docs}/{len(documents)} documents indexed successfully "
                   f"in {total_time:.2f} seconds ({successful_docs/total_time:.2f} docs/sec)")
        
    except Exception as e:
        logger.error(f"Error in indexing process: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
