// Rechenlogik MechanikRechner. Einheiten intern: N, mm, N/mm² (= MPa), s – außer wo angegeben.

const SI_FACTORS = { p: 1e-12, n: 1e-9, u: 1e-6, "µ": 1e-6, m: 1e-3, k: 1e3, M: 1e6, G: 1e9 };
// Zahl mit Dezimalkomma/-punkt und optionalem SI-Präfix, z. B. "4,7k", "2,5M".
export function parse(text) {
  const s = String(text ?? "").trim().replace(",", ".");
  if (s === "") return null;
  const m = s.match(/^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)\s*([pnuµmkMG])?$/);
  if (!m) return null;
  const v = Number(m[1]) * (m[2] ? SI_FACTORS[m[2]] : 1);
  return Number.isFinite(v) ? v : null;
}
export function si(value, unit) {
  if (!Number.isFinite(value) || value === 0) return `${fmt(value, 4)} ${unit}`;
  const prefixes = { "-12": "p", "-9": "n", "-6": "µ", "-3": "m", 0: "", 3: "k", 6: "M", 9: "G", 12: "T" };
  let exp = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
  exp = Math.min(Math.max(exp, -12), 12);
  return `${Number((value / 10 ** exp).toPrecision(4)).toLocaleString("de-DE")} ${prefixes[exp]}${unit}`;
}
export const fmt = (value, maxDigits = 2) => value.toLocaleString("de-DE", { maximumFractionDigits: maxDigits });

const pos = (...v) => { if (!v.every((x) => x !== null && x !== undefined && x > 0 && Number.isFinite(x))) throw new Error("positive"); };
const num = (...v) => { if (!v.every((x) => x !== null && x !== undefined && Number.isFinite(x))) throw new Error("positive"); };
export const G_N = 9.80665; // Normfallbeschleunigung in m/s²

// ---------- Einheiten (exakte bzw. definierte Umrechnungsfaktoren) ----------
export const UNITS = {
  "Länge": { base: "m", u: { mm: 1e-3, cm: 1e-2, m: 1, km: 1e3, "µm": 1e-6, "in (Zoll)": 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 } },
  "Kraft": { base: "N", u: { N: 1, kN: 1e3, MN: 1e6, kp: 9.80665, lbf: 4.4482216152605 } },
  "Druck / Spannung": { base: "Pa", u: { Pa: 1, kPa: 1e3, MPa: 1e6, "N/mm²": 1e6, bar: 1e5, mbar: 100, psi: 6894.757293168, "kp/cm²": 98066.5, atm: 101325 } },
  "Drehmoment": { base: "N·m", u: { "N·m": 1, "N·mm": 1e-3, "kN·m": 1e3, "kp·m": 9.80665, "lbf·ft": 1.3558179483314, "lbf·in": 0.1129848290276 } },
  "Leistung": { base: "W", u: { W: 1, kW: 1e3, MW: 1e6, "PS": 735.49875, "hp (mech.)": 745.69987158227 } },
  "Energie / Arbeit": { base: "J", u: { J: 1, kJ: 1e3, MJ: 1e6, Wh: 3600, kWh: 3.6e6, "kcal (IT)": 4186.8, "N·m": 1 } },
  "Masse": { base: "kg", u: { g: 1e-3, kg: 1, t: 1e3, lb: 0.45359237, oz: 0.028349523125 } },
  "Volumen": { base: "m³", u: { "mm³": 1e-9, "cm³": 1e-6, "dm³ = l": 1e-3, "m³": 1, "gal (US)": 0.003785411784 } },
  "Geschwindigkeit": { base: "m/s", u: { "m/s": 1, "km/h": 1 / 3.6, "m/min": 1 / 60, "mph": 0.44704, "ft/min": 0.00508 } },
};
export function convert(value, cat, from, to) {
  num(value);
  const c = UNITS[cat];
  return (value * c.u[from]) / c.u[to];
}
export const celsius = { toF: (c) => c * 9 / 5 + 32, toK: (c) => c + 273.15, fromF: (f) => (f - 32) * 5 / 9, fromK: (k) => k - 273.15 };

// ---------- Grundlagen ----------
// P = 2π·n·M/60 (P in W, M in N·m, n in 1/min) – aus genau zwei Größen die dritte.
export function powerTorque({ p = null, m = null, n = null }) {
  const given = [p, m, n].filter((x) => x !== null);
  if (given.length !== 2) throw new Error("two");
  pos(...given);
  if (p === null) return { p: (2 * Math.PI * n * m) / 60, m, n };
  if (m === null) return { p, m: (60 * p) / (2 * Math.PI * n), n };
  return { p, m, n: (60 * p) / (2 * Math.PI * m) };
}
export function lever({ f1, a, b }) { pos(f1, a, b); return { f2: (f1 * a) / b, m: f1 * a }; }
export function motion({ v0, a, t }) { num(v0, a); pos(t); return { v: v0 + a * t, s: v0 * t + 0.5 * a * t * t }; }
export function braking({ v, a }) { pos(v, a); return { s: (v * v) / (2 * a), t: v / a }; }
export function energy({ m, v = 0, h = 0, g = G_N }) { pos(m); return { ekin: 0.5 * m * v * v, epot: m * g * h }; }

// ---------- Antriebe ----------
export function gearTrain({ z1, z2, n1, m1 = null, eta = 1 }) {
  pos(z1, z2, n1, eta);
  const i = z2 / z1;
  return { i, n2: n1 / i, m2: m1 !== null ? m1 * i * eta : null };
}
// Gerad-Stirnrad, Normalprofil (Kopfhöhe = m, Fußhöhe = 1,25·m).
export function spurGear({ m, z1, z2 }) {
  pos(m, z1, z2);
  const g = (z) => ({ d: m * z, da: m * (z + 2), df: m * z - 2.5 * m });
  return { g1: g(z1), g2: g(z2), a: (m * (z1 + z2)) / 2, p: Math.PI * m, h: 2.25 * m, i: z2 / z1 };
}
// Riementrieb: Übersetzung, Riemengeschwindigkeit, Näherung für die Riemenlänge (offener Trieb).
export function beltDrive({ d1, d2, n1, a = null }) {
  pos(d1, d2, n1);
  const r = { i: d2 / d1, n2: (n1 * d1) / d2, v: (Math.PI * d1 * n1) / 60000 };
  if (a !== null) { pos(a); r.l = 2 * a + (Math.PI / 2) * (d1 + d2) + (d2 - d1) ** 2 / (4 * a); }
  return r;
}
// Hubleistung P = m·g·v/η (W).
export function hoist({ m, v, eta = 1, g = G_N }) { pos(m, v, eta); if (eta > 1) throw new Error("range"); return { f: m * g, p: (m * g * v) / eta }; }

// ---------- Festigkeit ----------
// Querschnittswerte bezogen auf die Biegeachse (Höhe h senkrecht dazu). Maße in mm.
export function sectionProps({ shape, b, h, d, di = 0, t }) {
  let A, I, W, Wp = null, Ip = null, e;
  if (shape === "rect") { pos(b, h); A = b * h; I = (b * h ** 3) / 12; e = h / 2; }
  else if (shape === "round" || shape === "tube") {
    pos(d); if (shape === "tube") { pos(di); if (di >= d) throw new Error("range"); } else di = 0;
    A = (Math.PI * (d * d - di * di)) / 4; I = (Math.PI * (d ** 4 - di ** 4)) / 64; e = d / 2;
    Ip = 2 * I; Wp = Ip / e;
  } else if (shape === "rtube") {
    pos(b, h, t); if (2 * t >= b || 2 * t >= h) throw new Error("range");
    A = b * h - (b - 2 * t) * (h - 2 * t); I = (b * h ** 3 - (b - 2 * t) * (h - 2 * t) ** 3) / 12; e = h / 2;
  } else throw new Error("range");
  W = I / e;
  return { A, I, W, Wp, Ip, i: Math.sqrt(I / A) };
}
// Biegebalken, vier Standardfälle. F in N, q in N/mm, L in mm, E in N/mm², I in mm⁴.
export const BEAM_CASES = {
  cantF: "Kragträger, Einzellast am Ende",
  cantQ: "Kragträger, Streckenlast",
  ssF: "Einfeldträger, Einzellast in der Mitte",
  ssQ: "Einfeldträger, Streckenlast",
};
export function beam({ kind, f = null, q = null, l, e, i, w = null }) {
  pos(l, e, i);
  let defl, mMax;
  if (kind === "cantF") { pos(f); defl = (f * l ** 3) / (3 * e * i); mMax = f * l; }
  else if (kind === "cantQ") { pos(q); defl = (q * l ** 4) / (8 * e * i); mMax = (q * l * l) / 2; }
  else if (kind === "ssF") { pos(f); defl = (f * l ** 3) / (48 * e * i); mMax = (f * l) / 4; }
  else if (kind === "ssQ") { pos(q); defl = (5 * q * l ** 4) / (384 * e * i); mMax = (q * l * l) / 8; }
  else throw new Error("range");
  return { f: defl, m: mMax, sigma: w ? mMax / w : null };
}
// Knicken nach Euler. beta: Knicklängenbeiwert (Eulerfälle 2 / 1 / 0,7 / 0,5).
export const EULER_CASES = [["2", "Fall 1: eingespannt – frei (β = 2)"], ["1", "Fall 2: gelenkig – gelenkig (β = 1)"],
  ["0.7", "Fall 3: eingespannt – gelenkig (β ≈ 0,7)"], ["0.5", "Fall 4: eingespannt – eingespannt (β = 0,5)"]];
export function euler({ e, i, a, l, beta }) {
  pos(e, i, a, l, beta);
  const lk = beta * l;
  const fk = (Math.PI ** 2 * e * i) / (lk * lk);
  return { lk, fk, sigmaK: fk / a, lambda: lk / Math.sqrt(i / a) };
}
// Torsion einer Voll- oder Hohlwelle. T in N·mm, Maße in mm, G in N/mm².
export function torsion({ t, d, di = 0, l = null, g = null }) {
  pos(t, d); if (di < 0 || di >= d) throw new Error("range");
  const ip = (Math.PI * (d ** 4 - di ** 4)) / 32;
  const wp = ip / (d / 2);
  const r = { tau: t / wp, wp, ip };
  if (l !== null && g !== null) { pos(l, g); r.phiDeg = ((t * l) / (g * ip)) * (180 / Math.PI); }
  return r;
}
export const shaftMinDiameter = ({ t, tauAllow }) => (pos(t, tauAllow), Math.cbrt((16 * t) / (Math.PI * tauAllow)));
export function stress({ f, a }) { pos(f, a); return f / a; }

// ---------- Wärme & Werkstoff ----------
export const thermalExpansion = ({ alpha, l, dT }) => (num(alpha, l, dT), alpha * l * dT);
export function heat({ m, c, dT, t = null }) { pos(m, c); num(dT); const q = m * c * dT; return { q, p: t ? q / t : null }; }
// Richtwerte (Annahme, legierungs- und zustandsabhängig): Dichte kg/m³, E-Modul N/mm², α 1/K.
export const MATERIALS = {
  steel: { name: "Stahl (unlegiert)", rho: 7850, e: 210000, alpha: 12e-6 },
  stainless: { name: "Edelstahl (austenitisch)", rho: 7900, e: 200000, alpha: 16e-6 },
  alu: { name: "Aluminium", rho: 2700, e: 70000, alpha: 23e-6 },
  copper: { name: "Kupfer", rho: 8960, e: 120000, alpha: 16.5e-6 },
  brass: { name: "Messing", rho: 8500, e: 100000, alpha: 19e-6 },
  titanium: { name: "Titan", rho: 4500, e: 110000, alpha: 8.6e-6 },
};
// Masse von Halbzeugen. Maße in mm, Länge in m, Dichte in kg/m³ → kg.
export function profileMass({ shape, d, di, b, h, t, length, rho }) {
  pos(length, rho);
  let aMm2;
  if (shape === "round") { pos(d); aMm2 = (Math.PI * d * d) / 4; }
  else if (shape === "tube") { pos(d, di); if (di >= d) throw new Error("range"); aMm2 = (Math.PI * (d * d - di * di)) / 4; }
  else if (shape === "flat") { pos(b, h); aMm2 = b * h; }
  else if (shape === "hex") { pos(d); aMm2 = (Math.sqrt(3) / 2) * d * d; } // d = Schlüsselweite
  else if (shape === "rtube") { pos(b, h, t); if (2 * t >= b || 2 * t >= h) throw new Error("range"); aMm2 = b * h - (b - 2 * t) * (h - 2 * t); }
  else throw new Error("range");
  const kg = aMm2 * 1e-6 * length * rho;
  return { area: aMm2, kg, perMeter: kg / length };
}

// ---------- Fertigung ----------
export const spindleSpeed = ({ vc, d }) => (pos(vc, d), (vc * 1000) / (Math.PI * d)); // vc m/min, d mm → 1/min
// Drehen: Q = vc·f·ap (cm³/min); Pc = kc·Q (kc in N/mm²).
export function turning({ vc, d, f, ap = null, l = null, kc = null }) {
  pos(vc, d, f);
  const n = spindleSpeed({ vc, d }), vf = f * n;
  const r = { n, vf, th: l ? l / vf : null };
  if (ap !== null) { pos(ap); r.q = vc * f * ap; if (kc) r.pc = (kc * r.q) / 60; } // W: kc [N/mm²] · Q [cm³/min] / 60
  return r;
}
// Fräsen: vf = fz·z·n, Q = ap·ae·vf / 1000 (cm³/min).
export function milling({ vc, d, fz, z, ap = null, ae = null, l = null, kc = null }) {
  pos(vc, d, fz, z);
  const n = spindleSpeed({ vc, d }), vf = fz * z * n;
  const r = { n, vf, th: l ? l / vf : null };
  if (ap !== null && ae !== null) { pos(ap, ae); r.q = (ap * ae * vf) / 1000; if (kc) r.pc = (kc * r.q) / 60; } // W: kc [N/mm²] · Q [cm³/min] / 60
  return r;
}
export function drilling({ vc, d, f, l = null }) { pos(vc, d, f); const n = spindleSpeed({ vc, d }), vf = f * n; return { n, vf, th: l ? l / vf : null }; }

// ---------- Gewinde & Schrauben ----------
// Metrisches ISO-Regelgewinde: Nenndurchmesser → Steigung (mm).
export const METRIC_COARSE = [[1.6, 0.35], [2, 0.4], [2.5, 0.45], [3, 0.5], [4, 0.7], [5, 0.8], [6, 1], [8, 1.25], [10, 1.5], [12, 1.75],
  [14, 2], [16, 2], [18, 2.5], [20, 2.5], [22, 2.5], [24, 3], [27, 3], [30, 3.5], [33, 3.5], [36, 4], [42, 4.5], [48, 5]];
// d2 = d − 0,649519·P; d3 = d − 1,226869·P; As = π/4·((d2 + d3)/2)²; Kernloch ≈ d − P.
export function thread({ d, p }) {
  pos(d, p);
  const d2 = d - 0.649519 * p, d3 = d - 1.226869 * p;
  return { d2, d3, as: (Math.PI / 4) * ((d2 + d3) / 2) ** 2, drill: d - p };
}
// Festigkeitsklasse „x.y“: Rm = x·100, Re = Rm·y/10 (Nennwerte).
export function boltClass(cls) {
  const m = String(cls).match(/^(\d{1,2})\.(\d)$/);
  if (!m) throw new Error("range");
  const rm = Number(m[1]) * 100;
  return { rm, re: (rm * Number(m[2])) / 10 };
}
// Anziehdrehmoment MA = FM·(0,16·P + 0,58·d2·μG + μK·Dkm/2) in N·mm (Ansatz nach VDI 2230).
export function tighteningTorque({ fm, p, d2, muG, muK, dkm }) { pos(fm, p, d2, muG, muK, dkm); return fm * (0.16 * p + 0.58 * d2 * muG + (muK * dkm) / 2); }

// Passung aus Abmaßen (µm oder mm, einheitlich): Bohrung ES/EI, Welle es/ei.
export function fit({ ES, EI, es, ei }) {
  num(ES, EI, es, ei);
  if (ES < EI || es < ei) throw new Error("range");
  const max = ES - ei, min = EI - es;
  return { max, min, kind: min >= 0 ? "Spielpassung" : max <= 0 ? "Übermaßpassung" : "Übergangspassung" };
}

// ---------- Fluidtechnik ----------
// Hydraulikzylinder: D, dr in mm; p in bar; Q in l/min. Kräfte in N, Geschwindigkeiten in m/s, Leistung in W.
export function cylinder({ D, dr, p, q = null, eta = 1 }) {
  pos(D, dr, p, eta); if (dr >= D) throw new Error("range");
  const ak = (Math.PI * D * D) / 4, ar = (Math.PI * (D * D - dr * dr)) / 4;
  const r = { ak, ar, fOut: p * 0.1 * ak * eta, fIn: p * 0.1 * ar * eta, phi: ak / ar };
  if (q !== null) { pos(q); const qs = q / 60000; r.vOut = qs / (ak * 1e-6); r.vIn = qs / (ar * 1e-6); r.power = p * 1e5 * qs; }
  return r;
}
export function pipeFlow({ q, di = null, vMax = null }) {
  pos(q); const qs = q / 60000;
  const r = {};
  if (di !== null) { pos(di); r.v = qs / ((Math.PI * di * di) / 4 * 1e-6); }
  if (vMax !== null) { pos(vMax); r.diMin = Math.sqrt((4 * qs) / (Math.PI * vMax)) * 1000; }
  return r;
}
// Pneumatik, doppeltwirkend: Luftverbrauch je Doppelhub (Normliter) = (A_K + A_R)·s·(p_e + p_amb)/p_amb.
export function pneumatic({ D, dr, s, p, cycles = null, pAmb = 1.013 }) {
  pos(D, dr, s, p, pAmb); if (dr >= D) throw new Error("range");
  const ak = (Math.PI * D * D) / 4, ar = (Math.PI * (D * D - dr * dr)) / 4;
  const perCycle = ((ak + ar) * s * 1e-6 * (p + pAmb)) / pAmb; // in Litern (mm³·1e-6 = l)
  return { perCycle, perMin: cycles ? perCycle * cycles : null, fOut: p * 0.1 * ak, fIn: p * 0.1 * ar };
}
