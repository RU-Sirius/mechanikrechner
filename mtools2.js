// Verbindungen, Fertigung, Fluidtechnik, Wärme & Werkstoff, Tabellen
import * as C from "./mcalc.js";
import { calcView, section, segmented, selectRow, resultRow, msgRow, PREFIX_HINT } from "./ui.js";

const si = C.si, fmt = C.fmt;
const matOpts = Object.entries(C.MATERIALS).map(([k, v]) => [k, v.name]);
const matRow = (s, set, key, prop, scale = 1) => selectRow("Werkstoff (Richtwert)", matOpts, s.mat, (e) => {
  s.mat = e.target.value; s[key] = String(+(C.MATERIALS[s.mat][prop] * scale).toPrecision(6)).replace(".", ","); set("mat", s.mat);
});
const threadOpts = C.METRIC_COARSE.map(([d, p]) => [String(d), `M${String(d).replace(".", ",")} (P = ${String(p).replace(".", ",")} mm)`]);
const pitchOf = (d) => C.METRIC_COARSE.find(([x]) => String(x) === String(d))[1];
const CLASSES = ["4.6", "5.6", "8.8", "10.9", "12.9"].map((c) => [c, c.replace(".", ",")]);

// ---------- Verbindungen ----------

export function bolt() {
  return calcView({
    init: { d: "10", cls: "8.8", fm: "", muG: "0,12", muK: "0,12", dkm: "" },
    inputs: (s, { field, set }) => [
      ...section("Schraube", [selectRow("Regelgewinde", threadOpts, s.d, (e) => set("d", e.target.value)), selectRow("Festigkeitsklasse", CLASSES, s.cls, (e) => set("cls", e.target.value))]),
      ...section("Anziehdrehmoment (optional)", [field("fm", "Montagevorspannkraft FM", "N"), field("muG", "Reibungszahl Gewinde μG", ""),
        field("muK", "Reibungszahl Kopfauflage μK", ""), field("dkm", "Wirksamer Reibdurchmesser Kopf Dkm", "mm")]),
    ],
    compute: (s, p) => {
      const d = Number(s.d), P = pitchOf(s.d), t = C.thread({ d, p: P }), k = C.boltClass(s.cls);
      const rows = [resultRow("Steigung P", `${fmt(P, 2)} mm`), resultRow("Flankendurchmesser d₂", `${fmt(t.d2, 3)} mm`), resultRow("Kerndurchmesser d₃", `${fmt(t.d3, 3)} mm`),
        resultRow("Spannungsquerschnitt As", `${fmt(t.as, 1)} mm²`), resultRow("Kernlochbohrung (≈ d − P)", `${fmt(t.drill, 2)} mm`, "good"),
        resultRow(`Rm / Re (Nennwerte ${s.cls.replace(".", ",")})`, `${k.rm} / ${k.re} N/mm²`), resultRow("Kraft bei Streckgrenze Re·As", si(k.re * t.as, "N"))];
      const fm = p(s.fm), dkm = p(s.dkm);
      if (fm && dkm) rows.push(resultRow("Anziehdrehmoment MA", `${fmt(C.tighteningTorque({ fm, p: P, d2: t.d2, muG: p(s.muG), muK: p(s.muK), dkm }) / 1000, 1)} N·m`, "good"));
      else rows.push(msgRow("Für MA: Vorspannkraft FM und Dkm eingeben (Dkm ≈ Mittel aus Kopfauflage-Außendurchmesser und Bohrungsdurchmesser)."));
      return rows;
    },
    footer: "Gewindegeometrie nach ISO 724/ISO 898-1 (As = π/4·((d₂+d₃)/2)²). Rm/Re sind die aus der Klassenbezeichnung folgenden Nennwerte. " +
            "MA = FM·(0,16·P + 0,58·d₂·μG + μK·Dkm/2) nach dem Ansatz der VDI 2230 – Reibungszahlen stark schmierungs- und oberflächenabhängig. " +
            "Herstellerangaben und vollständige Schraubenberechnung haben Vorrang. " + PREFIX_HINT,
  });
}

export function fitView() {
  return calcView({
    init: { nom: "40", ES: "25", EI: "0", es: "-25", ei: "-41" },
    inputs: (s, { field }) => [
      ...section("Nennmaß", [field("nom", "Nennmaß", "mm")]),
      ...section("Bohrung (Abmaße)", [field("ES", "Oberes Abmaß ES", "µm"), field("EI", "Unteres Abmaß EI", "µm")]),
      ...section("Welle (Abmaße)", [field("es", "Oberes Abmaß es", "µm"), field("ei", "Unteres Abmaß ei", "µm")]),
    ],
    compute: (s, p) => {
      const r = C.fit({ ES: p(s.ES), EI: p(s.EI), es: p(s.es), ei: p(s.ei) }), n = p(s.nom) ?? 0, mm = (x) => `${fmt(n + x / 1000, 3)} mm`;
      return [resultRow("Passungsart", r.kind, "good"), resultRow(r.max >= 0 ? "Höchstspiel" : "Mindestübermaß", `${fmt(Math.abs(r.max), 1)} µm`),
              resultRow(r.min >= 0 ? "Mindestspiel" : "Höchstübermaß", `${fmt(Math.abs(r.min), 1)} µm`),
              resultRow("Bohrung min … max", `${mm(p(s.EI))} … ${mm(p(s.ES))}`), resultRow("Welle min … max", `${mm(p(s.ei))} … ${mm(p(s.es))}`)];
    },
    rangeMsg: "Oberes Abmaß muss ≥ unteres Abmaß sein.",
    footer: "Abmaße aus den ISO-Toleranztabellen (ISO 286) für Nennmaß und Toleranzklasse eintragen – die Tabellen sind in der App nicht enthalten. Die Vorgabewerte sind Beispiele.",
  });
}

// ---------- Fertigung ----------

export function machining() {
  return calcView({
    init: { mode: "turn", vc: "200", d: "50", f: "0,2", ap: "2", ae: "2", fz: "0,05", z: "4", l: "100", kc: "" },
    inputs: (s, { field, set }) => [
      ...section("Verfahren", [segmented([["turn", "Drehen"], ["mill", "Fräsen"], ["drill", "Bohren"]], s.mode, (v) => {
        Object.assign(s, v === "turn" ? { vc: "200", d: "50" } : v === "mill" ? { vc: "120", d: "16", ap: "8" } : { vc: "25", d: "10", f: "0,15" }); set("mode", v); })]),
      ...section("Schnittwerte (Werkzeughersteller)", [field("vc", "Schnittgeschwindigkeit vc", "m/min"), field("d", s.mode === "turn" ? "Werkstückdurchmesser d" : "Werkzeugdurchmesser d", "mm"),
        ...(s.mode === "mill" ? [field("fz", "Vorschub je Zahn fz", "mm"), field("z", "Zähnezahl z", "")] : [field("f", "Vorschub je Umdrehung f", "mm")]),
        ...(s.mode !== "drill" ? [field("ap", "Schnitttiefe ap", "mm")] : []), ...(s.mode === "mill" ? [field("ae", "Arbeitseingriff ae", "mm")] : []),
        field("l", "Vorschubweg L", "mm"), ...(s.mode !== "drill" ? [field("kc", "Spezifische Schnittkraft kc (optional)", "N/mm²")] : [])]),
    ],
    compute: (s, p) => {
      const base = { vc: p(s.vc), d: p(s.d), l: p(s.l), kc: p(s.kc) };
      const r = s.mode === "turn" ? C.turning({ ...base, f: p(s.f), ap: p(s.ap) }) : s.mode === "mill" ? C.milling({ ...base, fz: p(s.fz), z: p(s.z), ap: p(s.ap), ae: p(s.ae) })
        : C.drilling({ ...base, f: p(s.f) });
      return [resultRow("Drehzahl n", `${fmt(r.n, 0)} 1/min`, "good"), resultRow("Vorschubgeschwindigkeit vf", `${fmt(r.vf, 1)} mm/min`),
              r.th ? resultRow("Hauptzeit th", `${fmt(r.th, 2)} min (${fmt(r.th * 60, 0)} s)`) : null,
              r.q !== undefined ? resultRow("Zeitspanvolumen Q", `${fmt(r.q, 2)} cm³/min`) : null, r.pc ? resultRow("Schnittleistung Pc", si(r.pc, "W")) : null];
    },
    footer: "n = vc·1000/(π·d); Drehen/Bohren vf = f·n, Fräsen vf = fz·z·n; Q (Drehen) = vc·f·ap, Q (Fräsen) = ap·ae·vf/1000; Pc = kc·Q/60. " +
            "Die Vorgabewerte sind Beispiele – Schnittdaten und kc aus den Tabellen des Werkzeugherstellers für Werkstoff und Werkzeug wählen. Antriebswirkungsgrad nicht enthalten.",
  });
}

// ---------- Fluidtechnik ----------

export function cylinderView() {
  return calcView({
    init: { D: "63", dr: "36", p: "100", q: "20", eta: "1" },
    inputs: (s, { field }) => [...section("Hydraulikzylinder (doppeltwirkend)", [field("D", "Kolbendurchmesser D", "mm"), field("dr", "Stangendurchmesser d", "mm"),
      field("p", "Druck p", "bar"), field("q", "Volumenstrom Q", "l/min"), field("eta", "Wirkungsgrad (Reibung)", "")])],
    compute: (s, p) => { const r = C.cylinder({ D: p(s.D), dr: p(s.dr), p: p(s.p), q: p(s.q), eta: p(s.eta) ?? 1 });
      return [resultRow("Kraft ausfahren", si(r.fOut, "N"), "good"), resultRow("Kraft einfahren", si(r.fIn, "N")), resultRow("Kolben- / Ringfläche", `${fmt(r.ak, 0)} / ${fmt(r.ar, 0)} mm²`),
              resultRow("Flächenverhältnis φ", fmt(r.phi, 3)), r.vOut ? resultRow("Geschwindigkeit aus / ein", `${fmt(r.vOut, 3)} / ${fmt(r.vIn, 3)} m/s`) : null,
              r.power ? resultRow("Hydraulische Leistung p·Q", si(r.power, "W")) : null]; },
    rangeMsg: "Stangendurchmesser muss kleiner als der Kolbendurchmesser sein.",
    footer: "Statische Kräfte ohne Gegendruck auf der Rückseite; Leckage nicht berücksichtigt. Knicksicherheit der Kolbenstange separat prüfen (Euler-Rechner).",
  });
}

export function pipeView() {
  return calcView({
    init: { q: "20", di: "12", vmax: "" },
    inputs: (s, { field }) => [...section("Rohrleitung", [field("q", "Volumenstrom Q", "l/min"), field("di", "Innendurchmesser", "mm"), field("vmax", "Zul. Strömungsgeschwindigkeit (optional)", "m/s")])],
    compute: (s, p) => { const r = C.pipeFlow({ q: p(s.q), di: p(s.di), vMax: p(s.vmax) });
      return [r.v !== undefined ? resultRow("Strömungsgeschwindigkeit", `${fmt(r.v, 2)} m/s`, "good") : null,
              r.diMin !== undefined ? resultRow("Min. Innendurchmesser", `${fmt(r.diMin, 2)} mm`) : null]; },
    footer: "v = Q/A. Zulässige Geschwindigkeiten (Saug-, Druck-, Rücklauf) nach Herstellerangaben bzw. Auslegungsrichtlinien wählen.",
  });
}

export function pneumaticView() {
  return calcView({
    init: { D: "50", dr: "20", s: "200", p: "6", cycles: "10" },
    inputs: (s, { field }) => [...section("Pneumatikzylinder (doppeltwirkend)", [field("D", "Kolbendurchmesser D", "mm"), field("dr", "Stangendurchmesser d", "mm"),
      field("s", "Hub s", "mm"), field("p", "Betriebsdruck (Überdruck)", "bar"), field("cycles", "Doppelhübe pro Minute", "1/min")])],
    compute: (s, p) => { const r = C.pneumatic({ D: p(s.D), dr: p(s.dr), s: p(s.s), p: p(s.p), cycles: p(s.cycles) });
      return [resultRow("Luftverbrauch je Doppelhub", `${fmt(r.perCycle, 2)} Nl`), r.perMin ? resultRow("Luftverbrauch", `${fmt(r.perMin, 1)} Nl/min`, "good") : null,
              resultRow("Theor. Kraft aus / ein", `${si(r.fOut, "N")} / ${si(r.fIn, "N")}`)]; },
    rangeMsg: "Stangendurchmesser muss kleiner als der Kolbendurchmesser sein.",
    footer: "V = (A_K + A_R)·s·(p_e + p_amb)/p_amb mit p_amb = 1,013 bar; ohne Schlauch-/Totvolumen und Leckage. Kräfte ohne Reibung.",
  });
}

// ---------- Wärme & Werkstoff ----------

export function thermalView() {
  return calcView({
    init: { mat: "steel", alpha: "0,000012", l: "1000", dT: "80" },
    inputs: (s, { field, set }) => [...section("Längenausdehnung", [matRow(s, set, "alpha", "alpha"), field("alpha", "Ausdehnungskoeffizient α", "1/K"),
      field("l", "Länge L", "mm"), field("dT", "Temperaturänderung ΔT", "K")])],
    compute: (s, p) => [resultRow("Längenänderung ΔL", `${fmt(C.thermalExpansion({ alpha: p(s.alpha), l: p(s.l), dT: p(s.dT) }), 4)} mm`, "good")],
    footer: "ΔL = α·L·ΔT, linear. α-Richtwerte sind Annahmen (legierungs- und temperaturabhängig).",
  });
}

export function heatView() {
  return calcView({
    init: { m: "10", c: "4190", dT: "60", t: "600" },
    inputs: (s, { field }) => [...section("Erwärmen", [field("m", "Masse m", "kg"), field("c", "Spez. Wärmekapazität c", "J/(kg·K)"), field("dT", "Temperaturänderung ΔT", "K"), field("t", "Zeit (optional)", "s")])],
    compute: (s, p) => { const r = C.heat({ m: p(s.m), c: p(s.c), dT: p(s.dT), t: p(s.t) });
      return [resultRow("Wärmemenge Q", `${si(r.q, "J")} (${fmt(r.q / 3.6e6, 3)} kWh)`, "good"), r.p ? resultRow("Erforderliche Leistung", si(r.p, "W")) : null]; },
    footer: "Q = m·c·ΔT, ohne Verluste. c ≈ 4190 J/(kg·K) für Wasser bei Raumtemperatur (Richtwert). " + PREFIX_HINT,
  });
}

const MASS_SHAPES = [["round", "Rundstab"], ["tube", "Rundrohr"], ["flat", "Flach / Blech (b × h)"], ["hex", "Sechskant (SW)"], ["rtube", "Rechteckrohr"]];
export function massView() {
  return calcView({
    init: { shape: "round", d: "40", di: "30", b: "40", h: "10", t: "3", length: "1", mat: "steel", rho: "7850", n: "1" },
    inputs: (s, { field, set }) => [
      ...section("Halbzeug", [selectRow("Form", MASS_SHAPES, s.shape, (e) => set("shape", e.target.value)),
        ...(s.shape === "round" ? [field("d", "Durchmesser", "mm")] : s.shape === "tube" ? [field("d", "Außendurchmesser", "mm"), field("di", "Innendurchmesser", "mm")]
          : s.shape === "hex" ? [field("d", "Schlüsselweite", "mm")] : s.shape === "flat" ? [field("b", "Breite", "mm"), field("h", "Dicke", "mm")]
          : [field("b", "Breite", "mm"), field("h", "Höhe", "mm"), field("t", "Wandstärke", "mm")]),
        field("length", "Länge", "m"), field("n", "Stückzahl", "Stk.")]),
      ...section("Werkstoff", [matRow(s, set, "rho", "rho"), field("rho", "Dichte ρ", "kg/m³")]),
    ],
    compute: (s, p) => { const r = C.profileMass({ shape: s.shape, d: p(s.d), di: p(s.di), b: p(s.b), h: p(s.h), t: p(s.t), length: p(s.length), rho: p(s.rho) }); const n = p(s.n) ?? 1;
      return [resultRow("Querschnitt", `${fmt(r.area, 1)} mm²`), resultRow("Masse je Meter", `${fmt(r.perMeter, 3)} kg/m`), resultRow("Masse je Stück", `${fmt(r.kg, 3)} kg`),
              resultRow(`Gesamtmasse (${fmt(n, 0)} Stk.)`, `${fmt(r.kg * n, 3)} kg`, "good")]; },
    rangeMsg: "Innenmaß bzw. Wandstärke passen nicht zum Außenmaß.",
    footer: "Ideale Geometrie ohne Kantenradien und Toleranzen; Dichte-Richtwerte sind Annahmen (legierungsabhängig).",
  });
}

// ---------- Tabellen ----------

export function tables() {
  const tbl = (title, rows, footer) => section(title, rows.map(([a, b]) => resultRow(a, b)), footer);
  return [
    ...tbl("Metrisches ISO-Regelgewinde", C.METRIC_COARSE.map(([d, P]) => { const t = C.thread({ d, p: P });
      return [`M${fmt(d, 1)}`, `P ${fmt(P, 2)} · Kernloch ${fmt(t.drill, 2)} · As ${fmt(t.as, 1)} mm²`]; }), "Kernlochbohrung ≈ d − P (Richtwert); As berechnet nach ISO 898-1."),
    ...tbl("Festigkeitsklassen Schrauben (Nennwerte)", CLASSES.map(([c]) => { const k = C.boltClass(c); return [c.replace(".", ","), `Rm ${k.rm} · Re ${k.re} N/mm²`]; }),
      "Aus der Klassenbezeichnung: Rm = 1. Zahl × 100, Re = Rm × 2. Zahl / 10. Normative Mindestwerte können je nach Durchmesser abweichen (ISO 898-1)."),
    ...tbl("Werkstoff-Richtwerte (Annahme)", Object.values(C.MATERIALS).map((m) => [m.name, `ρ ${fmt(m.rho, 0)} kg/m³ · E ${fmt(m.e / 1000, 0)} GPa · α ${fmt(m.alpha * 1e6, 1)}·10⁻⁶/K`]),
      "Typische Werte bei Raumtemperatur; je nach Legierung und Zustand abweichend – für Nachweise Werkstoffdatenblätter verwenden."),
    ...tbl("Eulerfälle (Knicklängenbeiwert β)", C.EULER_CASES.map(([b, t]) => [t.split(":")[0], t.split(":")[1].trim()])),
    ...tbl("Umrechnungen (exakt bzw. definiert)", [["1 bar", "0,1 N/mm² = 10⁵ Pa"], ["1 N/mm²", "1 MPa = 10 bar"], ["1 kp", "9,80665 N"], ["1 PS", "735,49875 W"],
      ["1 in", "25,4 mm"], ["1 lbf", "4,4482216152605 N"], ["1 psi", "≈ 0,0689476 bar"], ["1 kWh", "3,6 MJ"]]),
  ];
}
