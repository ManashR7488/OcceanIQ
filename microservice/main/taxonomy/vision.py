"""
OpenAI Vision API Wrapper for Species Image Analysis
Uses gpt-4o-mini for cost-effective marine species identification
"""

import os
import json
from openai import AsyncOpenAI

# Initialize OpenAI async client
client = None
if os.environ.get("OPENAI_API_KEY"):
    client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    print("[TaxonomyVision] OpenAI async client initialized")
else:
    print("[TaxonomyVision] WARNING: OPENAI_API_KEY not found - vision analysis will fail")


async def analyze_species_image(image_url: str) -> dict:
    """
    Analyze marine species image using OpenAI's vision capabilities.
    
    Args:
        image_url: URL of the image (e.g., Cloudinary URL)
        
    Returns:
        dict with:
            - hypothesis: str (scientific name)
            - confidence: float (0-1)
            - features: list (morphological characteristics)
            - habitat: str (environmental context)
    """
    if not client:
        raise ValueError("OpenAI client not initialized. Set OPENAI_API_KEY in environment.")
    
    try:
        print(f"[TaxonomyVision] Analyzing image: {image_url[:80]}...")
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Analyze this marine species image. Identify scientific/common name, describe morphology (fins, coloration, size estimate), habitat clues, distinctive features. Return JSON: {"hypothesis": "scientific name", "confidence": 0-1, "features": ["list"], "habitat": "str"}."""
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url}
                    }
                ]
            }],
            response_format={"type": "json_object"},
            max_tokens=500,
            temperature=0.3
        )
        
        result = json.loads(response.choices[0].message.content)
        
        print(f"[TaxonomyVision] Hypothesis: {result.get('hypothesis', 'Unknown')}")
        print(f"[TaxonomyVision] Confidence: {result.get('confidence', 0):.2f}")
        
        return result
        
    except Exception as e:
        print(f"[TaxonomyVision] Error: {str(e)}")
        raise ValueError(f"Vision analysis failed: {str(e)}")

