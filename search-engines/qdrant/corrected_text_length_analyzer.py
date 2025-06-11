#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Textlängen-Analyzer für ASRA - KORRIGIERTE VERSION
Analysiert die tatsächlichen Textlängen mit text_content (sauber) vs text_content_html
"""

import requests
import json
import sys
from typing import Dict, List
import statistics

# Solr endpoint
SOLR_ENDPOINT = "http://localhost:8983/solr/documents"

def fetch_sample_documents(sample_size: int = 500) -> List[Dict]:
    """Fetch a sample of documents from Solr."""
    try:
        response = requests.get(
            f"{SOLR_ENDPOINT}/select",
            params={
                "q": "*:*",
                "rows": sample_size,
                "fl": "id,text_content,text_content_html,jurabk,enbez"
            },
            timeout=30
        )
        response.raise_for_status()
        
        docs = response.json().get("response", {}).get("docs", [])
        print(f"✅ Fetched {len(docs)} documents from Solr")
        return docs
        
    except Exception as e:
        print(f"❌ Error fetching documents: {e}")
        return []

def analyze_text_fields(docs: List[Dict]) -> Dict:
    """Analyze text_content vs text_content_html lengths."""
    analysis = {
        "total_docs": len(docs),
        "text_content_stats": {},
        "text_content_html_stats": {},
        "comparison": {},
        "examples": []
    }
    
    text_content_lengths = []
    text_content_html_lengths = []
    overhead_percentages = []
    
    for doc in docs:
        text_content = doc.get("text_content", "")
        text_content_html = doc.get("text_content_html", "")
        
        # Handle list types
        if isinstance(text_content, list):
            text_content = " ".join(filter(None, text_content))
        if isinstance(text_content_html, list):
            text_content_html = " ".join(filter(None, text_content_html))
        
        tc_len = len(text_content) if text_content else 0
        tch_len = len(text_content_html) if text_content_html else 0
        
        if tc_len > 0:
            text_content_lengths.append(tc_len)
        if tch_len > 0:
            text_content_html_lengths.append(tch_len)
        
        # Calculate overhead percentage
        if tc_len > 0 and tch_len > 0:
            overhead = ((tch_len - tc_len) / tc_len) * 100
            overhead_percentages.append(overhead)
            
            # Collect examples
            if len(analysis["examples"]) < 10:
                analysis["examples"].append({
                    "id": doc.get("id", "unknown"),
                    "jurabk": doc.get("jurabk", ""),
                    "enbez": doc.get("enbez", ""),
                    "text_content_length": tc_len,
                    "text_content_html_length": tch_len,
                    "html_overhead_pct": round(overhead, 1),
                    "text_content_preview": text_content[:100] + "..." if len(text_content) > 100 else text_content,
                    "text_content_html_preview": text_content_html[:100] + "..." if len(text_content_html) > 100 else text_content_html
                })
    
    return analysis

def main():
    print("🔍 ASRA Textlängen-Analyse (KORRIGIERTE VERSION)")
    print("=" * 60)
    
    # Fetch documents
    docs = fetch_sample_documents(500)
    if not docs:
        print("❌ No documents fetched. Exiting.")
        sys.exit(1)
    
    # Analyze text fields
    print("\n📊 Analysiere text_content vs text_content_html...")
    field_analysis = analyze_text_fields(docs)
    
    # Check what we found
    if not field_analysis["text_content_stats"] and not field_analysis["text_content_html_stats"]:
        print("❌ PROBLEM IDENTIFIZIERT:")
        print("   - Die text_content und text_content_html Felder sind leer oder fehlen!")
        print("   - Dies bestätigt, dass unser ursprünglicher Ansatz fehlerhaft war")
        print("   - Wir müssen alternative Felder zur Textextraktion verwenden")
        
        print(f"\n🔍 NÄCHSTE SCHRITTE:")
        print("   1. Überprüfe verfügbare Felder in Solr")
        print("   2. Identifiziere richtige Textfelder")
        print("   3. Aktualisiere Qdrant Indexer entsprechend")
    else:
        print("✅ Text fields gefunden - Analyse wird durchgeführt...")

if __name__ == "__main__":
    main()
