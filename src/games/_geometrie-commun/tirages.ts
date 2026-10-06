/**
 * Pour les tests des jeux de géométrie, mesures et données : tirages d'items RÉELLEMENT produits par les
 * modules de contenu (graine fixe). Utilisé uniquement par les fichiers *.test.ts.
 */
import ce1 from '@data/curriculum/ce1.json';
import cm2 from '@data/curriculum/cm2.json';
import { CONTENU } from '@/content/modules';
import type { ContentIndex } from '@/content/parse';
import type { Item, ItemKind, Lesson, Level } from '@/content/schemas';
import { createRng } from '@/engine/rng';

const LECONS = [...(ce1 as { lecons: Lesson[] }).lecons, ...(cm2 as { lecons: Lesson[] }).lecons];
export const NIVEAUX: Level[] = ['facile', 'normal', 'plus_loin'];

export function tirages(lessonId: string, kind: ItemKind, level: Level, n = 150, seed = 3): Item[] {
  const lesson = LECONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`leçon inconnue : ${lessonId}`);
  const gen = CONTENU[lessonId]?.gens?.[kind];
  if (!gen) throw new Error(`pas de générateur ${kind} pour ${lessonId}`);
  const rng = createRng(seed);
  return Array.from({ length: n }, () =>
    gen(level, rng, { index: {} as ContentIndex, lesson, parentLists: [] }),
  );
}

/** Tous les niveaux d'une leçon pour un type. */
export const tousNiveaux = (lessonId: string, kind: ItemKind, n = 150) =>
  NIVEAUX.flatMap((l) => tirages(lessonId, kind, l, n));

export const lecon = (id: string) => LECONS.find((l) => l.id === id)!;
