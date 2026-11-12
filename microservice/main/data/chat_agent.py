from typing import TypedDict, List, Dict, Optional
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from .vector_store import VectorStore
import statistics
import os
import re
from datetime import datetime
from langchain_openai import ChatOpenAI


# State definition
class DataChatState(TypedDict):
    user_id: str
    document_id: Optional[str]
    query: str
    conversation_history: List[Dict[str, str]]  # [{"role": "user/assistant", "content": "..."}]
    retrieved_chunks: List[Dict]
    analysis_results: Dict
    response: str


# Determine preferred LLM from environment (default: openai)
PREFERRED_LLM = os.environ.get("PREFERRED_LLM", "openai").lower()

# Initialize both LLMs for fallback capability
llm_openai = None
llm_gemini = None

try:
    if os.environ.get("OPENAI_API_KEY"):
        llm_openai = ChatOpenAI(
            model="gpt-4o-mini",  # Use mini for faster responses and lower cost
            openai_api_key=os.environ.get("OPENAI_API_KEY"),
            temperature=0.3,
        )
        print("[ChatAgent] OpenAI LLM initialized")
except Exception as e:
    print(f"[ChatAgent] Failed to initialize OpenAI LLM: {e}")

try:
    if os.environ.get("GOOGLE_API_KEY"):
        llm_gemini = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=os.environ.get("GOOGLE_API_KEY"),
            temperature=0.3
        )
        print("[ChatAgent] Gemini LLM initialized")
except Exception as e:
    print(f"[ChatAgent] Failed to initialize Gemini LLM: {e}")

# Check if strict LLM config is required (default: False for dev flexibility)
STRICT_LLM_CONFIG = os.environ.get("STRICT_LLM_CONFIG", "false").lower() == "true"

# Set primary LLM based on preference
if PREFERRED_LLM == "gemini" and llm_gemini:
    llm = llm_gemini
    llm_fallback = llm_openai
elif llm_openai:
    llm = llm_openai
    llm_fallback = llm_gemini
elif llm_gemini:
    llm = llm_gemini
    llm_fallback = None
else:
    # Soft-fail: Set to None and log warning instead of crashing
    llm = None
    llm_fallback = None
    
    if STRICT_LLM_CONFIG:
        # Production mode: fail hard if no LLM configured
        raise RuntimeError(
            "No LLM configured. Please set OPENAI_API_KEY or GOOGLE_API_KEY in .env. "
            "To allow the service to start without LLM (requests will fail), set STRICT_LLM_CONFIG=false."
        )
    else:
        # Development mode: allow service to start, requests will fail gracefully
        print("\n" + "="*70)
        print("⚠️  WARNING: NO LLM CONFIGURED")
        print("="*70)
        print("No OPENAI_API_KEY or GOOGLE_API_KEY found in environment.")
        print("The FastAPI service will start, but /data-chat requests will fail.")
        print("")
        print("To fix this:")
        print("  1. Set OPENAI_API_KEY or GOOGLE_API_KEY in .env file")
        print("  2. Restart the microservice")
        print("")
        print("To prevent service from starting without LLM (production mode):")
        print("  Set STRICT_LLM_CONFIG=true in .env")
        print("="*70 + "\n")

if llm:
    print(f"[ChatAgent] Primary LLM: {PREFERRED_LLM}, Fallback available: {llm_fallback is not None}")
else:
    print(f"[ChatAgent] No LLM initialized - requests will fail at runtime")


# Statistical Analysis Tools
def compute_statistics(chunks: List[Dict], field: str = None) -> Dict:
    """Extract numeric values from chunks and compute stats"""
    values = []
    
    # Known metric fields to prioritize (marine/oceanographic data)
    priority_fields = [
        'min', 'max', 'mean', 'average',
        'temperature', 'salinity', 'depth', 'latitude', 'longitude',
        'ph', 'oxygen', 'chlorophyll', 'nitrate', 'phosphate'
    ]
    
    for chunk in chunks:
        metadata = chunk.get("metadata", {})
        
        # First, try to extract from structured metadata with priority fields
        if metadata:
            for key, value in metadata.items():
                key_lower = key.lower()
                # Only extract if it's a priority field
                if any(pf in key_lower for pf in priority_fields):
                    if isinstance(value, (int, float)):
                        values.append(float(value))
                    elif isinstance(value, str):
                        try:
                            num = float(value)
                            values.append(num)
                        except ValueError:
                            pass
        
        # Only fall back to text extraction if no metadata values found
        if not values:
            chunk_text = chunk.get("text", "")
            # Look for numbers near priority keywords (within 20 chars)
            for priority in priority_fields:
                pattern = rf'{priority}[:\s]+(-?\d+\.?\d*)'
                matches = re.findall(pattern, chunk_text, re.IGNORECASE)
                for match in matches:
                    try:
                        values.append(float(match))
                    except ValueError:
                        pass
    
    if not values:
        return {"error": "No numeric data found"}
    
    return {
        "mean": round(statistics.mean(values), 2),
        "median": round(statistics.median(values), 2),
        "std": round(statistics.stdev(values), 2) if len(values) > 1 else 0,
        "min": round(min(values), 2),
        "max": round(max(values), 2),
        "count": len(values)
    }


def detect_trends(chunks: List[Dict]) -> Dict:
    """Identify patterns in time-series data"""
    values = []
    
    # Priority fields for trend analysis
    priority_fields = [
        'temperature', 'salinity', 'depth', 'ph', 'oxygen',
        'chlorophyll', 'nitrate', 'phosphate'
    ]
    
    for chunk in chunks:
        metadata = chunk.get("metadata", {})
        
        # Prioritize structured metadata
        if metadata:
            for key, value in metadata.items():
                key_lower = key.lower()
                if any(pf in key_lower for pf in priority_fields):
                    if isinstance(value, (int, float)):
                        values.append(float(value))
                    elif isinstance(value, str):
                        try:
                            values.append(float(value))
                        except ValueError:
                            pass
        
        # Fallback to text extraction if no metadata
        if not values:
            chunk_text = chunk.get("text", "")
            for priority in priority_fields:
                pattern = rf'{priority}[:\s]+(-?\d+\.?\d*)'
                matches = re.findall(pattern, chunk_text, re.IGNORECASE)
                for match in matches:
                    try:
                        values.append(float(match))
                    except ValueError:
                        pass
    
    if len(values) < 2:
        return {"trend": "insufficient_data", "message": "Not enough data points to detect trend"}
    
    # Simple trend detection using linear comparison
    increases = sum(1 for i in range(1, len(values)) if values[i] > values[i-1])
    decreases = sum(1 for i in range(1, len(values)) if values[i] < values[i-1])
    
    total_changes = increases + decreases
    if total_changes == 0:
        return {"trend": "stable", "message": "Values remain constant"}
    
    increase_ratio = increases / total_changes
    
    if increase_ratio > 0.6:
        return {"trend": "increasing", "message": f"Data shows an increasing trend ({increase_ratio*100:.1f}% increases)"}
    elif increase_ratio < 0.4:
        return {"trend": "decreasing", "message": f"Data shows a decreasing trend ({(1-increase_ratio)*100:.1f}% decreases)"}
    else:
        return {"trend": "fluctuating", "message": "Data shows fluctuating pattern with no clear trend"}


def compare_values(chunks: List[Dict], field1: str = None, field2: str = None) -> Dict:
    """Compare two fields across chunks"""
    # Extract all numeric values grouped by their context
    values_list = []
    
    # Priority fields for comparison
    priority_fields = [
        'temperature', 'salinity', 'depth', 'ph', 'oxygen',
        'chlorophyll', 'nitrate', 'phosphate'
    ]
    
    for chunk in chunks:
        metadata = chunk.get("metadata", {})
        chunk_values = []
        
        # Prioritize structured metadata
        if metadata:
            for key, value in metadata.items():
                key_lower = key.lower()
                if any(pf in key_lower for pf in priority_fields):
                    if isinstance(value, (int, float)):
                        chunk_values.append(float(value))
                    elif isinstance(value, str):
                        try:
                            chunk_values.append(float(value))
                        except ValueError:
                            pass
        
        # Fallback to text extraction if no metadata
        if not chunk_values:
            chunk_text = chunk.get("text", "")
            for priority in priority_fields:
                pattern = rf'{priority}[:\s]+(-?\d+\.?\d*)'
                matches = re.findall(pattern, chunk_text, re.IGNORECASE)
                for match in matches:
                    try:
                        chunk_values.append(float(match))
                    except ValueError:
                        pass
        
        if chunk_values:
            values_list.append(chunk_values)
    
    if len(values_list) < 2:
        return {"comparison": "insufficient_data", "message": "Not enough data to compare"}
    
    # Compare first half vs second half of chunks
    mid = len(values_list) // 2
    first_half = [v for chunk in values_list[:mid] for v in chunk]
    second_half = [v for chunk in values_list[mid:] for v in chunk]
    
    if not first_half or not second_half:
        return {"comparison": "insufficient_data", "message": "Not enough data in segments to compare"}
    
    avg1 = statistics.mean(first_half)
    avg2 = statistics.mean(second_half)
    
    diff = avg2 - avg1
    diff_percent = (diff / avg1 * 100) if avg1 != 0 else 0
    
    return {
        "comparison": "completed",
        "first_segment_mean": round(avg1, 2),
        "second_segment_mean": round(avg2, 2),
        "difference": round(diff, 2),
        "percent_change": round(diff_percent, 2),
        "message": f"Second segment average is {abs(diff_percent):.1f}% {'higher' if diff > 0 else 'lower'} than first segment"
    }


# Node 1: Retriever
async def retriever_node(state: DataChatState, vector_store: VectorStore):
    """Fetch relevant data chunks from vector store"""
    print(f"[Retriever] Searching for: {state['query'][:100]}...")
    
    user_id = state['user_id']
    query = state['query']
    document_id = state.get('document_id')
    
    # Build filters if document_id provided
    filters = None
    if document_id:
        filters = {"document_id": document_id}
    
    try:
        # Retrieve top 5 relevant chunks
        results = await vector_store.retrieve_documents(
            user_id=user_id,
            query=query,
            n_results=5,
            filters=filters
        )
        
        # Results is already a list of dicts with text, metadata, distance
        retrieved_chunks = results if results else []
        
        # Debug: Log retrieval details
        print(f"[Retriever] Filters applied: {filters}")
        print(f"[Retriever] Retrieved chunks: {len(retrieved_chunks)}")
        if retrieved_chunks:
            print(f"[Retriever] Sample chunk metadata: {retrieved_chunks[0].get('metadata', {})}")
            distances = [c['distance'] for c in retrieved_chunks if c.get('distance') is not None]
            if distances:
                print(f"[Retriever] Distance range: {min(distances):.4f} - {max(distances):.4f}")
        else:
            print(f"[Retriever] WARNING: No chunks found for user_id={user_id}, document_id={document_id}")
        
        print(f"[Retriever] Found {len(retrieved_chunks)} chunks")
        
        return {
            "retrieved_chunks": retrieved_chunks
        }
        
    except Exception as e:
        print(f"[Retriever] Error: {str(e)}")
        return {
            "retrieved_chunks": []
        }


# Node 2: Analyzer
async def analyzer_node(state: DataChatState):
    """Apply statistical tools if query requires computation"""
    query = state['query'].lower()
    chunks = state['retrieved_chunks']
    
    print(f"[Analyzer] Analyzing query for computation needs...")
    
    analysis_results = {}
    
    # Detect if query asks for statistics
    stats_keywords = ['average', 'mean', 'median', 'std', 'standard deviation', 'min', 'max', 'range', 'statistics']
    if any(keyword in query for keyword in stats_keywords):
        print("[Analyzer] Computing statistics...")
        analysis_results['statistics'] = compute_statistics(chunks)
    
    # Detect if query asks for trends
    trend_keywords = ['trend', 'pattern', 'increasing', 'decreasing', 'change over time', 'temporal']
    if any(keyword in query for keyword in trend_keywords):
        print("[Analyzer] Detecting trends...")
        analysis_results['trends'] = detect_trends(chunks)
    
    # Detect if query asks for comparison
    compare_keywords = ['compare', 'comparison', 'difference', 'versus', 'vs', 'between']
    if any(keyword in query for keyword in compare_keywords):
        print("[Analyzer] Comparing values...")
        analysis_results['comparison'] = compare_values(chunks)
    
    print(f"[Analyzer] Analysis complete. Results: {list(analysis_results.keys())}")
    
    return {
        "analysis_results": analysis_results
    }


# Node 3: Responder
async def responder_node(state: DataChatState):
    """Generate natural language response using LLM"""
    print("[Responder] Generating response...")
    
    query = state['query']
    chunks = state['retrieved_chunks']
    analysis = state['analysis_results']
    history = state.get('conversation_history', [])
    
    # Check if any data was found
    if not chunks:
        # Provide detailed error message
        error_details = "No data chunks retrieved for your query. "
        if state.get('document_id'):
            error_details += f"Dataset ID: {state['document_id']}. "
        error_details += "Please verify: (1) Data was uploaded successfully, (2) You selected the correct dataset, (3) Your query matches the data content."
        
        response = error_details
        new_history = history + [
            {"role": "user", "content": query},
            {"role": "assistant", "content": response}
        ]
        return {
            "response": response,
            "conversation_history": new_history[-10:]  # Keep last 10 messages
        }
    
    # Format retrieved chunks for prompt
    chunks_text = "\n\n".join([
        f"Data Chunk {i+1} (Relevance: {1-chunk['distance']:.2f}):\n{chunk['text']}"
        for i, chunk in enumerate(chunks[:5])
    ])
    
    # Format analysis results
    analysis_text = ""
    if analysis:
        analysis_text = "\n\nAnalysis Results:\n"
        for key, value in analysis.items():
            analysis_text += f"{key.title()}: {value}\n"
    
    # Format conversation history
    history_text = ""
    if history:
        history_text = "\n\nConversation History:\n"
        history_text += "\n".join([
            f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
            for msg in history[-10:]
        ])
    
    # Build prompt
    system_prompt = """You are a marine data analyst assistant. Answer the user's question based on their uploaded oceanographic and marine biodiversity data.

Guidelines:
- Provide clear, concise answers with specific values and insights
- Reference the actual data from the retrieved chunks
- If statistical analysis was performed, incorporate those results
- Maintain context from the conversation history
- If the data doesn't fully answer the question, acknowledge limitations
- Use scientific terminology appropriately but explain complex concepts
- Format numeric values clearly (e.g., with units if mentioned in data)"""
    
    user_prompt = f"""User Query: {query}

Relevant Data:
{chunks_text}
{analysis_text}
{history_text}

Based on the above data and analysis, provide a comprehensive answer to the user's query."""
    
    try:
        import asyncio
        
        # Guard: Check if LLM is configured
        if llm is None:
            print("[Responder] ERROR: No LLM configured")
            error_details = {
                "error_type": "ConfigurationError",
                "error_message": "No LLM API keys configured. Please set OPENAI_API_KEY or GOOGLE_API_KEY.",
                "stack_trace": "LLM initialization failed during service startup",
                "query_length": len(query),
                "chunks_count": len(chunks),
                "history_length": len(history)
            }
            
            error_response = (
                "🔧 Configuration Error: No AI language model is configured. "
                "Please contact the administrator to set up OPENAI_API_KEY or GOOGLE_API_KEY."
            )
            
            new_history = history + [
                {"role": "user", "content": query},
                {"role": "assistant", "content": error_response}
            ]
            
            return {
                "response": error_response,
                "conversation_history": new_history[-10:],
                "error": True,
                "error_details": error_details
            }
        
        # Estimate token count (rough: 1 token ≈ 4 chars)
        prompt_size = len(system_prompt) + len(user_prompt)
        estimated_tokens = prompt_size // 4
        print(f"[Responder] Estimated prompt tokens: {estimated_tokens}")
        
        # Truncate if too large (keep within 8000 tokens for safety)
        if estimated_tokens > 8000:
            print(f"[Responder] WARNING: Prompt too large ({estimated_tokens} tokens), truncating...")
            # Keep only first 3 chunks and last 5 history messages
            chunks_text = "\n\n".join([
                f"Data Chunk {i+1}:\n{chunk['text'][:500]}..."  # Truncate each chunk
                for i, chunk in enumerate(chunks[:3])
            ])
            history_text = "\n".join([
                f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content'][:200]}..."
                for msg in history[-5:]
            ])
            user_prompt = f"""User Query: {query}

Relevant Data (truncated):
{chunks_text}
{analysis_text}
{history_text}

Based on the above data, provide a concise answer."""
        
        # Try primary LLM with retry
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response_text = None
        last_error = None
        
        for attempt in range(2):  # 2 attempts with primary LLM
            try:
                print(f"[Responder] Attempt {attempt + 1} with primary LLM...")
                response = await llm.ainvoke(messages, timeout=90)
                response_text = response.content
                
                # Validate response
                if response_text and isinstance(response_text, str) and len(response_text.strip()) > 0:
                    print(f"[Responder] Success with primary LLM on attempt {attempt + 1}")
                    break
                else:
                    raise ValueError("Empty or invalid response from LLM")
            except Exception as e:
                last_error = e
                print(f"[Responder] Primary LLM attempt {attempt + 1} failed: {str(e)}")
                if attempt == 0:
                    await asyncio.sleep(2)  # Wait before retry
        
        # Fallback to secondary LLM if primary failed
        if not response_text and llm_fallback:
            print(f"[Responder] Trying fallback LLM...")
            try:
                response = await llm_fallback.ainvoke(messages, timeout=90)
                response_text = response.content
                
                if response_text and isinstance(response_text, str) and len(response_text.strip()) > 0:
                    print(f"[Responder] Success with fallback LLM")
                else:
                    raise ValueError("Empty response from fallback LLM")
            except Exception as e:
                print(f"[Responder] Fallback LLM also failed: {str(e)}")
                last_error = e
        
        # If still no response, raise the last error
        if not response_text:
            raise last_error or ValueError("All LLM attempts failed")
        
        print(f"[Responder] Generated response: {response_text[:100]}...")
        print(f"[Responder] Response length: {len(response_text)} characters")
        
        # Update conversation history
        new_history = history + [
            {"role": "user", "content": query},
            {"role": "assistant", "content": response_text}
        ]
        
        return {
            "response": response_text,
            "conversation_history": new_history[-10:]  # Keep last 10 messages
        }
        
    except Exception as e:
        import traceback
        error_details = {
            "error_type": type(e).__name__,
            "error_message": str(e),
            "stack_trace": traceback.format_exc(),
            "query_length": len(query),
            "chunks_count": len(chunks),
            "history_length": len(history)
        }
        
        print(f"[Responder] ERROR DETAILS:")
        print(f"  Type: {error_details['error_type']}")
        print(f"  Message: {error_details['error_message']}")
        print(f"  Query: {query[:100]}...")
        print(f"  Chunks: {len(chunks)}")
        print(f"  Stack Trace:\n{error_details['stack_trace']}")
        
        # Determine user-friendly error message based on error type
        if "timeout" in str(e).lower() or "timed out" in str(e).lower():
            error_response = "⏱️ Request timeout. Your query is taking too long to process. Try a simpler question or reduce the dataset size."
        elif "api" in str(e).lower() or "key" in str(e).lower() or "auth" in str(e).lower():
            error_response = "🔑 API authentication error. The AI service is temporarily unavailable. Please contact support."
        elif "rate" in str(e).lower() or "limit" in str(e).lower():
            error_response = "⚠️ Rate limit exceeded. Please wait a moment and try again."
        elif "token" in str(e).lower():
            error_response = "📏 Query too large. Try asking about specific data fields or reducing the conversation history."
        else:
            error_response = f"❌ Unable to generate response: {error_details['error_type']}. Please try rephrasing your question or contact support."
        
        new_history = history + [
            {"role": "user", "content": query},
            {"role": "assistant", "content": error_response}
        ]
        return {
            "response": error_response,
            "conversation_history": new_history[-10:],
            "error": True,
            "error_details": error_details  # Include for debugging
        }


# Build workflow
def create_workflow(vector_store: VectorStore):
    """Create the LangGraph workflow with vector store dependency"""
    
    workflow = StateGraph(DataChatState)
    
    # Add nodes with vector_store binding for retriever
    async def retriever_with_store(state):
        return await retriever_node(state, vector_store)
    
    workflow.add_node("retriever", retriever_with_store)
    workflow.add_node("analyzer", analyzer_node)
    workflow.add_node("responder", responder_node)
    
    # Define edges
    workflow.set_entry_point("retriever")
    workflow.add_edge("retriever", "analyzer")
    workflow.add_edge("analyzer", "responder")
    workflow.add_edge("responder", END)
    
    return workflow.compile()


# Main entry point
async def run_data_chat(
    user_id: str,
    query: str,
    vector_store: VectorStore,
    document_id: Optional[str] = None,
    conversation_history: List[Dict] = None
) -> Dict:
    """Run data chat workflow"""
    print(f"\n{'='*60}")
    print(f"[DataChat Agent] Starting workflow")
    print(f"User: {user_id}")
    print(f"Query: {query}")
    print(f"Document ID: {document_id or 'All documents'}")
    print(f"{'='*60}\n")
    
    # Initialize state
    initial_state = {
        "user_id": user_id,
        "document_id": document_id,
        "query": query,
        "conversation_history": conversation_history or [],
        "retrieved_chunks": [],
        "analysis_results": {},
        "response": ""
    }
    
    # Create and run workflow
    app = create_workflow(vector_store)
    
    try:
        final_state = await app.ainvoke(initial_state)
        
        print(f"\n{'='*60}")
        print(f"[DataChat Agent] Workflow completed")
        print(f"Response length: {len(final_state.get('response', ''))} chars")
        print(f"Chunks retrieved: {len(final_state.get('retrieved_chunks', []))}")
        print(f"{'='*60}\n")
        
        return {
            "response": final_state.get("response", "No response generated"),
            "sources": final_state.get("retrieved_chunks", []),
            "conversation_history": final_state.get("conversation_history", []),
            "analysis_results": final_state.get("analysis_results", {})
        }
        
    except Exception as e:
        print(f"[DataChat Agent] Workflow error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "response": f"An error occurred while processing your query: {str(e)}",
            "sources": [],
            "conversation_history": conversation_history or [],
            "analysis_results": {}
        }
