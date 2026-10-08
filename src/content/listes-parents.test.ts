import { describe, expect, it } from 'vitest';
import type { ParentWordList } from '@/services/storage/db';
import { listesDuProfil } from '@/services/wordLists';
import { content } from '@/content';
import { createRng } from '@/engine/rng';
import { motsAbsents, phrasesDictee } from './listes-parents';
import { createStream } from './provider';

const liste = (o: Partial<ParentWordList>): ParentWordList => ({
  id: 'l',
  titre: 'Mots',
  profileIds: [],
  mots: [{ mot: 'chat' }, { mot: 'lait' }],
  creeLe: 0,
  ...o,
});

describe('dictées des parents', () => {
  it('découpe le texte en phrases en gardant la ponctuation', () => {
    expect(phrasesDictee('Le chat dort.  Il a bu du lait ! Où est-il ?')).toEqual([
      'Le chat dort.',
      'Il a bu du lait !',
      'Où est-il ?',
    ]);
    expect(phrasesDictee('Sans point final')).toEqual(['Sans point final']);
    expect(phrasesDictee('   ')).toEqual([]);
  });

  it('signale les mots de la liste absents du texte', () => {
    expect(motsAbsents('Le chat boit.', ['chat', 'lait', 'Chat'])).toEqual(['lait']);
    expect(motsAbsents('L’école est là.', ["l'école"])).toEqual([]);
    expect(motsAbsents('Les chats dorment.', ['chat'])).toEqual(['chat']);
  });

  it('une liste « pour tous » ne s’affiche qu’à la classe choisie ; une liste ciblée s’affiche toujours', () => {
    const ce2 = liste({ id: 'a', classe: 'CE2' });
    const ciblee = liste({ id: 'b', classe: 'CE2', profileIds: ['p1'] });
    const ancienne = liste({ id: 'c' });
    expect(listesDuProfil([ce2, ciblee, ancienne], 'p1', 'CE1').map((l) => l.id)).toEqual(['b', 'c']);
    expect(listesDuProfil([ce2], 'p2', 'CE2').map((l) => l.id)).toEqual(['a']);
    // une dictée sans mots reste jouable
    expect(listesDuProfil([liste({ id: 'd', mots: [], dictee: 'Le chat dort.' })], 'p', 'CE1')).toHaveLength(
      1,
    );
  });

  it('le texte de la dictée devient des phrases à écrire (Normal : mots + phrases ; Plus loin : phrases)', () => {
    const lesson = content.lessons.get('CE1.FR.ORTH.LISTES_PARENTS')!;
    const ctx = { parentLists: [liste({ dictee: 'Le chat dort. Il a bu son lait.' })] };
    const tirer = (niveau: 'facile' | 'normal' | 'plus_loin') => {
      const s = createStream(content, lesson, 'spelling_word', niveau, createRng(1), ctx)!;
      return Array.from({ length: s.size! }, () => s.next());
    };
    expect(tirer('facile').every((i) => i.kind === 'spelling_word' && !i.isSentence)).toBe(true);
    expect(tirer('normal').some((i) => i.kind === 'spelling_word' && i.isSentence)).toBe(true);
    expect(tirer('plus_loin').every((i) => i.kind === 'spelling_word' && i.isSentence)).toBe(true);
  });
});
