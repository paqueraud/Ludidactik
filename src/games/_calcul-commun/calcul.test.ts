import { describe, expect, it } from 'vitest';
import { checkItem } from '@/content/items';
import type { BarModelItem, ClockItem, Item, MoneyItem, NumericItem } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { FIXTURES } from '../_kit/fixtures';
import { aPlacer, analyser, candidatFaux, equations } from './barres';
import { EXEMPLES_CALCUL, EX_GLISSE, EX_POSEE, EX_PROGRAMME, EX_TABLEAU } from './fixtures';
import { comparer, fracEnMots, grilleTablette, propositionsFraction } from './fractions';
import { colonnesTableau, lireGlisse, resultatGlisse, zerosAjoutes } from './glisse';
import {
  analyserDuree,
  angles,
  formatDuree,
  formatHeure,
  lireDuree,
  lireHeure,
  memeCadran,
  propositionsLecture,
} from './horloge';
import {
  decompositionOptimale,
  etapesCompleter,
  formatEuros,
  itemMonnaieValide,
  montantCible,
  somme,
} from './monnaie';
import { calculer, disposer, lirePosee, lireResultat, type Posee } from './posee';
import { executer, lireProgramme, lireSuite, remonter } from './programme';
import { aides, lireTableau } from './tableau';

describe('exemples', () => {
  it('tous valides', () => {
    for (const it of EXEMPLES_CALCUL) expect(checkItem(it), it.id).toEqual([]);
  });
});

describe('monnaie', () => {
  it('écrit les euros', () => {
    expect(formatEuros(350)).toBe('3,50 €');
    expect(formatEuros(500)).toBe('5 €');
    expect(formatEuros(5)).toBe('0,05 €');
  });
  it('décomposition optimale', () => {
    expect(decompositionOptimale(180, [10, 20, 50, 100, 200])).toEqual([100, 50, 20, 10]);
    expect(decompositionOptimale(660, [1, 2, 5, 10, 20, 50, 100, 200, 500])).toEqual([500, 100, 50, 10]);
    expect(decompositionOptimale(3, [2])).toBeNull();
    // jeu de valeurs non canonique : la programmation dynamique trouve mieux que l'algorithme glouton
    expect(decompositionOptimale(60, [10, 30, 40])).toEqual([30, 30]);
  });
  it('rendu de monnaie en complétant', () => {
    const e = etapesCompleter(320, 500, [10, 20, 50, 100, 200]);
    expect(e.map(([x]) => x)).toEqual([330, 350, 400, 500]);
    expect(somme(e.map(([, v]) => v))).toBe(180);
  });
  it('items du Labo', () => {
    for (const it of FIXTURES.money) {
      const m = it as MoneyItem;
      expect(itemMonnaieValide(m)).toBe(true);
    }
    expect(montantCible(FIXTURES.money[1] as MoneyItem)).toBe(180);
  });
});

describe('horloge', () => {
  it('angles', () => {
    expect(angles({ h: 3, m: 0 })).toEqual({ heure: 90, minute: 0, seconde: 0 });
    expect(angles({ h: 15, m: 30 }).heure).toBe(105);
  });
  it('écritures', () => {
    expect(formatHeure({ h: 15, m: 5 })).toBe('15 h 05');
    expect(formatHeure({ h: 7, m: 0 })).toBe('7 h');
    expect(formatDuree(85)).toBe('1 h 25 min');
    expect(lireHeure('15 h 05')).toEqual({ h: 15, m: 5 });
    expect(lireHeure('3 h')).toEqual({ h: 3, m: 0 });
    expect(lireHeure('10 h 42 min 30 s')).toEqual({ h: 10, m: 42, s: 30 });
    expect(lireDuree('45 min')).toBe(45);
    expect(lireDuree('1 h 15 min')).toBe(75);
    expect(memeCadran({ h: 3, m: 15 }, { h: 15, m: 15 })).toBe(true);
  });
  it('analyse des durées', () => {
    const fin = FIXTURES.clock[2] as ClockItem;
    expect(analyserDuree(fin)?.mode).toBe('fin');
    const duree = EXEMPLES_CALCUL.find((i) => i.id === 'ho2') as ClockItem;
    expect(analyserDuree(duree)).toMatchObject({ mode: 'duree', duree: 85, fin: { h: 11, m: 5 } });
    const debut: ClockItem = { ...fin, hours: 15, minutes: 5, answerText: '14 h 20' };
    expect(analyserDuree(debut)?.mode).toBe('debut');
  });
  it('propositions de lecture distinctes', () => {
    const p = propositionsLecture({ h: 3, m: 15 });
    expect(p[0]).toBe('3 h 15');
    expect(new Set(p).size).toBe(p.length);
    expect(p).toContain('3 h 15');
  });
});

describe('fractions', () => {
  it('compare', () => {
    expect(comparer({ n: 1, d: 3 }, { n: 1, d: 5 })).toBe(1);
    expect(comparer({ n: 3, d: 4 }, { n: 6, d: 8 })).toBe(0);
  });
  it('en mots', () => {
    expect(fracEnMots({ n: 3, d: 8 })).toBe('3 huitièmes');
    expect(fracEnMots({ n: 1, d: 2 })).toBe('un demi');
    expect(fracEnMots({ n: 2, d: 3 })).toBe('2 tiers');
  });
  it('tablette', () => {
    expect(grilleTablette(12)).toEqual([3, 4]);
    expect(grilleTablette(5)).toEqual([1, 5]);
    expect(grilleTablette(60)).toEqual([6, 10]);
    const [r, c] = grilleTablette(13);
    expect(r * c).toBeGreaterThanOrEqual(13);
  });
  it('propositions', () => {
    expect(propositionsFraction({ n: 2, d: 5 })).toEqual(['2/5', '3/5', '5/2']);
  });
});

describe('glisse-nombre', () => {
  it('lit meta.glisse et les énoncés simples', () => {
    for (const it of EX_GLISSE) expect(lireGlisse(it), it.id).not.toBeNull();
    const simple: NumericItem = { ...(EX_GLISSE[0] as NumericItem), meta: undefined, prompt: '4 200 ÷ 100', answer: 42 };
    expect(lireGlisse(simple)).toEqual({ nombre: 4200, operation: '÷', facteur: 100 });
    expect(lireGlisse(FIXTURES.numeric_answer[0]!)).toBeNull();
  });
  it('zéros à ajouter', () => {
    expect(zerosAjoutes({ nombre: 12, operation: '×', facteur: 100 })).toEqual([1, 0]);
    expect(zerosAjoutes({ nombre: 56, operation: '÷', facteur: 1000 })).toEqual([0, -1]);
    expect(zerosAjoutes({ nombre: 4.2, operation: '×', facteur: 100 })).toEqual([0]);
    expect(zerosAjoutes({ nombre: 7.5, operation: '÷', facteur: 10 })).toEqual([0]);
    expect(resultatGlisse({ nombre: 56, operation: '÷', facteur: 1000 })).toBe(0.056);
  });
  it('colonnes', () => {
    const c = colonnesTableau({ nombre: 56, operation: '÷', facteur: 1000 });
    expect(c[0]).toBe(2);
    expect(c[c.length - 1]).toBe(-3);
  });
});

/** Rejoue une opération posée : chaque case attendue, lue dans l'ordre, redonne le résultat. */
function verifierPosee(p: Posee) {
  const d = disposer(p);
  const attendu = calculer(p.op, p.termes);
  expect(d.etapes.length).toBeGreaterThan(0);
  // cohérence étapes ↔ cases
  d.etapes.forEach((e, i) => {
    const c = d.cellules.find((x) => x.type === 'saisie' && x.etape === i);
    expect(c?.texte).toBe(e.attendu);
    expect(/^\d$/.test(e.attendu)).toBe(true);
  });
  if (p.op === '÷') {
    const q = Math.floor(attendu * 10 ** p.decimalesQuotient + 1e-9) / 10 ** p.decimalesQuotient;
    expect(lireResultat(d)).toBeCloseTo(q, 9);
    if (p.decimalesQuotient === 0)
      expect(d.reste).toBe(Math.round(p.termes[0]! - Math.floor(attendu) * p.termes[1]!));
  } else expect(lireResultat(d)).toBeCloseTo(attendu, 9);
  // pas deux cellules de même nature au même endroit
  const vues = new Set<string>();
  for (const c of d.cellules.filter((x) => x.type === 'saisie' || x.type === 'donnee')) {
    if (c.visibleA !== undefined) continue;
    const k = `${c.ligne}:${c.col}`;
    expect(vues.has(k), `${p.op} ${p.termes} ${k}`).toBe(false);
    vues.add(k);
  }
  return d;
}

describe('opérations posées', () => {
  it('exemples', () => {
    for (const it of EX_POSEE) {
      const p = lirePosee(it);
      expect(p, it.id).not.toBeNull();
      verifierPosee(p!);
    }
  });
  it('ignore un item sans meta.posee', () => {
    expect(lirePosee(FIXTURES.numeric_answer[1]!)).toBeNull();
  });
  it('soustraction par cassage : 503 − 278', () => {
    const d = verifierPosee({ op: '−', termes: [503, 278], methode: 'cassage', decimalesQuotient: 0 });
    expect(d.etapes.map((e) => e.attendu).join('')).toBe('522');
    expect(d.etapes[0]!.aide).toMatch(/casse 1 centaine en 10 dizaines, puis 1 dizaine en 10 unités/);
    const casses = d.cellules.filter((c) => c.type === 'casse');
    expect(casses.map((c) => c.texte)).toEqual(['4', '9', '13']);
  });
  it('soustraction par compensation', () => {
    const d = verifierPosee({ op: '−', termes: [503, 278], methode: 'compensation', decimalesQuotient: 0 });
    expect(d.etapes[0]!.aide).toMatch(/j’ajoute 10 unités en haut et 1 dizaine en bas/);
  });
  it('pas de zéro inutile : 1 000 − 999', () => {
    const d = verifierPosee({ op: '−', termes: [1000, 999], methode: 'cassage', decimalesQuotient: 0 });
    expect(d.etapes.length).toBe(1);
  });
  it('multiplication à deux chiffres', () => {
    const d = verifierPosee({ op: '×', termes: [146, 23], methode: 'cassage', decimalesQuotient: 0 });
    expect(d.etapes.map((e) => e.attendu).join('')).toBe('834' + '292' + '8533');
  });
  it('décimaux', () => {
    verifierPosee({ op: '+', termes: [3.7, 12.25], methode: 'cassage', decimalesQuotient: 0 });
    verifierPosee({ op: '−', termes: [12, 3.45], methode: 'cassage', decimalesQuotient: 0 });
    verifierPosee({ op: '×', termes: [0.12, 3], methode: 'cassage', decimalesQuotient: 0 });
    verifierPosee({ op: '×', termes: [2.5, 14], methode: 'cassage', decimalesQuotient: 0 });
    verifierPosee({ op: '÷', termes: [7, 4], methode: 'cassage', decimalesQuotient: 2 });
    verifierPosee({ op: '÷', termes: [3, 4], methode: 'cassage', decimalesQuotient: 2 });
    verifierPosee({ op: '÷', termes: [12.6, 3], methode: 'cassage', decimalesQuotient: 1 });
  });
  it('division euclidienne avec zéro au quotient : 412 ÷ 4 et 41 ÷ 4', () => {
    const d = verifierPosee({ op: '÷', termes: [412, 4], methode: 'cassage', decimalesQuotient: 0 });
    expect(d.etapes.map((e) => e.attendu).join('')).toBe('103');
    const e = verifierPosee({ op: '÷', termes: [41, 4], methode: 'cassage', decimalesQuotient: 0 });
    expect(e.etapes.map((x) => x.attendu).join('')).toBe('101');
    expect(e.reste).toBe(1);
  });
  it('tirages aléatoires (2 000 opérations)', () => {
    const rng = createRng(7);
    for (let k = 0; k < 500; k++) {
      const n = rng.int(2, 4);
      verifierPosee({
        op: '+',
        termes: Array.from({ length: n }, () => rng.int(0, 9999)),
        methode: 'cassage',
        decimalesQuotient: 0,
      });
      const a = rng.int(0, 99999);
      const b = rng.int(0, a);
      verifierPosee({ op: '−', termes: [a, b], methode: rng.chance(0.5) ? 'cassage' : 'compensation', decimalesQuotient: 0 });
      verifierPosee({ op: '×', termes: [rng.int(1, 9999), rng.int(1, 999)], methode: 'cassage', decimalesQuotient: 0 });
      verifierPosee({
        op: '÷',
        termes: [rng.int(0, 99999), rng.int(1, 99)],
        methode: 'cassage',
        decimalesQuotient: rng.int(0, 2),
      });
    }
  });
});

describe('programmes et suites', () => {
  it('exécuter et remonter', () => {
    const es = [
      { op: '×' as const, n: 3 },
      { op: '+' as const, n: 5 },
    ];
    expect(executer(4, es)).toEqual([4, 12, 17]);
    expect(remonter(17, es)).toEqual([17, 12, 4]);
  });
  it('exemples', () => {
    const [p1, p2, s1] = EX_PROGRAMME as [Item, Item, Item];
    expect(lireProgramme(p1)).toMatchObject({ inconnue: 'sortie', valeurs: [4, 12, 17] });
    expect(lireProgramme(p2)).toMatchObject({ inconnue: 'entree', valeurs: [9, 18, 15] });
    expect(lireSuite(s1)).toMatchObject({ ecart: 4, etape: 10 });
    expect(lireProgramme(FIXTURES.numeric_answer[0]!)).toBeNull();
  });
  it('refuse un programme incohérent', () => {
    const p = { ...(EX_PROGRAMME[0] as NumericItem), answer: 18 };
    expect(lireProgramme(p)).toBeNull();
  });
});

describe('proportionnalité', () => {
  it('lit les tableaux et propose des aides', () => {
    const [t1, t2, t3] = EX_TABLEAU.map((i) => lireTableau(i)!);
    expect(t1).toMatchObject({ ligne: 1, col: 1 });
    expect(aides(t1!)[0]).toMatchObject({ type: 'fois', k: 3 });
    expect(aides(t2!).some((a) => a.type === 'somme')).toBe(true);
    expect(aides(t3!)[0]).toMatchObject({ type: 'divise', k: 5 });
  });
  it('refuse un tableau non proportionnel', () => {
    const p = {
      ...(EX_TABLEAU[0] as NumericItem),
      meta: { tableau: { entetes: ['a', 'b'], lignes: [[4, 2], [6, 5], [12, null]] } },
    };
    expect(lireTableau(p)).toBeNull();
  });
});

describe('schémas en barre', () => {
  it('inconnue = total (transformation)', () => {
    const a = analyser(FIXTURES.bar_model[0] as BarModelItem);
    expect(a.totalTexte).toBe('?');
    expect(aPlacer(a, 1).map((e) => e.attendu)).toEqual(['?']);
    expect(aPlacer(a, 9).map((e) => e.attendu)).toEqual(['?', '28', '15']);
  });
  it('parts égales demandées une seule fois', () => {
    const a = analyser(FIXTURES.bar_model[1] as BarModelItem);
    expect(a.barreTotal).toBe(1);
    expect(aPlacer(a, 9).map((e) => e.attendu)).toEqual(['?', '12', '12']);
  });
  it('comparaison : l’écart est l’inconnue', () => {
    const it = EXEMPLES_CALCUL.find((i) => i.id === 'bm1') as BarModelItem;
    const a = analyser(it);
    expect(a.accolade).toBe(false);
    expect(aPlacer(a, 9).map((e) => e.attendu)).toEqual(['?', '257', '211']);
    expect(candidatFaux(it)).toBe(468);
  });
  it('égalités', () => {
    expect(equations('28 + 15 = 43 ; 43 − 7 = 36').map((e) => e.resultat)).toEqual([43, 36]);
    expect(equations('1 250 × 3 = 3 750')[0]).toMatchObject({ gauche: 1250, op: '×', resultat: 3750 });
  });
});
