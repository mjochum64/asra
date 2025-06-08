#!/usr/bin/env python3
"""
Norm-level Solr Import Script für deutsche Rechtsdokumente
Importiert jede <norm> als separates Solr-Dokument mit erhaltener XHTML-Formatierung
"""

import os
import sys
import json
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from urllib.parse import urljoin
import argparse
import logging
from typing import Dict, List, Optional, Any
import re

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class NormSolrImporter:
    def __init__(self, solr_url: str = "http://localhost:8983/solr/documents"):
        self.solr_url = solr_url
        self.update_url = f"{solr_url}/update/json/docs"
        self.commit_url = f"{solr_url}/update?commit=true"
        self.session = requests.Session()
        
    def test_connection(self) -> bool:
        """Testet die Verbindung zu Solr"""
        try:
            ping_url = f"{self.solr_url}/admin/ping"
            response = self.session.get(ping_url)
            if response.status_code == 200:
                data = response.json()
                return data.get("status") == "OK"
            return False
        except Exception as e:
            logger.error(f"Solr-Verbindung fehlgeschlagen: {e}")
            return False
    
    def parse_xml_document(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parst ein XML-Dokument und erstellt separate Solr-Dokumente für jede Norm
        
        Args:
            file_path: Pfad zur XML-Datei
            
        Returns:
            Liste von Dokumenten (eins pro Norm) oder leere Liste bei Fehlern
        """
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Basis-Dokumentenstruktur aus dem Haupt-Dokument extrahieren
            main_doc_metadata = self._extract_main_document_metadata(root)
            
            # Alle norm-Elemente finden
            norm_elements = root.findall('.//norm')
            if not norm_elements:
                logger.warning(f"Keine <norm>-Elemente in {file_path} gefunden")
                return []
            
            documents = []
            parent_document_id = self._generate_document_id(file_path)
            
            logger.info(f"Gefunden: {len(norm_elements)} Normen in {file_path}")
            
            for i, norm_elem in enumerate(norm_elements):
                norm_doc = self._parse_norm_element(norm_elem, main_doc_metadata, parent_document_id, i)
                if norm_doc:
                    documents.append(norm_doc)
            
            logger.info(f"Erfolgreich geparst: {len(documents)} Normen aus {file_path}")
            return documents
            
        except ET.ParseError as e:
            logger.error(f"XML-Parsing-Fehler in {file_path}: {e}")
            return []
        except Exception as e:
            logger.error(f"Fehler beim Parsen von {file_path}: {e}")
            return []
    
    def _extract_main_document_metadata(self, root: ET.Element) -> Dict[str, Any]:
        """Extrahiert Metadaten auf Dokumentenebene"""
        
        # Erste norm mit Dokumenten-Metadaten finden (meist die erste ohne enbez)
        main_norm = root.find('.//norm')
        if main_norm is None:
            return {}
        
        main_metadaten = main_norm.find('.//metadaten')
        if main_metadaten is None:
            return {}
        
        metadata = {}
        
        # Juristische Abkürzung(en)
        jurabk_elements = main_metadaten.findall('.//jurabk')
        if jurabk_elements:
            metadata['jurabk'] = [elem.text.strip() for elem in jurabk_elements if elem.text]
        
        # Amtliche Abkürzung
        amtabk = main_metadaten.find('.//amtabk')
        if amtabk is not None and amtabk.text:
            metadata['amtabk'] = amtabk.text.strip()
        
        # Ausfertigungsdatum
        ausfertigung = main_metadaten.find('.//ausfertigung-datum')
        if ausfertigung is not None:
            datum = ausfertigung.get('datum')
            if datum:
                try:
                    metadata['ausfertigung_datum'] = self._parse_date(datum)
                except:
                    logger.warning(f"Ungültiges Datum: {datum}")
            
            manuell = ausfertigung.get('manuell')
            if manuell:
                metadata['ausfertigung_datum_manuell'] = manuell.lower() == 'ja'
        
        # Fundstellen
        self._extract_fundstellen(main_metadaten, metadata)
        
        # Haupt-Überschriften
        kurzue = main_metadaten.find('.//kurzue')
        if kurzue is not None and kurzue.text:
            metadata['kurzue'] = kurzue.text.strip()
            metadata['kurzue_exact'] = kurzue.text.strip()
        
        langue = main_metadaten.find('.//langue')
        if langue is not None and langue.text:
            metadata['langue'] = langue.text.strip()
            metadata['langue_exact'] = langue.text.strip()
        
        # Standangaben
        self._extract_standangaben(main_metadaten, metadata)
        
        return metadata
    
    def _parse_norm_element(self, norm_elem: ET.Element, main_metadata: Dict[str, Any], 
                           parent_doc_id: str, norm_index: int) -> Optional[Dict[str, Any]]:
        """
        Parst ein einzelnes <norm>-Element und erstellt ein Solr-Dokument
        
        Args:
            norm_elem: Das <norm> XML-Element
            main_metadata: Metadaten vom Hauptdokument
            parent_doc_id: ID des Elterndokuments
            norm_index: Index der Norm im Dokument
            
        Returns:
            Dictionary mit Dokumentdaten oder None bei Fehlern
        """
        try:
            norm_doknr = norm_elem.get('doknr')
            norm_builddate = norm_elem.get('builddate')
            
            if not norm_doknr:
                logger.warning(f"Norm ohne doknr gefunden, überspringe (Index: {norm_index})")
                return None
            
            # Basis-Dokumentenstruktur
            doc = {
                'id': norm_doknr,  # doknr als eindeutige ID verwenden
                'norm_doknr': norm_doknr,
                'parent_document_id': parent_doc_id,
                'builddate': datetime.now().isoformat() + 'Z',
                'document_type': 'legal_norm',
                'xml_lang': 'de'
            }
            
            # Norm builddate hinzufügen
            if norm_builddate:
                try:
                    doc['norm_builddate'] = self._parse_date(norm_builddate)
                except:
                    logger.warning(f"Ungültiges norm builddate: {norm_builddate}")
            
            # Haupt-Metadaten vom Dokument übernehmen
            for key, value in main_metadata.items():
                if key not in doc:  # Nicht überschreiben
                    doc[key] = value
            
            # Norm-spezifische Metadaten extrahieren
            metadaten = norm_elem.find('.//metadaten')
            if metadaten is not None:
                self._extract_norm_metadata(metadaten, doc)
            
            # Textdaten extrahieren
            textdaten = norm_elem.find('.//textdaten')
            if textdaten is not None:
                self._extract_norm_textdata(textdaten, doc)
            
            # Norm-Typ bestimmen
            doc['norm_type'] = self._determine_norm_type(doc)
            
            return doc
            
        except Exception as e:
            logger.error(f"Fehler beim Parsen der Norm {norm_doknr}: {e}")
            return None
    
    def _extract_norm_metadata(self, metadaten: ET.Element, doc: Dict[str, Any]):
        """Extrahiert Metadaten spezifisch für eine Norm"""
        
        # Einzelnormbezeichnung (z.B. "Art 1", "§ 2")
        enbez = metadaten.find('.//enbez')
        if enbez is not None and enbez.text:
            doc['enbez'] = enbez.text.strip()
        
        # Titel der Norm
        titel = metadaten.find('.//titel')
        if titel is not None:
            if titel.text:
                doc['titel'] = titel.text.strip()
                doc['titel_exact'] = titel.text.strip()
            doc['titel_format'] = titel.get('format', 'text')
        
        # Gliederungseinheit (für Abschnitte, Kapitel etc.)
        gliederung = metadaten.find('.//gliederungseinheit')
        if gliederung is not None:
            kennzahl = gliederung.find('.//gliederungskennzahl')
            if kennzahl is not None and kennzahl.text:
                doc['gliederungskennzahl'] = kennzahl.text.strip()
            
            bez = gliederung.find('.//gliederungsbez')
            if bez is not None and bez.text:
                doc['gliederungsbez'] = bez.text.strip()
            
            titel_gl = gliederung.find('.//gliederungstitel')
            if titel_gl is not None and titel_gl.text:
                doc['gliederungstitel'] = titel_gl.text.strip()
    
    def _extract_norm_textdata(self, textdaten: ET.Element, doc: Dict[str, Any]):
        """Extrahiert Textdaten einer Norm mit Formatierungserhaltung"""
        
        # Haupttext
        text_elem = textdaten.find('.//text')
        if text_elem is not None:
            doc['text_format'] = text_elem.get('format', 'XML')
            
            # Content-Element finden
            content_elem = text_elem.find('.//Content')
            if content_elem is not None:
                # Formatiertes HTML für Anzeige
                doc['text_content_html'] = self._element_to_html(content_elem)
                
                # Plain text für Suche
                doc['text_content'] = self._extract_text_content(content_elem)
                
                # Strukturierte Inhalte extrahieren
                self._extract_structured_content(content_elem, doc)
        
        # Fußnoten
        fussnoten = textdaten.find('.//fussnoten')
        if fussnoten is not None:
            doc['fussnoten_format'] = fussnoten.get('format', 'XML')
            
            fussnoten_content = fussnoten.find('.//Content')
            if fussnoten_content is not None:
                # Formatiertes HTML für Anzeige
                doc['fussnoten_content_html'] = self._element_to_html(fussnoten_content)
                
                # Plain text für Suche
                doc['fussnoten_content'] = self._extract_text_content(fussnoten_content)
    
    def _element_to_html(self, element: ET.Element) -> str:
        """
        Konvertiert ein XML-Element zu HTML mit Erhaltung der Struktur
        """
        if element is None:
            return ""
        
        # XML zu String konvertieren
        xml_str = ET.tostring(element, encoding='unicode', method='xml')
        
        # Einfache XML zu HTML Konvertierung
        html_str = xml_str
        
        # XML-Tags zu HTML-Tags konvertieren
        html_str = html_str.replace('<P>', '<p>').replace('</P>', '</p>')
        html_str = html_str.replace('<SP>', '<span>').replace('</SP>', '</span>')
        html_str = html_str.replace('<BR/>', '<br>')
        html_str = html_str.replace('<B>', '<strong>').replace('</B>', '</strong>')
        html_str = html_str.replace('<I>', '<em>').replace('</I>', '</em>')
        html_str = html_str.replace('<LA', '<span').replace('</LA>', '</span>')
        html_str = html_str.replace('<DL', '<dl').replace('</DL>', '</dl>')
        html_str = html_str.replace('<DT>', '<dt>').replace('</DT>', '</dt>')
        html_str = html_str.replace('<DD', '<dd').replace('</DD>', '</dd>')
        
        # Content-Wrapper entfernen
        html_str = re.sub(r'^<Content[^>]*>', '', html_str)
        html_str = re.sub(r'</Content>$', '', html_str)
        
        # Attribute bereinigen (einfache Lösung)
        html_str = re.sub(r' Font="[^"]*"', '', html_str)
        html_str = re.sub(r' Size="[^"]*"', '', html_str)
        html_str = re.sub(r' Type="[^"]*"', '', html_str)
        
        return html_str.strip()
    
    def _extract_structured_content(self, content_elem: ET.Element, doc: Dict[str, Any]):
        """Extrahiert strukturierte Inhalte aus dem Content-Element"""
        
        # Paragraphen extrahieren
        paragraphs = []
        for p_elem in content_elem.findall('.//P'):
            text = self._extract_text_content(p_elem)
            if text:
                paragraphs.append(text)
        
        if paragraphs:
            doc['content_paragraphs'] = paragraphs
        
        # Tabellen extrahieren
        tables = []
        for table in content_elem.findall('.//table'):
            table_text = self._extract_text_content(table)
            if table_text:
                tables.append(table_text)
        
        if tables:
            doc['table_content'] = tables
    
    def _determine_norm_type(self, doc: Dict[str, Any]) -> str:
        """Bestimmt den Typ einer Norm basierend auf den Metadaten"""
        
        enbez = doc.get('enbez', '')
        
        # Gliederungseinheiten (Abschnitte, Kapitel etc.)
        if doc.get('gliederungskennzahl') and not enbez:
            return 'section'
        
        # Artikel im Grundgesetz
        if enbez.startswith('Art '):
            return 'article'
        
        # Paragraphen
        if enbez.startswith('§ '):
            return 'paragraph'
        
        # Anlagen
        if enbez.startswith('Anlage'):
            return 'appendix'
        
        # Schlussformel
        if enbez == 'Schlussformel':
            return 'conclusion'
        
        # Inhaltsübersicht
        if enbez == 'Inhaltsübersicht':
            return 'table_of_contents'
        
        # Weggefallene Artikel/Paragraphen
        if '(weggefallen)' in doc.get('titel', ''):
            return 'repealed'
        
        # Standard
        return 'norm'
    
    def _extract_text_content(self, element: ET.Element) -> str:
        """Extrahiert reinen Textinhalt ohne Formatierung"""
        if element is None:
            return ""
        
        texts = []
        
        def collect_text(elem):
            if elem.text:
                texts.append(elem.text.strip())
            for child in elem:
                collect_text(child)
                if child.tail:
                    texts.append(child.tail.strip())
        
        collect_text(element)
        
        full_text = ' '.join(texts)
        return ' '.join(full_text.split())  # Mehrfache Leerzeichen entfernen
    
    def _extract_fundstellen(self, metadaten: ET.Element, doc: Dict[str, Any]):
        """Extrahiert Fundstellen-Informationen"""
        fundstellen = metadaten.findall('.//fundstelle')
        
        if not fundstellen:
            return
        
        for field in ['typ', 'periodikum', 'zitstelle', 'dokst']:
            values = []
            for fundstelle in fundstellen:
                elem = fundstelle.find(f'.//{field}')
                if elem is not None and elem.text:
                    values.append(elem.text.strip())
            if values:
                doc[f'fundstelle_{field}'] = values
        
        # Datumsfelder
        for date_field in ['anlagedat', 'abgabedat']:
            dates = []
            for fundstelle in fundstellen:
                elem = fundstelle.find(f'.//{date_field}')
                if elem is not None and elem.text:
                    try:
                        dates.append(self._parse_date(elem.text.strip()))
                    except:
                        logger.warning(f"Ungültiges {date_field}: {elem.text}")
            if dates:
                doc[f'fundstelle_{date_field}'] = dates
    
    def _extract_standangaben(self, metadaten: ET.Element, doc: Dict[str, Any]):
        """Extrahiert Standangaben"""
        standangaben = metadaten.findall('.//standangabe')
        
        if not standangaben:
            return
        
        typen = []
        kommentare = []
        checked_values = []
        
        for standangabe in standangaben:
            typ = standangabe.get('typ')
            if typ:
                typen.append(typ)
            
            kommentar = standangabe.find('.//standkommentar')
            if kommentar is not None and kommentar.text:
                kommentare.append(kommentar.text.strip())
            
            checked = standangabe.get('checked')
            if checked:
                checked_values.append(checked.lower() == 'ja')
        
        if typen:
            doc['standangabe_typ'] = typen
        if kommentare:
            doc['standangabe_kommentar'] = kommentare
        if checked_values:
            doc['standangabe_checked'] = checked_values
    
    def _parse_date(self, date_str: str) -> str:
        """Parst verschiedene Datumsformate und konvertiert sie zu ISO-Format"""
        date_str = date_str.strip()
        
        formats = [
            "%Y-%m-%d",
            "%Y%m%d%H%M%S",
            "%d.%m.%Y",
            "%d/%m/%Y",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ"
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.isoformat() + 'Z'
            except ValueError:
                continue
        
        raise ValueError(f"Unbekanntes Datumsformat: {date_str}")
    
    def _generate_document_id(self, file_path: str) -> str:
        """Generiert eine eindeutige ID basierend auf dem Dateipfad"""
        filename = os.path.basename(file_path)
        return filename.replace('.xml', '').replace(' ', '_')
    
    def index_documents(self, docs: List[Dict[str, Any]]) -> int:
        """
        Indexiert eine Liste von Dokumenten in Solr
        
        Args:
            docs: Liste von Dokumenten
            
        Returns:
            Anzahl erfolgreich indexierter Dokumente
        """
        if not docs:
            return 0
        
        try:
            response = self.session.post(
                self.update_url,
                json=docs,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                logger.info(f"Batch von {len(docs)} Dokumenten erfolgreich indexiert")
                return len(docs)
            else:
                logger.error(f"Fehler beim Indexieren der Dokumente: {response.text}")
                return 0
                
        except Exception as e:
            logger.error(f"Fehler beim Indexieren der Dokumente: {e}")
            return 0
    
    def commit(self) -> bool:
        """Führt einen Commit in Solr durch"""
        try:
            headers = {'Content-Type': 'application/json'}
            response = self.session.post(self.commit_url, headers=headers)
            if response.status_code == 200:
                logger.info("Solr Commit erfolgreich")
                return True
            else:
                logger.error(f"Fehler beim Commit: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Fehler beim Commit: {e}")
            return False
    
    def import_directory(self, directory: str) -> int:
        """
        Importiert alle XML-Dateien aus einem Verzeichnis als Norm-level Dokumente
        
        Args:
            directory: Pfad zum Verzeichnis
            
        Returns:
            Anzahl erfolgreich importierter Normen
        """
        if not os.path.exists(directory):
            logger.error(f"Verzeichnis nicht gefunden: {directory}")
            return 0
        
        xml_files = [f for f in os.listdir(directory) if f.endswith('.xml')]
        
        if not xml_files:
            logger.warning(f"Keine XML-Dateien in {directory} gefunden")
            return 0
        
        logger.info(f"Gefunden: {len(xml_files)} XML-Dateien")
        
        total_norms_imported = 0
        
        for filename in xml_files:
            file_path = os.path.join(directory, filename)
            logger.info(f"Verarbeite: {filename}")
            
            norm_docs = self.parse_xml_document(file_path)
            if norm_docs:
                imported_count = self.index_documents(norm_docs)
                total_norms_imported += imported_count
                logger.info(f"  {imported_count} Normen aus {filename} importiert")
            else:
                logger.error(f"Fehler beim Parsen von {filename}")
        
        # Commit nach dem Import
        if total_norms_imported > 0:
            self.commit()
        
        logger.info(f"Norm-level Import abgeschlossen: {total_norms_imported} Normen aus {len(xml_files)} Dateien")
        return total_norms_imported

def main():
    parser = argparse.ArgumentParser(description='Importiert deutsche Rechtsdokumente auf Norm-Ebene in Solr')
    parser.add_argument('directory', help='Verzeichnis mit XML-Dateien')
    parser.add_argument('--solr-url', default='http://localhost:8983/solr/documents',
                       help='Solr URL (default: http://localhost:8983/solr/documents)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Solr Importer initialisieren
    importer = NormSolrImporter(args.solr_url)
    
    # Verbindung testen
    if not importer.test_connection():
        logger.error("Kann keine Verbindung zu Solr herstellen. Ist Solr gestartet?")
        sys.exit(1)
    
    # Import durchführen
    total_imported = importer.import_directory(args.directory)
    
    if total_imported > 0:
        logger.info(f"Norm-level Import erfolgreich abgeschlossen: {total_imported} Normen")
        sys.exit(0)
    else:
        logger.error("Import fehlgeschlagen")
        sys.exit(1)

if __name__ == '__main__':
    main()
