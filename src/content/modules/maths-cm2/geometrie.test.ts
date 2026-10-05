/**
 * Géométrie CM2 : réponses recalculées indépendamment (milieux, parallèles, perpendiculaires, sommets
 * manquants, symétriques, patrons de cube et de pavé par « roulage » d’une boite, programmes de robot
 * simulés, y compris les boucles).
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '@/engine/rng';
import { LEVELS, type Level } from '../../schemas';
import { programmes } from './geometrie';
import { tiragesDe } from './testkit';

type P = [number, number];
const k = (p: P) => `${p[0]},${p[1]}`;
const lire = (s: string): P => s.split(',').map(Number) as P;

/* ------------------------------------------------------------------ */
/* Patrons : on fait rouler une boite (pavé) sur les rectangles         */
/* ------------------------------------------------------------------ */

type R = { x: number; y: number; w: number; h: number };
type Faces = { bas: number; haut: number; n: number; s: number; e: number; o: number };

/** Vrai si les rectangles se replient en un pavé (ou un cube si tous sont des carrés 1 × 1). */
function seReplieEnPave(rects: R[]): boolean {
  if (rects.length !== 6) return false;
  const eq = (a: R, b: R) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
  const hauteurs = [...new Set(rects.flatMap((r) => [r.w, r.h]))];
  for (const dz0 of hauteurs) {
    const vus = new Map<number, Faces>([[0, { bas: 0, haut: 1, n: 2, s: 3, e: 4, o: 5 }]]);
    const dz = new Map<number, number>([[0, dz0]]);
    const file = [0];
    while (file.length) {
      const i = file.shift()!;
      const r = rects[i]!;
      const z = dz.get(i)!;
      const f = vus.get(i)!;
      const voisins: [R, number, Faces][] = [
        [{ x: r.x + r.w, y: r.y, w: z, h: r.h }, r.w, { ...f, bas: f.e, o: f.bas, e: f.haut, haut: f.o }],
        [{ x: r.x - z, y: r.y, w: z, h: r.h }, r.w, { ...f, bas: f.o, e: f.bas, o: f.haut, haut: f.e }],
        [{ x: r.x, y: r.y + r.h, w: r.w, h: z }, r.h, { ...f, bas: f.s, n: f.bas, s: f.haut, haut: f.n }],
        [{ x: r.x, y: r.y - z, w: r.w, h: z }, r.h, { ...f, bas: f.n, s: f.bas, n: f.haut, haut: f.s }],
      ];
      for (const [att, nz, nf] of voisins) {
        const j = rects.findIndex((q) => eq(q, att));
        if (j < 0 || vus.has(j)) continue;
        vus.set(j, nf);
        dz.set(j, nz);
        file.push(j);
      }
    }
    if (vus.size === 6 && new Set([...vus.values()].map((q) => q.bas)).size === 6) return true;
  }
  return false;
}
const carres = (cells: P[]): R[] => cells.map(([x, y]) => ({ x, y, w: 1, h: 1 }));

describe('géométrie CM2 — solides et patrons', () => {
  it('patrons de cube et de pavé : la réponse est celle du pliage', () => {
    let pavesOui = 0;
    let pavesNon = 0;
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GEO.SOLIDES', 'geometry_shape', level, 400)) {
        if (it.task !== 'patron') continue;
        if (it.shape === 'patron_cube')
          expect(it.answer, JSON.stringify(it.grid)).toBe(
            seReplieEnPave(carres(it.grid!.cells)) ? 'oui' : 'non',
          );
        if (it.shape === 'patron_pave') {
          const rects = it.meta!.rectangles as R[];
          const ok = seReplieEnPave(rects);
          expect(it.answer, JSON.stringify(rects)).toBe(ok ? 'oui' : 'non');
          if (ok) pavesOui++;
          else pavesNon++;
          // Les cases du quadrillage sont exactement celles des rectangles
          expect(it.grid!.cells.length).toBe(rects.reduce((s, r) => s + r.w * r.h, 0));
        }
        if (it.shape === 'patron_cube_incomplet') {
          const reste = it.grid!.cells;
          const sols = it.meta!.solutions as string[];
          expect(sols).toContain(it.answer);
          for (let x = 0; x < it.grid!.cols; x++)
            for (let y = 0; y < it.grid!.rows; y++) {
              if (reste.some((c) => c[0] === x && c[1] === y)) continue;
              const ok = seReplieEnPave(carres([...reste, [x, y]]));
              expect(sols.includes(`${x},${y}`), `${x},${y}`).toBe(ok);
            }
        }
      }
    expect(pavesOui).toBeGreaterThan(5);
    expect(pavesNon).toBeGreaterThan(5);
  });

  // Table indépendante : [faces, arêtes, sommets]
  const TABLE: [RegExp, number, number, number][] = [
    [/cube/, 6, 12, 8],
    [/pavé/, 6, 12, 8],
    [/pyramide à base carrée/, 5, 8, 5],
    [/pyramide à base triangulaire/, 4, 6, 4],
    [/prisme droit à base triangulaire/, 5, 9, 6],
    [/prisme droit à base hexagonale/, 8, 18, 12],
  ];
  it('faces, arêtes, sommets : recalculés (et relation d’Euler F + S − A = 2)', () => {
    for (const [, f, a, s] of TABLE) expect(f + s - a).toBe(2);
    for (const level of LEVELS) {
      for (const it of tiragesDe('CM2.MA.GEO.SOLIDES', 'numeric_answer', level)) {
        const asm = it.meta?.assemblage as {
          hauteurs?: number[][];
          pave?: number[];
          cube?: number;
          deja?: number;
        };
        if (asm?.hauteurs) {
          expect(it.answer).toBe(asm.hauteurs.flat().reduce((x, y) => x + y, 0));
          continue;
        }
        if (asm?.pave) {
          expect(it.answer).toBe(asm.pave.reduce((x, y) => x * y, 1));
          continue;
        }
        if (asm?.cube) {
          expect(it.answer).toBe(asm.cube ** 3 - asm.deja!);
          continue;
        }
        const ligne = TABLE.find(([re]) => re.test(it.prompt))!;
        expect(ligne, it.prompt).toBeDefined();
        const v = /faces/.test(it.prompt) ? ligne[1] : /arêtes/.test(it.prompt) ? ligne[2] : ligne[3];
        expect(it.answer, it.prompt).toBe(v);
        if (level === 'facile') expect(it.prompt).toMatch(/cube|pavé/);
      }
      for (const it of tiragesDe('CM2.MA.GEO.SOLIDES', 'mcq', level)) {
        const m = it.question.match(/(\d+) faces, (\d+) arêtes et (\d+) sommets/);
        if (!m) continue;
        const good = it.choices[it.answerIndex]!;
        const ligne = TABLE.find(([re]) => re.test(good))!;
        expect([ligne[1], ligne[2], ligne[3]]).toEqual([Number(m[1]), Number(m[2]), Number(m[3])]);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* Robot                                                               */
/* ------------------------------------------------------------------ */

const DIRS: Record<string, P> = { haut: [0, -1], droite: [1, 0], bas: [0, 1], gauche: [-1, 0] };
const ORDRE = ['haut', 'droite', 'bas', 'gauche'];
const FL: Record<string, string> = { '↑': 'haut', '→': 'droite', '↓': 'bas', '←': 'gauche' };

function deplie(prog: string): string[] {
  const out: string[] = [];
  const toks = prog.split(' ').filter(Boolean);
  for (let i = 0; i < toks.length; i++) {
    if (toks[i] === 'répéter') {
      const n = Number(toks[i + 1]);
      expect(toks[i + 2]).toBe('fois');
      expect(toks[i + 3]).toBe('[');
      const fin = toks.indexOf(']', i);
      const motif = toks.slice(i + 4, fin);
      for (let r = 0; r < n; r++) out.push(...motif);
      i = fin;
    } else out.push(toks[i]!);
  }
  return out;
}

function simule(dep: P, orient: string, prog: string[]) {
  let [x, y] = dep;
  let d = ORDRE.indexOf(orient);
  const chemin: P[] = [];
  for (const p of prog) {
    if (p === 'D') d = (d + 1) % 4;
    else if (p === 'G') d = (d + 3) % 4;
    else {
      const [dx, dy] = DIRS[p === 'A' ? ORDRE[d]! : FL[p]!]!;
      x += dx;
      y += dy;
      chemin.push([x, y]);
    }
  }
  return { fin: [x, y] as P, chemin, orient: ORDRE[d]! };
}

describe('géométrie CM2 — déplacements', () => {
  it('le programme proposé mène au trésor sans sortir ni toucher de rocher', () => {
    let boucles = 0;
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GEO.DEPLACEMENTS', 'geometry_shape', level)) {
        const r = it.meta!.robot as {
          cols: number;
          rows: number;
          depart: P;
          cible: P;
          obstacles: P[];
          relatif: boolean;
          orientation: string;
        };
        const prog = deplie(it.answer);
        if (it.answer.includes('répéter')) {
          boucles++;
          expect(level).toBe('plus_loin');
          expect(prog.join(' ')).toBe(it.meta!.programmeDeplie);
        }
        const s = simule(r.depart, r.orientation, prog);
        for (const c of s.chemin) {
          expect(c[0] >= 0 && c[1] >= 0 && c[0] < r.cols && c[1] < r.rows, it.answer).toBe(true);
          expect(
            r.obstacles.some((o) => k(o) === k(c)),
            it.answer,
          ).toBe(false);
        }
        expect(s.fin).toEqual(r.cible);
        if (level === 'facile') expect(prog.every((p) => p in FL)).toBe(true);
        else expect(prog.every((p) => ['A', 'D', 'G'].includes(p))).toBe(true);
      }
    expect(boucles).toBeGreaterThan(50);
  });

  const lireEnonce = (t: string) => {
    const dep = t.match(/case colonne (\d+), ligne (\d+)/)!;
    const orient = t.match(/regarde vers (?:le |la )(haut|droite|bas|gauche)/)?.[1] ?? 'haut';
    const prog = t.match(/exécute : (.+?)\. /)![1]!;
    return { dep: [Number(dep[1]) - 1, Number(dep[2]) - 1] as P, orient, prog: deplie(prog) };
  };
  const nom = (p: P) => `colonne ${p[0] + 1}, ligne ${p[1] + 1}`;

  it('« où arrive le robot ? » et vrai / faux : la case est recalculée', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe('CM2.MA.GEO.DEPLACEMENTS', 'mcq', level)) {
        const good = it.choices[it.answerIndex]!;
        if (it.question.includes('exécute')) {
          const e = lireEnonce(it.question);
          expect(good).toBe(nom(simule(e.dep, e.orient, e.prog).fin));
        } else {
          const m = it.question.match(/regarde vers (?:le |la )(\w+)\. Il fait (.+)\. Vers/)!;
          let d = ORDRE.indexOf(m[1]!);
          for (const t of m[2]!.split(', puis ')) d = (d + (t.endsWith('droite') ? 1 : 3)) % 4;
          expect(good).toBe(`vers ${ORDRE[d] === 'haut' || ORDRE[d] === 'bas' ? 'le' : 'la'} ${ORDRE[d]}`);
        }
      }
      for (const it of tiragesDe('CM2.MA.GEO.DEPLACEMENTS', 'true_false', level)) {
        const e = lireEnonce(it.statement);
        const dit = it.statement.match(/arrive sur la case (colonne \d+, ligne \d+)/)![1];
        expect(it.answer).toBe(dit === nom(simule(e.dep, e.orient, e.prog).fin));
      }
      for (const it of tiragesDe('CM2.MA.GEO.DEPLACEMENTS', 'numeric_answer', level)) {
        const prog = deplie(it.meta!.programme as string);
        expect(it.answer).toBe(prog.filter((p) => p === 'A' || p in FL).length);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* Géométrie plane                                                     */
/* ------------------------------------------------------------------ */

const pts = (m: Record<string, unknown>) => m.points as Record<string, P>;
const vec = (a: P, b: P): P => [b[0] - a[0], b[1] - a[1]];
const dot = (u: P, v: P) => u[0] * v[0] + u[1] * v[1];
const cross = (u: P, v: P) => u[0] * v[1] - u[1] * v[0];

describe('géométrie CM2 — points à placer sur le quadrillage', () => {
  it('milieux, parallèles et perpendiculaires', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GEO.VOCAB', 'geometry_shape', level)) {
        const { A, B, C } = pts(it.meta!);
        const X = lire(it.answer);
        expect(X[0] >= 0 && X[1] >= 0 && X[0] <= it.grid!.cols && X[1] <= it.grid!.rows).toBe(true);
        if (/milieu|centre/.test(it.prompt)) expect(X).toEqual([(A![0] + B![0]) / 2, (A![1] + B![1]) / 2]);
        else if (/parallèle/.test(it.prompt)) {
          expect(vec(C!, X)).toEqual(vec(A!, B!));
          expect(cross(vec(A!, B!), vec(A!, C!))).not.toBe(0);
        } else {
          const u = vec(A!, B!);
          const v = vec(A!, X);
          expect(dot(u, v)).toBe(0);
          expect(dot(v, v)).toBe(dot(u, u));
          if (it.prompt.includes('au-dessus')) expect(v[1]).toBeLessThan(0);
        }
        if (level === 'facile') expect(A![0] === B![0] || A![1] === B![1]).toBe(true);
      }
  });

  it('quatrième sommet d’un carré, d’un rectangle ou d’un losange', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GEO.CONSTRUIRE', 'geometry_shape', level)) {
        const { A, B, C } = pts(it.meta!);
        const D = lire(it.answer);
        const ab = vec(A!, B!);
        const bc = vec(B!, C!);
        expect(vec(A!, D)).toEqual(bc);
        expect(vec(D, C!)).toEqual(ab);
        if (/carré|rectangle/.test(it.prompt)) expect(dot(ab, bc)).toBe(0);
        if (/carré/.test(it.prompt)) expect(dot(ab, ab)).toBe(dot(bc, bc));
        if (/losange/.test(it.prompt)) {
          expect(dot(ab, ab)).toBe(dot(bc, bc));
          expect(dot(ab, bc)).not.toBe(0);
        }
        if (/rectangle/.test(it.prompt) && level === 'plus_loin') expect(dot(ab, ab)).not.toBe(dot(bc, bc));
      }
  });
});

describe('géométrie CM2 — symétrie', () => {
  it('la solution est exactement le symétrique (axe vertical, horizontal, diagonales)', () => {
    const vus = new Set<string>();
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GEO.SYMETRIE', 'geometry_shape', level)) {
        const g = it.grid!;
        const axe = (it.meta!.axe as { type: string }).type;
        vus.add(`${level}:${axe}`);
        const miroir = ([x, y]: P): P =>
          axe === 'vertical'
            ? [g.cols - 1 - x, y]
            : axe === 'horizontal'
              ? [x, g.rows - 1 - y]
              : axe === 'diagonale'
                ? [y, x]
                : [g.cols - 1 - y, g.rows - 1 - x];
        const deja = new Set(g.cells.map(k));
        const attendu = new Set(
          g.cells
            .map(miroir)
            .map(k)
            .filter((c) => !deja.has(c)),
        );
        expect(new Set(it.answer.split(';'))).toEqual(attendu);
        // La figure complétée est symétrique
        const tout = [...g.cells.map(k), ...attendu];
        for (const c of tout) expect(tout).toContain(k(miroir(lire(c))));
        if (it.meta!.mode === 'colorier') expect(attendu.size).toBe(g.cells.length);
        if (level === 'facile') expect(axe).toBe('vertical');
        if (level === 'normal') expect(['vertical', 'horizontal', 'diagonale']).toContain(axe);
        if (axe === 'diagonale' || axe === 'anti-diagonale') expect(g.cols).toBe(g.rows);
      }
    for (const v of ['normal:diagonale', 'plus_loin:anti-diagonale', 'normal:horizontal'])
      expect(vus).toContain(v);
  });

  it('nombre d’axes de symétrie et distances à l’axe', () => {
    const AXES: [RegExp, string][] = [
      [/trapèze rectangle/, '0'],
      [/rectangle/, '2'],
      [/losange/, '2'],
      [/carré/, '4'],
      [/triangle équilatéral/, '3'],
      [/triangle isocèle/, '1'],
      [/longueurs différentes/, '0'],
      [/cercle/, 'une infinité'],
      [/hexagone/, '6'],
      [/pentagone/, '5'],
    ];
    for (const level of LEVELS) {
      for (const it of tiragesDe('CM2.MA.GEO.SYMETRIE', 'mcq', level)) {
        const good = it.choices[it.answerIndex]!;
        if (it.question.startsWith('Combien'))
          expect(good).toBe(AXES.find(([re]) => re.test(it.question))![1]);
        else if (it.question.includes('séparent')) {
          const n = Number(it.question.match(/à (\d+) carreau/)![1]);
          expect(good).toBe(`${2 * n} carreaux`);
        } else {
          const n = it.question.match(/à (\d+) carreau/)![1];
          expect(good.startsWith(`à ${n} carreau`)).toBe(true);
          expect(good).toMatch(/à droite|en dessous/);
          if (level === 'facile') expect(it.question).toContain('vertical');
        }
      }
      for (const it of tiragesDe('CM2.MA.GEO.SYMETRIE', 'true_false', level)) {
        const m = [...it.statement.matchAll(/à (\d+) carreau/g)].map((x) => x[1]);
        if (m.length === 2 && it.statement.includes('l’un de l’autre'))
          expect(it.answer).toBe(Number(m[1]) === 2 * Number(m[0]));
        else if (m.length === 2) expect(it.answer).toBe(m[0] === m[1]);
      }
    }
  });
});

describe('géométrie CM2 — figures et constructions', () => {
  it('« Qui suis-je ? » : les indices vont du moins au plus révélateur et un seul choix convient', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GEO.FIGURES', 'mcq', level)) {
        expect(it.hints!.length).toBeGreaterThanOrEqual(3);
        const good = it.choices[it.answerIndex]!;
        // Aucun choix « cas particulier » ou « cas général » de la bonne réponse
        const familles: Record<string, string[]> = {
          carré: ['rectangle', 'losange'],
          rectangle: ['carré'],
          losange: ['carré'],
          'triangle rectangle': ['triangle'],
          'triangle isocèle': ['triangle équilatéral', 'triangle'],
          'triangle équilatéral': ['triangle isocèle', 'triangle'],
          trapèze: ['trapèze rectangle'],
          'trapèze rectangle': ['trapèze'],
        };
        for (const c of it.choices) if (c !== good) expect(familles[good] ?? []).not.toContain(c);
      }
  });

  it('propriétés des figures cohérentes', () => {
    const DROITS: Record<string, number> = {
      carre: 4,
      rectangle: 4,
      losange: 0,
      triangle: 0,
      triangle_rectangle: 1,
      triangle_isocele: 0,
      triangle_equilateral: 0,
      trapeze: 0,
      trapeze_rectangle: 2,
    };
    for (const level of ['normal', 'plus_loin'] as Level[])
      for (const it of tiragesDe('CM2.MA.GEO.FIGURES', 'geometry_shape', level)) {
        if (/angles droits/.test(it.prompt)) expect(Number(it.answer)).toBe(DROITS[it.shape]);
        if (it.task === 'nommer' || it.task === 'proprietes') expect(it.choices).toContain(it.answer);
      }
  });

  it('les classements gardent toujours la même catégorie pour un même élément', () => {
    const cats = new Map<string, string>();
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GEO.VOCAB', 'classification', level)) {
        for (const e of it.elements) {
          const c = it.categories[e.category]!;
          if (cats.has(e.label)) expect(cats.get(e.label), e.label).toBe(c);
          cats.set(e.label, c);
        }
      }
  });

  it('programmes de construction : chaque étape est unique, l’écartement du compas = rayon', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe('CM2.MA.GEO.CONSTRUIRE', 'ordering', level)) {
        expect(it.elements.length).toBe(level === 'facile' ? 3 : level === 'normal' ? 4 : 5);
        expect(it.elements[0]).toMatch(/^(Trace|Écarte)/);
      }
      for (const it of tiragesDe('CM2.MA.GEO.CONSTRUIRE', 'mcq', level)) {
        if (it.question.startsWith('Il manque')) {
          // Le bon choix est le seul qui commence comme lui : aucune autre étape « presque pareille »
          const debut = (e: string) => e.split(' ').slice(0, 3).join(' ');
          const good = it.choices[it.answerIndex]!;
          for (const c of it.choices) if (c !== good) expect(debut(c)).not.toBe(debut(good));
        }
        const m = it.question.match(/cercle de (\d+) cm de diamètre, de combien/);
        if (m) expect(it.choices[it.answerIndex]).toBe(`${String(Number(m[1]) / 2).replace('.', ',')} cm`);
        const r = it.question.match(/cercle de rayon (\d+) cm, de combien/);
        if (r) expect(it.choices[it.answerIndex]).toBe(`${r[1]} cm`);
      }
    }
  });

  it('programmes de construction : l’ordre est unique (chaque étape dépend de la précédente)', () => {
    // Une étape dépend de la précédente si elle utilise un point que celle-ci vient de créer,
    // ou une formule qui y renvoie (« cette droite », « sans changer l’écartement »…).
    const RENVOIS = [
      'Sans changer',
      'cette droite',
      'ces droites',
      'les deux arcs',
      'que tu viens de tracer',
      'pour fermer',
    ];
    // Points nommés : « A », ou les lettres d’un segment « [AB] » / d’un polygone « ABCD »
    const points = (e: string) =>
      new Set((e.match(/\b[A-DMO]+\b/g) ?? []).flatMap((m) => (/^[A-DMO]+$/.test(m) ? [...m] : [])));
    for (const level of LEVELS)
      for (let graine = 1; graine <= 20; graine++)
        for (const prog of programmes(level, createRng(graine))) {
          const vus = new Set<string>();
          prog.etapes.forEach((e, i) => {
            if (i > 0) {
              const nouveaux = [...points(prog.etapes[i - 1]!)].filter((p) => !vus.has(p));
              const ok = RENVOIS.some((r) => e.includes(r)) || nouveaux.some((p) => points(e).has(p));
              expect(ok, `${prog.figure} : étape ${i + 1} « ${e} »`).toBe(true);
              for (const p of points(prog.etapes[i - 1]!)) vus.add(p);
            }
          });
        }
  });
});
