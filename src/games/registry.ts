/**
 * Registre des mini-jeux : chaque dossier `src/games/<id>/index.ts` exporte par défaut un GameModule
 * et il est découvert automatiquement (aucun fichier central à modifier pour ajouter un jeu).
 */
import { content } from '@/content';
import { type ProviderContext, availableKinds, countItems } from '@/content/provider';
import type { ItemKind, Lesson, Level } from '@/content/schemas';
import type { GameModule } from '@/engine/GameModule';
import { type Rng, createRng } from '@/engine/rng';

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

/** Items disponibles pour un jeu ; un flux dérivé qui ne produit rien pour ce jeu compte pour 0. */
function compter(
  lesson: Lesson,
  kind: ItemKind,
  rng: Rng,
  ctx: ProviderContext,
  game: GameModule,
  level: Level = 'normal',
) {
  try {
    return countItems(content, lesson, kind, level, rng, ctx, game.filterItem);
  } catch {
    return 0;
  }
}

/** Contenu suffisant au niveau Normal, et au moins un exercice en Facile et en Plus loin. */
const jouable = (lesson: Lesson, kind: ItemKind, rng: Rng, ctx: ProviderContext, game: GameModule) =>
  compter(lesson, kind, rng, ctx, game) >= game.minItems &&
  compter(lesson, kind, rng, ctx, game, 'facile') > 0 &&
  compter(lesson, kind, rng, ctx, game, 'plus_loin') > 0;

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
      if (!jouable(lesson, kind, rng, ctx, game)) continue;
      out.push({ game, kind });
      break;
    }
  }
  return out;
}
