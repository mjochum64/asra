# ASRA - Apache Solr Research Application

ASRA ist eine moderne Webapplikation für die Dokumentensuche, die Apache Solr als Suchbackend verwendet. Die Anwendung bietet eine benutzerfreundliche Oberfläche, um mit einem Solr-Index zu interagieren und Dokumente effizient zu durchsuchen.

## Funktionen

- **Echtzeit-Suche**: Schnelle Dokumentensuche mit sofortigen Ergebnissen
- **Benutzerfreundliche Oberfläche**: Modernes, responsives UI mit React und Tailwind CSS
- **Fehlerbehandlung**: Robuste Fehlerbehandlung und Ladezustände für eine bessere Benutzererfahrung
- **Solr-Integration**: Nahtlose Integration mit Apache Solr über REST-API
- **Docker-Integration**: Vollständige Containerisierung mit Docker Compose für Frontend und Solr-Backend
- **CORS-freie Architektur**: Vermeidung von Cross-Origin-Problemen durch integrierte Reverse-Proxy-Konfiguration

## Installation

### Voraussetzungen

- Node.js (v14 oder höher)
- npm oder yarn
- Docker und Docker Compose
- Internetverbindung für den Zugriff auf Fonts und Abhängigkeiten

### Schritte zur Installation

1. Klone das Repository:
   
   ```bash
   git clone https://github.com/username/asra.git
   cd asra
   ```

2. Installiere die Abhängigkeiten:
   
   ```bash
   npm install
   ```

3. Starte die Anwendung mit Docker Compose:
   
   ```bash
   ./start_app.sh
   ```

4. Öffne im Browser:
   - Frontend: http://localhost:8080
   - Solr Admin UI: http://localhost:8983/solr/

### Entwicklungsmodus starten

Um die App im Entwicklungsmodus zu starten (mit Hot-Reloading):

```bash
# Starte Solr im Hintergrund
./start_app.sh

# Starte den Vite-Entwicklungsserver in einem anderen Terminal
npm run dev
```

Dann öffne im Browser: http://localhost:5173

## Konfiguration

### Solr-Konfiguration

Die Solr-Konfiguration befindet sich im Verzeichnis `docker/solr/configsets/documents/conf/`:

- `schema.xml`: Definiert die Feldstruktur und Indexierungsoptionen
- `solrconfig.xml`: Enthält die Solr-Kernkonfiguration
- `stopwords.txt`: Enthält Stoppwörter für die Textanalyse

### Frontend-Konfiguration

- Der Solr-Endpunkt wird automatisch konfiguriert:
  - Im Produktionsmodus (Docker): Verwendet einen relativen Pfad `/solr/` um CORS-Probleme zu vermeiden
  - Im Entwicklungsmodus: Verwendet die in `.env` definierte URL oder Standard-URL `http://localhost:8983/solr/`
- Die Umgebungserkennung erfolgt über `import.meta.env.MODE`, was für Vite-Anwendungen der korrekte Weg ist
- Der Solr-Core (`documents`) ist im API-Pfad enthalten, um korrekte Anfragen zu gewährleisten
- Anpassungen des Erscheinungsbilds können in `tailwind.config.js` vorgenommen werden

### Umgebungsvariablen

Die Anwendung verwendet die folgenden Umgebungsvariablen, die in einer `.env`-Datei konfiguriert werden können:

- `VITE_SOLR_URL`: URL zum Solr-Server (nur für Entwicklung, Standard: `http://localhost:8983/solr/`)

## Deployment

### Mit Docker Compose (empfohlen)

Die empfohlene Methode ist die Verwendung von Docker Compose, das sowohl das Frontend als auch Solr startet:

```bash
# Für Entwicklung und Test
./start_app.sh

# Für Produktionsumgebungen
./deploy.sh
```

### Manuelle Installation

Für eine manuelle Installation ohne Docker:

1. Starte einen Solr-Server (Version 9.x) und importiere die Konfiguration
2. Passe die Solr-URL in `.env` an
3. Baue die Frontend-Anwendung: `npm run build`
4. Hoste die gebaute Anwendung (im `dist`-Verzeichnis) mit einem Webserver wie Nginx

## Entwicklung

### Verfügbare Skripte

- `npm run dev`: Startet den Entwicklungsserver mit Hot-Reload
- `npm run build`: Erstellt eine optimierte Produktions-Build
- `npm run preview`: Startet einen lokalen Server für die Vorschau des Builds

### Architektur

Die Anwendung folgt einer modularen Architektur:

- React-Komponenten in `/src/components`
- Dienste für API-Interaktionen in `/src/services`
- Docker-Konfiguration in `/docker`
  - Nginx als Reverse-Proxy und statischer Dateiserver in `/docker/nginx`
  - Solr-Konfiguration in `/docker/solr`

### Docker-Container

Die Anwendung besteht aus zwei Docker-Containern:

1. **solr_server**: Apache Solr-Server mit vorkonfiguriertem Schema
2. **asra_frontend**: Nginx-Server mit der gebauten React-Anwendung und Reverse-Proxy-Konfiguration

## Versionierung

Dieses Projekt verwendet semantische Versionierung (SemVer). Alle Änderungen werden in der [CHANGELOG.md](CHANGELOG.md) dokumentiert.

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.
