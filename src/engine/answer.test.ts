import { describe, expect, it } from 'vitest';
import {
  acceptedSpellings,
  checkNumeric,
  checkSpelling,
  formatNumber,
  letterDiff,
  parseNumber,
} from './answer';

describe('nombres', () => {
  it('formate à la française', () => {
    expect(formatNumber(12000)).toBe('12 000');
    expect(formatNumber(1000)).toBe('1000');
    expect(formatNumber(3.45)).toBe('3,45');
    expect(formatNumber(0.1 + 0.2)).toBe('0,3');
  });
  it('lit les saisies variées', () => {
    expect(parseNumber('12 500')).toBe(12500);
    expect(parseNumber('3,5')).toBe(3.5);
    expect(parseNumber('3.5')).toBe(3.5);
    expect(parseNumber('trois')).toBeNull();
  });
  it('zéros inutiles tolérés seulement au niveau facile', () => {
    expect(checkNumeric('056', 56).correct).toBe(false);
    expect(checkNumeric('056', 56).hint).toMatch(/zéros/);
    expect(checkNumeric('056', 56, { tolerateZeros: true }).correct).toBe(true);
    expect(checkNumeric('3,50', 3.5).correct).toBe(false);
    expect(checkNumeric('3,5', 3.5).correct).toBe(true);
  });
});

describe('orthographe', () => {
  it('insensible à la casse pour un nom commun', () => {
    expect(checkSpelling('Maison', 'maison').correct).toBe(true);
  });
  it('exige la majuscule d’un nom propre', () => {
    expect(checkSpelling('paris', 'Paris').verdict).toBe('majuscule');
  });
  it('signale une erreur d’accent', () => {
    const r = checkSpelling('ecole', 'école');
    expect(r.correct).toBe(false);
    expect(r.verdict).toBe('accent');
  });
  it('accepte les rectifications de 1990', () => {
    expect(checkSpelling('connaitre', 'connaître').correct).toBe(true);
    expect(acceptedSpellings('oignon')).toContain('ognon');
    expect(checkSpelling('sur', 'sûr').correct).toBe(false);
  });
  it('accepte oe pour œ et les apostrophes typographiques', () => {
    expect(checkSpelling('coeur', 'cœur').correct).toBe(true);
    expect(checkSpelling('d’abord', "d'abord").correct).toBe(true);
  });
  it('dictée de phrase : majuscule exigée, point final facultatif', () => {
    expect(checkSpelling('Le chat dort', 'Le chat dort.', { isSentence: true }).correct).toBe(true);
    expect(checkSpelling('le chat dort.', 'Le chat dort.', { isSentence: true }).verdict).toBe('majuscule');
  });
});

describe('différence lettre à lettre', () => {
  it('repère lettre manquante, en trop et remplacée', () => {
    const ops = letterDiff('chocolat', 'chocolat');
    expect(ops.every((o) => o.type === 'ok')).toBe(true);
    expect(letterDiff('chocola', 'chocolat').at(-1)).toEqual({ type: 'missing', char: 't' });
    expect(letterDiff('chatt', 'chat').some((o) => o.type === 'extra')).toBe(true);
    expect(letterDiff('chot', 'chat').find((o) => o.type === 'sub')).toEqual({
      type: 'sub',
      char: 'a',
      given: 'o',
    });
  });
});
