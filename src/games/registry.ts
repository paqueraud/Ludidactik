/** Registre des mini-jeux et compatibilité leçon ↔ jeux. */
import { content } from '@/content';
import { type ProviderContext, availableKinds, countItems } from '@/content/provider';
import type { ItemKind, Lesson } from '@/content/schemas';
import type { GameModule } from '@/engine/GameModule';
import { createRng } from '@/engine/rng';
import { ascension } from './ascension';
import { grandPrix } from './grand-prix';
import { guillotine } from './guillotine';

export const GAMES: GameModule[] = [grandPrix, ascension, guillotine];

export const getGame = (id: string) => GAMES.find((g) => g.id === id);

export interface PlayableGame {
  game: GameModule;
  kind: ItemKind;
}

/** Jeux jouables pour une leçon : type d'item accepté ET contenu suffisant. */
export function gamesForLesson(lesson: Lesson, ctx: ProviderContext): PlayableGame[] {
  const kinds = availableKinds(content, lesson, ctx);
  const rng = createRng(1);
  const out: PlayableGame[] = [];
  for (const game of GAMES) {
    if (!game.classes.includes(lesson.classe)) continue;
    const kind = game.accepts.find((k) => kinds.includes(k));
    if (!kind) continue;
    if (countItems(content, lesson, kind, 'normal', rng, ctx, game.filterItem) < game.minItems) continue;
    out.push({ game, kind });
  }
  return out;
}
