# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantischer Versionierung](https://semver.org/lang/de/).

## [Unreleased]

### Geplant für Sprint 2
- Auto-Suggest/Autocomplete-Funktionalität basierend auf Solr-Begriffen
- Erweiterte Sortieroptionen (Relevanz, Datum, Titel)
- Suchhistorie mit LocalStorage
- Erweiterte Datum-Range-Filter

### Langfristig geplant
- Dokumentvorschau-Modal
- Webcrawler-Integration für automatischen Datenimport
- Theme-Wechsler für hellen/dunklen Modus

## [1.1.1] - 2025-06-09

### 🚀 Feature Release: Optimierte Export-Funktionalität und Dokumentenansicht

### Hinzugefügt
- **Export-Funktionen**: PDF- und HTML-Export von Dokumenteninhalten mit professioneller Formatierung
- **Intelligente Dateinamen-Generierung**: Automatische Erstellung aussagekräftiger Dateinamen basierend auf Dokument-IDs
- **PDF-Navigation**: Vollständiges Inhaltsverzeichnis mit präzisen Seitenzahlen für alle PDF-Viewer
- **HTML-Felder-Integration**: Nutzung von `text_content_html` und `fussnoten_content_html` für optimale Formatierung
- **Orphan-Norm-Struktur**: Direkte Anzeige von Artikeln ohne übergeordnete Abschnitte
- **Volltext-Ansicht**: Erweiterte Dokumenten-Ansicht mit korrekter Absatzformatierung

### Geändert
- **Export-Content-Optimierung**: Beide Export-Funktionen nutzen HTML-Felder statt manueller Textformatierung
- **Content-Filtering**: Entfernung redundanter Inhaltsverzeichnisse und bedeutungsloser Gliederungseinheiten
- **Datenabruf-Erweiterung**: Alle relevanten Queries um HTML-Felder erweitert
- **Paragraph-Formatierung**: Nummerierte Abschnitte (1), (2), (3) werden als korrekte Absätze dargestellt

### Behoben
- **KRITISCHER BUGFIX**: Redundante Inhaltsverzeichnisse in Export-Dateien entfernt
- **Formatierungs-Problem**: Übermäßige bedeutungslose Gliederungseinheiten gefiltert
- **PDF-Kompatibilität**: Universelle PDF-Navigation ohne proprietäre Features
- **Content-Konsistenz**: Identische Formatierung in Volltext-, HTML- und PDF-Ansicht

### Technische Verbesserungen
- **getContentForExport()**: Neue Funktion für HTML-Export mit HTML-Feld-Priorisierung
- **getContentForPDF()**: Intelligente HTML-zu-PDF-Konvertierung mit Absatzerkennung
- **generateFilename()**: Robuste Dateinamen-Generierung mit Sonderzeichen-Bereinigung
- **Fallback-Mechanismus**: Automatische Verwendung manueller Formatierung bei fehlenden HTML-Feldern

### Validiert ✅
- **Export-Funktionalität**: PDF und HTML Export mit korrekter Formatierung
- **Navigation**: PDF-Inhaltsverzeichnis funktioniert in allen PDF-Viewern
- **Content-Filtering**: Nur relevante Abschnitte und Artikel werden exportiert
- **Paragraph-Struktur**: Nummerierte Abschnitte als ordentliche Absätze dargestellt

## [1.0.1] - 2025-06-08

### 🔧 Patch Release: Kritische Suchfunktions-Bugfixes

### Behoben
- **KRITISCHER BUGFIX**: Case-insensitive Suche für deutsche Rechtsabkürzungen
  - Problem: Suche nach "gg" fand keine Dokumente mit "GG" in "Amtliche Abkürzung" Modus
  - Lösung: Solr-Schema-Felder `jurabk` und `amtabk` von `type="string"` auf `type="text_de_exact"` geändert
  - Ergebnis: Vollständige case-insensitive Funktionalität für alle deutschen Rechtsabkürzungen
- **Filter-Display-Konfiguration behoben**
  - Problem: Nur 1-2 Filter wurden angezeigt statt der konfigurierten Filter
  - Lösung: `getContextualFacets()` in `schemaService.js` aktualisiert um UI-konfigurierte Filter zu verwenden
  - Ergebnis: Filter zeigen jetzt korrekt basierend auf verfügbaren Daten

### Geändert
- **Solr-Schema**: Felder `jurabk` und `amtabk` nutzen jetzt `LowerCaseFilterFactory` für case-insensitive Matching
- **schemaService.js**: `getContextualFacets()` Funktion verwendet UI-Konfiguration statt dynamische Schema-Felder
- **Infrastruktur**: Solr Core neu erstellt und Demo-Daten mit aktualisiertem Schema re-indexiert

### Technische Details
- Solr-Container neugestartet und Core mit neuer Schema-Konfiguration erstellt
- Alle Demo-Dokumente erfolgreich mit case-insensitive Schema re-indexiert
- Debug-Logging entfernt nach erfolgreicher Problemdiagnose

## [1.0.0] - 2025-06-08

### 🎉 Major Release: Konfigurierbare UI-Struktur PRODUCTION READY

### Hinzugefügt
- **Konfigurierbare UI-Modi**: Normal-Modus (5 benutzerfreundliche Felder) vs. Experten-Modus (alle Solr-Felder)
- **ModeSwitcher-Komponente**: Toggle zwischen vereinfachter und erweiteter Suche
- **uiConfig.js**: Zentrale Konfigurationsdatei für UI-Bereiche (Suche, Trefferliste, Volltext)
- **Deutsche Rechtsabkürzungen**: Vollständige Unterstützung für Suchen wie "1. BImSchV", "GG", "BGB"
- **Helper-Funktionen**: `highlightSearchTerms`, `truncateText`, Feldformatierung und Wertverarbeitung
- **Finale Verifikations-Suite**: 11/11 Tests bestanden - alle kritischen Funktionalitäten validiert
- **Dokumentations-Organisation**: Alle Reports in [`docs/`](docs/) Ordner verschoben

### Geändert  
- **DynamicSearchBar**: Vollständige Integration der UI-Konfiguration mit Icon-Support
- **DynamicResultsDisplay**: Konfigurierbare Ergebnis-Anzeige mit Content-Highlighting
- **DynamicSidebar**: Modus-bewusste Filterung mit UI-Konfiguration
- **DynamicApp**: Vollständiges State-Management für uiMode-Wechsel
- **Repository-Struktur**: Aufgeräumt und organisiert für Produktionsreife

### Behoben
- **KRITISCHER BUGFIX**: Deutsche Rechtsabkürzungssuche (HTTP 400 → HTTP 200)
- **URL-Encoding-Problem**: Custom Parameter-Serializer für Phrase-Queries mit Leerzeichen
- **Highlighting-Konfiguration**: Korrigiert auf existierende Schema-Felder (kurzue,langue,amtabk,jurabk,text_content)
- **Frontend-Rendering-Fehler**: `highlightSearchTerms` und `truncateText` Funktionen implementiert
- **Leere Webseite**: ReferenceError bei fehlenden Helper-Funktionen behoben

### Validiert ✅
- **Infrastruktur**: Docker-Container, Entwicklungsserver, Solr-Backend
- **Suchfunktionalität**: Deutsche Rechtsabkürzungen, Facettierung, Highlighting
- **UI-System**: Alle 5 Komponenten mit uiConfig.js integriert
- **End-to-End**: Kombinierte Such-/Filter-/Highlighting-Funktionalität
- **Produktionsreife**: 0 kritische Fehler, alle Tests bestanden

### Entfernt
- Überflüssige Debug-Ausgaben und Konsolen-Logs
- Veraltete Dokumentationsdateien aus Root-Verzeichnis
- [`summary.sh`](summary.sh) - ersetzt durch umfassende Markdown-Dokumentation

## [0.3.1] - 2025-05-18

### Hinzugefügt
- Mock-Modus für Entwicklungs- und Testzwecke
- Erweitertes Logging für die Fehlerdiagnose
- Verbesserte Mock-Daten mit Highlighting und Metadaten

### Geändert
- Vite-Konfiguration mit Proxy für Solr-Anfragen im Entwicklungsmodus
- Verbessertes Error-Handling im Solr-Service

### Behoben
- CORS-Probleme im Entwicklungsmodus durch Einrichtung eines Vite-Proxys
- Verbesserte Error-Handling und Debug-Ausgaben im Solr-Service

## [0.3.0] - 2025-05-18

### Hinzugefügt
- Modernes UI-Design mit verbesserter Benutzererfahrung
- Neue Komponenten: Navbar, Sidebar, Footer, Pagination
- Erweiterte Suchfilter (Suche nach Titel/Inhalt)
- Paginierung für große Ergebnismengen
- Ergebnishervorhebung für Suchbegriffe
- Verbesserte Darstellung der Dokumente mit Metadaten
- Responsives Layout mit Sidebar für Desktop-Ansicht

### Geändert
- Überarbeitete SearchBar mit zusätzlichen Suchoptionen
- Erweiterte ResultsDisplay-Komponente mit Sortieroptionen
- Verbesserte Fehler- und Leerzustandsbehandlung
- Optimierte solrService.js für verschiedene Suchmodi
- Umfassende Modernisierung des Layouts und der visuellen Gestaltung

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
