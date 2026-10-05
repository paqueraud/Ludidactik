/** Calcul mental CE1 / CM2 (Phase 2) : générateurs `numeric_answer` par leçon. */
import { CALC_GENERATORS } from '../generators/calcul';
import type { ContentModule } from '../registry';

export const contenu: ContentModule = Object.fromEntries(
  Object.entries(CALC_GENERATORS).map(([name, gen]) => [
    name.toUpperCase(),
    {
      gens: {
        numeric_answer: (level, rng, ctx) => ({
          ...gen(level, rng),
          kind: 'numeric_answer' as const,
          id: `${ctx.lesson.id}#${Math.floor(rng.next() * 1e9)}`,
          lessonId: ctx.lesson.id,
        }),
      },
    },
  ]),
);
