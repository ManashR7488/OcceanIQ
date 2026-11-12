import os
from typing import TypedDict, Annotated, List, Dict
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from tavily import TavilyClient
import json
import hashlib
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Define the state
class ResearchState(TypedDict):
    topic: str
    search_results: str
    references: List[Dict[str, str]]  # List of {title, url, content}
    draft: str
    critique: str
    final_output: dict
    messages: List[BaseMessage]

# Initialize LLM with API key from environment
google_api_key = os.environ.get("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY environment variable is required")

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=google_api_key)

# Initialize Tavily with validation
tavily_api_key = os.environ.get("TAVILY_API_KEY")
if not tavily_api_key:
    raise RuntimeError("TAVILY_API_KEY environment variable is not configured. Please set it before running the research agent.")
tavily = TavilyClient(api_key=tavily_api_key)

# In-memory cache for search results (TTL: 1 hour)
search_cache = {}
CACHE_TTL = 3600  # 1 hour in seconds

def search_node(state: ResearchState):
    """Enhanced search node with caching and comprehensive results"""
    topic = state['topic']
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Searching for: {topic}")
    
    # Input validation
    if not topic or len(topic.strip()) < 3:
        raise ValueError("Topic must be at least 3 characters long")
    if len(topic) > 500:
        raise ValueError("Topic must be less than 500 characters")
    
    # Create cache key
    cache_key = hashlib.md5(topic.lower().strip().encode()).hexdigest()
    
    # Check cache
    if cache_key in search_cache:
        cached_data, timestamp = search_cache[cache_key]
        if time.time() - timestamp < CACHE_TTL:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Using cached results")
            return cached_data
    
    # Perform search with retry logic
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = tavily.search(
                query=topic, 
                max_results=10, 
                search_depth="advanced",
                include_raw_content=False
            )
            break
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Search attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff
    
    # Process search results
    references = []
    search_context = []
    
    for idx, result in enumerate(response['results'], 1):
        references.append({
            "id": idx,
            "title": result.get('title', 'Untitled'),
            "url": result.get('url', ''),
            "content": result.get('content', '')
        })
        search_context.append(
            f"[{idx}] {result.get('title', 'Untitled')}\n{result.get('content', '')}\nSource: {result.get('url', '')}"
        )
    
    context = "\n\n".join(search_context)
    result_data = {"search_results": context, "references": references}
    
    # Cache the results
    search_cache[cache_key] = (result_data, time.time())
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Found {len(references)} sources")
    return result_data

def draft_node(state: ResearchState):
    """Generate initial structured academic document"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Drafting document...")
    topic = state['topic']
    context = state['search_results']
    references = state.get('references', [])
    
    # Build references list for prompt
    refs_text = "\n".join([f"[{ref['id']}] {ref['title']} - {ref['url']}" for ref in references])
    
    prompt = f"""You are an expert marine researcher writing a comprehensive academic research report.

Topic: {topic}

Research Sources:
{context}

Available References (use these for citations):
{refs_text}

Write a detailed, professional research report with the following structure:

1. **Abstract**: A concise summary (150-200 words) of the research topic, key findings, and implications.

2. **Introduction**: Context and background of the topic, why it's important for marine science and conservation.

3. **Key Findings**: 3-5 major discoveries or insights from the research, each as a subsection with citations.

4. **Detailed Analysis**: In-depth examination of the findings, including mechanisms, patterns, relationships, and evidence. Include multiple subsections as needed.

5. **Implications**: Discuss the significance for marine conservation, policy, ecosystem management, and future research.

6. **Conclusion**: Summarize the main points and provide forward-looking statements.

**CRITICAL FORMATTING REQUIREMENTS:**

1. Use inline citations in this EXACT format: <sup><a href="#ref1">[1]</a></sup> 
   - Place citations immediately after statements that reference a source
   - Use the reference numbers [1], [2], [3], etc. matching the sources provided above
   - Example: "Recent studies show ocean temperatures rising<sup><a href="#ref2">[2]</a></sup>."

2. Return ONLY a valid JSON object with these exact keys:
   {{
     "title": "Professional academic title for the report",
     "body": "Complete HTML body (see structure below)",
     "css": "Professional CSS styling (see requirements below)"
   }}

3. HTML Body Structure (NO <html>, <head>, or <body> tags, just the content):
   ```html
   <header>
     <h1>Report Title</h1>
     <div class="metadata">
       <p><strong>Generated:</strong> {datetime.now().strftime('%B %d, %Y')}</p>
       <p><strong>Platform:</strong> OceanIQ Research Assistant</p>
     </div>
   </header>

   <section class="abstract">
     <h2>Abstract</h2>
     <p>Abstract content with citations<sup><a href="#ref1">[1]</a></sup>...</p>
   </section>

   <main>
     <section class="introduction">
       <h2>Introduction</h2>
       <p>Introduction paragraphs with citations...</p>
     </section>

     <section class="findings">
       <h2>Key Findings</h2>
       <div class="finding-item">
         <h3>Finding 1 Title</h3>
         <p>Content with citations<sup><a href="#ref1">[1]</a></sup>...</p>
       </div>
       <!-- More findings -->
     </section>

     <section class="analysis">
       <h2>Detailed Analysis</h2>
       <h3>Subsection Title</h3>
       <p>Analysis content with citations...</p>
       <!-- More subsections -->
     </section>

     <section class="implications">
       <h2>Implications</h2>
       <p>Implications content...</p>
     </section>

     <section class="conclusion">
       <h2>Conclusion</h2>
       <p>Conclusion content...</p>
     </section>
   </main>

   <section class="references">
     <h2>References</h2>
     <ol>
       <li id="ref1"><a href="URL" target="_blank">Title</a></li>
       <li id="ref2"><a href="URL" target="_blank">Title</a></li>
       <!-- All cited references -->
     </ol>
   </section>

   <footer>
     <p>&copy; {datetime.now().year} OceanIQ Marine Research Platform</p>
     <p>Generated by AI Research Assistant | For educational and research purposes</p>
   </footer>
   ```

4. CSS Requirements (professional academic styling):
   - Use Google Fonts: 'Roboto' for headings, 'Lora' for body text
   - Marine color palette: primary #005f73, accent #0077b6, dark #003440
   - Typography: body 16px, line-height 1.6, headings bold
   - Layout: max-width 900px, centered, padding, justified text
   - Print-ready: proper page breaks, margins
   - Sections: clear spacing, borders, background colors for emphasis
   - References: numbered list, proper linking styles
   - Responsive design for various screen sizes

Return ONLY the JSON object, no markdown code blocks or extra text."""

    msg = HumanMessage(content=prompt)
    
    try:
        response = llm.invoke([msg], timeout=120)
        content = response.content.strip()
        
        # Clean up markdown code blocks if present
        if content.startswith("```json"):
            content = content.replace("```json", "", 1).rstrip("```").strip()
        elif content.startswith("```"):
            content = content.replace("```", "", 1).rstrip("```").strip()
        
        data = json.loads(content)
        
        # Validate required fields
        if not all(key in data for key in ["title", "body", "css"]):
            raise ValueError("Missing required fields in LLM response")
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Draft completed successfully")
        return {"draft": json.dumps(data)}
        
    except json.JSONDecodeError as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] JSON parsing error: {str(e)}")
        # Fallback to basic format
        fallback = {
            "title": f"Research Report: {topic}",
            "body": f"<h2>Error</h2><p>Failed to parse research report. Raw content:</p><pre>{content[:500]}</pre>",
            "css": "body {{ font-family: sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }}"
        }
        return {"draft": json.dumps(fallback)}
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Draft error: {str(e)}")
        raise

def critique_node(state: ResearchState):
    """Analyze draft quality and provide improvement feedback"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Critiquing draft...")
    draft = state['draft']
    topic = state['topic']
    references = state.get('references', [])
    
    try:
        draft_data = json.loads(draft)
    except:
        return {"critique": "Draft is not valid JSON, needs complete rewrite"}
    
    prompt = f"""You are a senior academic reviewer evaluating a marine research report.

Topic: {topic}

Draft Report:
Title: {draft_data.get('title', '')}
Body: {draft_data.get('body', '')[:2000]}... (truncated)

Available References: {len(references)} sources

Evaluate the draft on these criteria:

1. **Completeness**: Are all required sections present (Abstract, Introduction, Key Findings, Analysis, Implications, Conclusion, References)?

2. **Citation Quality**: 
   - Are there inline citations using <sup><a href="#refN">[N]</a></sup> format?
   - Are all citations properly linked to the references section?
   - Are sources cited appropriately throughout the document?

3. **Accuracy & Depth**: 
   - Does the content accurately reflect the source material?
   - Is the analysis sufficiently detailed and insightful?
   - Are claims properly supported?

4. **Structure & Flow**:
   - Is the logical flow clear and coherent?
   - Are transitions between sections smooth?
   - Is the document well-organized?

5. **Academic Quality**:
   - Is the language professional and precise?
   - Are technical terms used correctly?
   - Is the tone appropriate for academic research?

6. **Formatting**:
   - Is the HTML structure valid and semantic?
   - Are CSS styles professional and print-ready?
   - Is the references section properly formatted?

Provide a structured critique in JSON format:
{{
  "overall_score": "score from 1-10",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "specific_improvements": {{
    "citations": "what needs improvement with citations",
    "content": "what needs improvement with content",
    "structure": "what needs improvement with structure",
    "formatting": "what needs improvement with formatting"
  }},
  "priority_actions": ["action 1", "action 2", ...]
}}

Return ONLY the JSON object."""

    msg = HumanMessage(content=prompt)
    
    try:
        response = llm.invoke([msg], timeout=60)
        content = response.content.strip()
        
        # Clean up markdown code blocks
        if content.startswith("```json"):
            content = content.replace("```json", "", 1).rstrip("```").strip()
        elif content.startswith("```"):
            content = content.replace("```", "", 1).rstrip("```").strip()
        
        critique_data = json.loads(content)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Critique score: {critique_data.get('overall_score', 'N/A')}/10")
        
        return {"critique": json.dumps(critique_data)}
        
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Critique error: {str(e)}")
        # Return basic critique to allow workflow to continue
        basic_critique = {
            "overall_score": "7",
            "strengths": ["Draft completed"],
            "weaknesses": ["Needs review"],
            "specific_improvements": {
                "citations": "Verify all citations are present",
                "content": "Expand analysis sections",
                "structure": "Check section flow",
                "formatting": "Validate HTML/CSS"
            },
            "priority_actions": ["Add more citations", "Expand content"]
        }
        return {"critique": json.dumps(basic_critique)}


def revise_node(state: ResearchState):
    """Improve draft based on critique feedback"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Revising document...")
    draft = state['draft']
    critique = state['critique']
    topic = state['topic']
    references = state.get('references', [])
    
    try:
        draft_data = json.loads(draft)
        critique_data = json.loads(critique)
    except:
        # If parsing fails, use draft as final
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Using draft as final output")
        return {"final_output": json.loads(draft) if isinstance(draft, str) else draft}
    
    # Build references list
    refs_text = "\n".join([f"[{ref['id']}] {ref['title']} - {ref['url']}" for ref in references])
    
    prompt = f"""You are revising a marine research report based on reviewer feedback.

Topic: {topic}

Current Draft:
{json.dumps(draft_data, indent=2)}

Reviewer Critique:
{json.dumps(critique_data, indent=2)}

Available References:
{refs_text}

Revise the draft to address ALL the reviewer's feedback. Focus on:

1. **Priority Actions**: Implement each action from the critique
2. **Citations**: Ensure proper inline citations <sup><a href="#refN">[N]</a></sup> throughout
3. **Content Quality**: Expand shallow sections, add more detail and analysis
4. **Structure**: Improve flow and transitions
5. **References Section**: Include ALL cited sources in proper format

CRITICAL REQUIREMENTS:

1. Maintain the exact JSON structure:
   {{
     "title": "...",
     "body": "...",
     "css": "..."
   }}

2. HTML Body MUST include (in order):
   - <header> with title and metadata
   - <section class="abstract"> with summary
   - <main> with all content sections (introduction, findings, analysis, implications, conclusion)
   - <section class="references"> with numbered <ol> list
   - <footer> with copyright

3. Use professional academic CSS:
   - Import Google Fonts (Roboto, Lora)
   - Marine color scheme (#005f73, #0077b6, #003440)
   - Print-ready styling with page breaks
   - Proper typography (16px body, 1.6 line-height)
   - Responsive layout (max-width 900px, centered)

4. Inline citations MUST use: <sup><a href="#refN">[N]</a></sup>

5. References section MUST use:
   <ol>
     <li id="ref1"><a href="URL" target="_blank">Title</a></li>
   </ol>

Return ONLY the revised JSON object, no markdown blocks or extra text."""

    msg = HumanMessage(content=prompt)
    
    try:
        response = llm.invoke([msg], timeout=120)
        content = response.content.strip()
        
        # Clean up markdown code blocks
        if content.startswith("```json"):
            content = content.replace("```json", "", 1).rstrip("```").strip()
        elif content.startswith("```"):
            content = content.replace("```", "", 1).rstrip("```").strip()
        
        revised_data = json.loads(content)
        
        # Validate required fields
        if not all(key in revised_data for key in ["title", "body", "css"]):
            raise ValueError("Missing required fields in revised document")
        
        # Validate HTML structure
        body = revised_data['body']
        required_sections = ['<header>', '<section class="abstract">', '<main>', '<section class="references">', '<footer>']
        missing_sections = [sec for sec in required_sections if sec not in body]
        
        if missing_sections:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Warning: Missing sections: {missing_sections}")
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Revision completed successfully")
        return {"final_output": revised_data}
        
    except json.JSONDecodeError as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Revision JSON error: {str(e)}, using draft")
        return {"final_output": draft_data}
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Revision error: {str(e)}, using draft")
        return {"final_output": draft_data}


# Define the graph with 4-node workflow
workflow = StateGraph(ResearchState)

# Add all nodes
workflow.add_node("search", search_node)
workflow.add_node("draft", draft_node)
workflow.add_node("critique", critique_node)
workflow.add_node("revise", revise_node)

# Define workflow: search → draft → critique → revise → END
workflow.set_entry_point("search")
workflow.add_edge("search", "draft")
workflow.add_edge("draft", "critique")
workflow.add_edge("critique", "revise")
workflow.add_edge("revise", END)

app = workflow.compile()

async def run_research(topic: str):
    """
    Run the complete research workflow with enhanced academic output.
    
    Args:
        topic: Research topic/query
        
    Returns:
        dict: Final document with title, body (HTML), and css
        
    Raises:
        ValueError: If topic is invalid
        Exception: If workflow fails
    """
    print(f"\n{'='*60}")
    print(f"Starting research workflow for: {topic}")
    print(f"{'='*60}\n")
    
    start_time = time.time()
    
    try:
        inputs = {
            "topic": topic, 
            "messages": [],
            "search_results": "",
            "references": [],
            "draft": "",
            "critique": "",
            "final_output": {}
        }
        
        result = await app.ainvoke(inputs)
        
        elapsed_time = time.time() - start_time
        print(f"\n{'='*60}")
        print(f"Research workflow completed in {elapsed_time:.2f} seconds")
        print(f"{'='*60}\n")
        
        return result["final_output"]
        
    except ValueError as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Validation error: {str(e)}")
        raise
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Workflow error: {str(e)}")
        raise

