/**
 * Générateur d'allée en mosaïque (opus incertum) — exécuté au build, pas dans le navigateur.
 *
 * Étapes :
 *  1. Une spline de Catmull-Rom passe par les points de l'allée (là où sont les photos).
 *  2. L'allée = cette courbe épaissie (offset de Clipper).
 *  3. Les dalles photo sont posées d'abord : une forme irrégulière autour de chaque point.
 *  4. Graines des petites dalles par échantillonnage de Poisson (distance minimale),
 *     hors des dalles photo.
 *  5. Diagramme de Voronoï de ces graines (d3-delaunay), arêtes cassées en ligne brisée
 *     de façon identique des deux côtés, puis découpe : allée MOINS dalles photo.
 *     Les cellules pavent donc tout l'espace restant, sans trou ni chevauchement.
 *  6. Chaque dalle est rétrécie (joint constant) puis regonflée (angles arrondis).
 *  7. Sortie en pourcentages → le rendu s'adapte à la largeur du conteneur.
 */
import { Delaunay } from "d3-delaunay";
import ClipperLib from "clipper-lib";

export interface MosaicConfig {
  /** Taille de la zone de dessin (unités arbitraires, ≈ px à 100 %) */
  width: number;
  height: number;
  /** Points de passage de l'allée ; une photo est centrée sur chacun */
  points: [number, number][];
  /** Optionnel : d'où vient l'allée (avant la 1re photo) et où elle va (après la dernière).
   *  Un point hors cadre (ex. y < 0) fait « sortir » l'allée de la zone : continuité avec la section voisine. */
  depart?: [number, number];
  arrivee?: [number, number];
  /** Largeur de l'allée */
  largeur: number;
  /** Distance minimale entre graines de remplissage (≈ taille des petites dalles) */
  espacement: number;
  /** Taille des dalles photo (leur diamètre vaut environ 1,25 × cette valeur) */
  degagementPhoto: number;
  /** Largeur des joints */
  joint: number;
  /** Rayon d'arrondi des angles */
  arrondi: number;
  /** Épaisseur du liseré de pierre autour des photos */
  lisere: number;
  /** Irrégularité des bords : 0 = cellules de Voronoï droites, 0.25 = pierres très découpées */
  decoupe: number;
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

function difference(a: Poly, b: Poly[]): Poly[] {
  const c = new ClipperLib.Clipper();
  c.AddPath(toPath(a), ClipperLib.PolyType.ptSubject, true);
  c.AddPaths(b.map(toPath), ClipperLib.PolyType.ptClip, true);
  const sol: ClipperLib.Paths = [];
  c.Execute(ClipperLib.ClipType.ctDifference, sol, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
  return sol.map(fromPath);
}

const inside = (pt: Pt, polys: Poly[]) =>
  polys.some((p) => ClipperLib.Clipper.PointInPolygon({ X: pt[0] * SCALE, Y: pt[1] * SCALE }, toPath(p)) !== 0);

/** Hachage FNV-1a d'une chaîne → entier 32 bits (sert de graine locale). */
function hash(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Casse chaque arête [a, b] en ligne brisée (2 points intermédiaires décalés
 * perpendiculairement). Le décalage dépend UNIQUEMENT de l'arête (clé = extrémités
 * triées), pas de la cellule : les deux cellules voisines reçoivent exactement la
 * même ligne brisée, donc le pavage reste sans trou ni chevauchement.
 */
function roughen(poly: Poly, amount: number, seed: number): Poly {
  if (amount <= 0) return poly;
  const key = (p: Pt) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  const out: Poly = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    out.push(a);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 12) continue;
    // Arête orientée de façon canonique (même sens vu des deux cellules)
    const [p, q] = key(a) < key(b) ? [a, b] : [b, a];
    const r = rng(hash(key(p) + "|" + key(q)) ^ seed);
    const nx = -(q[1] - p[1]) / len, ny = (q[0] - p[0]) / len; // normale unitaire
    const mid: Pt[] = [0.33 + (r() - 0.5) * 0.12, 0.67 + (r() - 0.5) * 0.12].map((t) => {
      const d = (r() - 0.5) * 2 * amount * len;
      return [p[0] + (q[0] - p[0]) * t + nx * d, p[1] + (q[1] - p[1]) * t + ny * d];
    });
    // Parcours dans le sens de la cellule : si l'arête canonique est inversée, on inverse aussi.
    out.push(...(p === a ? mid : mid.reverse()));
  }
  return out;
}

/* ---------- Générateur ---------- */

export function generateMosaic(cfg: MosaicConfig): Mosaic {
  const { width: W, height: H, points } = cfg;
  const random = rng(cfg.graine);

  // 1-2. Allée : courbe prolongée hors cadre aux deux bouts, puis épaissie.
  const path: Pt[] = [...(cfg.depart ? [cfg.depart] : []), ...points, ...(cfg.arrivee ? [cfg.arrivee] : [])];
  const [first, second] = [path[0], path[1] ?? path[0]];
  const [last, beforeLast] = [path[path.length - 1], path[path.length - 2] ?? path[0]];
  const extend = (a: Pt, b: Pt): Pt => [a[0] + (a[0] - b[0]) * 1.2, a[1] + (a[1] - b[1]) * 1.2];
  const curve = catmullRom([extend(first, second), ...path, extend(last, beforeLast)]);

  const co = new ClipperLib.ClipperOffset(2, 0.25 * SCALE);
  co.AddPath(toPath(curve), ClipperLib.JoinType.jtRound, ClipperLib.EndType.etOpenButt);
  const bandRaw: ClipperLib.Paths = [];
  co.Execute(bandRaw, (cfg.largeur / 2) * SCALE);
  const frame: Poly = [[0, 0], [W, 0], [W, H], [0, H]];
  const band = bandRaw.map(fromPath).flatMap((p) => intersect(p, [frame]));
  const sampleZone = offset(bandRaw.map(fromPath), cfg.espacement);

  // 3. Dalles photo : une forme irrégulière (polygone à rayon variable) autour de
  //    chaque point, limitée par le Voronoï des seuls points photo (pas de chevauchement)
  //    et par l'allée.
  const pad = Math.max(W, H);
  const photoVoronoi = Delaunay.from(points).voronoi([-pad, -pad, W + pad, H + pad]);
  const R = cfg.degagementPhoto * 0.62;
  const photoRegions: (Poly | null)[] = points.map(([cx, cy], i) => {
    const k = 11;
    const blob: Poly = Array.from({ length: k }, (_, j) => {
      const angle = ((j + (random() - 0.5) * 0.5) / k) * Math.PI * 2;
      const r = R * (0.88 + random() * 0.24);
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    });
    const cell = photoVoronoi.cellPolygon(i);
    const inBand = largest(intersect(blob, band));
    return cell && inBand ? largest(intersect(cell.slice(0, -1) as Poly, [inBand])) : inBand;
  });
  const reserved = photoRegions.filter((p): p is Poly => !!p);

  // 4. Graines des petites dalles : échantillonnage de Poisson par « lancer de
  //    fléchettes » (tirage au hasard, rejet si trop près d'une graine existante),
  //    hors des dalles photo.
  const keepOut = offset(reserved, cfg.espacement * 0.35);
  const fill: Pt[] = [];
  const margin = cfg.espacement * 1.5;
  for (let tries = 0; tries < 60000; tries++) {
    const p: Pt = [-margin + random() * (W + 2 * margin), -margin + random() * (H + 2 * margin)];
    if (!inside(p, sampleZone) || inside(p, keepOut)) continue;
    if (fill.some((f) => Math.hypot(p[0] - f[0], p[1] - f[1]) < cfg.espacement)) continue;
    fill.push(p);
  }

  // 5. Voronoï des petites graines ; bords cassés ; on garde ce qui est dans
  //    l'allée MOINS les dalles photo → l'ensemble pave l'allée sans trou.
  const voronoi = Delaunay.from(fill).voronoi([-pad, -pad, W + pad, H + pad]);
  const fillerPieces: Poly[] = [];
  fill.forEach((_, i) => {
    const cell = voronoi.cellPolygon(i);
    if (!cell) return;
    const rough = roughen(cell.slice(0, -1) as Poly, cfg.decoupe, cfg.graine);
    for (const piece of intersect(rough, band)) fillerPieces.push(...difference(piece, reserved));
  });

  // 6. Joints (rétrécissement constant) et angles arrondis, puis sortie en %.
  const stones: Stone[] = [];
  const pct = (v: number, of: number) => +((v / of) * 100).toFixed(3);
  const finish = (region: Poly) => {
    const shrunk = offset([region], -(cfg.joint / 2 + cfg.arrondi), ClipperLib.JoinType.jtMiter);
    const stone = largest(offset(shrunk, cfg.arrondi));
    return stone && area(stone) >= cfg.espacement * cfg.espacement * 0.12 ? stone : null;
  };
  const toStone = (stone: Poly, photoIndex?: number): Stone => {
    const xs = stone.map((p) => p[0]), ys = stone.map((p) => p[1]);
    const [x0, y0, x1, y1] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    const bw = x1 - x0, bh = y1 - y0;
    const clip = (p: Poly) => p.map(([x, y]) => `${pct(x - x0, bw)}% ${pct(y - y0, bh)}%`).join(", ");
    const s: Stone = { left: pct(x0, W), top: pct(y0, H), width: pct(bw, W), height: pct(bh, H), clip: clip(stone) };
    if (photoIndex !== undefined) {
      const inner = largest(offset([stone], -cfg.lisere)) ?? stone;
      const core = largest(offset([stone], -bw * 0.18)) ?? stone;
      const [lx, ly] = centroid(core);
      s.photo = { index: photoIndex, clipInner: clip(inner), labelX: pct(lx - x0, bw), labelY: pct(ly - y0, bh) };
    }
    return s;
  };

  photoRegions.forEach((region, i) => {
    const stone = region && finish(region);
    if (stone) stones.push(toStone(stone, i));
  });
  for (const piece of fillerPieces) {
    const stone = finish(piece);
    if (stone) stones.push(toStone(stone));
  }

  return { width: W, height: H, stones };
}
