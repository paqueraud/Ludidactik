/**
 * Outils de test du module « maths-cm2 » (utilisés uniquement par les fichiers *.test.ts) :
 * tirages reproductibles, extraction des nombres affichés, clé de contenu d'un item.
 */
import cm2 from '@data/curriculum/cm2.json';
import { parseNumber } from '@/engine/answer';
import { createRng } from '@/engine/rng';
import type { ContentIndex } from '../../parse';
import type { GenContext } from '../../registry';
import type { Item, ItemKind, Lesson, Level } from '../../schemas';
import { contenu } from './index';

export const lessons = (cm2 as { lecons: Lesson[] }).lecons;
/** Leçons de ce module : maths CM2 hors calcul mental. */
export const mesLecons = lessons.filter((l) => l.id.startsWith('CM2.MA.') && !l.id.startsWith('CM2.MA.CM.'));
export const ctxOf = (lesson: Lesson): GenContext => ({ index: {} as ContentIndex, lesson, parentLists: [] });
export const N = 200;

/** Tire `n` items d'une leçon pour un type et un niveau (graine fixe). */
export function tirages(lessonId: string, kind: ItemKind, level: Level, n = N, seed = 1): Item[] {
  const lesson = mesLecons.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`leçon inconnue : ${lessonId}`);
  const gen = contenu[lessonId]?.gens?.[kind];
  if (!gen) throw new Error(`pas de générateur ${kind} pour ${lessonId}`);
  const rng = createRng(seed);
  return Array.from({ length: n }, () => gen(level, rng, ctxOf(lesson)));
}

/** Tirages typés : `tiragesDe('CM2.MA.X', 'mcq', 'normal')` → `ItemOf<'mcq'>[]`. */
export function tiragesDe<K extends ItemKind>(lessonId: string, kind: K, level: Level, n = N, seed = 1) {
  return tirages(lessonId, kind, level, n, seed) as Extract<Item, { kind: K }>[];
}

/** Textes affichés d'un item. */
export function textesAffiches(item: Item): string[] {
  const textes: string[] = [item.explication];
  const add = (...s: (string | undefined)[]) => s.forEach((x) => x && textes.push(x));
  switch (item.kind) {
    case 'numeric_answer':
      add(item.prompt);
      break;
    case 'mcq':
      add(item.question, ...item.choices, ...(item.hints ?? []));
      break;
    case 'true_false':
      add(item.statement);
      break;
    case 'fill_blank':
      add(item.sentence, item.answer, ...(item.choices ?? []));
      break;
    case 'ordering':
      add(item.prompt, ...item.elements);
      break;
    case 'classification':
      add(item.prompt, ...item.categories, ...item.elements.map((e) => e.label));
      break;
    case 'pairing':
      add(item.prompt, ...item.pairs.flatMap((p) => [p.left, p.right]));
      break;
    case 'number_line':
      add(item.prompt, item.display);
      break;
    case 'bar_model':
      add(item.statement, item.question, item.operation, item.answerSentence, ...(item.reformulations ?? []));
      break;
    case 'geometry_shape':
      add(item.prompt, item.answer, ...(item.choices ?? []));
      break;
    case 'clock':
      add(item.prompt, item.answerText);
      break;
    case 'oral_answer':
      add(item.prompt, item.answer);
      break;
    case 'money':
    case 'visual_fraction':
      add(item.prompt);
      break;
  }
  return textes;
}

/** Tous les nombres écrits dans les textes affichés (« 1 000 » = mille, « 3,45 »). */
export function nombresAffiches(item: Item): number[] {
  return textesAffiches(item).flatMap((t) =>
    (t.match(/\d{1,3}(?:[   ]\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g) ?? []).map((s) => parseNumber(s)!),
  );
}

/** Ce qui définit le contenu d'un item (même id ⇒ même question et même réponse). */
export function cle(item: Item): string {
  switch (item.kind) {
    case 'numeric_answer':
      return `${item.prompt}=${item.answer}${JSON.stringify(item.meta ?? {})}`;
    case 'mcq':
      return `${item.question}=${item.choices[item.answerIndex]}`;
    case 'true_false':
      return `${item.statement}=${item.answer}`;
    case 'fill_blank':
      return `${item.sentence}=${item.answer}`;
    case 'ordering':
      return `${item.prompt}=${item.elements.join('|')}`;
    case 'classification':
      return `${item.prompt}=${item.elements
        .map((e) => `${e.label}:${e.category}`)
        .sort()
        .join('|')}`;
    case 'pairing':
      return item.pairs
        .map((p) => `${p.left}:${p.right}`)
        .sort()
        .join('|');
    case 'number_line':
      return `${item.prompt}=${item.target}[${item.min},${item.max},${item.step},${item.subdivisions}]`;
    case 'visual_fraction':
      return `${item.prompt}=${item.numerator}/${item.denominator}/${item.task}/${JSON.stringify(item.other)}`;
    case 'clock':
      return `${item.prompt}=${item.task}${item.hours}:${item.minutes}:${item.seconds}:${item.answerText}`;
    case 'money':
      return `${item.prompt}=${item.priceCents}/${item.givenCents}`;
    case 'geometry_shape':
      return `${item.prompt}=${item.shape}:${item.answer}:${JSON.stringify(item.grid)}:${JSON.stringify(item.meta ?? {})}`;
    case 'oral_answer':
      return `${item.prompt}=${item.answer}`;
    case 'bar_model':
      return `${item.statement}${item.question}=${item.answer}`;
    default:
      return item.id;
  }
}

/** Lit un nombre écrit à la française (« 12 500 », « 3,45 »). */
export const num = (s: string) => parseNumber(s.trim())!;
/** Signe de comparaison. */
export const symb = (a: number, b: number) => (Math.abs(a - b) < 1e-9 ? '=' : a < b ? '<' : '>');
/** Valeur d'une fraction écrite « a/b ». */
export const fracVal = (s: string) => {
  const [a, b] = s.split('/').map(Number);
  return a! / b!;
};
