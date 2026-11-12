"""
Taxonomy Identification Module

Provides species identification and taxonomy data extraction using:
- OpenAI Vision API (gpt-4o-mini) for image analysis
- Tavily Search for comprehensive research
- OpenAI ChatGPT (gpt-4o-mini) for structured data synthesis
"""

from .agent import run_taxonomy_identification

__all__ = ['run_taxonomy_identification']
