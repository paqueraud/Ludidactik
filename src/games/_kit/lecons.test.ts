/** Jeux proposés selon le contenu réel : devinettes de français, rangements de nombres ou de mots. */
import { describe, expect, it } from 'vitest';
import { content, getLesson } from '@/content';
import { createStream } from '@/content/provider';
import { createRng } from '@/engine/rng';
import { gamesForLesson } from '@/games/registry';

const ctx = { parentLists: [] };
const jeux = (id: string) => gamesForLesson(getLesson(id)!, ctx).map((g) => g.game.id);

describe('Qui suis-je ? en français', () => {
  it('proposé pour les personnages mystères (QCM à indices)', () => {
    expect(jeux('CM2.FR.LEC.CULTURE')).toContain('qui-suis-je');
  });
  it('pas pour la grammaire', () => {
    expect(jeux('CE1.FR.GRAM.SUBST')).not.toContain('qui-suis-je');
    expect(jeux('CM2.FR.GRAM.SUJET')).not.toContain('qui-suis-je');
  });
});

describe('rangements (ordering croissant / décroissant)', () => {
  it('au moins une leçon les fait jouer dans le Puzzle', () => {
    const modes = new Set<string>();
    for (const l of content.lessons.values()) {
      if (l.matiere !== 'maths' || !l.itemKinds.includes('ordering')) continue;
      const g = gamesForLesson(l, ctx).find((x) => x.game.id === 'puzzle-phrases');
      if (!g) continue;
      const st = createStream(content, l, g.kind, 'normal', createRng(2), ctx, g.game.filterItem)!;
      for (let i = 0; i < 6; i++) {
        const it = st.next();
        if (it.kind === 'ordering') modes.add(it.mode);
      }
    }
    expect([...modes]).toEqual(expect.arrayContaining(['croissant']));
  }, 60_000);
});
