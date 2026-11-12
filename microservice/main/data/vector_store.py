"""
Vector store management using ChromaDB for user data storage
"""
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import os
from datetime import datetime
import re


class VectorStore:
    """Manages ChromaDB client and user collections"""
    
    def __init__(self, db_path: str = None, embedding_function=None):
        """
        Initialize ChromaDB persistent client
        
        Args:
            db_path: Path for persistent storage (default: ./chroma_db)
            embedding_function: Optional embedding function for similarity search
        """
        self.db_path = db_path or os.environ.get("CHROMA_DB_PATH", "./chroma_db")
        self.embedding_function = embedding_function
        
        # Create directory if not exists
        os.makedirs(self.db_path, exist_ok=True)
        
        # Initialize persistent client
        self.client = chromadb.PersistentClient(
            path=self.db_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        print(f"[VectorStore] Initialized at {self.db_path}")
    
    def _sanitize_collection_name(self, user_id: str) -> str:
        """
        Sanitize user ID for collection naming
        
        Args:
            user_id: User identifier
            
        Returns:
            Sanitized collection name
        """
        # Replace non-alphanumeric chars with underscores
        sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', str(user_id))
        return f"user_{sanitized}_data"
    
    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to contain only alphanumeric and underscores
        for use in document_id generation (matches Mongo regex ^[a-zA-Z0-9_]+$)
        
        Args:
            filename: Original filename
            
        Returns:
            Sanitized filename with only [a-zA-Z0-9_] characters
        """
        # Remove file extension first
        name_without_ext = filename.rsplit('.', 1)[0] if '.' in filename else filename
        # Replace dots, spaces, hyphens, and other non-alphanumeric chars with underscores
        sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', name_without_ext)
        return sanitized
    
    async def create_user_collection(self, user_id: str) -> chromadb.Collection:
        """
        Create or get user-specific collection
        
        Args:
            user_id: User identifier
            
        Returns:
            ChromaDB collection
        """
        collection_name = self._sanitize_collection_name(user_id)
        
        try:
            # Pass embedding function if available for similarity search
            collection = self.client.get_or_create_collection(
                name=collection_name,
                embedding_function=self.embedding_function,
                metadata={
                    "user_id": str(user_id),
                    "created_at": datetime.now().isoformat()
                }
            )
            print(f"[VectorStore] Collection '{collection_name}' ready")
            return collection
        except Exception as e:
            print(f"[VectorStore] Error creating collection: {str(e)}")
            raise
    
    async def store_documents(
        self,
        user_id: str,
        filename: str,
        chunks: List[Dict],
        metadata: Dict,
        embeddings: List[List[float]]
    ) -> str:
        """
        Store document chunks in user collection
        
        Args:
            user_id: User identifier
            filename: Original filename
            chunks: List of chunk dictionaries with 'text' key
            metadata: File metadata
            embeddings: Pre-generated embeddings for chunks
            
        Returns:
            Document ID
        """
        # Validate chunks and embeddings alignment
        if len(chunks) != len(embeddings):
            raise ValueError(
                f"Chunks and embeddings count mismatch: {len(chunks)} chunks but {len(embeddings)} embeddings. "
                "Cannot store misaligned data."
            )
        
        collection = await self.create_user_collection(user_id)
        
        # Log collection stats before insertion
        existing_count = collection.count()
        print(f"[VectorStore] Collection '{collection.name}' has {existing_count} existing chunks")
        
        # Generate document ID with sanitized filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        sanitized_filename = self._sanitize_filename(filename)
        document_id = f"{user_id}_{sanitized_filename}_{timestamp}"
        
        # Prepare data for batch insert
        ids = []
        documents = []
        metadatas = []
        
        for idx, chunk in enumerate(chunks):
            chunk_id = f"{document_id}_{idx}"
            ids.append(chunk_id)
            documents.append(chunk['text'])
            
            chunk_metadata = {
                "user_id": str(user_id),
                "filename": filename,
                "upload_date": datetime.now().isoformat(),
                "file_format": metadata.get("file_format", "unknown"),
                "chunk_index": idx,
                "total_chunks": len(chunks),
                "document_id": document_id
            }
            
            # Add original metadata
            if "original_metadata" in metadata:
                chunk_metadata["original_metadata"] = str(metadata["original_metadata"])
            
            metadatas.append(chunk_metadata)
        
        # Batch insert with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids,
                    embeddings=embeddings
                )
                new_count = collection.count()
                print(f"[VectorStore] Stored {len(chunks)} chunks for document '{document_id}'")
                print(f"[VectorStore] Collection now has {new_count} total chunks (+{len(chunks)} added)")
                return document_id
            except Exception as e:
                print(f"[VectorStore] Store attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    raise
                import time
                time.sleep(2 ** attempt)
    
    async def retrieve_documents(
        self,
        user_id: str,
        query: str,
        n_results: int = 5,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Retrieve relevant documents using similarity search
        
        Args:
            user_id: User identifier
            query: Query text
            n_results: Number of results to return
            filters: Optional metadata filters
            
        Returns:
            List of matching documents with metadata and distances
        """
        collection = await self.create_user_collection(user_id)
        
        # Enhanced logging
        total_count = collection.count()
        print(f"[VectorStore] === RETRIEVAL DEBUG ===")
        print(f"[VectorStore] Collection: {collection.name}")
        print(f"[VectorStore] Total chunks in collection: {total_count}")
        print(f"[VectorStore] Query: '{query[:100]}'")
        
        # Build where clause with ChromaDB $and operator
        if filters:
            # Multiple conditions require $and operator
            conditions = [{"user_id": str(user_id)}]
            for key, value in filters.items():
                conditions.append({key: value})
            where_clause = {"$and": conditions}
        else:
            # Single condition doesn't need operator
            where_clause = {"user_id": str(user_id)}
        
        print(f"[VectorStore] Filters: {where_clause}")
        
        # Sample existing data for comparison
        try:
            sample = collection.get(limit=3)
            if sample['ids']:
                print(f"[VectorStore] Sample document IDs: {sample['ids']}")
                if sample['metadatas']:
                    print(f"[VectorStore] Sample metadata: {sample['metadatas'][0]}")
        except Exception as e:
            print(f"[VectorStore] Could not fetch sample: {e}")
        
        try:
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_clause
            )
            
            # Log results
            raw_count = len(results['documents'][0]) if results['documents'] else 0
            print(f"[VectorStore] Results: {raw_count} documents")
            
            if raw_count == 0:
                print(f"[VectorStore] ⚠️ NO RESULTS - Possible causes:")
                print(f"  1. user_id mismatch: query='{user_id}' vs stored")
                print(f"  2. document_id mismatch: query='{filters.get('document_id') if filters else 'None'}' vs stored")
                print(f"  3. Collection empty or wrong collection")
            
            if results.get('distances') and results['distances'][0]:
                distances = results['distances'][0]
                print(f"[VectorStore] Distance range: {min(distances):.4f} - {max(distances):.4f}")
            
            # Format results
            documents = []
            if results['documents'] and results['documents'][0]:
                for idx in range(len(results['documents'][0])):
                    documents.append({
                        "text": results['documents'][0][idx],
                        "metadata": results['metadatas'][0][idx],
                        "distance": results['distances'][0][idx] if results.get('distances') else None
                    })
            
            print(f"[VectorStore] Retrieved {len(documents)} documents for query")
            return documents
        except Exception as e:
            print(f"[VectorStore] Retrieval error: {str(e)}")
            raise
    
    async def verify_collection_data(self, user_id: str, document_id: Optional[str] = None) -> Dict:
        """Verify data exists in collection for debugging"""
        collection = await self.create_user_collection(user_id)
        
        where_clause = {"user_id": str(user_id)}
        if document_id:
            where_clause["document_id"] = document_id
        
        try:
            results = collection.get(where=where_clause, limit=10)
            return {
                "collection_name": collection.name,
                "total_count": collection.count(),
                "filtered_count": len(results['ids']) if results['ids'] else 0,
                "sample_ids": results['ids'][:3] if results['ids'] else [],
                "filters_used": where_clause
            }
        except Exception as e:
            return {"error": str(e)}
    
    async def delete_user_documents(
        self,
        user_id: str,
        filename: Optional[str] = None,
        document_id: Optional[str] = None
    ) -> int:
        """
        Delete user documents by filename, document_id, or all user documents
        
        Args:
            user_id: User identifier
            filename: Optional filename filter
            document_id: Optional document ID filter
            
        Returns:
            Number of documents deleted
        """
        collection = await self.create_user_collection(user_id)
        
        try:
            # Build where clause with ChromaDB $and operator
            conditions = [{"user_id": str(user_id)}]
            if filename:
                conditions.append({"filename": filename})
            if document_id:
                conditions.append({"document_id": document_id})
            
            # Use $and operator if multiple conditions, otherwise single condition
            if len(conditions) > 1:
                where_clause = {"$and": conditions}
            else:
                where_clause = conditions[0]
            
            # Get matching documents
            results = collection.get(where=where_clause)
            
            if results['ids']:
                collection.delete(ids=results['ids'])
                count = len(results['ids'])
                print(f"[VectorStore] Deleted {count} documents")
                return count
            
            return 0
        except Exception as e:
            print(f"[VectorStore] Delete error: {str(e)}")
            raise
    
    def get_collection_stats(self, user_id: str) -> Dict:
        """Get statistics for user collection"""
        try:
            collection_name = self._sanitize_collection_name(user_id)
            collection = self.client.get_collection(collection_name)
            count = collection.count()
            
            return {
                "collection_name": collection_name,
                "document_count": count,
                "metadata": collection.metadata
            }
        except Exception as e:
            return {
                "collection_name": self._sanitize_collection_name(user_id),
                "document_count": 0,
                "error": str(e)
            }
