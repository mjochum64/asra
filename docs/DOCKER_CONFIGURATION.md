# Docker-Konfiguration für ASRA

Datum: 10. Juni 2025  
Status: **Aktiv**

## Übersicht

Diese Dokumentation beschreibt die Docker-basierte Architektur des ASRA-Projekts und enthält wichtige Informationen zur Konfiguration, Fehlerbehebung und Best Practices für die Containerisierung des Systems.

## Container-Übersicht

Das ASRA-Projekt besteht aus folgenden Docker-Containern:

1. **Frontend-Container**
   - Basiert auf Node.js
   - Dient die React/Vite-Anwendung aus
   - Port-Mapping: 3000:3000

2. **Backend API-Container**
   - Node.js-basiert
   - Stellt REST-Endpunkte für Frontend-Anfragen bereit
   - Port-Mapping: 3001:3001

3. **Solr-Container**
   - Apache Solr Suchmaschine
   - Indiziert Rechtsdokumente 
   - Port-Mapping: 8983:8983

4. **Qdrant-Container**
   - Vektordatenbank für semantische Suche
   - Speichert Dokumentenvektoren
   - Port-Mapping: 6333:6333

5. **Ollama-Container**
   - Lokales LLM für semantische Vektorisierung
   - Port-Mapping: 11434:11434

## Bekannte Probleme und Lösungen

### Ollama Health-Check Problem

**Problem**: Der Ollama-Container wird als "unhealthy" markiert, obwohl der Service funktionsfähig ist.

**Ursache**: Im Standard-Ollama-Image fehlt das Paket `curl`, welches für den Health-Check benötigt wird.

**Lösung**: Installation von `curl` im Ollama-Container:

```bash
# Verbindung zum laufenden Ollama-Container herstellen
docker exec -it asra_ollama /bin/bash

# curl installieren
apt-get update && apt-get install -y curl

# Container verlassen
exit
```

Alternativ kann ein angepasstes Dockerfile erstellt werden, das `curl` bereits enthält:

```dockerfile
FROM ollama/ollama:latest
RUN apt-get update && apt-get install -y curl
```

**Hinweis**: Nach der Installation von `curl` sollte der Container-Status auf "healthy" wechseln, sobald der nächste Health-Check ausgeführt wird.

## Best Practices

1. **Container-Neustart vermeiden**
   - Bei Änderungen in der Konfiguration sollten Container wenn möglich nicht gestoppt und neu gestartet werden
   - Beispiel: Bei Änderungen an Solr-Konfigurationen kann der Reload-Endpunkt verwendet werden

2. **Volume-Verwendung**
   - Wichtige Daten werden mit Docker-Volumes persistiert
   - Solr-Daten: `/var/solr/data`
   - Qdrant-Daten: `/qdrant/storage`

3. **Logging**
   - Container-Logs können mit `docker logs asra_container_name` eingesehen werden
   - Log-Level können in den entsprechenden Container-Konfigurationen angepasst werden

## Skript-Integration

Alle Skripte im `scripts/`-Verzeichnis sind für die Verwendung mit der Docker-Umgebung optimiert und greifen über die exponierten Ports auf die Services zu:

- Solr: `http://localhost:8983`
- Qdrant: `http://localhost:6333`
- Ollama: `http://localhost:11434`

Die Docker-Konfigurationsdateien befinden sich alle im `/infrastructure`-Verzeichnis:

- `docker-compose.yml` - Hauptkonfiguration
- `docker-compose-hybrid.yml` - Konfiguration für das hybride Suchsystem
- `Dockerfile` - Frontend-Container
- `Dockerfile.api` - API-Container
- `Dockerfile.ollama` - Angepasster Ollama-Container mit curl

## Nächste Schritte

1. **Einheitliches Logging-System**: Implementierung eines zentralisierten Logging-Systems für alle Container
2. **Automatisierte Health-Checks**: Erweiterung der Health-Checks um spezifischere Funktionalitätstests
3. **CI/CD-Integration**: Automatisierte Build- und Deploy-Prozesse für Docker-Images
