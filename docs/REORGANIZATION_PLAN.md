# ASRA Projekt-Reorganisation: Funktionale Aufteilung

> Datum: 10. Juni 2025
> Branch: feature/project-reorganization

## Zielvision: Funktionale Aufteilung

```
asra/
├── frontend/        # Frontend-Code
├── backend/         # Backend-Services (API, Datenverarbeitung)
├── search-engines/  # Suchmaschinen (Solr, Qdrant, Hybrid)
└── infrastructure/  # Docker, Konfiguration, Deployment
```

## Vorteile dieser Struktur

- **Verbesserte Übersichtlichkeit**: Klare Trennung nach funktionalen Bereichen
- **Bessere Wartbarkeit**: Separierte Codebases mit definierten Verantwortlichkeiten
- **Einfachere Onboarding-Erfahrung**: Neue Entwickler können sich auf einen Bereich konzentrieren
- **Flexiblere Entwicklung**: Module können unabhängig voneinander weiterentwickelt werden
- **Skalierbarkeit**: Einfachere horizontale Skalierung einzelner Komponenten

## Migrationsplan

### Schritt 1: Verzeichnisstruktur etablieren

- Hauptverzeichnisse anlegen
- Dokumentationsdateien in entsprechende Unterverzeichnisse verschieben
- Grundlegende README-Dateien für jedes Modul erstellen

### Schritt 2: Frontend-Migration

- Verschieben des gesamten Frontend-Codes in `/frontend`
  - src/
  - public/
  - index.html
  - vite.config.js
  - package.json (angepasst)
  - Frontend-bezogene Konfigurationsdateien

### Schritt 3: Backend-Migration

- Verschieben des API-Servers in `/backend`
  - api/
  - Erstellen einer dedizierten package.json

### Schritt 4: Suchmaschinen-Migration

- Verschieben der Such-Module in `/search-engines`
  - docker/qdrant/
  - docker/solr/
  - Reorganisation der Python-Skripte
  - Anpassung der relativen Pfade in den Skripten

### Schritt 5: Infrastruktur-Migration

- Verschieben der Docker-Konfiguration und Deployment-Skripte in `/infrastructure`
  - docker-compose-*.yml
  - Dockerfiles
  - Deployment-Skripte
  - Nginx-Konfigurationen

### Schritt 6: Root-Level Anpassungen

- Anpassen der Root-Level Skripte für das Starten der verschiedenen Dienste
- Aktualisieren der Haupt-README.md
- Aktualisieren von PLANNING.md und TASK.md

### Schritt 7: Integration und Tests

- Überprüfen aller relativen Pfade und Importe
- Testen der Gesamtfunktionalität
- Beheben von Integrationsproblemen

## Detaillierte Datei-Migration

Die folgende Tabelle zeigt die exakten Verschiebungsoperationen für jede relevante Datei:

| Aktuelle Position | Neue Position |
|-------------------|---------------|
| `/src/` | `/frontend/src/` |
| `/public/` | `/frontend/public/` |
| `/index.html` | `/frontend/index.html` |
| `/vite.config.js` | `/frontend/vite.config.js` |
| `/package.json` | `/frontend/package.json` (mit Frontend-spezifischen Abhängigkeiten) |
| `/postcss.config.js` | `/frontend/postcss.config.js` |
| `/tailwind.config.js` | `/frontend/tailwind.config.js` |
| `/api/` | `/backend/api/` |
| `/api/server.js` | `/backend/api/server.js` |
| `/api/routes/` | `/backend/api/routes/` |
| `/api/package.json` | `/backend/package.json` (konsolidiert) |
| `/docker/qdrant/` | `/search-engines/qdrant/` |
| `/docker/solr/` | `/search-engines/solr/` |
| `/docker-compose-hybrid.yml` | `/infrastructure/docker-compose-hybrid.yml` |
| `/docker-compose.yml` | `/infrastructure/docker-compose.yml` |
| `/Dockerfile` | `/infrastructure/Dockerfile.frontend` |
| `/Dockerfile.api` | `/infrastructure/Dockerfile.api` |
| `/deploy.sh` | `/infrastructure/deploy.sh` |
| `/start_app.sh` | `/infrastructure/scripts/start_app.sh` |
| `/start_hybrid_docker.sh` | `/infrastructure/scripts/start_hybrid_docker.sh` |
| `/start_hybrid.sh` | `/infrastructure/scripts/start_hybrid.sh` |
| `/docs/` | `/docs/` (bleibt auf Root-Level) |
| `/CHANGELOG.md` | `/CHANGELOG.md` (bleibt auf Root-Level) |
| `/README.md` | `/README.md` (aktualisiert mit neuer Struktur) |
| `/PLANNING.md` | `/PLANNING.md` (aktualisiert mit neuer Struktur) |
| `/TASK.md` | `/TASK.md` (aktualisiert mit neuer Struktur) |

## Änderungen an Import-Pfaden

Bei dieser Umstrukturierung müssen die Import-Pfade in verschiedenen Dateien angepasst werden:

1. **Frontend-Importe**: 
   - Alle relativen Importe im Frontend-Code bleiben größtenteils gleich
   - API-Endpunktpfade müssen möglicherweise angepasst werden

2. **Backend-Importe**:
   - Pfade zu gemeinsamen Utilities könnten sich ändern
   - Anpassung der Umgebungsvariablen für API-Endpunkte

3. **Suchmaschinenskripte**:
   - Pfade zu Datendateien und Konfigurationen müssen aktualisiert werden
   - Relative Pfade in Python-Skripten müssen angepasst werden

## Docker-Konfigurationsanpassungen

Die Docker-Konfigurationen müssen aktualisiert werden, um die neue Verzeichnisstruktur zu berücksichtigen:

1. **Volume-Mounts**: Pfade für Volume-Mounts in docker-compose.yml Dateien aktualisieren
2. **Build-Kontexte**: Pfade zu Dockerfiles und Build-Kontexte anpassen
3. **Umgebungsvariablen**: Pfade in Umgebungsvariablen aktualisieren

## Root-Level Convenience-Scripts

Im Root-Verzeichnis sollten einfache Skripte beibehalten werden, die als Wrapper für die Scripts in den Unterverzeichnissen dienen, um die Benutzerfreundlichkeit zu gewährleisten.
