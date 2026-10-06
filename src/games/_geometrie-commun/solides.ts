/**
 * Solides en 3D (sommets, faces) projetés en perspective cavalière « tournable » : on fait pivoter le
 * solide, puis on dessine les faces vues, les arêtes cachées en pointillés (convention du cycle 3).
 * Pur calcul géométrique (mécanique d'affichage) : aucun contenu pédagogique.
 */

export type V3 = [number, number, number];

export interface Modele {
  sommets: V3[];
  /** Faces : indices des sommets dans l'ordre du contour. */
  faces: number[][];
  /** Faces de la surface courbe (cylindre, cône) : leurs arêtes communes ne sont pas des arêtes. */
  courbes?: Set<number>;
  /** Sommets à ne pas marquer (points de la base d'un cône…). */
  sommetsReels?: number[];
  boule?: boolean;
}

const polygone = (n: number, r: number, y: number, phase = 0): V3[] =>
  Array.from({ length: n }, (_, k) => {
    const a = phase + (2 * Math.PI * k) / n;
    return [r * Math.cos(a), y, r * Math.sin(a)];
  });

function boite(L: number, H: number, P: number): Modele {
  const [x, y, z] = [L / 2, H / 2, P / 2];
  const s: V3[] = [
    [-x, -y, -z],
    [x, -y, -z],
    [x, y, -z],
    [-x, y, -z],
    [-x, -y, z],
    [x, -y, z],
    [x, y, z],
    [-x, y, z],
  ];
  return {
    sommets: s,
    faces: [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [3, 2, 6, 7],
      [0, 3, 7, 4],
      [1, 2, 6, 5],
    ],
  };
}

function pyramide(n: number, phase: number): Modele {
  const base = polygone(n, 1.15, -0.8, phase);
  const s: V3[] = [...base, [0, 1.1, 0]];
  return {
    sommets: s,
    faces: [base.map((_, k) => k), ...base.map((_, k) => [k, (k + 1) % n, n])],
  };
}

function prisme(n: number, phase: number, r = 1, h = 1.7, couche = false): Modele {
  const bas = polygone(n, r, -h / 2, phase);
  const haut = polygone(n, r, h / 2, phase);
  const s = [...bas, ...haut];
  const cotes = bas.map((_, k) => [k, (k + 1) % n, n + ((k + 1) % n), n + k]);
  const m: Modele = {
    sommets: s,
    faces: [bas.map((_, k) => k), haut.map((_, k) => n + k), ...cotes],
  };
  if (couche) m.sommets = s.map(([x, y, z]) => [y, x, z] as V3); // couché (tente)
  return m;
}

function cylindre(): Modele {
  const m = prisme(28, 0, 1, 1.8);
  m.courbes = new Set(Array.from({ length: 28 }, (_, k) => k + 2));
  m.sommetsReels = [];
  return m;
}

function cone(): Modele {
  const m = pyramide(28, 0);
  m.courbes = new Set(Array.from({ length: 28 }, (_, k) => k + 1));
  m.sommetsReels = [28];
  return m;
}

/** Modèle d'un solide d'après son identifiant de contenu (null si inconnu). */
export function modeleSolide(id: string): Modele | null {
  switch (id) {
    case 'cube':
      return boite(1.6, 1.6, 1.6);
    case 'pave':
      return boite(2.4, 1.2, 1.4);
    case 'pyramide':
    case 'pyramide_base_carree':
      return pyramide(4, Math.PI / 4);
    case 'pyramide_base_triangulaire':
      return pyramide(3, Math.PI / 2);
    case 'prisme_base_triangulaire':
      return prisme(3, 0, 1, 2.4, true);
    case 'prisme_base_hexagonale':
      return prisme(6, 0, 1.05, 1.7);
    case 'cylindre':
      return cylindre();
    case 'cone':
      return cone();
    case 'boule':
      return { sommets: [], faces: [], boule: true };
    default:
      return null;
  }
}

export const SOLIDES_CONNUS = [
  'cube',
  'pave',
  'pyramide',
  'pyramide_base_carree',
  'pyramide_base_triangulaire',
  'prisme_base_triangulaire',
  'prisme_base_hexagonale',
  'cylindre',
  'cone',
  'boule',
];

/* ------------------------------------------------------------------ */
/* Projection                                                          */
/* ------------------------------------------------------------------ */

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const croix = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const scal = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Rotation : lacet (autour de l'axe vertical) puis tangage (vu un peu d'en haut). */
export function tourner([x, y, z]: V3, lacet: number, tangage: number): V3 {
  const [c1, s1] = [Math.cos(lacet), Math.sin(lacet)];
  const x1 = x * c1 + z * s1;
  const z1 = -x * s1 + z * c1;
  const [c2, s2] = [Math.cos(tangage), Math.sin(tangage)];
  const y2 = y * c2 - z1 * s2;
  const z2 = y * s2 + z1 * c2;
  return [x1, y2, z2];
}

export interface Projection {
  /** Points 2D (y vers le bas) */
  points: [number, number][];
  /** Faces visibles (vers l'observateur), avec un éclairage 0..1. */
  faces: { i: number; visible: boolean; lumiere: number; profondeur: number }[];
  /** Arêtes : sommets, visibilité ; les arêtes internes d'une surface courbe sont omises. */
  aretes: { a: number; b: number; visible: boolean; silhouette: boolean }[];
}

export function projeter(m: Modele, lacet: number, tangage: number): Projection {
  const centre: V3 = m.sommets.reduce<V3>(
    (s, v) => [
      s[0] + v[0] / m.sommets.length,
      s[1] + v[1] / m.sommets.length,
      s[2] + v[2] / m.sommets.length,
    ],
    [0, 0, 0],
  );
  const r = m.sommets.map((v) => tourner(v, lacet, tangage));
  const rc = tourner(centre, lacet, tangage);
  const lumiereDir: V3 = [-0.4, 0.7, 0.6];
  const faces = m.faces.map((f, i) => {
    const [a, b, c] = [r[f[0]!]!, r[f[1]!]!, r[f[2]!]!];
    let n = croix(sub(b, a), sub(c, a));
    const fc = f.reduce<V3>(
      (s, k) => [s[0] + r[k]![0] / f.length, s[1] + r[k]![1] / f.length, s[2] + r[k]![2] / f.length],
      [0, 0, 0],
    );
    if (scal(n, sub(fc, rc)) < 0) n = [-n[0], -n[1], -n[2]];
    const len = Math.hypot(...n) || 1;
    const nz = n[2] / len;
    const l = Math.max(0, scal([n[0] / len, n[1] / len, nz], lumiereDir) / Math.hypot(...lumiereDir));
    return { i, visible: nz > 1e-6, lumiere: 0.35 + 0.65 * l, profondeur: fc[2] };
  });
  const parArete = new Map<string, number[]>();
  m.faces.forEach((f, i) =>
    f.forEach((a, k) => {
      const b = f[(k + 1) % f.length]!;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      parArete.set(key, [...(parArete.get(key) ?? []), i]);
    }),
  );
  const aretes: Projection['aretes'] = [];
  for (const [key, fs] of parArete) {
    const [a, b] = key.split('-').map(Number) as [number, number];
    const vis = fs.map((i) => faces[i]!.visible);
    const courbes = fs.filter((i) => m.courbes?.has(i)).length;
    const silhouette = vis.some(Boolean) && !vis.every(Boolean);
    if (courbes === fs.length && fs.length > 1 && !silhouette) continue; // intérieur de la surface courbe
    aretes.push({ a, b, visible: vis.some(Boolean), silhouette });
  }
  return { points: r.map(([x, y]) => [x, -y]), faces, aretes };
}

/** Nombre de faces, arêtes, sommets d'un polyèdre (pour vérifier les modèles). */
export function compter(m: Modele) {
  const aretes = new Set<string>();
  m.faces.forEach((f) =>
    f.forEach((a, k) => {
      const b = f[(k + 1) % f.length]!;
      aretes.add(a < b ? `${a}-${b}` : `${b}-${a}`);
    }),
  );
  return { faces: m.faces.length, aretes: aretes.size, sommets: m.sommets.length };
}
