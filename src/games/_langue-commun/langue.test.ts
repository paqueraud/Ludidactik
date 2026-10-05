import { describe, expect, it } from 'vitest';
import { type Item, checkItem } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { decomposer, personneDe, versForge } from './conjugaison';
import { LANGUE_FIXTURES } from './fixtures';
import { cadre, manipuler, phraseInitiale, versLabo } from './fonctions';
import {
  alignerLecture,
  calculerMCLM,
  horaireMetronome,
  mclmMetronome,
  motAuTemps,
  rythmeCible,
} from './lecture';
import { comparerOral, motsProches, phonetiser } from './oral';
import { collecterPaires, colonnesMemory, estLaPaire, genererMancheDobble, preparerMemory } from './paires';
import { assembler, premiereErreur, versFeu, versPuzzle } from './phrases';
import { decouperMots, decouperPhrases, indexPreuve } from './texte';

const tous = Object.values(LANGUE_FIXTURES).flat() as Item[];

describe('exemples des jeux de langue', () => {
  it.each(tous.map((i) => [i.id, i] as const))('%s est valide', (_id, it) => {
    expect(checkItem(it)).toEqual([]);
  });
  it('nbMots des textes = nombre de mots découpés', () => {
    for (const it of LANGUE_FIXTURES.read_aloud ?? [])
      if (it.kind === 'read_aloud') expect(decouperMots(it.text).length).toBe(it.nbMots);
  });
});

describe('texte', () => {
  it('découpe les mots en rattachant la ponctuation isolée', () => {
    const m = decouperMots('Soudain, la ficelle casse ! Léna est triste.');
    expect(m.map((x) => x.affiche)).toEqual([
      'Soudain,',
      'la',
      'ficelle',
      'casse !',
      'Léna',
      'est',
      'triste.',
    ]);
    expect(m[0]!.pause).toBe(true);
    expect(m[3]!.finPhrase).toBe(true);
    expect(m[4]!.phrase).toBe(1);
  });
  it('découpe les phrases et retrouve la phrase-preuve (citation ou fragment)', () => {
    const p = decouperPhrases('Léna a un chat. Il dort ! Mais Malo sourit : il a vu où il est tombé.');
    expect(p).toHaveLength(3);
    expect(indexPreuve(p, 'Il dort !')).toBe(1);
    expect(indexPreuve(p, 'il a vu où il est tombé')).toBe(2);
    expect(indexPreuve(p, 'rien à voir du tout')).toBe(-1);
  });
});

describe('oral : comparaison tolérante', () => {
  it('accepte les homophones et les pseudo-mots approchés', () => {
    expect(motsProches('vert', 'verre')).toBe(true);
    expect(motsProches('choust', 'chouste')).toBe(true);
    expect(motsProches('grenouille', 'grenouilles')).toBe(true);
    expect(phonetiser('pain')).toBe(phonetiser('pin'));
    expect(phonetiser('garçon')).toBe(phonetiser('garson'));
  });
  it('refuse un mot différent', () => {
    expect(motsProches('chat', 'chien')).toBe(false);
    expect(motsProches('stag', 'table')).toBe(false);
    expect(comparerOral(['bonjour'], ['grenouille']).ok).toBe(false);
  });
  it('trouve le mot au milieu d’une transcription courte, et les nombres en chiffres', () => {
    expect(comparerOral(['euh stag'], ['stag']).ok).toBe(true);
    expect(comparerOral(['cerf volant'], ['cerf-volant']).ok).toBe(true);
    expect(comparerOral(['20'], ['vingt']).ok).toBe(true);
  });
});

describe('lecture : alignement et MCLM', () => {
  const mots = decouperMots('Léna a un cerf-volant rouge. Ce matin, le vent souffle fort.');
  it('aligne une lecture parfaite', () => {
    const a = alignerLecture(mots, 'Léna a un cerf volant rouge ce matin le vent souffle fort');
    expect(a.corrects).toBe(mots.length);
    expect(a.position).toBe(mots.length);
  });
  it('marque les mots sautés et ignore les hésitations', () => {
    const a = alignerLecture(mots, 'euh Léna un cerf-volant rouge ce matin');
    expect(a.etats[0]).toBe('lu');
    expect(a.etats[1]).toBe('saute');
    expect(a.etats[2]).toBe('lu');
    expect(a.position).toBe(7);
    expect(a.etats.slice(7).every((e) => e === 'attente')).toBe(true);
  });
  it('tolère les homophones de la reconnaissance', () => {
    const a = alignerLecture(decouperMots('Le chat est vert.'), 'le chat et verre');
    expect(a.corrects).toBe(4);
  });
  it('calcule les MCLM', () => {
    expect(calculerMCLM(70, 60_000)).toBe(70);
    expect(calculerMCLM(35, 30_000)).toBe(70);
    expect(calculerMCLM(0, 30_000)).toBe(0);
    expect(mclmMetronome(60, 5, 60_000)).toBe(55);
    expect(rythmeCible(70, 'normal')).toBe(70);
    expect(rythmeCible(70, 'facile')).toBe(35);
    expect(rythmeCible(120, 'facile')).toBe(90);
    expect(rythmeCible(120, 'plus_loin')).toBe(140);
    expect(rythmeCible(70, 'normal', { normal: 50 })).toBe(50);
  });
  it('le métronome respecte le rythme moyen et respire aux points', () => {
    const { debuts, dureeTotale } = horaireMetronome(mots, 60);
    expect(dureeTotale).toBeCloseTo(mots.length * 1000);
    const iPoint = mots.findIndex((m) => m.finPhrase);
    const pas = debuts[1]! - debuts[0]!;
    expect(debuts[iPoint + 1]! - debuts[iPoint]!).toBeCloseTo(2 * pas);
    expect(motAuTemps(debuts, dureeTotale, -1)).toBe(-1);
    expect(motAuTemps(debuts, dureeTotale, 0)).toBe(0);
    expect(motAuTemps(debuts, dureeTotale, debuts[3]! + 1)).toBe(3);
    expect(motAuTemps(debuts, dureeTotale, dureeTotale)).toBe(mots.length);
  });
});

describe('paires : Dobble et Memory', () => {
  const items = (LANGUE_FIXTURES.pairing ?? []).filter((i) => i.kind === 'pairing');
  const pool = collecterPaires(items as never);
  it('aucun texte en double dans le réservoir', () => {
    const textes = pool.flatMap((p) => [p.gauche, p.droite]);
    expect(new Set(textes).size).toBe(textes.length);
  });
  it('une seule paire liée entre les deux cartes Dobble', () => {
    const rng = createRng(7);
    for (let n = 0; n < 200; n++) {
      const k = 2 + (n % 4);
      const m = genererMancheDobble(pool, k, rng)!;
      expect(m.carteA).toHaveLength(k);
      expect(m.carteB).toHaveLength(k);
      let liens = 0;
      for (const a of m.carteA)
        for (const b of m.carteB)
          if (pool.some((p) => (p.gauche === a && p.droite === b) || (p.gauche === b && p.droite === a)))
            liens++;
      expect(liens).toBe(1);
      expect(estLaPaire(m, m.motA, m.motB)).toBe(true);
      expect(estLaPaire(m, m.motB, m.motA)).toBe(true);
    }
  });
  it('réservoir trop petit : pas de manche', () => {
    expect(genererMancheDobble(pool.slice(0, 2), 3, createRng(1))).toBeNull();
    expect(genererMancheDobble(pool.slice(0, 3), 5, createRng(1))!.carteA).toHaveLength(2);
  });
  it('Memory : 2 cartes par paire, colonnes adaptées', () => {
    const cartes = preparerMemory(pool.slice(0, 6), createRng(3));
    expect(cartes).toHaveLength(12);
    expect(new Set(cartes.map((c) => c.id)).size).toBe(12);
    expect(colonnesMemory(8, 360, 8)).toBe(4);
    expect(colonnesMemory(8, 360, 30)).toBe(3);
    expect(colonnesMemory(16, 1280, 8)).toBe(4);
    expect(colonnesMemory(10, 1280, 8)).toBe(5);
  });
});

describe('phrases : feu tricolore et puzzle', () => {
  it('lit meta.phrase ou la phrase entre guillemets', () => {
    const q = versFeu((LANGUE_FIXTURES.mcq ?? []).find((i) => i.id === 'feu1')!)!;
    expect(q.phrase).toBe('Est-ce que tu viens jouer avec nous');
    expect(q.reponse).toBe('?');
    const q2 = versFeu({
      kind: 'mcq',
      id: 'x',
      lessonId: 'L',
      question: 'Quelle ponctuation termine cette phrase : « Quelle heure est-il » ?',
      choices: ['?', '.', '!'],
      answerIndex: 0,
      explication: 'Question.',
      guillotine: true,
    })!;
    expect(q2.phrase).toBe('Quelle heure est-il');
    expect(q2.aDire).toBe('Quelle heure est-il ?');
    expect(q2.choix).toEqual(['.', '?', '!']);
  });
  it('ignore un QCM qui n’est pas de ponctuation', () => {
    expect(
      versFeu({
        kind: 'mcq',
        id: 'y',
        lessonId: 'L',
        question: 'Q ?',
        choices: ['a', 'b'],
        answerIndex: 0,
        explication: 'xxx',
        guillotine: true,
      }),
    ).toBeNull();
  });
  it('sépare la ponctuation finale des étiquettes', () => {
    const p = versPuzzle((LANGUE_FIXTURES.ordering ?? [])[0]!)!;
    expect(p.etiquettes).toEqual(['Où', 'as-tu', 'caché', 'ton', 'cahier']);
    expect(p.ponctuation).toBe('?');
    const p2 = versPuzzle((LANGUE_FIXTURES.ordering ?? [])[1]!)!;
    expect(p2.etiquettes[p2.etiquettes.length - 1]).toBe('couloir');
    expect(p2.ponctuation).toBe('.');
    expect(assembler(p2.etiquettes, '.')).toBe('Ne cours pas dans le couloir.');
    expect(assembler(['l’', 'arbre'])).toBe('l’arbre');
    expect(premiereErreur(['a', 'c', 'b'], ['a', 'b', 'c'])).toBe(1);
    expect(premiereErreur(['a', 'b'], ['a', 'b'])).toBe(-1);
  });
});

describe('Labo des fonctions : manipulations', () => {
  const fn = (id: string) => versLabo((LANGUE_FIXTURES.classification ?? []).find((i) => i.id === id)!)!;
  it('découpe la phrase en groupes', () => {
    const p = fn('fn1');
    expect(p.segments.map((s) => s.texte)).toEqual([
      'Ce matin',
      ',',
      'les enfants',
      'préparent',
      'un gâteau',
    ]);
    expect(phraseInitiale(p)).toBe('Ce matin, les enfants préparent un gâteau.');
  });
  it('supprime, déplace, encadre', () => {
    const p = fn('fn1');
    expect(manipuler(p, 0, 'supprimer')).toBe('Les enfants préparent un gâteau.');
    expect(manipuler(p, 0, 'deplacer')).toBe('Les enfants préparent un gâteau ce matin.');
    expect(manipuler(p, 1, 'encadrer')).toBe('Ce matin, ce sont les enfants qui préparent un gâteau.');
    expect(manipuler(p, 1, 'deplacer')).toBe('Ce matin, préparent un gâteau les enfants.');
    expect(manipuler(p, 0, 'encadrer')).toBe('C’est ce matin qui les enfants préparent un gâteau.');
    expect(manipuler(p, 2, 'deplacer')).toBe('Un gâteau, ce matin, les enfants préparent.');
    const p2 = fn('fn2');
    expect(manipuler(p2, 0, 'encadrer')).toBe('C’est Malo qui obéit à sa grand-mère dans le jardin.');
    expect(manipuler(p2, 2, 'supprimer')).toBe('Malo obéit à sa grand-mère.');
    expect(manipuler(p2, 1, 'remplacer')).toBe('Malo lui obéit dans le jardin.');
    expect(manipuler(fn('fn1'), 1, 'remplacer')).toBeNull();
  });
  it('ignore un item sans phrase ou avec un groupe introuvable', () => {
    expect(
      versLabo({
        kind: 'classification',
        id: 'z',
        lessonId: 'L',
        prompt: 'p',
        categories: ['a', 'b'],
        elements: [
          { label: 'x', category: 0 },
          { label: 'y', category: 1 },
        ],
        explication: 'xxx',
      }),
    ).toBeNull();
  });
});

describe('Forge : décomposition des formes', () => {
  it('lit les rouleaux et retire l’indication entre parenthèses', () => {
    const q = versForge({
      kind: 'fill_blank',
      id: 'f',
      lessonId: 'L',
      sentence: 'Elles ___ (chanter, présent) juste.',
      answer: 'chantent',
      explication: 'xxx',
      conjugaison: { sujet: 'elles', verbe: 'chanter', temps: 'présent' },
    })!;
    expect(`${q.avant}…${q.apres}`).toBe('Elles … juste.');
  });
  it('colore radical / temps / personne', () => {
    const txt = (f: string, t: string, s: string, v = '') =>
      decomposer(f, t, s, v)
        ?.map((m) => `${m.role[0]}:${m.texte}`)
        .join(' ');
    expect(txt('chantais', 'imparfait', 'tu')).toBe('r:chant t:ai p:s');
    expect(txt('chantions', 'imparfait', 'nous')).toBe('r:chant t:i p:ons');
    expect(txt('finiront', 'futur', 'ils')).toBe('r:fini t:r p:ont');
    expect(txt('parleriez', 'conditionnel présent', 'vous')).toBe('r:parle t:ri p:ez');
    expect(txt('chantent', 'présent', 'elles')).toBe('r:chant p:ent');
    expect(txt('avons eu', 'passé composé', 'nous')).toBe('a:avons r:  p:eu');
    expect(txt('sont', 'présent', 'ils', 'être')).toBeUndefined();
    expect(txt('parlait', 'imparfait', 'Le chat')).toBe('r:parl t:ai p:t');
    expect(personneDe('j’')).toBe('1s');
    expect(txt('chantent', 'présent', 'Les enfants')).toBe('r:chant p:ent');
    expect(txt('font', 'présent', 'ils', 'faire')).toBeUndefined();
    expect(cadre('il')).toEqual({ intro: 'C’est', g2: 'lui' });
    expect(cadre('ils').intro).toBe('Ce sont');
  });
});
