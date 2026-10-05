import { describe, expect, it } from 'vitest';
import { graphiesNombre, nombreEnLettres } from './nombres';

describe('nombres en lettres', () => {
  it.each([
    [0, 'zéro'],
    [17, 'dix-sept'],
    [21, 'vingt-et-un'],
    [71, 'soixante-et-onze'],
    [80, 'quatre-vingts'],
    [81, 'quatre-vingt-un'],
    [99, 'quatre-vingt-dix-neuf'],
    [100, 'cent'],
    [200, 'deux-cents'],
    [201, 'deux-cent-un'],
    [1000, 'mille'],
    [2000, 'deux-mille'],
    [80000, 'quatre-vingt-mille'],
    [200300, 'deux-cent-mille-trois-cents'],
    [3_000_000, 'trois millions'],
  ])('%i → %s (rectifiée)', (n, s) => expect(nombreEnLettres(n)).toBe(s));

  it('orthographe traditionnelle', () => {
    expect(nombreEnLettres(21, 'traditionnelle')).toBe('vingt et un');
    expect(nombreEnLettres(245, 'traditionnelle')).toBe('deux cent quarante-cinq');
    expect(nombreEnLettres(1200, 'traditionnelle')).toBe('mille deux cents');
  });

  it('propose les deux graphies', () => {
    expect(graphiesNombre(21)).toEqual(['vingt-et-un', 'vingt et un']);
    expect(graphiesNombre(16)).toEqual(['seize']);
  });
});
