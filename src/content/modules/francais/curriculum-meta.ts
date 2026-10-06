/**
 * Métadonnées des leçons de ce module dans data/curriculum/*.json (titre d'enfant, rappel, niveaux,
 * référence BO, source). Source unique utilisée pour mettre à jour les curriculums ; les tests vérifient
 * que les curriculums restent alignés avec ce fichier.
 */
import type { Level } from '../../schemas';

export interface MetaLecon {
  titre: string;
  rappel: string;
  niveaux: Record<Level, string>;
  boRef: string;
  contenus: string;
  /** Nom informatif du générateur (« francais/<nom> ») ; absent = la leçon garde sa source (liste de mots). */
  generateur?: string;
  periodes?: number[];
}

const BO_CE1 = 'BO n°41 du 31/10/2024 — Programme de français du cycle 2, CE1';
export const BO_CM2 = 'BO n°16 du 17/04/2025 — Programme de français du cycle 3, CM2';

export const META: Record<string, MetaLecon> = {
  /* ------------------------------ CE1 ------------------------------ */
  'CE1.FR.LEC.CGP': {
    titre: 'Lire les sons complexes (ou, an, oi, gn, ill, ph…)',
    rappel:
      'Certains sons s’écrivent avec plusieurs lettres (ou, an, oi, gn, ph…) : je les repère pour bien lire et bien écrire.',
    niveaux: {
      facile: 'syllabes simples, sons proches deux par deux',
      normal: 'tous les sons complexes, mots inventés (doir, stag, choust…)',
      plus_loin: 'mots rares, lettres muettes, sons inattendus (oignon, monsieur, femme)',
    },
    boRef: `${BO_CE1} — Lecture : identifier les mots de manière de plus en plus aisée (décoder toutes les CGP)`,
    contenus:
      'Correspondances graphèmes-phonèmes complexes : ou, on, an/en, in/ain/ein, oi, eu/œu, au/eau, ch, gn, ill, ail/eil/euil, ph, -tion ; pseudo-mots du BO (doir, stag, choust, valin, cagnou).',
    generateur: 'francais/lecture-cgp',
  },
  'CE1.FR.LEC.SC': {
    titre: 'Les lettres s, c, g qui changent de son (ç, ge, gu)',
    rappel:
      'Entre deux voyelles, s fait [z] ; devant e, i, y, c fait [s] et g fait [j] ; ç, ge et gu gardent le bon son devant a, o, u.',
    niveaux: {
      facile: 'deux sons, mots courants',
      normal: 'classement par analogie ; choisir ç, ge ou gu',
      plus_loin: 'ç, ge, gu dans des mots plus rares, trois choix',
    },
    boRef: `${BO_CE1} — Lecture : listes analogiques ça / glaçon / garçon (valeurs positionnelles de c, g, s)`,
    contenus:
      's = [s] ou [z], c = [k] ou [s], g = [g] ou [ʒ] ; ç, ge, gu ; paires poisson / poison, dessert / désert.',
    generateur: 'francais/lecture-scg',
  },
  'CE1.FR.LEC.FLUENCE': {
    titre: 'Lire à voix haute avec fluidité',
    rappel: 'Je lis par groupes de mots, je respire aux points et je mets le ton aux « ! » et aux « ? ».',
    niveaux: {
      facile: '35 mots par minute, textes courts',
      normal: '70 mots par minute (attendu de fin de CE1), ponctuation respectée',
      plus_loin: '90 mots par minute (attendu du CE2), lecture expressive',
    },
    boRef: `${BO_CE1} — Lecture : lire à voix haute un texte adapté avec une vitesse de 70 mots par minute`,
    contenus:
      'Karaoké de lecture sur des textes originaux (data/lecture/textes.json) ; groupes de souffle et ponctuation.',
    generateur: 'francais/lecture-fluence',
  },
  'CE1.FR.LEC.COMP': {
    titre: 'Comprendre un texte',
    rappel: 'Pour répondre, je retourne dans le texte et je cherche la phrase qui me donne la preuve.',
    niveaux: {
      facile: 'textes de 5 lignes, la réponse est écrite dans le texte',
      normal: 'textes d’une quinzaine de lignes : inférences simples, reprises (il, elle, le…), justifier',
      plus_loin: 'textes documentaires et règles du jeu : trouver un titre, choisir un résumé',
    },
    boRef: `${BO_CE1} — Lecture : comprendre en autonomie un texte narratif, informatif ou prescriptif d’une quinzaine de lignes`,
    contenus:
      'Textes originaux narratifs, documentaires et prescriptifs ; questions explicites, inférences, chaîne anaphorique, preuve dans le texte ; ordre des étapes.',
    generateur: 'francais/lecture-comprehension',
  },
  'CE1.FR.ORTH.MOTS_FREQ': {
    titre: 'Les mots à savoir écrire',
    rappel: 'J’écoute bien chaque syllabe, j’écris le mot, puis je le relis lettre par lettre.',
    niveaux: {
      facile: 'mots courts et réguliers',
      normal: 'listes de l’année : école, maison, corps, nature',
      plus_loin: 'mots longs ou irréguliers (bibliothèque, rhinocéros…)',
    },
    boRef: `${BO_CE1} — Vocabulaire : mémoriser l’orthographe des mots réguliers et irréguliers fréquemment rencontrés`,
    contenus:
      'Listes data/dictees/ce1_mots.json (avec définitions pour les mots croisés) ; mot ↔ définition ; classement par thème.',
  },
  'CE1.FR.GRAM.PHRASE': {
    titre: 'La phrase et ses groupes de mots',
    rappel:
      'Une phrase commence par une majuscule et finit par un point ; elle a un groupe sujet (de qui on parle) et un verbe (ce qu’il fait).',
    niveaux: {
      facile: 'majuscule, point, remettre les mots dans l’ordre',
      normal: 'groupe sujet, verbe, compléments ; déplacer et supprimer un groupe',
      plus_loin: 'phrases plus longues, groupe déplacé en tête avec une virgule',
    },
    boRef: `${BO_CE1} — Grammaire : identifier la phrase simple, groupe sujet, verbe et compléments ; manipulations`,
    contenus:
      'Groupe sujet (GS), verbe et compléments sans les distinguer ; manipulations du BO : déplacement, suppression, substitution (« Elle mange tous les jours à la cantine → Tous les jours, elle mange à la cantine »).',
    generateur: 'francais/grammaire-phrase',
  },
  'CE1.FR.GRAM.TYPES': {
    titre: 'Les types de phrases : informer, questionner, ordonner',
    rappel:
      'La phrase déclarative finit par un point, la phrase interrogative par un point d’interrogation ; à la forme négative, « ne… pas » encadre le verbe.',
    niveaux: {
      facile: 'ponctuation et type de phrase',
      normal: 'transformer une phrase à la forme négative (ne… pas)',
      plus_loin: 'ne… plus, ne… jamais ; question avec inversion du sujet',
    },
    boRef: `${BO_CE1} — Grammaire : reconnaître les trois types de phrases, les formes négative et exclamative, effectuer des transformations`,
    contenus:
      'Phrases déclaratives, interrogatives, impératives ; formes négative et exclamative ; ponctuation (Feu tricolore) ; transformations.',
    generateur: 'francais/grammaire-types',
  },
  'CE1.FR.GRAM.CLASSES': {
    titre: 'Les classes de mots : nom, verbe, adjectif…',
    rappel:
      'Le nom désigne une personne, un animal ou une chose ; le verbe change avec le temps ; l’adjectif dit comment est le nom ; le déterminant se place devant le nom.',
    niveaux: {
      facile: 'nom ou verbe',
      normal: 'les six classes du CE1 (déterminant, nom commun, nom propre, adjectif, verbe, pronom)',
      plus_loin: 'avec l’adverbe et la préposition (CE2-CM)',
    },
    boRef: `${BO_CE1} — Grammaire : différencier et nommer les principales classes de mots`,
    contenus:
      'Déterminant, nom commun, nom propre, adjectif, verbe, pronom personnel sujet ; mots donnés dans leur phrase (porte : nom ou verbe ?).',
    generateur: 'francais/grammaire-classes',
  },
  'CE1.FR.GRAM.SUBST': {
    titre: 'Remplacer un groupe de mots par un pronom',
    rappel:
      'Pour ne pas répéter, je remplace un groupe de mots par un pronom : il, elle, ils, elles, ou le, la, les, lui, leur devant le verbe.',
    niveaux: {
      facile: 'il, elle, ils, elles',
      normal: 'le, la, les, lui, leur (exemples du BO)',
      plus_loin: 'deux pronoms à la fois (Elle la leur raconte)',
    },
    boRef: `${BO_CE1} — Grammaire : manipulations de phrase, substitution (« Elle la raconte aux enfants → Elle leur raconte une histoire »)`,
    contenus:
      'Substitution pronominale : « La maîtresse raconte une histoire aux enfants → Elle raconte une histoire aux enfants → Elle la raconte aux enfants → Elle leur raconte une histoire » (BO).',
    generateur: 'francais/grammaire-substitution',
  },
  'CE1.FR.VOC.AFFIXES': {
    titre: 'Préfixes et suffixes : fabriquer des mots',
    rappel: 'Un préfixe se place avant le radical (re-faire), un suffixe après (jardin-ier).',
    niveaux: {
      facile: 'le suffixe -eur (chanter → chanteur)',
      normal: 'trier et associer re-, dé-, in-, para-, multi-, anti-, -eur/-euse, -ier ; déduire le sens',
      plus_loin: '-ette, -able, pré-, sous- ; retrouver le mot à partir de son sens',
    },
    boRef: `${BO_CE1} — Vocabulaire : s’appuyer sur la morphologie ; principaux affixes (para, multi, anti, eur/euse, er)`,
    contenus:
      'BO : para (parapluie), multi (multicolore), anti (antivol), eur/euse (chanteur, coiffeuse), er (boulanger, boucher).',
    generateur: 'francais/vocabulaire-affixes',
  },
  'CE1.FR.VOC.CONTRAIRES': {
    titre: 'Les contraires et les synonymes',
    rappel:
      'Un contraire dit l’inverse (visible / invisible, ranger / déranger) ; un synonyme veut dire presque la même chose.',
    niveaux: {
      facile: 'contraires simples (chaud / froid)',
      normal: 'contraires avec in- et dé-, synonymes',
      plus_loin: 'nuances (tiède, chaud, brûlant), contraires en il- et ir-',
    },
    boRef: `${BO_CE1} — Vocabulaire : contraires construits avec in- ou dé- (visible/invisible, ranger/déranger) ; formulations de sens proche`,
    contenus:
      'Contraires, contraires par préfixe, synonymes (« poser une question / demander »), nuances d’intensité.',
    generateur: 'francais/vocabulaire-contraires',
  },
  'CE1.FR.VOC.GENERIQUE': {
    titre: 'Du mot général au mot précis (fruit → pomme)',
    rappel:
      'Un mot générique regroupe toute une catégorie (les fruits) ; un mot spécifique en fait partie (la pomme).',
    niveaux: {
      facile: 'deux niveaux : la catégorie et le mot',
      normal: 'trois ou quatre niveaux : aliment > laitage > fromage > gruyère',
      plus_loin: 'classements à quatre catégories, trouver l’intrus',
    },
    boRef: `${BO_CE1} — Vocabulaire : hiérarchiser termes génériques, de base et spécifiques (aliment > laitage > fromage > gruyère)`,
    contenus:
      'Catégories (fruits, oiseaux, meubles, instruments…) ; chaînes du général au particulier ; intrus.',
    generateur: 'francais/vocabulaire-generique',
  },
  'CE1.FR.VOC.EXPRESSIONS': {
    titre: 'Les expressions imagées (sens propre, sens figuré)',
    rappel: 'Une expression a souvent un sens figuré : « avoir une peur bleue », c’est avoir très peur.',
    niveaux: {
      facile: 'expressions courantes et leur sens',
      normal: 'sens propre ou sens figuré ; expressions du BO',
      plus_loin: 'réemployer une expression dans une phrase',
    },
    boRef: `${BO_CE1} — Vocabulaire : comprendre la différence entre sens propre et sens figuré (avoir une peur bleue, prendre ses jambes à son cou)`,
    contenus: 'Expressions et locutions ; tri sens propre / sens figuré ; réemploi en contexte.',
    generateur: 'francais/vocabulaire-expressions',
  },
  'CE1.FR.VOC.NIVEAUX': {
    titre: 'Parler familier, courant ou soutenu',
    rappel:
      'Je choisis mes mots selon la personne à qui je parle : familier avec les copains, courant avec tout le monde, soutenu dans les grandes occasions.',
    niveaux: {
      facile: 'familier ou courant',
      normal: 'familier, courant, soutenu ; choisir selon la situation',
      plus_loin: 'passer du langage courant au langage soutenu',
    },
    boRef: `${BO_CE1} — Vocabulaire et oral : percevoir les niveaux de langue familier, courant et soutenu`,
    contenus: 'Mots familiers, courants, soutenus ; situations (parler à un camarade, à un adulte inconnu).',
    generateur: 'francais/vocabulaire-niveaux',
  },
  'CE1.FR.VOC.DICO': {
    titre: 'L’ordre alphabétique et le dictionnaire',
    rappel:
      'Dans le dictionnaire, les mots sont rangés dans l’ordre alphabétique : si la 1re lettre est la même, je regarde la 2e, puis la 3e.',
    niveaux: {
      facile: 'ranger selon la première lettre',
      normal: 'même première lettre : regarder la deuxième',
      plus_loin: 'deux lettres communes ; mots-repères en haut des pages',
    },
    boRef: `${BO_CE1} — Vocabulaire : prendre l’habitude de consulter des articles de dictionnaire adapté`,
    contenus: 'Ordre alphabétique (1re, 2e, 3e lettre), avant / après un mot, mots-repères.',
    generateur: 'francais/vocabulaire-dictionnaire',
  },
  'CE1.FR.VOC.THEMES': {
    titre: 'Les mots des thèmes (émotions, école, corps, maison…)',
    rappel: 'J’apprends les mots par thème et je relie chaque mot à sa définition.',
    niveaux: {
      facile: 'deux thèmes, mots courants',
      normal: 'mots et définitions',
      plus_loin: 'mots moins fréquents : jaloux, ambitieux, curieux…',
    },
    boRef: `${BO_CE1} — Vocabulaire : enrichir les réseaux de mots étudiés (cinq corpus par période ; jaloux, ambitieux)`,
    contenus: 'Corpus : émotions, école, corps, maison, nature, métiers ; traits de caractère.',
    generateur: 'francais/vocabulaire-themes',
  },
  'CE1.FR.ORAL.ECOUTE': {
    titre: 'Écouter une consigne et la comprendre',
    rappel: 'J’écoute la consigne jusqu’au bout, je retiens l’ordre des actions, puis je réponds.',
    niveaux: {
      facile: 'consigne courte (une action)',
      normal: 'consigne à deux ou trois actions',
      plus_loin: 'recette, règle du jeu ou consigne longue',
    },
    boRef: `${BO_CE1} — Oral : écouter pour comprendre (réaliser l’action demandée par une consigne, une recette, une règle du jeu)`,
    contenus:
      'Consignes, recettes et règles du jeu entendues (🔊), sans texte écrit ; devinettes et inférences simples (« J’ai pris mon parapluie » → il pleut).',
    generateur: 'francais/oral-ecoute',
  },
  'CE1.FR.ORAL.DIRE': {
    titre: 'Raconter dans l’ordre avec d’abord, ensuite, enfin',
    rappel: 'Pour raconter, j’utilise des mots qui relient les étapes : d’abord, ensuite, puis, enfin.',
    niveaux: {
      facile: 'trois étapes avec d’abord, ensuite, enfin',
      normal: 'quatre étapes avec d’abord, ensuite, puis, enfin',
      plus_loin: 'connecteurs variés : pour commencer, après cela, finalement',
    },
    boRef: `${BO_CE1} — Oral : dire pour être compris (d’abord, pour commencer, ensuite, enfin, pour terminer)`,
    contenus: 'Remettre un récit dans l’ordre, choisir le bon connecteur, le dire à voix haute.',
    generateur: 'francais/oral-dire',
  },
};
