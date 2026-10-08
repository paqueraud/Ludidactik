import { describe, expect, it } from 'vitest';
import { gamesForLesson } from '@/games/registry';
import { versLecture } from '@/games/perroquet-savant/lecture';
import { mcqToOral } from './adapters';
import { content } from './index';
import { createStream } from './provider';
import { checkItem } from './items';
import type { McqItem } from './items';
import { createRng } from '@/engine/rng';

const qcm = (x: Partial<McqItem> = {}): McqItem => ({
  kind: 'mcq',
  id: 'q',
  lessonId: 'CE1.QLM.ESPACE.PAYSAGES',
  question: 'Quel fleuve passe à Paris ?',
  choices: ['la Loire', 'la Seine', 'le Rhône'],
  answerIndex: 1,
  explication: 'La Seine traverse Paris.',
  guillotine: true,
  ...x,
});

describe('adaptateur QCM → réponse orale', () => {
  it('réponse courte : réponse orale valide, avec et sans article', () => {
    const o = mcqToOral(qcm());
    expect(o).not.toBeNull();
    expect(checkItem(o!)).toEqual([]);
    expect(o!.answer).toBe('la Seine');
    expect(o!.accepted).toEqual(expect.arrayContaining(['la Seine', 'la seine', 'Seine', 'seine']));
    expect(o!.prompt).toBe('Quel fleuve passe à Paris ?');
    expect(o!.meta).toMatchObject({ depuisQcm: true, choix: ['la Loire', 'la Seine', 'le Rhône'] });
  });

  it('article élidé : « l’Afrique » accepte « Afrique »', () => {
    const o = mcqToOral(qcm({ choices: ['l’Afrique', 'l’Europe'], answerIndex: 0 }));
    expect(o!.accepted).toEqual(expect.arrayContaining(["l'Afrique", 'Afrique']));
  });

  it('un mot qui commence comme un article n’est pas coupé (« lessive », « laine »)', () => {
    expect(mcqToOral(qcm({ choices: ['lessive', 'savon'], answerIndex: 0 }))!.accepted).toEqual(['lessive']);
    expect(mcqToOral(qcm({ choices: ['Laine', 'coton'], answerIndex: 0 }))!.accepted).toEqual([
      'Laine',
      'laine',
    ]);
  });

  it('une année : écrite en chiffres et en lettres', () => {
    const o = mcqToOral(
      qcm({ lessonId: 'CM2.HI20.T1.FERRY', choices: ['1882', '1789'], answerIndex: 0, typedAnswer: '1882' }),
    );
    expect(o!.accepted).toEqual(expect.arrayContaining(['1882', 'mille-huit-cent-quatre-vingt-deux']));
  });

  it('refuse les réponses longues, les symboles, les emojis', () => {
    expect(mcqToOral(qcm({ choices: ['il fait très chaud ici', 'non'], answerIndex: 0 }))).toBeNull();
    expect(mcqToOral(qcm({ choices: ['<', '>'], answerIndex: 0 }))).toBeNull();
    expect(mcqToOral(qcm({ choices: ['🐱', '🐶'], answerIndex: 0 }))).toBeNull();
  });

  it('refuse les thèmes sensibles', () => {
    expect(mcqToOral(qcm({ guillotine: false }))).toBeNull();
    expect(mcqToOral(qcm({ meta: { sensible: true } }))).toBeNull();
  });

  it('ne s’applique ni au français, ni aux maths, ni à l’anglais', () => {
    expect(mcqToOral(qcm({ lessonId: 'CE1.FR.HOMOPHONES' }))).toBeNull();
    expect(mcqToOral(qcm({ lessonId: 'CM2.MA.PROBA' }))).toBeNull();
    expect(mcqToOral(qcm({ lessonId: 'CE1.EN.COULEURS' }))).toBeNull();
    expect(mcqToOral(qcm({ lang: 'en-GB' }))).toBeNull();
  });

  it('le Perroquet savant lit ces questions (choix affichés, pas de carte à lire)', () => {
    const l = versLecture(mcqToOral(qcm())!);
    expect(l).toMatchObject({
      motALire: null,
      reponse: 'la Seine',
      choix: ['la Loire', 'la Seine', 'le Rhône'],
    });
  });
});

describe('modalité « parler » hors français (contenu réel)', () => {
  const ctx = { parentLists: [] };
  const monde = [...content.lessons.values()].filter((l) =>
    ['questionner_le_monde', 'histoire', 'geographie', 'sciences', 'emc'].includes(l.matiere),
  );

  it('au moins une leçon de monde/EMC/histoire/sciences propose le Perroquet savant', () => {
    const avecOral = monde.filter((l) =>
      gamesForLesson(l, ctx).some((g) => g.game.id === 'perroquet-savant'),
    );
    expect(avecOral.length).toBeGreaterThan(0);
    for (const l of avecOral.slice(0, 5)) {
      const st = createStream(
        content,
        l,
        'oral_answer',
        'normal',
        createRng(3),
        ctx,
        (i) => !!versLecture(i),
      );
      expect(st).not.toBeNull();
      for (let i = 0; i < 10; i++) {
        const it = st!.next();
        expect(checkItem(it), it.id).toEqual([]);
        expect(versLecture(it)).not.toBeNull();
      }
    }
  }, 60_000);

  it('en français, le Perroquet savant ne reçoit pas de QCM transformés', () => {
    const fr = [...content.lessons.values()].filter((l) => l.matiere === 'francais');
    for (const l of fr) {
      const pg = gamesForLesson(l, ctx).find((g) => g.game.id === 'perroquet-savant');
      if (!pg) continue;
      const st = createStream(content, l, 'oral_answer', 'normal', createRng(5), ctx);
      for (let i = 0; i < 5; i++) expect(st!.next().meta?.depuisQcm).toBeUndefined();
    }
  }, 60_000);
});
