#!/bin/bash
# Convenience-Skript zum Starten aller Komponenten
set -e  # Abbrechen bei Fehlern

echo "=== ASRA Hybrid-Suchsystem starten ==="

# 1. Prüfen, ob Docker läuft
echo "1. Docker-Status prüfen..."
if ! docker info > /dev/null 2>&1; then
  echo "Fehler: Docker läuft nicht. Bitte starten Sie den Docker-Dienst."
  exit 1
fi
echo "✓ Docker läuft"

# 2. Services starten
echo "2. Container starten mit docker-compose..."
docker-compose -f infrastructure/docker-compose-hybrid.yml up -d
echo "✓ Container gestartet"

# 3. Kurze Pause, um sicherzustellen, dass die Services hochgefahren sind
echo "3. Warte auf Services (20 Sekunden)..."
sleep 20  # Wartezeit erhöht für langsamere Systeme und Ollama-Initialisierung

# 4. Prüfen, ob Ollama bereit ist und Modell ziehen
echo "4. Prüfe Ollama-Status und lade Embedding-Modell..."
# Warte bis zu 30 Sekunden darauf, dass Ollama bereit ist
max_attempts=6
attempt=1
while [ $attempt -le $max_attempts ]; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:11434 | grep -q "200"; then
    echo "✓ Ollama-Service ist bereit (Versuch $attempt/$max_attempts)"
    break
  fi
  echo "⏳ Warte auf Ollama-Service (Versuch $attempt/$max_attempts)..."
  sleep 5
  attempt=$((attempt+1))
done

if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:11434 | grep -q "200"; then
  echo "⚠️  Warnung: Ollama-Service scheint nicht erreichbar zu sein. Embedding-Modell kann nicht heruntergeladen werden."
else
  echo "🔄 Lade Embedding-Modell..."
  PULL_RESPONSE=$(curl -s -X POST http://localhost:11434/api/pull -d '{"name":"qllama/multilingual-e5-large-instruct:latest"}')
  
  if echo "$PULL_RESPONSE" | grep -q "error"; then
    echo "⚠️  Warnung: Problem beim Laden des Embedding-Modells. Details:"
    echo "$PULL_RESPONSE"
    echo "Hinweis: Bitte prüfen Sie, ob curl im Ollama-Container installiert ist."
    echo "         (Ein bekanntes Problem ist, dass Health-Checks ohne curl fehlschlagen.)"
  else
    echo "✓ Embedding-Modell erfolgreich geladen"
  fi
fi

# 5. Service-Status prüfen
echo "5. Service-Status wird geprüft..."

# Frontend prüfen
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null | grep -q -E "2..|3.."; then
  FRONTEND_STATUS="✓ Erreichbar"
else
  FRONTEND_STATUS="⚠️ Nicht erreichbar"
fi

# API prüfen
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null | grep -q -E "2..|3.."; then
  API_STATUS="✓ Erreichbar"
else
  API_STATUS="⚠️ Nicht erreichbar"
fi

# Solr prüfen
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8983/solr/ 2>/dev/null | grep -q -E "2..|3.."; then
  SOLR_STATUS="✓ Erreichbar"
else
  SOLR_STATUS="⚠️ Nicht erreichbar"
fi

# Qdrant prüfen
if curl -s -o /dev/null -w "%{http_code}" http://localhost:6333/ 2>/dev/null | grep -q -E "2..|3.."; then
  QDRANT_STATUS="✓ Erreichbar"
else
  QDRANT_STATUS="⚠️ Nicht erreichbar"
fi

# Ollama prüfen
if curl -s -o /dev/null -w "%{http_code}" http://localhost:11434 2>/dev/null | grep -q -E "2..|3.."; then
  OLLAMA_STATUS="✓ Erreichbar"
else
  OLLAMA_STATUS="⚠️ Nicht erreichbar"
fi

# OpenWebUI prüfen
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8181 2>/dev/null | grep -q -E "2..|3.."; then
  OPENWEBUI_STATUS="✓ Erreichbar"
else
  OPENWEBUI_STATUS="⚠️ Nicht erreichbar"
fi

# Zusammenfassung anzeigen
echo ""
echo "=== ASRA Hybrid-Suchsystem gestartet ==="
echo "Service-Endpunkte:"
echo "- Frontend:   http://localhost:8080 ($FRONTEND_STATUS)"
echo "- API:        http://localhost:3001 ($API_STATUS)" 
echo "- Solr:       http://localhost:8983 ($SOLR_STATUS)"
echo "- Qdrant:     http://localhost:6333 ($QDRANT_STATUS)"
echo "- Ollama:     http://localhost:11434 ($OLLAMA_STATUS)"
echo "- OpenWebUI:  http://localhost:8181 ($OPENWEBUI_STATUS)"
echo ""
echo "Nächste Schritte:"
echo "1. Demo-Daten in Solr importieren: ./scripts/import_solr_data.sh"
echo "2. Dokumente in Qdrant indizieren: ./scripts/reindex_qdrant.sh"
echo "3. Hybrid-Suche in der Kommandozeile testen: ./scripts/hybrid_search.sh 'Grundgesetz'"
echo "4. Frontend im Browser öffnen: http://localhost:8080"
echo ""
echo "Hinweis: Die Skripte sind für die Verwendung mit Docker optimiert und führen"
echo "die Befehle direkt im Container aus, um auf das Docker-Netzwerk zuzugreifen."
echo ""
echo "Bei Problemen mit den Containern überprüfen Sie den Status mit: docker ps"
