# ASRA - Deutsche Gesetze

Eine Suchmaschine und Anzeigeplattform für deutsche Gesetze mit Hybrid-Suche (Volltext und semantisch).

## Projektstruktur

Das Projekt wurde in eine funktionale Struktur reorganisiert:

- `/frontend` - Frontend-Anwendung (React/Vite)
- `/backend` - Backend-Services (Express API)
- `/search-engines` - Suchmaschinen (Solr, Qdrant, Hybrid-Suche)
- `/infrastructure` - Docker-Konfiguration und Deployment-Skripte
- `/scripts` - Convenience-Skripte für häufige Operationen
- `/docs` - Projektdokumentation

## Schnellstart

```bash
# Alle Komponenten starten (mit Docker)
./start_all.sh

# Nur Frontend starten (Entwicklung)
./start_frontend.sh

# Nur Backend starten (Entwicklung)
./start_backend.sh

# Verfügbare Skripte
./scripts/reindex_qdrant.sh     # Dokumente in Qdrant neu indexieren
./scripts/hybrid_search.sh      # Hybrid-Suche in der Kommandozeile
./scripts/import_solr_data.sh   # Demo-Daten in Solr importieren
./scripts/reset_solr_data.sh    # Alle Dokumente aus Solr löschen (Vor Neuimport)
./scripts/reset_qdrant_data.sh  # Alle Kollektionen aus Qdrant löschen (Vor Neuindexierung)

# Hinweis: Die Skripte sind für die Verwendung mit Docker konfiguriert.
# Die Docker-Konfiguration wurde optimiert und befindet sich im /infrastructure-Verzeichnis.
# Weitere Informationen finden Sie in /docs/DOCKER_CONFIGURATION.md
```


