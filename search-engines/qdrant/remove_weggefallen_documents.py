#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ASRA Qdrant Document Remover

This script removes "(weggefallen)" and repealed documents from the Qdrant collection
without requiring a full reindexing.

Usage:
    python3 remove_weggefallen_documents.py [--dry-run] [--docker]

Options:
    --dry-run   Show what would be deleted without actually deleting
    --docker    Use Docker network endpoints instead of localhost
"""

import argparse
import logging
import os
import sys
from typing import List, Dict, Any

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
DEFAULT_QDRANT_ENDPOINT = "http://localhost:6333"
DOCKER_QDRANT_ENDPOINT = "http://qdrant:6333"
COLLECTION_NAME = "deutsche_gesetze"


class QdrantDocumentRemover:
    """Class to remove specific documents from Qdrant."""
    
    def __init__(self, qdrant_endpoint: str):
        """Initialize the document remover.
        
        Args:
            qdrant_endpoint: Qdrant server endpoint
        """
        self.qdrant_client = QdrantClient(url=qdrant_endpoint)
        self.collection_name = COLLECTION_NAME
        
        # Verify collection exists
        try:
            collections = self.qdrant_client.get_collections()
            if COLLECTION_NAME not in [c.name for c in collections.collections]:
                logger.error(f"Collection '{COLLECTION_NAME}' not found in Qdrant")
                sys.exit(1)
            logger.info(f"Connected to Qdrant collection '{COLLECTION_NAME}'")
        except Exception as e:
            logger.error(f"Error connecting to Qdrant: {e}")
            sys.exit(1)
    
    def find_weggefallen_documents(self) -> List[Dict[str, Any]]:
        """Find all documents that should be removed.
        
        Returns:
            List of documents matching the removal criteria
        """
        try:
            logger.info("Searching for weggefallen/repealed documents...")
            
            # Search for documents with weggefallen/repealed criteria
            search_result = self.qdrant_client.scroll(
                collection_name=self.collection_name,
                scroll_filter=qdrant_models.Filter(
                    should=[
                        # Match documents with norm_type = "repealed"
                        qdrant_models.FieldCondition(
                            key="norm_type",
                            match=qdrant_models.MatchValue(value="repealed")
                        ),
                        # Match documents with "(weggefallen)" in enbez (title)
                        qdrant_models.FieldCondition(
                            key="enbez",
                            match=qdrant_models.MatchText(text="(weggefallen)")
                        ),
                        # Match documents with exact "(weggefallen)" text content
                        qdrant_models.FieldCondition(
                            key="text_content",
                            match=qdrant_models.MatchValue(value="(weggefallen)")
                        )
                    ]
                ),
                limit=1000,  # Adjust if you expect more
                with_payload=True,
                with_vectors=False  # We don't need vectors for deletion
            )
            
            documents = search_result[0]  # scroll returns (points, next_page_offset)
            logger.info(f"Found {len(documents)} documents matching removal criteria")
            
            # Log some examples for verification
            for i, doc in enumerate(documents[:5]):
                payload = doc.payload or {}
                logger.info(f"  Example {i+1}: ID={doc.id}, "
                           f"enbez='{payload.get('enbez', '')}', "
                           f"norm_type='{payload.get('norm_type', '')}', "
                           f"original_id='{payload.get('original_id', '')}'")
            
            if len(documents) > 5:
                logger.info(f"  ... and {len(documents) - 5} more documents")
            
            return documents
            
        except Exception as e:
            logger.error(f"Error searching for documents: {e}")
            return []
    
    def remove_documents_by_ids(self, point_ids: List[int], dry_run: bool = False) -> bool:
        """Remove documents by their point IDs.
        
        Args:
            point_ids: List of Qdrant point IDs to remove
            dry_run: If True, only show what would be deleted
            
        Returns:
            True if successful, False otherwise
        """
        if not point_ids:
            logger.info("No documents to remove")
            return True
        
        if dry_run:
            logger.info(f"DRY RUN: Would delete {len(point_ids)} documents with IDs: {point_ids[:10]}{'...' if len(point_ids) > 10 else ''}")
            return True
        
        try:
            logger.info(f"Removing {len(point_ids)} documents from Qdrant...")
            
            # Delete in batches to avoid overwhelming the server
            batch_size = 100
            total_deleted = 0
            
            for i in range(0, len(point_ids), batch_size):
                batch_ids = point_ids[i:i + batch_size]
                
                logger.info(f"Deleting batch {i//batch_size + 1}: {len(batch_ids)} documents")
                
                self.qdrant_client.delete(
                    collection_name=self.collection_name,
                    points_selector=qdrant_models.PointIdsList(
                        points=batch_ids
                    )
                )
                
                total_deleted += len(batch_ids)
                logger.info(f"Successfully deleted batch. Total deleted: {total_deleted}/{len(point_ids)}")
            
            logger.info(f"Successfully removed all {total_deleted} documents")
            return True
            
        except Exception as e:
            logger.error(f"Error removing documents: {e}")
            return False
    
    def remove_documents_by_filter(self, dry_run: bool = False) -> bool:
        """Remove documents using filter-based deletion.
        
        Args:
            dry_run: If True, only show what would be deleted
            
        Returns:
            True if successful, False otherwise
        """
        if dry_run:
            # First find the documents to show what would be deleted
            documents = self.find_weggefallen_documents()
            if documents:
                logger.info(f"DRY RUN: Would delete {len(documents)} documents using filter-based deletion")
                return True
            else:
                logger.info("DRY RUN: No documents found matching removal criteria")
                return True
        
        try:
            logger.info("Removing weggefallen/repealed documents using filter...")
            
            # Use filter-based deletion
            delete_result = self.qdrant_client.delete(
                collection_name=self.collection_name,
                points_selector=qdrant_models.FilterSelector(
                    filter=qdrant_models.Filter(
                        should=[
                            # Match documents with norm_type = "repealed"
                            qdrant_models.FieldCondition(
                                key="norm_type",
                                match=qdrant_models.MatchValue(value="repealed")
                            ),
                            # Match documents with "(weggefallen)" in enbez (title)
                            qdrant_models.FieldCondition(
                                key="enbez",
                                match=qdrant_models.MatchText(text="(weggefallen)")
                            ),
                            # Match documents with exact "(weggefallen)" text content
                            qdrant_models.FieldCondition(
                                key="text_content",
                                match=qdrant_models.MatchValue(value="(weggefallen)")
                            )
                        ]
                    )
                )
            )
            
            logger.info("Filter-based deletion completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error in filter-based deletion: {e}")
            return False
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get collection statistics.
        
        Returns:
            Dictionary with collection statistics
        """
        try:
            collection_info = self.qdrant_client.get_collection(self.collection_name)
            stats = {
                "total_points": collection_info.points_count,
                "vector_size": collection_info.config.params.vectors.size,
                "distance_metric": collection_info.config.params.vectors.distance.value
            }
            return stats
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {}


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Remove weggefallen documents from Qdrant")
    parser.add_argument("--dry-run", action="store_true",
                      help="Show what would be deleted without actually deleting")
    parser.add_argument("--docker", action="store_true",
                      help="Use Docker network endpoints instead of localhost")
    parser.add_argument("--method", choices=["filter", "ids"], default="filter",
                      help="Deletion method: 'filter' (recommended) or 'ids'")
    args = parser.parse_args()
    
    # Determine endpoint
    qdrant_endpoint = DOCKER_QDRANT_ENDPOINT if args.docker else DEFAULT_QDRANT_ENDPOINT
    logger.info(f"Using Qdrant endpoint: {qdrant_endpoint}")
    
    # Initialize remover
    remover = QdrantDocumentRemover(qdrant_endpoint)
    
    # Get initial stats
    logger.info("Getting collection statistics...")
    initial_stats = remover.get_collection_stats()
    if initial_stats:
        logger.info(f"Collection stats before removal: {initial_stats['total_points']} total points")
    
    # Remove documents
    success = False
    if args.method == "filter":
        success = remover.remove_documents_by_filter(dry_run=args.dry_run)
    else:  # ids method
        documents = remover.find_weggefallen_documents()
        if documents:
            point_ids = [doc.id for doc in documents]
            success = remover.remove_documents_by_ids(point_ids, dry_run=args.dry_run)
        else:
            logger.info("No documents found to remove")
            success = True
    
    if not args.dry_run and success:
        # Get final stats
        logger.info("Getting updated collection statistics...")
        final_stats = remover.get_collection_stats()
        if final_stats and initial_stats:
            removed_count = initial_stats['total_points'] - final_stats['total_points']
            logger.info(f"Collection stats after removal: {final_stats['total_points']} total points")
            logger.info(f"Successfully removed {removed_count} documents")
    
    if success:
        logger.info("Operation completed successfully")
    else:
        logger.error("Operation failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
