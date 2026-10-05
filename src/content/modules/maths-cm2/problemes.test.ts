/**
 * Problèmes CM2 : réponses recalculées indépendamment (évaluation des calculs proposés), cohérence des
 * schémas en barre, régulation, proportionnalité sans tableau avant la 6e, dénombrements.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '@/engine/rng';
import { LEVELS } from '../../schemas';
import { GENERATEURS_PB, type Pb } from './problemes';
import { num, tiragesDe } from './testkit';
import { centimesSansZeroFinal, fmt } from './util';

/** Évalue un calcul écrit à la française (« 20 − (3 × 4,5) ÷ 2 »), avec les priorités usuelles. */
function evalue(expr: string): number {
  const s = expr.replace(/[\s  ]/g, '').replace(/−/g, '-');
  let i = 0;
  const nombre = (): number => {
    const m = s.slice(i).match(/^\d+(?:,\d+)?/);
    if (!m) throw new Error(`nombre attendu dans « ${expr} » à ${i}`);
    i += m[0].length;
    return num(m[0]);
  };
  const facteur = (): number => {
    if (s[i] === '(') {
      i++;
      const v = somme();
      if (s[i] !== ')') throw new Error(`parenthèse manquante dans « ${expr} »`);
      i++;
      return v;
    }
    return nombre();
  };
  const produit = (): number => {
    let v = facteur();
    while (s[i] === '×' || s[i] === '÷') {
      const op = s[i++];
      const w = facteur();
      v = op === '×' ? v * w : v / w;
    }
    return v;
  };
  const somme = (): number => {
    let v = produit();
    while (s[i] === '+' || s[i] === '-') {
      const op = s[i++];
      const w = produit();
      v = op === '+' ? v + w : v - w;
    }
    return v;
  };
  const v = somme();
  if (i !== s.length) throw new Error(`calcul mal formé : « ${expr} »`);
  return Math.round(v * 1000) / 1000;
}

const sansEspaces = (s: string) => s.replace(/[\s  ]/g, '');
const IDS = Object.keys(GENERATEURS_PB);

function pbs(id: string, level: (typeof LEVELS)[number], n = 300): Pb[] {
  const rng = createRng(11);
  return Array.from({ length: n }, () => GENERATEURS_PB[id]!(level, rng));
}

describe('problèmes CM2 — chaque problème est juste', () => {
  for (const id of IDS)
    for (const level of LEVELS)
      it(`${id} · ${level}`, () => {
        for (const p of pbs(id, level)) {
          const ctx = `${p.statement} ${p.question}`;
          expect(p.answer, ctx).toBeGreaterThan(0);
          expect(Number.isFinite(p.answer)).toBe(true);
          if (p.calcul) {
            expect(evalue(p.calcul), `${ctx} | ${p.calcul}`).toBeCloseTo(p.answer, 6);
            expect(p.fauxCalculs?.length ?? 0, ctx).toBeGreaterThanOrEqual(1);
            for (const f of p.fauxCalculs ?? [])
              expect(evalue(f), `${ctx} | faux : ${f}`).not.toBeCloseTo(p.answer, 6);
          }
          // La réponse figure dans les étapes du calcul
          expect(sansEspaces(p.operation), ctx).toContain(sansEspaces(fmt(p.answer)));
          // Euros : pas de zéro final dans la réponse attendue
          if (p.unit === '€') expect(centimesSansZeroFinal(Math.round(p.answer * 100)), ctx).toBe(true);
          // Des réponses fausses utilisables pour la régulation
          expect(
            p.fausses.some((x) => x >= 0 && Math.abs(x - p.answer) > 1e-9),
            ctx,
          ).toBe(true);
          // Schéma à une barre (parties-tout, transformation) : parties + réponse = tout
          if (p.bars.length === 1 && (p.structure === 'parties-tout' || p.structure === 'transformation')) {
            const connus = p.bars[0]!.segments.reduce((s, x) => s + (x.value ?? 0), 0);
            if (typeof p.total === 'number') expect(connus + p.answer, ctx).toBeCloseTo(p.total, 6);
            else expect(connus, ctx).toBeCloseTo(p.answer, 6);
          }
          expect(p.reformulations[0]).not.toBe(p.reformulations[1]);
          expect(p.answerSentence).toContain('___');
          // Orthographe : pas d'espace avant une virgule ni de double espace
          expect(ctx, ctx).not.toMatch(/ ,| {2}|\.\./);
        }
      });
});

describe('problèmes CM2 — items', () => {
  it('QCM « quel calcul ? » : le bon calcul donne la réponse, les autres non', () => {
    for (const id of IDS)
      for (const level of LEVELS)
        for (const it of tiragesDe(id, 'mcq', level)) {
          if (it.meta?.calcul !== true) continue;
          const rep = it.meta.reponse as number;
          it.choices.forEach((c, i) => {
            if (i === it.answerIndex) expect(evalue(c), c).toBeCloseTo(rep, 6);
            else expect(evalue(c), c).not.toBeCloseTo(rep, 6);
          });
        }
  });

  it('QCM sur la réponse : un seul choix vaut la réponse', () => {
    for (const id of IDS)
      for (const level of LEVELS)
        for (const it of tiragesDe(id, 'mcq', level)) {
          if (it.meta?.calcul === true || typeof it.meta?.reponse !== 'number') continue;
          const rep = it.meta.reponse;
          const vals = it.choices.map((c) => num(c.replace(/ ?(€|kg|km|m|L|g|ans)$/, '')));
          expect(vals.filter((v) => Math.abs(v - rep) < 1e-9).length, it.question).toBe(1);
          expect(vals[it.answerIndex]).toBeCloseTo(rep, 6);
        }
  });

  it('régulation : « vrai » si et seulement si la réponse proposée est la bonne', () => {
    for (const id of IDS)
      for (const level of LEVELS)
        for (const it of tiragesDe(id, 'true_false', level)) {
          if (typeof it.meta?.proposee !== 'number') continue;
          expect(it.answer).toBe(Math.abs((it.meta.proposee as number) - (it.meta.reponse as number)) < 1e-9);
        }
  });

  it('numérique : meta.calcul donne la réponse ; euros sans zéro final', () => {
    for (const id of IDS)
      for (const level of LEVELS)
        for (const it of tiragesDe(id, 'numeric_answer', level)) {
          if (typeof it.meta?.calcul === 'string')
            expect(evalue(it.meta.calcul), it.prompt).toBeCloseTo(it.answer, 6);
          if (it.unit === '€') expect(centimesSansZeroFinal(Math.round(it.answer * 100))).toBe(true);
        }
  });

  it('schémas en barre : la réponse figure dans l’opération', () => {
    for (const id of IDS)
      for (const level of LEVELS)
        for (const it of tiragesDe(id, 'bar_model', level)) {
          expect(sansEspaces(it.operation), it.statement).toContain(sansEspaces(fmt(it.answer)));
          expect(it.reformulations?.length).toBe(3);
        }
  });
});

describe('proportionnalité (BO : linéarité, sans tableau au cours moyen)', () => {
  it('pas de tableau en facile et normal ; la fiche « recette » est proportionnelle et juste', () => {
    for (const level of ['facile', 'normal'] as const)
      for (const it of tiragesDe('CM2.MA.PB.PROPORTION', 'numeric_answer', level)) {
        expect(it.meta?.tableau, it.prompt).toBeUndefined();
        const r = it.meta?.recette as { connus: [number, number][]; cherche: number } | undefined;
        expect(r, it.prompt).toBeDefined();
        const rapport = r!.connus[0]![1] / r!.connus[0]![0];
        for (const [x, y] of r!.connus) expect(y / x).toBeCloseTo(rapport, 9);
        expect(it.answer, it.prompt).toBeCloseTo(r!.cherche * rapport, 6);
        expect(it.prompt).not.toMatch(/règle de trois|produit en croix|coefficient/i);
      }
  });

  it('plus loin : tableau juste quand il est présent', () => {
    for (const it of tiragesDe('CM2.MA.PB.PROPORTION', 'numeric_answer', 'plus_loin')) {
      const t = it.meta?.tableau as { lignes: [number, number | null][] } | undefined;
      if (!t) continue;
      const [x0, y0] = t.lignes[0] as [number, number];
      const [x1, y1] = t.lignes[t.lignes.length - 1]!;
      expect(y1).toBeNull();
      for (const [x, y] of t.lignes.slice(0, -1)) expect(y! / x).toBeCloseTo(y0 / x0, 9);
      expect(it.answer, it.prompt).toBeCloseTo((y0 / x0) * x1, 6);
    }
  });

  it('identification : âge et taille ne sont jamais proportionnels', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.PB.PROPORTION', 'true_false', level)) {
        if (/ ans, .* mesure /.test(it.statement)) expect(it.answer).toBe(false);
        const m = it.statement.match(
          /^(\d+) kg de pommes coutent (.+) €\. Donc (\d+) kg de ces pommes coutent (.+) €\.$/,
        );
        if (m) {
          const vrai = (num(m[2]!) / Number(m[1])) * Number(m[3]);
          expect(it.answer, it.statement).toBe(Math.abs(vrai - num(m[4]!)) < 1e-9);
        }
      }
  });
});

describe('dénombrement : réponses recalculées depuis l’énoncé', () => {
  it('poignées de main, tenues, menus, tournois', () => {
    for (const level of LEVELS)
      for (const p of pbs('CM2.MA.PB.DENOMBRER', level)) {
        let m = p.statement.match(/^(\d+) amis se retrouvent/);
        if (m) expect(p.answer).toBe((Number(m[1]) * (Number(m[1]) - 1)) / 2);
        m = p.statement.match(/a (\d+) pantalons et (\d+) tee-shirts/);
        if (m) expect(p.answer).toBe(Number(m[1]) * Number(m[2]));
        m = p.statement.match(/parmi (\d+), un plat parmi (\d+) et un dessert parmi (\d+)/);
        if (m) expect(p.answer).toBe(Number(m[1]) * Number(m[2]) * Number(m[3]));
        m = p.statement.match(/championnat de (\d+) équipes/);
        if (m) expect(p.answer).toBe(Number(m[1]) * (Number(m[1]) - 1));
        m = p.statement.match(/payer exactement (\d+) €/);
        if (m) {
          // Algorithme glouton recalculé
          let r = Number(m[1]);
          let c = 0;
          for (const v of [50, 20, 10, 5, 2, 1])
            while (r >= v) {
              r -= v;
              c++;
            }
          expect(p.answer).toBe(c);
        }
        m = p.statement.match(/range (\d+) petites voitures .* contenir (\d+) voitures/);
        if (m) expect(p.answer).toBe(Math.ceil(Number(m[1]) / Number(m[2])));
      }
  });

  it('meilleur prix : la réponse est le moins cher de tous les achats possibles', () => {
    for (const level of LEVELS)
      for (const p of pbs('CM2.MA.PB.DENOMBRER', level)) {
        const m = p.statement.match(
          /un yaourt coute (.+) € et un lot de (\d+) yaourts coute (.+) €\. .* au moins (\d+) yaourts/,
        );
        if (!m) continue;
        const [pu, lot, pl, veut] = [num(m[1]!), Number(m[2]), num(m[3]!), Number(m[4])];
        let best = Infinity;
        for (let lots = 0; lots * lot <= veut + lot; lots++) {
          const unites = Math.max(0, veut - lots * lot);
          best = Math.min(best, lots * pl + unites * pu);
        }
        expect(p.answer, p.statement).toBeCloseTo(best, 6);
      }
  });

  it('cars : tout le monde a une place et il n’y a pas un car de trop', () => {
    for (const p of pbs('CM2.MA.PB.MIXTES', 'normal')) {
      const m = p.statement.match(
        /^(\d+) classes de (\d+) élèves partent en sortie avec (\d+) adultes\. Chaque car a (\d+) places/,
      );
      if (!m) continue;
      const t = Number(m[1]) * Number(m[2]) + Number(m[3]);
      expect(p.answer).toBe(Math.ceil(t / Number(m[4])));
    }
  });
});
