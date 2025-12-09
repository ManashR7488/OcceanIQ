"""
LangGraph Taxonomy Identification Agent

Multi-node workflow using OpenAI exclusively:
1. Input Router: Detect input type (name vs. image)
2. Vision Analyzer: Extract species hypothesis from images (OpenAI gpt-4o-mini)
3. Search Node: Gather taxonomy data via Tavily
4. Synthesis Node: Generate structured JSON (OpenAI gpt-4o-mini)
5. Validation Node: Ensure output schema compliance
"""

from typing import TypedDict, List, Dict
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
import os
import json
from .vision import analyze_species_image
from .search import search_taxonomy_data
from .tools import search_marine_species


# State definition
class TaxonomyState(TypedDict):
    input: str
    input_type: str  # "name" or "image"
    vision_result: Dict
    species_hypothesis: str
    search_results: str
    references: List[Dict]
    image_candidates: List[Dict]
    taxonomy_data: Dict


# Initialize OpenAI LLM for synthesis
llm = None
if os.environ.get("OPENAI_API_KEY"):
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=os.environ.get("OPENAI_API_KEY"),
        temperature=0.2
    )
    print("[TaxonomyAgent] OpenAI LLM initialized (gpt-4o-mini)")
else:
    print("[TaxonomyAgent] WARNING: OPENAI_API_KEY not found - synthesis will fail")


# Node 1: Input Router
async def input_router_node(state: TaxonomyState) -> TaxonomyState:
    """Route based on input type"""
    print(f"\n[InputRouter] Type: {state['input_type']}")
    
    if state['input_type'] == 'name':
        state['species_hypothesis'] = state['input']
        print(f"[InputRouter] Using name: {state['species_hypothesis']}")
    else:
        print(f"[InputRouter] Will analyze image")
    
    return state


# Node 2: Vision Analyzer
async def vision_node(state: TaxonomyState) -> TaxonomyState:
    """Analyze image with OpenAI vision if input is image"""
    if state['input_type'] != 'image':
        print("[Vision] Skipping (not an image)")
        return state
    
    print(f"\n[Vision] Analyzing: {state['input'][:80]}...")
    
    try:
        result = await analyze_species_image(state['input'])
        state['vision_result'] = result
        
        # Use hypothesis if confidence is reasonable
        if result.get('confidence', 0) < 0.5:
            print(f"[Vision] Low confidence ({result.get('confidence', 0):.2f}), using fallback")
            state['species_hypothesis'] = "unknown_marine_species"
        else:
            state['species_hypothesis'] = result.get('hypothesis', 'unknown_marine_species')
        
        print(f"[Vision] Hypothesis: {state['species_hypothesis']}")
        
    except Exception as e:
        print(f"[Vision] Error: {str(e)}")
        # Fallback to generic
        state['species_hypothesis'] = state['input']
        state['vision_result'] = {"error": str(e)}
    
    return state


# Node 3: Search Node
async def search_node(state: TaxonomyState) -> TaxonomyState:
    """Search for taxonomy data using Tavily"""
    print(f"\n[Search] Searching: {state['species_hypothesis']}")
    
    try:
        search = await search_taxonomy_data(state['species_hypothesis'])
        state['search_results'] = search['search_results']
        state['references'] = search['references']
        state['image_candidates'] = search.get('image_candidates', [])
        
        print(f"[Search] Found {len(state['references'])} references")
        print(f"[Search] Found {len(state['image_candidates'])} image candidates")
        
    except Exception as e:
        print(f"[Search] Error: {str(e)}")
        state['search_results'] = f"Search failed: {str(e)}"
        state['references'] = []
    
    return state


# Node 4: Synthesis Node
async def synthesis_node(state: TaxonomyState) -> TaxonomyState:
    """Use OpenAI with Tavily tool to synthesize structured JSON"""
    print(f"\n[Synthesis] Generating taxonomy JSON...")
    
    if not llm:
        raise ValueError("OpenAI LLM not initialized. Set OPENAI_API_KEY in environment.")
    
    # Bind Tavily tool to LLM
    llm_with_tools = llm.bind_tools([search_marine_species])
    
    # Build enhanced prompt
    vision_info = json.dumps(state.get('vision_result', {})) if state.get('vision_result') else "{}"
    
    prompt = f"""You are a marine biology expert synthesizing comprehensive species taxonomy data.

**INPUT DATA:**
- User Input: {state['input']}
- Vision Analysis: {vision_info}
- Search Results (from 5 targeted queries): {state['search_results'][:6000]}

**TASK:** Generate a complete, scientifically accurate taxonomy JSON. Prioritize detail and accuracy.

**CRITICAL INSTRUCTIONS:**

1. **Description** (200-400 words):
   - Start with taxonomic classification and family characteristics
   - Include physical appearance (body shape, coloration, fin structure)
   - Mention size range (typical and maximum)
   - Note distinctive identification features
   - Add ecological role (predator/prey, ecosystem function)
   - Include any uncertainty or regional variations

2. **Habitat** (100-200 words):
   - Specify depth range (e.g., "0-200m, primarily 50-150m")
   - Temperature preferences (e.g., "10-20°C, optimal 15°C")
   - Substrate type (rocky reefs, sandy bottoms, kelp forests, etc.)
   - Geographic zones (coastal, pelagic, benthic, etc.)
   - Salinity tolerance (marine, brackish, euryhaline)
   - Associated ecosystems (coral reefs, mangroves, seagrass beds)

3. **Behavior (Ecology.behavior)** (100-200 words):
   - Feeding strategy (ambush predator, filter feeder, grazer, etc.)
   - Activity patterns (diurnal, nocturnal, crepuscular)
   - Social structure (solitary, schooling, territorial)
   - Migration patterns (seasonal, spawning, feeding migrations)
   - Reproductive behavior (spawning aggregations, parental care)
   - Predator avoidance strategies
   - Symbiotic relationships

4. **Morphology**:
   - maxLength: in centimeters (cm), use typical adult size
   - maxWeight: in kilograms (kg)
   - distinctiveFeatures: List 3-7 key identification traits (e.g., "Three dorsal fins", "Barbel on chin", "Lateral line visible")

5. **Ecology.diet**:
   - Primary food sources (specific prey species if known)
   - Feeding method (active hunting, scavenging, filter feeding)
   - Ontogenetic diet shifts (juvenile vs. adult diets)

6. **External Links**:
   - Prioritize authoritative sources: FishBase, WoRMS, GBIF, Wikipedia
   - Use exact URLs from search results when available

**IMAGE SELECTION (CRITICAL):**
From search results IMAGE CANDIDATES section, select EXACTLY ONE best representative image:
1. PRIORITY: FishBase canonical photo > WoRMS > Wikipedia infobox > GBIF specimen
2. Must be high-quality (width ≥400px), species-specific (not habitat/stock photo)
3. Set imageUrl = full resolution URL
4. Set thumbnailUrl = same URL (frontend resizes) OR append ?w=300&h=300&fit=crop if supported
5. If no suitable image found, set both to null (do NOT use generic images)

Example:
imageUrl: "https://www.fishbase.se/images/species/ThUnk_Atla_c_01.jpg"
thumbnailUrl: "https://www.fishbase.se/images/species/ThUnk_Atla_c_01.jpg?w=300"

**Final Validation Before JSON Output:**
- imageUrl: Valid HTTPS URL OR null
- thumbnailUrl: Matches imageUrl OR null
- At least one image if search provided candidates

**OUTPUT FORMAT:** Return ONLY valid JSON (no markdown, no explanations):
{{
  "scientificName": "Genus species",
  "commonNames": ["Primary Name", "Alternative Name"],
  "taxonomicHierarchy": {{
    "kingdom": "Animalia",
    "phylum": "Chordata",
    "class": "Actinopterygii",
    "order": "OrderName",
    "family": "FamilyName",
    "genus": "Genus",
    "species": "Genus species"
  }},
  "description": "Comprehensive 200-400 word description...",
  "habitat": "Detailed 100-200 word habitat description...",
  "distribution": "Geographic range with specific regions...",
  "morphology": {{
    "maxLength": 120,
    "maxWeight": 15.5,
    "distinctiveFeatures": ["Feature 1", "Feature 2", "Feature 3"]
  }},
  "ecology": {{
    "diet": "Detailed diet description...",
    "behavior": "Comprehensive 100-200 word behavior description...",
    "depthRange": {{"min": 0, "max": 600}}
  }},
  "conservationStatus": "IUCN status or 'Data Deficient'",
  "economicImportance": "Fisheries, aquaculture, tourism value...",
  "imageUrl": "{state['input'] if state['input_type'] == 'image' else 'null'}",
  "thumbnailUrl": "{state['input'] if state['input_type'] == 'image' else 'null'}",
  "externalLinks": {{
    "wikipedia": "https://...",
    "fishbase": "https://...",
    "gbif": "https://...",
    "itis": "https://..."
  }}
}}

**QUALITY CHECKS:**
- Description must be ≥200 words
- Habitat must include depth and temperature
- Behavior must include feeding and social structure
- Use "null" for truly unknown fields (not empty strings)
- Cite search results implicitly (don't add footnotes)
"""
    
    try:
        msg = HumanMessage(content=prompt)
        
        # Initial LLM call (may include tool calls)
        resp = await llm_with_tools.ainvoke([msg], timeout=90)
        
        # Check for tool calls
        if resp.tool_calls:
            print(f"[Synthesis] LLM requested {len(resp.tool_calls)} tool calls")
            
            # Execute tools
            tool_results = []
            for tool_call in resp.tool_calls:
                if tool_call['name'] == 'search_marine_species':
                    result = search_marine_species.invoke(tool_call['args'])
                    tool_results.append(result)
                    print(f"[Synthesis] Tool result: {result[:100]}...")
            
            # Re-invoke LLM with tool results
            tool_msg = HumanMessage(content=f"Additional search results:\n\n{chr(10).join(tool_results)}")
            resp = await llm_with_tools.ainvoke([msg, tool_msg], timeout=90)
        
        # Extract JSON
        content = resp.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        data = json.loads(content)
        
        # Auto-select best image if LLM missed it
        img_val = data.get('imageUrl')
        if 'IMAGE CANDIDATES' in state.get('search_results', '') and (not img_val or img_val == 'null'):
            print("[Synthesis] Auto-selecting image from search candidates")
            # Extract first image from search results if available
            image_candidates = state.get('image_candidates', [])
            if image_candidates:
                best_image = image_candidates[0]['url']
                data['imageUrl'] = best_image
                data['thumbnailUrl'] = best_image
                print(f"[Synthesis] Auto-selected: {best_image[:60]}...")
                data['thumbnailUrl'] = best_image
                print(f"[Synthesis] Auto-selected: {best_image[:60]}...")
        
        # Add image URLs if input was image
        if state['input_type'] == 'image':
            data['imageUrl'] = state['input']
            data['thumbnailUrl'] = state['input']
        
        state['taxonomy_data'] = data
        
        print(f"[Synthesis] Generated: {data.get('scientificName', 'Unknown')}")
        
    except Exception as e:
        print(f"[Synthesis] Error: {str(e)}")
        raise ValueError(f"Synthesis failed: {str(e)}")
    
    return state


# Node 5: Validation Node
async def validation_node(state: TaxonomyState) -> TaxonomyState:
    """Validate schema and fill missing fields"""
    print(f"\n[Validation] Checking schema...")
    
    required = [
        "scientificName", "commonNames", "taxonomicHierarchy", "description",
        "habitat", "distribution", "morphology", "ecology", "conservationStatus",
        "economicImportance", "imageUrl", "thumbnailUrl", "externalLinks"
    ]
    
    data = state['taxonomy_data']
    
    for field in required:
        if field not in data:
            if field == "commonNames":
                data[field] = []
            elif field == "taxonomicHierarchy":
                data[field] = {}
            elif field == "morphology":
                data[field] = {"maxLength": None, "maxWeight": None, "distinctiveFeatures": []}
            elif field == "ecology":
                data[field] = {"diet": None, "behavior": None, "depthRange": {"min": None, "max": None}}
            elif field == "externalLinks":
                data[field] = {"wikipedia": None, "fishbase": None, "gbif": None, "itis": None}
            else:
                data[field] = None
    
    # Type checks
    if not isinstance(data.get('commonNames'), list):
        data['commonNames'] = []
    if not isinstance(data.get('taxonomicHierarchy'), dict):
        data['taxonomicHierarchy'] = {}
    
    # Content quality validation
    desc_words = len(data.get('description', '').split())
    if desc_words < 50:
        print(f"[Validation] ⚠️ WARNING: Description too short ({desc_words} words, minimum 50)")
    elif desc_words < 150:
        print(f"[Validation] ℹ️ Note: Description could be more detailed ({desc_words} words, recommended 200+)")
    else:
        print(f"[Validation] ✓ Description length: {desc_words} words")

    habitat = data.get('habitat', '') or ''
    habitat_keywords = ['depth', 'temperature', 'meter', 'substrate', 'zone']
    if not any(kw in habitat.lower() for kw in habitat_keywords):
        print(f"[Validation] ⚠️ WARNING: Habitat lacks depth/temperature/substrate details")
    else:
        print(f"[Validation] ✓ Habitat includes environmental parameters")

    behavior = data.get('ecology', {}).get('behavior', '') or ''
    behavior_keywords = ['feed', 'social', 'migrat', 'spawn', 'predat', 'school']
    if not any(kw in behavior.lower() for kw in behavior_keywords):
        print(f"[Validation] ⚠️ WARNING: Behavior lacks key ecological details")
    else:
        print(f"[Validation] ✓ Behavior includes ecological patterns")

    # Convert empty strings to null
    for key in ['description', 'habitat', 'distribution', 'conservationStatus', 'economicImportance']:
        if data.get(key) == '':
            data[key] = None
            print(f"[Validation] Converted empty {key} to null")

    # Validate numeric ranges
    depth_range = data.get('ecology', {}).get('depthRange', {})
    if depth_range.get('min') is not None and depth_range.get('max') is not None:
        if depth_range['min'] > depth_range['max']:
            print(f"[Validation] ⚠️ WARNING: Invalid depth range (min > max)")
            depth_range['min'], depth_range['max'] = depth_range['max'], depth_range['min']
    
    # Image validation - normalize 'null' string to None
    image_url = data.get('imageUrl')
    if image_url == 'null':
        data['imageUrl'] = None
        image_url = None
    
    thumbnail_url = data.get('thumbnailUrl')
    if thumbnail_url == 'null' or not thumbnail_url:
        data['thumbnailUrl'] = None
    
    # Now validate normalized values
    if image_url and image_url != 'null':
        if not image_url.startswith(('http://', 'https://')):
            print("[Validation] ⚠️ Invalid image URL format")
            data['imageUrl'] = None
            data['thumbnailUrl'] = None
        else:
            print(f"[Validation] ✓ Image: {image_url[:60]}...")
    else:
        print("[Validation] ℹ️ No image selected (using placeholder in UI)")
    
    state['taxonomy_data'] = data
    
    print(f"[Validation] ✓ Schema valid: {data.get('scientificName', 'N/A')}")
    
    return state


# Build LangGraph workflow
workflow = StateGraph(TaxonomyState)
workflow.add_node("input_router", input_router_node)
workflow.add_node("vision", vision_node)
workflow.add_node("search", search_node)
workflow.add_node("synthesis", synthesis_node)
workflow.add_node("validation", validation_node)

workflow.set_entry_point("input_router")

# Conditional routing
def route_after_input(state: TaxonomyState):
    return "vision" if state['input_type'] == 'image' else "search"

workflow.add_conditional_edges("input_router", route_after_input, {"vision": "vision", "search": "search"})
workflow.add_edge("vision", "search")
workflow.add_edge("search", "synthesis")
workflow.add_edge("synthesis", "validation")
workflow.add_edge("validation", END)

app = workflow.compile()


# Main entry point
async def run_taxonomy_identification(input_data: str, input_type: str) -> dict:
    """
    Identify species and extract taxonomy data.
    
    Args:
        input_data: Species name or image URL
        input_type: "name" or "image"
        
    Returns:
        dict: Complete taxonomy data
    """
    print(f"\n{'='*70}")
    print(f"[TaxonomyAgent] Starting identification")
    print(f"[TaxonomyAgent] Type: {input_type}, Input: {input_data[:80]}...")
    print(f"{'='*70}\n")
    
    if input_type not in ['name', 'image']:
        raise ValueError(f"Invalid input_type: {input_type}")
    
    if not input_data or not input_data.strip():
        raise ValueError("Input data cannot be empty")
    
    inputs = {
        "input": input_data.strip(),
        "input_type": input_type,
        "vision_result": {},
        "species_hypothesis": "",
        "search_results": "",
        "references": [],
        "image_candidates": [],
        "taxonomy_data": {}
    }
    
    try:
        result = await app.ainvoke(inputs)
        
        print(f"\n{'='*70}")
        print(f"[TaxonomyAgent] Complete: {result['taxonomy_data'].get('scientificName', 'Unknown')}")
        print(f"{'='*70}\n")
        
        return result['taxonomy_data']
        
    except Exception as e:
        print(f"\n[TaxonomyAgent] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise ValueError(f"Taxonomy identification failed: {str(e)}")




