/**
 * Homophones grammaticaux (CE1.FR.GRAM.HOMOPHONES, CM2.FR.ORTH.HOMOPHONES).
 * Les programmes 2024 (cycle 2) et 2025 (cycle 3) ne les nomment pas : ils sont travaillés ici au service
 * de l'orthographe grammaticale (identifier le verbe être/avoir, le déterminant, le pronom ; accord
 * sujet-verbe ; terminaisons -é/-er/-ez/-ait/-ais), avec l'astuce de substitution (« remplace par avait »).
 * Items `fill_blank` de la Pêche aux homophones : `choices` + `hint`.
 */
import type { Rng } from '@/engine/rng';
import type { GenContext, LessonContent } from '../../registry';
import type { ItemOf, Level } from '../../schemas';
import { PREMIER_SIMPLES, PRENOMS } from './lexique';
import { conjuguer, participePasse } from './moteur';
import { majuscule, mcq, trou, vraiFaux } from './util';

interface Phrase {
  /** Phrase avec « ___ » à la place de l'homophone. */
  p: string;
  /** Bonne réponse (en minuscules). */
  r: string;
  /** Explication propre à cette phrase (sinon la règle du mot). */
  note?: string;
}

interface Serie {
  id: string;
  mots: string[];
  astuce: string;
  regles: Record<string, string>;
  phrases: Phrase[];
}

const ph = (r: string, ...ps: string[]): Phrase[] => ps.map((p) => ({ p, r }));

const A: Serie = {
  id: 'a',
  mots: ['a', 'à'],
  astuce: 'Remplace par « avait » : si la phrase veut encore dire quelque chose, écris « a » ; sinon, écris « à ».',
  regles: {
    a: '« a » est le verbe avoir : on peut le remplacer par « avait ».',
    à: '« à » ne peut pas être remplacé par « avait » : c’est un petit mot invariable, sans verbe.',
  },
  phrases: [
    ...ph('a', 'Léo ___ un vélo rouge.', 'Ma sœur ___ perdu sa gomme.', 'Le chat ___ faim.', 'Inès ___ une nouvelle trousse.', 'Papa ___ préparé des crêpes.', 'Tom ___ gagné la course.', 'Le chien ___ caché son os.', 'Mamie ___ un jardin plein de fleurs.', 'Nora ___ froid aux mains.', 'Le maître ___ lu une histoire.'),
    ...ph('à', 'Nous allons ___ la piscine.', 'Léa joue ___ la marelle.', 'Je mange une tarte ___ la fraise.', 'Mon cousin habite ___ Paris.', 'Hugo va ___ l’école à vélo.', 'J’apprends ___ nager.', 'Ce soir, nous dînons ___ la maison.', 'Elle offre des fleurs ___ sa maman.', 'Le bateau ___ voile glisse sur l’eau.', 'Zoé parle ___ son chat.'),
  ],
};

const EST: Serie = {
  id: 'est',
  mots: ['et', 'est'],
  astuce: 'Remplace par « était » : si ça marche, écris « est » ; si tu peux dire « et puis », écris « et ».',
  regles: {
    est: '« est » est le verbe être : on peut le remplacer par « était ».',
    et: '« et » relie deux mots ou deux groupes de mots : on peut le remplacer par « et puis ».',
  },
  phrases: [
    ...ph('est', 'Le ciel ___ tout bleu.', 'Mon frère ___ malade.', 'La soupe ___ très chaude.', 'Mamie ___ dans le jardin.', 'Ce livre ___ passionnant.', 'Le chat ___ sur le toit.', 'Aujourd’hui, Léa ___ en retard.', 'La porte ___ fermée.', 'Le gâteau ___ délicieux.'),
    ...ph('et', 'Tom ___ Léa jouent au ballon.', 'J’ai un chat ___ un chien.', 'Il mange une pomme ___ une poire.', 'Le drapeau français est bleu, blanc ___ rouge.', 'Nous chantons ___ nous dansons.', 'Prends ton manteau ___ ton bonnet.', 'Le lapin saute ___ court dans l’herbe.', 'Maman ___ papa arrivent ce soir.'),
  ],
};

const SONT: Serie = {
  id: 'sont',
  mots: ['son', 'sont'],
  astuce: 'Remplace par « étaient » : si ça marche, écris « sont » ; si tu peux dire « mon », écris « son ».',
  regles: {
    sont: '« sont » est le verbe être : on peut le remplacer par « étaient ».',
    son: '« son » est un déterminant devant un nom : on peut le remplacer par « mon ».',
  },
  phrases: [
    ...ph('sont', 'Les enfants ___ dans la cour.', 'Mes amis ___ en vacances.', 'Les fleurs ___ jolies.', 'Les oiseaux ___ sur la branche.', 'Mes chaussures ___ trop petites.', 'Les élèves ___ prêts pour la dictée.', 'Les pommes ___ mûres.', 'Où ___ mes lunettes ?'),
    ...ph('son', 'Léo range ___ cartable.', 'Nora promène ___ chien.', 'Le chat boit ___ lait.', 'Inès prête ___ vélo à Tom.', 'Hugo cherche ___ ballon.', 'Mamie arrose ___ jardin.', 'Le pirate cache ___ trésor.', 'Elle fête ___ anniversaire.'),
  ],
};

const ONT: Serie = {
  id: 'ont',
  mots: ['on', 'ont'],
  astuce: 'Remplace par « avaient » : si ça marche, écris « ont » ; si tu peux dire « il », écris « on ».',
  regles: {
    ont: '« ont » est le verbe avoir : on peut le remplacer par « avaient ».',
    on: '« on » est un pronom sujet : on peut le remplacer par « il ».',
  },
  phrases: [
    ...ph('ont', 'Les enfants ___ un chien.', 'Mes cousins ___ gagné le match.', 'Les oiseaux ___ construit un nid.', 'Léa et Tom ___ faim.', 'Ils ___ peur de l’orage.', 'Les élèves ___ fini le dessin.', 'Mes parents ___ une grande maison.'),
    ...ph('on', 'Le samedi, ___ va au marché.', '___ joue dans la cour.', 'Demain, ___ ira à la plage.', 'Quand il pleut, ___ reste à la maison.', '___ entend chanter les oiseaux.', 'Ce soir, ___ regarde un film.', 'Hourra, ___ a gagné !'),
  ],
};

const CES: Serie = {
  id: 'ces',
  mots: ['ces', 'ses'],
  astuce: 'Si tu peux dire « les siens » ou « les siennes », écris « ses » ; si on montre les choses (ces… -là), écris « ces ».',
  regles: {
    ces: '« ces » sert à montrer : au singulier, on dirait « ce » ou « cette ».',
    ses: '« ses » veut dire « les siens » ou « les siennes » : on peut le remplacer par « mes ».',
  },
  phrases: [
    ...ph('ces', '___ montagnes-là sont très hautes.', 'Regarde ___ étoiles, là-haut !', '___ nuages noirs annoncent la pluie.', 'Combien coûtent ___ pommes-ci ?', 'Je n’ai jamais vu ___ oiseaux-là.'),
    ...ph('ses', 'Léa se brosse ___ dents.', 'L’oiseau ouvre ___ ailes.', 'Mamie met ___ lunettes pour lire.', 'Le lapin dresse ___ oreilles.', 'Le chat lèche ___ pattes.'),
  ],
};

const CES4: Serie = {
  id: 'ces4',
  mots: ['ces', 'ses', 'c’est', 's’est'],
  astuce: 'c’est = cela est ; s’est = devant un participe (il s’est caché) ; ses = les siens ; ces = on montre.',
  regles: {
    ...CES.regles,
    'c’est': '« c’est » veut dire « cela est » : on peut le remplacer par « c’était ».',
    's’est': '« s’est » se trouve devant un participe passé, avec un verbe comme « se cacher » : je me suis caché, il s’est caché.',
  },
  phrases: [
    ...CES.phrases,
    ...ph('c’est', '___ mon anniversaire aujourd’hui.', '___ une belle journée.', 'Regarde, ___ le facteur !', '___ toi qui commences la partie.'),
    ...ph('s’est', 'Le chat ___ caché sous le lit.', 'Léa ___ levée très tôt.', 'Mon frère ___ fait mal au genou.', 'Le chien ___ endormi au soleil.', 'La fusée ___ envolée.'),
  ],
};

const OU: Serie = {
  id: 'ou',
  mots: ['ou', 'où'],
  astuce: 'Remplace par « ou bien » : si ça marche, écris « ou » sans accent ; si on parle d’un lieu, écris « où ».',
  regles: {
    ou: '« ou » sans accent veut dire « ou bien » : il propose un choix.',
    où: '« où » avec un accent indique un lieu (ou un moment) : on ne peut pas dire « ou bien ».',
  },
  phrases: [
    ...ph('ou', 'Tu veux du lait ___ du jus ?', 'Il viendra lundi ___ mardi.', 'Préfères-tu le chocolat ___ la vanille ?', 'Nous irons à la plage ___ à la piscine.', 'C’est vrai ___ c’est faux ?'),
    ...ph('où', '___ est mon cahier ?', 'Je sais ___ se cache le chat.', 'La maison ___ j’habite est grande.', '___ vas-tu ?', 'Voici le parc ___ nous jouons.'),
  ],
};

const LEUR: Serie = {
  id: 'leur',
  mots: ['leur', 'leurs'],
  astuce: 'Devant un verbe, « leur » ne prend jamais de s. Devant un nom, « leur » s’accorde : leurs devant un nom pluriel.',
  regles: {
    leur: '« leur » s’écrit sans s.',
    leurs: '« leurs » est un déterminant devant un nom pluriel : il prend un s.',
  },
  phrases: [
    ...['Je ___ donne un gâteau.', 'La maîtresse ___ lit une histoire.', 'Nous ___ avons écrit une lettre.', 'Le guide ___ montre le chemin.'].map((p) => ({ p, r: 'leur', note: '« leur » est placé devant un verbe : c’est un pronom (= à eux, à elles), il ne prend jamais de s.' })),
    ...['Les enfants rangent ___ chambre.', 'Mes voisins promènent ___ chien.', 'Les élèves ouvrent ___ cahier.'].map((p) => ({ p, r: 'leur', note: '« leur » est devant un nom singulier : il reste au singulier, sans s.' })),
    ...['Les enfants rangent ___ jouets.', 'Mes cousins ont perdu ___ clés.', 'Les oiseaux nourrissent ___ petits.', 'Les élèves sortent ___ crayons.'].map((p) => ({ p, r: 'leurs', note: '« leurs » est devant un nom pluriel : il prend un s.' })),
  ],
};

const CE: Serie = {
  id: 'ce',
  mots: ['ce', 'se'],
  astuce: 'Devant un nom, écris « ce » (ce chien). Devant un verbe, écris « se » (il se lave, comme je me lave).',
  regles: {
    ce: '« ce » est un déterminant devant un nom : on peut dire « ce… -ci ».',
    se: '« se » est devant un verbe : avec « je », on dirait « me » (je me lave).',
  },
  phrases: [
    ...ph('ce', '___ chien est très gentil.', 'J’aime beaucoup ___ livre.', '___ matin, il fait froid.', 'Regarde ___ beau château !'),
    ...ph('se', 'Il ___ lave les mains.', 'Les enfants ___ cachent derrière l’arbre.', 'Le chat ___ promène sur le toit.', 'Elle ___ prépare pour la fête.'),
  ],
};

const QUAND: Serie = {
  id: 'quand',
  mots: ['quand', 'quant', 'qu’en'],
  astuce: 'quand = lorsque ; quant à = pour ce qui est de ; qu’en = que + en.',
  regles: {
    quand: '« quand » indique le moment : on peut le remplacer par « lorsque ».',
    quant: '« quant » est toujours suivi de « à » ou « aux » : quant à moi.',
    'qu’en': '« qu’en » = « que » + « en » (ne… qu’en = seulement en ; qu’en penses-tu ?).',
  },
  phrases: [
    ...ph('quand', '___ il pleut, je prends mon parapluie.', '___ viendras-tu nous voir ?', 'Je lis ___ j’ai fini mes devoirs.'),
    ...ph('quant', '___ à moi, je préfère la mer.', '___ à mon frère, il dort encore.', 'Léa aime le chocolat ; ___ à Tom, il préfère la vanille.'),
    ...ph('qu’en', 'Elle ne voyage ___ train.', '___ penses-tu ?', 'Il ne sort ___ vélo.'),
  ],
};

const PEU: Serie = {
  id: 'peu',
  mots: ['peu', 'peut', 'peux'],
  astuce: 'Remplace par « pouvait » : si ça marche, c’est le verbe pouvoir (peut avec il, peux avec je ou tu).',
  regles: {
    peu: '« peu » est le contraire de « beaucoup ».',
    peut: '« peut » est le verbe pouvoir avec il, elle ou on : on peut dire « pouvait ».',
    peux: '« peux » est le verbe pouvoir avec je ou tu.',
  },
  phrases: [
    ...ph('peu', 'Il reste un ___ de gâteau.', 'Il y a ___ de monde au parc.', 'Attends un ___ !'),
    ...ph('peut', 'Léa ___ venir avec nous.', 'Le chat ___ sauter très haut.', 'On ___ jouer dehors.'),
    ...ph('peux', 'Tu ___ m’aider ?', 'Je ___ porter ce sac.', 'Est-ce que je ___ sortir ?'),
  ],
};

const SANS: Serie = {
  id: 'sans',
  mots: ['sans', 's’en', 'cent'],
  astuce: 'sans = le contraire de avec ; s’en = se + en, devant un verbe (il s’en va) ; cent = le nombre 100.',
  regles: {
    sans: '« sans » est le contraire de « avec ».',
    's’en': '« s’en » = « se » + « en », devant un verbe : il s’en va (je m’en vais).',
    cent: '« cent » est un nombre : 100.',
  },
  phrases: [
    ...ph('sans', 'Il est sorti ___ son manteau.', 'Je bois mon chocolat ___ sucre.', 'Elle a réussi ___ aide.'),
    ...ph('s’en', 'Le chat ___ va.', 'Mon grand-père ___ souvient très bien.', 'Il a fini le gâteau ; il ___ régale encore.'),
    ...ph('cent', 'Ce livre a ___ pages.', 'Il y a ___ élèves dans l’école.', 'Le pont mesure ___ mètres.'),
  ],
};

/* ------------------------------------------------------------------ */
/* -é / -er / -ez / -ait / -ais : construit avec le moteur              */
/* ------------------------------------------------------------------ */

const VERBES_E = PREMIER_SIMPLES.filter((v) => !/^[aeéiouyh]/.test(v.inf) && !v.etat);

function phraseTerminaison(rng: Rng): Phrase {
  const v = rng.pick(VERBES_E);
  const compl = rng.pick(v.compl);
  const nom = rng.pick(PRENOMS).texte;
  const cas = rng.pick(['inf', 'inf2', 'pp', 'ez', 'ait', 'ais'] as const);
  const inf = v.inf;
  switch (cas) {
    case 'inf':
      return { p: `${nom} va ___ ${compl}.`, r: inf, note: `Après « va », le verbe est à l’infinitif : on peut dire « va vendre » → ${inf}.` };
    case 'inf2':
      return { p: `Il faut ___ ${compl}.`, r: inf, note: `Après « il faut », le verbe est à l’infinitif : on peut dire « il faut vendre » → ${inf}.` };
    case 'pp':
      return { p: `${nom} a ___ ${compl}.`, r: participePasse(inf), note: `Après l’auxiliaire avoir, c’est le participe passé : on peut dire « a vendu » → ${participePasse(inf)}.` };
    case 'ez':
      return { p: `Vous ___ ${compl}.`, r: conjuguer(inf, 'present', 4), note: `Avec « vous », le verbe se termine par -ez : vous vendez → ${conjuguer(inf, 'present', 4)}.` };
    case 'ait':
      return { p: `Autrefois, ${nom} ___ ${compl}.`, r: conjuguer(inf, 'imparfait', 2), note: `À l’imparfait, avec il ou elle, le verbe se termine par -ait : il vendait → ${conjuguer(inf, 'imparfait', 2)}.` };
    case 'ais':
      return { p: `Autrefois, tu ___ ${compl}.`, r: conjuguer(inf, 'imparfait', 1), note: `À l’imparfait, avec tu, le verbe se termine par -ais : tu vendais → ${conjuguer(inf, 'imparfait', 1)}.` };
  }
}

function serieTerminaison(rng: Rng): { serie: Serie; phrase: Phrase } {
  const phrase = phraseTerminaison(rng);
  const radical = phrase.r.replace(/(er|é|ez|ait|ais)$/, '');
  const mots = [`${radical}é`, `${radical}er`, `${radical}ez`, `${radical}ait`, `${radical}ais`];
  return {
    phrase,
    serie: {
      id: 'terminaisons',
      mots,
      astuce: 'Remplace par « vendre », « vendu », « vendez » ou « vendait » pour trouver la bonne terminaison.',
      regles: {},
      phrases: [phrase],
    },
  };
}

/* ------------------------------------------------------------------ */
/* Niveaux                                                             */
/* ------------------------------------------------------------------ */

type Choix = Serie | 'terminaisons';

const SERIES: Record<'CE1' | 'CM2', Record<Level, Choix[]>> = {
  CE1: {
    facile: [A, EST],
    normal: [A, EST, SONT, ONT],
    plus_loin: [A, EST, SONT, ONT, CES, OU],
  },
  CM2: {
    facile: [A, EST, SONT, ONT],
    normal: [A, EST, SONT, ONT, CES4, LEUR, OU, CE, 'terminaisons', 'terminaisons'],
    plus_loin: [CES4, LEUR, CE, 'terminaisons', QUAND, QUAND, PEU, PEU, SANS, SANS],
  },
};

const DIFF: Record<Level, number> = { facile: 0.25, normal: 0.5, plus_loin: 0.75 };

/** Met la réponse et les choix en majuscule si le trou ouvre la phrase. */
const enTete = (p: string) => p.startsWith('___');
const cap = (mot: string, tete: boolean) => (tete ? majuscule(mot) : mot);

function tirage(classe: 'CE1' | 'CM2', level: Level, rng: Rng): { serie: Serie; phrase: Phrase } {
  const c = rng.pick(SERIES[classe][level]);
  if (c === 'terminaisons') return serieTerminaison(rng);
  return { serie: c, phrase: rng.pick(c.phrases) };
}

function explicationDe(serie: Serie, phrase: Phrase): string {
  const complete = phrase.p.replace('___', phrase.r);
  return `${phrase.note ?? serie.regles[phrase.r] ?? ''} → ${majuscule(complete)}`.trim();
}

function homTrou(classe: 'CE1' | 'CM2') {
  return (level: Level, rng: Rng, ctx: GenContext): ItemOf<'fill_blank'> => {
    const { serie, phrase } = tirage(classe, level, rng);
    const t = enTete(phrase.p);
    return trou(ctx, rng, serie.id, {
      sentence: phrase.p,
      answer: cap(phrase.r, t),
      wrong: serie.mots.map((m) => cap(m, t)),
      nbChoix: serie.mots.length,
      hint: serie.astuce,
      explication: explicationDe(serie, phrase),
      difficulty: DIFF[level],
    });
  };
}

function homVraiFaux(classe: 'CE1' | 'CM2') {
  return (level: Level, rng: Rng, ctx: GenContext): ItemOf<'true_false'> => {
    const { serie, phrase } = tirage(classe, level, rng);
    const vrai = rng.chance(0.5);
    const montre = vrai ? phrase.r : rng.pick(serie.mots.filter((m) => m !== phrase.r));
    return vraiFaux(ctx, serie.id, {
      statement: `Cette phrase est bien écrite : « ${majuscule(phrase.p.replace('___', montre))} »`,
      answer: vrai,
      explication: explicationDe(serie, phrase),
      difficulty: DIFF[level],
    });
  };
}

function homQcm(classe: 'CE1' | 'CM2') {
  return (level: Level, rng: Rng, ctx: GenContext): ItemOf<'mcq'> => {
    const { serie, phrase } = tirage(classe, level, rng);
    const ecrite = (m: string) => majuscule(phrase.p.replace('___', m));
    return mcq(ctx, rng, serie.id, {
      question: 'Quelle phrase est bien écrite ?',
      good: ecrite(phrase.r),
      wrong: serie.mots.filter((m) => m !== phrase.r).map(ecrite),
      max: Math.min(4, serie.mots.length),
      explication: explicationDe(serie, phrase),
      difficulty: DIFF[level],
    });
  };
}

export const HOMOPHONES: Record<string, LessonContent> = {
  'CE1.FR.GRAM.HOMOPHONES': { gens: { fill_blank: homTrou('CE1'), true_false: homVraiFaux('CE1'), mcq: homQcm('CE1') } },
  'CM2.FR.ORTH.HOMOPHONES': { gens: { fill_blank: homTrou('CM2'), true_false: homVraiFaux('CM2'), mcq: homQcm('CM2') } },
};

/** Pour les tests : toutes les séries écrites à la main. */
export const SERIES_HOMOPHONES: Serie[] = [A, EST, SONT, ONT, CES, CES4, OU, LEUR, CE, QUAND, PEU, SANS];
