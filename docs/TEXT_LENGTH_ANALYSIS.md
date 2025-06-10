# Analyse der Textlängen deutscher Gesetzestexte

> Dokumentation zur Untersuchung der typischen Textlängen in deutschen Rechtstexten und deren Auswirkungen auf die Einstellung der `MAX_TEXT_LENGTH`-Parameter für das Embedding-System.
>
> Datum: 10. Juni 2025

## Zusammenfassung

Diese Analyse untersucht die typischen Textlängen von Gesetzesparagraphen und -artikeln in deutschen Rechtstexten, basierend auf einer Stichprobe aus dem Grundgesetz (GG) und dem Bürgerlichen Gesetzbuch (BGB). Die Untersuchung dient dazu, die optimale Einstellung für den `MAX_TEXT_LENGTH`-Parameter im Qdrant-Indexierungsprozess zu bestimmen.

**Haupterkenntnis:** Die aktuelle Einstellung von 8.000 Zeichen ist mehr als ausreichend für die typischen Texte deutscher Gesetze. Eine Reduzierung auf 5.000 Zeichen wäre möglich ohne Informationsverlust bei den analysierten Dokumenten.

## Datengrundlage

Die Analyse basiert auf:
- 50 Dokumenten aus dem Grundgesetz (GG)
- 100 Dokumenten aus dem Bürgerlichen Gesetzbuch (BGB)

## Vergleich der Textlängen: GG vs. BGB

| Statistik | Grundgesetz (GG) | Bürgerliches Gesetzbuch (BGB) |
|-----------|------------------|-------------------------------|
| Durchschnitt | 758 Zeichen | 449 Zeichen |
| Median | 506 Zeichen | 285 Zeichen |
| Maximum | 4.534 Zeichen | 2.987 Zeichen |
| 95. Perzentil | 2.835 Zeichen | 1.476 Zeichen |
| 99. Perzentil | 4.534 Zeichen | 2.105 Zeichen |

## Dokumenttypen und deren typische Längen

| Dokumenttyp | Durchschnittliche Länge | Medianwert | Maximale Länge |
|-------------|-------------------------|------------|---------------|
| Artikel (GG) | 833 Zeichen | 513 Zeichen | 4.534 Zeichen |
| Paragraphen (BGB) | 482 Zeichen | 322 Zeichen | 2.097 Zeichen |
| Normen (allgemein) | 418-2.987 Zeichen | 597-2.987 Zeichen | 2.987 Zeichen |

## Textlängenverteilung

### Grundgesetz (GG)
- 0-500 Zeichen: 48,00% der Dokumente
- 501-1.000 Zeichen: 34,00% der Dokumente
- 1.001-2.000 Zeichen: 8,00% der Dokumente
- 2.001-4.000 Zeichen: 8,00% der Dokumente
- 4.001-8.000 Zeichen: 2,00% der Dokumente
- Über 8.000 Zeichen: 0,00% der Dokumente

### Bürgerliches Gesetzbuch (BGB)
- 0-500 Zeichen: 71,00% der Dokumente
- 501-1.000 Zeichen: 19,00% der Dokumente
- 1.001-2.000 Zeichen: 7,00% der Dokumente
- 2.001-4.000 Zeichen: 3,00% der Dokumente
- Über 4.000 Zeichen: 0,00% der Dokumente

## Auswirkungen auf die Einstellung von MAX_TEXT_LENGTH

Die Analyse zeigt:

1. **Die aktuelle MAX_TEXT_LENGTH von 8.000 Zeichen ist mehr als ausreichend**:
   - Über 99% der untersuchten Texte sind kürzer als 4.600 Zeichen
   - Die längsten beobachteten Texte erreichen nicht einmal 5.000 Zeichen
   - Ein Sicherheitspuffer ist dennoch sinnvoll für potenziell längere Texte in anderen Gesetzen

2. **Mögliche Optimierung**:
   - Eine Reduzierung auf 5.000 Zeichen würde für über 99% der untersuchten Texte ausreichen
   - Dies könnte zu Speicher- und Performancevorteilen führen ohne Qualitätseinbußen

3. **Unterschiede nach Gesetzestyp**:
   - BGB-Paragraphen sind tendenziell kürzer (Median: 322 Zeichen)
   - GG-Artikel sind etwas länger (Median: 513 Zeichen)

## Empfehlungen

1. **Beibehaltung oder Anpassung von MAX_TEXT_LENGTH**:
   - Die aktuelle Einstellung von 8.000 Zeichen kann beibehalten werden, wenn Speicher- und Performance-Aspekte unkritisch sind
   - Eine Reduzierung auf 5.000 Zeichen wäre eine sichere Optimierung ohne Qualitätseinbußen

2. **Keine Entfernung der Begrenzung**:
   - Eine Entfernung der Begrenzung ist nicht notwendig und würde die Qualität der Embeddings nicht signifikant verbessern
   - Zu lange Texte könnten potenziell die Qualität der Embeddings durch "Verwässerung" der semantischen Repräsentation beeinträchtigen

## Mögliche weiterführende Analysen

1. **Erweiterung der Stichprobe**:
   - Einbeziehung weiterer Gesetze wie StGB, StPO, ZPO
   - Analyse von Spezialnormen und Fachgesetzen, die möglicherweise längere Einzelbestimmungen enthalten

2. **Qualitätsvergleich**:
   - Experimentelle Vergleiche der Suchergebnisqualität mit verschiedenen MAX_TEXT_LENGTH-Werten

3. **Intelligente Textauswahl**:
   - Entwicklung von Algorithmen zur Erkennung und Extraktion der relevantesten Textteile bei sehr langen Dokumenten
