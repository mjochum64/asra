# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantischer Versionierung](https://semver.org/lang/de/).

## [Unreleased]

### Geplant
- Erweiterte Suchfilter
- Facettennavigation
- Paginierung für größere Ergebnismengen
- Suchvorschläge während der Eingabe

## [0.2.1] - 2025-05-18

### Behoben
- Fehler in der Solr-Service-Konfiguration behoben, der die Umgebungserkennung in Vite betraf
- Korrekten Pfad zum Solr-Core implementiert (`documents/select`)
- Umgebungserkennung von `process.env.NODE_ENV` auf `import.meta.env.MODE` umgestellt, um korrekte Funktion in Vite zu gewährleisten

## [0.2.1] - 2025-05-18

### Behoben
- Fehler in der Solr-Service-Konfiguration behoben, der die Umgebungserkennung in Vite betraf
- Korrekten Pfad zum Solr-Core implementiert (`documents/select`)
- Umgebungserkennung von `process.env.NODE_ENV` auf `import.meta.env.MODE` umgestellt, um korrekte Funktion in Vite zu gewährleisten

## [0.2.0] - 2025-05-18

### Hinzugefügt
- Docker-Container für Frontend mit Nginx
- Reverse-Proxy-Konfiguration zur Vermeidung von CORS-Problemen
- Deployment-Skript für Produktionsumgebungen (`deploy.sh`)
- Umbenanntes Start-Skript zu `start_app.sh` (ehemals `start_solr.sh`)
- Konfigurierbare Solr-URL über Umgebungsvariablen
- Dynamische Basis-URL-Konfiguration je nach Umgebung
- CHANGELOG.md für Versionsverfolgung
- .gitignore-Datei für sauberes Projektmanagement

### Geändert
- Docker-Compose-Konfiguration für beide Container (Solr und Frontend)
- README.md mit aktualisierten Installationsanweisungen
- Aktualisierte Entwicklungsanweisungen für Docker und lokale Entwicklung
- Solr-Service verwendet jetzt relativen Pfad im Produktionsmodus

### Behoben
- CORS-Probleme durch Verwendung eines Nginx-Reverse-Proxy
- Verbindungsprobleme bei langsamen Netzwerken durch angepasste Timeout-Einstellungen
- Hardcodierte Solr-URL ersetzt durch konfigurierbare Umgebungsvariable

## [0.1.0] - 2025-05-01

### Hinzugefügt
- Initiale Projektstruktur mit React und Vite
- Grundlegende Suchfunktionalität
- Integration mit Apache Solr
- Solr-Schema für Dokumentenindexierung
- Docker-Container für Solr
- Beispieldaten-Loader für Solr
- Responsive UI mit Tailwind CSS
- Fehlerbehandlung und Ladezustände für bessere UX
