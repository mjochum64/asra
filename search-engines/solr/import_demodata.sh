#!/bin/bash

# Import-Script für Demo-Daten
# Verwendung: ./import_demodata.sh [demodata-verzeichnis]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEMODATA_DIR="${1:-$SCRIPT_DIR/demodata}"
SOLR_URL="${SOLR_URL:-http://localhost:8983/solr/documents}"

echo "=== Solr Import für deutsche Rechtsdokumente ==="
echo "Demodata-Verzeichnis: $DEMODATA_DIR"
echo "Solr URL: $SOLR_URL"
echo

# Prüfen ob Verzeichnis existiert
if [ ! -d "$DEMODATA_DIR" ]; then
    echo "Fehler: Verzeichnis $DEMODATA_DIR nicht gefunden!"
    echo "Verwendung: $0 [demodata-verzeichnis]"
    exit 1
fi

# Prüfen ob Python-Script existiert
PYTHON_SCRIPT="$SCRIPT_DIR/solr_import_norms.py"
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "Fehler: Python-Script $PYTHON_SCRIPT nicht gefunden!"
    exit 1
fi

# Python-Abhängigkeiten prüfen
echo "Prüfe Python-Abhängigkeiten..."
python3 -c "import requests, xml.etree.ElementTree" 2>/dev/null || {
    echo "Installiere Python-Abhängigkeiten..."
    pip3 install requests
}

# Solr-Verbindung testen
echo "Teste Solr-Verbindung..."
PING_RESPONSE=$(curl -s "$SOLR_URL/admin/ping" 2>/dev/null)
if [ -z "$PING_RESPONSE" ] || ! echo "$PING_RESPONSE" | grep -q '"status":"OK"'; then
    echo "Fehler: Kann keine Verbindung zu Solr herstellen!"
    echo "Solr-Response: $PING_RESPONSE"
    echo "Stelle sicher, dass Solr läuft: docker-compose up -d solr"
    exit 1
fi

echo "Solr-Verbindung erfolgreich ✓"
echo

# Import durchführen
echo "Starte Import..."
python3 "$PYTHON_SCRIPT" "$DEMODATA_DIR" --solr-url "$SOLR_URL" --verbose

echo
echo "=== Import abgeschlossen ==="
echo "Teste die Suche: curl '$SOLR_URL/select?q=*:*&rows=5'"