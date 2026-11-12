from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict
from research.agent import run_research
from data.processor import DataProcessor
from data.vector_store import VectorStore
from data.embeddings import EmbeddingGenerator
from data.chat_agent import run_data_chat
from taxonomy.agent import run_taxonomy_identification
import os
from dotenv import load_dotenv
import re

load_dotenv()

def sanitize_user_id(user_id: str) -> str:
    """Convert user_id to alphanumeric format safe for ChromaDB collections"""
    # Remove any non-alphanumeric characters and convert to lowercase
    sanitized = re.sub(r'[^a-zA-Z0-9]', '', str(user_id).lower())
    return sanitized

app = FastAPI()

# Initialize data processing components
processor = DataProcessor()
embedding_gen = EmbeddingGenerator()

# Pass embedding function to VectorStore for similarity search
# Use the ChromaDB-compatible sync wrapper
vector_store = VectorStore(
    embedding_function=embedding_gen.get_embedding_function()
)

class ResearchRequest(BaseModel):
    topic: str

class DataUploadResponse(BaseModel):
    success: bool
    document_id: str
    filename: str
    chunks_stored: int
    metadata: dict
    message: str

class DataChatRequest(BaseModel):
    user_id: str
    query: str
    document_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None

class DataChatResponse(BaseModel):
    success: bool
    response: str
    sources: Optional[List[Dict]] = []  # Retrieved chunks with metadata
    conversation_history: Optional[List[Dict[str, str]]] = []
    message: str
    error: Optional[bool] = False
    error_details: Optional[Dict] = None

class DataDeleteRequest(BaseModel):
    user_id: str
    document_id: str

class DataDeleteResponse(BaseModel):
    success: bool
    deleted_count: int
    message: str

@app.get("/")
async def greet():
    return {"message": "Hello! Welcome to the FastAPI microservice."}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "FastAPI Microservice"
    }

@app.post("/research")
async def research(request: ResearchRequest):
    try:
        if not os.environ.get("TAVILY_API_KEY"):
            raise HTTPException(status_code=500, detail="TAVILY_API_KEY not configured")
        
        result = await run_research(request.topic)
        return {"success": True, "document": result}
    except ValueError as e:
        # Client-side validation errors (e.g., invalid topic length)
        print(f"Research validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        # Server-side errors (e.g., API failures, workflow errors)
        print(f"Research error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/data-upload", response_model=DataUploadResponse)
async def upload_data(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """
    Upload and process data files for vector storage
    
    Supports: CSV, JSON, XML, netCDF formats
    Max file size: 50MB (configurable via MAX_FILE_SIZE_MB env var)
    """
    print(f"\n{'='*60}")
    print(f"[DataUpload] Processing file: {file.filename} for user: {user_id}")
    print(f"{'='*60}\n")
    
    start_time = datetime.now()
    
    try:
        # Validate user_id
        if not user_id or not user_id.strip():
            raise HTTPException(status_code=422, detail="user_id is required")
        
        # Sanitize user_id for ChromaDB compatibility
        sanitized_user_id = sanitize_user_id(user_id)
        print(f"[DataUpload] Original user_id: {user_id}, Sanitized: {sanitized_user_id}")
        
        # Read file content
        file_content = await file.read()
        
        # Validate file
        try:
            processor.validate_file(file_content, file.filename)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Detect format
        try:
            file_format = processor.detect_file_format(file.filename, file_content)
            print(f"[DataUpload] Detected format: {file_format}")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Parse file
        try:
            parsed_data = await processor.parse_file(file_content, file.filename, file_format)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"File parsing failed: {str(e)}")
        
        # Extract metadata
        metadata = processor.extract_metadata(parsed_data, file_format)
        print(f"[DataUpload] Metadata extracted: {len(metadata)} fields")
        
        # Chunk data
        try:
            chunks = await processor.chunk_data(parsed_data, file_format)
            print(f"[DataUpload] Created {len(chunks)} chunks")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Data chunking failed: {str(e)}")
        
        # Generate text for each chunk
        chunk_texts = []
        for chunk in chunks:
            try:
                text = processor.generate_chunk_text(chunk, metadata, file_format)
                chunk_texts.append({"text": text})
            except Exception as e:
                print(f"[DataUpload] Warning: Failed to generate text for chunk: {str(e)}")
                # Skip failed chunks instead of failing entire upload
                continue
        
        if not chunk_texts:
            raise HTTPException(status_code=500, detail="Failed to generate any valid chunks")
        
        print(f"[DataUpload] Generated text for {len(chunk_texts)} chunks")
        
        # Generate embeddings
        try:
            texts = [chunk["text"] for chunk in chunk_texts]
            embeddings = await embedding_gen.generate_embeddings(texts)
            print(f"[DataUpload] Generated {len(embeddings)} embeddings")
        except Exception as e:
            print(f"[DataUpload] Embedding generation error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")
        
        # Store in vector database
        try:
            document_id = await vector_store.store_documents(
                user_id=sanitized_user_id,
                filename=file.filename,
                chunks=chunk_texts,
                metadata=metadata,
                embeddings=embeddings
            )
            print(f"[DataUpload] Stored document: {document_id}")
        except Exception as e:
            print(f"[DataUpload] Vector store error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to store in vector database: {str(e)}")
        
        elapsed_time = (datetime.now() - start_time).total_seconds()
        
        print(f"\n{'='*60}")
        print(f"[DataUpload] Completed in {elapsed_time:.2f}s")
        print(f"{'='*60}\n")
        
        return DataUploadResponse(
            success=True,
            document_id=document_id,
            filename=file.filename,
            chunks_stored=len(chunk_texts),
            metadata=metadata,
            message="Data uploaded and indexed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DataUpload] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/data-chat", response_model=DataChatResponse)
async def chat_with_data(request: DataChatRequest):
    """
    Chat with uploaded data using conversational AI
    
    Requires: user_id, query
    Optional: document_id (filter to specific file), conversation_history
    """
    print(f"\n{'='*60}")
    print(f"[DataChat] User: {request.user_id}, Query: {request.query}")
    print(f"{'='*60}\n")
    
    start_time = datetime.now()
    
    try:
        # Validate user_id
        if not request.user_id or not request.user_id.strip():
            raise HTTPException(status_code=422, detail="user_id is required")
        
        # Sanitize user_id for ChromaDB compatibility
        sanitized_user_id = sanitize_user_id(request.user_id)
        print(f"[DataChat] Original user_id: {request.user_id}, Sanitized: {sanitized_user_id}")
        
        # Validate query
        if not request.query or len(request.query.strip()) < 3:
            raise HTTPException(status_code=422, detail="Query must be at least 3 characters")
        
        # Run chat agent
        result = await run_data_chat(
            user_id=sanitized_user_id,
            query=request.query,
            vector_store=vector_store,  # Use global instance
            document_id=request.document_id,
            conversation_history=request.conversation_history or []
        )
        
        elapsed_time = (datetime.now() - start_time).total_seconds()
        
        print(f"\n{'='*60}")
        print(f"[DataChat] Completed in {elapsed_time:.2f}s")
        print(f"{'='*60}\n")
        
        # Check if LLM generation failed inside the agent
        if result.get("error"):
            # Return structured error response instead of raising HTTPException
            error_details = result.get("error_details", {})
            print(f"[DataChat] LLM error: {error_details.get('error_type', 'unknown')}")
            
            return DataChatResponse(
                success=False,
                response=result.get("response", "Unable to generate response. Please try again."),
                sources=result.get("sources", []),
                conversation_history=result.get("conversation_history", []),
                message="LLM response generation failed",
                error=True,
                error_details=error_details
            )
        
        return DataChatResponse(
            success=True,
            response=result["response"],
            sources=result["sources"],
            conversation_history=result["conversation_history"],
            message="Query processed successfully",
            error=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DataChat] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.delete("/data-delete", response_model=DataDeleteResponse)
async def delete_data(request: DataDeleteRequest):
    """
    Delete user dataset from vector store
    
    Requires: user_id, document_id
    """
    print(f"\n{'='*60}")
    print(f"[DataDelete] User: {request.user_id}, Document: {request.document_id}")
    print(f"{'='*60}\n")
    
    try:
        # Validate user_id
        if not request.user_id or not request.user_id.strip():
            raise HTTPException(status_code=422, detail="user_id is required")
        
        # Sanitize user_id for ChromaDB compatibility
        sanitized_user_id = sanitize_user_id(request.user_id)
        print(f"[DataDelete] Original user_id: {request.user_id}, Sanitized: {sanitized_user_id}")
        
        # Validate document_id
        if not request.document_id or not request.document_id.strip():
            raise HTTPException(status_code=422, detail="document_id is required")
        
        if not re.match(r'^[a-zA-Z0-9_]+$', request.document_id):
            raise HTTPException(
                status_code=422,
                detail="document_id must contain only alphanumeric characters and underscores"
            )
        
        # Delete from vector store
        deleted_count = await vector_store.delete_user_documents(
            user_id=sanitized_user_id,
            document_id=request.document_id
        )
        
        if deleted_count == 0:
            raise HTTPException(status_code=404, detail="No documents found to delete")
        
        print(f"[DataDelete] Deleted {deleted_count} chunks")
        
        return DataDeleteResponse(
            success=True,
            deleted_count=deleted_count,
            message=f"Successfully deleted {deleted_count} chunks"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DataDelete] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Delete operation failed: {str(e)}")

@app.post("/data-verify")
async def verify_data(user_id: str = Form(...), document_id: str = Form(...)):
    """
    Verify that uploaded data is queryable
    Returns chunk count and sample metadata
    """
    try:
        sanitized_user_id = sanitize_user_id(user_id)
        
        verification = await vector_store.verify_collection_data(
            user_id=sanitized_user_id,
            document_id=document_id
        )
        
        return {
            "success": True,
            "verification": verification,
            "queryable": verification.get("filtered_count", 0) > 0
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

class TaxonomyRequest(BaseModel):
    input: str
    input_type: str  # "name" or "image"

@app.post("/taxonomy-identify")
async def identify_taxonomy(request: TaxonomyRequest):
    """
    Identify species and extract taxonomy data using LangGraph agent
    
    Accepts:
        - Species name (input_type="name")
        - Image URL (input_type="image", e.g., Cloudinary URL)
    
    Returns:
        Structured taxonomy data matching Species model schema
    """
    print(f"\n{'='*60}")
    print(f"[TaxonomyIdentify] Request received")
    print(f"[TaxonomyIdentify] Input type: {request.input_type}")
    print(f"[TaxonomyIdentify] Input: {request.input[:100]}...")
    print(f"{'='*60}\n")
    
    start_time = datetime.now()
    
    try:
        # Validate input_type
        if request.input_type not in ['name', 'image']:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid input_type: {request.input_type}. Must be 'name' or 'image'"
            )
        
        # Validate input
        if not request.input or not request.input.strip():
            raise HTTPException(
                status_code=422,
                detail="Input cannot be empty"
            )
        
        # Run taxonomy identification agent
        taxonomy_data = await run_taxonomy_identification(
            input_data=request.input.strip(),
            input_type=request.input_type
        )
        
        elapsed_time = (datetime.now() - start_time).total_seconds()
        
        print(f"\n{'='*60}")
        print(f"[TaxonomyIdentify] Completed in {elapsed_time:.2f}s")
        print(f"[TaxonomyIdentify] Species: {taxonomy_data.get('scientificName', 'Unknown')}")
        print(f"{'='*60}\n")
        
        return {
            "success": True,
            "data": taxonomy_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[TaxonomyIdentify] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Taxonomy identification failed: {str(e)}"
        )

