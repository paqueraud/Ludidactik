import { describe, expect, it } from 'vitest';
import { cible, decomposition, enUnites, phraseDecomposition, rangsDe, valeur, lireEnTout } from './materiel';

describe('Bâtisseur — matériel', () => {
  it('rangs utiles d’un entier et d’un décimal', () => {
    expect(rangsDe(635)).toEqual([2, 1, 0]);
    expect(rangsDe(7)).toEqual([1, 0]);
    expect(rangsDe(3.25)).toEqual([0, -1, -2]);
    expect(rangsDe(0.4)).toEqual([0, -1]);
    expect(rangsDe(45_600_000)).toEqual([7, 6, 5, 4, 3, 2, 1, 0]);
  });

  it('valeur exacte d’une construction, sans erreur d’arrondi', () => {
    expect(valeur({ 0: 3, [-1]: 2, [-2]: 5 }, -2)).toBe(3.25);
    expect(enUnites({ 0: 0, [-1]: 1, [-2]: 2 }, -2)).toBe(12);
    expect(valeur({ 2: 5, 1: 13, 0: 5 }, 0)).toBe(635);
    expect(cible(0.1 + 0.2, -1)).toBe(3);
  });

  it('décomposition canonique et phrase de correction', () => {
    expect(decomposition(635, [2, 1, 0])).toEqual({ 2: 6, 1: 3, 0: 5 });
    expect(phraseDecomposition(635, [2, 1, 0])).toBe('635 = 6 centaines, 3 dizaines et 5 unités.');
    expect(phraseDecomposition(110, [2, 1, 0])).toBe('110 = 1 centaine et 1 dizaine.');
    expect(phraseDecomposition(3.25, [0, -1, -2])).toBe('3,25 = 3 unités, 2 dixièmes et 5 centièmes.');
  });
});

describe('questions « en tout »', () => {
  it('lit le nombre à construire et le rang à compter', () => {
    expect(lireEnTout('Combien y a-t-il de dizaines en tout dans 348 ?', 34, 99)).toEqual({
      nombre: 348,
      rang: 1,
    });
    expect(lireEnTout('Combien y a-t-il de centaines en tout dans 4\u202F578 ?', 45, 99)).toEqual({
      nombre: 4578,
      rang: 2,
    });
    expect(lireEnTout('Combien y a-t-il de milliers en tout dans 65 000 335 ?', 65000, 99)).toBeNull();
    expect(lireEnTout('Écris le nombre.', 3, 99)).toBeNull();
  });
});
