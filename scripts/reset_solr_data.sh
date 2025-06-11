#!/bin/bash
# Skript zum Zurücksetzen der Solr-Datenbank (Löschen aller Dokumente)

echo "=== ASRA Solr-Daten zurücksetzen ==="

# Docker-Container für Solr
CONTAINER_NAME="asra_solr"

# Prüfen, ob der Container läuft
if ! docker ps | grep -q "$CONTAINER_NAME"; then
  echo "Fehler: Solr-Container '$CONTAINER_NAME' ist nicht aktiv."
  echo "Bitte starten Sie zuerst alle Container mit ./start_all.sh"
  exit 1
fi

# Solr URL für den exponierten Port
SOLR_URL="http://localhost:8983/solr/documents"

# Anzahl der Dokumente vor dem Löschen überprüfen
echo "Aktuelle Dokumente in Solr:"
curl -s "$SOLR_URL/select?q=*:*&rows=0" | grep -o '"numFound":[0-9]*' | cut -d':' -f2

# Bestätigung anfordern
read -p "Möchten Sie wirklich ALLE Dokumente in Solr löschen? (j/n) " -r
echo
if [[ ! $REPLY =~ ^[Jj]$ ]]; then
  echo "Vorgang abgebrochen."
  exit 0
fi

echo "Lösche alle Dokumente aus Solr..."
DELETE_RESPONSE=$(curl -s -X POST "$SOLR_URL/update?commit=true" \
  -H "Content-Type: application/json" \
  -d '{"delete": {"query": "*:*"}}')

# Ergebnis überprüfen
if echo "$DELETE_RESPONSE" | grep -q '"status":0'; then
  echo "✓ Alle Dokumente wurden erfolgreich gelöscht"
  echo "✓ Die Solr-Sammlung ist jetzt leer und kann neu importiert werden"
else
  echo "✗ Beim Löschen ist ein Fehler aufgetreten:"
  echo "$DELETE_RESPONSE"
  exit 1
fi

echo
echo "Sie können jetzt neue Dokumente importieren mit:"
echo "./scripts/import_solr_data.sh"
