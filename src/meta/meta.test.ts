import { describe, expect, it } from 'vitest';
import type { AttemptRow, RecordRow } from '@/services/storage/db';
import { BADGES, type StatsBadges, badgesObtenus } from './badges';
import { addDays, debutSemaine, estWeekEnd, lundiDe } from './dates';
import { type JeuCandidat, type LeconCandidate, contenuCoffre, famillesDuJeu, tirerDefis } from './defis';
import { calculerFlamme } from './flamme';
import { etatIle } from './ile';
import { classementHebdo, contreSoiMeme, tableauxDisponibles, top10, xpSemaine } from './scores';

/* ------------------------------------------------------------------ */
/* Défis du jour                                                       */
/* ------------------------------------------------------------------ */

const ECRIT = { id: 'grand-prix', modalites: ['ecrire', 'regarder'] as const };
const ORAL = { id: 'ascension', modalites: ['ecouter', 'ecrire'] as const };
const VISUEL = { id: 'tables-ninja', modalites: ['regarder', 'manipuler'] as const };
const MICRO = { id: 'robot-calculateur', modalites: ['ecouter', 'parler'] as const, needsMic: true };
const DUEL = { id: 'dictee-duel', modalites: ['ecouter', 'ecrire'] as const };

const lecon = (id: string, jeux: JeuCandidat[] = [ECRIT, ORAL, VISUEL]): LeconCandidate => ({
  id,
  niveau: 'normal',
  jeux,
});

const entree = (over: Partial<Parameters<typeof tirerDefis>[0]> = {}) => ({
  profileId: 'p1',
  day: '2026-10-08',
  enCours: [lecon('EC1'), lecon('EC2')],
  aRevoir: [lecon('RV1'), lecon('RV2'), lecon('RV3')],
  anciennes: [lecon('AN1'), lecon('AN2')],
  periode: [lecon('PE1'), lecon('PE2'), lecon('PE3')],
  micro: false,
  ...over,
});

describe('défis du jour', () => {
  it('sont déterministes pour un même profil et un même jour', () => {
    expect(tirerDefis(entree())).toEqual(tirerDefis(entree()));
  });

  it('changent d’un jour à l’autre ou d’un profil à l’autre', () => {
    const jours = Array.from({ length: 10 }, (_, i) =>
      JSON.stringify(tirerDefis(entree({ day: addDays('2026-10-01', i) }))),
    );
    expect(new Set(jours).size).toBeGreaterThan(1);
    const profils = Array.from({ length: 10 }, (_, i) =>
      JSON.stringify(tirerDefis(entree({ profileId: `p${i}` }))),
    );
    expect(new Set(profils).size).toBeGreaterThan(1);
  });

  it('donnent la priorité aux leçons en cours, aux items à revoir puis à une révision ancienne', () => {
    const d = tirerDefis(entree());
    expect(d).toHaveLength(3);
    expect(d.map((x) => x.motif)).toEqual(['en_cours', 'revoir', 'ancienne']);
    expect(['EC1', 'EC2']).toContain(d[0]!.lessonId);
    expect(['RV1', 'RV2']).toContain(d[1]!.lessonId);
    expect(['AN1', 'AN2']).toContain(d[2]!.lessonId);
  });

  it('varient les modalités : un écrit, un oral, un visuel', () => {
    for (let i = 0; i < 20; i++) {
      const d = tirerDefis(entree({ profileId: `p${i}` }));
      expect(new Set(d.map((x) => x.famille))).toEqual(new Set(['ecrit', 'oral', 'visuel']));
      for (const x of d) {
        const jeu = [ECRIT, ORAL, VISUEL].find((j) => j.id === x.gameId)!;
        expect(famillesDuJeu([...jeu.modalites])).toContain(x.famille);
      }
      expect(new Set(d.map((x) => x.gameId)).size).toBe(3);
    }
  });

  it('se replient sur la période quand rien n’est en cours ni à revoir', () => {
    const d = tirerDefis(entree({ enCours: [], aRevoir: [], anciennes: [] }));
    expect(d).toHaveLength(3);
    expect(new Set(d.map((x) => x.lessonId)).size).toBe(3);
    for (const x of d) expect(x.lessonId).toMatch(/^PE/);
  });

  it('n’utilisent jamais le micro sans l’accord du parent, ni un jeu à deux joueurs', () => {
    const seul = [lecon('X', [MICRO, DUEL, ECRIT])];
    for (let i = 0; i < 10; i++) {
      const d = tirerDefis(
        entree({ profileId: `q${i}`, enCours: seul, aRevoir: [], anciennes: [], periode: [] }),
      );
      expect(d.map((x) => x.gameId)).toEqual(['grand-prix']);
    }
    const avecMicro = tirerDefis(
      entree({ enCours: [lecon('Y', [MICRO])], aRevoir: [], anciennes: [], periode: [], micro: true }),
    );
    expect(avecMicro[0]!.gameId).toBe('robot-calculateur');
  });

  it('le coffre donne un trésor pas encore possédé, sinon des Ludis', () => {
    const c = contenuCoffre('p', '2026-10-08', ['a', 'b', 'c'], new Set(['a', 'b']));
    expect(c.objet).toBe('c');
    expect(contenuCoffre('p', '2026-10-08', ['a'], new Set(['a'])).objet).toBeNull();
    expect(contenuCoffre('p', '2026-10-08', ['a'], new Set(['a'])).ludis).toBeGreaterThan(c.ludis);
  });
});

/* ------------------------------------------------------------------ */
/* Flamme                                                              */
/* ------------------------------------------------------------------ */

describe('flamme de série', () => {
  it('compte les jours consécutifs, aujourd’hui compris', () => {
    const f = calculerFlamme(['2026-10-06', '2026-10-07', '2026-10-08'], '2026-10-08');
    expect(f).toMatchObject({ jours: 3, aujourdhui: true, gels: [] });
  });

  it('ne s’éteint pas parce qu’on n’a pas encore joué aujourd’hui', () => {
    expect(calculerFlamme(['2026-10-06', '2026-10-07'], '2026-10-08').jours).toBe(2);
  });

  it('gèle automatiquement jusqu’à 2 jours par semaine', () => {
    // jeudi 8 octobre 2026 ; lundi 5 et mercredi 7 joués, mardi 6 manqué → gelé
    const f = calculerFlamme(['2026-10-05', '2026-10-07', '2026-10-08'], '2026-10-08');
    expect(f.jours).toBe(3);
    expect(f.gels).toEqual(['2026-10-06']);
    expect(f.gelsRestants).toBe(1);
    // un week-end sans jouer ne casse pas la série
    const w = calculerFlamme(['2026-10-02', '2026-10-05'], '2026-10-05');
    expect(w.jours).toBe(2);
    expect(w.gels).toEqual(['2026-10-04', '2026-10-03']);
  });

  it('s’éteint au 3e jour manqué de la même semaine', () => {
    const f = calculerFlamme(['2026-10-05', '2026-10-09'], '2026-10-09');
    expect(f.jours).toBe(1);
    expect(f.gels).toEqual([]);
  });

  it('vaut 0 sans aucun défi', () => {
    expect(calculerFlamme([], '2026-10-08')).toMatchObject({ jours: 0, aujourdhui: false });
  });
});

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

const statsVides = (): StatsBadges => ({
  partiesParJeu: {},
  victoiresParJeu: {},
  motsDicteeJustes: 0,
  partiesOrales: 0,
  jeuxDifferents: 0,
  troisEtoiles: 0,
  tablesTroisEtoiles: 0,
  tablesTotal: 2,
  matieres: 0,
  defisReussis: 0,
  coffres: 0,
  bossGagnes: 0,
  flamme: 0,
  gemmes: 0,
  objets: 0,
});

describe('badges', () => {
  it('aucun badge au départ', () => {
    expect(badgesObtenus(statsVides())).toEqual([]);
  });

  it('attribue chaque badge à son seuil', () => {
    const s = statsVides();
    s.partiesParJeu['grand-prix'] = 1;
    s.victoiresParJeu.guillotine = 9;
    s.motsDicteeJustes = 100;
    s.tablesTroisEtoiles = 1;
    expect(badgesObtenus(s)).toEqual(['premier_galop', 'oreille_or']);
    s.victoiresParJeu.guillotine = 10;
    s.tablesTroisEtoiles = 2;
    expect(badgesObtenus(s)).toContain('tete_epaules');
    expect(badgesObtenus(s)).toContain('tables_fer');
  });

  it('aucun badge ne dépend de l’heure (pas d’incitation à jouer tard)', () => {
    for (const b of BADGES) expect(`${b.titre} ${b.description}`).not.toMatch(/tard|nuit|minuit|tôt|matin/i);
  });
});

/* ------------------------------------------------------------------ */
/* Île                                                                 */
/* ------------------------------------------------------------------ */

describe('Mon île', () => {
  const lecons = [
    ...Array.from({ length: 8 }, (_, i) => ({ id: `M${i}`, matiere: 'maths' as const })),
    { id: 'F0', matiere: 'francais' as const },
  ];
  it('une gemme par leçon maîtrisée construit puis agrandit les bâtiments', () => {
    const gemmes = new Set(['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']);
    const ile = etatIle(lecons, gemmes, new Map());
    const nombres = ile.find((q) => q.def.id === 'nombres')!;
    expect(nombres.gemmes).toBe(7);
    expect(nombres.batiments.map((b) => b.niveau)).toEqual([2, 1, 1, 1, 1, 1]);
    expect(ile.find((q) => q.def.id === 'mots')!.gemmes).toBe(0);
    // pas de quartier sans leçon dans la classe
    expect(ile.map((q) => q.def.id)).toEqual(['nombres', 'mots']);
  });

  it('une leçon commencée montre un chantier sur le prochain terrain', () => {
    const ile = etatIle(lecons, new Set(['M0']), new Map([['M1', 0.5]]));
    const b = ile[0]!.batiments;
    expect(b[0]).toMatchObject({ niveau: 1, chantier: false });
    expect(b[1]).toMatchObject({ niveau: 0, chantier: true });
  });
});

/* ------------------------------------------------------------------ */
/* Scores                                                              */
/* ------------------------------------------------------------------ */

const partie = (profileId: string, date: Date, xp: number): AttemptRow => ({
  profileId,
  lessonId: 'L',
  gameId: 'g',
  level: 'normal',
  date: date.getTime(),
  correct: 1,
  total: 1,
  durationMs: 1,
  xp,
});

describe('tableau des scores', () => {
  it('la semaine commence le lundi à 0 h', () => {
    expect(lundiDe('2026-10-08')).toBe('2026-10-05');
    expect(lundiDe('2026-10-11')).toBe('2026-10-05');
    expect(lundiDe('2026-10-12')).toBe('2026-10-12');
    expect(new Date(debutSemaine(new Date(2026, 9, 11, 23, 59))).toString()).toBe(
      new Date(2026, 9, 5).toString(),
    );
    expect(estWeekEnd('2026-10-10')).toBe(true);
    expect(estWeekEnd('2026-10-09')).toBe(false);
  });

  it('le classement hebdomadaire d’XP repart de zéro le lundi', () => {
    const attempts = [
      partie('a', new Date(2026, 9, 4, 18), 500), // dimanche : semaine précédente
      partie('a', new Date(2026, 9, 6, 17), 30),
      partie('b', new Date(2026, 9, 7, 17), 50),
      partie('b', new Date(2026, 9, 8, 9), 20),
    ];
    const jeudi = new Date(2026, 9, 8, 20).getTime();
    expect(xpSemaine(attempts, jeudi).get('a')).toBe(30);
    expect(classementHebdo(['a', 'b', 'c'], attempts, jeudi)).toEqual([
      { profileId: 'b', xp: 70, rang: 1 },
      { profileId: 'a', xp: 30, rang: 2 },
      { profileId: 'c', xp: 0, rang: 3 },
    ]);
    // lundi suivant : tout le monde à zéro, ex æquo
    const lundi = new Date(2026, 9, 12, 8).getTime();
    expect(classementHebdo(['a', 'b'], attempts, lundi).map((l) => [l.xp, l.rang])).toEqual([
      [0, 1],
      [0, 1],
    ]);
  });

  it('« contre soi-même » compare à la semaine précédente', () => {
    const attempts = [partie('a', new Date(2026, 9, 1, 10), 100), partie('a', new Date(2026, 9, 6, 10), 60)];
    const r = contreSoiMeme('a', attempts, new Date(2026, 9, 8, 12).getTime());
    expect(r).toEqual({ cetteSemaine: 60, semaineDerniere: 100, ligue: 'argent' });
    attempts.push(partie('a', new Date(2026, 9, 7, 10), 50));
    expect(contreSoiMeme('a', attempts, new Date(2026, 9, 8, 12).getTime()).ligue).toBe('or');
  });

  it('top 10 par jeu × niveau × leçon, du meilleur score au moins bon', () => {
    const rec = (profileId: string, score: number, date = 1, level: RecordRow['level'] = 'normal') =>
      ({
        key: `${profileId}|L|g|${level}`,
        profileId,
        lessonId: 'L',
        gameId: 'g',
        level,
        score,
        durationMs: 1,
        date,
      }) as RecordRow;
    const records = [
      ...Array.from({ length: 12 }, (_, i) => rec(`p${i}`, i * 10)),
      rec('x', 999, 5, 'facile'),
    ];
    const top = top10(records, { lessonId: 'L', gameId: 'g', level: 'normal' });
    expect(top).toHaveLength(10);
    expect(top[0]!.score).toBe(110);
    expect(top.every((r) => r.level === 'normal')).toBe(true);
    expect(tableauxDisponibles(records)[0]).toEqual({ lessonId: 'L', gameId: 'g', level: 'facile' });
  });
});
