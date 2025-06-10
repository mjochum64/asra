# Project Tasks: ASRA – Deutsche Gesetze

## 🎯 Projektstatuts: Phase 1.1 VOLLSTÄNDIG ABGESCHLOSSEN ✅
**Stand**: 10. Juni 2025
**Version**: 1.1.3 PRODUCTION READY mit korrigiertem Inhaltsverzeichnis (TableOfContents)
**Status**: DocumentFullView TableOfContents Bugfix abgeschlossen ✅

### 🏆 Erfolgreich abgeschlossene Hauptziele:
- ✅ **Konfigurierbare UI-Struktur**: Normal-Modus (5 Felder) vs. Experten-Modus (alle Felder)
- ✅ **Deutsche Rechtsabkürzungen**: Vollständige Unterstützung ("1. BImSchV", "GG", "BGB")
- ✅ **Dynamische Facetten-Filter**: Kontextuelle Filter basierend auf Suchergebnissen
- ✅ **Content-Highlighting**: Hervorhebung von Suchbegriffen in Volltext
- ✅ **Produktive Docker-Umgebung**: Stabile Container-Architektur
- ✅ **Finale Verifikation**: 11/11 Tests bestanden, 0 kritische Bugs
- ✅ **Repository-Organisation**: Dokumentation aufgeräumt, [`docs/`](docs/) Struktur etabliert
- ✅ **Norm-Level-Indexierung**: Granulare Indexierung einzelner Rechtsnormen mit XHTML-Formatierung
- ✅ **Export-Funktionalität**: PDF/HTML-Export mit korrekter Absatzformatierung und Inhaltsverzeichnis
- ✅ **HTML-Felder-Integration**: Optimale Nutzung der text_content_html Felder für perfekte Formatierung

### 🎯 Neu abgeschlossen: Norm-Level-Indexierung
- ✅ **Granulare Suche**: Suchergebnisse zeigen spezifische Artikel/Paragraphen statt ganzer Gesetze
- ✅ **XHTML-Formatierung erhalten**: Original-Formatierung aus XML-Quellen beibehalten
- ✅ **Norm-spezifische Badges**: Grüne Badges für Artikel-Identifikation (z.B. "Art 70", "§ 1")
- ✅ **Erweiterte Metadaten**: Norm-Typ, Quelle, Norm-Nummer für verbesserte Navigation
- ✅ **Frontend-Integration**: Vollständige Anzeige mit formatierten HTML-Inhalten

### 📊 Norm-Level-Indexierung Erfolgsstatistik:
- **Datentransformation**: 2 Dokumente → 263 individuelle Normen
- **Formatierung**: XHTML-Markup erfolgreich erhalten (`text_content_html`, `fussnoten_content_html`)
- **Granularität**: Suche findet jetzt spezifische Artikel statt ganzer Gesetzbücher
- **UI-Integration**: Norm-Badges, Typ-Anzeige und verbesserte Metadaten implementiert

### 🎯 Neu abgeschlossen: Export-Funktionalität & HTML-Felder-Integration (9. Juni 2025)
- ✅ **PDF-Export-Optimierung**: Korrekte Absatzformatierung mit (1), (2), (3) Nummerierung
- ✅ **HTML-Export**: Saubere HTML-Ausgabe mit erhaltener Originalformatierung
- ✅ **Intelligente Content-Konvertierung**: Bevorzugung von `text_content_html` Feldern vor Fallback
- ✅ **PDF-Navigation**: Detailliertes Inhaltsverzeichnis mit Seitenzahlen für alle PDF-Viewer
- ✅ **Content-Filtering**: Konsistente Filterung redundanter Inhaltsverzeichnisse zwischen allen Ansichten
- ✅ **Meaningful Filenames**: Automatische Generierung aussagekräftiger Dateinamen basierend auf Dokument-IDs
- ✅ **Cross-Platform-Kompatibilität**: Universelle PDF-Navigation ohne proprietäre Features
- ✅ **Import-Pfad-Korrekturen**: Export-Funktionen nach Refactoring vollständig korrigiert
- ✅ **Volltextanzeige-Optimierung**: XHTML-Felder werden bevorzugt für perfekte Formatierung
- ✅ **Dokumenttyp-Unterscheidung**: Korrekte Unterscheidung zwischen Rahmendokument und einzelnen Normen beim Export

### 🎯 Neu abgeschlossen: TableOfContents-Bug behoben (10. Juni 2025)
- ✅ **Inhaltsverzeichnis-Fehler behoben**: TableOfContents wird jetzt zuverlässig bei Volltextansicht angezeigt
- ✅ **Import-Fehler korrigiert**: Konsistente ES6-Modul-Syntax in documentService.js statt gemischter Imports
- ✅ **Defensive Programmierung**: Robuste Null-Checks und Standardwerte für die TableOfContents-Komponente
- ✅ **Service-Modularisierung**: Spezialisierter documentService.js für zentralisierte Dokumenten-Verarbeitung
- ✅ **Fehlerbehandlung verbessert**: Vollständiges Error-Handling in loadDocumentContents-Funktion

### 🚀 Nächste Phase: Sprint 2 (Auto-Suggest & Sortierung)
- [ ] Auto-Suggest/Autocomplete-Funktionalität
- [ ] Erweiterte Sortieroptionen
- [ ] Suchhistorie mit LocalStorage

---

## Phase 2: Hybrid Search Implementation (Qdrant & Ollama)

### Backend Development (Hybrid Search)
- [ ] Implement API endpoint for hybrid search (Solr + Qdrant).
- [ ] Develop logic for optional LLM-based query expansion (Ollama).
- [ ] Implement parallel querying to Solr and Qdrant.
- [ ] Create logic for merging and ranking results from Solr and Qdrant.
- [ ] Develop API endpoint for optional RAG-based answer generation (Ollama).

### Data Pipeline (Qdrant)
- [ ] Develop scripts/processes to generate vector embeddings for legal documents.
- [ ] Implement indexing of embeddings into Qdrant.

### Frontend Development (Hybrid Search)
- [ ] Adapt UI to display combined/RAG results if necessary.
- [ ] Integrate new API endpoints for hybrid search and RAG.

**📋 Detaillierte Aufgabenliste:**

---

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

**🔧 KRITISCHER BUGFIX ABGESCHLOSSEN (08.06.2025)**: Deutsche Rechtsabkürzungssuche repariert
- **Problem**: "1. BImSchV" Suche gab HTTP 400 Fehler wegen URL-Encoding-Problemen
- **Lösung**: Parameter-Serializer in solrService.js für korrekte Phrase-Query-Kodierung implementiert
- **Fixing**: Highlighting-Felder auf existierende Schema-Felder reduziert (entfernte nicht-existierende "content" und "title")
- **Ergebnis**: ✅ amtabk:"1. BImSchV" funktioniert jetzt vollständig (HTTP 200, 1 Treffer)
- **Validation**: Alle Suchmodi (feldspezifisch, allgemein, Highlighting) funktionieren korrekt

**🧪 FINALE VERIFIKATIONS-SUITE ABGESCHLOSSEN (08.06.2025)**: Komplette Endkontrolle erfolgreich
- [x] **Infrastruktur-Tests**: Docker-Container, Entwicklungsserver, Solr-Backend (alle ✅)
- [x] **Funktionalitäts-Tests**: Deutsche Rechtsabkürzungen, Facettierung, Highlighting (alle ✅)
- [x] **UI-Konfigurations-Tests**: uiConfig.js, Komponenten-Integration, Mode-Switcher (alle ✅)
- [x] **End-to-End-Tests**: Kombinierte Such-/Filter-/Highlighting-Funktionalität (✅)
- [x] **Produktionsreife**: 11/11 Tests bestanden, 0 kritische Fehler verbleibend
- **Dokumentation**: FINAL_VERIFICATION_SUITE_RESULTS.md erstellt
- **Status**: 🚀 BEREIT FÜR PRODUKTION

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

## 8. Norm-Level-Indexierung (✅ VOLLSTÄNDIG ABGESCHLOSSEN - 08.06.2025)

### 8.1 Architekturelle Probleme identifiziert:
- [x] **Problem 1 - Granularität**: Suche fand ganze Gesetze statt spezifische Artikel/Paragraphen
- [x] **Problem 2 - Formatierungsverlust**: XHTML-Markup aus XML-Quellen wurde während Import entfernt

### 8.2 Solr-Schema-Erweiterung:
- [x] Neue norm-spezifische Felder hinzugefügt:
  - [x] `norm_doknr` - Eindeutige Norm-Identifikation
  - [x] `norm_builddate` - Erstellungsdatum der Norm
  - [x] `parent_document_id` - Verweis auf übergeordnetes Dokument
  - [x] `norm_type` - Typ der Norm (article, section, etc.)
  - [x] `text_content_html` - Erhaltene XHTML-Formatierung
  - [x] `fussnoten_content_html` - Formatierte Fußnoten

### 8.3 Neuer Import-Algorithmus:
- [x] **`solr_import_norms.py`** erstellt - verarbeitet `<norm>`-Elemente einzeln
- [x] **XHTML-Formatierung erhalten**: Keine Textextraktion, direktes HTML-Mapping
- [x] **Metadaten-Vererbung**: Gesetzes-Level-Metadaten (jurabk, amtabk) an individuelle Normen vererbt
- [x] **Dokumentbeziehungen**: Eltern-Kind-Beziehungen via `parent_document_id` beibehalten

### 8.4 Datentransformation erfolgreich:
- [x] **Vor**: 2 Dokument-Level-Einträge (ganze Gesetze)
- [x] **Nach**: 263 individuelle Norm-Einträge (spezifische Artikel/Paragraphen)
- [x] **Granularität erreicht**: Suche findet z.B. "Art 70", "Art 79", "Art 83" einzeln
- [x] **Formatierung erhalten**: HTML-Markup aus XML-Quellen beibehalten

### 8.5 Frontend-Integration:
- [x] **UI-Konfiguration erweitert**: `uiConfig.js` um norm-spezifische Anzeigefelder
- [x] **Norm-Badges implementiert**: Grüne Badges für Artikel-Identifikation (`enbez`-Feld)
- [x] **Display-Types erweitert**: `norm-badge`, `small-badge` für spezialisierte Anzeige
- [x] **DynamicResultsDisplay erweitert**: `renderFieldBadge()` für norm-spezifische Darstellung
- [x] **DocumentFullView aktualisiert**: HTML-Formatierung wird korrekt gerendert
- [x] **Metadaten-Integration**: Norm-Typ, Quelle, Norm-Nummer in Sidebar-Anzeige

### 8.6 Erfolgsmessung:
- [x] **Granulare Suchergebnisse**: "Verantwortung" findet spezifische Artikel (Art 65, Art 20a, Art 46)
- [x] **XHTML-Formatierung erhalten**: `text_content_html` enthält `<p>`-Tags und andere Formatierung
- [x] **Norm-Identifikation**: `enbez`-Feld zeigt "Art 70", "Eingangsformel", "Präambel"
- [x] **Typ-Unterscheidung**: `norm_type` unterscheidet "article", "norm", etc.
- [x] **Volltext-Anzeige**: HTML-Formatierung wird in DocumentFullView korrekt gerendert

**🎯 ERGEBNIS**: Norm-Level-Indexierung vollständig implementiert - Benutzer finden jetzt spezifische Rechtsnormen statt ganzer Gesetzbücher, mit erhaltener Originalformatierung.

## 9. Zukünftige Features (Nach Phase 1)

- [ ] Benutzerverwaltung und Authentifizierung
- [ ] Gespeicherte Suchanfragen für angemeldete Benutzer
- [ ] Exportmöglichkeiten (PDF, CSV)
- [ ] Erweiterte Suchstatistiken und -analytik
- [ ] Webcrawler für Gesetze-im-Internet.de Integration

## 10. Dokumentation und Tests (Teilweise abgeschlossen)

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

## 11. DevOps und Bereitstellung (Teilweise abgeschlossen)

- [x] Produktions-Deployment mit Docker Compose
- [x] Nginx-Konfiguration für Frontend und Proxy
- [ ] CI/CD-Pipeline für automatisierte Builds
- [ ] Monitoring und Logging-Setup
- [ ] Leistungsoptimierung für größere Datenmengen

## 12. Systemverbesserungen (Geplant)

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
- [x] (HOCH) TableOfContents funktioniert nicht in der Dokumentenansicht (10.06.2025) - **Gelöst durch Korrektur der Import-Methoden in documentService.js und robustere Implementierung**
- [ ] (HOCH) Bessere Fehlerbehandlung für Netzwerkprobleme einbauen (18.05.2025)
- [ ] (MITTEL) Solr-Schema-Aktualisierungen ohne Container-Neustart ermöglichen (18.05.2025)
- [x] (MITTEL) Integration der Sidebar-Filter mit Solr-Facetten für dynamische Filterung (19.05.2025) - **✅ VOLLSTÄNDIG ABGESCHLOSSEN (07.06.2025)**
- [ ] (NIEDRIG) Möglichkeit zum Exportieren von Suchergebnissen als CSV oder JSON (19.05.2025)
- [ ] (NIEDRIG) Implementierung eines Theme-Wechslers für hellen/dunklen Modus (19.05.2025)

## Aktueller Sprint: Export-Korrektur und Expertensuche-Überarbeitung (✅ VOLLSTÄNDIG ABGESCHLOSSEN - 10.06.2025)

### 8.1 Export-Funktionen Korrektur (✅ ABGESCHLOSSEN - 10.06.2025)
- [x] **Import-Pfade korrigiert**: DocumentExport.jsx verwendet nun korrekte modulare Import-Pfade
- [x] **Export-Logik überarbeitet**: Unterscheidung zwischen Rahmendokument vs. einzelne Norm
- [x] **Dateinamen-Problem behoben**: generateFilename() nutzt erstes Dokument als Fallback
- [x] **Volltextanzeige optimiert**: getContentForDisplay() priorisiert HTML-Felder
- [x] **HTML-Tag-Bereinigung**: formatFieldValue() entfernt unerwünschte `<mark>`-Tags
- [x] **UI-Verbesserungen**: Rahmendokument-Link als Icon im Header

### 8.2 Stopword-Problem behoben (✅ ABGESCHLOSSEN - 10.06.2025)
- [x] **Root-Cause identifiziert**: Frontend-Validierung blockierte kurze Begriffe
- [x] **Lösung implementiert**: `.trim()` Validierung gelockert für Stopword-Tests
- [x] **Funktionalität bestätigt**: Deutsche Artikel "der", "die", "das" können getestet werden

### 8.3 Expertensuche-Überarbeitung (✅ ABGESCHLOSSEN - 10.06.2025)
- [x] **Layout vereinfacht**: Suchfeld-Auswahl-Karten im Experten-Modus entfernt
- [x] **Direkte Solr-Syntax**: Unterstützung für `field:"value" AND/OR ...` Queries
- [x] **Automatische Multi-Feld-Suche**: Suche über alle deutschen Rechtsfelder
- [x] **Erweiterte Highlighting**: Zusätzliche Felder für Experten-Modus
- [x] **Syntax-Hilfe**: Benutzerfreundliche Anleitung mit Beispielen
- [x] **Build-Optimierung**: Mixed import warnings behoben

### 8.4 Expert Search Beispiele Korrektur (✅ ABGESCHLOSSEN - 12.01.2025)
- [x] **Problem erkannt**: Syntax-Hilfe verwendete leere Felder `kurzue` und `amtabk`
- [x] **Datenanalyse**: Verfügbare Felder identifiziert: `jurabk:"GG"`, `langue:"Grundgesetz"`
- [x] **Beispiele aktualisiert**: Syntax-Hilfe zeigt jetzt funktionierende Beispiele mit tatsächlichen Daten
- [x] **Benutzerfreundlichkeit verbessert**: Nutzer sehen sofort Ergebnisse bei Demo-Queries

**Ergebnis**: Alle Export- und Anzeigefunktionen funktionieren korrekt. Expertensuche bietet professionelle Solr-Query-Syntax mit erweiterten Funktionen und funktionierenden Beispielen.

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
  - Text-Felder: `kurzue:(${query}) OR langue:(${query}) OR text_content:(${query})`
  - String-Felder: `amtabk:"${query}" OR jurabk:"${query}"`
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

## 8. Norm-Level-Indexierung (✅ VOLLSTÄNDIG ABGESCHLOSSEN - 08.06.2025)

### 8.1 Architekturelle Probleme identifiziert
- [x] **Problem 1 - Granularität**: Suche fand ganze Gesetze statt spezifische Artikel/Paragraphen
- [x] **Problem 2 - Formatierungsverlust**: XHTML-Markup aus XML-Quellen wurde während Import entfernt

### 8.2 Solr-Schema-Erweiterung
- [x] Neue norm-spezifische Felder hinzugefügt:
  - [x] `norm_doknr` - Eindeutige Norm-Identifikation
  - [x] `norm_builddate` - Erstellungsdatum der Norm
  - [x] `parent_document_id` - Verweis auf übergeordnetes Dokument
  - [x] `norm_type` - Typ der Norm (article, section, etc.)
  - [x] `text_content_html` - Erhaltene XHTML-Formatierung
  - [x] `fussnoten_content_html` - Formatierte Fußnoten

### 8.3 Neuer Import-Algorithmus
- [x] **`solr_import_norms.py`** erstellt - verarbeitet `<norm>`-Elemente einzeln
- [x] **XHTML-Formatierung erhalten**: Keine Textextraktion, direktes HTML-Mapping
- [x] **Metadaten-Vererbung**: Gesetzes-Level-Metadaten (jurabk, amtabk) an individuelle Normen vererbt
- [x] **Dokumentbeziehungen**: Eltern-Kind-Beziehungen via `parent_document_id` beibehalten

### 8.4 Datentransformation erfolgreich
- [x] **Vor**: 2 Dokument-Level-Einträge (ganze Gesetze)
- [x] **Nach**: 263 individuelle Norm-Einträge (spezifische Artikel/Paragraphen)
- [x] **Granularität erreicht**: Suche findet z.B. "Art 70", "Art 79", "Art 83" einzeln
- [x] **Formatierung erhalten**: HTML-Markup aus XML-Quellen beibehalten

### 8.5 Frontend-Integration
- [x] **UI-Konfiguration erweitert**: `uiConfig.js` um norm-spezifische Anzeigefelder
- [x] **Norm-Badges implementiert**: Grüne Badges für Artikel-Identifikation (`enbez`-Feld)
- [x] **Display-Types erweitert**: `norm-badge`, `small-badge` für spezialisierte Anzeige
- [x] **DynamicResultsDisplay erweitert**: `renderFieldBadge()` für norm-spezifische Darstellung
- [x] **DocumentFullView aktualisiert**: HTML-Formatierung wird korrekt gerendert
- [x] **Metadaten-Integration**: Norm-Typ, Quelle, Norm-Nummer in Sidebar-Anzeige

### 8.6 Erfolgsmessung
- [x] **Granulare Suchergebnisse**: "Verantwortung" findet spezifische Artikel (Art 65, Art 20a, Art 46)
- [x] **XHTML-Formatierung erhalten**: `text_content_html` enthält `<p>`-Tags und andere Formatierung
- [x] **Norm-Identifikation**: `enbez`-Feld zeigt "Art 70", "Eingangsformel", "Präambel"
- [x] **Typ-Unterscheidung**: `norm_type` unterscheidet "article", "norm", etc.
- [x] **Volltext-Anzeige**: HTML-Formatierung wird in DocumentFullView korrekt gerendert

**🎯 ERGEBNIS**: Norm-Level-Indexierung vollständig implementiert - Benutzer finden jetzt spezifische Rechtsnormen statt ganzer Gesetzbücher, mit erhaltener Originalformatierung.

### Sprint 2: Auto-Suggest und Sortierung (KW 25-26)
**Ziel**: Verbesserte Benutzererfahrung bei der Suche

**Features**:
- [ ] Autocomplete-Funktionalität basierend auf Solr-Begriffen
- [ ] Erweiterte Sortieroptionen in ResultsDisplay
- [ ] Suchhistorie im LocalStorage

## 13. Code Quality & Refactoring (Hinzugefügt am 2025-06-09)

### 13.1 Frontend Modularization (✅ VOLLSTÄNDIG ABGESCHLOSSEN - 2025-06-09)
- **Ziel**: Verbesserung der Code-Struktur, Lesbarkeit und Wartbarkeit durch Modularisierung.
- [x] **DocumentExport.jsx Refactoring**:
    - [x] HTML-Export-Logik nach `src/lib/htmlExporter.js` extrahiert.
    - [x] PDF-Export-Logik nach `src/lib/pdfExporter.js` extrahiert.
    - [x] Zugehörige Textformatierungs- und Datei-Utilities nach `src/utils/textFormatters.jsx` und `src/utils/fileUtils.js` verschoben.
- [x] **DynamicResultsDisplay.jsx Refactoring**:
    - [x] `ResultItem.jsx` Komponente für einzelne Suchergebnisse erstellt.
    - [x] Text-Utilities (`highlightSearchTerms`, `truncateText`) nach `src/utils/textFormatters.jsx` verschoben.
- [x] **DocumentFullView.jsx Refactoring**:
    - [x] Text-Formatierungshelfer (`getContentForDisplay`, `formatLegalTextAsFallback`) nach `src/utils/textFormatters.jsx` verschoben.
- [x] **Zentralisierung von Utility-Funktionen**:
    - [x] `src/utils/queryUtils.js` für `buildGermanLegalQuery` erstellt.
    - [x] `src/utils/documentUtils.js` für Dokument-spezifische Helfer (aus `uiHelpers`).
    - [x] `src/utils/formatUtils.js` für `formatFieldValue` (aus `uiHelpers`).
    - [x] `uiHelpers` in `src/config/uiConfig.js` bereinigt.
- [x] **Service-Klärung**:
    - [x] Kommentare in `schemaService.js` zur Verdeutlichung der Rollenverteilung ggü. `uiConfig.js` hinzugefügt.
- [x] **Build-Fix**:
    - [x] `textFormatters.js` zu `textFormatters.jsx` umbenannt und Importe korrigiert, um Build-Fehler zu beheben.
- **Ergebnis**: Deutlich verbesserte Code-Organisation, Reduktion von Duplikaten und klarere Verantwortlichkeiten der Module.

### 13.2 Bugfixes und Robustheit (✅ VOLLSTÄNDIG ABGESCHLOSSEN - 2025-06-10)
- **Ziel**: Stabilität der Anwendung verbessern und kritische Bugs beheben.
- [x] **TableOfContents-Bugfix**:
    - [x] Problem identifiziert: Inhaltsverzeichnis verschwand beim Öffnen der Volltextansicht mit TypeError "Cannot read properties of undefined (reading 'map')".
    - [x] Ursache diagnostiziert: Mischung aus ES Modul-Imports und CommonJS-Require in documentService.js.
    - [x] Lösung implementiert: 
        - [x] Neuer documentService.js mit konsequenter ES-Modul-Syntax erstellt.
        - [x] Import von isFrameworkDocument korrigiert (von require zu import).
        - [x] Defensive Programmierung mit Null-Checks und Standardwerten in TableOfContents.jsx hinzugefügt.
    - [x] Tests durchgeführt: Vollständige Funktion des Inhaltsverzeichnisses bestätigt.
- **Ergebnis**: Volltextanzeige funktioniert jetzt stabil mit korrekt angezeigtem Inhaltsverzeichnis.
