# Aufräumplan für ASRA-Skripte

## Ausgangssituation

Wir haben aktuell parallele Skriptstrukturen:

1. **Nicht-Docker-Skripte**: Für lokale Ausführung (direkt auf dem Host)
   - `import_solr_data.sh` 
   - `hybrid_search.sh`
   - `reindex_qdrant.sh`

2. **Docker-Skripte**: Für Ausführung in Docker-Containern
   - `import_solr_data_docker.sh`
   - `hybrid_search_docker.sh`
   - `reindex_qdrant_docker.sh`

## Bereinigungsplan

Da wir nun Docker als Basis-Ausführungsumgebung verwenden, sollten wir:

1. Die Docker-Skripte als primäre Schnittstelle beibehalten
2. Unnötige nicht-Docker-Skripte entfernen
3. README und Dokumentation aktualisieren

## Konkreter Plan

### 1. Umbenennungen (Docker-Skripte werden Standard)

```
import_solr_data_docker.sh → import_solr_data.sh
hybrid_search_docker.sh → hybrid_search.sh
reindex_qdrant_docker.sh → reindex_qdrant.sh
```

### 2. Entfernen der alten nicht-Docker-Skripte

```
import_solr_data.sh.old (vorher: import_solr_data.sh)
hybrid_search.sh.old (vorher: hybrid_search.sh) 
reindex_qdrant.sh.old (vorher: reindex_qdrant.sh)
```

### 3. Aktualisieren der README und Dokumentation

- Aktualisieren der Anleitung in README.md
- Hinzufügen von Informationen über Docker-Verwendung
