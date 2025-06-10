#!/bin/bash

# Deployment-Skript für ASRA – Deutsche Gesetze

# Sicherstellen, dass das Skript mit root-Rechten ausgeführt wird
if [ "$EUID" -ne 0 ]; then
  echo "Bitte führen Sie dieses Skript als root aus."
  exit 1
fi

# In das Projektverzeichnis wechseln
cd "$(dirname "$0")"

# Umgebung für Produktion setzen
export NODE_ENV=production

# Alte Docker-Container und Volumes stoppen und entfernen
echo "Stoppe und entferne alte Container..."
docker-compose down -v

# Neuesten Code aus dem Repository ziehen (falls Git verwendet wird)
# Auskommentiert, da es nur in einer Git-Umgebung notwendig ist
# echo "Aktualisiere den Code..."
# git pull

# Images neu bauen
echo "Baue Docker-Images neu..."
docker-compose build --no-cache

# Container starten
echo "Starte die ASRA-Anwendung..."
docker-compose up -d

# Warten, bis Solr bereit ist
echo "Warte auf Solr..."
until $(curl --output /dev/null --silent --head --fail http://localhost:8983/solr/); do
  printf '.'
  sleep 2
done

# Daten in Solr laden
echo -e "\nLade Beispieldaten in Solr..."
chmod +x ./docker/solr/load_sample_data.py
python ./docker/solr/load_sample_data.py

echo "ASRA wurde erfolgreich deployt!"
echo "Die Anwendung ist unter http://localhost:8080/ verfügbar."
echo "Solr Admin UI ist unter http://localhost:8983/solr/ verfügbar."
