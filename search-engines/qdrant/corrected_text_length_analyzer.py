#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Textlängen-Analyzer für ASRA - KORRIGIERTE VERSION
Analysiert die tatsächlichen Textlängen mit text_content (sauber) vs text_content_html
Fokussiert auf Einzelnormen (BJNE-Dokumente) mit echtem Textinhalt
"""

import requests
import json
import sys
from typing import Dict, List
import statistics

# Solr endpoint
SOLR_ENDPOINT = "http://localhost:8983/solr/documents"

def fetch_sample_documents(sample_size: int = 500) -> List[Dict]:
    """Fetch only Einzelnorm documents (BJNE) with actual text content."""
    try:
        response = requests.get(
            f"{SOLR_ENDPOINT}/select",
            params={
                "q": "id:*BJNE*",  # NUR Einzelnormen (echte Textdokumente)
                "rows": sample_size,
                "fl": "id,text_content,text_content_html,jurabk,enbez,norm_type"
            },
            timeout=30
        )
        response.raise_for_status()
        
        docs = response.json().get("response", {}).get("docs", [])
        print(f"✅ Fetched {len(docs)} Einzelnorm documents (BJNE) from Solr")
        return docs
        
    except Exception as e:
        print(f"❌ Error fetching documents: {e}")
        return []

def calculate_statistics(lengths: List[int]) -> Dict:
    """Calculate comprehensive statistics for a list of lengths."""
    if not lengths:
        return {}
    
    return {
        "count": len(lengths),
        "min": min(lengths),
        "max": max(lengths),
        "mean": round(statistics.mean(lengths), 1),
        "median": round(statistics.median(lengths), 1),
        "std_dev": round(statistics.stdev(lengths) if len(lengths) > 1 else 0, 1),
        "percentile_75": round(statistics.quantiles(lengths, n=4)[2], 1),
        "percentile_90": round(statistics.quantiles(lengths, n=10)[8], 1),
        "percentile_95": round(statistics.quantiles(lengths, n=20)[18], 1),
        "percentile_99": round(statistics.quantiles(lengths, n=100)[98], 1) if len(lengths) >= 100 else max(lengths)
    }

def analyze_text_fields(docs: List[Dict]) -> Dict:
    """Analyze text_content vs text_content_html lengths."""
    analysis = {
        "total_docs": len(docs),
        "docs_with_text_content": 0,
        "docs_with_text_content_html": 0,
        "docs_with_both": 0,
        "text_content_stats": {},
        "text_content_html_stats": {},
        "html_overhead_stats": {},
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
            analysis["docs_with_text_content"] += 1
            text_content_lengths.append(tc_len)
        if tch_len > 0:
            analysis["docs_with_text_content_html"] += 1
            text_content_html_lengths.append(tch_len)
        if tc_len > 0 and tch_len > 0:
            analysis["docs_with_both"] += 1
        
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
    
    # Calculate statistics
    if text_content_lengths:
        analysis["text_content_stats"] = calculate_statistics(text_content_lengths)
    if text_content_html_lengths:
        analysis["text_content_html_stats"] = calculate_statistics(text_content_html_lengths)
    if overhead_percentages:
        analysis["html_overhead_stats"] = calculate_statistics(overhead_percentages)
    
    return analysis

def print_analysis_results(analysis: Dict):
    """Print comprehensive analysis results."""
    print(f"\n📊 ANALYSEERGEBNISSE")
    print("=" * 60)
    
    print(f"📋 Dokumentübersicht:")
    print(f"   • Gesamte Dokumente: {analysis['total_docs']}")
    print(f"   • Mit text_content: {analysis['docs_with_text_content']}")
    print(f"   • Mit text_content_html: {analysis['docs_with_text_content_html']}")
    print(f"   • Mit beiden Feldern: {analysis['docs_with_both']}")
    
    if analysis.get("text_content_stats"):
        stats = analysis["text_content_stats"]
        print(f"\n📝 TEXT_CONTENT Statistiken (sauberer Text):")
        print(f"   • Anzahl: {stats['count']} Dokumente")
        print(f"   • Min/Max: {stats['min']} - {stats['max']} Zeichen")
        print(f"   • Durchschnitt: {stats['mean']} Zeichen")
        print(f"   • Median: {stats['median']} Zeichen")
        print(f"   • 75. Perzentil: {stats['percentile_75']} Zeichen")
        print(f"   • 90. Perzentil: {stats['percentile_90']} Zeichen")
        print(f"   • 95. Perzentil: {stats['percentile_95']} Zeichen")
        print(f"   • 99. Perzentil: {stats['percentile_99']} Zeichen")
    
    if analysis.get("text_content_html_stats"):
        stats = analysis["text_content_html_stats"]
        print(f"\n🏷️  TEXT_CONTENT_HTML Statistiken (mit HTML-Tags):")
        print(f"   • Anzahl: {stats['count']} Dokumente")
        print(f"   • Min/Max: {stats['min']} - {stats['max']} Zeichen")
        print(f"   • Durchschnitt: {stats['mean']} Zeichen")
        print(f"   • Median: {stats['median']} Zeichen")
        print(f"   • 95. Perzentil: {stats['percentile_95']} Zeichen")
        print(f"   • 99. Perzentil: {stats['percentile_99']} Zeichen")
    
    if analysis.get("html_overhead_stats"):
        stats = analysis["html_overhead_stats"]
        print(f"\n⚡ HTML-OVERHEAD Analyse:")
        print(f"   • Durchschnittlicher Overhead: {stats['mean']}%")
        print(f"   • Median Overhead: {stats['median']}%")
        print(f"   • Max Overhead: {stats['max']}%")
    
    # Print examples
    if analysis.get("examples"):
        print(f"\n📋 BEISPIELE (erste 5):")
        print("-" * 60)
        for i, example in enumerate(analysis["examples"][:5]):
            print(f"{i+1}. {example['id']} ({example['jurabk']})")
            print(f"   text_content: {example['text_content_length']} Zeichen")
            print(f"   text_content_html: {example['text_content_html_length']} Zeichen")
            print(f"   HTML-Overhead: +{example['html_overhead_pct']}%")
            print(f"   Preview: {example['text_content_preview'][:80]}...")
            print()

def print_recommendations(analysis: Dict):
    """Print recommendations based on analysis."""
    print(f"\n🎯 EMPFEHLUNGEN FÜR MAX_TEXT_LENGTH")
    print("=" * 60)
    
    if analysis.get("text_content_stats"):
        stats = analysis["text_content_stats"]
        current_limit = 1800
        
        print(f"📊 Basierend auf text_content (sauberer Text):")
        print(f"   • Aktuelle Einstellung: {current_limit} Zeichen")
        print(f"   • 95% der Dokumente: ≤ {stats['percentile_95']} Zeichen")
        print(f"   • 99% der Dokumente: ≤ {stats['percentile_99']} Zeichen")
        
        if stats['percentile_95'] <= current_limit:
            print(f"   ✅ Aktuelle Einstellung erfasst 95% vollständig")
        else:
            print(f"   ⚠️  {stats['percentile_95'] - current_limit} Zeichen zu niedrig für 95% Abdeckung")
        
        if stats['percentile_99'] <= 2000:  # Ollama API Limit
            recommended = min(1950, int(stats['percentile_99'] + 50))
            print(f"\n🚀 SOFORTIGE EMPFEHLUNG:")
            print(f"   MAX_TEXT_LENGTH = {recommended}")
            print(f"   → Erfasst 99% der Dokumente vollständig")
            print(f"   → Bleibt unter Ollama API Limit (2000)")
            print(f"   → {recommended - current_limit} Zeichen mehr Content")
        else:
            print(f"\n⚠️  99. Perzentil ({stats['percentile_99']}) überschreitet Ollama Limit")
            print(f"   Empfehlung: MAX_TEXT_LENGTH = 1950 (95% Abdeckung)")

def main():
    print("🔍 ASRA Textlängen-Analyse (KORRIGIERTE VERSION)")
    print("Analysiert nur Einzelnormen (BJNE) mit echtem Textinhalt")
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
    if field_analysis["docs_with_text_content"] == 0 and field_analysis["docs_with_text_content_html"] == 0:
        print("❌ PROBLEM: Auch Einzelnormen haben keine Textfelder!")
        print("   Mögliche Ursachen:")
        print("   1. Andere Feldnamen für Textinhalt")
        print("   2. Text in content_paragraphs Array")
        print("   3. Indexierung unvollständig")
        sys.exit(1)
    else:
        print("✅ Textfelder in Einzelnormen gefunden!")
        print_analysis_results(field_analysis)
        print_recommendations(field_analysis)

if __name__ == "__main__":
    main()