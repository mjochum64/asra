# Bereinigung nach der Projektreorganisation

Dieses Dokument beschreibt die Schritte zur Bereinigung redundanter Dateien nach der Neustrukturierung des Projekts in die funktionale Struktur.

## Übersicht der durchgeführten Reorganisation

Das Projekt wurde in die folgende funktionale Struktur umorganisiert:

```
asra/
├── frontend/        # Frontend-Code
├── backend/         # Backend-Services (API, Datenverarbeitung)
├── search-engines/  # Suchmaschinen (Solr, Qdrant, Hybrid)
├── infrastructure/  # Docker, Konfiguration, Deployment
├── scripts/         # Convenience-Scripts für den Root-Level
└── docs/            # Projektdokumentation
```

## Angepasste Konfigurationsdateien

Die folgenden Dateien wurden angepasst, um mit der neuen Verzeichnisstruktur zu funktionieren:

1. **Docker-Compose-Konfiguration**
   - Infrastructure/docker-compose-hybrid.yml: Volume-Pfade aktualisiert

2. **Dockerfiles**
   - Infrastructure/Dockerfile: Pfade des Frontend-Codes aktualisiert
   - Infrastructure/Dockerfile.api: Pfade für API und Python-Skripte aktualisiert

3. **Startskripte**
   - start_all.sh: Angepasst für direkten Zugriff auf docker-compose
   - start_frontend.sh und start_backend.sh: Bleiben unverändert

4. **Convenience-Skripte**
   - Neue Skripte in /scripts erstellt als Wrapper für Funktionen in den Unterverzeichnissen

## Laufzeitanpassungen

1. **Umgebungsvariablen**: Bleiben unverändert, da sie innerhalb der Docker-Container definiert sind
2. **Pfadverweise in Code**: Interne Imports in den Modulen bleiben unverändert

## Offene Punkte

1. **CI/CD-Pipeline**: Falls vorhanden, müssen Build-Skripte und Pipeline-Konfigurationen aktualisiert werden
2. **Deployment-Prozess**: Deployment-Skripte müssen möglicherweise an die neue Verzeichnisstruktur angepasst werden

## Ratschläge für zukünftige Entwicklung

1. Die Modularisierung sollte beibehalten werden, mit klaren Schnittstellen zwischen den Komponenten
2. Neue Features sollten in dem entsprechenden Modul implementiert werden
3. Gemeinsame Funktionalität könnte in Zukunft in ein gemeinsames `/shared`-Verzeichnis ausgelagert werden, falls nötig
