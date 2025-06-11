#!/bin/bash
# Skript zum Neuindexieren von Dokumenten in Qdrant über den exponierten Port
# Ähnlich zum Solr-Import verwendet dieses Skript den exponierten Port von Qdrant (6333)

echo "=== ASRA Dokumente in Qdrant neu indexieren ==="

# Docker-Container für Qdrant
QDRANT_CONTAINER="asra_qdrant"
OLLAMA_CONTAINER="asra_ollama"

# Prüfen, ob die Container laufen
if ! docker ps | grep -q "$QDRANT_CONTAINER"; then
  echo "Fehler: Qdrant-Container '$QDRANT_CONTAINER' ist nicht aktiv."
  echo "Bitte starten Sie zuerst alle Container mit ./start_all.sh"
  exit 1
fi

if ! docker ps | grep -q "$OLLAMA_CONTAINER"; then
  echo "Fehler: Ollama-Container '$OLLAMA_CONTAINER' ist nicht aktiv."
  echo "Bitte starten Sie zuerst alle Container mit ./start_all.sh"
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

echo "Prüfe Verbindung zu Diensten..."

# Qdrant-Verbindung prüfen
if ! curl -s -o /dev/null -w "%{http_code}" "$QDRANT_URL/collections" | grep -q "200"; then
  echo "Fehler: Kann keine Verbindung zu Qdrant unter $QDRANT_URL herstellen"
  exit 1
fi
echo "✓ Qdrant erreichbar auf $QDRANT_URL"

# Ollama-Verbindung prüfen
if ! curl -s -o /dev/null -w "%{http_code}" "$OLLAMA_URL" | grep -q "200"; then
  echo "Fehler: Kann keine Verbindung zu Ollama unter $OLLAMA_URL herstellen"
  exit 1
fi
echo "✓ Ollama erreichbar auf $OLLAMA_URL"

# Solr-Verbindung prüfen
if ! curl -s -o /dev/null -w "%{http_code}" "$SOLR_URL/admin/ping" | grep -q "200"; then
  echo "Fehler: Kann keine Verbindung zu Solr unter $SOLR_URL herstellen"
  exit 1
fi
echo "✓ Solr erreichbar auf $SOLR_URL"

echo
echo "Starte Indexierung der Dokumente in Qdrant..."
echo "Dies kann je nach Datenmenge einige Zeit dauern."

# Python-Script ausführen mit den angegebenen Parametern
# Ohne --docker, da wir die lokalen Ports verwenden
python3 qdrant_indexer.py --recreate "$@"

# Prüfe, ob die Indexierung erfolgreich war
if [ $? -eq 0 ]; then
  echo "✓ Dokumente wurden erfolgreich in Qdrant indexiert"
else
  echo "✗ Beim Indexieren ist ein Fehler aufgetreten"
fi

# Zurück zum ursprünglichen Verzeichnis wechseln
cd "$CURRENT_DIR" || exit 1
