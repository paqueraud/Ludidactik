/**
 * Textes de lecture (data/lecture/textes.json, validés par zod) → items :
 * - `read_aloud` pour le Karaoké (fluence, objectifs MCLM par niveau dans `meta.objectifs`) ;
 * - `mcq` avec `meta.texte` / `meta.titre` / `meta.preuve` pour le Détective du texte ;
 * - `ordering` (mode « etapes ») pour remettre les étapes d'un récit ou d'une recette dans l'ordre.
 */
import textesJson from '@data/lecture/textes.json';
import type { Rng } from '@/engine/rng';
import type { GenContext, ItemPool } from '../../registry';
import { type Classe, type Item, type Level, ReadingFileSchema } from '../../schemas';
import { compterMots, diff, g, ordre, parNiv, qcm } from './util';

export const TEXTES = ReadingFileSchema.parse(textesJson).textes;
export type Texte = (typeof TEXTES)[number];

/** Textes d'une classe pour un niveau (Plus loin : textes « normal » et « plus loin »). */
function textesDe(classe: Classe, level: Level, pourLecture = false): Texte[] {
  const niveaux = parNiv<Level[]>(level, {
    facile: ['facile'],
    normal: ['normal'],
    plus_loin: pourLecture ? ['normal', 'plus_loin'] : ['plus_loin'],
  });
  return TEXTES.filter((t) => t.classe === classe && niveaux.includes(t.niveau));
}

/** Citation entre guillemets, sans doubler ceux d'une réplique déjà guillemetée. */
const cite = (s: string) => (s.trim().startsWith('«') ? s.trim() : g(s));

/** Explication d'une réponse : on renvoie toujours au texte (justifier par un retour au texte). */
function explicationQuestion(bonne: string, preuve: string | undefined, notion: string | undefined): string {
  if (!preuve) {
    if (notion === 'titre') return `Le bon titre résume tout le texte : « ${bonne} ».`;
    if (notion === 'résumé') return 'Un bon résumé reprend l’essentiel du texte, sans rien inventer.';
    if (notion === 'type de texte' || notion === 'genre')
      return `On regarde comment le texte est écrit et à quoi il sert : c’est ${bonne}.`;
    if (notion === 'nature du document')
      return `On regarde qui a écrit le document et dans quel but : la bonne réponse est « ${bonne} ».`;
    if (notion === 'comparer deux documents')
      return 'On relit les deux documents et on rassemble leurs informations.';
    return `On relit le passage : la bonne réponse est « ${bonne} ».`;
  }
  if (notion === 'inférence')
    return `Le texte ne le dit pas directement : on le devine grâce à cette phrase : ${cite(preuve)}`;
  if (notion === 'anaphore') return `On cherche de qui (ou de quoi) on parle juste avant : ${cite(preuve)}`;
  if (notion === 'vocabulaire' || notion === 'expression')
    return `Le sens se devine grâce à la phrase : ${cite(preuve)}`;
  if (notion === 'morale') return `On interprète la morale de la fable : ${cite(preuve)}`;
  return `La réponse est écrite dans le texte : ${cite(preuve)}`;
}

/** Questions de compréhension (QCM « Détective ») des textes d'une classe et d'un niveau. */
export function poolComprehension(classe: Classe): ItemPool {
  return (level, rng, ctx) =>
    textesDe(classe, level).flatMap((t, it) =>
      t.questions.flatMap((qu, iq): Item[] => {
        if (qu.type !== 'mcq' || qu.notion === 'conjugaison') return [];
        const bonne = qu.choix[qu.bonne]!;
        return [
          qcm(ctx, rng, `${t.id}-${iq}`, {
            question: qu.question,
            spoken: qu.question,
            good: bonne,
            wrong: qu.choix.filter((_, i) => i !== qu.bonne),
            max: qu.choix.length,
            explication: explicationQuestion(bonne, qu.preuve, qu.notion),
            difficulty: diff(level, qu.notion ? 0.8 : 0.3 + 0.05 * it),
            meta: { texte: t.texte, titre: t.titre, ...(qu.preuve ? { preuve: qu.preuve } : {}) },
          }),
        ];
      }),
    );
}

/** Étapes d'un récit ou d'une recette à remettre dans l'ordre. */
export function poolEtapes(classe: Classe): ItemPool {
  return (level, _rng, ctx) =>
    textesDe(classe, level).flatMap((t) =>
      t.questions.flatMap((qu, iq): Item[] =>
        qu.type === 'ordering'
          ? [
              ordre(ctx, `${t.id}-${iq}`, {
                prompt: `${qu.question.replace(/\.$/, '')} (texte : « ${t.titre} »).`,
                elements: qu.elements,
                mode: 'etapes',
                explication:
                  'Je cherche ce qui se passe d’abord, puis ensuite, et enfin : chaque étape entraîne la suivante.',
                difficulty: diff(level, 0.5),
              }),
            ]
          : [],
      ),
    );
}

/** Textes à lire à voix haute (Karaoké) avec les objectifs MCLM de la classe. */
export function poolFluence(
  classe: Classe,
  objectifs: Record<Level, number>,
  explication: string,
): (level: Level, rng: Rng, ctx: GenContext) => Item[] {
  return (level, _rng, ctx) =>
    textesDe(classe, level, true).map((t) => ({
      kind: 'read_aloud' as const,
      id: `${ctx.lesson.id}:read_aloud:${t.id}:${objectifs[level]}`,
      lessonId: ctx.lesson.id,
      title: t.titre,
      text: t.texte,
      nbMots: compterMots(t.texte),
      targetMCLM: objectifs[level],
      explication,
      difficulty: diff(level, Math.min(1, compterMots(t.texte) / 200)),
      meta: { objectifs },
    }));
}
