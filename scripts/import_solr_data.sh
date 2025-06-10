#!/bin/bash
# Skript zum Importieren von Demo-Daten in Solr über Docker
# Nutzt den exponierten Port des Solr-Containers für den Import vom Host-System

echo "=== ASRA Dokumente in Solr importieren ==="

# Docker-Container für Solr
CONTAINER_NAME="asra_solr"

# Prüfen, ob der Container läuft
if ! docker ps | grep -q "$CONTAINER_NAME"; then
  echo "Fehler: Solr-Container '$CONTAINER_NAME' ist nicht aktiv."
  echo "Bitte starten Sie zuerst alle Container mit ./start_all.sh"
  exit 1
fi

# Aktuelles Verzeichnis speichern
CURRENT_DIR=$(pwd)

# In das Verzeichnis search-engines/solr wechseln
cd "$(dirname "$0")/../search-engines/solr" || exit 1

# Solr URL für den exponierten Port
export SOLR_URL="http://localhost:8983/solr/documents"

echo "Starte Import von Demo-Daten in Solr über $SOLR_URL..."
./import_demodata.sh "$@"

# Prüfe, ob der Import erfolgreich war
if [ $? -eq 0 ]; then
  echo "✓ Import erfolgreich abgeschlossen"
  echo "Überprüfen Sie die Daten unter http://localhost:8983/solr/#/documents/query"
else
  echo "✗ Beim Import ist ein Fehler aufgetreten"
fi

# Zurück zum ursprünglichen Verzeichnis wechseln
cd "$CURRENT_DIR" || exit 1
