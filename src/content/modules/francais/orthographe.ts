/**
 * Orthographe lexicale : types complémentaires des listes de mots (data/dictees/*.json).
 * Les mots eux-mêmes (`spelling_word`) viennent directement des listes ; ce module ajoute des paires
 * mot ↔ définition (Memory) et des classements (par thème, par régularité orthographique).
 * BO CE1 : « mémoriser l'orthographe des mots fréquents » ; BO CM2 : « écrire correctement les mots
 * fréquents en s'appuyant sur les régularités et la formation ».
 */
import ce1Mots from '@data/dictees/ce1_mots.json';
import cm2Mots from '@data/dictees/cm2_mots.json';
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext } from '../../registry';
import { type Item, type Level, WordListFileSchema } from '../../schemas';
import { classer, diff, paires, parNiv, tirer } from './util';

const LISTES = [...WordListFileSchema.parse(ce1Mots).listes, ...WordListFileSchema.parse(cm2Mots).listes];

/** Mots définis d'une leçon pour un niveau (Plus loin : listes « normal » et « plus loin »). */
function motsDefinis(lessonId: string, level: Level): [string, string][] {
  const niveaux = parNiv<Level[]>(level, {
    facile: ['facile', 'normal'],
    normal: ['normal'],
    plus_loin: ['normal', 'plus_loin'],
  });
  const listes = LISTES.filter((l) => l.lessonId === lessonId);
  const choisies = listes.filter((l) => niveaux.includes(l.niveau));
  const mots = (choisies.length ? choisies : listes).flatMap((l) =>
    l.mots.flatMap((m): [string, string][] =>
      m.definition ? [[m.mot.replace(/'/g, '’'), m.definition]] : [],
    ),
  );
  const uniques = [...new Map(mots.map((m) => [m[0], m])).values()];
  if (level !== 'facile') return uniques;
  const courts = uniques.filter(([m]) => m.length <= 6);
  return courts.length >= 8 ? courts : uniques;
}

function pairesDefinitions(level: Level, rng: Rng, ctx: GenContext): Item {
  const n = parNiv(level, { facile: 4, normal: 5, plus_loin: 6 });
  const choisis: [string, string][] = [];
  for (const m of rng.shuffle(motsDefinis(ctx.lesson.id, level))) {
    if (choisis.some(([, d]) => d === m[1])) continue;
    choisis.push(m);
    if (choisis.length >= n) break;
  }
  return paires(ctx, `def-${choisis.map(([m]) => m).join('|')}`, {
    prompt: 'Associe chaque mot à sa définition.',
    pairs: choisis.map(([left, right]) => ({ left, right })),
    relation: 'mot → définition',
    explication:
      'Je lis la définition, je cherche le mot qui lui correspond, puis je regarde bien comment il s’écrit.',
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CE1 : classer les mots de la liste par thème                        */
/* ------------------------------------------------------------------ */

const THEMES_CE1: Record<string, string> = {
  'ce1-ecole': 'l’école',
  'ce1-maison': 'la maison',
  'ce1-corps': 'le corps',
  'ce1-nature': 'la nature',
};
/** Mots de la liste « plus loin » rangés à la main (les autres n'entrent dans aucune catégorie claire). */
const PLUS_LOIN_CE1: Record<string, string> = {
  hippopotame: 'les animaux',
  crocodile: 'les animaux',
  kangourou: 'les animaux',
  rhinocéros: 'les animaux',
  bibliothèque: 'les lieux',
  boulangerie: 'les lieux',
  gymnase: 'les lieux',
  garage: 'les lieux',
  quelquefois: 'le temps qui passe',
  longtemps: 'le temps qui passe',
  autrefois: 'le temps qui passe',
  automne: 'le temps qui passe',
};

function classerThemesCe1(level: Level, rng: Rng, ctx: GenContext): Item {
  const parTheme = new Map<string, string[]>();
  const ajoute = (t: string, m: string) => {
    if ([...parTheme.values()].some((l) => l.includes(m))) return;
    parTheme.set(t, [...(parTheme.get(t) ?? []), m]);
  };
  if (level === 'plus_loin') for (const [m, t] of Object.entries(PLUS_LOIN_CE1)) ajoute(t, m);
  else
    for (const l of LISTES)
      if (THEMES_CE1[l.id])
        for (const m of l.mots) if (level === 'normal' || m.mot.length <= 6) ajoute(THEMES_CE1[l.id]!, m.mot);
  const themes = tirer(rng, [...parTheme.keys()], parNiv(level, { facile: 2, normal: 3, plus_loin: 3 }));
  const n = parNiv(level, { facile: 3, normal: 3, plus_loin: 3 });
  return classer(ctx, rng, `themes-${themes.join('|')}`, {
    prompt: 'Lis chaque mot de la liste et range-le dans son thème.',
    categories: themes,
    elements: themes.flatMap((t, i) => tirer(rng, parTheme.get(t)!, n).map((m): [string, number] => [m, i])),
    explication:
      'Ranger les mots par thème aide à les retenir : je relis chaque mot en regardant bien ses lettres.',
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* CM2 : régularités orthographiques                                   */
/* ------------------------------------------------------------------ */

/** Familles de régularités : [catégorie, mots]. */
const REGULARITES_CM2: Record<Level, [string, string[]][]> = {
  facile: [
    ['-tion', ['attention', 'émotion', 'opération', 'invention', 'conversation']],
    ['-sion', ['télévision', 'décision', 'explosion']],
    ['-ssion', ['permission', 'expression', 'profession', 'émission']],
  ],
  normal: [
    ['-tion', ['attention', 'émotion', 'opération', 'invention', 'conversation', 'addition', 'collection']],
    ['-sion', ['télévision', 'décision', 'explosion']],
    ['-ssion', ['permission', 'expression', 'profession', 'émission']],
  ],
  plus_loin: [
    ['mm', ['immense', 'commencer', 'accommoder']],
    ['nn', ['honneur', 'innocent', 'personne', 'colonne']],
    ['ff', ['différence', 'difficile', 'offrir']],
    ['pp', ['appétit', 'appartement', 'apparemment']],
    ['tt', ['attention', 'bouteille']],
  ],
};
/** Mots invariables par sens. */
const INVARIABLES_CM2: [string, string[]][] = [
  [
    'le temps',
    ['désormais', 'dorénavant', 'auparavant', 'autrefois', 'longtemps', 'parfois', 'aussitôt', 'quelquefois'],
  ],
  ['l’opposition', ['cependant', 'pourtant', 'néanmoins', 'toutefois', 'malgré']],
  ['la quantité', ['davantage', 'environ', 'plusieurs', 'beaucoup']],
  ['la cause', ['puisque']],
];

function classerRegularitesCm2(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level !== 'facile' && rng.chance(0.4)) {
    const cats = INVARIABLES_CM2.filter(([, m]) => m.length >= 3);
    return classer(ctx, rng, 'invariables', {
      prompt: 'Range ces mots invariables selon ce qu’ils expriment.',
      categories: cats.map(([c]) => c),
      elements: cats.flatMap(([, m], i) => tirer(rng, m, 3).map((x): [string, number] => [x, i])),
      explication:
        'Les mots invariables ne changent jamais d’orthographe : les ranger par sens aide à les mémoriser.',
      difficulty: diff(level, rng.next()),
    });
  }
  const familles = tirer(rng, REGULARITES_CM2[level], parNiv(level, { facile: 3, normal: 3, plus_loin: 4 }));
  return classer(ctx, rng, `regul-${familles.map(([c]) => c).join('|')}`, {
    prompt:
      level === 'plus_loin'
        ? 'Range chaque mot selon sa consonne double.'
        : 'Range chaque mot selon sa terminaison : -tion, -sion ou -ssion ?',
    categories: familles.map(([c]) => c),
    elements: familles.flatMap(([, m], i) => tirer(rng, m, 3).map((x): [string, number] => [x, i])),
    explication:
      level === 'plus_loin'
        ? 'Certains mots doublent la consonne après un préfixe (ap-, com-, dif-, im-, of-) ; d’autres sont à mémoriser (personne, bouteille) : je les apprends par familles.'
        : 'On entend [sion] dans -tion et -ssion, et [zion] dans -sion (télévision) : je les classe pour les mémoriser.',
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */

export const ORTHOGRAPHE: ContentModule = {
  'CE1.FR.ORTH.MOTS_FREQ': { gens: { pairing: pairesDefinitions, classification: classerThemesCe1 } },
  'CM2.FR.ORTH.MOTS': { gens: { pairing: pairesDefinitions, classification: classerRegularitesCm2 } },
};

/** Paires mot ↔ définition d'une autre leçon qui a une liste de mots (vocabulaire des univers, CM2). */
export { pairesDefinitions };
