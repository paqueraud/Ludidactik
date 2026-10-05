/**
 * Registre des mini-jeux : chaque dossier `src/games/<id>/index.ts` exporte par défaut un GameModule
 * et il est découvert automatiquement (aucun fichier central à modifier pour ajouter un jeu).
 */
import { content } from '@/content';
import { type ProviderContext, availableKinds, countItems } from '@/content/provider';
import type { ItemKind, Lesson } from '@/content/schemas';
import type { GameModule } from '@/engine/GameModule';
import { createRng } from '@/engine/rng';

const modules = import.meta.glob<GameModule>(['./*/index.ts', '!./_*/**'], {
  eager: true,
  import: 'default',
});

export const GAMES: GameModule[] = Object.values(modules).sort((a, b) => a.numero - b.numero);

export const getGame = (id: string) => GAMES.find((g) => g.id === id);

export interface PlayableGame {
  game: GameModule;
  kind: ItemKind;
}

/** Jeux jouables pour une leçon : type d'item accepté (natif ou dérivé) ET contenu suffisant. */
export function gamesForLesson(lesson: Lesson, ctx: ProviderContext): PlayableGame[] {
  const kinds = availableKinds(content, lesson, ctx);
  const rng = createRng(1);
  const out: PlayableGame[] = [];
  for (const game of GAMES) {
    if (!game.classes.includes(lesson.classe)) continue;
    if (game.lessons && !game.lessons(lesson)) continue;
    // ordre de préférence = ordre de `accepts` ; on prend le premier type disponible et suffisant
    for (const kind of game.accepts) {
      if (!kinds.includes(kind)) continue;
      if (countItems(content, lesson, kind, 'normal', rng, ctx, game.filterItem) < game.minItems) continue;
      out.push({ game, kind });
      break;
    }
  }
  return out;
}
