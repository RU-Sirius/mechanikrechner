// Grundlagen, Antriebe, Festigkeit
import * as C from "./mcalc.js";
import { calcView, section, segmented, selectRow, resultRow, msgRow, PREFIX_HINT } from "./ui.js";

const si = C.si, fmt = C.fmt;
const matOpts = Object.entries(C.MATERIALS).map(([k, v]) => [k, v.name]);
// Werkstoffauswahl, die ein Feld (E, α oder ρ) mit dem Richtwert füllt.
const matRow = (s, set, key, prop, scale = 1) => selectRow("Werkstoff (Richtwert)", matOpts, s.mat, (e) => {
  s.mat = e.target.value; s[key] = String(C.MATERIALS[s.mat][prop] * scale).replace(".", ","); set("mat", s.mat);
});

// ---------- Grundlagen ----------

export function units() {
  const cats = Object.keys(C.UNITS);
  return calcView({
    init: { cat: "Druck / Spannung", from: "bar", x: "1" },
    inputs: (s, { field, set }) => [...section("Umrechnen", [
      selectRow("Größe", [...cats.map((c) => [c, c]), ["Temperatur", "Temperatur"]], s.cat, (e) => {
        s.cat = e.target.value; s.from = s.cat === "Temperatur" ? "°C" : Object.keys(C.UNITS[s.cat].u)[0]; set("cat", s.cat);
      }),
      selectRow("Von Einheit", (s.cat === "Temperatur" ? ["°C", "°F", "K"] : Object.keys(C.UNITS[s.cat].u)).map((u) => [u, u]), s.from, (e) => set("from", e.target.value)),
      field("x", "Wert", s.from),
    ])],
    compute: (s, p) => {
      const x = p(s.x); if (x === null) throw new Error("positive");
      if (s.cat === "Temperatur") {
        const c = s.from === "°C" ? x : s.from === "°F" ? C.celsius.fromF(x) : C.celsius.fromK(x);
        return [resultRow("°C", fmt(c, 4)), resultRow("°F", fmt(C.celsius.toF(c), 4)), resultRow("K", fmt(C.celsius.toK(c), 4))];
      }
      return Object.keys(C.UNITS[s.cat].u).filter((u) => u !== s.from).map((u) => resultRow(u, fmt(C.convert(x, s.cat, s.from, u), 6)));
    },
    footer: "Definierte bzw. exakte Umrechnungsfaktoren (z. B. 1 in = 25,4 mm, 1 lbf = 4,4482216152605 N, 1 PS = 735,49875 W, 1 kp = 9,80665 N).",
  });
}

export function powerTorque() {
  return calcView({
    init: { p: "", m: "50", n: "1450" },
    inputs: (s, { field }) => [...section("Genau zwei Werte eingeben", [field("p", "Leistung P", "W"), field("m", "Drehmoment M", "N·m"), field("n", "Drehzahl n", "1/min")])],
    compute: (s, p) => {
      const r = C.powerTorque({ p: p(s.p), m: p(s.m), n: p(s.n) });
      return [resultRow("Leistung P", si(r.p, "W")), resultRow("Drehmoment M", `${fmt(r.m, 3)} N·m`), resultRow("Drehzahl n", `${fmt(r.n, 1)} 1/min`),
              resultRow("Winkelgeschwindigkeit ω", `${fmt((2 * Math.PI * r.n) / 60, 2)} 1/s`)];
    },
    footer: "P = 2π · n · M / 60 (P in W, M in N·m, n in 1/min). " + PREFIX_HINT,
  });
}

export function lever() {
  return calcView({
    init: { f1: "200", a: "500", b: "100" },
    inputs: (s, { field }) => [...section("Hebel / Momentengleichgewicht", [field("f1", "Kraft F₁", "N"), field("a", "Hebelarm a (zu F₁)", "mm"), field("b", "Hebelarm b (zu F₂)", "mm")])],
    compute: (s, p) => { const r = C.lever({ f1: p(s.f1), a: p(s.a), b: p(s.b) });
      return [resultRow("Kraft F₂", si(r.f2, "N"), "good"), resultRow("Moment", `${fmt(r.m / 1000, 3)} N·m`), resultRow("Übersetzung a/b", fmt(p(s.a) / p(s.b), 3))]; },
    footer: "F₁ · a = F₂ · b. Hebelarme senkrecht zur Kraftrichtung messen; Reibung und Eigengewicht vernachlässigt.",
  });
}

export function motion() {
  return calcView({
    init: { mode: "acc", v0: "0", a: "2", t: "5", v: "100", ab: "8" },
    inputs: (s, { field, set }) => [
      ...section("Berechnung", [segmented([["acc", "Beschleunigen"], ["brake", "Bremsweg"]], s.mode, (v) => set("mode", v))]),
      ...section("Werte", s.mode === "acc" ? [field("v0", "Anfangsgeschwindigkeit v₀", "m/s"), field("a", "Beschleunigung a", "m/s²"), field("t", "Zeit t", "s")]
        : [field("v", "Geschwindigkeit", "km/h"), field("ab", "Verzögerung", "m/s²")]),
    ],
    compute: (s, p) => {
      if (s.mode === "acc") { const r = C.motion({ v0: p(s.v0), a: p(s.a), t: p(s.t) });
        return [resultRow("Endgeschwindigkeit v", `${fmt(r.v, 3)} m/s (${fmt(r.v * 3.6, 2)} km/h)`), resultRow("Weg s", `${fmt(r.s, 3)} m`, "good")]; }
      const r = C.braking({ v: p(s.v) / 3.6, a: p(s.ab) });
      return [resultRow("Bremsweg", `${fmt(r.s, 2)} m`, "good"), resultRow("Bremszeit", `${fmt(r.t, 2)} s`)];
    },
    footer: "Gleichmäßig beschleunigte Bewegung: v = v₀ + a·t, s = v₀·t + ½·a·t². Bremsweg s = v²/(2a) ohne Reaktionszeit.",
  });
}

export function energy() {
  return calcView({
    init: { m: "1000", v: "50", h: "10" },
    inputs: (s, { field }) => [...section("Werte", [field("m", "Masse m", "kg"), field("v", "Geschwindigkeit v", "km/h"), field("h", "Höhe h", "m")])],
    compute: (s, p) => { const r = C.energy({ m: p(s.m), v: (p(s.v) ?? 0) / 3.6, h: p(s.h) ?? 0 });
      return [resultRow("Kinetische Energie ½·m·v²", si(r.ekin, "J")), resultRow("Potenzielle Energie m·g·h", si(r.epot, "J")), resultRow("Summe", si(r.ekin + r.epot, "J"), "good")]; },
    footer: "g = 9,80665 m/s² (Normfallbeschleunigung). " + PREFIX_HINT,
  });
}

// ---------- Antriebe ----------

export function gearRatio() {
  return calcView({
    init: { z1: "20", z2: "60", n1: "1450", m1: "50", eta: "0,98" },
    inputs: (s, { field }) => [...section("Zahnrad- / Getriebestufe", [field("z1", "Zähnezahl Antrieb z₁", ""), field("z2", "Zähnezahl Abtrieb z₂", ""),
      field("n1", "Antriebsdrehzahl n₁", "1/min"), field("m1", "Antriebsmoment M₁", "N·m"), field("eta", "Wirkungsgrad η", "")])],
    compute: (s, p) => { const r = C.gearTrain({ z1: p(s.z1), z2: p(s.z2), n1: p(s.n1), m1: p(s.m1), eta: p(s.eta) ?? 1 });
      return [resultRow("Übersetzung i = z₂/z₁", fmt(r.i, 4), "good"), resultRow("Abtriebsdrehzahl n₂", `${fmt(r.n2, 1)} 1/min`),
              r.m2 !== null ? resultRow("Abtriebsmoment M₂", `${fmt(r.m2, 2)} N·m`) : null]; },
    footer: "i = z₂/z₁ = n₁/n₂; M₂ = M₁ · i · η. Für Riementriebe gilt dasselbe mit den Durchmessern (eigener Rechner).",
  });
}

export function spurGear() {
  return calcView({
    init: { m: "2", z1: "20", z2: "60" },
    inputs: (s, { field }) => [...section("Gerad-Stirnradpaar", [field("m", "Modul m", "mm"), field("z1", "Zähnezahl z₁", ""), field("z2", "Zähnezahl z₂", "")])],
    compute: (s, p) => { const r = C.spurGear({ m: p(s.m), z1: p(s.z1), z2: p(s.z2) }); const mm = (x) => `${fmt(x, 3)} mm`;
      return [resultRow("Teilkreis d₁ / d₂", `${mm(r.g1.d)} / ${mm(r.g2.d)}`), resultRow("Kopfkreis da₁ / da₂", `${mm(r.g1.da)} / ${mm(r.g2.da)}`),
              resultRow("Fußkreis df₁ / df₂", `${mm(r.g1.df)} / ${mm(r.g2.df)}`), resultRow("Achsabstand a", mm(r.a), "good"),
              resultRow("Teilung p = π·m", mm(r.p)), resultRow("Zahnhöhe h", mm(r.h)), resultRow("Übersetzung i", fmt(r.i, 4))]; },
    footer: "Außenverzahnung ohne Profilverschiebung, Bezugsprofil mit Kopfhöhe 1·m und Fußhöhe 1,25·m (Kopfspiel 0,25·m).",
  });
}

export function beltDrive() {
  return calcView({
    init: { d1: "100", d2: "250", n1: "1450", a: "500" },
    inputs: (s, { field }) => [...section("Riementrieb (offen)", [field("d1", "Durchmesser treibend d₁", "mm"), field("d2", "Durchmesser getrieben d₂", "mm"),
      field("n1", "Drehzahl n₁", "1/min"), field("a", "Achsabstand a", "mm")])],
    compute: (s, p) => { const r = C.beltDrive({ d1: p(s.d1), d2: p(s.d2), n1: p(s.n1), a: p(s.a) });
      return [resultRow("Übersetzung i", fmt(r.i, 4)), resultRow("Drehzahl n₂", `${fmt(r.n2, 1)} 1/min`, "good"), resultRow("Riemengeschwindigkeit v", `${fmt(r.v, 2)} m/s`),
              r.l ? resultRow("Riemenlänge (Näherung)", `${fmt(r.l, 1)} mm`) : null]; },
    footer: "Ohne Schlupf. Bei Keilriemen mit Wirkdurchmessern rechnen. Länge L ≈ 2a + π/2·(d₁+d₂) + (d₂−d₁)²/(4a); Normlänge nach Herstellerkatalog wählen.",
  });
}

export function hoist() {
  return calcView({
    init: { m: "1000", v: "0,5", eta: "0,85" },
    inputs: (s, { field }) => [...section("Hubantrieb", [field("m", "Last (inkl. Lastaufnahme)", "kg"), field("v", "Hubgeschwindigkeit", "m/s"), field("eta", "Gesamtwirkungsgrad η", "")])],
    compute: (s, p) => { const r = C.hoist({ m: p(s.m), v: p(s.v), eta: p(s.eta) ?? 1 });
      return [resultRow("Gewichtskraft", si(r.f, "N")), resultRow("Erforderliche Motorleistung", si(r.p, "W"), "good")]; },
    rangeMsg: "Der Wirkungsgrad muss zwischen 0 und 1 liegen.",
    footer: "Stationäres Heben: P = m·g·v/η. Beschleunigungsleistung, Anlaufmoment und Sicherheitsfaktoren nach geltenden Regeln zusätzlich berücksichtigen.",
  });
}

// ---------- Festigkeit ----------

const SHAPES = [["rect", "Rechteck (b × h)"], ["round", "Rund (voll)"], ["tube", "Rohr (rund)"], ["rtube", "Rechteckrohr (b × h × t)"]];
const shapeFields = (s, field) => s.shape === "rect" ? [field("b", "Breite b", "mm"), field("h", "Höhe h (in Lastrichtung)", "mm")]
  : s.shape === "round" ? [field("d", "Durchmesser d", "mm")]
  : s.shape === "tube" ? [field("d", "Außendurchmesser D", "mm"), field("di", "Innendurchmesser d", "mm")]
  : [field("b", "Breite b", "mm"), field("h", "Höhe h (in Lastrichtung)", "mm"), field("t", "Wandstärke t", "mm")];
const propsOf = (s, p) => C.sectionProps({ shape: s.shape, b: p(s.b), h: p(s.h), d: p(s.d), di: p(s.di) ?? 0, t: p(s.t) });

export function sectionView() {
  return calcView({
    init: { shape: "rect", b: "40", h: "80", d: "40", di: "30", t: "4" },
    inputs: (s, { field, set }) => [...section("Querschnitt", [selectRow("Form", SHAPES, s.shape, (e) => set("shape", e.target.value)), ...shapeFields(s, field)])],
    compute: (s, p) => { const r = propsOf(s, p);
      return [resultRow("Fläche A", `${fmt(r.A, 2)} mm²`), resultRow("Flächenträgheitsmoment I", `${fmt(r.I, 0)} mm⁴`, "good"), resultRow("Widerstandsmoment W", `${fmt(r.W, 1)} mm³`),
              r.Wp ? resultRow("Polares Widerstandsmoment Wp", `${fmt(r.Wp, 1)} mm³`) : null, r.Ip ? resultRow("Polares Trägheitsmoment Ip", `${fmt(r.Ip, 0)} mm⁴`) : null,
              resultRow("Trägheitsradius i", `${fmt(r.i, 2)} mm`)]; },
    rangeMsg: "Innenmaß bzw. Wandstärke passen nicht zum Außenmaß.",
    footer: "Biegung um die Achse senkrecht zur Höhe h. Ideale Geometrie ohne Radien (bei Walz- und Rohrprofilen Katalogwerte bevorzugen).",
  });
}

export function stressView() {
  return calcView({
    init: { f: "10k", a: "78,54" },
    inputs: (s, { field }) => [...section("Zug / Druck / Scherung / Flächenpressung", [field("f", "Kraft F", "N"), field("a", "Fläche A", "mm²")])],
    compute: (s, p) => [resultRow("Spannung σ bzw. τ bzw. p = F/A", `${fmt(C.stress({ f: p(s.f), a: p(s.a) }), 2)} N/mm²`, "good")],
    footer: "Mittlere Spannung, Kerbwirkung nicht berücksichtigt. Zulässige Werte aus Werkstoffkennwerten und Sicherheitsbeiwerten nach Regelwerk ermitteln. " + PREFIX_HINT,
  });
}

export function beamView() {
  return calcView({
    init: { kind: "cantF", f: "5k", q: "2", l: "2000", e: "210000", mat: "steel", shape: "rect", b: "40", h: "80", d: "40", di: "30", t: "4" },
    inputs: (s, { field, set }) => [
      ...section("Lagerung & Last", [selectRow("Fall", Object.entries(C.BEAM_CASES), s.kind, (e) => set("kind", e.target.value)),
        s.kind.endsWith("F") ? field("f", "Einzellast F", "N") : field("q", "Streckenlast q", "N/mm"), field("l", "Länge L", "mm")]),
      ...section("Werkstoff", [matRow(s, set, "e", "e"), field("e", "E-Modul", "N/mm²")]),
      ...section("Querschnitt", [selectRow("Form", SHAPES, s.shape, (e) => set("shape", e.target.value)), ...shapeFields(s, field)]),
    ],
    compute: (s, p) => { const sp = propsOf(s, p); const r = C.beam({ kind: s.kind, f: p(s.f), q: p(s.q), l: p(s.l), e: p(s.e), i: sp.I, w: sp.W });
      return [resultRow("Max. Durchbiegung f", `${fmt(r.f, 3)} mm`, "good"), resultRow("Max. Biegemoment", `${fmt(r.m / 1000, 2)} N·m`),
              resultRow("Max. Biegespannung σ", `${fmt(r.sigma, 1)} N/mm²`), resultRow("Durchbiegung / Länge", `1 : ${fmt(p(s.l) / r.f, 0)}`)]; },
    footer: "Linear-elastisch, kleine Verformungen, Eigengewicht nicht enthalten (ggf. als Streckenlast addieren). E-Modul-Richtwerte sind Annahmen. " + PREFIX_HINT,
  });
}

export function eulerView() {
  return calcView({
    init: { beta: "0.7", l: "2000", e: "210000", mat: "steel", shape: "round", b: "40", h: "40", d: "40", di: "30", t: "4", f: "", re: "" },
    inputs: (s, { field, set }) => [
      ...section("Stab", [selectRow("Eulerfall", C.EULER_CASES, s.beta, (e) => set("beta", e.target.value)), field("l", "Stablänge L", "mm")]),
      ...section("Werkstoff", [matRow(s, set, "e", "e"), field("e", "E-Modul", "N/mm²"), field("re", "Streckgrenze Re (optional)", "N/mm²")]),
      ...section("Querschnitt", [selectRow("Form", SHAPES, s.shape, (e) => set("shape", e.target.value)), ...shapeFields(s, field)]),
      ...section("Prüfen (optional)", [field("f", "Vorhandene Druckkraft", "N")]),
    ],
    compute: (s, p) => { const sp = propsOf(s, p); const r = C.euler({ e: p(s.e), i: sp.I, a: sp.A, l: p(s.l), beta: Number(s.beta) });
      const rows = [resultRow("Knicklänge lk", `${fmt(r.lk, 0)} mm`), resultRow("Schlankheitsgrad λ", fmt(r.lambda, 1)), resultRow("Knickkraft Fk (Euler)", si(r.fk, "N"), "good"),
                    resultRow("Knickspannung σk", `${fmt(r.sigmaK, 1)} N/mm²`)];
      const re = p(s.re); if (re) rows.push(r.sigmaK < re ? msgRow("σk liegt unter Re – Euler-Bereich plausibel (Proportionalitätsgrenze beachten).") : msgRow("σk ≥ Re: Euler gilt hier nicht, unelastisches Knicken (z. B. Tetmajer) maßgeblich.", "error"));
      const f = p(s.f); if (f) rows.push(resultRow("Sicherheit gegen Knicken Fk/F", fmt(r.fk / f, 2), r.fk / f >= 1 ? "good" : "bad"));
      return rows; },
    footer: "Fk = π²·E·I / lk². Nur gültig für schlanke Stäbe im elastischen Bereich. Kleinstes I des Querschnitts verwenden; erforderliche Sicherheit nach Regelwerk.",
  });
}

export function torsionView() {
  return calcView({
    init: { t: "500", d: "40", di: "0", l: "1000", g: "81000", tau: "60" },
    inputs: (s, { field }) => [...section("Welle", [field("t", "Torsionsmoment T", "N·m"), field("d", "Außendurchmesser D", "mm"), field("di", "Innendurchmesser (0 = Vollwelle)", "mm"),
      field("l", "Länge L", "mm"), field("g", "Schubmodul G", "N/mm²"), field("tau", "Zulässige Schubspannung τzul", "N/mm²")])],
    compute: (s, p) => { const t = p(s.t) * 1000; const r = C.torsion({ t, d: p(s.d), di: p(s.di) ?? 0, l: p(s.l), g: p(s.g) });
      const rows = [resultRow("Torsionsspannung τ", `${fmt(r.tau, 2)} N/mm²`, p(s.tau) ? (r.tau <= p(s.tau) ? "good" : "bad") : ""), resultRow("Verdrehwinkel φ", `${fmt(r.phiDeg, 3)}°`),
                    resultRow("Polares Widerstandsmoment Wp", `${fmt(r.wp, 1)} mm³`)];
      if (p(s.tau)) rows.push(resultRow("Min. Vollwellendurchmesser", `${fmt(C.shaftMinDiameter({ t, tauAllow: p(s.tau) }), 2)} mm`));
      return rows; },
    rangeMsg: "Innendurchmesser muss kleiner als der Außendurchmesser sein.",
    footer: "Reine Torsion ohne Biegung, Kerben (Passfedernut) und dynamische Beanspruchung. G = 81 000 N/mm² ist ein Richtwert für Stahl (Annahme); τzul nach Regelwerk.",
  });
}
