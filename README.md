# ASRA - Apache Solr Research Application

ASRA ist eine moderne Webapplikation für die Dokumentensuche, die Apache Solr als Suchbackend verwendet. Die Anwendung bietet eine benutzerfreundliche Oberfläche, um mit einem Solr-Index zu interagieren und Dokumente effizient zu durchsuchen.

## Funktionen

- **Echtzeit-Suche**: Schnelle Dokumentensuche mit sofortigen Ergebnissen
- **Benutzerfreundliche Oberfläche**: Modernes, responsives UI mit React und Tailwind CSS
- **Fehlerbehandlung**: Robuste Fehlerbehandlung und Ladezustände für eine bessere Benutzererfahrung
- **Solr-Integration**: Nahtlose Integration mit Apache Solr über REST-API
- **Docker-Integration**: Einfache Einrichtung mit Docker-Container für Solr

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

3. Starte den Solr-Server mit Docker:
   ```bash
   ./start_solr.sh
   ```

4. Starte die Entwicklungsumgebung:
   ```bash
   npm run dev
   ```

5. Öffne im Browser: http://localhost:5173

## Konfiguration

### Solr-Konfiguration

Die Solr-Konfiguration befindet sich im Verzeichnis `docker/solr/configsets/documents/conf/`:

- `schema.xml`: Definiert die Feldstruktur und Indexierungsoptionen
- `solrconfig.xml`: Enthält die Solr-Kernkonfiguration
- `stopwords.txt`: Enthält Stoppwörter für die Textanalyse

### Frontend-Konfiguration

- Der Solr-Endpunkt kann in der Datei `src/services/solrService.js` konfiguriert werden
- Anpassungen des Erscheinungsbilds können in `tailwind.config.js` vorgenommen werden

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

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.
