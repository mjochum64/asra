#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Textlängen-Analyzer für ASRA - KORRIGIERTE VERSION
Analysiert nur EINZELNORMEN (BJNE-Dokumente) mit text_content vs text_content_html
"""

import requests
import json
import sys
from typing import Dict, List
import statistics

# Solr endpoint
SOLR_ENDPOINT = "http://localhost:8983/solr/documents"

def fetch_sample_documents(sample_size: int = 500) -> List[Dict]:
    """Fetch ONLY Einzelnormen (BJNE documents) from Solr that contain actual text content."""
    try:
        # Query specifically for Einzelnormen (documents with BJNE in ID)
        response = requests.get(
            f"{SOLR_ENDPOINT}/select",
            params={
                "q": "id:*BJNE*",  # Only Einzelnormen (real content documents)
                "rows": sample_size,
                "fl": "id,text_content,text_content_html,jurabk,enbez,norm_type"
            },
            timeout=30
        )
        response.raise_for_status()
        
        docs = response.json().get("response", {}).get("docs", [])
        print(f"✅ Fetched {len(docs)} Einzelnorm documents from Solr")
        return docs
        
    except Exception as e:
        print(f"❌ Error fetching documents: {e}")
        return [], doc in enumerate(docs[:5]):
def analyze_text_fields(docs: List[Dict]) -> Dict:
    """Analyze text_content vs text_content_html lengths."""
    analysis = {
        "total_docs": len(docs),
        "docs_with_text_content": 0,
        "docs_with_text_content_html": 0,
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
            analysis["docs_with_text_content"] += 1
        if tch_len > 0:
            text_content_html_lengths.append(tch_len)
            analysis["docs_with_text_content_html"] += 1
        
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
                    "text_content_preview": text_content[:150] + "..." if len(text_content) > 150 else text_content,
                    "text_content_html_preview": text_content_html[:150] + "..." if len(text_content_html) > 150 else text_content_html
def main():
    print("🔍 ASRA Textlängen-Analyse (KORRIGIERTE VERSION - NUR EINZELNORMEN)")
    print("=" * 70)
    
    # Fetch documents
    docs = fetch_sample_documents(500)
    if not docs:
        print("❌ No documents fetched. Exiting.")
        sys.exit(1)
    
    # Analyze text fields
    print(f"\n📊 Analysiere text_content vs text_content_html für {len(docs)} Einzelnormen...")
    field_analysis = analyze_text_fields(docs)
    
    # Print summary
    print(f"\n📈 ERGEBNISSE:")
    print(f"   - Gesamte Dokumente: {field_analysis['total_docs']}")
    print(f"   - Dokumente mit text_content: {field_analysis['docs_with_text_content']}")
    print(f"   - Dokumente mit text_content_html: {field_analysis['docs_with_text_content_html']}")
    
    # Check if we found data
    if field_analysis["text_content_stats"] and field_analysis["text_content_html_stats"]:
        print("\n✅ TEXT FIELDS ERFOLGREICH ANALYSIERT!")
        
        # text_content statistics
        tc_stats = field_analysis["text_content_stats"]
        print(f"\n📝 TEXT_CONTENT Statistiken:")
        print(f"   - Anzahl: {tc_stats['count']}")
        print(f"   - Minimum: {tc_stats['min']} Zeichen")
        print(f"   - Maximum: {tc_stats['max']} Zeichen")
        print(f"   - Durchschnitt: {tc_stats['mean']} Zeichen")
        print(f"   - Median: {tc_stats['median']} Zeichen")
        print(f"   - 95. Perzentil: {tc_stats['percentile_95']} Zeichen")
        print(f"   - 99. Perzentil: {tc_stats['percentile_99']} Zeichen")
        
        # text_content_html statistics
        tch_stats = field_analysis["text_content_html_stats"]
        print(f"\n🌐 TEXT_CONTENT_HTML Statistiken:")
        print(f"   - Anzahl: {tch_stats['count']}")
        print(f"   - Minimum: {tch_stats['min']} Zeichen")
        print(f"   - Maximum: {tch_stats['max']} Zeichen")
        print(f"   - Durchschnitt: {tch_stats['mean']} Zeichen")
        print(f"   - Median: {tch_stats['median']} Zeichen")
        print(f"   - 95. Perzentil: {tch_stats['percentile_95']} Zeichen")
        print(f"   - 99. Perzentil: {tch_stats['percentile_99']} Zeichen")
        
        # Comparison
        if field_analysis["comparison"]:
            comp = field_analysis["comparison"]
            print(f"\n🔍 HTML OVERHEAD Vergleich:")
            print(f"   - Durchschnittlicher HTML-Overhead: {comp['avg_html_overhead_pct']}%")
            print(f"   - Median HTML-Overhead: {comp['median_html_overhead_pct']}%")
            print(f"   - Maximaler HTML-Overhead: {comp['max_html_overhead_pct']}%")
        
        # Examples
        if field_analysis["examples"]:
            print(f"\n📋 BEISPIELE (erste 5):")
            for i, example in enumerate(field_analysis["examples"][:5]):
                print(f"\n   {i+1}. {example['id']} ({example['jurabk']})")
                print(f"      - text_content: {example['text_content_length']} Zeichen")
                print(f"      - text_content_html: {example['text_content_html_length']} Zeichen")
                print(f"      - HTML-Overhead: {example['html_overhead_pct']}%")
                print(f"      - Preview: {example['text_content_preview'][:100]}...")
        
        # Conclusions for MAX_TEXT_LENGTH
        max_clean_text = tc_stats['max']
        percentile_99_clean = tc_stats['percentile_99']
        
        print(f"\n🎯 EMPFEHLUNGEN FÜR MAX_TEXT_LENGTH:")
        print(f"   - Aktuell: 1800 Zeichen")
        print(f"   - 99% der Dokumente: ≤ {percentile_99_clean} Zeichen")
        print(f"   - Längster Text: {max_clean_text} Zeichen")
        
        if max_clean_text <= 2000:
            print(f"   ✅ OPTIMIERUNG MÖGLICH: MAX_TEXT_LENGTH kann auf {min(max_clean_text + 200, 1950)} erhöht werden!")
        else:
            print(f"   ⚠️  VORSICHT: Längste Texte überschreiten 2000-Zeichen-API-Limit")
            
    else:
        print("❌ PROBLEM WEITER BESTEHEND:")
        print("   - Auch Einzelnormen haben leere text_content/text_content_html Felder!")
        print("   - Überprüfung der Solr-Indexierung erforderlich")
        
        # Show what fields are available
        if docs:
            print(f"\n🔍 VERFÜGBARE FELDER im ersten Dokument:")
            first_doc = docs[0]
            for key, value in first_doc.items():
                value_preview = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                print(f"   - {key}: {value_preview}")

if __name__ == "__main__":
    main()  "avg_html_overhead_pct": round(statistics.mean(overhead_percentages), 1),
            "median_html_overhead_pct": round(statistics.median(overhead_percentages), 1),
            "max_html_overhead_pct": round(max(overhead_percentages), 1)
        }
    
    return analysis 0 and tch_len > 0:
    # Calculate statistics if we have data
    if text_content_lengths:
        analysis["text_content_stats"] = {
            "count": len(text_content_lengths),
            "min": min(text_content_lengths),
            "max": max(text_content_lengths),
            "mean": round(statistics.mean(text_content_lengths), 1),
            "median": round(statistics.median(text_content_lengths), 1),
            "percentile_95": round(sorted(text_content_lengths)[int(0.95 * len(text_content_lengths))], 1),
            "percentile_99": round(sorted(text_content_lengths)[int(0.99 * len(text_content_lengths))], 1)
        }
    
    if text_content_html_lengths:
        analysis["text_content_html_stats"] = {
            "count": len(text_content_html_lengths),
            "min": min(text_content_html_lengths),
    # Check what we found
    if not field_analysis["text_content_stats"] and not field_analysis["text_content_html_stats"]:
        print("❌ PROBLEM: Auch Einzelnormen haben keine Textinhalte!")
        print("   - Möglicherweise verwenden wir die falschen Feldnamen")
        print("   - Oder die Daten sind anders strukturiert als erwartet")
    else:
        print("✅ Text fields in Einzelnormen gefunden!")
        
        # Show statistics
        if field_analysis["text_content_stats"]:
            stats = field_analysis["text_content_stats"]
            print(f"\n📊 text_content Statistiken ({stats['count']} Dokumente):")
            print(f"   Durchschnitt: {stats['mean']} Zeichen")
            print(f"   Median: {stats['median']} Zeichen")
            print(f"   Maximum: {stats['max']} Zeichen")
            print(f"   95. Perzentil: {stats['percentile_95']} Zeichen")
            print(f"   99. Perzentil: {stats['percentile_99']} Zeichen")
        
        if field_analysis["text_content_html_stats"]:
            stats = field_analysis["text_content_html_stats"]
            print(f"\n📊 text_content_html Statistiken ({stats['count']} Dokumente):")
            print(f"   Durchschnitt: {stats['mean']} Zeichen")
            print(f"   Median: {stats['median']} Zeichen")
            print(f"   Maximum: {stats['max']} Zeichen")
            print(f"   95. Perzentil: {stats['percentile_95']} Zeichen")
            print(f"   99. Perzentil: {stats['percentile_99']} Zeichen")
        
        if field_analysis["comparison"]:
            comp = field_analysis["comparison"]
            print(f"\n🔍 HTML vs. Text Vergleich:")
            print(f"   Durchschnittlicher HTML-Overhead: {comp['avg_html_overhead_pct']}%")
            print(f"   Median HTML-Overhead: {comp['median_html_overhead_pct']}%")
            print(f"   Maximum HTML-Overhead: {comp['max_html_overhead_pct']}%")
        
        # Show examples
        if field_analysis["examples"]:
            print(f"\n📋 Beispiele (erste 5):")
            for i, ex in enumerate(field_analysis["examples"][:5]):
                print(f"   {i+1}. {ex['id']} ({ex['jurabk']}):")
                print(f"      text_content: {ex['text_content_length']} Zeichen")
                print(f"      text_content_html: {ex['text_content_html_length']} Zeichen (Overhead: {ex['html_overhead_pct']}%)")
                print(f"      Preview: {ex['text_content_preview']}")
                print()

if __name__ == "__main__":
    main()  overhead_percentages.append(overhead)
            
            # Collect examples
            if len(analysis["examples"]) < 10:
                analysis["examples"].append({
                    "id": doc.get("id", "unknown"),
                    "jurabk": doc.get("jurabk", ""),
                    "enbez": doc.get("enbez", ""),
                    "text_content_length": tc_len,
    # Calculate statistics if we have data
    if text_content_lengths:
        analysis["text_content_stats"] = {
            "count": len(text_content_lengths),
            "mean": round(statistics.mean(text_content_lengths), 1),
            "median": round(statistics.median(text_content_lengths), 1),
            "min": min(text_content_lengths),
            "max": max(text_content_lengths),
            "p95": round(sorted(text_content_lengths)[int(len(text_content_lengths) * 0.95)], 1),
            "p99": round(sorted(text_content_lengths)[int(len(text_content_lengths) * 0.99)], 1)
        }
    
    # Analyze text fields
    print("\n📊 Analysiere text_content vs text_content_html...")
    field_analysis = analyze_text_fields(docs)
    
    # Check what we found and display results
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
        
        # Display text_content statistics
        if field_analysis["text_content_stats"]:
            stats = field_analysis["text_content_stats"]
            print(f"\n📝 TEXT_CONTENT Statistiken:")
            print(f"   Anzahl Dokumente: {stats['count']}")
            print(f"   Durchschnitt: {stats['mean']} Zeichen")
            print(f"   Median: {stats['median']} Zeichen") 
            print(f"   Min/Max: {stats['min']} / {stats['max']} Zeichen")
            print(f"   95. Perzentil: {stats['p95']} Zeichen")
            print(f"   99. Perzentil: {stats['p99']} Zeichen")
        
        # Display text_content_html statistics  
        if field_analysis["text_content_html_stats"]:
            stats = field_analysis["text_content_html_stats"]
            print(f"\n🌐 TEXT_CONTENT_HTML Statistiken:")
            print(f"   Anzahl Dokumente: {stats['count']}")
            print(f"   Durchschnitt: {stats['mean']} Zeichen")
            print(f"   Median: {stats['median']} Zeichen")
            print(f"   Min/Max: {stats['min']} / {stats['max']} Zeichen")
            print(f"   95. Perzentil: {stats['p95']} Zeichen")
            print(f"   99. Perzentil: {stats['p99']} Zeichen")
        
        # Display comparison
        if field_analysis["comparison"]:
            comp = field_analysis["comparison"]
            print(f"\n⚖️ VERGLEICH HTML vs TEXT:")
            print(f"   Durchschnittlicher HTML-Overhead: {comp['avg_html_overhead_pct']}%")
            print(f"   Median HTML-Overhead: {comp['median_html_overhead_pct']}%")
            print(f"   Maximaler HTML-Overhead: {comp['max_html_overhead_pct']}%")
            print(f"   Dokumente mit Overhead: {comp['samples_with_overhead']}")
        
        # Display examples
        if field_analysis["examples"]:
            print(f"\n📋 BEISPIELE (erste 5):")
            for i, example in enumerate(field_analysis["examples"][:5]):
                print(f"   {i+1}. {example['id']} ({example['jurabk']})")
                print(f"      text_content: {example['text_content_length']} Zeichen")
                print(f"      text_content_html: {example['text_content_html_length']} Zeichen")
                print(f"      HTML-Overhead: {example['html_overhead_pct']}%")
                print(f"      Vorschau: {example['text_content_preview']}")
                print()
        
        # Recommendations based on analysis
        print(f"\n🎯 EMPFEHLUNGEN FÜR QDRANT INDEXER:")
        if field_analysis["text_content_stats"]:
            max_length = field_analysis["text_content_stats"]["max"]
            p99_length = field_analysis["text_content_stats"]["p99"]
            current_limit = 1800
            
            if max_length <= current_limit:
                print(f"   ✅ Aktuelle MAX_TEXT_LENGTH ({current_limit}) ist ausreichend")
                print(f"      Alle Dokumente sind unter {current_limit} Zeichen")
            else:
                recommended = min(2000, int(p99_length * 1.1))  # 10% Puffer, aber max 2000
                print(f"   ⚠️ Aktuelle MAX_TEXT_LENGTH ({current_limit}) zu niedrig")
                print(f"      Empfohlen: {recommended} Zeichen (basierend auf 99. Perzentil + Puffer)")
                print(f"      Längster Text: {max_length} Zeichen")
            
            print(f"   📊 Verwende text_content (sauber) statt text_content_html")
            print(f"   💡 HTML-Overhead vermeiden für bessere Embedding-Qualität")
        }
    
    return analysis "text_content_html_length": tch_len,
                    "html_overhead_pct": round(overhead, 1),
                    "text_content_preview": text_content[:100] + "..." if len(text_content) > 100 else text_content,
                    "text_content_html_preview": text_content_html[:100] + "..." if len(text_content_html) > 100 else text_content_html
                })
    
    # Calculate statistics if we have data
    if text_content_lengths:
        analysis["text_content_stats"] = {
            "count": len(text_content_lengths),
            "min": min(text_content_lengths),
            "max": max(text_content_lengths),
            "mean": round(statistics.mean(text_content_lengths), 1),
            "median": round(statistics.median(text_content_lengths), 1),
    # Analyze text fields
    print("\n📊 Analysiere text_content vs text_content_html...")
    field_analysis = analyze_text_fields(docs)
    
    # Check what we found and display results
    if field_analysis["text_content_stats"] or field_analysis["text_content_html_stats"]:
        print("✅ TEXT FIELDS GEFUNDEN UND ANALYSIERT!")
        print("=" * 60)
        
        print(f"📈 ÜBERSICHT:")
        print(f"   Gesamte Dokumente: {field_analysis['total_docs']}")
        print(f"   Mit text_content: {field_analysis['docs_with_text_content']}")
        print(f"   Mit text_content_html: {field_analysis['docs_with_text_content_html']}")
        
        if field_analysis["text_content_stats"]:
            stats = field_analysis["text_content_stats"]
            print(f"\n📄 TEXT_CONTENT STATISTIKEN:")
            print(f"   Anzahl: {stats['count']}")
            print(f"   Durchschnitt: {stats['mean']} Zeichen")
            print(f"   Median: {stats['median']} Zeichen")
            print(f"   Minimum: {stats['min']} Zeichen")
            print(f"   Maximum: {stats['max']} Zeichen")
            print(f"   95. Perzentil: {stats['percentile_95']} Zeichen")
            print(f"   99. Perzentil: {stats['percentile_99']} Zeichen")
        
        if field_analysis["text_content_html_stats"]:
            stats = field_analysis["text_content_html_stats"]
            print(f"\n🔖 TEXT_CONTENT_HTML STATISTIKEN:")
            print(f"   Anzahl: {stats['count']}")
            print(f"   Durchschnitt: {stats['mean']} Zeichen")
            print(f"   Median: {stats['median']} Zeichen")
            print(f"   Minimum: {stats['min']} Zeichen")
            print(f"   Maximum: {stats['max']} Zeichen")
            print(f"   95. Perzentil: {stats['percentile_95']} Zeichen")
            print(f"   99. Perzentil: {stats['percentile_99']} Zeichen")
        
        if field_analysis["comparison"]:
            comp = field_analysis["comparison"]
            print(f"\n⚖️ VERGLEICH (HTML vs. TEXT):")
            print(f"   Durchschnittlicher HTML-Overhead: {comp['html_overhead_mean']}%")
            print(f"   Median HTML-Overhead: {comp['html_overhead_median']}%")
            print(f"   Maximaler HTML-Overhead: {comp['html_overhead_max']}%")
        
        if field_analysis["examples"]:
            print(f"\n🔍 BEISPIELE (erste 5):")
            for i, example in enumerate(field_analysis["examples"][:5]):
                print(f"   {i+1}. {example['id']} ({example['jurabk']})")
                print(f"      text_content: {example['text_content_length']} Zeichen")
                print(f"      text_content_html: {example['text_content_html_length']} Zeichen")
                print(f"      HTML-Overhead: {example['html_overhead_pct']}%")
                print(f"      Vorschau: {example['text_content_preview'][:80]}...")
                print()
        
        print(f"\n🎯 EMPFEHLUNG FÜR MAX_TEXT_LENGTH:")
        if field_analysis["text_content_stats"]:
            p99 = field_analysis["text_content_stats"]["percentile_99"]
            recommended_limit = int(p99 * 1.1)  # 10% Puffer
            print(f"   Basierend auf 99. Perzentil ({p99}): {recommended_limit} Zeichen")
            print(f"   Aktuelle Einstellung: 1800 Zeichen")
            if recommended_limit > 1800:
                print(f"   ⚠️ AKTUELLE EINSTELLUNG ZU NIEDRIG! Empfehlung: {recommended_limit}")
            else:
                print(f"   ✅ Aktuelle Einstellung ist ausreichend")
                
    else:
        print("❌ PROBLEM IDENTIFIZIERT:")
        print("   - Die text_content und text_content_html Felder sind leer oder fehlen!")
        print("   - Dies bestätigt, dass unser ursprünglicher Ansatz fehlerhaft war")
        print("   - Wir müssen alternative Felder zur Textextraktion verwenden")
        
        print(f"\n🔍 NÄCHSTE SCHRITTE:")
        print("   1. Überprüfe verfügbare Felder in Solr")
        print("   2. Identifiziere richtige Textfelder")
        print("   3. Aktualisiere Qdrant Indexer entsprechend")
            "html_overhead_mean": round(statistics.mean(overhead_percentages), 1),
            "html_overhead_median": round(statistics.median(overhead_percentages), 1),
            "html_overhead_max": round(max(overhead_percentages), 1)
        }
    
    return analysis overhead percentage
        if tc_len > 0 and tch_len > 0:
            overhead = ((tch_len - tc_len) / tc_len) * 100
            overhead_percentages.append(overhead)
            
            # Collect examples
            if len(analysis["examples"]) < 10:
                analysis["examples"].append({
    
    # Calculate statistics if we have data
    if text_content_lengths:
        analysis["text_content_stats"] = {
            "count": len(text_content_lengths),
            "min": min(text_content_lengths),
            "max": max(text_content_lengths),
            "mean": round(statistics.mean(text_content_lengths), 1),
            "median": statistics.median(text_content_lengths),
            "percentile_95": round(statistics.quantiles(text_content_lengths, n=20)[18], 1),  # 95th percentile
            "percentile_99": round(statistics.quantiles(text_content_lengths, n=100)[98], 1) if len(text_content_lengths) >= 100 else max(text_content_lengths)
        }
    
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
        # Display results
        print("✅ Text fields gefunden - Analyse wird durchgeführt...")
        
        tc_stats = field_analysis.get("text_content_stats", {})
        tch_stats = field_analysis.get("text_content_html_stats", {})
        comparison = field_analysis.get("comparison", {})
        
        print(f"\n📊 TEXTLÄNGEN-STATISTIKEN:")
        print("=" * 50)
        
        if tc_stats:
            print(f"\n🔤 TEXT_CONTENT (sauber):")
            print(f"   Anzahl Dokumente: {tc_stats['count']}")
            print(f"   Durchschnitt:     {tc_stats['mean']} Zeichen")
            print(f"   Median:           {tc_stats['median']} Zeichen")
            print(f"   Minimum:          {tc_stats['min']} Zeichen")
            print(f"   Maximum:          {tc_stats['max']} Zeichen")
            print(f"   95. Perzentil:    {tc_stats['percentile_95']} Zeichen")
            print(f"   99. Perzentil:    {tc_stats['percentile_99']} Zeichen")
        
        if tch_stats:
            print(f"\n🏷️  TEXT_CONTENT_HTML (mit HTML-Tags):")
            print(f"   Anzahl Dokumente: {tch_stats['count']}")
            print(f"   Durchschnitt:     {tch_stats['mean']} Zeichen")
            print(f"   Median:           {tch_stats['median']} Zeichen")
            print(f"   Minimum:          {tch_stats['min']} Zeichen")
            print(f"   Maximum:          {tch_stats['max']} Zeichen")
            print(f"   95. Perzentil:    {tch_stats['percentile_95']} Zeichen")
            print(f"   99. Perzentil:    {tch_stats['percentile_99']} Zeichen")
        
        if comparison:
            print(f"\n🔄 HTML-OVERHEAD VERGLEICH:")
            print(f"   Durchschnittlicher HTML-Overhead: {comparison['avg_html_overhead_pct']}%")
            print(f"   Median HTML-Overhead:             {comparison['median_html_overhead_pct']}%")
            print(f"   Maximaler HTML-Overhead:          {comparison['max_html_overhead_pct']}%")
        
        # Show examples
        examples = field_analysis.get("examples", [])
        if examples:
            print(f"\n📋 BEISPIELE (erste {len(examples)}):")
            print("=" * 50)
            for i, ex in enumerate(examples[:5], 1):
                print(f"\n{i}. {ex['id']} ({ex['jurabk']})")
                print(f"   text_content:      {ex['text_content_length']} Zeichen")
                print(f"   text_content_html: {ex['text_content_html_length']} Zeichen")
                print(f"   HTML-Overhead:     {ex['html_overhead_pct']}%")
                print(f"   Inhalt: {ex['text_content_preview']}")
        
        # Recommendations based on current MAX_TEXT_LENGTH = 1800
        current_max = 1800
        if tc_stats:
            safe_limit = tc_stats['percentile_99']
            coverage_95 = tc_stats['percentile_95']
            
            print(f"\n🎯 EMPFEHLUNGEN für MAX_TEXT_LENGTH:")
            print("=" * 50)
            print(f"   Aktuelle Einstellung: {current_max} Zeichen")
            
            if safe_limit <= current_max:
                print(f"   ✅ AKTUELLE EINSTELLUNG IST AUSREICHEND!")
                print(f"      99% der Dokumente sind ≤ {safe_limit} Zeichen")
                print(f"      Mögliche Optimierung: Erhöhung auf {safe_limit + 200} für Sicherheitspuffer")
            else:
                print(f"   ⚠️  AKTUELLE EINSTELLUNG ZU NIEDRIG!")
                print(f"      Empfohlen: {safe_limit + 200} Zeichen (99%-Abdeckung + Puffer)")
                print(f"      Verlustrisiko: Dokumente bis {tc_stats['max']} Zeichen werden gekürzt")
            
            if coverage_95 < current_max:
                pct_covered = (sum(1 for length in field_analysis['examples'] if ex['text_content_length'] <= current_max) / len(field_analysis['examples'])) * 100
                print(f"   📊 Bei aktueller Einstellung: ~{pct_covered:.1f}% vollständig erfasst")
        
        print(f"\n🚀 NÄCHSTE SCHRITTE:")
        print("   1. Aktualisiere MAX_TEXT_LENGTH basierend auf Empfehlungen")
        print("   2. Teste Embedding-Generierung mit neuen Werten")
        print("   3. Führe vollständige Neuindexierung durch")
    
    return analysis "jurabk": doc.get("jurabk", ""),
                    "enbez": doc.get("enbez", ""),
def main():
    print("🔍 ASRA Textlängen-Analyse (KORRIGIERTE VERSION)")
    print("=" * 60)
    
    # Fetch documents with text content
    print("📥 Hole Dokumente mit Textinhalt...")
    docs = fetch_sample_documents(500)
    if not docs:
        print("❌ No documents fetched. Exiting.")
        sys.exit(1)
    
    # Analyze text fields
    print("\n📊 Analysiere text_content vs text_content_html...")
    field_analysis = analyze_text_fields(docs)
    
    # Print summary
    print(f"\n📈 ZUSAMMENFASSUNG:")
    print(f"   Gesamte Dokumente analysiert: {field_analysis['total_docs']}")
    print(f"   Dokumente mit text_content: {field_analysis['docs_with_text_content']}")
    print(f"   Dokumente mit text_content_html: {field_analysis['docs_with_text_content_html']}")
    print(f"   Dokumente mit content_paragraphs: {field_analysis['docs_with_content_paragraphs']}")
    
    # Check what we found
    if not field_analysis["text_content_stats"] and not field_analysis["text_content_html_stats"]:
        print("\n❌ IMMER NOCH EIN PROBLEM:")
        print("   - Auch mit Filter finden wir keine text_content Felder!")
        print("   - Das deutet auf ein anderes Schema-Problem hin")
        return
    
    # Print text_content statistics
    if field_analysis["text_content_stats"]:
        stats = field_analysis["text_content_stats"]
        print(f"\n📊 TEXT_CONTENT STATISTIKEN:")
        print(f"   Anzahl Dokumente: {stats['count']}")
        print(f"   Durchschnitt: {stats['mean']} Zeichen")
        print(f"   Median: {stats['median']} Zeichen")
        print(f"   Minimum: {stats['min']} Zeichen")
        print(f"   Maximum: {stats['max']} Zeichen")
        print(f"   95. Perzentil: {stats['percentile_95']} Zeichen")
        print(f"   99. Perzentil: {stats['percentile_99']} Zeichen")
    
    # Print text_content_html statistics
    if field_analysis["text_content_html_stats"]:
        stats = field_analysis["text_content_html_stats"]
        print(f"\n📊 TEXT_CONTENT_HTML STATISTIKEN:")
        print(f"   Anzahl Dokumente: {stats['count']}")
        print(f"   Durchschnitt: {stats['mean']} Zeichen")
        print(f"   Median: {stats['median']} Zeichen")
        print(f"   Minimum: {stats['min']} Zeichen")
        print(f"   Maximum: {stats['max']} Zeichen")
        print(f"   95. Perzentil: {stats['percentile_95']} Zeichen")
        print(f"   99. Perzentil: {stats['percentile_99']} Zeichen")
    
    # Print comparison
    if field_analysis["comparison"]:
        comp = field_analysis["comparison"]
        print(f"\n🔄 VERGLEICH (HTML vs CLEAN TEXT):")
        print(f"   Durchschnittlicher HTML-Overhead: {comp['avg_html_overhead_pct']}%")
        print(f"   Median HTML-Overhead: {comp['median_html_overhead_pct']}%")
        print(f"   Maximaler HTML-Overhead: {comp['max_html_overhead_pct']}%")
    
    # Print examples
    if field_analysis["examples"]:
        print(f"\n📋 BEISPIELE (erste 5):")
        for i, example in enumerate(field_analysis["examples"][:5]):
            print(f"   {i+1}. {example['id']} ({example['jurabk']})")
            print(f"      text_content: {example['text_content_length']} Zeichen")
            print(f"      text_content_html: {example['text_content_html_length']} Zeichen ({example['html_overhead_pct']}% Overhead)")
            print(f"      Preview: {example['text_content_preview']}")
            print()
    
    # Current MAX_TEXT_LENGTH analysis
    current_limit = 1800
    stats = field_analysis.get("text_content_stats", {})
    if stats:
        docs_over_limit = len([l for l in range(stats['count']) if l > current_limit])
        coverage_pct = ((stats['count'] - docs_over_limit) / stats['count']) * 100
        print(f"\n🎯 AKTUELLE KONFIGURATION (MAX_TEXT_LENGTH = {current_limit}):")
        print(f"   Dokumente vollständig erfasst: {coverage_pct:.1f}%")
        print(f"   Dokumente über dem Limit: {docs_over_limit}")
        
        # Recommendations
        if stats['percentile_99'] <= 2000:
            recommended_limit = min(1950, stats['percentile_99'])
            print(f"\n💡 EMPFEHLUNG:")
            print(f"   Erhöhe MAX_TEXT_LENGTH auf {recommended_limit} (sicher unter 2000-Zeichen-API-Limit)")
            print(f"   Dies würde die Abdeckung verbessern ohne Stabilitätsprobleme")

if __name__ == "__main__":
    main()
    
    # Calculate comparison statistics
    if overhead_percentages:
        analysis["comparison"] = {
            "avg_html_overhead_pct": round(statistics.mean(overhead_percentages), 1),
            "median_html_overhead_pct": round(statistics.median(overhead_percentages), 1),
            "max_html_overhead_pct": round(max(overhead_percentages), 1)
        }
    
    return analysististics for text_content
    if text_content_lengths:
        analysis["text_content_stats"] = {
            "count": len(text_content_lengths),
            "mean": round(statistics.mean(text_content_lengths), 1),
            "median": statistics.median(text_content_lengths),
            "min": min(text_content_lengths),
            "max": max(text_content_lengths),
            "percentile_95": round(sorted(text_content_lengths)[int(0.95 * len(text_content_lengths))], 1),
            "percentile_99": round(sorted(text_content_lengths)[int(0.99 * len(text_content_lengths))], 1)
        }
    
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
        
        # Print statistics
        if field_analysis["text_content_stats"]:
            print(f"\n📊 TEXT_CONTENT Statistiken:")
            stats = field_analysis["text_content_stats"]
            print(f"   Dokumente: {stats['count']}")
            print(f"   Durchschnitt: {stats['mean']} Zeichen")
            print(f"   Median: {stats['median']} Zeichen")
            print(f"   Min/Max: {stats['min']} / {stats['max']} Zeichen")
            print(f"   95. Perzentil: {stats['percentile_95']} Zeichen")
            print(f"   99. Perzentil: {stats['percentile_99']} Zeichen")
        
        if field_analysis["text_content_html_stats"]:
            print(f"\n📊 TEXT_CONTENT_HTML Statistiken:")
            stats = field_analysis["text_content_html_stats"]
            print(f"   Dokumente: {stats['count']}")
            print(f"   Durchschnitt: {stats['mean']} Zeichen")
            print(f"   Median: {stats['median']} Zeichen")
            print(f"   Min/Max: {stats['min']} / {stats['max']} Zeichen")
            print(f"   95. Perzentil: {stats['percentile_95']} Zeichen")
            print(f"   99. Perzentil: {stats['percentile_99']} Zeichen")
        
        if field_analysis["comparison"]:
            print(f"\n🔍 HTML-OVERHEAD Vergleich:")
            comp = field_analysis["comparison"]
            print(f"   Durchschnittlicher HTML-Overhead: {comp['avg_html_overhead_pct']}%")
            print(f"   Median HTML-Overhead: {comp['median_html_overhead_pct']}%")
            print(f"   Min/Max HTML-Overhead: {comp['min_html_overhead_pct']}% / {comp['max_html_overhead_pct']}%")
        
        # Show examples
        if field_analysis["examples"]:
            print(f"\n📝 Beispiel-Dokumente:")
            for i, example in enumerate(field_analysis["examples"][:5], 1):
                print(f"   {i}. {example['id']} ({example['jurabk']})")
                print(f"      text_content: {example['text_content_length']} Zeichen")
                print(f"      text_content_html: {example['text_content_html_length']} Zeichen")
                print(f"      HTML-Overhead: {example['html_overhead_pct']}%")
                print(f"      Preview: {example['text_content_preview']}")
                print()
        
        # Recommendations
        print(f"\n🎯 EMPFEHLUNGEN basierend auf korrigierten Daten:")
        if field_analysis["text_content_stats"]:
            stats = field_analysis["text_content_stats"]
            print(f"   • Aktuelle MAX_TEXT_LENGTH (1800) vs. 99. Perzentil ({stats['percentile_99']})")
            if stats['percentile_99'] > 1800:
                print(f"   • ⚠️  OPTIMIERUNG MÖGLICH: MAX_TEXT_LENGTH könnte auf ~{int(stats['percentile_99'] * 1.1)} erhöht werden")
            else:
                print(f"   • ✅ Aktuelle Einstellung ist ausreichend")
            
            if stats['max'] > 2000:
                print(f"   • ⚠️  CHUNKING ERFORDERLICH: Längster Text ({stats['max']} Zeichen) überschreitet Ollama-Limit")
            else:
                print(f"   • ✅ Alle Texte unter Ollama-Limit (2000 Zeichen)")
        
        print(f"\n🔧 NÄCHSTE SCHRITTE:")
        print(f"   1. Aktualisiere Qdrant Indexer mit korrekter Feld-Priorität")
        print(f"   2. Optimiere MAX_TEXT_LENGTH basierend auf realen Daten")
        print(f"   3. Re-indexiere mit korrekten Einstellungen")ad_percentages), 2),
            "max_html_overhead_pct": round(max(overhead_percentages), 2),
            "min_html_overhead_pct": round(min(overhead_percentages), 2)
        }
    
    return analysiss["docs_with_text_content"] += 1
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