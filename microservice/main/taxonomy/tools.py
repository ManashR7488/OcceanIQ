"""
LangChain tools for taxonomy identification
"""
from langchain_core.tools import tool
from tavily import TavilyClient
import os

# Initialize Tavily client defensively
tavily_client = None
if os.environ.get("TAVILY_API_KEY"):
    tavily_client = TavilyClient(api_key=os.environ.get("TAVILY_API_KEY"))
    print("[TaxonomyTools] Tavily client initialized")
else:
    print("[TaxonomyTools] WARNING: TAVILY_API_KEY not found - tool will fail if invoked")

@tool
def search_marine_species(query: str, max_results: int = 3) -> str:
    """
    Search for marine species information using Tavily.
    
    Args:
        query: Search query (e.g., "Atlantic Cod breeding behavior")
        max_results: Number of results to return (default: 3)
        
    Returns:
        Formatted search results with titles, content, and URLs
    """
    if not tavily_client:
        return "Search failed: Tavily API key not configured. Set TAVILY_API_KEY environment variable."
    
    try:
        response = tavily_client.search(
            query=query,
            max_results=max_results,
            search_depth="advanced",
            include_domains=["fishbase.org", "marinespecies.org", "wikipedia.org", "gbif.org"]
        )
        
        results = response.get('results', [])
        formatted = "\n\n".join([
            f"[{i+1}] {r['title']}\n{r['content']}\n{r['url']}"
            for i, r in enumerate(results)
        ])
        
        return formatted or "No results found"
        
    except Exception as e:
        return f"Search failed: {str(e)}"
