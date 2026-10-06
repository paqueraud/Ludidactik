/**
 * Orthographe grammaticale : chaînes d'accords.
 * - Groupe nominal (CE1.FR.GRAM.GN, CM2.FR.ORTH.GN) : BO cycle 2 « comprendre le lien entre le
 *   déterminant, le nom et l'adjectif dans la chaîne d'accords » (pluriel -s, féminin -e) ; cycle 3
 *   « variations particulières » (-al/-aux, -eau/-eaux, féminins en -euse/-trice), adjectifs de couleur
 *   en plus loin.
 * - Sujet-verbe (CE1.FR.GRAM.SV, CM2.FR.ORTH.SV) : sujet pronom, GN, éloigné, inversé ; attribut du sujet.
 * - Participe passé (CM2.FR.ORTH.PP) : avec être (accord avec le sujet), avec avoir (pas d'accord avec le
 *   sujet ; accord avec le COD placé avant pour les verbes étudiés).
 * Items `fill_blank` du Train des accords : `choices` + `meta.groupe` (mots du groupe, « ___ » au trou)
 * + `meta.lemme` (mot de base à accorder).
 */
import type { Rng } from '@/engine/rng';
import type { GenContext, LessonContent } from '../../registry';
import type { ItemOf, Level } from '../../schemas';
import { GN_PLURIEL, GN_SINGULIER, PRENOMS, type Sujet, type VerbeLex, lex } from './lexique';
import { type Personne, type Temps, accorderParticipe, commenceParVoyelle, conjuguer, participePasse } from './moteur';
import { clamp01, distinctsPar, majuscule, make, mcq, pondere, trou, vraiFaux } from './util';

/* ------------------------------------------------------------------ */
/* Lexique du groupe nominal                                           */
/* ------------------------------------------------------------------ */

type Genre = 'm' | 'f';

interface Nom {
  sg: string;
  pl: string;
  g: Genre;
  /** Pluriel particulier (-x, -aux) ou féminin particulier : niveau « variations ». */
  special?: string;
  /** Fautes plausibles au pluriel (chevals). */
  fautes?: string[];
}

const nom = (sg: string, g: Genre, pl = `${sg}s`, special?: string, fautes?: string[]): Nom => ({ sg, pl, g, special, fautes });

const NOMS_REGULIERS: Nom[] = [
  nom('chat', 'm'),
  nom('chien', 'm'),
  nom('ballon', 'm'),
  nom('livre', 'm'),
  nom('vélo', 'm'),
  nom('crayon', 'm'),
  nom('cahier', 'm'),
  nom('sac', 'm'),
  nom('lapin', 'm'),
  nom('cartable', 'm'),
  nom('nuage', 'm'),
  nom('poisson', 'm'),
  nom('robe', 'f'),
  nom('fleur', 'f'),
  nom('maison', 'f'),
  nom('voiture', 'f'),
  nom('pomme', 'f'),
  nom('table', 'f'),
  nom('poupée', 'f'),
  nom('chaise', 'f'),
  nom('tortue', 'f'),
  nom('jupe', 'f'),
  nom('chemise', 'f'),
  nom('valise', 'f'),
];

const NOMS_X: Nom[] = [
  nom('gâteau', 'm', 'gâteaux', 'eau', ['gâteaus']),
  nom('bateau', 'm', 'bateaux', 'eau', ['bateaus']),
  nom('chapeau', 'm', 'chapeaux', 'eau', ['chapeaus']),
  nom('château', 'm', 'châteaux', 'eau', ['châteaus']),
  nom('manteau', 'm', 'manteaux', 'eau', ['manteaus']),
  nom('cadeau', 'm', 'cadeaux', 'eau', ['cadeaus']),
  nom('jeu', 'm', 'jeux', 'eu', ['jeus']),
  nom('cheveu', 'm', 'cheveux', 'eu', ['cheveus']),
  nom('bijou', 'm', 'bijoux', 'ou', ['bijous']),
  nom('caillou', 'm', 'cailloux', 'ou', ['caillous']),
  nom('genou', 'm', 'genoux', 'ou', ['genous']),
  nom('hibou', 'm', 'hiboux', 'ou', ['hibous']),
];

const NOMS_AL: Nom[] = [
  nom('cheval', 'm', 'chevaux', 'al', ['chevals']),
  nom('journal', 'm', 'journaux', 'al', ['journals']),
  nom('canal', 'm', 'canaux', 'al', ['canals']),
  nom('signal', 'm', 'signaux', 'al', ['signals']),
];

/** Noms de personnes qui varient en genre (le déterminant donne le genre). */
interface NomAnime {
  m: string;
  f: string;
  type: 'euse' | 'trice' | 'autre';
}
const NOMS_ANIMES: NomAnime[] = [
  { m: 'chanteur', f: 'chanteuse', type: 'euse' },
  { m: 'danseur', f: 'danseuse', type: 'euse' },
  { m: 'coiffeur', f: 'coiffeuse', type: 'euse' },
  { m: 'nageur', f: 'nageuse', type: 'euse' },
  { m: 'vendeur', f: 'vendeuse', type: 'euse' },
  { m: 'joueur', f: 'joueuse', type: 'euse' },
  { m: 'acteur', f: 'actrice', type: 'trice' },
  { m: 'directeur', f: 'directrice', type: 'trice' },
  { m: 'lecteur', f: 'lectrice', type: 'trice' },
  { m: 'dessinateur', f: 'dessinatrice', type: 'trice' },
  { m: 'explorateur', f: 'exploratrice', type: 'trice' },
  { m: 'boulanger', f: 'boulangère', type: 'autre' },
  { m: 'fermier', f: 'fermière', type: 'autre' },
  { m: 'champion', f: 'championne', type: 'autre' },
];

interface Adjectif {
  m: string;
  f: string;
  mp: string;
  fp: string;
  /** Placé avant le nom (petit chat). */
  avant?: boolean;
  /** Formes particulières (variations). */
  special?: boolean;
  /** Ne convient qu'à des personnes ou des animaux. */
  anime?: boolean;
  /** Noms avec lesquels l'adjectif a du sens (au singulier) ; absent = tous les noms d'objets et d'animaux. */
  noms?: string[];
}

function adj(m: string, opts: Partial<Adjectif> = {}): Adjectif {
  const f = opts.f ?? (m.endsWith('e') ? m : `${m}e`);
  const mp = opts.mp ?? (/[sx]$/.test(m) ? m : `${m}s`);
  const fp = opts.fp ?? `${f}s`;
  return { m, f, mp, fp, ...opts };
}

const OBJETS_COULEUR = ['ballon', 'vélo', 'crayon', 'cahier', 'sac', 'cartable', 'livre', 'robe', 'voiture', 'chemise', 'valise', 'jupe', 'chaise', 'table'];
const SOMBRES = ['chat', 'chien', 'lapin', 'cartable', 'sac', 'crayon', 'ballon', 'vélo', 'robe', 'voiture', 'chemise', 'valise', 'jupe', 'chaise', 'nuage', 'poisson', 'chapeau', 'manteau'];

const ADJ_REGULIERS: Adjectif[] = [
  adj('petit', { avant: true }),
  adj('grand', { avant: true }),
  adj('joli', { avant: true }),
  adj('noir', { noms: SOMBRES }),
  adj('vert', { noms: [...OBJETS_COULEUR, 'pomme'] }),
  adj('bleu', { noms: [...OBJETS_COULEUR, 'fleur', 'poisson'] }),
  adj('gris', { noms: ['chat', 'lapin', 'nuage', 'sac', 'cartable', 'voiture', 'chemise', 'valise', 'jupe', 'manteau', 'poisson', 'tortue'] }),
  adj('rond', { noms: ['ballon', 'table', 'pomme', 'chapeau'] }),
  adj('lourd', { noms: ['sac', 'cartable', 'valise', 'livre', 'table', 'chaise'] }),
  adj('rouge', { noms: [...OBJETS_COULEUR, 'pomme', 'fleur', 'poisson'] }),
  adj('jaune', { noms: [...OBJETS_COULEUR, 'fleur', 'pomme'] }),
  adj('rapide', { noms: ['chat', 'chien', 'lapin', 'poisson', 'vélo', 'voiture', 'bateau'] }),
  adj('content', { anime: true }),
];

const ADJ_SPECIAUX: Adjectif[] = [
  adj('blanc', { f: 'blanche', special: true, noms: [...SOMBRES, 'maison', 'fleur', 'table'] }),
  adj('gentil', { f: 'gentille', special: true, anime: true }),
  adj('gros', { f: 'grosse', avant: true, special: true }),
  adj('beau', { f: 'belle', mp: 'beaux', avant: true, special: true }),
  adj('nouveau', { f: 'nouvelle', mp: 'nouveaux', avant: true, special: true }),
  adj('vieux', { f: 'vieille', avant: true, special: true }),
  adj('joyeux', { f: 'joyeuse', special: true, anime: true }),
  adj('heureux', { f: 'heureuse', special: true, anime: true }),
  adj('sportif', { f: 'sportive', special: true, anime: true }),
  adj('neuf', { f: 'neuve', special: true, noms: ['vélo', 'cartable', 'robe', 'voiture', 'sac', 'livre', 'cahier', 'jupe', 'chemise', 'valise', 'manteau', 'chapeau'] }),
  adj('long', { f: 'longue', special: true, noms: ['robe', 'jupe', 'crayon', 'manteau'] }),
  adj('doux', { f: 'douce', special: true, noms: ['chat', 'lapin', 'poupée'] }),
];

/** CM2 : adjectifs en -al (-aux au masculin pluriel). */
const ADJ_AL: Adjectif[] = [
  adj('génial', { mp: 'géniaux', special: true, noms: ['dessin', 'film', 'livre', 'idée'] }),
  adj('original', { mp: 'originaux', special: true, noms: ['dessin', 'costume', 'robe', 'idée'] }),
  adj('royal', { mp: 'royaux', special: true, noms: ['carrosse', 'jardin', 'château'] }),
  adj('amical', { mp: 'amicaux', special: true, noms: ['match', 'conseil', 'geste'] }),
];

/** Noms supplémentaires (adjectifs en -al). */
const NOMS_DIVERS: Nom[] = [
  nom('dessin', 'm'),
  nom('film', 'm'),
  nom('idée', 'f'),
  nom('costume', 'm'),
  nom('carrosse', 'm'),
  nom('jardin', 'm'),
  nom('match', 'm', 'matchs'),
  nom('conseil', 'm'),
  nom('geste', 'm'),
];

const NOMS_ANIMES_ADJ: Nom[] = [nom('garçon', 'm'), nom('fille', 'f'), nom('chien', 'm'), nom('tortue', 'f'), nom('lapin', 'm')];

/** Noms compatibles avec un adjectif. */
function nomsPour(a: Adjectif): Nom[] {
  if (a.anime) return NOMS_ANIMES_ADJ;
  if (!a.noms) return [...NOMS_REGULIERS, ...NOMS_X.filter((n) => n.special === 'eau')];
  const tous = [...NOMS_REGULIERS, ...NOMS_X, ...NOMS_DIVERS];
  return a.noms.map((sg) => tous.find((n) => n.sg === sg)!).filter(Boolean);
}

/** Adjectifs de couleur : accordés (rose, violet) ou invariables (orange, marron, couleurs composées). */
const COULEURS: { forme: (g: Genre, pl: boolean) => string; base: string; invariable: boolean; pourquoi: string }[] = [
  { base: 'orange', invariable: true, forme: () => 'orange', pourquoi: 'orange est aussi le nom d’un fruit : il reste invariable' },
  { base: 'marron', invariable: true, forme: () => 'marron', pourquoi: 'marron est aussi le nom d’un fruit : il reste invariable' },
  { base: 'bleu foncé', invariable: true, forme: () => 'bleu foncé', pourquoi: 'une couleur composée de deux mots reste invariable' },
  { base: 'vert clair', invariable: true, forme: () => 'vert clair', pourquoi: 'une couleur composée de deux mots reste invariable' },
  { base: 'rose', invariable: false, forme: (_g, pl) => (pl ? 'roses' : 'rose'), pourquoi: 'rose est une exception : il s’accorde comme un adjectif' },
  { base: 'violet', invariable: false, forme: (g, pl) => `${g === 'f' ? 'violette' : 'violet'}${pl ? 's' : ''}`, pourquoi: 'violet est un vrai adjectif de couleur : il s’accorde' },
  { base: 'vert', invariable: false, forme: (g, pl) => `vert${g === 'f' ? 'e' : ''}${pl ? 's' : ''}`, pourquoi: 'vert est un vrai adjectif de couleur : il s’accorde' },
];

const formeAdj = (a: Adjectif, g: Genre, pl: boolean) => (g === 'm' ? (pl ? a.mp : a.m) : pl ? a.fp : a.f);
const formesAdj = (a: Adjectif) => [...new Set([a.m, a.f, a.mp, a.fp])];

const DETS: Record<Genre, { sg: string[]; pl: string[] }> = {
  m: { sg: ['le', 'un', 'mon', 'ce'], pl: ['les', 'des', 'mes', 'ces'] },
  f: { sg: ['la', 'une', 'ma', 'cette'], pl: ['les', 'des', 'mes', 'ces'] },
};

const CADRES_GN = [
  (gn: string) => `Je vois ${gn}.`,
  (gn: string) => `Regarde ${gn} !`,
  (gn: string) => `Dans l’histoire, il y a ${gn}.`,
  (gn: string) => `Nina dessine ${gn}.`,
  (gn: string) => `Sur l’image, on voit ${gn}.`,
];

const GENRE_NOMBRE = (g: Genre, pl: boolean) => `${g === 'm' ? 'masculin' : 'féminin'} ${pl ? 'pluriel' : 'singulier'}`;

interface GN {
  det: string;
  nom: string;
  adj?: string;
  avant?: boolean;
  g: Genre;
  pl: boolean;
}

const motsGN = (x: GN): string[] =>
  x.adj ? (x.avant ? [x.det, x.adj, x.nom] : [x.det, x.nom, x.adj]) : [x.det, x.nom];

/** Choisit un déterminant compatible (pas d'élision : on évite « l' », « cet »). */
function tirerDet(rng: Rng, g: Genre, pl: boolean, motSuivant: string, antepose: boolean): string | null {
  const dets = pl ? DETS[g].pl : DETS[g].sg;
  let ok = dets;
  if (!pl && commenceParVoyelle(motSuivant)) ok = g === 'm' ? ['un'] : ['une'];
  // devant un adjectif placé avant le nom, au pluriel, on évite « des » (de jolies fleurs)
  if (pl && antepose) ok = ok.filter((d) => d !== 'des');
  return ok.length ? rng.pick(ok) : null;
}

/* ------------------------------------------------------------------ */
/* Items GN                                                            */
/* ------------------------------------------------------------------ */

type ModeGN = 'nom' | 'adj' | 'x' | 'special' | 'anime' | 'al' | 'cdn' | 'couleur';

function itemGN(ctx: GenContext, rng: Rng, mode: ModeGN, difficulte: number): ItemOf<'fill_blank'> {
  const pl = rng.chance(0.6);
  const cadre = rng.pick(CADRES_GN);
  if (mode === 'nom' || mode === 'x' || mode === 'al') {
    const n = rng.pick(mode === 'nom' ? NOMS_REGULIERS : mode === 'x' ? NOMS_X : NOMS_AL);
    const p = mode === 'nom' ? pl : rng.chance(0.75);
    const forme = p ? n.pl : n.sg;
    const det = tirerDet(rng, n.g, p, forme, false)!;
    const regle =
      n.special === 'eau'
        ? 'les noms en -eau prennent un x au pluriel'
        : n.special === 'eu'
          ? 'les noms en -eu prennent un x au pluriel'
          : n.special === 'ou'
            ? `quelques noms en -ou (bijou, caillou, chou, genou, hibou, joujou, pou) prennent un x au pluriel`
            : n.special === 'al'
              ? 'les noms en -al font leur pluriel en -aux'
              : 'au pluriel, le nom prend un s';
    return trou(ctx, rng, `gn-${mode}`, {
      sentence: cadre(`${det} ___`),
      answer: forme,
      wrong: [n.sg, n.pl, ...(n.fautes ?? [])],
      nbChoix: 3,
      explication: p
        ? `Le déterminant « ${det} » montre que le nom est au pluriel : ${regle} → ${det} ${forme}.`
        : `Le déterminant « ${det} » montre que le nom est au singulier : pas de s → ${det} ${forme}.`,
      difficulty: difficulte,
      meta: { groupe: [det, '___'], lemme: n.sg },
    });
  }
  if (mode === 'anime') {
    // au singulier, le déterminant montre le genre (une actrice, un acteur)
    const a = rng.pick(NOMS_ANIMES);
    const g: Genre = rng.chance(0.6) ? 'f' : 'm';
    const forme = g === 'f' ? a.f : a.m;
    const det = g === 'f' ? rng.pick(['la', 'une', 'cette']) : rng.pick(['le', 'un', 'ce']);
    const regle =
      a.type === 'trice'
        ? 'beaucoup de noms en -teur font leur féminin en -trice'
        : a.type === 'euse'
          ? 'beaucoup de noms en -eur font leur féminin en -euse'
          : 'le nom prend la marque du féminin';
    return trou(ctx, rng, 'gn-anime', {
      sentence: cadre(`${det} ___`),
      answer: forme,
      wrong: [
        a.m,
        a.f,
        ...(a.type === 'trice' ? [a.m.replace(/eur$/, 'euse')] : []),
      ],
      nbChoix: 3,
      explication:
        g === 'f'
          ? `« ${det} » est féminin : ${regle} → ${det} ${forme}.`
          : `« ${det} » est masculin : on garde « ${a.m} » → ${det} ${forme}.`,
      difficulty: difficulte,
      meta: { groupe: [det, '___'], lemme: a.m },
    });
  }
  if (mode === 'couleur') {
    const n = rng.pick([...NOMS_REGULIERS, ...NOMS_X].filter((x) => [...OBJETS_COULEUR, 'manteau', 'chapeau'].includes(x.sg)));
    const c = rng.pick(COULEURS);
    const forme = c.forme(n.g, true);
    const det = rng.pick(['les', 'des', 'mes', 'ces']);
    const wrong = [c.base, `${c.base}s`, c.forme(n.g, false), c.forme(n.g === 'm' ? 'f' : 'm', true), ...(c.invariable && !c.base.includes(' ') ? [`${c.base}s`] : []), ...(c.base.includes(' ') ? [c.base.replace(' ', 's ') + 's', c.base.split(' ')[0] + 's ' + c.base.split(' ')[1]] : [])];
    return trou(ctx, rng, 'gn-couleur', {
      sentence: cadre(`${det} ${n.pl} ___`),
      answer: forme,
      wrong,
      nbChoix: 3,
      explication: `${majuscule(c.pourquoi)} → ${det} ${n.pl} ${forme}.`,
      difficulty: difficulte,
      meta: { groupe: [det, n.pl, '___'], lemme: c.base },
    });
  }
  if (mode === 'cdn') {
    // « Les feuilles du chêne sont vertes » : l'accord se fait avec le nom noyau, pas avec le complément du nom
    const noyaux: { gn: string; g: Genre; pl: boolean; cdn: string; adjs: string[] }[] = [
      { gn: 'les feuilles', g: 'f', pl: true, cdn: 'du chêne', adjs: ['vert', 'jaune', 'rouge'] },
      { gn: 'les fenêtres', g: 'f', pl: true, cdn: 'du château', adjs: ['grand', 'rond', 'bleu'] },
      { gn: 'le toit', g: 'm', pl: false, cdn: 'des maisons', adjs: ['rouge', 'gris', 'noir'] },
      { gn: 'la porte', g: 'f', pl: false, cdn: 'des garages', adjs: ['lourd', 'vert', 'blanc'] },
      { gn: 'les roues', g: 'f', pl: true, cdn: 'du vélo', adjs: ['noir', 'rond', 'neuf'] },
      { gn: 'le jardin', g: 'm', pl: false, cdn: 'des voisins', adjs: ['grand', 'joli', 'vert'] },
      { gn: 'les murs', g: 'm', pl: true, cdn: 'de la cabane', adjs: ['blanc', 'gris', 'bleu'] },
      { gn: 'la robe', g: 'f', pl: false, cdn: 'des princesses', adjs: ['bleu', 'rouge', 'long'] },
    ];
    const x = rng.pick(noyaux);
    const a = rng.pick([...ADJ_REGULIERS, ...ADJ_SPECIAUX].filter((y) => x.adjs.includes(y.m)));
    const forme = formeAdj(a, x.g, x.pl);
    const etre = x.pl ? 'sont' : 'est';
    const [det, n] = x.gn.split(' ') as [string, string];
    const D = majuscule(det);
    return trou(ctx, rng, 'gn-cdn', {
      sentence: `${D} ${n} ${x.cdn} ${etre} ___.`,
      answer: forme,
      wrong: formesAdj(a),
      nbChoix: 4,
      explication: `L’adjectif s’accorde avec le nom principal du groupe, « ${n} » (${GENRE_NOMBRE(x.g, x.pl)}), et non avec « ${x.cdn} » → ${D} ${n} ${x.cdn} ${etre} ${forme}.`,
      difficulty: difficulte,
      meta: { groupe: [D, n, ...x.cdn.split(' '), etre, '___'], lemme: a.m },
    });
  }
  // adjectif : régulier, particulier (-al, blanc/blanche…)
  const pool = mode === 'adj' ? ADJ_REGULIERS : mode === 'special' ? ADJ_SPECIAUX : ADJ_AL;
  const a = rng.pick(pool);
  const n = rng.pick(nomsPour(a));
  const p = pl;
  const forme = formeAdj(a, n.g, p);
  const nomForme = p ? n.pl : n.sg;
  const det = tirerDet(rng, n.g, p, a.avant ? forme : nomForme, !!a.avant);
  if (!det || (!p && a.avant && commenceParVoyelle(forme)) || (!p && commenceParVoyelle(nomForme) && !a.avant)) return itemGN(ctx, rng, mode, difficulte);
  const gn: GN = { det, nom: nomForme, adj: '___', avant: a.avant, g: n.g, pl: p };
  const mots = motsGN(gn);
  const marques =
    n.g === 'f' && p
      ? 'on ajoute -e et -s'
      : n.g === 'f'
        ? 'on ajoute -e'
        : p
          ? 'on ajoute -s'
          : 'pas de marque';
  const regle = a.special
    ? `cet adjectif a une forme particulière au ${GENRE_NOMBRE(n.g, p)} (${formesAdj(a).join(', ')})`
    : marques;
  return trou(ctx, rng, `gn-adj-${mode}`, {
    sentence: cadre(mots.join(' ')),
    answer: forme,
    wrong: formesAdj(a),
    nbChoix: 4,
    explication: `Le nom « ${nomForme} » est ${GENRE_NOMBRE(n.g, p)} : l’adjectif s’accorde avec lui, ${regle} → ${mots.join(' ').replace('___', forme)}.`,
    difficulty: difficulte,
    meta: { groupe: mots, lemme: a.m },
  });
}

const MODES_GN: Record<string, Record<Level, readonly (readonly [number, ModeGN])[]>> = {
  CE1: {
    facile: [[1, 'nom']],
    normal: [
      [0.3, 'nom'],
      [0.7, 'adj'],
    ],
    plus_loin: [
      [0.2, 'adj'],
      [0.3, 'x'],
      [0.15, 'al'],
      [0.35, 'special'],
    ],
  },
  CM2: {
    facile: [
      [0.3, 'nom'],
      [0.7, 'adj'],
    ],
    normal: [
      [0.15, 'adj'],
      [0.2, 'x'],
      [0.15, 'al'],
      [0.2, 'special'],
      [0.15, 'anime'],
      [0.15, 'cdn'],
    ],
    plus_loin: [
      [0.5, 'couleur'],
      [0.15, 'cdn'],
      [0.15, 'special'],
      [0.2, 'anime'],
    ],
  },
};

const DIFF_GN: Record<Level, number> = { facile: 0.2, normal: 0.5, plus_loin: 0.75 };

function gnTrou(classe: 'CE1' | 'CM2') {
  return (level: Level, rng: Rng, ctx: GenContext) => {
    const mode = pondere(rng, MODES_GN[classe]![level]);
    return itemGN(ctx, rng, mode, DIFF_GN[level]);
  };
}

/** QCM : quel groupe nominal est bien accordé ? */
function gnQcm(classe: 'CE1' | 'CM2') {
  return (level: Level, rng: Rng, ctx: GenContext): ItemOf<'mcq'> => {
    for (let i = 0; i < 30; i++) {
      const it = gnTrou(classe)(level, rng, ctx);
      const groupe = it.meta!.groupe as string[];
      const juste = groupe.join(' ').replace('___', it.answer);
      const faux = (it.choices ?? []).filter((c) => c !== it.answer).map((c) => groupe.join(' ').replace('___', c));
      if (faux.length < 1) continue;
      return mcq(ctx, rng, 'gn', {
        question: 'Quel groupe nominal est bien accordé ?',
        good: juste,
        wrong: faux,
        explication: it.explication,
        difficulty: it.difficulty ?? 0.5,
      });
    }
    throw new Error('QCM GN impossible');
  };
}

function gnVraiFaux(classe: 'CE1' | 'CM2') {
  return (level: Level, rng: Rng, ctx: GenContext): ItemOf<'true_false'> => {
    for (let i = 0; i < 30; i++) {
      const it = gnTrou(classe)(level, rng, ctx);
      const groupe = it.meta!.groupe as string[];
      const vrai = rng.chance(0.5);
      const faux = (it.choices ?? []).filter((c) => c !== it.answer && !(it.accepted ?? []).includes(c));
      if (!vrai && !faux.length) continue;
      const montre = vrai ? it.answer : rng.pick(faux);
      return vraiFaux(ctx, 'gn', {
        statement: `Ce groupe nominal est bien accordé : « ${groupe.join(' ').replace('___', montre)} »`,
        answer: vrai,
        explication: it.explication,
        difficulty: it.difficulty ?? 0.5,
      });
    }
    throw new Error('Vrai/faux GN impossible');
  };
}

/** Classement singulier / pluriel (ou masculin / féminin) de groupes nominaux. */
function gnClassement(classe: 'CE1' | 'CM2') {
  return (level: Level, rng: Rng, ctx: GenContext): ItemOf<'classification'> => {
    const parGenre = level !== 'facile' && rng.chance(0.5);
    const elements: { label: string; category: number }[] = [];
    const vus = new Set<string>();
    for (let i = 0; i < 200 && elements.length < 6; i++) {
      const it = gnTrou(classe)(level === 'plus_loin' && classe === 'CM2' ? 'normal' : level, rng, ctx);
      const groupe = it.meta!.groupe as string[];
      const label = groupe.join(' ').replace('___', it.answer);
      const det = groupe[0]!;
      if (/^\p{Lu}/u.test(label)) continue; // phrase avec complément du nom : pas un simple groupe
      const pl = ['les', 'des', 'mes', 'ces'].includes(det);
      if (parGenre && pl) continue;
      const fem = ['la', 'une', 'ma', 'cette'].includes(det);
      const cat = parGenre ? (fem ? 1 : 0) : pl ? 1 : 0;
      if (vus.has(label) || label.length > 32 || elements.filter((e) => e.category === cat).length >= 3) continue;
      vus.add(label);
      elements.push({ label, category: cat });
    }
    return make(ctx, 'classification', parGenre ? 'genre' : 'nombre', {
      prompt: parGenre ? 'Range chaque groupe nominal : masculin ou féminin ?' : 'Range chaque groupe nominal : singulier ou pluriel ?',
      categories: parGenre ? ['masculin', 'féminin'] : ['singulier', 'pluriel'],
      elements: rng.shuffle(elements),
      explication: parGenre
        ? 'Le déterminant aide à trouver le genre : le, un, mon, ce → masculin ; la, une, ma, cette → féminin.'
        : 'Le déterminant aide à trouver le nombre : les, des, mes, ces → pluriel.',
      difficulty: level === 'facile' ? 0.25 : 0.45,
    });
  };
}

/* ------------------------------------------------------------------ */
/* Accord sujet-verbe                                                  */
/* ------------------------------------------------------------------ */

const VERBES_SV = ['chanter', 'jouer', 'danser', 'parler', 'regarder', 'dessiner', 'marcher', 'travailler', 'chercher', 'préparer', 'ramasser', 'raconter', 'arroser', 'grimper'].map(lex);
const VERBES_SV_CM2 = [...VERBES_SV, ...['finir', 'choisir', 'réfléchir', 'faire', 'prendre', 'dire', 'vouloir', 'venir'].map(lex)];

/** Sujets éloignés du verbe : nom noyau + complément (« Les enfants de la classe »). */
const SUJETS_ELOIGNES: Sujet[] = [
  { texte: 'les élèves de la classe', p: 5, fem: false, pronom: false },
  { texte: 'la maîtresse des enfants', p: 2, fem: true, pronom: false },
  { texte: 'le frère de mes amis', p: 2, fem: false, pronom: false },
  { texte: 'les amis de mon frère', p: 5, fem: false, pronom: false },
  { texte: 'la voisine de mes cousins', p: 2, fem: true, pronom: false },
  { texte: 'les enfants du quartier', p: 5, fem: false, pronom: false },
  { texte: 'le directeur des écoles', p: 2, fem: false, pronom: false },
  { texte: 'les filles de la chorale', p: 5, fem: true, pronom: false },
  { texte: 'le capitaine des joueuses', p: 2, fem: false, pronom: false },
];

const TEMPS_SV: Record<string, Record<Level, Temps[]>> = {
  CE1: { facile: ['present'], normal: ['present', 'present', 'imparfait', 'futur'], plus_loin: ['present', 'imparfait', 'futur'] },
  CM2: { facile: ['present', 'imparfait', 'futur'], normal: ['present', 'imparfait', 'futur', 'passe_simple'], plus_loin: ['present', 'imparfait', 'futur', 'passe_simple'] },
};

type ModeSV = 'pronom' | 'gn' | 'eloigne' | 'inverse' | 'pronomCod' | 'attribut' | 'multiple';

const MODES_SV: Record<string, Record<Level, readonly (readonly [number, ModeSV])[]>> = {
  CE1: {
    facile: [[1, 'pronom']],
    normal: [
      [0.3, 'pronom'],
      [0.7, 'gn'],
    ],
    plus_loin: [
      [0.3, 'gn'],
      [0.7, 'eloigne'],
    ],
  },
  CM2: {
    facile: [
      [0.4, 'gn'],
      [0.6, 'gn'],
    ],
    normal: [
      [0.2, 'eloigne'],
      [0.3, 'inverse'],
      [0.2, 'pronomCod'],
      [0.3, 'attribut'],
    ],
    plus_loin: [
      [0.5, 'multiple'],
      [0.2, 'inverse'],
      [0.15, 'eloigne'],
      [0.15, 'attribut'],
    ],
  },
};

/** Formes proposées : 3e personne du singulier et du pluriel (+ 1re/2e du pluriel). */
function formesSV(inf: string, temps: Temps, p: Personne): { bonne: string; fausses: string[] } {
  const bonne = conjuguer(inf, temps, p);
  const fausses = ([2, 5, 3, 4, 1] as Personne[]).filter((q) => q !== p).map((q) => conjuguer(inf, temps, q));
  return { bonne, fausses: fausses.filter((f) => f !== bonne) };
}

const QUI = 'Je cherche le sujet en demandant « Qui est-ce qui… ? »';

function itemSV(ctx: GenContext, rng: Rng, classe: 'CE1' | 'CM2', level: Level, mode: ModeSV): ItemOf<'fill_blank'> {
  const temps = rng.pick(TEMPS_SV[classe]![level]);
  const verbe: VerbeLex = rng.pick(classe === 'CE1' ? VERBES_SV : VERBES_SV_CM2);
  const compl = rng.pick(verbe.compl);
  const inf = verbe.inf;
  const indic = temps === 'imparfait' ? 'Autrefois, ' : temps === 'futur' ? 'Demain, ' : temps === 'passe_simple' ? 'Soudain, ' : '';
  const diff = { facile: 0.25, normal: 0.5, plus_loin: 0.75 }[level];

  if (mode === 'attribut') {
    // sujet + être + attribut : l'attribut s'accorde avec le sujet
    const s = rng.pick([...GN_SINGULIER, ...GN_PLURIEL, ...PRENOMS]);
    const a = rng.pick([...ADJ_REGULIERS, ...ADJ_SPECIAUX].filter((x) => x.anime || ['grand', 'petit'].includes(x.m)));
    const g: Genre = s.fem ? 'f' : 'm';
    const pl = s.p === 5;
    const tA: Temps = temps === 'passe_simple' ? 'imparfait' : temps;
    const ind = tA === 'imparfait' ? 'Autrefois, ' : tA === 'futur' ? 'Demain, ' : '';
    const etre = conjuguer('être', tA, s.p);
    const forme = formeAdj(a, g, pl);
    const sujet = majuscule(s.texte);
    return trou(ctx, rng, 'sv-attribut', {
      sentence: `${ind}${ind ? s.texte : sujet} ${etre} ___.`,
      answer: forme,
      wrong: formesAdj(a),
      nbChoix: 4,
      explication: `Après le verbe être, l’adjectif est attribut du sujet : il s’accorde avec « ${s.texte} » (${GENRE_NOMBRE(g, pl)}) → ${forme}.`,
      difficulty: diff,
      meta: { groupe: [...s.texte.split(' '), etre, '___'], lemme: a.m },
    });
  }

  let sujetTxt: string;
  let p: Personne;
  let phrase: (v: string) => string;
  let groupe: string[];
  let pourquoi: string;
  switch (mode) {
    case 'pronom': {
      p = rng.pick<Personne>([2, 5]);
      sujetTxt = p === 2 ? rng.pick(['il', 'elle']) : rng.pick(['ils', 'elles']);
      phrase = (v) => `${indic}${indic ? sujetTxt : majuscule(sujetTxt)} ${v} ${compl}.`;
      groupe = [indic ? sujetTxt : majuscule(sujetTxt), '___'];
      pourquoi = `le sujet est « ${sujetTxt} »`;
      break;
    }
    case 'gn':
    case 'eloigne': {
      const s = mode === 'gn' ? rng.pick([...PRENOMS, ...GN_SINGULIER, ...GN_PLURIEL, ...GN_PLURIEL]) : rng.pick(SUJETS_ELOIGNES);
      p = s.p;
      sujetTxt = s.texte;
      phrase = (v) => `${indic}${indic ? s.texte : majuscule(s.texte)} ${v} ${compl}.`;
      groupe = [...(indic ? s.texte : majuscule(s.texte)).split(' '), '___'];
      pourquoi =
        mode === 'eloigne'
          ? `le sujet est « ${s.texte} » : le nom principal est « ${s.texte.split(' ')[1]} » (${p === 5 ? 'pluriel' : 'singulier'}), pas le nom qui suit « de »`
          : `le sujet est « ${s.texte} »`;
      break;
    }
    case 'inverse': {
      const s = rng.pick([...GN_PLURIEL, ...GN_SINGULIER]);
      p = s.p;
      sujetTxt = s.texte;
      const debut = rng.pick(['Dans la cour', 'Au bout du chemin', 'Sur la scène', 'Près de la rivière']);
      // verbes intransitifs pour l'inversion : jouer, danser, chanter, marcher
      const vi = rng.pick(['jouer', 'danser', 'chanter', 'marcher'].map(lex));
      const v0 = vi.inf;
      if (rng.chance(0.5)) {
        phrase = (v) => `${debut} ${v} ${s.texte}.`;
        groupe = ['___', ...s.texte.split(' ')];
      } else {
        phrase = (v) => `« Bonjour ! » ${v} ${s.texte}.`;
        const { bonne, fausses } = formesSV('dire', temps === 'futur' ? 'present' : temps, p);
        return trou(ctx, rng, 'sv-inverse-dire', {
          sentence: phrase('___'),
          answer: bonne,
          wrong: fausses,
          nbChoix: 3,
          explication: `Le sujet est placé après le verbe (sujet inversé) : qui est-ce qui dit ? « ${s.texte} » → ${bonne}.`,
          difficulty: diff,
          meta: { groupe: ['___', ...s.texte.split(' ')], lemme: 'dire' },
        });
      }
      const { bonne, fausses } = formesSV(v0, temps, p);
      return trou(ctx, rng, 'sv-inverse', {
        sentence: phrase('___'),
        answer: bonne,
        wrong: fausses,
        nbChoix: 3,
        explication: `Le sujet est placé après le verbe (sujet inversé) : qui est-ce qui ${conjuguer(v0, temps, 2)} ? « ${s.texte} » (${p === 5 ? 'pluriel' : 'singulier'}) → ${bonne}.`,
        difficulty: diff,
        meta: { groupe, lemme: v0 },
      });
    }
    case 'pronomCod': {
      // « Mes parents nous attendent » : le pronom placé devant le verbe n'est pas le sujet
      const s = rng.pick(GN_PLURIEL.filter((x) => !x.texte.includes(' et ')));
      const pr = rng.pick(['nous', 'vous', 'les']);
      const vc = rng.pick(['regarder', 'écouter', 'appeler', 'aider', 'inviter', 'chercher'].map(lex));
      p = 5;
      const { bonne, fausses } = formesSV(vc.inf, temps === 'passe_simple' ? 'present' : temps, 5);
      const ind = temps === 'imparfait' ? 'Autrefois, ' : temps === 'futur' ? 'Demain, ' : '';
      const debutS = ind ? s.texte : majuscule(s.texte);
      const pronFaux = pr === 'nous' ? conjuguer(vc.inf, temps === 'passe_simple' ? 'present' : temps, 3) : pr === 'vous' ? conjuguer(vc.inf, temps === 'passe_simple' ? 'present' : temps, 4) : null;
      return trou(ctx, rng, 'sv-pronom', {
        sentence: `${ind}${debutS} ${pr} ___.`,
        answer: bonne,
        wrong: [...(pronFaux ? [pronFaux] : []), ...fausses],
        nbChoix: 3,
        explication: `« ${pr} » n’est pas le sujet : qui est-ce qui ${conjuguer(vc.inf, 'present', 2)} ? « ${s.texte} » (pluriel) → ${bonne}.`,
        difficulty: diff,
        meta: { groupe: [...debutS.split(' '), pr, '___'], lemme: vc.inf },
      });
    }
    case 'multiple': {
      const combos: { txt: string; p: Personne; pourquoi: string }[] = [
        { txt: 'Léa et moi', p: 3, pourquoi: 'Léa et moi = nous' },
        { txt: 'Toi et Hugo', p: 4, pourquoi: 'toi et Hugo = vous' },
        { txt: 'Ma sœur et moi', p: 3, pourquoi: 'ma sœur et moi = nous' },
        { txt: 'Ton frère et toi', p: 4, pourquoi: 'ton frère et toi = vous' },
        { txt: 'Le chat et le chien', p: 5, pourquoi: 'le chat et le chien = ils' },
        { txt: 'Nora et sa cousine', p: 5, pourquoi: 'Nora et sa cousine = elles' },
        { txt: 'Mon père et ma mère', p: 5, pourquoi: 'mon père et ma mère = ils' },
      ];
      const c = rng.pick(combos);
      p = c.p;
      sujetTxt = c.txt;
      const v = c.txt.includes('chat') ? rng.pick(['jouer', 'sauter'].map(lex)) : verbe;
      const cc = rng.pick(v.compl);
      const { bonne, fausses } = formesSV(v.inf, temps, p);
      return trou(ctx, rng, 'sv-multiple', {
        sentence: `${indic}${indic ? c.txt.replace(/^(Le|Ma|Mon|Ton)\b/, (m) => m.toLowerCase()) : c.txt} ___ ${cc}.`,
        answer: bonne,
        wrong: [...fausses, conjuguer(v.inf, temps, 2)],
        nbChoix: 4,
        explication: `Quand il y a plusieurs sujets, je les remplace par un seul pronom : ${c.pourquoi} → ${bonne}.`,
        difficulty: diff,
        meta: { groupe: [...c.txt.split(' '), '___'], lemme: v.inf },
      });
    }
  }
  const { bonne, fausses } = formesSV(inf, temps, p);
  return trou(ctx, rng, `sv-${mode}`, {
    sentence: phrase('___'),
    answer: bonne,
    wrong: fausses,
    nbChoix: classe === 'CE1' && level === 'facile' ? 2 : 3,
    explication: `${QUI} : ${pourquoi} (${p === 5 ? 'pluriel' : 'singulier'}). Le verbe s’accorde avec lui → ${bonne}.`,
    difficulty: diff,
    meta: { groupe, lemme: inf },
  });
}

function svTrou(classe: 'CE1' | 'CM2') {
  return (level: Level, rng: Rng, ctx: GenContext) =>
    itemSV(ctx, rng, classe, level, pondere(rng, MODES_SV[classe]![level]));
}

function svVraiFaux(classe: 'CE1' | 'CM2') {
  return (level: Level, rng: Rng, ctx: GenContext): ItemOf<'true_false'> => {
    for (let i = 0; i < 30; i++) {
      const it = svTrou(classe)(level, rng, ctx);
      const vrai = rng.chance(0.5);
      const faux = (it.choices ?? []).filter((c) => c !== it.answer);
      if (!vrai && !faux.length) continue;
      const montre = vrai ? it.answer : rng.pick(faux);
      return vraiFaux(ctx, 'sv', {
        statement: `Cette phrase est bien accordée : « ${it.sentence.replace('___', montre)} »`,
        answer: vrai,
        explication: it.explication,
        difficulty: it.difficulty ?? 0.5,
      });
    }
    throw new Error('Vrai/faux SV impossible');
  };
}

/** QCM : quel sujet convient ? (un seul sujet a le bon nombre / la bonne personne) */
function svQcm(classe: 'CE1' | 'CM2') {
  return (level: Level, rng: Rng, ctx: GenContext): ItemOf<'mcq'> => {
    const temps = rng.pick(TEMPS_SV[classe]![level]);
    const v = rng.pick(classe === 'CE1' ? VERBES_SV : VERBES_SV_CM2);
    const pl = rng.chance(0.5);
    const p: Personne = pl ? 5 : 2;
    const forme = conjuguer(v.inf, temps, p);
    const autre = conjuguer(v.inf, temps, pl ? 2 : 5);
    if (autre === forme) return svQcm(classe)(level, rng, ctx);
    const sources = level === 'plus_loin' ? SUJETS_ELOIGNES : [...PRENOMS, ...GN_SINGULIER, ...GN_PLURIEL];
    const bons = sources.filter((s) => s.p === p);
    const mauvais = sources.filter((s) => s.p !== p);
    const bon = rng.pick(bons);
    const compl = rng.pick(v.compl);
    const choix = [bon, ...distinctsPar(rng, mauvais, 2, (s) => s.texte)].map((s) => majuscule(s.texte));
    return mcq(ctx, rng, 'sujet', {
      question: `Quel sujet convient ? « ___ ${forme} ${compl}. »`,
      good: majuscule(bon.texte),
      wrong: choix.slice(1),
      explication: `« ${forme} » est au ${pl ? 'pluriel' : 'singulier'} : il faut un sujet au ${pl ? 'pluriel' : 'singulier'} → ${majuscule(bon.texte)} ${forme} ${compl}.`,
      difficulty: clamp01(level === 'facile' ? 0.25 : level === 'normal' ? 0.45 : 0.7),
    });
  };
}

/* ------------------------------------------------------------------ */
/* Participe passé (CM2)                                               */
/* ------------------------------------------------------------------ */

const VERBES_PP_ETRE = ['arriver', 'tomber', 'rester', 'entrer', 'rentrer', 'aller', 'venir', 'revenir', 'partir', 'sortir'].map(lex);
const VERBES_PP_AVOIR = ['manger', 'chanter', 'ranger', 'finir', 'choisir', 'faire', 'prendre', 'dire', 'voir', 'apprendre', 'dessiner', 'préparer'].map(lex);

/** COD placés avant le verbe : « Ces photos, je les ai prises. » / « La tarte que Léa a faite ». */
const COD_AVANT: { nom: string; g: Genre; pl: boolean; inf: string; pron: string; fin: string }[] = [
  { nom: 'ces photos', g: 'f', pl: true, inf: 'prendre', pron: 'les', fin: 'pendant les vacances' },
  { nom: 'la tarte', g: 'f', pl: false, inf: 'faire', pron: 'l’', fin: 'ce matin' },
  { nom: 'ces fleurs', g: 'f', pl: true, inf: 'choisir', pron: 'les', fin: 'au marché' },
  { nom: 'les lettres', g: 'f', pl: true, inf: 'écrire', pron: 'les', fin: 'hier soir' },
  { nom: 'la poésie', g: 'f', pl: false, inf: 'apprendre', pron: 'l’', fin: 'par cœur' },
  { nom: 'les jouets', g: 'm', pl: true, inf: 'ranger', pron: 'les', fin: 'dans le coffre' },
  { nom: 'les gâteaux', g: 'm', pl: true, inf: 'préparer', pron: 'les', fin: 'pour la fête' },
  { nom: 'la chanson', g: 'f', pl: false, inf: 'chanter', pron: 'l’', fin: 'à la fête' },
  { nom: 'ces étoiles', g: 'f', pl: true, inf: 'voir', pron: 'les', fin: 'dans le ciel' },
  { nom: 'les pommes', g: 'f', pl: true, inf: 'manger', pron: 'les', fin: 'au goûter' },
];

type ModePP = 'etre' | 'avoir' | 'codPronom' | 'codQue';

const MODES_PP: Record<Level, readonly (readonly [number, ModePP])[]> = {
  facile: [[1, 'etre']],
  normal: [
    [0.45, 'etre'],
    [0.35, 'avoir'],
    [0.2, 'codPronom'],
  ],
  plus_loin: [
    [0.2, 'etre'],
    [0.2, 'avoir'],
    [0.3, 'codPronom'],
    [0.3, 'codQue'],
  ],
};

const formesPP = (inf: string) => {
  const pp = participePasse(inf);
  const out = [pp, accorderParticipe(pp, { fem: true }), accorderParticipe(pp, { plur: true }), accorderParticipe(pp, { fem: true, plur: true })];
  return [...new Set(out)];
};

function itemPP(ctx: GenContext, rng: Rng, level: Level, mode: ModePP): ItemOf<'fill_blank'> {
  const diff = { facile: 0.3, normal: 0.55, plus_loin: 0.8 }[level];
  const temps: Temps = rng.chance(0.75) ? 'passe_compose' : 'plus_que_parfait';
  if (mode === 'etre') {
    const v = rng.pick(VERBES_PP_ETRE);
    const s = rng.pick([...PRENOMS, ...GN_SINGULIER, ...GN_PLURIEL]);
    const aux = conjuguer('être', temps === 'passe_compose' ? 'present' : 'imparfait', s.p);
    const pl = s.p === 5;
    const forme = participePasse(v.inf, { fem: s.fem, plur: pl });
    const compl = rng.pick(v.compl);
    const S = majuscule(s.texte);
    return trou(ctx, rng, 'pp-etre', {
      sentence: `${S} ${aux} ___ ${compl}.`,
      answer: forme,
      wrong: [...formesPP(v.inf), v.inf],
      nbChoix: 4,
      explication: `Avec l’auxiliaire être, le participe passé s’accorde avec le sujet « ${s.texte} » (${GENRE_NOMBRE(s.fem ? 'f' : 'm', pl)}) → ${S} ${aux} ${forme}.`,
      difficulty: diff,
      meta: { groupe: [...S.split(' '), aux, '___'], lemme: participePasse(v.inf) },
    });
  }
  if (mode === 'avoir') {
    const v = rng.pick(VERBES_PP_AVOIR);
    const s = rng.pick([...GN_PLURIEL, ...PRENOMS.filter((x) => x.fem)]);
    const aux = conjuguer('avoir', temps === 'passe_compose' ? 'present' : 'imparfait', s.p);
    const pp = participePasse(v.inf);
    const directs = v.compl.filter((c) => /^(un|une|le|la|les|des|du|l’)\b/.test(c));
    const compl = rng.pick(directs.length ? directs : v.compl);
    const S = majuscule(s.texte);
    return trou(ctx, rng, 'pp-avoir', {
      sentence: `${S} ${aux} ___ ${compl}.`,
      answer: pp,
      wrong: [...formesPP(v.inf), ...(v.inf.endsWith('er') ? [v.inf] : [])],
      nbChoix: 4,
      explication: `Avec l’auxiliaire avoir, le participe passé ne s’accorde pas avec le sujet (et le complément « ${compl} » est placé après le verbe) → ${S} ${aux} ${pp} ${compl}.`,
      difficulty: diff,
      meta: { groupe: [...S.split(' '), aux, '___'], lemme: pp },
    });
  }
  const c = rng.pick(COD_AVANT);
  const pp = participePasse(c.inf);
  const forme = accorderParticipe(pp, { fem: c.g === 'f', plur: c.pl });
  const s = rng.pick(PRENOMS);
  const aux = conjuguer('avoir', temps === 'passe_compose' ? 'present' : 'imparfait', 2);
  const qui = `« ${c.nom} » (${GENRE_NOMBRE(c.g, c.pl)})`;
  if (mode === 'codPronom') {
    const N = majuscule(c.nom);
    const pr = c.pron === 'l’' ? 'l’' : `${c.pron} `;
    return trou(ctx, rng, 'pp-cod-pronom', {
      sentence: `${N}, ${s.texte} ${pr}${aux} ___ ${c.fin}.`,
      answer: forme,
      wrong: formesPP(c.inf),
      nbChoix: 4,
      explication: `Avec avoir, le participe passé s’accorde avec le COD quand il est placé avant le verbe : « ${c.pron === 'l’' ? 'l’' : c.pron} » remplace ${qui} → ${forme}.`,
      difficulty: diff,
      meta: { groupe: [...N.split(' '), ...(pr === 'l’' ? [`l’${aux}`] : [pr.trim(), aux]), '___'], lemme: pp },
    });
  }
  const [det, ...reste] = c.nom.split(' ');
  const voici = `${det === 'ces' ? 'les' : det} ${reste.join(' ')}`;
  return trou(ctx, rng, 'pp-cod-que', {
    sentence: `Voici ${voici} que ${s.texte} ${aux} ___ ${c.fin}.`,
    answer: forme,
    wrong: formesPP(c.inf),
    nbChoix: 4,
    explication: `« que » remplace « ${voici} », COD placé avant le verbe : avec avoir, le participe passé s’accorde avec lui (${GENRE_NOMBRE(c.g, c.pl)}) → ${forme}.`,
    difficulty: diff,
    meta: { groupe: [...voici.split(' '), 'que', s.texte, aux, '___'], lemme: pp },
  });
}

const ppTrou = (level: Level, rng: Rng, ctx: GenContext) => itemPP(ctx, rng, level, pondere(rng, MODES_PP[level]));

function ppQcm(level: Level, rng: Rng, ctx: GenContext): ItemOf<'mcq'> {
  const it = ppTrou(level, rng, ctx);
  const faux = (it.choices ?? []).filter((c) => c !== it.answer).map((c) => it.sentence.replace('___', c));
  return mcq(ctx, rng, 'pp', {
    question: 'Quelle phrase est bien écrite ?',
    good: it.sentence.replace('___', it.answer),
    wrong: faux,
    max: 3,
    explication: it.explication,
    difficulty: it.difficulty ?? 0.5,
  });
}

function ppVraiFaux(level: Level, rng: Rng, ctx: GenContext): ItemOf<'true_false'> {
  const it = ppTrou(level, rng, ctx);
  const vrai = rng.chance(0.5);
  const faux = (it.choices ?? []).filter((c) => c !== it.answer);
  const montre = vrai || !faux.length ? it.answer : rng.pick(faux);
  return vraiFaux(ctx, 'pp', {
    statement: `Le participe passé est bien accordé : « ${it.sentence.replace('___', montre)} »`,
    answer: montre === it.answer,
    explication: it.explication,
    difficulty: it.difficulty ?? 0.5,
  });
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export const ACCORDS: Record<string, LessonContent> = {
  'CE1.FR.GRAM.GN': {
    gens: { fill_blank: gnTrou('CE1'), mcq: gnQcm('CE1'), true_false: gnVraiFaux('CE1'), classification: gnClassement('CE1') },
  },
  'CM2.FR.ORTH.GN': {
    gens: { fill_blank: gnTrou('CM2'), mcq: gnQcm('CM2'), true_false: gnVraiFaux('CM2'), classification: gnClassement('CM2') },
  },
  'CE1.FR.GRAM.SV': { gens: { fill_blank: svTrou('CE1'), mcq: svQcm('CE1'), true_false: svVraiFaux('CE1') } },
  'CM2.FR.ORTH.SV': { gens: { fill_blank: svTrou('CM2'), mcq: svQcm('CM2'), true_false: svVraiFaux('CM2') } },
  'CM2.FR.ORTH.PP': { gens: { fill_blank: ppTrou, mcq: ppQcm, true_false: ppVraiFaux } },
};
