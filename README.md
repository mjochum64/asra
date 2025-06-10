# ASRA - Deutsche Gesetze

Eine Suchmaschine und Anzeigeplattform für deutsche Gesetze.

## Projektstruktur

Das Projekt wurde in eine funktionale Struktur reorganisiert:

- `/frontend` - Frontend-Anwendung (React/Vite)
- `/backend` - Backend-Services (Express API)
- `/search-engines` - Suchmaschinen (Solr, Qdrant, Hybrid-Suche)
- `/infrastructure` - Docker-Konfiguration und Deployment-Skripte

## Schnellstart

```bash
# Alle Komponenten starten (mit Docker)
./start_all.sh

# Nur Frontend starten (Entwicklung)
./start_frontend.sh

# Nur Backend starten (Entwicklung)
./start_backend.sh
```


