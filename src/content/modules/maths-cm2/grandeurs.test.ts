/**
 * Grandeurs et mesures CM2 : réponses recalculées indépendamment des générateurs.
 */
import { describe, expect, it } from 'vitest';
import { type ItemKind, LEVELS } from '../../schemas';
import { GRANDEURS } from './grandeurs';
import { cle, num, tirages, tiragesDe } from './testkit';

/** Valeur des unités dans l'unité de base (mm, mg, mL) — table indépendante de celle du générateur. */
const BASE: Record<string, number> = {
  km: 1_000_000,
  hm: 100_000,
  dam: 10_000,
  m: 1000,
  dm: 100,
  cm: 10,
  mm: 1,
  t: 1_000_000_000,
  kg: 1_000_000,
  g: 1000,
  mg: 1,
  hL: 100_000,
  L: 1000,
  dL: 100,
  cL: 10,
  mL: 1,
};
const AIRE: Record<string, number> = { 'm²': 10_000, 'dm²': 100, 'cm²': 1 };
const NB = '([\\d\\u00a0]+(?:,\\d+)?)';
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/** « 3,5 m » ou « 3 m 45 cm » → valeur dans l'unité de base. */
function mesure(s: string): number {
  const parts = [
    ...s.matchAll(new RegExp(`${NB} (km|hm|dam|m|dm|cm|mm|t|kg|g|mg|hL|L|dL|cL|mL)(?![\\p{L}²])`, 'gu')),
  ];
  expect(parts.length, s).toBeGreaterThan(0);
  return parts.reduce((acc, p) => acc + num(p[1]!) * BASE[p[2]!]!, 0);
}

/** « 1 h 25 min », « 95 s », « 1,5 h » → secondes. */
function duree(s: string): number {
  const U: Record<string, number> = {
    h: 3600,
    min: 60,
    s: 1,
    jours: 86400,
    jour: 86400,
    semaines: 604800,
  };
  const parts = [...s.matchAll(new RegExp(`${NB} (h|min|s|jours?|semaines)(?![\\p{L}])`, 'gu'))];
  expect(parts.length, s).toBeGreaterThan(0);
  return parts.reduce((acc, p) => acc + num(p[1]!) * U[p[2]!]!, 0);
}

describe('grandeurs CM2 — longueurs, masses, contenances', () => {
  it('conversions justes, au plus 3 décimales', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GM.LONG_MASSE_CONT', 'numeric_answer', level)) {
        const [gauche, droite] = it.prompt.split(' = ');
        const u = droite!.replace('… ', '');
        expect(close(it.answer * BASE[u]!, mesure(gauche!)), it.prompt).toBe(true);
        expect(it.unit).toBe(u);
        expect(it.decimals).toBeLessThanOrEqual(3);
        expect(it.explication).toMatch(/1 \p{L}+ = /u); // la relation entre unités est toujours citée
      }
  });

  it('vrai/faux, comparaisons et rangements justes', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe('CM2.MA.GM.LONG_MASSE_CONT', 'true_false', level)) {
        const [g, d] = it.statement.split(' = ');
        expect(close(mesure(g!), mesure(d!)), it.statement).toBe(it.answer);
      }
      for (const it of tiragesDe('CM2.MA.GM.LONG_MASSE_CONT', 'mcq', level)) {
        if (!it.meta?.gauche) continue;
        const a = mesure(it.meta.gauche as string);
        const b = mesure(it.meta.droite as string);
        expect(it.choices[it.answerIndex], it.question).toBe(close(a, b) ? '=' : a < b ? '<' : '>');
      }
      for (const it of tiragesDe('CM2.MA.GM.LONG_MASSE_CONT', 'ordering', level)) {
        const v = it.elements.map(mesure);
        expect(v).toEqual([...v].sort((a, b) => (it.mode === 'croissant' ? a - b : b - a)));
        expect(new Set(it.elements.map((e) => e.split(' ')[e.split(' ').length - 1])).size).toBeGreaterThan(
          1,
        );
      }
    }
  });
});

describe('grandeurs CM2 — périmètres et aires', () => {
  it('périmètre : la réponse complète la figure décrite', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GM.PERIMETRE', 'numeric_answer', level)) {
        const f = it.meta!.figure as {
          type: string;
          cotes: (number | null)[];
          perimetre?: number;
          diametre?: number;
          rayon?: number;
        };
        if (f.type === 'cercle') {
          const d = f.diametre ?? 2 * f.rayon!;
          expect(close(it.answer, 3.14 * d)).toBe(true);
          expect(level).toBe('plus_loin');
          continue;
        }
        const cotes = f.cotes.map((c) => c ?? it.answer);
        const tour = cotes.reduce((s, c) => s + c, 0);
        expect(close(tour, f.perimetre ?? it.answer), it.prompt).toBe(true);
        if (level === 'facile') expect(['carre', 'rectangle']).toContain(f.type);
      }
  });

  it('aire : carreaux comptés, rectangles, figures composées et conversions', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GM.AIRES', 'numeric_answer', level)) {
        const m = it.meta;
        if (m?.quadrillage) {
          const q = m.quadrillage as { cells: [number, number][]; demis?: unknown[] };
          expect(new Set(q.cells.map((c) => c.join(','))).size).toBe(q.cells.length);
          expect(close(it.answer, q.cells.length + (q.demis?.length ?? 0) / 2)).toBe(true);
        } else if (m?.rectangles) {
          const r = m.rectangles as [number, number][];
          expect(it.answer).toBe(r.reduce((s, [a, b]) => s + a * b, 0));
        } else if (m?.figure) {
          const f = m.figure as { type: string; cotes: (number | null)[]; aire?: number };
          const [a, b] = f.cotes;
          if (f.aire) expect(a! * it.answer).toBe(f.aire);
          else if (m.decoupe) expect(it.answer).toBe(a! * b! - (m.decoupe as number) ** 2);
          else if (f.type === 'triangle') expect(close(it.answer, (a! * b!) / 2)).toBe(true);
          else expect(it.answer).toBe(a! * b!);
        } else {
          const r = it.prompt.match(new RegExp(`^${NB} (m²|dm²|cm²) = … (m²|dm²|cm²)$`, 'u'))!;
          expect(r, it.prompt).not.toBeNull();
          expect(close(num(r[1]!) * AIRE[r[2]!]!, it.answer * AIRE[r[3]!]!), it.prompt).toBe(true);
        }
      }
  });
});

describe('grandeurs CM2 — angles', () => {
  it('le classement correspond aux mesures dessinées (aigu < 90° < obtus < 180°)', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GM.ANGLES', 'classification', level)) {
        const mesures = it.meta!.angles as number[];
        expect(mesures.length).toBe(it.elements.length);
        it.elements.forEach((e, i) => {
          const x = mesures[i]!;
          const nature = x < 90 ? 'aigu' : x === 90 ? 'droit' : x < 180 ? 'obtus' : 'plat';
          expect(it.categories[e.category]).toBe(nature);
          if (level !== 'plus_loin') expect(x).toBeLessThan(180); // angles saillants seulement au CM2
        });
        // chaque catégorie est représentée
        expect(new Set(it.elements.map((e) => e.category)).size).toBe(it.categories.length);
      }
  });

  it('les mesures en degrés restent des angles saillants (≤ 180°)', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GM.ANGLES', 'numeric_answer', level)) {
        expect(it.answer).toBeLessThanOrEqual(180);
        if (level !== 'plus_loin') expect(it.answer).toBeLessThan(180);
      }
  });
});

describe('grandeurs CM2 — durées', () => {
  const lire = (s: string) => {
    const m = s.match(/^(\d+) h(?: (\d+)(?: min (\d+) s)?)?$/)!;
    expect(m, s).not.toBeNull();
    return Number(m[1]) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  };
  it('horloge : heure lue/réglée et heure de fin justes ; secondes à partir du niveau normal', () => {
    for (const level of LEVELS)
      for (const it of tiragesDe('CM2.MA.GM.DUREES', 'clock', level)) {
        const debut = it.hours * 3600 + it.minutes * 60 + (it.seconds ?? 0);
        const attendu = it.task === 'duree' ? debut + it.durationMinutes! * 60 : debut;
        // Passage de minuit (plus loin) : 23 h 30 + 1 h 10 min = 0 h 40
        expect(lire(it.answerText), it.prompt).toBe(attendu % (24 * 3600));
        if (attendu >= 24 * 3600) expect(level).toBe('plus_loin');
        if (level === 'facile') expect(it.seconds).toBeUndefined();
      }
  });

  it('conversions et rangements de durées justes', () => {
    for (const level of LEVELS) {
      for (const it of tiragesDe('CM2.MA.GM.DUREES', 'numeric_answer', level)) {
        const reste = it.prompt.match(/^(\d+) s = (\d+) min … s$/);
        if (reste) {
          expect(Number(reste[2]) * 60 + it.answer).toBe(Number(reste[1]));
          expect(it.answer).toBeLessThan(60);
          continue;
        }
        const conv = it.prompt.match(/^(.+) = … (h|min|s)$/);
        if (conv)
          expect(
            close(duree(conv[1]!), it.answer * { h: 3600, min: 60, s: 1 }[conv[2] as 'h']),
            it.prompt,
          ).toBe(true);
        const siecles = it.prompt.match(/^(\d+) siècles = … ans$/);
        if (siecles) expect(it.answer).toBe(100 * Number(siecles[1]));
        const train = it.prompt.match(/part à (.+) et arrive à (.+)\. Combien/);
        if (train) expect((lire(train[2]!) - lire(train[1]!)) / 60).toBe(it.answer);
      }
      for (const it of tiragesDe('CM2.MA.GM.DUREES', 'ordering', level)) {
        const v = it.elements.map(duree);
        expect(v).toEqual([...v].sort((a, b) => (it.mode === 'croissant' ? a - b : b - a)));
      }
    }
  });
});

describe('grandeurs CM2 — les niveaux ne se recouvrent pas', () => {
  for (const [id, c] of Object.entries(GRANDEURS))
    for (const kind of Object.keys(c.gens ?? {}))
      it(`${id} · ${kind} : aucun item commun à deux niveaux`, () => {
        const parNiveau = LEVELS.map((l) => new Set(tirages(id, kind as ItemKind, l, 200, 5).map(cle)));
        for (let a = 0; a < 3; a++)
          for (let b = a + 1; b < 3; b++) {
            const communs = [...parNiveau[a]!].filter((k) => parNiveau[b]!.has(k));
            expect(communs, `${LEVELS[a]} / ${LEVELS[b]}`).toEqual([]);
          }
      });

  it('plus loin : difficulté d’au moins 0,55 (hors conversions et rangements)', () => {
    for (const [id, c] of Object.entries(GRANDEURS))
      for (const kind of ['mcq', 'numeric_answer', 'clock'])
        if (c.gens?.[kind as ItemKind] && !/LONG_MASSE_CONT|AIRES|PERIMETRE/.test(id))
          for (const it of tirages(id, kind as ItemKind, 'plus_loin', 100))
            expect(it.difficulty ?? 0, `${it.id}`).toBeGreaterThanOrEqual(0.55);
  });
});
