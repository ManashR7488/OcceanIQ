"""
Taxonomy Search Logic using Tavily API
Performs targeted searches for comprehensive species data
"""

from tavily import TavilyClient
import os

# Initialize Tavily client
tavily_client = None
if os.environ.get("TAVILY_API_KEY"):
    tavily_client = TavilyClient(api_key=os.environ.get("TAVILY_API_KEY"))
    print("[TaxonomySearch] Tavily client initialized")
else:
    print("[TaxonomySearch] WARNING: TAVILY_API_KEY not found - search will fail")


async def search_taxonomy_data(species: str) -> dict:
    """
    Search for comprehensive taxonomy data using multiple targeted queries.
    
    Args:
        species: Scientific or common name of the species
        
    Returns:
        dict with:
            - search_results: str (formatted aggregated content)
            - references: List[dict] (source metadata)
    """
    if not tavily_client:
        raise ValueError("Tavily client not initialized. Set TAVILY_API_KEY in environment.")
    
    try:
        print(f"[TaxonomySearch] Searching for: {species}")
        
        queries = [
            f"{species} scientific name taxonomy WoRMS FishBase classification hierarchy",
            f"{species} morphology body length weight distinctive features identification key",
            f"{species} habitat depth range temperature salinity substrate marine environment",
            f"{species} behavior feeding ecology diet predation social structure migration spawning",
            f"{species} distribution geographic range IUCN conservation status fisheries importance"
        ]
        
        all_results = []
        
        for idx, query in enumerate(queries, 1):
            print(f"[TaxonomySearch] Query {idx}/5: {query[:60]}...")
            response = tavily_client.search(
                query=query,
                max_results=4,
                search_depth="advanced",
                include_images=True,
                include_domains=["fishbase.org", "marinespecies.org", "wikipedia.org", "gbif.org", "iucnredlist.org"]
            )
            all_results.extend(response.get('results', []))
        
        # Format results with explicit image extraction
        formatted_results = []
        image_candidates = []

        for i, r in enumerate(all_results):
            content = f"[{i+1}] {r['title']}\n{r['content']}\n{r['url']}"
            formatted_results.append(content)
            
            # Extract images from Tavily results
            if r.get('images'):
                for img in r['images'][:2]:  # Top 2 images per result
                    image_candidates.append({
                        'url': img['url'],
                        'source': r['title'],
                        'width': img.get('width', 800),
                        'height': img.get('height', 600)
                    })

        formatted_results = "\n\n".join(formatted_results)

        # Add image summary to search results
        image_summary = "\n\nIMAGE CANDIDATES:\n" + "\n".join([
            f"- {img['url']} (from {img['source']}, {img['width']}x{img['height']})"
            for img in image_candidates[:5]  # Top 5 images
        ]) if image_candidates else "\n\nNo images found in search results"
        
        references = [
            {
                "id": i+1,
                "title": r['title'],
                "url": r['url'],
                "content": r['content'][:800]
            }
            for i, r in enumerate(all_results)
        ]
        
        print(f"[TaxonomySearch] Found {len(all_results)} results from {len(queries)} queries")
        print(f"[TaxonomySearch] Extracted {len(image_candidates)} image candidates")
        
        return {
            "search_results": formatted_results + image_summary,
            "references": references,
            "image_candidates": image_candidates
        }
        
    except Exception as e:
        print(f"[TaxonomySearch] Error: {str(e)}")
        raise ValueError(f"Taxonomy search failed: {str(e)}")

