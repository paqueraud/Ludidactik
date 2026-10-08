import { describe, expect, it } from 'vitest';
import { nettoyerMot, parseWordPaste } from './wordPaste';

describe('collage d’une liste de mots', () => {
  it('un mot par ligne (retours Windows compris)', () => {
    expect(parseWordPaste('maison\r\nchocolat\n\nécole\n').mots).toEqual(['maison', 'chocolat', 'école']);
  });

  it('virgules, points-virgules et tabulations', () => {
    expect(parseWordPaste('chat, chien;lapin\tcheval ,  poule').mots).toEqual([
      'chat',
      'chien',
      'lapin',
      'cheval',
      'poule',
    ]);
  });

  it('nettoie les espaces superflus sans couper les mots composés', () => {
    expect(parseWordPaste('   pomme   de  terre  ,  arc-en-ciel ').mots).toEqual([
      'pomme de terre',
      'arc-en-ciel',
    ]);
  });

  it('retire les doublons sans tenir compte de la casse et les signale', () => {
    const r = parseWordPaste('chat\nChat\nchien\nchat');
    expect(r.mots).toEqual(['chat', 'chien']);
    expect(r.doublons).toEqual(['Chat', 'chat']);
  });

  it('ignore les mots déjà présents dans la liste', () => {
    const r = parseWordPaste('école, jardin', ['École']);
    expect(r.mots).toEqual(['jardin']);
    expect(r.doublons).toEqual(['école']);
  });

  it('conserve les majuscules des noms propres', () => {
    expect(parseWordPaste('Paris, la Loire, Marie').mots).toEqual(['Paris', 'la Loire', 'Marie']);
  });

  it('retire puces, numéros, guillemets et point final', () => {
    expect(parseWordPaste('1. maison\n2) jardin\n- école\n• « fleur »\n"arbre".').mots).toEqual([
      'maison',
      'jardin',
      'école',
      'fleur',
      'arbre',
    ]);
  });

  it('garde les apostrophes et les accents', () => {
    expect(parseWordPaste("aujourd'hui\nl’œuf\nnoël").mots).toEqual(["aujourd'hui", 'l’œuf', 'noël']);
  });

  it('signale les morceaux trop longs', () => {
    const r = parseWordPaste('chat\nIl était une fois un très long texte collé par erreur ici');
    expect(r.mots).toEqual(['chat']);
    expect(r.tropLongs).toHaveLength(1);
  });

  it('texte vide → aucun mot', () => {
    expect(parseWordPaste(' \n , ; ').mots).toEqual([]);
  });

  it('nettoyerMot', () => {
    expect(nettoyerMot('  le   chat. ')).toBe('le chat');
  });
});
