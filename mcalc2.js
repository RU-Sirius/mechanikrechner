// Wälzlager-Lebensdauer, Blechbiegung, Druckfedern, Fertigungskosten.
const pos = (...v) => { if (!v.every((x) => x !== null && x !== undefined && x > 0 && Number.isFinite(x))) throw new Error("positive"); };
const nonneg = (...v) => { if (!v.every((x) => x !== null && x !== undefined && x >= 0 && Number.isFinite(x))) throw new Error("positive"); };

// Nominelle Lebensdauer (ISO 281, Grundgleichung): L10 = (C/P)^p in 10⁶ Umdrehungen; p = 3 (Kugel), 10/3 (Rolle).
// Äquivalente Last P = X·Fr + Y·Fa (X, Y aus dem Herstellerkatalog).
export function bearingLife({ c, fr, fa = 0, x = 1, y = 0, kind = "ball", n = null }) {
  pos(c, fr, x); nonneg(fa ?? 0, y ?? 0);
  const P = x * fr + (y ?? 0) * (fa ?? 0), p = kind === "roller" ? 10 / 3 : 3;
  const l10 = (c / P) ** p;
  const r = { P, p, l10 };
  if (n !== null && n > 0) r.l10h = (l10 * 1e6) / (60 * n);
  return r;
}
// Erforderliche dynamische Tragzahl für eine Soll-Lebensdauer in Stunden
export function bearingRequiredC({ P, kind = "ball", n, hours }) {
  pos(P, n, hours);
  const p = kind === "roller" ? 10 / 3 : 3;
  return P * ((hours * 60 * n) / 1e6) ** (1 / p);
}

// Gestreckte Länge eines Biegeteils mit einer Biegung über den k-Faktor (Lage der neutralen Faser).
// a, b: Außenmaße der Schenkel (bis zum Schnittpunkt der Außenkanten), s: Blechdicke, r: Innenradius, angle: Biegewinkel (Umformwinkel, 90° = rechter Winkel)
export function bendLength({ a, b, s, r, k, angle }) {
  pos(a, b, s, angle); nonneg(r); if (!(k > 0 && k <= 1) || angle >= 180) throw new Error("range");
  const phi = (angle * Math.PI) / 180;
  const ba = phi * (r + k * s);                     // Länge der neutralen Faser im Bogen
  const ossb = Math.tan(phi / 2) * (r + s);         // Außen-Rückversatz je Schenkel
  const v = ba - 2 * ossb;                          // Ausgleichswert (meist negativ)
  const L = a + b + v;
  if (L <= 0 || a < ossb || b < ossb) throw new Error("range");
  return { L, v, ba, ossb, rNeutral: r + k * s };
}

// Zylindrische Druckfeder aus Runddraht: R = G·d⁴ / (8·D³·n), τ = 8·F·D / (π·d³), korrigiert mit k = (w + 0,5)/(w − 0,75), w = D/d.
export function compressionSpring({ d, D, n, G, F = null, s = null, tauAllow = null }) {
  pos(d, D, n, G);
  const w = D / d; if (w <= 1) throw new Error("range");
  const R = (G * d ** 4) / (8 * D ** 3 * n);
  let force = F;
  if ((force === null || force === undefined) && s !== null && s !== undefined) force = R * s;
  const r = { R, w, k: (w + 0.5) / (w - 0.75) };
  if (force !== null && force !== undefined) {
    pos(force);
    r.F = force; r.s = force / R; r.tau = (8 * force * D) / (Math.PI * d ** 3); r.tauK = r.k * r.tau;
    if (tauAllow) r.ok = r.tau <= tauAllow;
  }
  return r;
}

// Auftragszeit und Stückkosten: T = tr + m·(th + tn); Kosten = Zeit · Stundensatz + Material
export function productionCost({ tr = 0, th, tn = 0, m, rateMachine, rateLabor = 0, material = 0 }) {
  pos(th, m); nonneg(tr, tn, rateMachine, rateLabor, material);
  m = Math.round(m);
  const T = tr + m * (th + tn), te = T / m;           // min
  const rate = rateMachine + rateLabor;               // €/h
  const perPiece = (te / 60) * rate + material;
  return { T, te, perPiece, total: perPiece * m, setupShare: ((tr / m) / 60) * rate, piecesPerHour: 60 / (th + tn) };
}
