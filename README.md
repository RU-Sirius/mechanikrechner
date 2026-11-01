# MechanikRechner – Web-App

Offline-fähige Web-App (PWA) für Mechaniker, Maschinenbauer und Konstrukteure.
Kein Build-Schritt, keine Abhängigkeiten, keine Datenübertragung: Gespeicherte Berechnungen bleiben lokal im Browser.

**App öffnen:** https://ru-sirius.github.io/mechanikrechner/

## Installation

### iPhone & iPad (Safari)
1. https://ru-sirius.github.io/mechanikrechner/ in Safari öffnen.
2. Auf das Teilen-Symbol tippen (Quadrat mit Pfeil nach oben; iPhone unten, iPad oben rechts).
3. „Zum Home-Bildschirm“ wählen und mit „Hinzufügen“ bestätigen.

### Mac (Google Chrome)
1. Die Adresse in Chrome öffnen.
2. Rechts in der Adressleiste auf das Installieren-Symbol klicken und „Installieren“ bestätigen
   (oder Menü ⋮ → „Streamen, speichern und teilen“ → „Seite als App installieren…“, Bezeichnung je nach Chrome-Version).

### Mac (Safari, ab macOS 14 Sonoma)
Menü „Ablage“ → „Zum Dock hinzufügen…“.

Die Anleitung steht auch in der App unter **„App installieren“**.

## Funktionen (v1.0.0)

**Grundlagen**
- Einheiten umrechnen (Länge, Kraft, Druck/Spannung, Drehmoment, Leistung, Energie, Masse, Volumen, Geschwindigkeit, Temperatur)
- Drehmoment · Leistung · Drehzahl
- Hebel & Momente
- Bewegung (gleichmäßig beschleunigt) & Bremsweg
- Energie (kinetisch, potenziell)

**Antriebstechnik**
- Zahnrad-Übersetzung (Drehzahl, Abtriebsmoment mit Wirkungsgrad)
- Stirnrad-Geometrie aus Modul (Teil-, Kopf-, Fußkreis, Achsabstand)
- Riementrieb (Übersetzung, Riemengeschwindigkeit, Riemenlänge)
- Hubantrieb (erforderliche Motorleistung)

**Festigkeitslehre**
- Spannung & Flächenpressung
- Querschnittswerte A, I, W, Wp für Rechteck, Rund, Rohr, Rechteckrohr
- Balkenbiegung (vier Standardfälle: Durchbiegung, Moment, Spannung)
- Knickung nach Euler (vier Eulerfälle, Schlankheitsgrad, Sicherheit)
- Torsion & Mindest-Wellendurchmesser

**Verbindungselemente**
- Metrisches ISO-Regelgewinde, Spannungsquerschnitt, Kernloch, Festigkeitsklassen, Anziehdrehmoment
- Passungen aus Abmaßen (Spiel/Übermaß, Passungsart)

**Fertigung**
- Drehen, Fräsen, Bohren: Drehzahl, Vorschubgeschwindigkeit, Hauptzeit, Zeitspanvolumen, Schnittleistung

**Hydraulik & Pneumatik**
- Hydraulikzylinder (Kräfte, Geschwindigkeiten, Leistung)
- Rohrströmung (Geschwindigkeit, Mindestdurchmesser)
- Pneumatik-Luftverbrauch

**Wärme & Werkstoff**
- Wärmeausdehnung, Wärmemenge & Heizleistung
- Masse von Halbzeugen (Rund, Rohr, Flach/Blech, Sechskant, Rechteckrohr)

**Nachschlagen**
- Regelgewinde, Festigkeitsklassen, Werkstoff-Richtwerte, Eulerfälle, Umrechnungen

**Arbeiten mit der App**
- Favoriten (☆ oben rechts in jedem Rechner)
- Projekte: Berechnungen speichern, wieder öffnen, löschen
- PDF jeder Berechnung und Projektberichte – auf iPhone/iPad über das Teilen-Menü, am Computer als Download
- Eingabe mit Präfix (2,5k = 2500), Offline-Betrieb, automatische Updates

## Bewusst nicht enthalten
ISO-Toleranztabellen (Abmaße werden eingegeben), Schnittdaten- und kc-Tabellen, normative Werkstoffkennwerte und
Sicherheitsbeiwerte sowie vollständige Nachweisverfahren (z. B. Schraubenberechnung nach VDI 2230, Wellennachweis nach DIN 743).
Vorbelegte Werkstoff- und Schnittwerte sind als Beispiele bzw. Richtwerte gekennzeichnet.

## Entwicklung
- `mcalc.js`: Rechenlogik · Tests: `node test.mjs`
- `mtools.js`, `mtools2.js`: Rechner · `ui.js`: gemeinsame Bausteine
- `projects.js`: Favoriten, Projekte, Berichte (eigener Speicher-Namensraum `mr:`) · `pdf.js`: PDF-Erzeugung ohne externe Bibliothek
- `app.js`, `index.html`, `style.css`: Startseite, Routing, Darstellung · `install.js`: Installationsanleitung
- `sw.js`: Offline-Cache. **Nach Änderungen `CACHE`-Version erhöhen.**

## Haftung & Lizenz
Kostenloses Hilfsmittel ohne Gewähr; Ergebnisse dienen nur der Orientierung und ersetzen keine Konstruktion, Auslegung oder
Festigkeitsnachweise nach den geltenden Normen durch eine Fachkraft. Lizenz: MIT (siehe `LICENSE`). Built by R. U. Sirius?
