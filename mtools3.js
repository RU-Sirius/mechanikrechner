// Wälzlager, Blechbiegung, Druckfeder, Fertigungskosten
import * as C from "./mcalc.js";
import * as C2 from "./mcalc2.js";
import { calcView, section, segmented, resultRow, PREFIX_HINT } from "./ui.js";

const si = C.si, fmt = C.fmt;

export function bearingView() {
  return calcView({
    init: { kind: "ball", c: "20k", fr: "2k", fa: "0", x: "1", y: "0", n: "1500", hours: "20000" },
    inputs: (s, { field, set }) => [
      ...section("Lager", [segmented([["ball", "Kugellager"], ["roller", "Rollenlager"]], s.kind, (v) => set("kind", v)), field("c", "Dynamische Tragzahl C", "N")]),
      ...section("Belastung", [field("fr", "Radialkraft Fr", "N"), field("fa", "Axialkraft Fa", "N"), field("x", "Radialfaktor X", ""), field("y", "Axialfaktor Y", ""), field("n", "Drehzahl", "1/min")]),
      ...section("Soll-Lebensdauer (optional)", [field("hours", "Gewünschte Lebensdauer", "h")]),
    ],
    compute: (s, p) => {
      const r = C2.bearingLife({ c: p(s.c), fr: p(s.fr), fa: p(s.fa) ?? 0, x: p(s.x), y: p(s.y) ?? 0, kind: s.kind, n: p(s.n) });
      const rows = [resultRow("Äquivalente Last P", si(r.P, "N")), resultRow("Lebensdauerexponent p", s.kind === "roller" ? "10/3" : "3"),
        resultRow("L₁₀", `${fmt(r.l10, 1)} · 10⁶ Umdrehungen`), r.l10h !== undefined ? resultRow("L₁₀h", `${fmt(r.l10h, 0)} h`, "good") : null];
      if (p(s.hours) > 0 && p(s.n) > 0) {
        const cReq = C2.bearingRequiredC({ P: r.P, kind: s.kind, n: p(s.n), hours: p(s.hours) });
        rows.push(resultRow("Erforderliche Tragzahl", si(cReq, "N"), cReq <= p(s.c) ? "good" : "bad"));
      }
      return rows;
    },
    footer: "Nominelle Lebensdauer nach der Grundgleichung (ISO 281): L₁₀ = (C/P)^p, L₁₀h = L₁₀ · 10⁶ / (60 · n), P = X · Fr + Y · Fa. " +
      "C, X und Y aus dem Herstellerkatalog. Ohne Lebensdauerbeiwerte für Zuverlässigkeit, Schmierung und Verschmutzung (a₁, a_ISO). " + PREFIX_HINT,
  });
}

export function bendView() {
  return calcView({
    init: { a: "50", b: "30", s: "2", r: "2", k: "0,4", angle: "90" },
    inputs: (s, { field }) => [
      ...section("Biegeteil (eine Biegung)", [field("a", "Schenkel a (Außenmaß)", "mm"), field("b", "Schenkel b (Außenmaß)", "mm"), field("s", "Blechdicke s", "mm"),
        field("r", "Innenradius r", "mm"), field("angle", "Biegewinkel (Umformwinkel)", "°"), field("k", "k-Faktor (neutrale Faser)", "")]),
    ],
    compute: (s, p) => {
      const r = C2.bendLength({ a: p(s.a), b: p(s.b), s: p(s.s), r: p(s.r), k: p(s.k), angle: p(s.angle) });
      return [resultRow("Gestreckte Länge (Zuschnitt)", `${fmt(r.L, 2)} mm`, "good"), resultRow("Ausgleichswert v", `${fmt(r.v, 2)} mm`),
        resultRow("Bogenlänge neutrale Faser", `${fmt(r.ba, 2)} mm`), resultRow("Radius neutrale Faser", `${fmt(r.rNeutral, 2)} mm`)];
    },
    footer: "L = a + b + v mit v = φ·(r + k·s) − 2·tan(φ/2)·(r + s); a und b bis zum Schnittpunkt der Außenkanten gemessen. Biegewinkel 90° = rechtwinklige Kante. " +
      "Der k-Faktor hängt von Werkstoff, r/s und Biegeverfahren ab – aus Werkzeug-/Herstellerangaben, Probebiegungen oder der Tabelle der Abkantpresse übernehmen; der Vorgabewert ist ein Beispiel.",
  });
}

export function springView() {
  return calcView({
    init: { d: "2", D: "20", n: "8", G: "81500", mode: "F", F: "50", s: "10", tauAllow: "" },
    inputs: (s, { field, set }) => [
      ...section("Druckfeder (Runddraht)", [field("d", "Drahtdurchmesser d", "mm"), field("D", "Mittlerer Windungsdurchmesser D", "mm"),
        field("n", "Federnde Windungen n", ""), field("G", "Schubmodul G", "N/mm²")]),
      ...section("Belastung", [segmented([["F", "Kraft gegeben"], ["s", "Federweg gegeben"]], s.mode, (v) => set("mode", v)),
        s.mode === "F" ? field("F", "Federkraft F", "N") : field("s", "Federweg s", "mm"), field("tauAllow", "Zulässige Schubspannung (optional)", "N/mm²")]),
    ],
    compute: (s, p) => {
      const r = C2.compressionSpring({ d: p(s.d), D: p(s.D), n: p(s.n), G: p(s.G), F: s.mode === "F" ? p(s.F) : null, s: s.mode === "s" ? p(s.s) : null, tauAllow: p(s.tauAllow) });
      return [resultRow("Federrate R", `${fmt(r.R, 3)} N/mm`, "good"), resultRow("Wickelverhältnis w = D/d", fmt(r.w, 2)),
        r.F !== undefined ? resultRow(s.mode === "F" ? "Federweg s" : "Federkraft F", s.mode === "F" ? `${fmt(r.s, 2)} mm` : si(r.F, "N")) : null,
        r.tau !== undefined ? resultRow("Schubspannung τ (unkorrigiert)", `${fmt(r.tau, 0)} N/mm²`, r.ok === undefined ? "" : r.ok ? "good" : "bad") : null,
        r.tauK !== undefined ? resultRow(`Hubspannung τk (k = ${fmt(r.k, 3)})`, `${fmt(r.tauK, 0)} N/mm²`) : null];
    },
    footer: "R = G·d⁴ / (8·D³·n), τ = 8·F·D / (π·d³), Spannungskorrekturfaktor k = (w + 0,5)/(w − 0,75). τ (statisch) und τk (dynamisch) werden " +
      "gegen die zulässigen Werte des Federwerkstoffs geprüft (Datenblatt bzw. DIN EN 13906-1). G ≈ 81 500 N/mm² für Federstahldraht ist ein Richtwert. " +
      "Ohne Prüfung auf Blocklänge und Knickung. " + PREFIX_HINT,
  });
}

export function costView() {
  return calcView({
    init: { tr: "45", th: "3,5", tn: "1", m: "50", rateMachine: "85", rateLabor: "0", material: "4,2" },
    inputs: (s, { field }) => [
      ...section("Zeiten", [field("tr", "Rüstzeit je Los", "min"), field("th", "Hauptzeit je Stück", "min"), field("tn", "Nebenzeit je Stück", "min"), field("m", "Losgröße", "Stk.")]),
      ...section("Kosten", [field("rateMachine", "Maschinenstundensatz", "€/h"), field("rateLabor", "Lohnstundensatz (falls nicht enthalten)", "€/h"), field("material", "Materialkosten je Stück", "€")]),
    ],
    compute: (s, p) => {
      const r = C2.productionCost({ tr: p(s.tr) ?? 0, th: p(s.th), tn: p(s.tn) ?? 0, m: p(s.m), rateMachine: p(s.rateMachine) ?? 0, rateLabor: p(s.rateLabor) ?? 0, material: p(s.material) ?? 0 });
      const eur = (v) => `${fmt(v, 2)} €`;
      return [resultRow("Auftragszeit", `${fmt(r.T, 1)} min (${fmt(r.T / 60, 2)} h)`), resultRow("Zeit je Stück (inkl. Rüstanteil)", `${fmt(r.te, 2)} min`),
        resultRow("Stück je Stunde (ohne Rüsten)", fmt(r.piecesPerHour, 1)), resultRow("Rüstkostenanteil je Stück", eur(r.setupShare)),
        resultRow("Kosten je Stück", eur(r.perPiece), "good"), resultRow("Kosten des Loses", eur(r.total))];
    },
    footer: "Auftragszeit T = tr + m·(th + tn); Stückkosten = T/m · Stundensatz + Material. Hauptzeiten z. B. aus dem Zerspanungsrechner übernehmen. " +
      "Vereinfachte Kalkulation ohne Gemeinkostenzuschläge, Verteilzeiten und Gewinn.",
  });
}
