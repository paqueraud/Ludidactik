/**
 * Toutes les leçons × tous les jeux proposés × 3 niveaux : le flux d'items (natif ou dérivé par un
 * adaptateur) se crée et fournit des items valides, sans lever d'exception au niveau Normal (celui que
 * `gamesForLesson` vérifie). Aux autres niveaux, un flux dérivé peut s'épuiser : les jeux tirent via
 * `itemSuivant` (src/games/_kit/session.ts) et affichent alors un état calme.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '@/engine/rng';
import { itemSuivant } from '@/games/_kit/session';
import { gamesForLesson } from '@/games/registry';
import { content } from './index';
import { checkItem } from './items';
import { createStream } from './provider';
import { LEVELS } from './schemas';

const ctx = { parentLists: [] };

describe('flux d’items de chaque leçon pour chaque jeu proposé', () => {
  it.each([...content.lessons.values()].map((l) => [l.id, l] as const))('%s', (_id, lesson) => {
    for (const { game, kind } of gamesForLesson(lesson, ctx)) {
      for (const level of LEVELS) {
        const st = createStream(content, lesson, kind, level, createRng(11), ctx, game.filterItem);
        if (!st) {
          expect(level, `${game.id} ${kind} : pas de flux au niveau Normal`).not.toBe('normal');
          continue;
        }
        let acceptes = 0;
        for (let i = 0; i < 8; i++) {
          if (level === 'normal') expect(() => st.next(0.5), `${game.id} ${kind}`).not.toThrow();
          const item = itemSuivant(st, 0.5);
          if (!item) break;
          expect(checkItem(item), `${game.id} ${level} ${item.id}`).toEqual([]);
          if (!game.filterItem || game.filterItem(item)) acceptes++;
        }
        // un générateur natif peut rendre un item hors filtre après 60 essais : le jeu le saute
        if (level === 'normal') expect(acceptes, `${game.id} ${kind}`).toBeGreaterThan(0);
      }
    }
  });
});
