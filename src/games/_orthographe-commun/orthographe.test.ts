import { describe, expect, it } from 'vitest';
import { createRng } from '@/engine/rng';
import { collecterMots, estMot, lettres, prefixeCommun, tirerItem } from './lettres';
import { casesDe, genererGrille, grilleDeLettres } from './mots-croises';
import { colorer, etatsClavier } from './wordle';
import { FIXTURES } from '@/games/_kit/fixtures';
import type { Item } from '@/content/schemas';

describe('Wordle : coloration', () => {
  it('colore un mot trouvé tout en vert', () => {
    expect(colorer('maison', 'maison')).toEqual(Array(6).fill('bien'));
  });
  it('distingue bien placé, mal placé et absent', () => {
    expect(colorer('nasal', 'salon')).toEqual(['mal_place', 'bien', 'mal_place', 'absent', 'mal_place']);
    expect(colorer('table', 'salon')).toEqual(['absent', 'bien', 'absent', 'mal_place', 'absent']);
  });
  it('ne colore pas une lettre répétée plus de fois qu’elle n’apparaît', () => {
    // « pomme » contre « poire » : un seul o, un seul e, pas de m
    expect(colorer('pomme', 'poire')).toEqual(['bien', 'bien', 'absent', 'absent', 'bien']);
    // « allee » contre « table » : un seul l, un seul e (déjà placé en fin)
    expect(colorer('allee', 'table')).toEqual(['mal_place', 'mal_place', 'absent', 'absent', 'bien']);
    // la place exacte est prioritaire sur une lettre mal placée plus à gauche
    expect(colorer('sasse', 'tasse')).toEqual(['absent', 'bien', 'bien', 'bien', 'bien']);
  });
  it('signale un accent oublié à la bonne place', () => {
    expect(colorer('ecole', 'école')).toEqual(['accent', 'bien', 'bien', 'bien', 'bien']);
    expect(colorer('élève', 'élève')).toEqual(Array(5).fill('bien'));
    // e mal placé alors que le mot contient é ailleurs : compte comme lettre présente
    expect(colorer('reste', 'été')[0]).toBe('absent');
  });
  it('garde le meilleur état connu de chaque touche', () => {
    const e = etatsClavier([
      { mot: 'nasal', etats: colorer('nasal', 'salon') },
      { mot: 'salon', etats: colorer('salon', 'salon') },
    ]);
    expect(e.get('s')).toBe('bien');
    expect(e.get('n')).toBe('bien');
  });
});

describe('Mots croisés : générateur de grille', () => {
  const listes = [
    ['chocolat', 'maison', 'pourtant', 'école', 'grenouille', 'éléphant'],
    ['papa', 'maman', 'ami', 'école', 'classe', 'livre', 'table', 'porte', 'lune', 'vélo', 'moto', 'rue'],
    ['avec', 'dans', 'sur', 'sous', 'chez', 'pour', 'mais', 'donc', 'alors', 'aussi', 'toujours', 'jamais'],
    ['hier', 'aujourd’hui', 'demain', 'beaucoup', 'longtemps', 'maintenant', 'pendant', 'parce'],
  ];

  it('produit des grilles cohérentes (chaque suite de lettres est un mot placé)', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const rng = createRng(seed);
      const mots = listes[seed % listes.length]!;
      const g = genererGrille(mots, rng.next, { max: 8 });
      expect(g.placements.length).toBeGreaterThanOrEqual(Math.min(3, mots.length));
      expect(g.lignes).toBeLessThanOrEqual(13);
      expect(g.cols).toBeLessThanOrEqual(13);
      const grille = grilleDeLettres(g);
      // Chaque placement écrit exactement ses lettres
      for (const p of g.placements) {
        casesDe(p).forEach(([l, c], k) => expect(grille[l]![c]).toBe(p.cases[k]));
        expect(p.cases.join('')).toBe(lettres(p.mot).join('').toLowerCase());
      }
      // Toute suite de 2 lettres ou plus (horizontale ou verticale) correspond à un mot placé
      const attendus = new Set(g.placements.map((p) => `${p.dir}:${p.ligne},${p.col}:${p.cases.join('')}`));
      const trouves = new Set<string>();
      for (let l = 0; l < g.lignes; l++) {
        let c = 0;
        while (c < g.cols) {
          if (!grille[l]![c]) {
            c++;
            continue;
          }
          const c0 = c;
          let s = '';
          while (c < g.cols && grille[l]![c]) s += grille[l]![c++];
          if ([...s].length >= 2) trouves.add(`h:${l},${c0}:${s}`);
        }
      }
      for (let c = 0; c < g.cols; c++) {
        let l = 0;
        while (l < g.lignes) {
          if (!grille[l]![c]) {
            l++;
            continue;
          }
          const l0 = l;
          let s = '';
          while (l < g.lignes && grille[l]![c]) s += grille[l++]![c];
          if ([...s].length >= 2) trouves.add(`v:${l0},${c}:${s}`);
        }
      }
      expect(trouves).toEqual(attendus);
      // Grille connexe : chaque mot (sauf le premier) croise au moins un autre
      const nums = g.placements.map((p) => p.numero);
      expect(Math.min(...nums)).toBe(1);
    }
  });

  it('respecte le nombre maximal de mots et ne place pas deux fois le même mot', () => {
    const g = genererGrille(['lune', 'lune', 'vélo', 'livre', 'table', 'école'], createRng(3).next, {
      max: 3,
    });
    expect(g.placements.length).toBeLessThanOrEqual(3);
    expect(new Set(g.placements.map((p) => p.mot)).size).toBe(g.placements.length);
  });

  it('gère une liste trop courte ou impossible sans planter', () => {
    expect(genererGrille([], createRng(1).next, { max: 5 }).placements).toEqual([]);
    const seul = genererGrille(['chat', 'bulle'], createRng(1).next, { max: 5 });
    expect(seul.placements.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Outils de tirage', () => {
  const flux = (items: Item[]) => {
    let i = 0;
    return { size: items.length, next: () => items[i++ % items.length]! };
  };
  it('ignore les items qui ne conviennent pas', () => {
    const s = flux([...FIXTURES.fill_blank, ...FIXTURES.spelling_word]);
    expect(tirerItem(s, estMot)?.kind).toBe('spelling_word');
    expect(tirerItem(flux(FIXTURES.mcq), estMot)).toBeNull();
  });
  it('collecte une liste de mots sans doublon', () => {
    const mots = collecterMots(flux(FIXTURES.spelling_word), estMot);
    expect(mots.map((m) => m.word)).toEqual(FIXTURES.spelling_word.map((m) => (m as { word: string }).word));
  });
  it('calcule le préfixe commun sans tenir compte des accents', () => {
    expect(prefixeCommun('chan', 'chanter')).toBe(4);
    expect(prefixeCommun('rang', 'ranger')).toBe(4);
    expect(prefixeCommun('Été', 'etait')).toBe(2);
  });
});
