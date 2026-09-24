/**
 * Générateur d'allée en mosaïque (opus incertum) — exécuté au build, pas dans le navigateur.
 *
 * Étapes :
 *  1. Une spline de Catmull-Rom passe par les points de l'allée (là où sont les photos).
 *  2. L'allée = cette courbe épaissie (offset de Clipper).
 *  3. Graines de remplissage par échantillonnage de Poisson (distance minimale),
 *     tenues à l'écart des points photo pour que ces dalles restent grandes.
 *  4. Diagramme de Voronoï de toutes les graines (d3-delaunay) : les cellules
 *     pavent le plan sans trou ni chevauchement.
 *  5. Chaque cellule est découpée par l'allée, rétrécie (joint constant) puis
 *     regonflée (angles arrondis).
 *  6. Sortie en pourcentages → le rendu s'adapte à la largeur du conteneur.
 */
import { Delaunay } from "d3-delaunay";
import ClipperLib from "clipper-lib";

export interface MosaicConfig {
  /** Taille de la zone de dessin (unités arbitraires, ≈ px à 100 %) */
  width: number;
  height: number;
  /** Points de passage de l'allée ; une photo est centrée sur chacun */
  points: [number, number][];
  /** Largeur de l'allée */
  largeur: number;
  /** Distance minimale entre graines de remplissage (≈ taille des petites dalles) */
  espacement: number;
  /** Pas de petite dalle à moins de cette distance d'un point photo (≈ taille des grandes dalles / 2) */
  degagementPhoto: number;
  /** Largeur des joints */
  joint: number;
  /** Rayon d'arrondi des angles */
  arrondi: number;
  /** Épaisseur du liseré de pierre autour des photos */
  lisere: number;
  /** Graine du générateur aléatoire : même graine = même mosaïque */
  graine: number;
}

export interface Stone {
  /** Boîte englobante, en % du conteneur */
  left: number;
  top: number;
  width: number;
  height: number;
  /** clip-path en % de la boîte de la dalle */
  clip: string;
  /** Pour les dalles photo : index du point, clip intérieur et position de l'étiquette (en % de la boîte) */
  photo?: { index: number; clipInner: string; labelX: number; labelY: number };
}

export interface Mosaic {
  width: number;
  height: number;
  /** Contour de l'allée (attribut d d'un <path> SVG, en unités de dessin) */
  bandPath: string;
  stones: Stone[];
}

type Pt = [number, number];
type Poly = Pt[];

/* ---------- Outils ---------- */

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function catmullRom(pts: Pt[], steps = 40): Pt[] {
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  const out: Pt[] = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      const f = (k: 0 | 1) =>
        0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  out.push(P[P.length - 2]);
  return out;
}

// Clipper travaille en entiers : on multiplie par SCALE pour garder la précision.
const SCALE = 100;
const toPath = (p: Poly): ClipperLib.Path => p.map(([x, y]) => ({ X: Math.round(x * SCALE), Y: Math.round(y * SCALE) }));
const fromPath = (p: ClipperLib.Path): Poly => p.map(({ X, Y }) => [X / SCALE, Y / SCALE]);

function area(p: Poly) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

function centroid(p: Poly): Pt {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length];
    const c = x1 * y2 - x2 * y1;
    a += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c;
  }
  a /= 2;
  return [cx / (6 * a), cy / (6 * a)];
}

const largest = (ps: Poly[]) => ps.reduce<Poly | null>((best, p) => (!best || area(p) > area(best) ? p : best), null);

/** Offset (positif = gonfle, négatif = rétrécit) d'un ensemble de polygones fermés. */
function offset(polys: Poly[], delta: number, join = ClipperLib.JoinType.jtRound): Poly[] {
  const co = new ClipperLib.ClipperOffset(2, 0.25 * SCALE);
  co.AddPaths(polys.map(toPath), join, ClipperLib.EndType.etClosedPolygon);
  const sol: ClipperLib.Paths = [];
  co.Execute(sol, delta * SCALE);
  return sol.map(fromPath);
}

function intersect(a: Poly, b: Poly[]): Poly[] {
  const c = new ClipperLib.Clipper();
  c.AddPath(toPath(a), ClipperLib.PolyType.ptSubject, true);
  c.AddPaths(b.map(toPath), ClipperLib.PolyType.ptClip, true);
  const sol: ClipperLib.Paths = [];
  c.Execute(ClipperLib.ClipType.ctIntersection, sol, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
  return sol.map(fromPath);
}

const inside = (pt: Pt, polys: Poly[]) =>
  polys.some((p) => ClipperLib.Clipper.PointInPolygon({ X: pt[0] * SCALE, Y: pt[1] * SCALE }, toPath(p)) !== 0);

/* ---------- Générateur ---------- */

export function generateMosaic(cfg: MosaicConfig): Mosaic {
  const { width: W, height: H, points } = cfg;
  const random = rng(cfg.graine);

  // 1-2. Allée : courbe prolongée hors cadre aux deux bouts, puis épaissie.
  const [first, second] = [points[0], points[1] ?? points[0]];
  const [last, beforeLast] = [points[points.length - 1], points[points.length - 2] ?? points[0]];
  const extend = (a: Pt, b: Pt): Pt => [a[0] + (a[0] - b[0]) * 1.2, a[1] + (a[1] - b[1]) * 1.2];
  const curve = catmullRom([extend(first, second), ...points, extend(last, beforeLast)]);

  const co = new ClipperLib.ClipperOffset(2, 0.25 * SCALE);
  co.AddPath(toPath(curve), ClipperLib.JoinType.jtRound, ClipperLib.EndType.etOpenButt);
  const bandRaw: ClipperLib.Paths = [];
  co.Execute(bandRaw, (cfg.largeur / 2) * SCALE);
  const frame: Poly = [[0, 0], [W, 0], [W, H], [0, H]];
  const band = bandRaw.map(fromPath).flatMap((p) => intersect(p, [frame]));
  const sampleZone = offset(bandRaw.map(fromPath), cfg.espacement);

  // 3. Échantillonnage de Poisson par « lancer de fléchettes » : on tire au hasard
  //    et on rejette ce qui est trop près d'une graine existante ou d'un point photo.
  const fill: Pt[] = [];
  const margin = cfg.espacement * 1.5;
  for (let tries = 0; tries < 40000; tries++) {
    const p: Pt = [-margin + random() * (W + 2 * margin), -margin + random() * (H + 2 * margin)];
    if (!inside(p, sampleZone)) continue;
    if (points.some((b) => Math.hypot(p[0] - b[0], p[1] - b[1]) < cfg.degagementPhoto)) continue;
    if (fill.some((f) => Math.hypot(p[0] - f[0], p[1] - f[1]) < cfg.espacement)) continue;
    fill.push(p);
  }

  // 4. Voronoï : cellule i = zone plus proche de la graine i que de toute autre.
  const seeds: Pt[] = [...points, ...fill];
  const pad = Math.max(W, H);
  const voronoi = Delaunay.from(seeds).voronoi([-pad, -pad, W + pad, H + pad]);

  // 5. Découpe, joints, arrondis.
  const stones: Stone[] = [];
  const pct = (v: number, of: number) => +((v / of) * 100).toFixed(3);
  seeds.forEach((_, i) => {
    const cell = voronoi.cellPolygon(i);
    if (!cell) return;
    const clipped = largest(intersect(cell.slice(0, -1) as Poly, band));
    if (!clipped) return;
    const shrunk = offset([clipped], -(cfg.joint / 2 + cfg.arrondi), ClipperLib.JoinType.jtMiter);
    const stone = largest(offset(shrunk, cfg.arrondi));
    if (!stone || area(stone) < cfg.espacement * cfg.espacement * 0.15) return;

    const xs = stone.map((p) => p[0]), ys = stone.map((p) => p[1]);
    const [x0, y0, x1, y1] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    const bw = x1 - x0, bh = y1 - y0;
    const clip = (p: Poly) => p.map(([x, y]) => `${pct(x - x0, bw)}% ${pct(y - y0, bh)}%`).join(", ");

    const s: Stone = { left: pct(x0, W), top: pct(y0, H), width: pct(bw, W), height: pct(bh, H), clip: clip(stone) };
    if (i < points.length) {
      const inner = largest(offset([stone], -cfg.lisere)) ?? stone;
      const core = largest(offset([stone], -bw * 0.18)) ?? stone;
      const [lx, ly] = centroid(core);
      s.photo = { index: i, clipInner: clip(inner), labelX: pct(lx - x0, bw), labelY: pct(ly - y0, bh) };
    }
    stones.push(s);
  });

  const bandPath = band.map((p) => "M" + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z").join(" ");
  return { width: W, height: H, bandPath, stones };
}
