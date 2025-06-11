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
import numpy as np
import requests
import concurrent.futures
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
BATCH_SIZE = 5  # Reduzierte Batchgröße für stabilere Verarbeitung
MAX_TEXT_LENGTH = 1950  # Optimiert basierend auf Textlängen-Analyse: erfasst 95% der Dokumente vollständig
MAX_RETRIES = 3  # Anzahl von Wiederholungsversuchen
RETRY_DELAY = 2  # Wartezeit zwischen Wiederholungsversuchen
MAX_CONCURRENT_REQUESTS = 1  # Anzahl gleichzeitiger Anfragen an Ollama API
REQUEST_THROTTLE_DELAY = 1  # Verzögerung zwischen aufeinanderfolgenden Anfragen in Sekunden
CHUNK_SIZE = 1800  # Optimiert: weniger unnötiges Chunking, näher an MAX_TEXT_LENGTH


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
        self.last_request_time = 0  # Zeitstempel der letzten Anfrage für Rate Limiting
        self.request_executor = concurrent.futures.ThreadPoolExecutor(max_workers=MAX_CONCURRENT_REQUESTS)
        
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
            available_models = []
            
            for tag in tags:
                model_name = tag.get("name", "")
                available_models.append(model_name)
                if model_name == EMBEDDING_MODEL:
                    model_available = True
                    break
            
            if not model_available:
                logger.warning(f"Model {EMBEDDING_MODEL} not found in Ollama. "
                              f"Available models: {', '.join(available_models)}")
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
    
    def _text_to_chunks(self, text: str, chunk_size: int = CHUNK_SIZE) -> List[str]:
        """Split text into chunks of approximately equal size.
        
        Args:
            text: Text to split into chunks
            chunk_size: Maximum size of each chunk in characters
            
        Returns:
            List of text chunks
        """
        if len(text) <= chunk_size:
            return [text]
        
        # Einfaches Chunking nach Absätzen mit überlappenden Grenzen
        chunks = []
        paragraphs = text.split('\n\n')
        current_chunk = ""
        
        for para in paragraphs:
            if len(current_chunk) + len(para) <= chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        # Zu kurze Chunks zusammenfassen
        optimized_chunks = []
        current_chunk = ""
        min_chunk_size = chunk_size // 3  # Mindestgröße für einen Chunk
        
        for chunk in chunks:
            if len(current_chunk) + len(chunk) <= chunk_size:
                current_chunk += chunk + " "
            else:
                if current_chunk:
                    optimized_chunks.append(current_chunk.strip())
                current_chunk = chunk + " "
        
        if current_chunk:
            optimized_chunks.append(current_chunk.strip())
        
        logger.info(f"Split text of {len(text)} chars into {len(optimized_chunks)} chunks")
        return optimized_chunks
    
    def _smart_truncate_legal_text(self, text: str, max_length: int = MAX_TEXT_LENGTH) -> str:
        """Intelligently truncate legal text preserving important content.
        
        Args:
            text: Original text to truncate
            max_length: Maximum length in characters
            
        Returns:
            Truncated text preserving legal structure
        """
        if len(text) <= max_length:
            return text
        
        # For legal texts, prioritize:
        # 1. First paragraph (usually contains the main rule)
        # 2. Numbered/lettered subsections
        # 3. Complete sentences
        
        paragraphs = text.split('\n\n')
        result = ""
        
        # Always include first paragraph if it fits
        if paragraphs and len(paragraphs[0]) <= max_length * 0.6:
            result = paragraphs[0] + "\n\n"
            remaining_length = max_length - len(result)
            paragraphs = paragraphs[1:]
        else:
            remaining_length = max_length
        
        # Add remaining paragraphs by priority
        for para in paragraphs:
            # Prioritize paragraphs with numbers, letters, or legal keywords
            if any(keyword in para.lower() for keyword in ['(1)', '(2)', 'absatz', 'satz', 'nummer']):
                if len(result + para) <= max_length:
                    result += para + "\n\n"
                    continue
            
            # For other paragraphs, try to fit complete sentences
            sentences = para.split('. ')
            for sentence in sentences:
                if len(result + sentence + '. ') <= max_length:
                    result += sentence + '. '
                else:
                    break
            
            if len(result) >= max_length * 0.9:
                break
        
        return result.strip()
    
    def _ai_summarize_text(self, text: str, max_length: int = MAX_TEXT_LENGTH) -> Optional[str]:
        """Summarize text using AI for very long documents.
        
        Args:
            text: Original text to summarize
            max_length: Target maximum length
            
        Returns:
            Summarized text or None if summarization failed
        """
        if len(text) <= max_length:
            return text
        
        # Only use AI summarization for very long texts (>4000 chars)
        if len(text) < 4000:
            return None
        
        logger.info(f"Attempting AI summarization for {len(text)} character text")
        
        prompt = f"""Fasse den folgenden deutschen Rechtstext präzise zusammen. 
Bewahre alle wichtigen rechtlichen Bestimmungen, Definitionen und Verweise.
Zielgröße: maximal {max_length} Zeichen.

Text:
{text}

Zusammenfassung:"""

        try:
            response = requests.post(
                f"{OLLAMA_ENDPOINT}/api/generate",
                json={
                    "model": "llama3.2:3b",  # Kleineres Modell für Summarization
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,  # Konservativ für rechtliche Texte
                        "top_p": 0.9
                    }
                },
                timeout=60
            )
            
            if response.status_code == 200:
                summary = response.json().get("response", "").strip()
                if summary and len(summary) <= max_length:
                    logger.info(f"AI summarization successful: {len(text)} -> {len(summary)} chars")
                    return summary
                else:
                    logger.warning(f"AI summary too long or empty: {len(summary)} chars")
            else:
                logger.warning(f"AI summarization failed with status {response.status_code}")
                
        except Exception as e:
            logger.warning(f"Error in AI summarization: {e}")
        
        return None
    
    def _apply_rate_limit(self):
        """Apply rate limiting to avoid overloading the Ollama API."""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < REQUEST_THROTTLE_DELAY:
            sleep_time = REQUEST_THROTTLE_DELAY - time_since_last_request
            logger.debug(f"Rate limiting applied: waiting {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def _single_embedding_request(self, text: str, timeout: int = 60) -> Optional[List[float]]:
        """Make a single request to the Ollama API for embedding generation.
        
        Args:
            text: Text to generate embedding for
            timeout: Request timeout in seconds
            
        Returns:
            Embedding vector or None if request failed
        """
        self._apply_rate_limit()
        
        request_data = {"model": EMBEDDING_MODEL, "prompt": text}
        logger.debug(f"Sending embedding request for {len(text)} characters of text")
        
        try:
            response = requests.post(
                f"{OLLAMA_ENDPOINT}/api/embeddings",
                json=request_data,
                timeout=timeout
            )
            
            if response.status_code != 200:
                logger.error(f"HTTP {response.status_code}: {response.text}")
                return None
            
            try:
                json_response = response.json()
                embedding = json_response.get("embedding", [])
                
                if not embedding or len(embedding) == 0:
                    logger.warning(f"Empty embedding returned from Ollama")
                    return None
                
                logger.debug(f"Successfully generated embedding with {len(embedding)} dimensions")
                return embedding
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Ollama response as JSON: {e}")
                logger.debug(f"Raw response: {response.text[:200]}...")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {e}")
            return None
    
    def _progressively_generate_embedding(self, text: str) -> Optional[List[float]]:
        """Try to generate embeddings with progressively shorter text if necessary.
        
        Args:
            text: Original text to generate embedding for
            
        Returns:
            Embedding vector or None if all attempts failed
        """
        # Versuche zuerst mit der maximalen Länge
        max_length = min(len(text), MAX_TEXT_LENGTH)
        current_length = max_length
        
        # Progressive Textlängenreduktion - konservative Schritte basierend auf Testergebnissen
        reduction_steps = [1.0, 0.9, 0.75, 0.6, 0.5, 0.33]
        
        for step in reduction_steps:
            adjusted_length = int(max_length * step)
            if adjusted_length < 100:  # Sehr kurze Texte vermeiden
                continue
                
            shortened_text = text[:adjusted_length]
            logger.info(f"Trying with text length of {len(shortened_text)} characters (reduction: {step:.2f})")
            
            # Versuche mit moderatem Timeout basierend auf Testergebnissen
            timeout = 10 + (len(shortened_text) // 500)  # Basis 10s + 1s pro 500 Zeichen
            embedding = self._single_embedding_request(shortened_text, timeout=timeout)
            
            if embedding:
                if step < 1.0:
                    logger.info(f"Successfully generated embedding after reducing text to {step:.0%} of original length")
                return embedding
            
            # Kurze Pause vor dem nächsten Versuch
            time.sleep(1)
        
        logger.error(f"Failed to generate embedding after multiple attempts with different text lengths")
        return None
    
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
            # Exponential backoff with jitter für stabilere Wiederholungsversuche
            delay = RETRY_DELAY * (2**current_retry) + (0.1 * (current_retry * np.random.random()))
            time.sleep(delay)
        
        text_length = len(text)
        logger.info(f"Generating embedding for text with {text_length} characters")
        
        # For very short texts, make a direct request
        if text_length <= 500:
            embedding = self._single_embedding_request(text)
            if embedding:
                return embedding
        
        # Für sehr lange Texte: Versuche zuerst intelligente Kürzung oder AI-Summarization
        if text_length > MAX_TEXT_LENGTH:
            # Option 1: AI-Summarization für sehr lange Texte (experimentell)
            if text_length > 4000:
                summarized = self._ai_summarize_text(text)
                if summarized:
                    logger.info(f"Using AI-summarized text ({len(summarized)} chars)")
                    return self._progressively_generate_embedding(summarized)
            
            # Option 2: Intelligente rechtliche Textkürzung
            truncated = self._smart_truncate_legal_text(text)
            if len(truncated) <= MAX_TEXT_LENGTH:
                logger.info(f"Using smart truncation ({len(truncated)} chars)")
                return self._progressively_generate_embedding(truncated)
        
        # Für mittlere Texte: chunking-Verfahren anwenden
        if text_length > CHUNK_SIZE:
            logger.info(f"Text exceeds chunk size ({text_length} > {CHUNK_SIZE}), using chunked processing")
            return self._generate_chunked_embedding(text)
        
        # Standardfall: progressive Embedding-Generierung mit Verkürzung falls nötig
        embedding = self._progressively_generate_embedding(text)
        
        if embedding:
            # Update vector size if this is the first embedding
            if self.actual_vector_size is None:
                self.actual_vector_size = len(embedding)
                logger.info(f"Detected vector size: {self.actual_vector_size}")
            return embedding
        
        # Wenn alle Versuche fehlgeschlagen sind und wir noch Wiederholungen übrig haben
        if retries > 0:
            logger.info(f"All embedding attempts failed, retrying (attempts left: {retries-1})")
            return self.generate_embedding(text, retries - 1)
        
        logger.error("Failed to generate embedding after all attempts")
        return None
    
    def _generate_chunked_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding by splitting text into chunks and averaging the embeddings.
        
        Args:
            text: Text to generate embedding for
            
        Returns:
            Averaged embedding vector or None if chunks failed
        """
        chunks = self._text_to_chunks(text)
        logger.info(f"Processing text in {len(chunks)} chunks")
        
        # Generiere Embeddings für jeden Chunk
        embeddings = []
        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i+1}/{len(chunks)} with {len(chunk)} characters")
            embedding = self._progressively_generate_embedding(chunk)
            
            if embedding:
                embeddings.append(embedding)
            else:
                logger.warning(f"Failed to generate embedding for chunk {i+1}")
        
        if not embeddings:
            logger.error("Failed to generate embeddings for all chunks")
            return None
        
        if len(embeddings) < len(chunks):
            logger.warning(f"Only {len(embeddings)}/{len(chunks)} chunks successfully processed")
        
        # Durchschnitt der Chunk-Embeddings berechnen
        if len(embeddings) == 1:
            return embeddings[0]
        
        # Berechne Durchschnitt aller erfolgreichen Chunk-Embeddings
        avg_embedding = np.mean(embeddings, axis=0).tolist()
        logger.info(f"Generated combined embedding from {len(embeddings)} chunks")
        
        return avg_embedding
    
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
            # Generate embedding
            embedding = self.generate_embedding(text)
            
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
                    
                    # Get the text to index
                    text_to_embed = doc["text"]
                    text_length = len(text_to_embed)
                    
                    if text_length < 10:  # Arbitrary minimum length for meaningful content
                        logger.warning(f"Document {doc_id} has too little text ({text_length} chars). Skipping.")
                        continue
                    
                    logger.info(f"Processing document {doc_id} with {text_length} characters")
                    
                    # Generate embedding
                    embedding = self.generate_embedding(text_to_embed)
                    
                    if not embedding:
                        logger.warning(f"Failed to generate embedding for document {doc_id}. Skipping.")
                        continue
                    
                    if len(embedding) == 0:
                        logger.warning(f"Empty embedding returned for document {doc_id}. Skipping.")
                        continue
                    
                    # Generate a consistent numeric ID based on the original ID
                    numeric_id = generate_consistent_numeric_id(doc_id)
                    
                    # Add original ID to payload
                    payload = doc["payload"].copy()
                    payload["original_id"] = doc_id
                    payload["text_length"] = text_length  # Speichere Textlänge für Diagnose
                    
                    # Create point
                    point = qdrant_models.PointStruct(
                        id=numeric_id,
                        payload=payload,
                        vector=embedding
                    )
                    points.append(point)
                    success_count += 1
                    
                    # Batch-Größe überprüfen und bei Bedarf schon jetzt indexieren
                    if len(points) >= BATCH_SIZE:
                        self._index_points_batch(points)
                        points = []
                        
                except Exception as e:
                    logger.error(f"Error processing document {doc.get('id', 'unknown')}: {e}")
                    continue
            
            # Restliche Punkte indexieren
            if points:
                self._index_points_batch(points)
            
            logger.info(f"Indexed batch with {success_count} documents successfully")
            return success_count
        except Exception as e:
            logger.error(f"Error indexing batch: {e}")
            return 0
    
    def _index_points_batch(self, points: List[qdrant_models.PointStruct]) -> None:
        """Index a batch of points into Qdrant.
        
        Args:
            points: List of points to index
        """
        if not points:
            return
            
        try:
            logger.info(f"Indexing batch of {len(points)} points to Qdrant")
            self.qdrant_client.upsert(
                collection_name=COLLECTION_NAME,
                points=points
            )
            logger.info(f"Successfully indexed {len(points)} points")
        except Exception as e:
            logger.error(f"Error indexing points batch: {e}")
            # Bei Fehlern versuchen, die Punkte einzeln zu indexieren
            for point in points:
                try:
                    logger.info(f"Attempting to index point {point.id} individually")
                    self.qdrant_client.upsert(
                        collection_name=COLLECTION_NAME,
                        points=[point]
                    )
                except Exception as e2:
                    logger.error(f"Error indexing individual point {point.id}: {e2}")


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
            List of documents with their metadata (excluding weggefallen/repealed documents)
        """
        try:
            # Determine how many documents to fetch
            rows = self.limit if self.limit else 10000  # Large number to get all docs
            
            # Query all documents with filtering for weggefallen/repealed/BJNG documents
            response = requests.get(
                f"{SOLR_ENDPOINT}/select",
                params={
                    "q": "*:*",
                    "fq": [
                        "-norm_type:repealed",           # Exclude repealed documents
                        "-titel:\"(weggefallen)\"",     # Exclude documents with "(weggefallen)" in title
                        "-text_content:\"(weggefallen)\"",  # Exclude documents with "(weggefallen)" in content
                        "-id:*BJNG*"                    # Exclude BJNG (structural/outline) documents
                    ],
                    "rows": rows,
                    "fl": "id,enbez,kurzue,langue,text_content,text_content_html,norm_type,parent_document_id,jurabk,amtabk"
                },
                timeout=60  # Erhöhter Timeout für große Datenmengen
            )
            response.raise_for_status()
            
            # Parse response
            docs = response.json().get("response", {}).get("docs", [])
            logger.info(f"Fetched {len(docs)} documents from Solr")
            
            processed_docs = []
            for doc in docs:
                # Extract text content preferring clean text version over HTML
                # FIXED: Use text_content FIRST, then HTML as fallback (not the other way around)
                text_content = doc.get("text_content", doc.get("text_content_html", ""))
                
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
                        metadata_text.append(f"Jurabk: {doc.get('jurabk')}")
                    if doc.get("amtabk"):
                        metadata_text.append(f"Amtabk: {doc.get('amtabk')}")
                    
                    clean_text = " ".join(metadata_text)
                    
                    if not clean_text.strip():
                        logger.warning(f"Could not build any text content for document {doc.get('id', 'unknown')}. Skipping.")
                        continue
                
                # Create a document with text and payload
                processed_doc = {
                    "id": doc["id"],
                    "text": clean_text,
                    "payload": {
                        "enbez": doc.get("enbez", ""),
                        "kurzue": doc.get("kurzue", ""),
                        "norm_type": doc.get("norm_type", ""),
                        "parent_document_id": doc.get("parent_document_id", ""),
                        "jurabk": doc.get("jurabk", ""),
                        "amtabk": doc.get("amtabk", ""),
                        "langue": doc.get("langue", "")
                    }
                }
                
                processed_docs.append(processed_doc)
            
            logger.info(f"Processed {len(processed_docs)} documents from Solr")
            return processed_docs
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching documents from Solr: {e}")
            sys.exit(1)


class XMLDocumentFetcher:
    """Class to fetch documents from XML files."""
    
    def __init__(self, xml_dir: str, limit: Optional[int] = None):
        """Initialize the XML document fetcher.
        
        Args:
            xml_dir: Directory containing XML files
            limit: Maximum number of documents to fetch (None for all)
        """
        self.xml_dir = xml_dir
        self.limit = limit
    
    def _extract_text_from_element(self, element: ET.Element) -> str:
        """Extract text from an XML element, including text from children.
        
        Args:
            element: XML element
            
        Returns:
            Extracted text
        """
        text = element.text or ""
        for child in element:
            child_text = self._extract_text_from_element(child)
            if child_text:
                text += " " + child_text
            if child.tail:
                text += " " + child.tail
        return text
    
    def _process_xml_file(self, file_path: str) -> List[Dict]:
        """Process a single XML file.
        
        Args:
            file_path: Path to the XML file
            
        Returns:
            List of extracted documents
        """
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            documents = []
            
            # Extract document metadata from filename
            import os
            file_name = os.path.basename(file_path)
            # Assume filename format is like: "bgbl1_1949_1_bgbl102s0001.xml"
            # where "bgbl1" is the document type
            doc_type = file_name.split("_")[0] if "_" in file_name else ""
            
            # Find all norm elements (usually contain individual laws/regulations)
            norm_elements = root.findall(".//norm") or [root]  # Fallback to root if no norm elements
            
            for i, norm in enumerate(norm_elements):
                try:
                    # Extract metadata from XML
                    meta = norm.find("./metadaten")
                    
                    # Generate an ID
                    doc_id = f"{file_name}_{i}"
                    if meta is not None:
                        enbez_elem = meta.find("./enbez")
                        if enbez_elem is not None and enbez_elem.text:
                            doc_id = f"{file_name}_{enbez_elem.text.strip()}"
                    
                    # Extract content
                    content = ""
                    text_elements = norm.findall(".//text") or [norm]
                    for text_elem in text_elements:
                        text_content = self._extract_text_from_element(text_elem)
                        content += " " + text_content
                    
                    # Clean content
                    content = " ".join(content.split())
                    
                    # Extract metadata
                    enbez = ""
                    kurzue = ""
                    jurabk = ""
                    amtabk = ""
                    
                    if meta is not None:
                        enbez_elem = meta.find("./enbez")
                        if enbez_elem is not None:
                            enbez = enbez_elem.text or ""
                        
                        kurzue_elem = meta.find("./kurzue")
                        if kurzue_elem is not None:
                            kurzue = kurzue_elem.text or ""
                        
                        jurabk_elem = meta.find("./jurabk")
                        if jurabk_elem is not None:
                            jurabk = jurabk_elem.text or ""
                        
                        amtabk_elem = meta.find("./amtabk")
                        if amtabk_elem is not None:
                            amtabk = amtabk_elem.text or ""
                    
                    # If content is empty, use metadata
                    if not content.strip():
                        metadata_text = []
                        if enbez:
                            metadata_text.append(f"Titel: {enbez}")
                        if kurzue:
                            metadata_text.append(f"Kurzüberschrift: {kurzue}")
                        if jurabk:
                            metadata_text.append(f"Jurabk: {jurabk}")
                        if amtabk:
                            metadata_text.append(f"Amtabk: {amtabk}")
                        
                        content = " ".join(metadata_text)
                    
                    # Skip if still no content
                    if not content.strip():
                        continue
                    
                    # Create document
                    document = {
                        "id": doc_id,
                        "text": content,
                        "payload": {
                            "enbez": enbez,
                            "kurzue": kurzue,
                            "jurabk": jurabk,
                            "amtabk": amtabk,
                            "norm_type": doc_type,
                            "source_file": file_name
                        }
                    }
                    
                    documents.append(document)
                except Exception as e:
                    logger.error(f"Error processing norm element in {file_path}: {e}")
            
            return documents
        except Exception as e:
            logger.error(f"Error processing XML file {file_path}: {e}")
            return []
    
    def fetch_documents(self) -> List[Dict]:
        """Fetch documents from XML files.
        
        Returns:
            List of documents with their metadata
        """
        try:
            import os
            import glob
            
            xml_files = glob.glob(os.path.join(self.xml_dir, "**/*.xml"), recursive=True)
            
            if not xml_files:
                logger.error(f"No XML files found in {self.xml_dir}")
                return []
            
            logger.info(f"Found {len(xml_files)} XML files in {self.xml_dir}")
            
            # Limit number of files if needed
            if self.limit is not None and self.limit < len(xml_files):
                xml_files = xml_files[:self.limit]
                logger.info(f"Limiting to {self.limit} XML files")
            
            # Process all files
            all_documents = []
            for file_path in xml_files:
                try:
                    documents = self._process_xml_file(file_path)
                    all_documents.extend(documents)
                    logger.info(f"Processed {len(documents)} documents from {file_path}")
                except Exception as e:
                    logger.error(f"Error processing file {file_path}: {e}")
            
            logger.info(f"Processed {len(all_documents)} documents from {len(xml_files)} XML files")
            return all_documents
        except Exception as e:
            logger.error(f"Error fetching documents from XML files: {e}")
            return []


def main():
    """Main function to run the indexer."""
    # Declare global variables first
    global MAX_TEXT_LENGTH, BATCH_SIZE, CHUNK_SIZE
    
    parser = argparse.ArgumentParser(description="Index documents into Qdrant vector database")
    parser.add_argument("--source", choices=["solr", "xml"], default="solr",
                      help="Data source: 'solr' or 'xml' (default: solr)")
    parser.add_argument("--limit", type=int, default=None,
                      help="Maximum number of documents to process (default: all)")
    parser.add_argument("--recreate", action="store_true",
                      help="Recreate the Qdrant collection if it exists")
    parser.add_argument("--docker", action="store_true",
                      help="Use Docker network endpoints instead of localhost")
    parser.add_argument("--debug", action="store_true",
                      help="Enable debug logging")
    parser.add_argument("--max-text-length", type=int, default=MAX_TEXT_LENGTH,
                      help=f"Maximum text length for embedding generation (default: {MAX_TEXT_LENGTH})")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE,
                      help=f"Batch size for document processing (default: {BATCH_SIZE})")
    parser.add_argument("--chunk-size", type=int, default=CHUNK_SIZE,
                      help=f"Chunk size for text splitting (default: {CHUNK_SIZE})")
    args = parser.parse_args()
    
    # Update global configuration based on arguments
    MAX_TEXT_LENGTH = args.max_text_length
    BATCH_SIZE = args.batch_size
    CHUNK_SIZE = args.chunk_size
    
    # Set log level
    if args.debug:
        logger.setLevel(logging.DEBUG)
        logger.debug("Debug logging enabled")
    
    # Use Docker endpoints if specified
    if args.docker:
        global OLLAMA_ENDPOINT, QDRANT_ENDPOINT, SOLR_ENDPOINT
        OLLAMA_ENDPOINT = DOCKER_OLLAMA_ENDPOINT
        QDRANT_ENDPOINT = DOCKER_QDRANT_ENDPOINT
        SOLR_ENDPOINT = DOCKER_SOLR_ENDPOINT
        logger.info("Using Docker network endpoints")
    
    # Log configuration
    logger.info(f"Configuration: MAX_TEXT_LENGTH={MAX_TEXT_LENGTH}, BATCH_SIZE={BATCH_SIZE}, "
                f"CHUNK_SIZE={CHUNK_SIZE}, MAX_RETRIES={MAX_RETRIES}")
    logger.info(f"Endpoints: OLLAMA={OLLAMA_ENDPOINT}, QDRANT={QDRANT_ENDPOINT}, SOLR={SOLR_ENDPOINT}")
    
    try:
        # Initialize indexer
        indexer = QdrantIndexer(recreate=args.recreate)
        
        # Create collection
        indexer.create_collection_if_not_exists()
        
        # Fetch documents
        logger.info(f"Fetching documents from {args.source}")
        if args.source == "solr":
            fetcher = SolrDocumentFetcher(limit=args.limit)
        else:  # xml
            fetcher = XMLDocumentFetcher(xml_dir=XML_DIR, limit=args.limit)
        
        documents = fetcher.fetch_documents()
        total_documents = len(documents)
        logger.info(f"Fetched {total_documents} documents")
        
        if total_documents == 0:
            logger.error("No documents to index. Exiting.")
            return
        
        # Index documents in batches
        success_count = 0
        total_batches = (total_documents + BATCH_SIZE - 1) // BATCH_SIZE
        
        logger.info(f"Starting indexing with {total_batches} batches (batch size: {BATCH_SIZE})")
        
        start_time = time.time()
        
        for i in range(0, total_documents, BATCH_SIZE):
            batch = documents[i:i + BATCH_SIZE]
            batch_num = i // BATCH_SIZE + 1
            
            logger.info(f"Processing batch {batch_num}/{total_batches} with {len(batch)} documents")
            batch_start_time = time.time()
            
            try:
                batch_success = indexer.index_batch(batch)
                success_count += batch_success
                
                batch_time = time.time() - batch_start_time
                docs_per_sec = len(batch) / batch_time if batch_time > 0 else 0
                
                logger.info(f"Batch {batch_num}/{total_batches}: {batch_success}/{len(batch)} documents indexed "
                            f"in {batch_time:.2f}s ({docs_per_sec:.2f} docs/s)")
                
                # Estimate remaining time
                elapsed_time = time.time() - start_time
                progress = batch_num / total_batches
                if progress > 0:
                    estimated_total_time = elapsed_time / progress
                    remaining_time = estimated_total_time - elapsed_time
                    
                    logger.info(f"Progress: {progress:.1%} complete. "
                                f"Est. remaining time: {remaining_time/60:.1f} minutes")
            
            except Exception as e:
                logger.error(f"Error processing batch {batch_num}: {e}")
                
                # Attempt to process documents individually if batch fails
                logger.info("Attempting to process documents individually...")
                for j, doc in enumerate(batch):
                    try:
                        if indexer.index_document(doc["id"], doc["text"], doc["payload"]):
                            success_count += 1
                            logger.info(f"Successfully indexed individual document {doc['id']}")
                        else:
                            logger.warning(f"Failed to index individual document {doc['id']}")
                    except Exception as e2:
                        logger.error(f"Error indexing individual document {doc.get('id', 'unknown')}: {e2}")
        
        # Log final statistics
        total_time = time.time() - start_time
        avg_docs_per_sec = success_count / total_time if total_time > 0 else 0
        
        logger.info(f"Indexing completed in {total_time:.2f}s ({avg_docs_per_sec:.2f} docs/s average)")
        logger.info(f"Results: {success_count}/{total_documents} documents indexed successfully "
                    f"({success_count/total_documents:.1%} success rate)")
        
        if success_count == 0:
            logger.error("No documents were successfully indexed. Please check the logs for errors.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("Indexing interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Unhandled error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()