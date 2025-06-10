#!/bin/bash
# Skript zum Ausführen der Hybrid-Suche über die exponierten Ports
# Ähnlich zu den anderen Skripten verwendet dieses die lokalen Ports für Solr und Qdrant

echo "=== ASRA Hybrid-Suche ausführen ==="

# Prüfen, ob die erforderlichen Docker-Container laufen
QDRANT_CONTAINER="asra_qdrant"
SOLR_CONTAINER="asra_solr"
OLLAMA_CONTAINER="asra_ollama"

for container in "$QDRANT_CONTAINER" "$SOLR_CONTAINER" "$OLLAMA_CONTAINER"; do
  if ! docker ps | grep -q "$container"; then
    echo "Fehler: Container '$container' ist nicht aktiv."
    echo "Bitte starten Sie zuerst alle Container mit ./start_all.sh"
    exit 1
  fi
done

# Prüfen, ob eine Suchanfrage übergeben wurde
if [ -z "$1" ]; then
  echo "Fehler: Keine Suchanfrage angegeben."
  echo "Verwendung: $0 \"Suchanfrage\" [--limit N] [--weights W1,W2]"
  exit 1
fi

# Aktuelles Verzeichnis speichern
CURRENT_DIR=$(pwd)

# In das Verzeichnis search-engines/qdrant wechseln
cd "$(dirname "$0")/../search-engines/qdrant" || exit 1

# Umgebungsvariablen für lokale Ports setzen
export QDRANT_URL="http://localhost:6333"
export OLLAMA_URL="http://localhost:11434"
export SOLR_URL="http://localhost:8983/solr/documents"

echo "Führe Hybrid-Suche mit lokalen Endpunkten durch..."

# Führe die Suche aus
python3 hybrid_search.py --query "$@"

# Prüfe, ob die Suche erfolgreich war
if [ $? -eq 0 ]; then
  echo "Suche abgeschlossen."
else
  echo "Bei der Suche ist ein Fehler aufgetreten."
fi

# Zurück zum ursprünglichen Verzeichnis wechseln
cd "$CURRENT_DIR" || exit 1
