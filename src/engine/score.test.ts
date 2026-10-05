import { describe, expect, it } from 'vitest';
import { Adaptivity } from './adaptivity';
import { computeStars, ludisForGame, mastery, playerLevel, xpForAnswer } from './score';

describe('étoiles', () => {
  it('suit les seuils 60 / 80 / 95 %', () => {
    expect(computeStars(5, 10, 0, 1, 'normal')).toBe(0);
    expect(computeStars(6, 10, 0, 1, 'normal')).toBe(1);
    expect(computeStars(8, 10, 0, 1, 'normal')).toBe(2);
    expect(computeStars(19, 20, 1000, 2000, 'normal')).toBe(3);
  });
  it('3★ exige le temps cible, sauf au niveau facile', () => {
    expect(computeStars(10, 10, 5000, 2000, 'normal')).toBe(2);
    expect(computeStars(10, 10, 5000, 2000, 'facile')).toBe(3);
  });
  it('aucune réponse = 0 étoile', () => expect(computeStars(0, 0, 0, 0, 'normal')).toBe(0));
});

describe('XP et Ludis', () => {
  it('XP : +10, ×1,5 plus loin, +5 en série', () => {
    expect(xpForAnswer(true, 1, 'normal')).toBe(10);
    expect(xpForAnswer(true, 3, 'normal')).toBe(15);
    expect(xpForAnswer(true, 1, 'plus_loin')).toBe(15);
    expect(xpForAnswer(false, 5, 'normal')).toBe(0);
  });
  it('Ludis jamais négatifs', () => {
    expect(ludisForGame(0, false, false)).toBe(0);
    expect(ludisForGame(3, true, true)).toBe(30);
  });
});

describe('maîtrise et niveau', () => {
  it('pondère Normal ×2, Plus loin ×1, Facile ×0,5', () => {
    expect(mastery({})).toBe(0);
    expect(mastery({ facile: 1, normal: 1, plus_loin: 1 })).toBe(1);
    expect(mastery({ normal: 1 })).toBeCloseTo(2 / 3.5);
  });
  it('niveau de joueur', () => {
    expect(playerLevel(0)).toMatchObject({ niveau: 1, titre: 'Apprenti' });
    expect(playerLevel(100).niveau).toBe(2);
    expect(playerLevel(299).niveau).toBe(2);
    expect(playerLevel(300).niveau).toBe(3);
  });
});

describe('adaptativité', () => {
  it('monte après 3 bonnes réponses, descend après 2 erreurs', () => {
    const a = new Adaptivity(0.4);
    a.record(true);
    a.record(true);
    a.record(true);
    expect(a.target).toBeCloseTo(0.6);
    a.record(false);
    a.record(false);
    expect(a.target).toBeCloseTo(0.4);
  });
});
