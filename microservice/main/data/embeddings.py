"""
Embedding generation using Sentence Transformers (HuggingFace)
Free, open-source, runs locally without API keys
"""
import os
import asyncio
from typing import List
from sentence_transformers import SentenceTransformer
import torch
from chromadb import Documents, EmbeddingFunction, Embeddings


class EmbeddingGenerator:
    """Wrapper for Sentence Transformers embeddings with retry logic"""
    
    def __init__(self, model_name: str = None):
        """
        Initialize Sentence Transformer model
        
        Args:
            model_name: HuggingFace model name (default: all-MiniLM-L6-v2)
        """
        # Use lightweight, fast model optimized for semantic search
        self.model_name = model_name or os.environ.get(
            "EMBEDDING_MODEL", 
            "sentence-transformers/all-MiniLM-L6-v2"
        )
        
        print(f"[Embeddings] Loading model: {self.model_name}")
        
        # Load model (downloads on first run, ~80MB)
        # Set device to CPU for compatibility (GPU optional)
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model = SentenceTransformer(self.model_name, device=device)
        
        print(f"[Embeddings] Model loaded on {device}")
        print(f"[Embeddings] Embedding dimension: {self.model.get_sentence_embedding_dimension()}")
    
    async def generate_embeddings(self, texts: List[str], max_retries: int = 3) -> List[List[float]]:
        """
        Generate embeddings for a list of texts with retry logic
        
        Args:
            texts: List of text strings to embed
            max_retries: Maximum number of retry attempts
            
        Returns:
            List of embedding vectors (each is list of floats)
            
        Raises:
            Exception: If embedding generation fails after retries
        """
        for attempt in range(max_retries):
            try:
                # Run in thread pool to avoid blocking async event loop
                loop = asyncio.get_event_loop()
                embeddings = await loop.run_in_executor(
                    None,
                    self._encode_batch,
                    texts
                )
                
                # Convert numpy arrays to lists for JSON serialization
                embeddings_list = [emb.tolist() for emb in embeddings]
                
                print(f"[Embeddings] Generated {len(embeddings_list)} embeddings")
                return embeddings_list
                
            except Exception as e:
                print(f"[Embeddings] Attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    raise
                # Exponential backoff
                wait_time = 2 ** attempt
                print(f"[Embeddings] Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
    
    def _encode_batch(self, texts: List[str]):
        """Synchronous encoding for thread pool execution"""
        return self.model.encode(
            texts,
            batch_size=32,  # Process 32 texts at once
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True  # Normalize for cosine similarity
        )
    
    async def generate_single_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        embeddings = await self.generate_embeddings([text])
        return embeddings[0]
    
    def get_embedding_function(self):
        """
        Return embedding function compatible with ChromaDB
        
        Returns:
            ChromaDB EmbeddingFunction instance
        """
        # Create a proper ChromaDB EmbeddingFunction class
        model = self.model
        
        class SentenceTransformerEmbeddingFunction(EmbeddingFunction):
            """ChromaDB-compatible embedding function wrapper"""
            
            def __call__(self, input: Documents) -> Embeddings:
                """
                Embed documents using SentenceTransformer
                
                Args:
                    input: List of text documents to embed
                    
                Returns:
                    List of embeddings (each embedding is a list of floats)
                """
                embeddings = model.encode(
                    input,
                    batch_size=32,
                    show_progress_bar=False,
                    convert_to_numpy=True,
                    normalize_embeddings=True
                )
                return [emb.tolist() for emb in embeddings]
        
        return SentenceTransformerEmbeddingFunction()
