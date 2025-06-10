# Migrationsskript für ASRA-Projektreorganisation

#!/bin/bash

# Dieses Skript reorganisiert die ASRA-Projektstruktur in eine funktionale Aufteilung
# Es erstellt die neue Struktur und verschiebt Dateien entsprechend
# Führen Sie dieses Skript im Root-Verzeichnis des ASRA-Projekts aus

set -e  # Bei Fehlern abbrechen

echo "=== ASRA Projekt-Reorganisation Start ==="
echo "Aktuelle Projektstruktur wird in eine funktionale Struktur migriert:"
echo "- /frontend     (Frontend-Code)"
echo "- /backend      (Backend-Services)"
echo "- /search-engines (Suchmaschinen)"
echo "- /infrastructure (Docker, Konfiguration, Deployment)"
echo ""

# Prüfen, ob das Skript im Projektroot ausgeführt wird
if [ ! -f "./PLANNING.md" ] || [ ! -d "./src" ]; then
    echo "FEHLER: Dieses Skript muss im Root-Verzeichnis des ASRA-Projekts ausgeführt werden!"
    exit 1
fi

# Sicherstellen, dass wir einen sauberen Git-Status haben
if [ -n "$(git status --porcelain)" ]; then
    echo "WARNUNG: Es gibt ungespeicherte Änderungen im Git-Repository."
    echo "Bitte commiten oder stashen Sie alle Änderungen, bevor Sie dieses Skript ausführen."
    read -p "Trotzdem fortfahren? (j/n): " CONTINUE
    if [ "$CONTINUE" != "j" ]; then
        echo "Migration abgebrochen."
        exit 0
    fi
fi

echo "1. Erstellen der neuen Verzeichnisstruktur..."
mkdir -p frontend/src
mkdir -p frontend/public
mkdir -p backend/api
mkdir -p search-engines/qdrant
mkdir -p search-engines/solr
mkdir -p infrastructure/scripts
mkdir -p infrastructure/nginx

echo "2. Migrieren des Frontend-Codes..."
cp -r src/* frontend/src/
cp -r public/* frontend/public/
cp index.html frontend/
cp vite.config.js frontend/
cp postcss.config.js frontend/ 2>/dev/null || true
cp tailwind.config.js frontend/ 2>/dev/null || true
cp package.json frontend/
cp package-lock.json frontend/ 2>/dev/null || true

echo "3. Migrieren des Backend-Codes..."
cp -r api/* backend/api/
# Erstellen einer neuen package.json im Backend-Root
cat << EOF > backend/package.json
{
  "name": "asra-backend",
  "version": "1.0.0",
  "description": "Backend-Services für ASRA - Deutsche Gesetze",
  "main": "api/server.js",
  "scripts": {
    "start": "node api/server.js",
    "dev": "nodemon api/server.js"
  },
  "dependencies": $(grep -oP '"dependencies": \{.*?\},' api/package.json | sed 's/,$//'),
  "devDependencies": $(grep -oP '"devDependencies": \{.*?\},' api/package.json | sed 's/,$//') 
}
EOF

echo "4. Migrieren der Suchmaschinen..."
cp -r docker/qdrant/* search-engines/qdrant/
cp -r docker/solr/* search-engines/solr/

echo "5. Migrieren der Infrastruktur..."
cp docker-compose*.yml infrastructure/
cp Dockerfile* infrastructure/
cp -r docker/nginx/* infrastructure/nginx/
cp deploy.sh infrastructure/ 2>/dev/null || true
cp start_*.sh infrastructure/scripts/ 2>/dev/null || true

# Convenience-Skripte im Root erstellen
echo "6. Erstellen von Convenience-Skripten im Root..."

cat << EOF > start_frontend.sh
#!/bin/bash
# Convenience-Skript zum Starten des Frontends
cd frontend && npm run dev
EOF

cat << EOF > start_backend.sh
#!/bin/bash
# Convenience-Skript zum Starten des Backends
cd backend && npm run start
EOF

cat << EOF > start_all.sh
#!/bin/bash
# Convenience-Skript zum Starten aller Komponenten
cd infrastructure/scripts && ./start_hybrid_docker.sh
EOF

chmod +x start_frontend.sh start_backend.sh start_all.sh

# README.md aktualisieren
echo "7. Aktualisieren der README.md..."
cp README.md README.md.bak
cat << EOF > README.md
# ASRA - Deutsche Gesetze

Eine Suchmaschine und Anzeigeplattform für deutsche Gesetze.

## Projektstruktur

Das Projekt wurde in eine funktionale Struktur reorganisiert:

- \`/frontend\` - Frontend-Anwendung (React/Vite)
- \`/backend\` - Backend-Services (Express API)
- \`/search-engines\` - Suchmaschinen (Solr, Qdrant, Hybrid-Suche)
- \`/infrastructure\` - Docker-Konfiguration und Deployment-Skripte

## Schnellstart

\`\`\`bash
# Alle Komponenten starten (mit Docker)
./start_all.sh

# Nur Frontend starten (Entwicklung)
./start_frontend.sh

# Nur Backend starten (Entwicklung)
./start_backend.sh
\`\`\`

$(grep -A 1000 "## Weitere Informationen" README.md.bak || echo "")
EOF

echo "=== ASRA Projekt-Reorganisation abgeschlossen! ==="
echo ""
echo "HINWEIS: Diese Reorganisation verschiebt Dateien in die neue Struktur, löscht aber keine Originaldateien."
echo "Nachdem Sie alle Änderungen überprüft haben, können Sie die alten Dateien mit folgendem Befehl entfernen:"
echo ""
echo "  git status -u | grep -v 'neue Datei' | grep -v '##' | grep -v docs/ | awk '{print \$2}' | xargs git rm -r"
echo ""
echo "Danach führen Sie einen Git-Commit aus, um die neue Struktur zu speichern."
