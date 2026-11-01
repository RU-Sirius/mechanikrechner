import { LEGAL, h, section, resultRow, navRow, clearCurrentState, setPreset } from "./ui.js";
import * as M from "./mtools.js";
import * as M2 from "./mtools2.js";
import { favorites, saveBar, projectsView, reportView, saves } from "./projects.js";
import { installView } from "./install.js";
import { svgIcon } from "./icons.js";

const view = document.getElementById("view");
const header = document.querySelector("header");
const titleEl = document.getElementById("title");
const back = document.getElementById("back");
back.onclick = () => (location.hash = "");
const favBtn = document.getElementById("fav");

// Alle Rechner: Schlüssel → [Listenname, Kurztitel, Farbe, Symbol, Ansicht]
const B = "#0a7aff", A = "#ff9500", F = "#ff3b30", V = "#5856d6", P = "#34c759", H = "#30b0c7", W = "#af52de", N = "#8e8e93";
const TOOLS = {
  units: ["Einheiten umrechnen", "Einheiten", B, "⇄", M.units],
  power: ["Drehmoment · Leistung · Drehzahl", "Drehmoment & Leistung", B, "M", M.powerTorque],
  lever: ["Hebel & Momente", "Hebel", B, "⚖", M.lever],
  motion: ["Bewegung & Bremsweg", "Bewegung", B, "→", M.motion],
  energy: ["Energie (kinetisch, potenziell)", "Energie", B, "E", M.energy],
  gear: ["Zahnrad-Übersetzung", "Übersetzung", A, "i", M.gearRatio],
  spur: ["Stirnrad-Geometrie (Modul)", "Stirnrad", A, "⚙", M.spurGear],
  belt: ["Riementrieb", "Riementrieb", A, "◯", M.beltDrive],
  hoist: ["Hubantrieb (Leistung)", "Hubantrieb", A, "↑", M.hoist],
  stress: ["Spannung & Flächenpressung", "Spannung", F, "σ", M.stressView],
  section: ["Querschnittswerte (A, I, W)", "Querschnitt", F, "I", M.sectionView],
  beam: ["Balkenbiegung (Durchbiegung)", "Biegebalken", F, "⌒", M.beamView],
  euler: ["Knickung nach Euler", "Knickung", F, "⫿", M.eulerView],
  torsion: ["Torsion & Wellendurchmesser", "Torsion", F, "↻", M.torsionView],
  bolt: ["Gewinde & Schrauben (inkl. MA)", "Schrauben", V, "M", M2.bolt],
  fit: ["Passungen (aus Abmaßen)", "Passung", V, "⌀", M2.fitView],
  machining: ["Drehen · Fräsen · Bohren", "Zerspanung", P, "✂", M2.machining],
  cylinder: ["Hydraulikzylinder", "Hydraulikzylinder", H, "▭", M2.cylinderView],
  pipe: ["Rohrströmung (Hydraulik)", "Rohrströmung", H, "≋", M2.pipeView],
  pneumatic: ["Pneumatik-Luftverbrauch", "Pneumatik", H, "◌", M2.pneumaticView],
  thermal: ["Wärmeausdehnung", "Wärmeausdehnung", W, "↔", M2.thermalView],
  heat: ["Wärmemenge & Heizleistung", "Wärmemenge", W, "Q", M2.heatView],
  mass: ["Masse von Halbzeugen", "Masse", W, "kg", M2.massView],
  tables: ["Tabellen & Richtwerte", "Tabellen", N, "☰", M2.tables],
};
const nav = (key) => navRow(key, TOOLS[key][0], TOOLS[key][2], svgIcon(key));
const GROUPS = [
  ["Grundlagen", ["units", "power", "lever", "motion", "energy"]],
  ["Antriebstechnik", ["gear", "spur", "belt", "hoist"]],
  ["Festigkeitslehre", ["stress", "section", "beam", "euler", "torsion"]],
  ["Verbindungselemente", ["bolt", "fit"]],
  ["Fertigung", ["machining"]],
  ["Hydraulik & Pneumatik", ["cylinder", "pipe", "pneumatic"]],
  ["Wärme & Werkstoff", ["thermal", "heat", "mass"]],
  ["Nachschlagen", ["tables"]],
];

function home() {
  const favs = favorites.list().filter((k) => k in TOOLS);
  const nSaved = saves.list().length;
  return [
    ...(favs.length ? section("★ Favoriten", favs.map(nav)) : []),
    ...section("", [navRow("projects", `Projekte & gespeicherte Berechnungen${nSaved ? ` (${nSaved})` : ""}`, N, svgIcon("projects"))]),
    ...GROUPS.flatMap(([title, keys]) => section(title, keys.map(nav))),
    ...section("", [navRow("install", "App installieren (iPhone, iPad, Mac)", N, svgIcon("install")), navRow("settings", "Einstellungen", N, svgIcon("settings"))]),
    h("div", { class: "credit" }, "Built by Lukas Kopp"),
  ];
}

function settingsView() {
  return [
    ...section("Haftungshinweis", [h("div", { class: "row" }, h("span", { class: "hint" }, LEGAL))]),
    ...section("", [resultRow("Version", "1.0.2 (Web)"), resultRow("Entwickelt von", "Lukas Kopp"), resultRow("Lizenz", "MIT")]),
  ];
}

// ---------- Routing ----------
const PAGES = { settings: ["Einstellungen", settingsView], projects: ["Projekte", projectsView], install: ["App installieren", installView] };
function route() {
  const [key, arg] = location.hash.slice(1).split("/");
  clearCurrentState();
  let title, nodes, isTool = false;
  if (key in TOOLS) { title = TOOLS[key][1]; nodes = TOOLS[key][4](); isTool = true; }
  else if (key in PAGES) { title = PAGES[key][0]; nodes = PAGES[key][1](); }
  else if (key === "report" && arg) { title = "Projektbericht"; nodes = reportView(decodeURIComponent(arg)); }
  else { title = "MechanikRechner"; nodes = home(); }
  const isHome = title === "MechanikRechner";
  titleEl.textContent = title;
  header.classList.toggle("sub", !isHome);
  back.hidden = isHome;
  favBtn.hidden = !isTool;
  if (isTool) {
    const set = () => { favBtn.textContent = favorites.has(key) ? "★" : "☆"; };
    set();
    favBtn.onclick = () => { favorites.toggle(key); set(); };
  }
  view.replaceChildren(...nodes);
  setPreset(null); // nicht verbrauchte Voreinstellung verwerfen
  if (isTool && key !== "tables") {
    view.append(saveBar(key, title, view), h("div", { class: "print-only" }, `MechanikRechner – Built by Lukas Kopp · ${LEGAL}`));
  }
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
route();

// Haftungshinweis beim ersten Start bestätigen lassen.
if (localStorage.getItem("mr:legalAccepted") !== "1") {
  const overlay = h("div", { class: "modal", role: "dialog", "aria-modal": "true" },
    h("div", { class: "modal-box" },
      h("h2", {}, "Bitte beachten"),
      h("p", {}, LEGAL),
      h("button", { class: "modal-btn", onclick: () => { localStorage.setItem("mr:legalAccepted", "1"); overlay.remove(); } }, "Verstanden")));
  document.body.append(overlay);
}

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((reg) => {
  // Bei jedem Zurückkehren in die App nach Updates schauen.
  document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update(); });
});
// Sobald eine neue Version aktiv ist: einmal neu laden, damit sie sofort sichtbar wird.
// (Nicht beim allerersten Start, da gibt es noch keine alte Version.)
let reloaded = false;
const hadController = !!navigator.serviceWorker?.controller;
navigator.serviceWorker?.addEventListener("controllerchange", () => {
  if (hadController && !reloaded) { reloaded = true; location.reload(); }
});
