# GitHub Copilot Anweisungen für ASRA – Deutsche Gesetze

Diese Anweisungen dienen als Leitfaden für die Entwicklung mit GitHub Copilot im ASRA – Deutsche Gesetze-Projekt.

## Externe Dokumentation

- **Für Apache Solr Dokumentation** verwende die offizielle Dokumentation unter solr.apache.org.
- **Für React und Vite Fragen** nutze die jeweiligen offiziellen Dokumentationen.
- **Bei komplexen Solr-Abfragen** verwende die Solr Query Syntax Reference.

### Project Awareness & Context

1. **Lies `PLANNING.md`** zu Beginn einer neuen Konversation, um die Architektur, Ziele, den Stil und die Einschränkungen des Projekts zu verstehen.

2. **Überprüfe `TASK.md`** vor Beginn einer neuen Aufgabe:
   - Wenn die Aufgabe nicht aufgelistet ist, füge sie mit einer kurzen Beschreibung und dem aktuellen Datum hinzu.

3. **Folge den einheitlichen Namenskonventionen, Dateistrukturen und Architekturmustern** wie in `PLANNING.md` beschrieben.

4. **Beachte die bestehende Struktur des ASRA-Projekts**:
   - Frontend mit React/Vite
   - Apache Solr als Suchbackend
   - Docker für die Containerverwaltung

### Code Structure & Modularity

1. **Halte Dateien unter 500 Codezeilen.** Wenn eine Datei diese Grenze erreicht, refaktoriere sie in kleinere Module oder Hilfsdateien.

2. **Verwende klare, konsistente Imports:**
   - Bevorzuge absolute Imports für Klarheit.
   - Vermeide relative Imports wie `.` oder `..`.

3. **Folge dem bestehenden Komponentenmodell:**
   - Funktionale React-Komponenten mit Hooks
   - Services für API-Interaktionen
   - Klare Trennung von UI-Logik und Datenverarbeitung

### Testing & Reliability

1. **Schreibe Unit-Tests für alle neuen Features**, wie Funktionen, Komponenten und Services.

2. **Aktualisiere bestehende Unit-Tests**, wenn Logik modifiziert wird.

3. **Organisiere Tests in einem `/tests`-Ordner**, der die Struktur der Hauptanwendung spiegelt. Jedes Feature sollte folgendes enthalten:
   - 1 Test für erwartetes Verhalten
   - 1 Test für Randwerte/Edge Cases
   - 1 Test für Fehlerfälle

4. **Teste alle Solr-Anfragefunktionen** individuell, sowohl mit Mock-Daten als auch mit einer echten Solr-Instanz.

### Task Management

1. **Markiere Aufgaben in `TASK.md` als abgeschlossen**, unmittelbar nach ihrer Fertigstellung.

2. **Dokumentiere neue Teilaufgaben oder TODOs**, die während der Entwicklung entdeckt werden, im Abschnitt "Entdeckt während der Arbeit" von `TASK.md`.

3. **Halte die Projektplanung aktuell**, indem du Änderungen am Projektumfang oder an der Zeitleiste in `PLANNING.md` aktualisierst.

### Style & Conventions

1. **Befolge die Tailwind CSS Naming-Konventionen** und verwende die im Projekt definierten Farbvariablen.

2. **Verwende konsistente Namenskonventionen:**
   - PascalCase für Komponenten
   - camelCase für Variablen und Funktionen
   - kebab-case für CSS-Klassen (wenn nicht Tailwind)

3. **Formatiere den Code mit der bestehenden Einrückung** von 2 Leerzeichen.

4. **Verwende funktionale Komponenten und React Hooks** statt Klassenkomponenten.


### Documentation & Explainability

1. **Aktualisiere `README.md`**, wenn Features hinzugefügt, Abhängigkeiten geändert oder Setup-Schritte modifiziert werden.

2. **Kommentiere nicht-offensichtlichen Code**, um sicherzustellen, dass er für Entwickler verständlich ist.

3. **Füge `// Grund:` Kommentare hinzu**, um komplexe Logik zu erklären, und konzentriere dich dabei auf das "Warum" statt nur auf das "Was".

4. **Dokumentiere die Solr-Schema-Änderungen** in einer separaten Datei, wenn Feldtypen oder Indexkonfigurationen geändert werden.


### AI Behavior Rules

1. **Stelle Fragen, wenn Kontext fehlt**—triff keine Annahmen.

2. **Überprüfe Pfade und Modulnamen** vor deren Verwendung.

3. **Lösche oder überschreibe keinen existierenden Code**, es sei denn, dies wurde ausdrücklich angewiesen oder ist Teil einer definierten Aufgabe.

4. **Berücksichtige die Docker-Umgebung** bei der Entwicklung von Services und API-Endpunkten.

5. **Verwende Solr Query Parameter bewusst** und dokumentiere komplexe Abfragen.
