/**
 * Outils de géométrie des cartes : les tracés sont écrits en longitude/latitude (degrés), puis
 * projetés (projection équirectangulaire corrigée par le cosinus d'une latitude de référence).
 * Écrire les cartes en coordonnées géographiques réelles garde des formes reconnaissables et
 * permet de tester l'exactitude (ex. « Lyon est bien dans la zone Auvergne-Rhône-Alpes »).
 */

/** Point géographique [longitude, latitude] en degrés. */
export type LonLat = readonly [number, number];
export type Point = [number, number];
export type Projection = (p: LonLat) => Point;

/** Projection équirectangulaire : `k` unités SVG par degré de latitude. */
export function equirect({
  lonMin,
  latMax,
  latRef,
  k,
  dx = 0,
  dy = 0,
}: {
  lonMin: number;
  latMax: number;
  latRef: number;
  k: number;
  dx?: number;
  dy?: number;
}): Projection {
  const kx = k * Math.cos((latRef * Math.PI) / 180);
  return ([lon, lat]) => [dx + (lon - lonMin) * kx, dy + (latMax - lat) * k];
}

/** Projection qui fait tenir des anneaux dans un rectangle (encarts : outre-mer…). */
export function ajuster(
  anneaux: LonLat[][],
  boite: { x: number; y: number; w: number; h: number },
  marge = 6,
): Projection {
  const pts = anneaux.flat();
  const lons = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  const lonMin = Math.min(...lons);
  const lonMax = Math.max(...lons);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);
  const latRef = (latMin + latMax) / 2;
  const kx0 = Math.cos((latRef * Math.PI) / 180);
  const larg = Math.max(1e-6, (lonMax - lonMin) * kx0);
  const haut = Math.max(1e-6, latMax - latMin);
  const k = Math.min((boite.w - 2 * marge) / larg, (boite.h - 2 * marge) / haut);
  const dx = boite.x + (boite.w - larg * k) / 2;
  const dy = boite.y + (boite.h - haut * k) / 2;
  return equirect({ lonMin, latMax, latRef, k, dx, dy });
}

/** Retourne une chaîne de points (frontière parcourue dans l'autre sens). */
export const rev = (c: readonly LonLat[]): LonLat[] => [...c].reverse();

const memePoint = (a: LonLat, b: LonLat) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;

/**
 * Assemble des frontières bout à bout en un anneau fermé. Chaque frontière doit commencer là où
 * la précédente finit (sinon erreur : c'est ce qui garantit des régions voisines sans trou).
 */
export function anneau(...chaines: (readonly LonLat[])[]): LonLat[] {
  const out: LonLat[] = [];
  chaines.forEach((c, i) => {
    if (!c.length) return;
    const dernier = out[out.length - 1];
    if (dernier && !memePoint(dernier, c[0]!)) {
      throw new Error(`Frontières non jointives (n° ${i}) : ${dernier.join(',')} ≠ ${c[0]!.join(',')}`);
    }
    out.push(...(dernier ? c.slice(1) : c));
  });
  if (out.length > 1 && memePoint(out[0]!, out[out.length - 1]!)) out.pop();
  return out;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Chemin SVG (une ou plusieurs surfaces fermées). */
export function cheminSurface(anneaux: readonly (readonly LonLat[])[], proj: Projection): string {
  return anneaux
    .map(
      (a) =>
        a
          .map((p, i) => {
            const [x, y] = proj(p);
            return `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`;
          })
          .join('') + 'Z',
    )
    .join('');
}

/** Chemin SVG ouvert (fleuves), légèrement lissé (courbes quadratiques entre les milieux). */
export function cheminLigne(lignes: readonly (readonly LonLat[])[], proj: Projection): string {
  return lignes
    .map((l) => {
      const p = l.map(proj);
      if (p.length < 3) return p.map(([x, y], i) => `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`).join('');
      let d = `M${r1(p[0]![0])} ${r1(p[0]![1])}`;
      for (let i = 1; i < p.length - 1; i++) {
        const [x, y] = p[i]!;
        const [nx, ny] = p[i + 1]!;
        const mx = i === p.length - 2 ? nx : (x + nx) / 2;
        const my = i === p.length - 2 ? ny : (y + ny) / 2;
        d += `Q${r1(x)} ${r1(y)} ${r1(mx)} ${r1(my)}`;
      }
      return d;
    })
    .join('');
}

/** Aire signée d'un polygone projeté. */
function aireSignee(p: Point[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i]!;
    const [x2, y2] = p[(i + 1) % p.length]!;
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/** Centre (centroïde) de la plus grande surface — sert aux étiquettes et à la navigation clavier. */
export function centreSurface(anneaux: readonly (readonly LonLat[])[], proj: Projection): Point {
  let meilleur: Point = [0, 0];
  let aireMax = -1;
  for (const a of anneaux) {
    const p = a.map(proj);
    const A = aireSignee(p);
    if (Math.abs(A) <= aireMax) continue;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < p.length; i++) {
      const [x1, y1] = p[i]!;
      const [x2, y2] = p[(i + 1) % p.length]!;
      const f = x1 * y2 - x2 * y1;
      cx += (x1 + x2) * f;
      cy += (y1 + y2) * f;
    }
    aireMax = Math.abs(A);
    meilleur = A === 0 ? p[0]! : [cx / (6 * A), cy / (6 * A)];
    // Forme concave (Norvège, Croatie…) : le centroïde peut tomber dehors. On prend alors le milieu
    // du plus long segment intérieur sur l'horizontale du centroïde.
    if (!dansPolygone(meilleur, p)) meilleur = milieuInterieur(p, meilleur[1]) ?? meilleur;
  }
  return [r1(meilleur[0]), r1(meilleur[1])];
}

/** Milieu du plus long segment horizontal intérieur au polygone à l'ordonnée y (essaie y voisins). */
function milieuInterieur(p: Point[], y0: number): Point | null {
  const ys = p.map((q) => q[1]);
  const h = Math.max(...ys) - Math.min(...ys);
  for (const f of [0, 0.05, -0.05, 0.1, -0.1, 0.2, -0.2, 0.3, -0.3]) {
    const y = y0 + f * h;
    const xs: number[] = [];
    for (let i = 0; i < p.length; i++) {
      const [x1, y1] = p[i]!;
      const [x2, y2] = p[(i + 1) % p.length]!;
      if (y1 > y !== y2 > y) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
    }
    xs.sort((a, b) => a - b);
    let best: Point | null = null;
    let lmax = 0;
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const l = xs[i + 1]! - xs[i]!;
      if (l > lmax) {
        lmax = l;
        best = [(xs[i]! + xs[i + 1]!) / 2, y];
      }
    }
    if (best) return best;
  }
  return null;
}

/** Point médian d'une ligne (étiquette d'un fleuve). */
export function centreLigne(lignes: readonly (readonly LonLat[])[], proj: Projection): Point {
  const l = lignes[0] ?? [];
  const p = l[Math.floor(l.length / 2)];
  if (!p) return [0, 0];
  const [x, y] = proj(p);
  return [r1(x), r1(y)];
}

/** Aire (en unités SVG²) d'une surface projetée : sert aux tests (zone assez grande pour être touchée). */
export function aireSurface(anneaux: readonly (readonly LonLat[])[], proj: Projection): number {
  return anneaux.reduce((s, a) => s + Math.abs(aireSignee(a.map(proj))), 0);
}

/** Le point est-il dans le polygone (lon/lat) ? Algorithme du rayon. */
export function dansPolygone(pt: LonLat, poly: readonly LonLat[]): boolean {
  const [x, y] = pt;
  let dedans = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}
