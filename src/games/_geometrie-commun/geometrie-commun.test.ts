/**
 * Logique des jeux 21 à 28 vérifiée sur des items réellement produits par les modules de contenu :
 * symétries, simulation du robot, pliage des patrons, lecture des graphiques, expériences aléatoires,
 * mesures, figures et silhouettes du tangram.
 */
import { describe, expect, it } from 'vitest';
import { estPatronDeCube } from '@/content/modules/maths-cm2/geometrie-espace';
import { natureAngle } from '@/content/modules/maths-cm2/grandeurs';
import type { Item } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { estPourGeometre, estRectangle, modeDe } from '../geometre/logique';
import { estPourMesureur } from '../mesureur/logique';
import { estProba } from '../roue-probabilites/logique';
import {
  cadre as cadreTangram,
  estPourTangram,
  retourner,
  silhouette,
  sommets,
  tourner,
} from '../tangram/pieces';
import { estPourUsine, modeUsine } from '../usine-patrons/logique';
import { angleDroit, dessinDe } from './figures';
import { echelle, lireDonnees, lisible } from './graphique';
import {
  type Cell,
  axeDe,
  cle,
  estSymetrie,
  lireCase,
  lirePoints,
  lireReproduire,
  memeFigureTranslatee,
  memesCases,
  solutionSymetrie,
  symetrique,
} from './grille';
import { lireAngles, lireConversion, lireMesure } from './mesure';
import { arbrePliage, casesEnRects, lirePatron, plierCube } from './patron';
import { lireExperience, tirer } from './proba';
import { deplier, lireProgramme, lireRobot, simuler } from './robot';
import { compter, modeleSolide } from './solides';
import { NIVEAUX, tirages, tousNiveaux } from './tirages';

const cases = (s: string) => s.split(';').map((x) => lireCase(x)!) as Cell[];

describe('Miroir magique : symétrie axiale', () => {
  for (const lecon of ['CE1.MA.GEO.SYMETRIE', 'CM2.MA.GEO.SYMETRIE'])
    it(`${lecon} : la solution calculée est celle du contenu`, () => {
      for (const it of tousNiveaux(lecon, 'geometry_shape')) {
        expect(estSymetrie(it)).toBe(true);
        if (it.kind !== 'geometry_shape') continue;
        const sol = solutionSymetrie(it);
        expect(memesCases(sol, cases(it.answer))).toBe(true);
        const axe = axeDe(it)!;
        const g = it.grid!;
        const donnees = new Set(g.cells.map((c) => cle(c)));
        // chaque case de la solution est l'image d'une case donnée, et la figure finale est symétrique
        for (const c of sol) expect(donnees.has(cle(symetrique(axe, g.cols, g.rows, c)))).toBe(true);
        const tout = new Set([...donnees, ...sol.map(cle)]);
        for (const k of tout) {
          const c = lireCase(k)!;
          expect(tout.has(cle(symetrique(axe, g.cols, g.rows, c)))).toBe(true);
        }
      }
    });

  it('l’anti-diagonale du CM2 est reconnue', () => {
    const items = tirages('CM2.MA.GEO.SYMETRIE', 'geometry_shape', 'plus_loin', 300);
    expect(items.some((it) => it.kind === 'geometry_shape' && axeDe(it) === 'anti-diagonale')).toBe(true);
  });
});

describe('Robot codeur : simulation', () => {
  for (const lecon of ['CE1.MA.GEO.REPERAGE', 'CM2.MA.GEO.DEPLACEMENTS'])
    it(`${lecon} : le programme exemple du contenu mène au trésor`, () => {
      for (const it of tousNiveaux(lecon, 'geometry_shape')) {
        const plan = lireRobot(it);
        expect(plan).not.toBeNull();
        const sim = simuler(plan!, deplier(lireProgramme(plan!.exemple)));
        expect(sim.issue).toBe('cible');
      }
    });

  it('les boucles « répéter » se déplient et un rocher arrête le robot', () => {
    expect(deplier(lireProgramme('répéter 3 fois [ A G A D ] A'))).toEqual(
      'A G A D A G A D A G A D A'.split(' '),
    );
    const plan = {
      cols: 4,
      rows: 3,
      depart: [0, 0] as Cell,
      cible: [3, 0] as Cell,
      obstacles: [[2, 0]] as Cell[],
      relatif: false,
      orientation: 0 as const,
      boucles: false,
      longueurMini: null,
      exemple: '',
    };
    expect(simuler(plan, ['→', '→', '→']).issue).toBe('obstacle');
    expect(simuler(plan, ['↑']).issue).toBe('sortie');
    expect(simuler(plan, ['↓', '→', '→', '→', '↑']).issue).toBe('cible');
    expect(simuler(plan, ['↓', '→', '→', '→']).issue).toBe('pas-arrive');
    expect(simuler(plan, ['↓', '→', '→', '→', '↑', '↓']).issue).toBe('depasse');
  });
});

describe('Usine à patrons : pliage', () => {
  for (const lecon of ['CE1.MA.GEO.SOLIDES', 'CM2.MA.GEO.SOLIDES'])
    it(`${lecon} : patrons lisibles, pliage cohérent avec la réponse`, () => {
      let patrons = 0;
      for (const it of tousNiveaux(lecon, 'geometry_shape')) {
        if (it.kind !== 'geometry_shape') continue;
        expect(estPourUsine(it)).toBe(true);
        const p = lirePatron(it);
        if (it.task !== 'patron') continue;
        patrons++;
        expect(p).not.toBeNull();
        if (p!.type === 'cube') {
          expect(plierCube(p!.cells).ok).toBe(p!.oui);
          expect(plierCube(p!.cells).ok).toBe(estPatronDeCube(p!.cells));
        } else if (p!.type === 'completer') {
          for (const s of p!.solutions) expect(plierCube([...p!.cells, s]).ok).toBe(true);
        } else expect(arbrePliage(p!.rects)).not.toBeNull();
      }
      expect(patrons).toBeGreaterThan(0);
    });

  it('les 11 patrons du cube et quelques faux patrons', () => {
    const rng = createRng(5);
    // Polyominos de 6 carrés tirés au hasard : même verdict que la fonction du contenu
    for (let k = 0; k < 400; k++) {
      const cells: Cell[] = [[0, 0]];
      while (cells.length < 6) {
        const [x, y] = rng.pick(cells);
        const [dx, dy] = rng.pick([
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const);
        if (!cells.some((c) => c[0] === x + dx && c[1] === y + dy)) cells.push([x + dx, y + dy]);
      }
      expect(plierCube(cells).ok).toBe(estPatronDeCube(cells));
      expect(arbrePliage(casesEnRects(cells))).not.toBeNull();
    }
  });

  it('les solides dessinés ont le bon nombre de faces, arêtes, sommets', () => {
    expect(compter(modeleSolide('cube')!)).toEqual({ faces: 6, aretes: 12, sommets: 8 });
    expect(compter(modeleSolide('pave')!)).toEqual({ faces: 6, aretes: 12, sommets: 8 });
    expect(compter(modeleSolide('pyramide_base_carree')!)).toEqual({ faces: 5, aretes: 8, sommets: 5 });
    expect(compter(modeleSolide('pyramide_base_triangulaire')!)).toEqual({ faces: 4, aretes: 6, sommets: 4 });
    expect(compter(modeleSolide('prisme_base_triangulaire')!)).toEqual({ faces: 5, aretes: 9, sommets: 6 });
    expect(compter(modeleSolide('prisme_base_hexagonale')!)).toEqual({ faces: 8, aretes: 18, sommets: 12 });
  });

  it('les solides à compter et à nommer sont tous reconnus', () => {
    for (const lecon of ['CE1.MA.GEO.SOLIDES', 'CM2.MA.GEO.SOLIDES'])
      for (const it of tousNiveaux(lecon, 'geometry_shape'))
        if (it.kind === 'geometry_shape' && it.task !== 'patron') expect(modeUsine(it)).not.toBeNull();
  });
});

describe('Station météo : lecture des données', () => {
  for (const lecon of ['CE1.MA.DON.LIRE', 'CM2.MA.DON.LIRE'])
    for (const kind of ['numeric_answer', 'mcq', 'true_false', 'classification'] as const)
      it(`${lecon} ${kind} : graphique exploitable et réponse lisible`, () => {
        for (const it of tousNiveaux(lecon, kind, 100)) {
          if (kind === 'classification' && lecon.startsWith('CE1') && !it.meta) continue; // enquête à trier
          const plan = lireDonnees(it);
          expect(plan, it.id).not.toBeNull();
          const g = plan!.graphique;
          if (g && g.type !== 'circulaire' && g.type !== 'tableau') {
            const e = echelle(g.valeurs, g.type !== 'courbe');
            for (const v of g.valeurs) expect(v >= e.min && v <= e.max).toBe(true);
          }
          if (it.kind !== 'numeric_answer') continue;
          if (plan!.enquete)
            expect(it.answer).toBe(plan!.enquete.reponses.filter((r) => r === plan!.enquete!.cible).length);
          if (plan!.construire && g)
            expect(it.answer).toBe(
              g.valeurs[g.etiquettes.indexOf(plan!.construire.etiquette)]! / plan!.construire.echelle,
            );
          if (g && /^Combien [^«]* pour « ([^»]+) » \?$/.test(plan!.question)) {
            const e = plan!.question.match(/« (.+) »/)![1]!;
            expect(it.answer).toBe(g.valeurs[g.etiquettes.indexOf(e)]);
          }
        }
      });

  it('une valeur entière se lit au quadrillage de 1 en 1 au CE1', () => {
    const e = echelle([3, 7, 10]);
    expect(e.sousPas).toBe(1);
    expect(lisible(7, e)).toBe(true);
  });
});

describe('Roue des probabilités : expériences', () => {
  it('chaque énoncé de classement est reconnu et se teste', () => {
    const rng = createRng(1);
    for (const it of tousNiveaux('CM2.MA.PROBA', 'classification', 100)) {
      expect(estProba(it)).toBe(true);
      if (it.kind !== 'classification') continue;
      const x = lireExperience(it.prompt);
      expect(x, it.prompt).not.toBeNull();
      expect(tirer(x!, rng)).toBeTruthy();
      if (x!.type === 'sac' || x!.type === 'roue') {
        const total = Number(it.prompt.match(/en (\d+) parts/)?.[1] ?? NaN);
        if (x!.type === 'roue') expect(x!.couleurs.reduce((s, c) => s + c.n, 0)).toBe(total);
      }
    }
  });

  it('les QCM de la leçon sont acceptés', () => {
    for (const it of tousNiveaux('CM2.MA.PROBA', 'mcq', 60)) expect(estProba(it)).toBe(true);
  });

  it('les billes de la question ne sont pas comptées dans le sac', () => {
    const x = lireExperience(
      'Dans un sac, il y a 1 bille rouge et 4 billes bleues. Il y a deux couleurs possibles. Combien de chances a-t-on de tirer la bille rouge ?',
    );
    expect(x).toEqual({
      type: 'sac',
      couleurs: [
        { nom: 'rouge', n: 1 },
        { nom: 'bleue', n: 4 },
      ],
    });
  });
});

describe('Mesureur : mesures, balances, aires, angles', () => {
  it('règle, balance et quadrillage correspondent à la réponse', () => {
    const items: Item[] = [
      ...tousNiveaux('CE1.MA.GM.LONGUEURS', 'numeric_answer', 80),
      ...tousNiveaux('CE1.MA.GM.MASSES', 'numeric_answer', 80),
      ...tousNiveaux('CE1.MA.GEO.TRACER', 'numeric_answer', 80),
      ...tousNiveaux('CM2.MA.GM.AIRES', 'numeric_answer', 80),
      ...tousNiveaux('CM2.MA.GM.PERIMETRE', 'numeric_answer', 80),
      ...tousNiveaux('CM2.MA.GM.LONG_MASSE_CONT', 'numeric_answer', 80),
    ];
    let vus = 0;
    for (const it of items) {
      if (it.kind !== 'numeric_answer') continue;
      const p = lireMesure(it);
      if (!p) continue;
      expect(estPourMesureur(it)).toBe(true);
      vus++;
      if (p.type === 'regle') expect(p.regle.longueur).toBe(it.answer);
      if (p.type === 'balance') expect(p.balance.masses.reduce((s, m) => s + m, 0)).toBe(it.answer);
      if (p.type === 'quadrillage')
        expect(p.quadrillage.cells.length + p.quadrillage.demis.length / 2).toBeCloseTo(it.answer, 6);
    }
    expect(vus).toBeGreaterThan(300);
  });

  it('les conversions de la leçon CM2 sont toutes reconnues', () => {
    for (const it of tousNiveaux('CM2.MA.GM.LONG_MASSE_CONT', 'numeric_answer', 80))
      if (it.kind === 'numeric_answer') expect(lireConversion(it.prompt, it.unit), it.prompt).not.toBeNull();
  });

  it('les angles à classer sont dessinés à la bonne mesure', () => {
    for (const it of tousNiveaux('CM2.MA.GM.ANGLES', 'classification', 60)) {
      const a = lireAngles(it);
      expect(a).not.toBeNull();
      if (it.kind !== 'classification') continue;
      it.elements.forEach((e, i) => expect(it.categories[e.category]).toBe(natureAngle(a![i]!)));
    }
  });
});

describe('Géomètre : figures et tracés', () => {
  it('les figures dessinées ont autant d’angles droits que le dit la réponse (CM2)', () => {
    for (const it of tousNiveaux('CM2.MA.GEO.FIGURES', 'geometry_shape')) {
      if (it.kind !== 'geometry_shape') continue;
      expect(estPourGeometre(it)).toBe(true);
      if (!/angles droits/.test(it.prompt)) continue;
      const d = dessinDe(it)!;
      expect(d.type).toBe('polygone');
      if (d.type !== 'polygone') continue;
      const n = d.points.filter((_, i) => angleDroit(d.points, i)).length;
      expect(n, it.shape).toBe(Number(it.answer));
    }
  });

  it('les figures types du CE1 ont leurs angles droits', () => {
    const nb = (shape: string) => {
      const d = dessinDe({ kind: 'geometry_shape', shape, task: 'nommer' } as Item)!;
      return d.type === 'polygone' ? d.points.filter((_, i) => angleDroit(d.points, i)).length : -1;
    };
    expect(nb('carre')).toBe(4);
    expect(nb('rectangle')).toBe(4);
    expect(nb('triangle_rectangle')).toBe(1);
    expect(nb('triangle')).toBe(0);
    expect(nb('losange')).toBe(0);
  });

  it('chaque défi des leçons de géométrie plane a son atelier', () => {
    for (const lecon of [
      'CE1.MA.GEO.FIGURES',
      'CE1.MA.GEO.TRACER',
      'CM2.MA.GEO.VOCAB',
      'CM2.MA.GEO.FIGURES',
      'CM2.MA.GEO.CONSTRUIRE',
    ])
      for (const it of tousNiveaux(lecon, 'geometry_shape', 80))
        expect(modeDe(it), `${lecon} ${it.id}`).not.toBeNull();
  });

  it('points à placer : la solution est celle de l’énoncé', () => {
    for (const lecon of ['CM2.MA.GEO.VOCAB', 'CM2.MA.GEO.CONSTRUIRE'])
      for (const it of tousNiveaux(lecon, 'geometry_shape', 80)) {
        const p = lirePoints(it);
        expect(p).not.toBeNull();
        if (it.kind === 'geometry_shape') expect(cle(p!.solution)).toBe(it.answer);
        expect(
          (it.kind === 'geometry_shape' && it.prompt.includes(`point ${p!.nom}`)) ||
            (it.kind === 'geometry_shape' && it.prompt.includes(`centre ${p!.nom}`)),
        ).toBe(true);
      }
  });

  it('reproduire : la même figure déplacée est acceptée, une autre non', () => {
    for (const it of tousNiveaux('CE1.MA.GEO.TRACER', 'geometry_shape', 80)) {
      const p = lireReproduire(it);
      if (!p) continue;
      const deplace = p.sommets.map(([x, y]) => [x + 3, y + 1] as Cell);
      expect(memeFigureTranslatee(p.sommets, [...deplace].reverse())).toBe(true);
      expect(
        memeFigureTranslatee(
          p.sommets,
          deplace.map(([x, y], i) => (i ? [x, y] : [x + 1, y]) as Cell),
        ),
      ).toBe(false);
    }
    expect(
      estRectangle(
        [
          [0, 0],
          [5, 0],
          [5, 3],
          [0, 3],
        ],
        5,
        3,
      ),
    ).toBe(true);
    expect(
      estRectangle(
        [
          [0, 0],
          [5, 0],
          [5, 3],
          [1, 3],
        ],
        5,
        3,
      ),
    ).toBe(false);
  });
});

describe('Tangram : silhouettes', () => {
  const aire = (pts: [number, number][]) =>
    Math.abs(
      pts.reduce(
        (s, p, i) => s + p[0] * pts[(i + 1) % pts.length]![1] - pts[(i + 1) % pts.length]![0] * p[1],
        0,
      ),
    ) / 2;
  it('les pièces remplissent la silhouette sans se chevaucher', () => {
    const attendu: Record<string, number> = {
      carre: 4,
      rectangle: 6,
      losange: 4,
      trapeze: 6,
      trapeze_rectangle: 5,
    };
    const formes = new Set<string>();
    for (const lecon of ['CE1.MA.GEO.FIGURES', 'CM2.MA.GEO.FIGURES'])
      for (const it of tousNiveaux(lecon, 'geometry_shape', 60))
        if (estPourTangram(it) && it.kind === 'geometry_shape') formes.add(it.shape);
    expect(formes.size).toBeGreaterThanOrEqual(5);
    for (const shape of formes)
      for (const level of NIVEAUX) {
        const slots = silhouette({ kind: 'geometry_shape', shape } as Item, level)!;
        const total = slots.reduce((s, p) => s + aire(sommets(p, p.x, p.y)), 0);
        if (attendu[shape]) expect(total).toBe(attendu[shape]);
        // recouvrement : chaque point d'une grille fine est dans au plus une pièce
        const { w, h } = cadreTangram(slots);
        for (let x = 0.0371; x < w; x += 0.1)
          for (let y = 0.0613; y < h; y += 0.1) {
            const dedans = slots.filter((s) => {
              const poly = sommets(s, s.x, s.y);
              const signes = poly.map((p, i) => {
                const q = poly[(i + 1) % poly.length]!;
                return Math.sign((q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]));
              });
              return signes.every((v) => v >= 0) || signes.every((v) => v <= 0);
            }).length;
            expect(dedans).toBeLessThanOrEqual(1);
          }
      }
  });

  it('tourner 4 fois ou retourner 2 fois ramène la pièce', () => {
    const p = { forme: 'tri' as const, w: 2, h: 1, coin: 'bg' as const };
    expect(tourner(tourner(tourner(tourner(p))))).toEqual(p);
    expect(retourner(retourner(p))).toEqual(p);
  });
});

describe('Filtres : les items étrangers sont ignorés', () => {
  it('un QCM de comparaison ou de calcul n’est pas pris', () => {
    const qcm = tirages('CE1.MA.GM.LONGUEURS', 'mcq', 'normal', 60).filter((it) => it.meta?.gauche);
    expect(qcm.length).toBeGreaterThan(0);
    for (const it of qcm) expect(estPourMesureur(it)).toBe(false);
    for (const it of tirages('CE1.MA.GEO.FIGURES', 'true_false', 'normal', 20)) {
      expect(estPourGeometre(it)).toBe(false);
      expect(estPourTangram(it)).toBe(false);
    }
  });
});
