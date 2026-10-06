import { describe, expect, it } from 'vitest';
import { checkItem } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { getCarte, resoudreCible } from '../_cartes/cartes';
import { MONDE_FIXTURES } from './fixtures';
import {
  direction,
  estCycle,
  estEmoji,
  estFrise,
  estPaireImage,
  melangeDesordonne,
  normaliserOral,
  oralCorrespond,
  phraseDirection,
  reduireChoix,
  restreindreOrdre,
  sousOrdre,
  verifierOrdre,
} from './outils';

describe('exemples des jeux 50 à 56', () => {
  const tous = Object.values(MONDE_FIXTURES).flat();
  it('tous valides (checkItem) et ids uniques', () => {
    for (const it of tous) expect(checkItem(it), it.id).toEqual([]);
    const ids = tous.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('les cibles de carte existent', () => {
    for (const it of MONDE_FIXTURES.map_point ?? []) {
      if (it.kind !== 'map_point') continue;
      expect(resoudreCible(getCarte(it.map)!, it.target), it.id).not.toBeNull();
    }
  });
  it('les QCM « Qui suis-je ? » ont 3 à 5 indices', () => {
    const qui = (MONDE_FIXTURES.mcq ?? []).filter((i) => i.kind === 'mcq' && i.hints);
    expect(qui.length).toBeGreaterThanOrEqual(3);
    for (const q of qui) if (q.kind === 'mcq') expect(q.hints!.length).toBeGreaterThanOrEqual(3);
  });
  it('les paires d’anglais sont des paires mot ↔ image', () => {
    for (const p of MONDE_FIXTURES.pairing ?? []) expect(estPaireImage(p), p.id).toBe(true);
  });
});

describe('ordres', () => {
  it('un mélange n’est jamais déjà rangé', () => {
    const rng = createRng(3);
    for (let n = 2; n <= 8; n++) {
      for (let k = 0; k < 50; k++) {
        const m = melangeDesordonne(n, rng);
        expect([...m].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
        expect(m.some((v, i) => v !== i)).toBe(true);
      }
    }
  });
  it('vérification d’un ordre', () => {
    expect(verifierOrdre([0, 1, 2, 3], 4)).toEqual({ juste: true, bienPlaces: [true, true, true, true] });
    expect(verifierOrdre([1, 0, 2, 3], 4)).toEqual({ juste: false, bienPlaces: [false, false, true, true] });
    expect(verifierOrdre([0, 1, 2], 4).juste).toBe(false);
  });
  it('sous-ordre : garde les extrémités et l’ordre relatif', () => {
    const rng = createRng(1);
    for (let i = 0; i < 30; i++) {
      const s = sousOrdre(7, 4, rng);
      expect(s).toHaveLength(4);
      expect(s[0]).toBe(0);
      expect(s[3]).toBe(6);
      expect([...s].sort((a, b) => a - b)).toEqual(s);
    }
    expect(sousOrdre(3, 5, rng)).toEqual([0, 1, 2]);
  });
  it('restreindre un item garde les étiquettes alignées', () => {
    const frise = MONDE_FIXTURES.ordering![0]!;
    if (frise.kind !== 'ordering') throw new Error();
    const r = restreindreOrdre(frise, [0, 3]);
    expect(r.elements).toEqual([frise.elements[0], frise.elements[3]]);
    expect(r.labels).toEqual(['1792', '1944']);
    expect(checkItem(r)).toEqual([]);
  });
  it('frises et cycles reconnus', () => {
    const [chrono, , , cycle, etapes] = MONDE_FIXTURES.ordering!;
    expect(estFrise(chrono!)).toBe(true);
    expect(estFrise(cycle!)).toBe(true);
    expect(cycle!.kind === 'ordering' && estCycle(cycle!)).toBe(true);
    expect(etapes!.kind === 'ordering' && estCycle(etapes!)).toBe(false);
    expect(estFrise({ ...chrono!, kind: 'ordering', mode: 'croissant' } as never)).toBe(false);
  });
});

describe('QCM et oral', () => {
  it('réduire les choix garde la bonne réponse', () => {
    const rng = createRng(5);
    for (let i = 0; i < 40; i++) {
      const r = reduireChoix({ choices: ['a', 'b', 'c', 'd'], answerIndex: 2 }, 2, rng);
      expect(r.choices).toHaveLength(2);
      expect(r.choices[r.answerIndex]).toBe('c');
    }
  });
  it('emoji', () => {
    expect(estEmoji('🐶')).toBe(true);
    expect(estEmoji('✏️')).toBe(true);
    expect(estEmoji('🇫🇷')).toBe(false); // drapeau : lettres régionales, pas un pictogramme
    expect(estEmoji('dog')).toBe(false);
    expect(estEmoji('42')).toBe(false);
    expect(estEmoji('🐶 dog')).toBe(false);
  });
  it('comparaison orale tolérante', () => {
    expect(normaliserOral('  Hello!  ')).toBe('hello');
    expect(oralCorrespond(['It’s a cat'], ['cat'])).toBe(true);
    expect(oralCorrespond(['hat'], ['cat'])).toBe(false);
    expect(oralCorrespond(['Hello'], ['hello', 'hi'])).toBe(true);
  });
});

describe('directions sur une carte', () => {
  it('points cardinaux (y vers le bas)', () => {
    expect(direction([0, 0], [0, -10])).toBe('nord');
    expect(direction([0, 0], [10, 0])).toBe('est');
    expect(direction([0, 0], [-10, 10])).toBe('sud-ouest');
    expect(phraseDirection('est')).toBe('Cherche plus à l’est !');
    expect(phraseDirection('nord-ouest')).toBe('Cherche plus au nord-ouest !');
    expect(phraseDirection('sud-est', true)).toBe('Cherche plus bas et plus à droite !');
  });
});
