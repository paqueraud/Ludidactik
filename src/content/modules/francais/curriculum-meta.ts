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
const BO_CM2 = 'BO n°16 du 17/04/2025 — Programme de français du cycle 3, CM2';

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
      'Entre deux voyelles, s fait [z] ; devant e, i, y, c fait [s] et g fait « j » ; ç, ge et gu gardent le bon son devant a, o, u.',
    niveaux: {
      facile: 'deux sons, mots courants',
      normal: 'classement par analogie ; choisir ç, ge ou gu',
      plus_loin: 'ç, ge, gu dans des mots plus rares, trois choix',
    },
    boRef: `${BO_CE1} — Lecture : listes analogiques ça / glaçon / garçon (valeurs positionnelles de c, g, s)`,
    contenus:
      's = [s] ou [z], c = [k] ou [s], g = [g] ou « j » ; ç, ge, gu ; paires poisson / poison, dessert / désert.',
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

  /* ------------------------------ CM2 ------------------------------ */
  'CM2.FR.LEC.FLUENCE': {
    titre: 'Lire à voix haute avec fluidité',
    rappel: 'Je lis par groupes de sens, je respecte la ponctuation et je fais les liaisons.',
    niveaux: {
      facile: '90 mots par minute',
      normal: '120 mots par minute (attendu de fin de CM2), liaisons et ponctuation',
      plus_loin: '130 mots par minute (attendu de 6e), liaisons interdites',
    },
    boRef: `${BO_CM2} — Lecture : lire correctement en ciblant 120 mots par minute en moyenne`,
    contenus:
      'Karaoké de lecture sur des textes originaux ou du patrimoine (data/lecture/textes.json) ; liaisons obligatoires et interdites.',
    generateur: 'francais/lecture-fluence',
  },
  'CM2.FR.LEC.COMP': {
    titre: 'Comprendre un texte : ce qui est dit et ce qu’on devine',
    rappel:
      'Je cherche dans le texte les indices qui prouvent ma réponse, même quand elle n’est pas écrite directement.',
    niveaux: {
      facile: 'textes courts, informations explicites et premières inférences',
      normal: 'textes longs (récit, documentaire, fable) : implicite, inférences, reprises',
      plus_loin: 'documents composites : rapprocher deux documents',
    },
    boRef: `${BO_CM2} — Lecture : restituer l’essentiel d’un texte qui contient des informations explicites et implicites ; rapprocher deux documents`,
    contenus:
      'Textes originaux et du patrimoine (La Fontaine, d’après Victor Hugo) ; preuve dans le texte ; genres ; ordre des étapes.',
    generateur: 'francais/lecture-comprehension',
  },
  'CM2.FR.LEC.CULTURE': {
    titre: 'Culture littéraire : héros, contes, fables et romans',
    rappel:
      'Je reconnais les grandes œuvres, leurs auteurs et leur genre : conte, fable, roman, poème, théâtre.',
    niveaux: {
      facile: 'personnages et contes célèbres',
      normal: 'genres, œuvres et auteurs ; morales de La Fontaine',
      plus_loin: 'théâtre, poésie, romans d’aventure ; citations',
    },
    boRef: `${BO_CM2} — Lecture et culture littéraire : lire au moins 3 œuvres du patrimoine (héros et héroïnes, merveilleux, morale, poésie)`,
    contenus:
      'Œuvres du domaine public (La Fontaine, Perrault, Grimm, Andersen, Verne, Hugo, Carroll, Collodi, Homère, Molière) ; personnages mystères (indices).',
    generateur: 'francais/lecture-culture',
  },
  'CM2.FR.GRAM.TYPES': {
    titre: 'Types et formes de phrases',
    rappel:
      'Une phrase a un type (déclaratif, interrogatif, impératif) et une ou plusieurs formes (négative, exclamative) ; aux temps composés, la négation encadre l’auxiliaire.',
    niveaux: {
      facile: 'ponctuation et types de phrases',
      normal: 'transformer : forme négative, y compris aux temps composés',
      plus_loin: 'ne… jamais, ne… rien, personne ne… ; phrases à plusieurs formes',
    },
    boRef: `${BO_CM2} — Grammaire : connaître les trois types de phrases et leurs formes (corpus de plus en plus complexes)`,
    contenus:
      'Ponctuation (Feu tricolore), types, transformation négative (négation aux temps composés), questions avec inversion.',
    generateur: 'francais/grammaire-types',
  },
  'CM2.FR.GRAM.SUJET': {
    titre: 'Trouver le sujet, même quand il est après le verbe',
    rappel:
      'Pour trouver le sujet, je demande « Qui est-ce qui… ? » devant le verbe : il peut être placé après le verbe (sujet inversé).',
    niveaux: {
      facile: 'sujets variés : groupe nominal, pronom, nom propre',
      normal: 'sujet inversé simple (Dans la forêt vivait un bûcheron)',
      plus_loin: 'sujet inversé dans des phrases plus longues, sujet infinitif',
    },
    boRef: `${BO_CM2} — Grammaire : consolider les types de sujets ; identifier le sujet inversé dans des cas simples`,
    contenus:
      'Nature des sujets (GN, pronom, nom propre, infinitif) ; sujet inversé ; manipulations du Labo des fonctions.',
    generateur: 'francais/grammaire-sujet',
  },
  'CM2.FR.GRAM.GROUPES': {
    titre: 'Groupe sujet, groupe verbal, groupe circonstanciel',
    rappel:
      'Le groupe sujet dit de qui on parle, le groupe verbal ce qu’on en dit ; le groupe circonstanciel se déplace et se supprime.',
    niveaux: {
      facile: 'groupe sujet et groupe verbal',
      normal: 'avec le groupe circonstanciel',
      plus_loin: 'phrases longues à plusieurs groupes circonstanciels',
    },
    boRef: `${BO_CM2} — Grammaire : consolider l’identification du groupe sujet, du groupe verbal, du groupe circonstanciel`,
    contenus: 'Découpage en groupes, déplacement et suppression (Labo des fonctions).',
    generateur: 'francais/grammaire-groupes',
  },
  'CM2.FR.GRAM.COD_COI': {
    titre: 'Le COD et le COI',
    rappel:
      'Le COD suit le verbe sans préposition (le, la, les) ; le COI est introduit par à ou de (lui, leur, en).',
    niveaux: {
      facile: 'reconnaître le COD',
      normal: 'COD ou COI ; les remplacer par un pronom (le, la, les, lui, leur, en)',
      plus_loin: 'phrases à plusieurs compléments',
    },
    boRef: `${BO_CM2} — Grammaire : différencier COD et COI ; identifier les pronoms personnels compléments d’objet`,
    contenus: 'Labo des fonctions (remplacement par un pronom) ; pronoms compléments au niveau normal.',
    generateur: 'francais/grammaire-cod-coi',
  },
  'CM2.FR.GRAM.ATTRIBUT': {
    titre: 'L’attribut du sujet',
    rappel:
      'Après un verbe d’état (être, sembler, devenir, paraître, rester), l’attribut dit comment est le sujet ; ce n’est pas un COD.',
    niveaux: {
      facile: 'avec le verbe être',
      normal: 'attribut ou COD ?',
      plus_loin: 'sembler, devenir, paraître, rester…',
    },
    boRef: `${BO_CM2} — Grammaire : différencier attribut du sujet et complément d’objet`,
    contenus: 'Verbes d’état ; contrastes « Mon frère devient champion / regarde un champion ».',
    generateur: 'francais/grammaire-attribut',
  },
  'CM2.FR.GRAM.CC': {
    titre: 'Les compléments circonstanciels : quand, où, pourquoi',
    rappel:
      'Le CC de temps répond à « quand ? », le CC de lieu à « où ? », le CC de cause à « pourquoi ? » ; on peut le déplacer ou le supprimer.',
    niveaux: {
      facile: 'temps et lieu',
      normal: 'temps, lieu et cause',
      plus_loin: 'avec la manière (notion de 6e)',
    },
    boRef: `${BO_CM2} — Grammaire : différencier les compléments circonstanciels de temps, de lieu, de cause`,
    contenus: 'Classement de CC (avec contexte), Labo des fonctions, question associée.',
    generateur: 'francais/grammaire-cc',
  },
  'CM2.FR.GRAM.NATURE_FONCTION': {
    titre: 'Nature ou fonction ?',
    rappel:
      'La nature dit ce qu’est le mot (nom, verbe…) ; la fonction dit le rôle qu’il joue dans la phrase (sujet, COD…).',
    niveaux: {
      facile: 'trouver la nature',
      normal: 'distinguer nature et fonction',
      plus_loin: 'nature et fonction d’un même groupe',
    },
    boRef: `${BO_CM2} — Grammaire : connaître et distinguer les notions de nature et de fonction`,
    contenus: 'Tri d’étiquettes nature / fonction ; analyse de groupes dans des phrases.',
    generateur: 'francais/grammaire-nature-fonction',
  },
  'CM2.FR.GRAM.CLASSES': {
    titre: 'Prépositions, conjonctions et pronoms',
    rappel:
      'La préposition introduit un groupe (dans la boîte), la conjonction de subordination une proposition (quand il pleut) ; le pronom personnel change selon sa fonction (il, le, lui).',
    niveaux: {
      facile: 'prépositions et pronoms',
      normal: 'prépositions, conjonctions de subordination, pronoms sujets et compléments',
      plus_loin: 'avec les adverbes et les pronoms relatifs',
    },
    boRef: `${BO_CM2} — Grammaire : identifier les prépositions, les conjonctions de subordination, les pronoms personnels sujets et compléments`,
    contenus: 'Mots donnés dans leur phrase (Chef d’orchestre) ; variations du pronom personnel.',
    generateur: 'francais/grammaire-classes',
  },
  'CM2.FR.GRAM.GN': {
    titre: 'Enrichir le nom : épithète et complément du nom',
    rappel:
      'Pour enrichir un nom, j’ajoute un adjectif épithète (une pomme rouge) ou un complément du nom introduit par une préposition (une tasse en porcelaine).',
    niveaux: {
      facile: 'adjectif épithète ou complément du nom',
      normal: 'épithète, complément du nom, attribut du sujet',
      plus_loin: 'avec la proposition relative (6e)',
    },
    boRef: `${BO_CM2} — Grammaire : aborder l’expansion du nom et le complément du nom ; différencier épithète et attribut du sujet`,
    contenus: 'Expansions du nom, épithète / attribut (Labo des fonctions), compléter un nom.',
    generateur: 'francais/grammaire-gn',
  },
  'CM2.FR.GRAM.COMPLEXE': {
    titre: 'Phrase simple ou phrase complexe ?',
    rappel: 'Je compte les verbes conjugués : un seul, la phrase est simple ; plusieurs, elle est complexe.',
    niveaux: {
      facile: 'compter les verbes conjugués',
      normal: 'distinguer phrase simple et phrase complexe (pièges : infinitif, temps composés)',
      plus_loin: 'propositions juxtaposées, coordonnées, subordonnées (6e)',
    },
    boRef: `${BO_CM2} — Grammaire : distinguer phrase simple et phrase complexe à partir du repérage des verbes conjugués`,
    contenus:
      'Compter les verbes conjugués ; classer des phrases ; liaison des propositions en Pour aller plus loin.',
    generateur: 'francais/grammaire-complexe',
  },
  'CM2.FR.ORTH.MOTS': {
    titre: 'Les mots à savoir écrire',
    rappel:
      'Je pense aux familles de mots et aux régularités (consonnes doubles, -tion/-sion) pour bien écrire.',
    niveaux: {
      facile: 'mots courants de révision',
      normal: 'listes du CM2 : invariables, consonnes doubles, -tion / -sion',
      plus_loin: 'mots difficiles (6e)',
    },
    boRef: `${BO_CM2} — Vocabulaire : écrire correctement les mots fréquents en s’appuyant sur les régularités et la formation`,
    contenus:
      'Listes data/dictees/cm2_mots.json (avec définitions) ; mot ↔ définition ; classement par régularité ou par sens.',
  },
  'CM2.FR.VOC.POLYSEMIE': {
    titre: 'Les mots qui ont plusieurs sens',
    rappel: 'Un mot peut avoir plusieurs sens : c’est la phrase qui me dit lequel choisir.',
    niveaux: {
      facile: 'mots à deux sens',
      normal: 'mots à plusieurs sens dans des contextes variés',
      plus_loin: 'homonymes (ver, verre, vert)',
    },
    boRef: `${BO_CM2} — Vocabulaire : approfondir la notion de polysémie ; utiliser les mots polysémiques dans différents contextes`,
    contenus: 'Feuille, carte, pièce, opération, racine, volume… ; homonymes en Pour aller plus loin.',
    generateur: 'francais/vocabulaire-polysemie',
  },
  'CM2.FR.VOC.MORPHO': {
    titre: 'Familles de mots, préfixes et suffixes',
    rappel: 'Les mots d’une même famille ont le même radical ; préfixes et suffixes changent le sens du mot.',
    niveaux: {
      facile: 'familles de mots, intrus',
      normal: 'préfixes et suffixes, sens des mots dérivés',
      plus_loin: 'racines grecques et latines ; mots simples, dérivés, composés (6e)',
    },
    boRef: `${BO_CM2} — Vocabulaire : approfondir les relations morphologiques et sémantiques entre les mots`,
    contenus: 'Radicaux, affixes (re-, dé-, pré-, -able, -ment…), racines (hydro-, géo-, -logie, -vore).',
    generateur: 'francais/vocabulaire-morphologie',
  },
  'CM2.FR.VOC.UNIVERS': {
    titre: 'Les mots des sciences, de l’histoire, des arts…',
    rappel: 'Les mots de chaque matière ont un sens précis : je les apprends avec leur orthographe.',
    niveaux: {
      facile: 'deux domaines',
      normal: 'définitions des mots de chaque domaine',
      plus_loin: 'réemployer le mot précis dans une phrase',
    },
    boRef: `${BO_CM2} — Vocabulaire : acquérir un vocabulaire précis dans différents univers de référence`,
    contenus: 'Histoire, sciences, mathématiques, arts, émotions ; listes data/dictees/cm2_mots.json.',
    generateur: 'francais/vocabulaire-univers',
  },
  'CM2.FR.VOC.DICO': {
    titre: 'Utiliser le dictionnaire',
    rappel:
      'Dans le dictionnaire, les mots sont rangés lettre après lettre ; l’article donne la nature du mot et ses sens numérotés.',
    niveaux: {
      facile: 'ordre alphabétique, abréviations',
      normal: 'lire un article : abréviations et sens',
      plus_loin: 'choisir le bon sens selon la phrase',
    },
    boRef: `${BO_CM2} — Vocabulaire : utiliser des dictionnaires`,
    contenus:
      'Ordre alphabétique (jusqu’à la 4e lettre), n. m., n. f., v., adj., syn., contr. ; sens numérotés.',
    generateur: 'francais/vocabulaire-dictionnaire',
  },
  'CM2.FR.VOC.SYN_ANT': {
    titre: 'Synonymes, antonymes et nuances',
    rappel:
      'Un synonyme a presque le même sens, un antonyme le sens contraire ; je choisis le mot le plus juste.',
    niveaux: {
      facile: 'synonymes et antonymes courants',
      normal: 'nuances (fatigué, épuisé)',
      plus_loin: 'registres de langue (familier, courant, soutenu)',
    },
    boRef: `${BO_CM2} — Vocabulaire : réemployer le vocabulaire étudié (synonymes et antonymes : objectif explicite de 6e)`,
    contenus: 'Paires de synonymes et d’antonymes, gradations, registres.',
    generateur: 'francais/vocabulaire-synonymes',
  },
};
