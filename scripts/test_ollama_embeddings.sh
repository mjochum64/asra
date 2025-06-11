#!/bin/bash
# Test script für Ollama Embedding API
# Dieses Skript führt Tests mit der Ollama API durch, um Probleme bei der Embedding-Generierung zu identifizieren

echo "=== ASRA Ollama Embedding Test ==="

# Verzeichnis des Skripts ermitteln
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR/../search-engines/qdrant" || exit 1

# Prüfen, ob Docker-Container läuft
if docker ps | grep -q "asra_ollama"; then
  echo "✓ Ollama Docker-Container läuft"
  # Prüfen, ob wir vom Host aus zugreifen (localhost sollte funktionieren)
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:11434" | grep -q "200"; then
    echo "✓ Ollama über localhost:11434 erreichbar"
    USE_DOCKER=""
  else
    echo "ℹ️ Ollama nicht über localhost erreichbar, verwende Docker-Netzwerk"
    USE_DOCKER="--docker"
  fi
else
  echo "ℹ️ Ollama Docker-Container nicht gefunden, verwende lokalen Endpunkt"
  USE_DOCKER=""
fi

# Optionale Parameter
TEXT_PARAM=""
if [ -n "$1" ]; then
  TEXT_PARAM="--text \"$1\""
fi

# Debug-Modus
DEBUG_PARAM=""
if [ "$2" == "--debug" ] || [ "$1" == "--debug" ]; then
  DEBUG_PARAM="--debug"
fi

# Ausführen des Python-Skripts
echo "Starte Ollama Embedding-Test..."
echo ""

if [ -n "$TEXT_PARAM" ]; then
  python3 test_ollama_embedding.py $USE_DOCKER $DEBUG_PARAM --text "$1"
else
  python3 test_ollama_embedding.py $USE_DOCKER $DEBUG_PARAM
fi

# Exitcode prüfen
if [ $? -eq 0 ]; then
  echo "✓ Test erfolgreich abgeschlossen"
else
  echo "✗ Test fehlgeschlagen"
fi
