import { describe, expect, it } from 'vitest';
import type { Item } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { FIXTURES } from '@/games/_kit/fixtures';
import { decouperFamille } from '../chasse-lettres-muettes/famille';
import { construireTas, nbIntrus } from '../lettres-en-vrac/tas';
import { wagonsDe } from '../train-accords/wagons';
import { phraseALire, phraseComplete, reduireChoix, trouJuste, versTrou } from './trou';

const L = 'TEST';
const muette: Item = {
  kind: 'fill_blank',
  id: 'm1',
  lessonId: L,
  sentence: 'Le chan___ des oiseaux.',
  answer: 't',
  choices: ['t', 'd', 's'],
  explication: 'On entend t dans chanter.',
  meta: { famille: 'chanter' },
};
const accord: Item = {
  kind: 'fill_blank',
  id: 'a1',
  lessonId: L,
  sentence: 'Les ___ chats jouent.',
  answer: 'petits',
  choices: ['petit', 'petits', 'petite'],
  explication: 'Chats est au pluriel.',
  meta: { groupe: ['Les', 'petits', 'chats'] },
};

describe('Phrases à trou', () => {
  it('découpe la phrase et lit les conventions meta', () => {
    const t = versTrou(muette)!;
    expect(t.avant).toBe('Le chan');
    expect(t.apres).toBe(' des oiseaux.');
    expect(t.famille).toBe('chanter');
    expect(phraseComplete(t)).toBe('Le chant des oiseaux.');
    expect(phraseALire(t)).toBe('Le chan … des oiseaux.');
    expect(versTrou(accord)!.groupe).toEqual(['Les', 'petits', 'chats']);
    expect(versTrou({ ...accord, meta: { groupe: 'les petits chats' } })!.groupe).toEqual([
      'les',
      'petits',
      'chats',
    ]);
  });
  it('accepte les QCM avec trou et ignore les autres types', () => {
    const q: Item = {
      kind: 'mcq',
      id: 'q',
      lessonId: L,
      question: 'gran___',
      choices: ['d', 't'],
      answerIndex: 0,
      explication: 'grande',
      guillotine: true,
      meta: { famille: 'grande' },
    };
    expect(versTrou(q)?.reponse).toBe('d');
    expect(versTrou(FIXTURES.spelling_word[0]!)).toBeNull();
  });
  it('vérifie les réponses sans confondre les homophones', () => {
    const t = versTrou(FIXTURES.fill_blank[0]!)!; // Léo ___ un vélo (a / à)
    expect(trouJuste(t, 'a')).toBe(true);
    expect(trouJuste(t, 'à')).toBe(false);
    expect(trouJuste(t, '')).toBe(false);
    expect(trouJuste(versTrou(accord)!, 'Petits')).toBe(true);
  });
  it('réduit les choix en gardant la bonne réponse', () => {
    for (let s = 1; s < 30; s++) {
      const c = reduireChoix(['a', 'b', 'c', 'd'], 'c', 2, createRng(s).next);
      expect(c).toHaveLength(2);
      expect(c).toContain('c');
    }
  });
});

describe('Chasse aux lettres muettes : mot de la famille', () => {
  it('surligne la lettre qu’on entend dans le mot de la famille', () => {
    expect(decouperFamille(versTrou(muette)!)).toEqual({ avant: 'chan', lettre: 't', apres: 'er' });
    const grand = versTrou({
      ...muette,
      sentence: 'Il est gran___.',
      answer: 'd',
      meta: { famille: 'grande' },
    })!;
    expect(decouperFamille(grand)).toEqual({ avant: 'gran', lettre: 'd', apres: 'e' });
  });
  it('ne prétend pas qu’on entend « c » dans « blanche »', () => {
    const blanc = versTrou({
      ...muette,
      sentence: 'Un chat blan___.',
      answer: 'c',
      meta: { famille: 'blanche' },
    })!;
    expect(decouperFamille(blanc)).toBeNull();
  });
  it('renvoie null si le mot de la famille ne correspond pas', () => {
    expect(decouperFamille(versTrou({ ...muette, meta: { famille: 'oiseau' } })!)).toBeNull();
    expect(decouperFamille(versTrou(accord)!)).toBeNull();
  });
});

describe('Train des accords : wagons', () => {
  it('utilise les mots du groupe et repère le wagon vide', () => {
    const w = wagonsDe(versTrou(accord)!);
    expect(w.map((x) => x.avant)).toEqual(['Les', '', 'chats']);
    expect(w.map((x) => x.trou)).toEqual([false, true, false]);
  });
  it('sans groupe, fait un wagon par mot de la phrase', () => {
    const w = wagonsDe(versTrou({ ...accord, meta: undefined })!);
    expect(w).toHaveLength(4);
    expect(w[1]!.trou).toBe(true);
  });
});

describe('Lettres en vrac : le tas', () => {
  it('contient exactement les lettres du mot, mélangées', () => {
    for (let s = 1; s < 50; s++) {
      const { cases, tuiles } = construireTas('grenouille', { intrus: 0 }, createRng(s).next);
      expect(cases).toHaveLength(10);
      expect(
        tuiles
          .map((t) => t.ch)
          .sort()
          .join(''),
      ).toBe([...'grenouille'].sort().join(''));
      expect(tuiles.map((t) => t.ch).join('')).not.toBe('grenouille');
    }
  });
  it('garde l’apostrophe et le trait d’union en place', () => {
    const { cases, tuiles } = construireTas('aujourd’hui', { intrus: 0 }, createRng(2).next);
    expect(cases.filter((c) => c.type === 'fixe').map((c) => c.ch)).toEqual(["'"]);
    expect(tuiles).toHaveLength(10);
  });
  it('ajoute des lettres intruses qui ne sont pas dans le mot', () => {
    for (let s = 1; s < 50; s++) {
      const n = nbIntrus('maison');
      const { tuiles } = construireTas('maison', { intrus: n }, createRng(s).next);
      const intrus = tuiles.filter((t) => t.intrus);
      expect(intrus).toHaveLength(n);
      for (const t of intrus) expect('maison').not.toContain(t.ch);
      expect(new Set(tuiles.map((t) => t.id)).size).toBe(tuiles.length);
    }
  });
});
