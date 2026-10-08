/**
 * CE1 — Lecture : sons complexes (CGP), valeurs de s / c / g, fluence, compréhension.
 * BO n°41 du 31/10/2024 (cycle 2) : « décoder toutes les CGP y compris les plus complexes »,
 * pseudo-mots « doir, stag, choust, valin, cagnou » ; listes analogiques « ça / glaçon / garçon » ;
 * 70 mots par minute en fin de CE1 ; texte d'« une quinzaine de lignes » compris en autonomie.
 */
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext } from '../../registry';
import type { Item, Level } from '../../schemas';
import { poolComprehension, poolEtapes, poolFluence } from './textes';
import { aucun, classer, diff, oral, paires, parNiv, tirer, trou } from './util';

/* ------------------------------------------------------------------ */
/* Sons complexes (CGP)                                                */
/* ------------------------------------------------------------------ */

type Son = 'ou' | 'on' | 'an' | 'in' | 'oi' | 'eu' | 'o' | 'ch' | 'gn' | 'ill' | 'f' | 'è' | 'é';

export const SONS: Record<Son, string> = {
  ou: '[ou] comme dans « loup »',
  on: '[on] comme dans « ballon »',
  an: '[an] comme dans « maman »',
  in: '[in] comme dans « lapin »',
  oi: '[oi] comme dans « roi »',
  eu: '[eu] comme dans « feu »',
  o: '[o] comme dans « moto »',
  ch: '[ch] comme dans « chat »',
  gn: '[gn] comme dans « montagne »',
  ill: '[ill] comme dans « fille »',
  f: '[f] comme dans « photo »',
  è: '[è] comme dans « mère »',
  é: '[é] comme dans « été »',
};

/**
 * Mots et TOUS les sons de l'inventaire qu'on y entend (pour qu'un mot ne soit rangé que s'il ne
 * contient qu'un seul des sons proposés). Niveau minimal : f = facile, n = normal, p = plus loin.
 */
export const MOTS_SONS: [string, Son[], 'f' | 'n' | 'p'][] = [
  ['loup', ['ou'], 'f'],
  ['poule', ['ou'], 'f'],
  ['roue', ['ou'], 'f'],
  ['soupe', ['ou'], 'f'],
  ['hibou', ['ou'], 'f'],
  ['mouton', ['ou', 'on'], 'f'],
  ['bouche', ['ou', 'ch'], 'f'],
  ['ballon', ['on'], 'f'],
  ['bonbon', ['on'], 'f'],
  ['pont', ['on'], 'f'],
  ['savon', ['on'], 'f'],
  ['melon', ['on'], 'f'],
  ['maman', ['an'], 'f'],
  ['enfant', ['an'], 'f'],
  ['dent', ['an'], 'f'],
  ['lampe', ['an'], 'f'],
  ['jambe', ['an'], 'f'],
  ['vent', ['an'], 'f'],
  ['tante', ['an'], 'f'],
  ['lapin', ['in'], 'f'],
  ['main', ['in'], 'f'],
  ['pain', ['in'], 'f'],
  ['train', ['in'], 'f'],
  ['sapin', ['in'], 'f'],
  ['jardin', ['in'], 'f'],
  ['roi', ['oi'], 'f'],
  ['poire', ['oi'], 'f'],
  ['noix', ['oi'], 'f'],
  ['étoile', ['é', 'oi'], 'f'],
  ['voiture', ['oi'], 'f'],
  ['feu', ['eu'], 'f'],
  ['bleu', ['eu'], 'f'],
  ['fleur', ['eu', 'f'], 'f'],
  ['peur', ['eu'], 'f'],
  ['chat', ['ch'], 'f'],
  ['niche', ['ch'], 'f'],
  ['vache', ['ch'], 'f'],
  ['cheval', ['ch'], 'f'],
  ['moto', ['o'], 'f'],
  ['vélo', ['é', 'o'], 'f'],
  ['auto', ['o'], 'f'],
  ['bateau', ['o'], 'f'],
  ['chapeau', ['ch', 'o'], 'f'],
  ['gâteau', ['o'], 'f'],
  ['bol', ['o'], 'f'],
  ['montagne', ['on', 'gn'], 'n'],
  ['cygne', ['gn'], 'n'],
  ['ligne', ['gn'], 'n'],
  ['agneau', ['gn', 'o'], 'n'],
  ['peigne', ['è', 'gn'], 'n'],
  ['araignée', ['è', 'gn', 'é'], 'n'],
  ['fille', ['ill', 'f'], 'n'],
  ['bille', ['ill'], 'n'],
  ['soleil', ['o', 'è', 'ill'], 'n'],
  ['abeille', ['è', 'ill'], 'n'],
  ['feuille', ['f', 'eu', 'ill'], 'n'],
  ['grenouille', ['ou', 'ill'], 'n'],
  ['travail', ['ill'], 'n'],
  ['fauteuil', ['f', 'o', 'eu', 'ill'], 'n'],
  ['photo', ['f', 'o'], 'n'],
  ['phoque', ['f', 'o'], 'n'],
  ['pharmacie', ['f'], 'n'],
  ['téléphone', ['é', 'f', 'o'], 'n'],
  ['dauphin', ['o', 'f', 'in'], 'n'],
  ['girafe', ['f'], 'n'],
  ['addition', ['on'], 'n'],
  ['récréation', ['é', 'on'], 'n'],
  ['nœud', ['eu'], 'n'],
  ['sœur', ['eu'], 'n'],
  ['cœur', ['eu'], 'n'],
  ['cheveu', ['ch', 'eu'], 'n'],
  ['peinture', ['in'], 'n'],
  ['ceinture', ['in'], 'n'],
  ['timbre', ['in'], 'n'],
  ['tempête', ['an', 'è'], 'n'],
  ['ensemble', ['an'], 'n'],
  ['chambre', ['ch', 'an'], 'n'],
  ['château', ['ch', 'o'], 'n'],
  ['chaussure', ['ch', 'o'], 'n'],
  ['neige', ['è'], 'n'],
  ['lait', ['è'], 'n'],
  ['fête', ['f', 'è'], 'n'],
  ['mère', ['è'], 'n'],
  ['forêt', ['f', 'o', 'è'], 'n'],
  ['été', ['é'], 'n'],
  ['nez', ['é'], 'n'],
  ['bébé', ['é'], 'n'],
  ['pompier', ['on', 'é'], 'n'],
  ['ongle', ['on'], 'n'],
  ['oiseau', ['oi', 'o'], 'n'],
  ['poisson', ['oi', 'on'], 'n'],
  ['armoire', ['oi'], 'n'],
  ['chocolat', ['ch', 'o'], 'n'],
  ['jouet', ['ou', 'è'], 'n'],
  ['mouchoir', ['ou', 'ch', 'oi'], 'n'],
  ['champignon', ['ch', 'an', 'gn', 'on'], 'n'],
  ['éléphant', ['é', 'f', 'an'], 'n'],
  ['chemin', ['ch', 'in'], 'n'],
  ['boulanger', ['ou', 'an', 'é'], 'n'],
  ['orphelin', ['o', 'f', 'in'], 'p'],
  ['scaphandre', ['f', 'an'], 'p'],
  ['vigneron', ['gn', 'on'], 'p'],
  ['châtaigne', ['ch', 'è', 'gn'], 'p'],
  ['écureuil', ['é', 'eu', 'ill'], 'p'],
  ['chevreuil', ['ch', 'eu', 'ill'], 'p'],
  ['seigneur', ['è', 'gn', 'eu'], 'p'],
  ['épouvantail', ['é', 'ou', 'an', 'ill'], 'p'],
  ['typhon', ['f', 'on'], 'p'],
  ['saphir', ['f'], 'p'],
  ['pharaon', ['f', 'on'], 'p'],
  ['chignon', ['ch', 'gn', 'on'], 'p'],
  ['bouteille', ['ou', 'è', 'ill'], 'p'],
  ['moelleux', ['oi', 'eu'], 'p'],
  ['poêle', ['oi'], 'p'],
  ['monsieur', ['eu'], 'p'],
  ['oignon', ['o', 'gn', 'on'], 'p'],
];

/** Sons à comparer (sons proches d'abord), par niveau. */
const GROUPES_SONS: Record<Level, Son[][]> = {
  facile: [
    ['ou', 'on'],
    ['an', 'on'],
    ['oi', 'ou'],
    ['in', 'an'],
    ['eu', 'ou'],
    ['ch', 'o'],
    ['oi', 'o'],
  ],
  normal: [
    ['an', 'on', 'in'],
    ['eu', 'ou', 'o'],
    ['gn', 'ill', 'ch'],
    ['è', 'é', 'eu'],
    ['f', 'ch', 'gn'],
    ['oi', 'ou', 'on'],
    ['in', 'an', 'è'],
  ],
  plus_loin: [
    ['an', 'on', 'in', 'oi'],
    ['gn', 'ill', 'f', 'ch'],
    ['è', 'é', 'eu', 'o'],
    ['ou', 'oi', 'on', 'an'],
  ],
};

const motsDuNiveau = (level: Level) =>
  MOTS_SONS.filter(([, , n]) =>
    parNiv(level, { facile: n === 'f', normal: n !== 'p', plus_loin: n !== 'f' }),
  );

/** Mots rangeables pour un groupe de sons : chaque mot contient exactement un des sons. */
export function motsRangeables(level: Level, sons: Son[]): [string, number][] {
  const out: [string, number][] = [];
  for (const [mot, s] of motsDuNiveau(level)) {
    const communs = sons.filter((x) => s.includes(x));
    if (communs.length === 1) out.push([mot, sons.indexOf(communs[0]!)]);
  }
  return out;
}

function genClasserSons(level: Level, rng: Rng, ctx: GenContext): Item {
  const parCat = parNiv(level, { facile: 3, normal: 3, plus_loin: 2 });
  for (const sons of rng.shuffle(GROUPES_SONS[level])) {
    const dispo = motsRangeables(level, sons);
    const choisis = sons.flatMap((_, c) =>
      tirer(
        rng,
        dispo.filter(([, k]) => k === c),
        parCat,
      ),
    );
    if (sons.some((_, c) => choisis.filter(([, k]) => k === c).length < 2)) continue;
    return classer(ctx, rng, `sons-${sons.join('-')}`, {
      prompt: 'Dis chaque mot à voix haute et range-le selon le son que tu entends.',
      categories: sons.map((s) => SONS[s]),
      elements: choisis,
      explication: `Je dis le mot en articulant et j’écoute le son : ${sons.map((s) => SONS[s]).join(', ')}.`,
      difficulty: diff(level, rng.next()),
    });
  }
  throw new Error('aucun groupe de sons utilisable');
}

/** Graphie → son (on écrit le son avec sa graphie la plus simple). */
const GRAPHIES: [string, string, 'f' | 'n' | 'p'][] = [
  ['eau', '[o]', 'f'],
  ['au', '[o]', 'f'],
  ['ai', '[è]', 'f'],
  ['ph', '[f]', 'f'],
  ['ez', '[é]', 'f'],
  ['qu', '[k]', 'f'],
  ['ain', '[in]', 'f'],
  ['en', '[an]', 'f'],
  ['ei', '[è]', 'n'],
  ['ein', '[in]', 'n'],
  ['œu', '[eu]', 'n'],
  ['er (à la fin de « chanter »)', '[é]', 'n'],
  ['ç', '[s]', 'n'],
  ['om (dans « pompier »)', '[on]', 'n'],
  ['em (dans « tempête »)', '[an]', 'n'],
  ['im (dans « timbre »)', '[in]', 'n'],
  ['ill (dans « fille »)', '[ill]', 'n'],
  ['gn', '[gn]', 'n'],
  ['ê', '[è]', 'n'],
  ['et (à la fin de « jouet »)', '[è]', 'p'],
  ['ge (dans « pigeon »)', '[j]', 'p'],
  ['gu (dans « guitare »)', '[g]', 'p'],
  ['s (dans « rose »)', '[z]', 'p'],
  ['c (dans « citron »)', '[s]', 'p'],
  ['ch (dans « orchestre »)', '[k]', 'p'],
  ['um (dans « parfum »)', '[in]', 'p'],
  ['aim (dans « faim »)', '[in]', 'p'],
];

function genGraphies(level: Level, rng: Rng, ctx: GenContext): Item {
  const dispo = GRAPHIES.filter(([, , n]) =>
    parNiv(level, { facile: n === 'f', normal: n !== 'p', plus_loin: true }),
  );
  const n = parNiv(level, { facile: 4, normal: 5, plus_loin: 6 });
  const pairs: { left: string; right: string }[] = [];
  for (const [left, right] of rng.shuffle(dispo)) {
    if (pairs.some((p) => p.right === right)) continue;
    pairs.push({ left, right });
    if (pairs.length >= n) break;
  }
  return paires(ctx, `graphies-${pairs.length}`, {
    prompt: 'Associe chaque graphie au son qu’elle fait.',
    pairs,
    relation: 'graphie → son',
    explication: `Un même son peut s’écrire de plusieurs façons : ${pairs
      .map((p) => `${p.left.replace(/ \(.*\)$/, '')} se lit ${p.right}`)
      .join(', ')}.`,
    difficulty: diff(level, rng.next()),
  });
}

/** Lecture à voix haute : syllabes (facile), pseudo-mots (normal, BO), mots rares (plus loin). */
const SYLLABES: [string, string][] = [
  ['lou', 'lou'],
  ['chon', 'chon'],
  ['moi', 'moi'],
  ['pin', 'pin'],
  ['fou', 'fou'],
  ['ran', 'ran'],
  ['bo', 'beau'],
  ['cha', 'chat'],
  ['toi', 'toi'],
  ['vin', 'vin'],
  ['dou', 'doux'],
  ['ron', 'rond'],
  ['tra', 'tra'],
  ['pli', 'pli'],
  ['cro', 'croc'],
  ['blan', 'blanc'],
];

/** Pseudo-mots : [écrit, prononciation pour la synthèse vocale, transcriptions acceptées]. */
const PSEUDO_MOTS: [string, string, string[]][] = [
  ['doir', 'doire', ['doire', 'd’hoir']],
  ['stag', 'stague', ['stague']],
  ['choust', 'chousste', ['chouste', 'shoust']],
  ['valin', 'valin', ['valain', 'vallin']],
  ['cagnou', 'cagnou', ['caniou', 'cagnoux']],
  ['brouchon', 'brouchon', ['brouchons']],
  ['flinpo', 'flinpo', ['flinpot', 'flimpo']],
  ['gloumin', 'gloumin', ['gloumain']],
  ['gnapi', 'gnapi', ['niapi']],
  ['chaipo', 'chaipo', ['chépo', 'chaipot']],
  ['poilan', 'poilan', ['poilant', 'poalan']],
  ['fréchoir', 'fréchoire', ['fréchoire']],
  ['moussin', 'moussin', ['moussain']],
  ['zoufan', 'zoufan', ['zoufant']],
  ['pheuli', 'feuli', ['feuli']],
  ['ganouille', 'ganouille', ['ganouye']],
  ['souteil', 'souteil', ['soutèye']],
  ['vauchin', 'vauchin', ['vochin']],
];

/** Mots rares ou à lettres muettes : [mot, explication]. */
const MOTS_RARES: [string, string][] = [
  ['printemps', 'On n’entend ni le « p » ni le « s » de la fin : prin-temps.'],
  ['longtemps', 'On n’entend pas le « g », ni le « p » et le « s » de la fin : long-temps.'],
  ['doigts', 'On n’entend ni le « g », ni le « t », ni le « s » : doigts se lit [doi].'],
  ['poids', 'Le « d » et le « s » sont muets : poids se lit [poi].'],
  ['corps', 'Le « p » et le « s » sont muets : corps se lit [cor].'],
  ['sirop', 'Le « p » final est muet : si-rop se lit [siro].'],
  ['tabac', 'Le « c » final est muet : ta-bac se lit [taba].'],
  ['estomac', 'Le « c » final est muet : es-to-mac se lit [estoma].'],
  ['fusil', 'Le « l » final est muet : fu-sil se lit [fuzi].'],
  ['outil', 'Le « l » final est muet : ou-til se lit [outi].'],
  ['chorale', 'Ici, « ch » se lit [k] : cho-rale se lit [korale].'],
  ['orchestre', 'Ici, « ch » se lit [k] : or-chestre se lit [orkestre].'],
  ['aquarium', '« qua » se lit [koua] et « um » se lit [ome] : a-qua-rium.'],
  ['oignon', 'Le « i » ne s’entend pas : oignon se lit [ognon].'],
  ['monsieur', '« on » se lit [e] dans ce mot : monsieur se lit [mesieu].'],
  ['femme', 'Ici, « e » se lit [a] : femme se lit [fame].'],
  ['album', '« um » se lit [ome] : al-bum.'],
  ['second', '« c » se lit [g] et le « d » est muet : se-cond se lit [segon].'],
];

function genLireCgp(level: Level, rng: Rng, ctx: GenContext): Item {
  if (level === 'facile') {
    const [s, dit] = rng.pick(SYLLABES);
    return oral(ctx, `syll-${s}`, {
      prompt: `Lis cette syllabe : ${s}`,
      answer: s,
      accepted: [dit],
      spoken: dit,
      explication: `Je lis les lettres ensemble, de gauche à droite : ${s}.`,
      difficulty: diff(level, rng.next()),
    });
  }
  if (level === 'normal') {
    const [m, dit, acc] = rng.pick(PSEUDO_MOTS);
    return oral(ctx, `pseudo-${m}`, {
      prompt: `Lis ce mot inventé : ${m}`,
      answer: m,
      accepted: acc,
      spoken: dit,
      explication: `C’est un mot inventé : je le lis morceau par morceau, en reconnaissant les sons (ch, ou, oi, gn…).`,
      difficulty: diff(level, rng.next()),
    });
  }
  const [m, expl] = rng.pick(MOTS_RARES);
  return oral(ctx, `rare-${m}`, {
    prompt: `Lis ce mot : ${m}`,
    answer: m,
    accepted: m === 'doigts' ? ['doigt'] : [],
    explication: expl,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* s / c / g : valeurs de position                                     */
/* ------------------------------------------------------------------ */

type Lettre = 's' | 'c' | 'g';
const VALEURS: Record<Lettre, [string, string]> = {
  s: ['« s » fait [s] comme dans « sac »', '« s » fait [z] comme dans « rose »'],
  c: ['« c » fait [k] comme dans « car »', '« c » ou « ç » fait [s] comme dans « ciel »'],
  g: ['« g » fait [g] comme dans « gomme »', '« g » fait [j] comme dans « girafe »'],
};
const REGLES: Record<Lettre, string> = {
  s: 'Entre deux voyelles, un seul « s » chante [z] (rose) ; « ss » ou « s » au début du mot fait [s] (poisson, sac).',
  c: 'Devant e, i, y, le « c » fait [s] (ciel) ; devant a, o, u, il fait [k] (car), sauf avec une cédille : ç (garçon).',
  g: 'Devant e, i, y, le « g » fait [j] (girafe) ; devant a, o, u, il fait [g] (gomme). Avec « gu », on entend [g] (guitare).',
};

/** [mot, index de la valeur (0 ou 1), niveau minimal]. Aucun mot ne mélange les deux valeurs. */
const MOTS_SCG: Record<Lettre, [string, 0 | 1, 'f' | 'n' | 'p'][]> = {
  s: [
    ['sac', 0, 'f'],
    ['salade', 0, 'f'],
    ['soleil', 0, 'f'],
    ['tasse', 0, 'f'],
    ['classe', 0, 'f'],
    ['poisson', 0, 'n'],
    ['veste', 0, 'n'],
    ['masque', 0, 'n'],
    ['dessert', 0, 'n'],
    ['coussin', 0, 'p'],
    ['rose', 1, 'f'],
    ['chaise', 1, 'f'],
    ['maison', 1, 'f'],
    ['valise', 1, 'f'],
    ['cousin', 1, 'n'],
    ['poison', 1, 'n'],
    ['oiseau', 1, 'n'],
    ['musique', 1, 'n'],
    ['désert', 1, 'n'],
    ['blouson', 1, 'p'],
  ],
  c: [
    ['carotte', 0, 'f'],
    ['colle', 0, 'f'],
    ['cube', 0, 'f'],
    ['lac', 0, 'f'],
    ['flacon', 0, 'n'],
    ['flocon', 0, 'n'],
    ['crabe', 0, 'n'],
    ['écureuil', 0, 'p'],
    ['cerise', 1, 'f'],
    ['citron', 1, 'f'],
    ['ciel', 1, 'f'],
    ['glace', 1, 'f'],
    ['garçon', 1, 'n'],
    ['leçon', 1, 'n'],
    ['glaçon', 1, 'n'],
    ['maçon', 1, 'n'],
    ['balançoire', 1, 'p'],
    ['reçu', 1, 'p'],
  ],
  g: [
    ['gâteau', 0, 'f'],
    ['gomme', 0, 'f'],
    ['gare', 0, 'f'],
    ['légume', 0, 'n'],
    ['guitare', 0, 'n'],
    ['bague', 0, 'n'],
    ['figue', 0, 'n'],
    ['guêpe', 0, 'p'],
    ['girafe', 1, 'f'],
    ['genou', 1, 'f'],
    ['page', 1, 'f'],
    ['gilet', 1, 'f'],
    ['pigeon', 1, 'n'],
    ['orange', 1, 'n'],
    ['bougie', 1, 'n'],
    ['plongeon', 1, 'p'],
    ['gymnase', 1, 'p'],
  ],
};

const okNiv = (level: Level, n: 'f' | 'n' | 'p') =>
  parNiv(level, { facile: n === 'f', normal: n !== 'p', plus_loin: true });

function genClasserScg(level: Level, rng: Rng, ctx: GenContext): Item {
  const lettre = rng.pick<Lettre>(['s', 'c', 'g']);
  const parCat = parNiv(level, { facile: 3, normal: 4, plus_loin: 5 });
  const dispo = MOTS_SCG[lettre].filter(([, , n]) => okNiv(level, n));
  const elements = ([0, 1] as const).flatMap((v) =>
    tirer(
      rng,
      dispo.filter(([, k]) => k === v),
      parCat,
    ).map(([m]): [string, number] => [m, v]),
  );
  return classer(ctx, rng, `scg-${lettre}`, {
    prompt: `Lis chaque mot et range-le selon le son de la lettre « ${lettre} ».`,
    categories: [...VALEURS[lettre]],
    elements,
    explication: REGLES[lettre],
    difficulty: diff(level, rng.next()),
  });
}

/** Phrases à compléter : [phrase avec ___, réponse, famille]. */
const TROUS_SCG: [string, string, 'c' | 'ge' | 'gu', 'f' | 'n' | 'p'][] = [
  ['un gar___on', 'ç', 'c', 'f'],
  ['une le___on', 'ç', 'c', 'f'],
  ['un gla___on', 'ç', 'c', 'n'],
  ['un ma___on', 'ç', 'c', 'n'],
  ['une balan___oire', 'ç', 'c', 'p'],
  ['nous commen___ons', 'ç', 'c', 'p'],
  ['un ___itron', 'c', 'c', 'f'],
  ['un ___amion', 'c', 'c', 'f'],
  ['une ___erise', 'c', 'c', 'n'],
  ['un ___ube', 'c', 'c', 'n'],
  ['un pi___on', 'ge', 'ge', 'f'],
  ['un plon___on', 'ge', 'ge', 'n'],
  ['une oran___ade', 'ge', 'ge', 'n'],
  ['nous man___ons', 'ge', 'ge', 'p'],
  ['un bour___on', 'ge', 'ge', 'p'],
  ['une ___irafe', 'g', 'ge', 'f'],
  ['un ___ilet', 'g', 'ge', 'n'],
  ['une ba___e', 'gu', 'gu', 'f'],
  ['une ___itare', 'gu', 'gu', 'f'],
  ['une fi___e', 'gu', 'gu', 'n'],
  ['une lan___e', 'gu', 'gu', 'n'],
  ['une ___êpe', 'gu', 'gu', 'p'],
  ['un ___âteau', 'g', 'gu', 'f'],
  ['un ___orille', 'g', 'gu', 'n'],
];

const CHOIX_SCG: Record<'c' | 'ge' | 'gu', [string[], string[], string]> = {
  c: [
    ['c', 'ç'],
    ['c', 'ç', 's'],
    'Devant a, o, u, le « c » fait [k] : pour entendre [s], j’ajoute une cédille (ç).',
  ],
  ge: [
    ['g', 'ge'],
    ['g', 'ge', 'j'],
    'Devant a, o, u, le « g » fait [g] : pour entendre [j], j’ajoute un « e » (ge).',
  ],
  gu: [
    ['g', 'gu'],
    ['g', 'gu', 'j'],
    'Devant e, i, le « g » fait [j] : pour entendre [g], j’ajoute un « u » (gu).',
  ],
};

function genTrouScg(level: Level, rng: Rng, ctx: GenContext): Item {
  const [phrase, rep, fam] = rng.pick(TROUS_SCG.filter(([, , , n]) => okNiv(level, n)));
  const [deux, trois, hint] = CHOIX_SCG[fam];
  const mot = phrase.replace('___', rep);
  const suite = phrase.split('___')[1]![0]!;
  const sonNaturel =
    rep === 'c'
      ? `devant « ${suite} », le « c » fait déjà ${/[eiy]/.test(suite) ? '[s]' : '[k]'} : pas de cédille`
      : rep === 'g' && fam === 'ge'
        ? `devant « ${suite} », le « g » fait déjà [j] : pas besoin d’ajouter « e »`
        : rep === 'g'
          ? `devant « ${suite} », le « g » fait déjà [g] : pas besoin d’ajouter « u »`
          : null;
  return trou(ctx, rng, `scg-${phrase}`, {
    sentence: phrase,
    answer: rep,
    choices: level === 'plus_loin' ? trois : deux,
    hint,
    explication: sonNaturel ? `On écrit « ${mot} » : ${sonNaturel}.` : `On écrit « ${mot} ». ${hint}`,
    difficulty: diff(level, rng.next()),
    spoken: mot,
  });
}

/** Mots à lire où s, c, g changent de son (paires minimales du BO : poisson / poison). */
const LIRE_SCG: [string, string, 'f' | 'n' | 'p'][] = [
  ['rose', 'Entre deux voyelles, un seul « s » fait [z] : rose.', 'f'],
  ['glace', 'Devant « e », le « c » fait [s] : glace.', 'f'],
  ['girafe', 'Devant « i », le « g » fait [j] : girafe.', 'f'],
  ['garçon', 'La cédille fait chanter le « c » [s] devant « o » : garçon.', 'f'],
  ['poisson', 'Avec deux « s », on entend [s] : poisson.', 'n'],
  ['poison', 'Un seul « s » entre deux voyelles fait [z] : poison.', 'n'],
  ['dessert', 'Avec deux « s », on entend [s] : dessert (le gâteau).', 'n'],
  ['désert', 'Un seul « s » entre deux voyelles fait [z] : désert (le sable).', 'n'],
  ['coussin', 'Avec deux « s », on entend [s] : coussin.', 'n'],
  ['cousin', 'Un seul « s » entre deux voyelles fait [z] : cousin.', 'n'],
  ['guitare', 'Avec « gu », on entend [g] : guitare.', 'n'],
  ['pigeon', 'Avec « ge » devant « o », on entend [j] : pigeon.', 'n'],
  ['nageoire', 'Avec « ge » devant « oi », on entend [j] : na-geoire.', 'p'],
  ['bourgeon', 'Avec « ge » devant « on », on entend [j] : bour-geon.', 'p'],
  ['guirlande', 'Avec « gu », on entend [g] : guir-lande.', 'p'],
  ['balançoire', 'La cédille fait chanter le « c » [s] : ba-lan-çoire.', 'p'],
];

function genLireScg(level: Level, rng: Rng, ctx: GenContext): Item {
  const [m, expl] = rng.pick(LIRE_SCG.filter(([, , n]) => okNiv(level, n)));
  return oral(ctx, `lire-${m}`, {
    prompt: `Lis ce mot : ${m}`,
    answer: m,
    accepted: [],
    explication: expl,
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* Fluence : groupes de souffle                                        */
/* ------------------------------------------------------------------ */

const GROUPES_SOUFFLE: Record<Level, string[]> = {
  facile: [
    'un gros ballon',
    'la maison bleue',
    'mon petit frère',
    'une belle fleur',
    'le chat noir',
    'dans le jardin',
    'sur la table',
    'un grand arbre',
  ],
  normal: [
    'sous le grand arbre du jardin',
    'les petits oiseaux chantent',
    'ma sœur et mon frère jouent',
    'à la fin de la récréation',
    'un joli bateau à voile',
    'les enfants ont faim',
    'au bord de la rivière',
    'pendant les grandes vacances',
  ],
  plus_loin: [
    'Attention, le loup arrive !',
    'Est-ce que tu viens avec nous ?',
    'Quelle belle surprise !',
    'Soudain, la porte s’ouvre.',
    'Vite, cachons-nous derrière le mur !',
    'Où as-tu rangé tes bottes ?',
  ],
};

function genSouffle(level: Level, rng: Rng, ctx: GenContext): Item {
  const groupe = rng.pick(GROUPES_SOUFFLE[level]);
  const sansPonct = groupe.replace(/\s*[!?.]$/, '');
  return oral(ctx, `souffle-${groupe}`, {
    prompt:
      level === 'plus_loin'
        ? `Lis cette phrase avec le ton : ${groupe}`
        : `Lis ce groupe de mots d’un seul souffle : ${groupe}`,
    answer: groupe,
    accepted: [sansPonct, sansPonct.toLowerCase()],
    explication:
      level === 'plus_loin'
        ? 'Je mets le ton : la voix monte pour une question et s’exclame devant « ! ».'
        : 'Les mots d’un même groupe se lisent ensemble, sans s’arrêter, comme quand on parle.',
    difficulty: diff(level, rng.next()),
  });
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */

export const LECTURE_CE1: ContentModule = {
  'CE1.FR.LEC.CGP': {
    gens: { classification: genClasserSons, pairing: genGraphies, oral_answer: genLireCgp },
  },
  'CE1.FR.LEC.SC': {
    gens: { classification: genClasserScg, fill_blank: genTrouScg, oral_answer: genLireScg },
  },
  'CE1.FR.LEC.FLUENCE': {
    gens: { oral_answer: genSouffle },
    pools: {
      read_aloud: poolFluence(
        'CE1',
        { facile: 35, normal: 70, plus_loin: 90 },
        'Je lis par groupes de mots, je respire aux points et je mets le ton aux « ! » et aux « ? ».',
      ),
    },
  },
  'CE1.FR.LEC.COMP': {
    pools: {
      mcq: poolComprehension('CE1'),
      ordering: poolEtapes('CE1'),
      true_false: aucun,
      pairing: aucun,
    },
  },
};
