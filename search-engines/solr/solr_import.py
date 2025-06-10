#!/usr/bin/env python3
"""
Solr Import Script für deutsche Rechtsdokumente
Importiert XML-Dokumente aus dem demodata-Verzeichnis in Solr
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

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SolrImporter:
    def __init__(self, solr_url: str = "http://localhost:8983/solr/documents"):
        self.solr_url = solr_url
        self.update_url = f"{solr_url}/update/json/docs"
        self.commit_url = f"{solr_url}/update?commit=true"
        self.session = requests.Session()
        
    def test_connection(self) -> bool:
        """Testet die Verbindung zu Solr"""
        try:
            # Korrekte URL-Konstruktion für den Ping-Endpoint
            ping_url = f"{self.solr_url}/admin/ping"
            response = self.session.get(ping_url)
            if response.status_code == 200:
                data = response.json()
                return data.get("status") == "OK"
            return False
        except Exception as e:
            logger.error(f"Solr-Verbindung fehlgeschlagen: {e}")
            return False
    
    def parse_xml_document(self, file_path: str) -> Optional[Dict[str, Any]]:
        """
        Parst ein XML-Dokument und extrahiert die relevanten Felder
        
        Args:
            file_path: Pfad zur XML-Datei
            
        Returns:
            Dictionary mit den extrahierten Feldern oder None bei Fehlern
        """
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Basis-Dokumentenstruktur
            doc = {
                'id': self._generate_id(file_path),
                'builddate': datetime.now().isoformat() + 'Z',
                'xml_lang': root.get('{http://www.w3.org/XML/1998/namespace}lang', 'de'),
                'document_type': 'legal_document'
            }
            
            # Metadaten extrahieren
            self._extract_metadata(root, doc)
            
            # Textdaten extrahieren
            self._extract_textdata(root, doc)
            
            # Strukturierte Inhalte extrahieren
            self._extract_structured_content(root, doc)
            
            logger.info(f"Dokument erfolgreich geparst: {doc.get('id')}")
            return doc
            
        except ET.ParseError as e:
            logger.error(f"XML-Parsing-Fehler in {file_path}: {e}")
            return None
        except Exception as e:
            logger.error(f"Fehler beim Parsen von {file_path}: {e}")
            return None
    
    def _generate_id(self, file_path: str) -> str:
        """Generiert eine eindeutige ID basierend auf dem Dateipfad"""
        filename = os.path.basename(file_path)
        return filename.replace('.xml', '').replace(' ', '_')
    
    def _extract_metadata(self, root: ET.Element, doc: Dict[str, Any]):
        """Extrahiert Metadaten aus dem XML"""
        
        # Nach metadaten-Element suchen
        metadaten = root.find('.//metadaten')
        if metadaten is None:
            return
        
        # Juristische Abkürzung(en)
        jurabk_elements = metadaten.findall('.//jurabk')
        if jurabk_elements:
            doc['jurabk'] = [elem.text.strip() for elem in jurabk_elements if elem.text]
        
        # Amtliche Abkürzung
        amtabk = metadaten.find('.//amtabk')
        if amtabk is not None and amtabk.text:
            doc['amtabk'] = amtabk.text.strip()
        
        # Ausfertigungsdatum
        ausfertigung = metadaten.find('.//ausfertigung-datum')
        if ausfertigung is not None:
            datum = ausfertigung.get('datum')
            if datum:
                try:
                    # Datum in ISO-Format konvertieren
                    doc['ausfertigung_datum'] = self._parse_date(datum)
                except:
                    logger.warning(f"Ungültiges Datum: {datum}")
            
            # Manuell gesetzt?
            manuell = ausfertigung.get('manuell')
            if manuell:
                doc['ausfertigung_datum_manuell'] = manuell.lower() == 'ja'
        
        # Fundstellen
        self._extract_fundstellen(metadaten, doc)
        
        # Überschriften
        kurzue = metadaten.find('.//kurzue')
        if kurzue is not None and kurzue.text:
            doc['kurzue'] = kurzue.text.strip()
            doc['kurzue_exact'] = kurzue.text.strip()
        
        langue = metadaten.find('.//langue')
        if langue is not None and langue.text:
            doc['langue'] = langue.text.strip()
            doc['langue_exact'] = langue.text.strip()
        
        # Gliederungseinheit
        gliederung = metadaten.find('.//gliederungseinheit')
        if gliederung is not None:
            kennzahl = gliederung.find('.//gliederungskennzahl')
            if kennzahl is not None and kennzahl.text:
                doc['gliederungskennzahl'] = kennzahl.text.strip()
            
            bez = gliederung.find('.//gliederungsbez')
            if bez is not None and bez.text:
                doc['gliederungsbez'] = bez.text.strip()
            
            titel = gliederung.find('.//gliederungstitel')
            if titel is not None and titel.text:
                doc['gliederungstitel'] = titel.text.strip()
        
        # Einzelnormbezeichnung
        enbez = metadaten.find('.//enbez')
        if enbez is not None and enbez.text:
            doc['enbez'] = enbez.text.strip()
        
        # Titel
        titel = metadaten.find('.//titel')
        if titel is not None:
            if titel.text:
                doc['titel'] = titel.text.strip()
                doc['titel_exact'] = titel.text.strip()
            doc['titel_format'] = titel.get('format', 'text')
        
        # Standangaben
        self._extract_standangaben(metadaten, doc)
    
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
    
    def _extract_textdata(self, root: ET.Element, doc: Dict[str, Any]):
        """Extrahiert Textdaten"""
        textdaten = root.find('.//textdaten')
        if textdaten is None:
            return
        
        # Haupttext
        text_elem = textdaten.find('.//text')
        if text_elem is not None:
            doc['text_format'] = text_elem.get('format', 'XML')
            
            # Textinhalt extrahieren (alle Textknoten sammeln)
            text_content = self._extract_text_content(text_elem)
            if text_content:
                doc['text_content'] = text_content
        
        # Fußnoten
        fussnoten = textdaten.find('.//fussnoten')
        if fussnoten is not None:
            doc['fussnoten_format'] = fussnoten.get('format', 'XML')
            
            fussnoten_content = self._extract_text_content(fussnoten)
            if fussnoten_content:
                doc['fussnoten_content'] = fussnoten_content
    
    def _extract_structured_content(self, root: ET.Element, doc: Dict[str, Any]):
        """Extrahiert strukturierte Inhalte wie Paragraphen, Fußnoten etc."""
        
        # Paragraphen und Abschnitte
        paragraphs = []
        for elem in root.findall('.//P'):
            text = self._extract_text_content(elem)
            if text:
                paragraphs.append(text)
        
        if paragraphs:
            doc['content_paragraphs'] = paragraphs
        
        # Fußnoten-Details
        footnote_ids = []
        footnote_texts = []
        
        for fn in root.findall('.//FN'):
            fn_id = fn.get('id')
            if fn_id:
                footnote_ids.append(fn_id)
            
            fn_text = self._extract_text_content(fn)
            if fn_text:
                footnote_texts.append(fn_text)
        
        if footnote_ids:
            doc['footnote_ids'] = footnote_ids
        if footnote_texts:
            doc['footnote_texts'] = footnote_texts
        
        # Tabellen
        tables = []
        for table in root.findall('.//table'):
            table_text = self._extract_text_content(table)
            if table_text:
                tables.append(table_text)
        
        if tables:
            doc['table_content'] = tables
        
        # Kommentare
        self._extract_comments(root, doc)
    
    def _extract_comments(self, root: ET.Element, doc: Dict[str, Any]):
        """Extrahiert verschiedene Arten von Kommentaren"""
        comment_fields = {
            'standkommentar': 'kommentar_stand',
            'hinweis': 'kommentar_hinweis',
            'fundstellenhinweis': 'kommentar_fundstelle',
            'verarbeitungshinweise': 'kommentar_verarbeitung'
        }
        
        for xml_tag, field_name in comment_fields.items():
            comments = []
            for elem in root.findall(f'.//{xml_tag}'):
                text = self._extract_text_content(elem)
                if text:
                    comments.append(text)
            
            if comments:
                doc[field_name] = comments
    
    def _extract_text_content(self, element: ET.Element) -> str:
        """
        Extrahiert den gesamten Textinhalt eines Elements, 
        inklusive aller Unter-Elemente
        """
        if element is None:
            return ""
        
        # Alle Texte sammeln, inklusive Tail-Text
        texts = []
        
        def collect_text(elem):
            if elem.text:
                texts.append(elem.text.strip())
            for child in elem:
                collect_text(child)
                if child.tail:
                    texts.append(child.tail.strip())
        
        collect_text(element)
        
        # Texte zusammenfügen und bereinigen
        full_text = ' '.join(texts)
        return ' '.join(full_text.split())  # Mehrfache Leerzeichen entfernen
    
    def _parse_date(self, date_str: str) -> str:
        """
        Parst verschiedene Datumsformate und konvertiert sie zu ISO-Format
        """
        date_str = date_str.strip()
        
        # Verschiedene Datumsformate versuchen
        formats = [
            "%Y-%m-%d",
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
    
    def index_document(self, doc: Dict[str, Any]) -> bool:
        """
        Indexiert ein einzelnes Dokument in Solr
        
        Args:
            doc: Dictionary mit Dokumentdaten
            
        Returns:
            True bei Erfolg, False bei Fehler
        """
        try:
            response = self.session.post(
                self.update_url,
                json=[doc],
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                logger.info(f"Dokument indexiert: {doc['id']}")
                return True
            else:
                logger.error(f"Fehler beim Indexieren von {doc['id']}: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Fehler beim Indexieren von {doc['id']}: {e}")
            return False
    
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
        Importiert alle XML-Dateien aus einem Verzeichnis
        
        Args:
            directory: Pfad zum Verzeichnis
            
        Returns:
            Anzahl erfolgreich importierter Dokumente
        """
        if not os.path.exists(directory):
            logger.error(f"Verzeichnis nicht gefunden: {directory}")
            return 0
        
        successful_imports = 0
        xml_files = [f for f in os.listdir(directory) if f.endswith('.xml')]
        
        if not xml_files:
            logger.warning(f"Keine XML-Dateien in {directory} gefunden")
            return 0
        
        logger.info(f"Gefunden: {len(xml_files)} XML-Dateien")
        
        for filename in xml_files:
            file_path = os.path.join(directory, filename)
            logger.info(f"Verarbeite: {filename}")
            
            doc = self.parse_xml_document(file_path)
            if doc:
                if self.index_document(doc):
                    successful_imports += 1
            else:
                logger.error(f"Fehler beim Parsen von {filename}")
        
        # Commit nach dem Import
        if successful_imports > 0:
            self.commit()
        
        logger.info(f"Import abgeschlossen: {successful_imports}/{len(xml_files)} Dokumente erfolgreich importiert")
        return successful_imports

def main():
    parser = argparse.ArgumentParser(description='Importiert deutsche Rechtsdokumente in Solr')
    parser.add_argument('directory', help='Verzeichnis mit XML-Dateien')
    parser.add_argument('--solr-url', default='http://localhost:8983/solr/documents',
                       help='Solr URL (default: http://localhost:8983/solr/documents)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Solr Importer initialisieren
    importer = SolrImporter(args.solr_url)
    
    # Verbindung testen
    if not importer.test_connection():
        logger.error("Kann keine Verbindung zu Solr herstellen. Ist Solr gestartet?")
        sys.exit(1)
    
    # Import durchführen
    successful_imports = importer.import_directory(args.directory)
    
    if successful_imports > 0:
        logger.info(f"Import erfolgreich abgeschlossen: {successful_imports} Dokumente")
        sys.exit(0)
    else:
        logger.error("Import fehlgeschlagen")
        sys.exit(1)

if __name__ == '__main__':
    main()