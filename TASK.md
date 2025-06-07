# Project Tasks: ASRA (Apache Solr Research Application)

## 1. Core Application Setup (Abgeschlossen)

- [x] Erstellen des grundlegenden React-Projekts mit Vite
- [x] Konfigurieren von Tailwind CSS für Styling
- [x] Einrichten der Projektordnerstruktur
- [x] Implementieren des React-Komponenten-Basissystems

## 2. Solr-Integration (Abgeschlossen)

- [x] Docker-Compose-Konfiguration für Solr
- [x] Solr-Schema-Definition für Dokumentenindexierung
- [x] REST API-Verbindung von Frontend zu Solr
- [x] Start-Skript für Solr mit automatischer Datenladung

## 3. Suchfunktionalität (Abgeschlossen)

- [x] Implementierung der Suchleiste
- [x] Implementierung der Ergebnisanzeige
- [x] Verarbeitung von Suchanfragen an Solr
- [x] Fehlerbehandlung und Ladezustände

## 4. Docker-Integration und Deployment (Abgeschlossen)

- [x] Frontend als Docker-Container konfigurieren
- [x] Nginx als Reverse-Proxy für Solr einrichten
- [x] Docker-Compose-Setup für die gesamte Anwendung
- [x] Deployment-Skripte für Entwicklung und Produktion
- [x] Konfigurierbare Solr-URL für verschiedene Umgebungen
- [x] Korrektur der Umgebungserkennung für Vite-Anwendungen (`import.meta.env.MODE`)
- [x] Implementierung des korrekten Pfads zum Solr-Core (`documents/select`)

## 5. UI/UX-Verbesserungen (Abgeschlossen)

- [x] Modernisierung des UI-Designs implementiert (18.05.2025)
- [x] Responsives Layout mit Sidebar für Filter erstellt (18.05.2025)
- [x] Paginierung für größere Ergebnismengen (18.05.2025)
- [x] Verbesserte Ergebnisdarstellung mit Hervorhebungen (18.05.2025)
- [x] Einfache Suchfilter (Suche nach Titel/Inhalt) implementiert (18.05.2025)
- [x] Entwickler-Modus mit Mock-Daten für einfacheres Testen (18.05.2025)
- [x] CORS-Problem im Entwicklungsmodus durch Proxy gelöst (18.05.2025)
- [x] Grundlegende Filter-UI in Sidebar implementiert (18.05.2025)

## 6. Code-Splitting und Performance (Abgeschlossen)

- [x] React.lazy Import für ResultsDisplay-Komponente implementiert (07.06.2025)
- [x] Suspense-Wrapper mit Fallback-UI hinzugefügt (07.06.2025)
- [x] Bundle-Größe-Optimierung durch dynamisches Laden (07.06.2025)

## 7. Erweiterte Suchfunktionalitäten (In Bearbeitung - Phase 1)

### 7.1 Facetten-Filter (✅ VOLLSTÄNDIG ABGESCHLOSSEN - 07.06.2025)
- [x] Dynamische Facetten aus Solr-Daten abrufen (mit Mock-Fallback)
- [x] Kategorie-Filter in Sidebar implementiert
- [x] Autor-Filter mit Zählern hinzugefügt
- [x] Filter-State-Management zwischen Suchanfragen
- [x] Filter-Bug behoben: Race-Condition zwischen State-Updates und Suchfunktion gelöst (07.06.2025)
- [x] Filter funktionieren jetzt sofort nach Auswahl ohne manuellen Suchklick (07.06.2025)
- [x] Solr DisMax Query Integration für bessere Volltextsuche (07.06.2025)
- [x] Solr Array-Feld-Normalisierung implementiert (07.06.2025)
- [x] Kategorie-Mapping von Englisch (Solr) zu Deutsch (UI) implementiert (07.06.2025)
- [x] Code-Bereinigung: Debug-Logs entfernt (07.06.2025)
- [x] **KRITISCHE PROBLEME BEHOBEN (07.06.2025)**:
  - [x] Dynamische, kontextuelle Filter statt statische Filter-Anzeige
  - [x] Content-Highlighting funktioniert korrekt
  - [x] Autor-Filter verschwinden nicht mehr
  - [x] Einheitliche Suchsyntax zwischen Hauptsuche und Facetten
- [x] **ARCHITEKTUR-ÜBERARBEITUNG (07.06.2025)**:
  - [x] Kontextuelle Facetten-Funktion `getContextualFacets()` implementiert
  - [x] Unified Search Response mit `{results, facets, total}` Struktur
  - [x] Komponentenarchitektur auf Props-basierte Facetten umgestellt
- [ ] Datum-Range-Filter implementieren (→ Sprint 3)

### 7.2 Deutsche Rechtsabkürzungen-Suche (✅ VOLLSTÄNDIG ABGESCHLOSSEN - 08.06.2025)
- [x] **KRITISCHES PROBLEM BEHOBEN**: Operator-Präzedenz-Fehler bei deutschen Rechtsabkürzungen mit Leerzeichen
- [x] Queries wie "1. BImSchV" generieren jetzt korrekte Solr-Syntax mit Klammern: `(amtabk:"1. BImSchV" OR (amtabk:*1* AND amtabk:*BImSchV*))`
- [x] URL-Kodierungsproblem bei axios-Requests gelöst
- [x] `buildGermanLegalQuery()` Helper-Funktion für konsistente Abfrageerstellung implementiert
- [x] Amtliche Abkürzungen (amtabk) und Juristische Abkürzungen (jurabk) funktionieren korrekt
- [x] 400 Bad Request Fehler bei Leerzeichen in Abkürzungen behoben
- [x] Minimale URL-Kodierung implementiert: nur Leerzeichen werden kodiert, Solr-Syntax bleibt intakt

### 7.3 Konfigurierbare UI-Struktur (🚀 NEUE PRIORITÄT - 08.06.2025) ✅ VOLLSTÄNDIG ABGESCHLOSSEN
- [x] **PROBLEM**: Aktuelle dynamische Schema-Generierung ist zu komplex für normale Benutzer (37+ Suchfelder)
- [x] **LÖSUNG**: Strukturierte UI-Konfigurationsdatei mit drei Bereichen:
  - [x] **SUCHE**: Reduzierte, benutzerfreundliche Suchfelder mit Beschreibungen
  - [x] **TREFFERLISTE**: Konfigurierbare Anzeige relevanter Felder mit Highlighting-Optionen
  - [x] **VOLLTEXT**: Strukturierte Dokumentenansicht mit Header, Content und Sidebar
- [x] **UI-Modi implementieren**:
  - [x] Normal-Modus: Vereinfachte Suche für allgemeine Benutzer
  - [x] Experten-Modus: Vollzugriff auf alle Solr-Felder (wie aktuell)
- [x] **uiConfig.js erstellt** ✅ - Konfigurationsdatei mit strukturierter Definition aller UI-Bereiche
- [x] **Komponenten-Integration**:
  - [x] DynamicSearchBar: UI-Konfiguration für Suchfelder verwenden ✅ (08.06.2025)
  - [x] DynamicResultsDisplay: Konfigurierbare Ergebnis-Anzeige implementieren ✅ (08.06.2025)
  - [x] DynamicSidebar: UI-konfigurierte Filter mit Modus-Unterstützung ✅ (08.06.2025)
  - [x] Neue Komponente: DocumentFullView für Volltext-Ansicht ✅ (bereits vorhanden)
- [x] **Mode-Switcher**: Toggle zwischen Normal- und Expertensuche ✅ (08.06.2025)
- [x] **Formatierungs-Helper**: Feldwerte nach Konfiguration formatieren (Datum, Sprache, etc.) ✅ (08.06.2025)

**🎉 IMPLEMENTIERUNG VOLLSTÄNDIG**: Die konfigurierbare UI-Struktur ist erfolgreich implementiert!
- **Normal-Modus**: Zeigt nur 5 benutzerfreundliche Suchfelder + 3 primäre Filter
- **Experten-Modus**: Bietet Vollzugriff auf alle Solr-Felder + erweiterte Filter
- **Alle Komponenten** verwenden jetzt die zentrale UI-Konfiguration aus `uiConfig.js`
- **Mode-Switcher** ermöglicht einfachen Toggle zwischen den Modi
- **Icons und Labels** verbessern die Benutzerfreundlichkeit erheblich

### 7.4 Erweiterte Suchoptionen
- [ ] Auto-Suggest / Autocomplete-Funktionalität
- [ ] Erweiterte Sortieroptionen (Relevanz, Datum, Titel)
- [ ] Wildcards und Boolean-Operatoren in Suche
- [ ] Suchhistorie und gespeicherte Suchen

### 7.5 Dokumentvorschau und -interaktion
- [x] Highlight-Funktion für Suchbegriffe im Volltext (✅ ABGESCHLOSSEN - 07.06.2025)
- [ ] Modal für Dokumentvorschau implementieren
- [ ] Dokumenten-Download-Funktionalität
- [ ] Related Documents Feature

## 8. Zukünftige Features (Nach Phase 1)

- [ ] Benutzerverwaltung und Authentifizierung
- [ ] Gespeicherte Suchanfragen für angemeldete Benutzer
- [ ] Exportmöglichkeiten (PDF, CSV)
- [ ] Erweiterte Suchstatistiken und -analytik
- [ ] Webcrawler für Gesetze-im-Internet.de Integration

## 9. Dokumentation und Tests (Teilweise abgeschlossen)

- [x] Aktualisierung von `README.md` mit:
  - [x] Projektübersicht
  - [x] Installationsanleitung
  - [x] Technologie-Stack-Details
  - [x] Docker-Deployment-Anweisungen
- [x] Dokumentation der Solr-Konfiguration
- [x] Einführung von CHANGELOG.md für Versionierung
- [ ] Inline-Code-Dokumentation für alle Module und Funktionen
- [ ] Einheit- und Integrationstests für:
  - [ ] React-Komponenten
  - [ ] Solr-Service-Funktionen
  - [ ] End-to-End-Suchfluss

## 10. DevOps und Bereitstellung (Teilweise abgeschlossen)

- [x] Produktions-Deployment mit Docker Compose
- [x] Nginx-Konfiguration für Frontend und Proxy
- [ ] CI/CD-Pipeline für automatisierte Builds
- [ ] Monitoring und Logging-Setup
- [ ] Leistungsoptimierung für größere Datenmengen

## 11. Systemverbesserungen (Geplant)

- [x] Refactoring der API-Service-Schicht für konfigurierbare Endpunkte
- [x] Implementierung von umgebungsspezifischen Konfigurationen
- [ ] Fehlerberichterstattung und Telemetrie
- [ ] Internationalisierungsunterstützung
- [ ] Erweiterte Sicherheitskonfiguration (HTTPS, CSP)

## Entdeckt während der Arbeit

- [x] Verbindungsprobleme bei langsamen Netzwerken erfordern verbesserte Timeout-Behandlung (18.05.2025) - Gelöst durch konfigurierbare Timeouts in Nginx
- [x] Bedarf an einer konfigurierbaren Solr-URL für verschiedene Umgebungen (18.05.2025) - Implementiert mit Umgebungsvariablen
- [x] Fehler in der Umgebungserkennung von Vite und im Solr-Core-Pfad (18.05.2025) - Gelöst durch Anpassung von solrService.js
- [x] CORS-Probleme im Entwicklungsmodus (18.05.2025) - Gelöst durch Einrichtung eines Proxys in der Vite-Konfiguration
- [x] (HOCH) Optimierung der Ladezeiten durch Implementierung von Code-Splitting erforderlich (18.05.2025) - **Abgeschlossen (07.06.2025)**
- [ ] (HOCH) Bessere Fehlerbehandlung für Netzwerkprobleme einbauen (18.05.2025)
- [ ] (MITTEL) Solr-Schema-Aktualisierungen ohne Container-Neustart ermöglichen (18.05.2025)
- [x] (MITTEL) Integration der Sidebar-Filter mit Solr-Facetten für dynamische Filterung (19.05.2025) - **✅ VOLLSTÄNDIG ABGESCHLOSSEN (07.06.2025)**
- [ ] (NIEDRIG) Möglichkeit zum Exportieren von Suchergebnissen als CSV oder JSON (19.05.2025)
- [ ] (NIEDRIG) Implementierung eines Theme-Wechslers für hellen/dunklen Modus (19.05.2025)

## Aktuelle Sprint-Planung (Juni 2025)

### Sprint 1: Facetten-Filter (KW 23-24) - ✅ VOLLSTÄNDIG ABGESCHLOSSEN
**Ziel**: Dynamische Filter-Funktionalität mit Solr-Integration

**Alle Prioritäten erfolgreich abgeschlossen**:
- [x] Solr-Facetten-API-Endpunkt implementiert
- [x] Kategorie-Filter in Sidebar mit echten Daten
- [x] Autor-Filter mit Dokumentzählern
- [x] Filter-State-Management für Suchanfragen
- [x] Filter-Race-Condition-Bug behoben
- [x] Solr DisMax Query Integration
- [x] Array-Feld-Normalisierung für Solr-Antworten
- [x] Multi-Filter-Kombinationen
- [x] **KRITISCHE BUGFIXES**: Kontextuelle Filter, Content-Highlighting, Filter-Persistenz
- [x] **ARCHITEKTUR-VERBESSERUNG**: Unified Search Response, Props-basierte Facetten

**Sprint-Ergebnis**: Vollständig funktionsfähige dynamische Facetten mit kontextueller Filterung

### 7.4 Deutsche Rechtsdokument-Unterstützung (✅ VOLLSTÄNDIG ABGESCHLOSSEN - 12.01.2025)
- [x] **Problem-Diagnose**: Deutsche Rechtsdokumente wurden bei spezifischen Suchen nicht gefunden (nur bei *:* Wildcard)
- [x] **Schema-Analyse**: Deutsche Rechtsdokument-Felder identifiziert:
  - `kurzue`, `langue`, `text_content`: `text_de` (deutsche Textanalyse)
  - `amtabk`, `jurabk`: `string` (exakte Strings)
- [x] **Schema-Service erweitert** (`schemaService.js`):
  - `analyzeSchemaForUI()` erkennt `text_de` und `text_de_exact` Feldtypen
  - `getDisplayFields()` priorisiert deutsche Rechtsdokument-Felder
  - `getContextualFacets()` verwendet deutsche Felder in expliziter OR-Query
- [x] **Solr-Service angepasst** (`solrService.js`):
  - Explizite OR-Query für kombinierte Text- und String-Feld-Suche
  - Text-Felder: `kurzue:(query) OR langue:(query) OR text_content:(query)`
  - String-Felder: `amtabk:*query* OR jurabk:*query*`
  - Highlighting-Felder um deutsche Felder erweitert
- [x] **URL-Kodierungsprobleme behoben**: 400 Bad Request Fehler durch korrekte `encodeURIComponent()` Verwendung
- [x] **Query-Syntax optimiert**: Von DisMax/eDisMax zu expliziter OR-Query für bessere String-Feld-Kontrolle
- [x] **Erfolgreiche Suche**: Suche nach "BImSchV" und anderen deutschen Rechtsbegriffen funktioniert vollständig
- [x] **Feldspezifische Wildcard-Unterstützung**: String-Felder (`amtabk`, `jurabk`) verwenden Wildcard-Matching

**Ergebnis**: Deutsche Rechtsdokument-Suche vollständig funktionsfähig mit korrekter Feldpriorisierung und Wildcard-Unterstützung

### 7.5 Deutsche Rechtsdokument-Abkürzungen Fix (✅ VOLLSTÄNDIG ABGESCHLOSSEN - 12.01.2025)
- [x] **Problem identifiziert**: Komplette deutsche Rechtsabkürzungen wie "1. BImSchV" lieferten keine Suchergebnisse
- [x] **Filter-Problem diagnostiziert**: Filter funktionierten nur im "Alle Felder" Modus, nicht bei feldspezifischen Suchen
- [x] **Root-Cause-Analyse**: Wildcard-Queries mit Leerzeichen (`amtabk:*1. BImSchV*`) scheitern in Solr String-Feldern
- [x] **Solr-Query-Tests**: Validierung verschiedener Query-Muster:
  - `amtabk:"1. BImSchV"` (exakt) ✅
  - `amtabk:*BImSchV*` (einfach) ✅
  - `amtabk:*1.*` (einfach) ✅ 
  - `amtabk:*1. BImSchV*` (mit Leerzeichen) ❌
  - `amtabk:*1.* AND amtabk:*BImSchV*` (compound AND) ✅
- [x] **Helper-Funktion implementiert**: `buildGermanLegalQuery()` in beiden Services:
  - Erkennt Leerzeichen in Queries automatisch
  - Splittet Queries mit Leerzeichen in compound AND-Patterns
  - Unterstützt sowohl exakte Matches als auch Wildcard-Varianten
- [x] **SolrService aktualisiert**: 
  - Feldspezifische Suchen für `amtabk` und `jurabk` verwenden compound queries
  - Allgemeine Suche nutzt Helper-Funktion für deutsche Rechtsfelder
  - Kombiniert exakte und Wildcard-Ansätze: `exact OR wildcard`
- [x] **SchemaService aktualisiert**:
  - Gleiche Helper-Funktion für Konsistenz implementiert
  - `getContextualFacets()` nutzt Helper-Funktion für deutsche Rechtsfelder
- [x] **UI-Tests erfolgreich**: Web-Interface zeigt korrekte Suchergebnisse für "1. BImSchV"
- [x] **Filter-Funktionalität validiert**: Filter arbeiten korrekt in feldspezifischen Modi

**Query-Pattern-Lösung**: `amtabk:*1.* AND amtabk:*BImSchV*` für Queries mit Leerzeichen
**Ergebnis**: Deutsche Rechtsabkürzungen mit Leerzeichen funktionieren vollständig in allen Suchmodi

### Sprint 2: Auto-Suggest und Sortierung (KW 25-26)
**Ziel**: Verbesserte Benutzererfahrung bei der Suche

**Features**:
- [ ] Autocomplete-Funktionalität basierend auf Solr-Begriffen
- [ ] Erweiterte Sortieroptionen in ResultsDisplay
- [ ] Suchhistorie im LocalStorage
