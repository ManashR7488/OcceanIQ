# Talk with Your Data - Backend Implementation

## Overview

This module provides comprehensive data ingestion, processing, and vector storage capabilities for the "Talk with Your Data" feature. It enables users to upload structured marine data files, automatically processes and chunks them, generates semantic embeddings using **free, open-source Sentence Transformers**, and stores them in a persistent vector database for conversational AI queries.

## Embedding Model (NEW!)

The system now uses **Sentence Transformers** (HuggingFace) for completely free, local embeddings:

- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Size**: ~80MB (auto-downloads on first run)
- **Speed**: ~1000 embeddings/second on CPU
- **Dimension**: 384 (optimized for semantic search)
- **Cost**: FREE - No API keys needed!
- **Privacy**: Runs completely offline

### Why Sentence Transformers?

1. ✅ **Zero Cost**: No API fees, unlimited usage
2. ✅ **Privacy**: Data never leaves your server
3. ✅ **Offline**: Works without internet after initial download
4. ✅ **Fast**: Local inference faster than API calls
5. ✅ **Customizable**: Swap models easily for domain-specific needs

### Alternative Models

Configure via `EMBEDDING_MODEL` in `.env`:

```bash
# Default (lightweight, fast)
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Better quality (slower, 420MB)
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2

# Multilingual (50+ languages)
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

## Architecture

### Components

1. **Data Processor** (`processor.py`): File parsing, validation, chunking, and text generation
2. **Vector Store** (`vector_store.py`): ChromaDB client management and CRUD operations
3. **Embeddings** (`embeddings.py`): Google Generative AI embedding generation with retry logic
4. **API Endpoint** (`app.py`): FastAPI `/data-upload` endpoint

### Data Flow

```
User Upload → File Validation → Format Detection → Parsing → 
Metadata Extraction → Chunking → Text Generation → 
Embedding Generation → Vector Storage → Response
```

## Supported File Formats

### CSV Files
- **Parsing**: pandas DataFrame
- **Chunking**: Row-based (default 50 rows per chunk)
- **Text Generation**: Includes column names, value ranges, summary statistics, geographic coverage (if lat/lon present)
- **Example Text**: "This dataset contains 50 rows with columns: species_name, latitude, longitude, depth, temperature. Species include Gadus morhua, observed at depths 10-150m..."

### JSON Files
- **Parsing**: Array of objects or nested structures
- **Chunking**: Object-based (default 100 objects per chunk)
- **Text Generation**: Field names, record counts, sample data
- **Example Text**: "This JSON dataset contains 100 records. Available fields: id, species, location, observations..."

### XML Files
- **Parsing**: xmltodict with root element detection
- **Chunking**: Element-based (default 50 elements per chunk)
- **Text Generation**: Root element, structure, sample elements
- **Example Text**: "This XML dataset (root: observations) contains 50 elements. Sample: {species: 'cod', depth: 120}..."

### netCDF Files
- **Parsing**: netCDF4 library with variable/dimension extraction
- **Chunking**: Time-based slices (default 10 time steps per chunk)
- **Text Generation**: Variables, dimensions, units, global attributes, time ranges
- **Example Text**: "This netCDF dataset covers time steps 1-10. Variables: temperature (°C), salinity (PSU). Region: 30-40°N..."

## API Usage

### Endpoint: `POST /data-upload`

**Request:**
```bash
curl -X POST http://localhost:8000/data-upload \
  -F "file=@species_data.csv" \
  -F "user_id=user123"
```

**Response:**
```json
{
  "success": true,
  "document_id": "user123_species_data_20231215_143022",
  "filename": "species_data.csv",
  "chunks_stored": 12,
  "metadata": {
    "file_format": "CSV",
    "columns": ["species_name", "latitude", "longitude", "depth"],
    "row_count": 587,
    "summary_stats": {
      "depth": {"mean": 85.3, "min": 10, "max": 200}
    }
  },
  "message": "Data uploaded and indexed successfully"
}
```

## Error Handling

### Client Errors (4xx)
- **400**: Invalid file format, size exceeded, parsing errors
- **422**: Missing/invalid user_id, malformed file structure

### Server Errors (5xx)
- **500**: Vector store errors, embedding generation failures, internal errors

### Error Response Example
```json
{
  "detail": "File size 55.23MB exceeds maximum 50MB"
}
```

## Configuration

### Environment Variables

```bash
# Google API Key (ONLY for LLM chat responses, NOT for embeddings)
GOOGLE_API_KEY=your_key_here

# Embedding Model (FREE - no API key needed!)
# Uses local SentenceTransformers from HuggingFace
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Optional (with defaults)
CHROMA_DB_PATH=./chroma_db
MAX_FILE_SIZE_MB=50
CHUNK_SIZE_CSV=50
CHUNK_SIZE_JSON=100
CHUNK_SIZE_XML=50
CHUNK_SIZE_NETCDF=10
```

### Embedding Configuration Details

- **EMBEDDING_MODEL**: Specifies the HuggingFace SentenceTransformer model
  - Default: `sentence-transformers/all-MiniLM-L6-v2` (~80MB, fast)
  - Alternative: `sentence-transformers/all-mpnet-base-v2` (better quality, slower)
  - Alternative: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (multilingual)
- **GOOGLE_API_KEY**: Required ONLY for the chat LLM (Gemini), NOT used for embeddings
- **Model Download**: SentenceTransformer models auto-download on first run and cache locally

## Vector Database

### ChromaDB Collections

**Collection Naming**: `user_{sanitized_user_id}_data`
- Isolates data per user
- Prevents cross-user contamination
- Example: `user_abc123_data`

**Embedding Function**: Local SentenceTransformer
- **Provider**: HuggingFace SentenceTransformers (open-source)
- **Model**: `sentence-transformers/all-MiniLM-L6-v2` by default
- **Dimension**: 384 (compact, efficient for semantic search)
- **Operation**: Runs locally on CPU/GPU, no external API calls
- **Cost**: Completely free, no rate limits
- **Privacy**: Data never leaves your server

- **Naming**: `user_{user_id}_data` (sanitized)
- **Isolation**: Each user has a separate collection
- **Persistence**: Stored in `CHROMA_DB_PATH` directory
- **Embedding Function**: Google Generative AI `models/embedding-001`
- **Distance Metric**: Cosine similarity

### Document Metadata

Each stored chunk includes:
```python
{
  "user_id": "user123",
  "filename": "species_data.csv",
  "upload_date": "2023-12-15T14:30:22Z",
  "file_format": "CSV",
  "chunk_index": 0,
  "total_chunks": 12,
  "document_id": "user123_species_data_20231215_143022"
}
```

## Performance

### Benchmarks (1000-row CSV)
- **Parsing**: ~1.2s
- **Chunking**: ~0.3s
- **Text Generation**: ~0.5s
- **Embedding Generation**: ~3.5s
- **Vector Storage**: ~0.8s
- **Total**: ~6.3s

### Optimizations
- Batch embedding generation
- Retry logic with exponential backoff
- Graceful error handling (skip failed chunks)
- In-memory processing for speed

## Testing

### Unit Tests
```python
# Test CSV parsing
await processor.parse_file(csv_content, "test.csv", "CSV")

# Test chunking
chunks = await processor.chunk_data(parsed_data, "CSV")

# Test text generation
text = processor.generate_chunk_text(chunk, metadata, "CSV")
```

### Integration Test
```python
# Upload file
response = await client.post("/data-upload", 
    files={"file": ("test.csv", csv_content)},
    data={"user_id": "test_user"})

# Query vector store
results = await vector_store.retrieve_documents("test_user", "species at depth >100m")
```

### Edge Cases
- Empty files → 400 error
- Malformed JSON → 400 with specific parse error
- Unsupported format → 400 with clear message
- File size >50MB → 400 with size info
- Missing user_id → 422 error

## Future Enhancements

1. **Streaming Upload**: Handle files >50MB with streaming parser
2. **Advanced Chunking**: Semantic chunking for CSV (group related rows)
3. **More Formats**: Support for Excel, Parquet, HDF5
4. **Compression**: Support .gz, .zip compressed files
5. **Incremental Updates**: Update existing documents instead of re-upload
6. **Query Endpoint**: Dedicated `/data-query` endpoint for retrieval
7. **Analytics**: Track upload statistics, storage usage per user

## Dependencies

```
chromadb==0.4.22          # Vector database
pandas==2.1.4             # CSV/JSON parsing
netCDF4==1.6.5            # netCDF parsing
xmltodict==0.13.0         # XML parsing
langchain-google-genai    # Embeddings
python-multipart          # File upload support
```

## Example Usage Scenarios

### Scenario 1: Marine Species Dataset
```python
# User uploads species_observations.csv (1000 rows)
# Columns: species, latitude, longitude, depth, temperature, date
# System creates 20 chunks (50 rows each)
# Each chunk text includes: species names, depth ranges, temp ranges, geographic bounds
# User can query: "What species were observed at depths >100m in cold water?"
```

### Scenario 2: Oceanographic Time Series
```python
# User uploads ocean_data.nc (netCDF with temperature, salinity, wave height)
# Time dimension: 100 time steps (hourly data)
# System creates 10 chunks (10 time steps each)
# Each chunk text includes: variable names, units, value ranges, time period
# User can query: "Show temperature trends during high wave conditions"
```

### Scenario 3: Research Survey Results
```python
# User uploads survey_results.json (500 observations)
# Structure: [{id, location, species, count, observer}, ...]
# System creates 5 chunks (100 records each)
# Each chunk text includes: field names, sample data, value distributions
# User can query: "Which observers recorded the most species diversity?"
```

## Troubleshooting

### SentenceTransformer Model Issues

**Model Download Fails**:
- Check internet connection (required for first-time download only)
- Verify HuggingFace is accessible (not blocked by firewall)
- Pre-download manually:
  ```python
  from sentence_transformers import SentenceTransformer
  model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
  ```

**Out of Memory**:
- Reduce batch size in `embeddings.py` (default: 32)
- Use a smaller model: `sentence-transformers/paraphrase-MiniLM-L3-v2` (smaller, faster)
- Increase system RAM or use GPU

**Slow Embedding Generation**:
- Enable GPU if available (CUDA auto-detected)
- Install PyTorch with CUDA:
  ```bash
  pip install torch --index-url https://download.pytorch.org/whl/cu118
  ```
- Use a faster model: stick with `all-MiniLM-L6-v2` (optimized for speed)

### Data Upload Errors

### Issue: "chromadb not found"
**Solution**: Install dependencies: `pip install -r requirements.txt`

### Issue: "netCDF4 import error"
**Solution**: Install system dependencies (libhdf5, libnetcdf), then `pip install netCDF4`

### Issue: "Embedding generation timeout"
**Solution**: Check GOOGLE_API_KEY, verify API quota, check network connectivity

### Issue: "Collection already exists error"
**Solution**: Use `get_or_create_collection` (already implemented), or reset DB if needed

### Issue: "File too large"
**Solution**: Increase MAX_FILE_SIZE_MB env var, or split file into smaller chunks

## Security Considerations

1. **User Isolation**: Collections are user-specific, queries filter by user_id
2. **Input Validation**: File size, format, user_id format validated
3. **Sanitization**: Collection names sanitized to prevent injection
4. **Error Messages**: Generic errors to external users, detailed logs internally
5. **Rate Limiting**: Consider adding rate limits for uploads (future)

## Monitoring & Logging

### Log Patterns
```
[DataUpload] Processing file: species.csv for user: user123
[Processor] Parsing CSV file: species.csv
[Processor] Parsed in 1.23s
[Processor] Chunking CSV data
[Processor] Created 12 CSV chunks
[DataUpload] Generated text for 12 chunks
[DataUpload] Generated 12 embeddings
[VectorStore] Collection 'user_user123_data' ready
[VectorStore] Stored 12 chunks for document 'user123_species_20231215_143022'
[DataUpload] Completed in 6.45s
```

### Metrics to Track
- Upload count per user
- Average processing time per format
- Chunk count distribution
- Embedding generation latency
- Vector store size
- Error rates by error type
