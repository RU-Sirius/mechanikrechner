// Einheitliche Strich-Icons (24 × 24, weiße Linien) für die Startseite.
// Jedes Icon ist eine Liste von SVG-Elementen: Pfad-Strings oder ["circle", cx, cy, r].

const gear = (cx, cy, r, teeth, rt = 2.4) => {
  const out = [["circle", cx, cy, r]];
  for (let k = 0; k < teeth; k++) {
    const a = (2 * Math.PI * k) / teeth, c = Math.cos(a), s = Math.sin(a);
    out.push(`M${(cx + r * c).toFixed(2)} ${(cy + r * s).toFixed(2)}L${(cx + (r + rt) * c).toFixed(2)} ${(cy + (r + rt) * s).toFixed(2)}`);
  }
  return out;
};

export const ICONS = {
  units: ["M4 8h14", "M14 4l4 4-4 4", "M20 16H6", "M10 12l-4 4 4 4"],
  power: ["M20 12a8 8 0 1 1-2.6-5.9", "M18.2 2.6l-.5 3.9-3.9-.4", ["circle", 12, 12, 1.8]],
  lever: ["M3 8.5l18 5", "M12 11.2l-3.5 7.8h7z"],
  motion: ["M8 12h11", "M15 8l4 4-4 4", "M3 8h4", "M2 12h3", "M3 16h4"],
  energy: ["M13 2 5 13.5h6l-1 8.5 8-11.5h-6z"],
  gear: [...gear(8, 15, 3.6, 8, 1.8), ...gear(16.2, 8, 3, 8, 1.6)],
  spur: [...gear(12, 12, 6, 10, 2.6), ["circle", 12, 12, 2]],
  belt: [["circle", 6, 12, 2.6], ["circle", 17.5, 12, 4], "M6 9.4 17.5 8", "M6 14.6 17.5 16"],
  hoist: ["M12 3v10", "M8.5 6.5 12 3l3.5 3.5", "M12 13v3a3 3 0 1 1-3 3"],
  stress: ["M9 7h6v10H9z", "M2.5 12H7", "M4.5 10 2.5 12l2 2", "M17 12h4.5", "M19.5 10l2 2-2 2"],
  section: ["M5 4h14", "M5 20h14", "M12 4v16"],
  beam: ["M4.5 10q7.5 7 15 0", "M4.5 10l-2 3.5h4z", "M19.5 10l-2 3.5h4z", "M12 3v5", "M10.2 6.3 12 8l1.8-1.7"],
  euler: ["M12 6.5q5 6 0 12", "M12 2v4", "M10 4.2 12 6.2l2-2", "M8 21h8"],
  torsion: ["M3 13h18v4H3z", "M5.5 9.5C8 4.5 16 4.5 18.5 9.5", "M18.8 5.8l-.3 3.7-3.6-.8"],
  bolt: ["M7.5 3h9v4h-9z", "M10 7v14h4V7", "M10 10l4 1.6", "M10 13.6l4 1.6", "M10 17.2l4 1.6"],
  fit: [["circle", 12, 12, 7], "M5 19 19 5"],
  machining: ["M12 2v4", "M8.5 6h7v5.5L12 22l-3.5-10.5z", "M8.8 9.5l6.2 2.2", "M9.6 13.4l4.6 1.6"],
  cylinder: ["M3 8.5h12v7H3z", "M11 8.5v7", "M15 12h6", "M21 10v4"],
  pipe: ["M3 7.5h18", "M3 16.5h18", "M7 12h9", "M13 9.5l3 2.5-3 2.5"],
  pneumatic: ["M3 8h10a2.5 2.5 0 1 0-2.5-2.5", "M3 12h15a2.5 2.5 0 1 1-2.5 2.5", "M3 16h6"],
  thermal: ["M3 6v12", "M21 6v12", "M6 12h12", "M9 9l-3 3 3 3", "M15 9l3 3-3 3"],
  heat: ["M12 3c3.5 4 5.5 6.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-3 2-4.5 2.5-7 1.6 1.4 2.5 3 2.5 4.8 1.2-2 1.2-5.3.5-8.3z"],
  mass: ["M6.5 9h11l3 11h-17z", "M9.8 9a2.2 2.2 0 1 1 4.4 0"],
  tables: ["M4 4h16v16H4z", "M4 9.3h16", "M4 14.6h16", "M10 4v16"],
  projects: ["M3 6.5h6.5l2 2.3H21V19H3z"],
  install: ["M12 4v11", "M7 10l5 5 5-5", "M5 20h14"],
  bearing: [["circle", 12, 12, 9], ["circle", 12, 12, 4], ["circle", 12, 5.5, 1.3], ["circle", 12, 18.5, 1.3], ["circle", 5.5, 12, 1.3], ["circle", 18.5, 12, 1.3]],
  spring: ["M8 3h8", "M8 21h8", "M8 5.5 16 8 8 10.5 16 13 8 15.5 16 18"],
  bend: ["M4 20h9a4 4 0 0 0 4-4V4", "M4 16h9V4"],
  cost: ["M15.5 7.5a5 5 0 1 0 0 9", "M6 10.5h7", "M6 13.5h7"],
  settings: ["M4 7h9", "M17 7h3", "M4 17h3", "M11 17h9", ["circle", 15, 7, 2], ["circle", 9, 17, 2]],
};

const NS = "http://www.w3.org/2000/svg";
export function svgIcon(name) {
  const svg = document.createElementNS(NS, "svg");
  for (const [k, v] of Object.entries({ viewBox: "0 0 24 24", width: "19", height: "19", fill: "none", stroke: "#fff",
    "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" })) svg.setAttribute(k, v);
  for (const el of ICONS[name] ?? []) {
    const node = typeof el === "string" ? document.createElementNS(NS, "path") : document.createElementNS(NS, el[0]);
    if (typeof el === "string") node.setAttribute("d", el);
    else { node.setAttribute("cx", el[1]); node.setAttribute("cy", el[2]); node.setAttribute("r", el[3]); }
    svg.append(node);
  }
  return svg;
}
