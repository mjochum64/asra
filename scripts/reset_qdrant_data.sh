#!/bin/bash
# Skript zum Zurücksetzen der Qdrant-Datenbank (Löschen der Kollektionen)

echo "=== ASRA Qdrant-Daten zurücksetzen ==="

# Docker-Container für Qdrant
CONTAINER_NAME="asra_qdrant"

# Prüfen, ob der Container läuft
if ! docker ps | grep -q "$CONTAINER_NAME"; then
  echo "Fehler: Qdrant-Container '$CONTAINER_NAME' ist nicht aktiv."
  echo "Bitte starten Sie zuerst alle Container mit ./start_all.sh"
  exit 1
fi

# Qdrant URL für den exponierten Port
QDRANT_URL="http://localhost:6333"

# Bestehende Kollektionen auflisten
echo "Aktuelle Kollektionen in Qdrant:"
COLLECTIONS=$(curl -s "$QDRANT_URL/collections")

if [ -z "$COLLECTIONS" ]; then
  echo "Keine Verbindung zu Qdrant möglich oder keine Kollektionen vorhanden."
  exit 1
fi

echo "$COLLECTIONS" | grep -o '"name":"[^"]*"' | cut -d':' -f2 | tr -d '"'

# Bestätigung anfordern
read -p "Möchten Sie wirklich ALLE Kollektionen in Qdrant löschen? (j/n) " -r
echo
if [[ ! $REPLY =~ ^[Jj]$ ]]; then
  echo "Vorgang abgebrochen."
  exit 0
fi

echo "Lösche alle Kollektionen aus Qdrant..."

# Alle Kollektionen durchlaufen und löschen
for collection in $(echo "$COLLECTIONS" | grep -o '"name":"[^"]*"' | cut -d':' -f2 | tr -d '"'); do
  echo "Lösche Kollektion: $collection"
  DELETE_RESPONSE=$(curl -s -X DELETE "$QDRANT_URL/collections/$collection")
  if echo "$DELETE_RESPONSE" | grep -q '"status":"ok"'; then
    echo "✓ Kollektion $collection wurde erfolgreich gelöscht"
  else
    echo "✗ Fehler beim Löschen der Kollektion $collection:"
    echo "$DELETE_RESPONSE"
  fi
done

echo
echo "✓ Die Qdrant-Datenbank wurde zurückgesetzt"
echo
echo "Sie können jetzt Dokumente neu indizieren mit:"
echo "./scripts/reindex_qdrant.sh"
