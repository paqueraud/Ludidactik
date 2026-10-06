/**
 * Lexique des phrases de conjugaison : verbes avec des compléments qui conviennent à toutes les personnes
 * et à tous les temps (aucun possessif, aucun pronom qui dépendrait du sujet), sujets variés (pronoms,
 * prénoms, groupes nominaux, filles et garçons à parts égales) et indicateurs de temps.
 */
import type { Personne, Temps } from './moteur';

export interface VerbeLex {
  inf: string;
  compl: readonly string[];
  /** Compléments propres à l'impératif (sinon `compl`). */
  imp?: readonly string[];
  /** Pas d'impératif naturel avec ce verbe (aimer, tomber…). */
  sansImperatif?: boolean;
  /** Verbe d'état ou de goût : au présent, pas d'indicateur d'habitude (« le mercredi »). */
  etat?: boolean;
}

const v = (inf: string, compl: string[], extra: Partial<VerbeLex> = {}): VerbeLex => ({
  inf,
  compl,
  ...extra,
});

export const ETRE_AVOIR: Record<'être' | 'avoir', VerbeLex> = {
  être: v('être', ['en retard', 'à l’heure', 'en vacances', 'en avance', 'de bonne humeur'], {
    imp: ['à l’heure', 'au rendez-vous', 'en avance'],
  }),
  avoir: v('avoir', ['un vélo', 'faim', 'de la chance', 'un chat', 'une idée', 'froid', 'soif'], {
    imp: ['confiance', 'du courage', 'de la patience'],
  }),
};

/** 1er groupe, verbes réguliers sans particularité orthographique. */
export const PREMIER_SIMPLES: VerbeLex[] = [
  v('chanter', ['une chanson', 'dans la chorale', 'très fort', 'sous la douche']),
  v('danser', ['sur la musique', 'à la fête', 'dans le salon', 'toute la soirée']),
  v('jouer', ['au ballon', 'aux cartes', 'dans la cour', 'du piano']),
  v('parler', ['à la maîtresse', 'très doucement', 'avec le voisin', 'au téléphone']),
  v('regarder', ['les étoiles', 'un dessin animé', 'par la fenêtre', 'les oiseaux']),
  v('aimer', ['les fraises', 'la musique', 'les histoires de pirates', 'le chocolat'], {
    sansImperatif: true,
    etat: true,
  }),
  v('écouter', ['de la musique', 'une histoire', 'la maîtresse', 'le chant des oiseaux', 'la radio']),
  v('marcher', ['dans la forêt', 'jusqu’à l’école', 'sur la plage', 'très vite']),
  v('dessiner', ['un dragon', 'une maison', 'un bateau', 'la mer']),
  v('sauter', ['dans les flaques', 'à la corde', 'très haut', 'par-dessus le ruisseau']),
  v('travailler', ['dans le jardin', 'à la bibliothèque', 'avec sérieux', 'toute la matinée']),
  v('chercher', ['un trésor', 'le chat', 'les clés', 'des coquillages']),
  v('trouver', ['un trésor', 'la bonne réponse', 'un coquillage', 'une plume']),
  v('donner', ['du pain aux canards', 'un cadeau', 'un coup de main', 'des graines aux oiseaux']),
  v('porter', ['un gros sac', 'un chapeau', 'le panier', 'des bottes']),
  v('laver', ['la voiture', 'la vaisselle', 'le chien', 'les légumes']),
  v('fermer', ['la porte', 'la fenêtre', 'le livre', 'les volets']),
  v('coller', ['des images', 'une étiquette', 'des gommettes']),
  v('préparer', ['le goûter', 'une surprise', 'un gâteau', 'une salade']),
  v('ramasser', ['des feuilles', 'des pommes', 'les jouets', 'des châtaignes']),
  v('raconter', ['une histoire', 'une blague', 'un conte']),
  v('compter', ['jusqu’à cent', 'les moutons', 'les billes']),
  v('inviter', ['les voisins', 'toute la classe', 'des amis']),
  v('gagner', ['la course', 'le match', 'un concours']),
  v('apporter', ['des fleurs', 'un gâteau', 'le dessert']),
  v('allumer', ['la lumière', 'la lampe', 'une bougie']),
  v('grimper', ['dans l’arbre', 'sur le rocher', 'à la corde']),
  v('arroser', ['les fleurs', 'le jardin', 'les tomates']),
  v('réparer', ['le vélo', 'la cabane', 'le jouet cassé']),
  v('aider', ['le voisin', 'la maîtresse', 'les plus petits']),
  v('habiter', ['à la campagne', 'près de la mer', 'dans un grand immeuble', 'à Lyon'], {
    sansImperatif: true,
    etat: true,
  }),
  v('rêver', ['de voyages', 'd’un grand château', 'de la mer'], { sansImperatif: true }),
  v('visiter', ['un château', 'le musée', 'une ferme']),
  v('cuisiner', ['une soupe', 'des crêpes', 'un bon repas']),
];

/** Verbes en -ier (je plie, nous pliions à l'imparfait). */
export const PREMIER_IER: VerbeLex[] = [
  v('crier', ['très fort', 'de joie']),
  v('plier', ['le linge', 'une feuille', 'les serviettes']),
  v('oublier', ['le goûter', 'les clés', 'la consigne'], { sansImperatif: true }),
  v('colorier', ['un dessin', 'un papillon', 'une étoile']),
];

/** Verbes en -cer et -ger (ç, ge). */
export const PREMIER_CER_GER: VerbeLex[] = [
  v('manger', ['une pomme', 'des crêpes', 'à la cantine', 'une glace']),
  v('nager', ['dans la piscine', 'dans la mer', 'très vite']),
  v('ranger', ['la classe', 'les jouets', 'la chambre', 'les crayons']),
  v('voyager', ['en train', 'en avion', 'autour du monde']),
  v('partager', ['le goûter', 'les bonbons', 'le gâteau']),
  v('plonger', ['dans le lac', 'dans la piscine']),
  v('commencer', ['la course', 'un dessin', 'la partie']),
  v('lancer', ['le ballon', 'les dés', 'un caillou dans l’eau']),
  v('avancer', ['doucement', 'vers la porte', 'sur le chemin']),
  v('effacer', ['le tableau', 'les traits de crayon']),
];

/** Verbes en -yer, -eler/-eter, e/é + consonne + er : le radical change. */
export const PREMIER_RADICAL: VerbeLex[] = [
  v('nettoyer', ['la table', 'les vitres', 'le tableau']),
  v('essuyer', ['la vaisselle', 'la table']),
  v('envoyer', ['une lettre', 'une carte postale', 'un message']),
  v('payer', ['les croissants', 'le pain']),
  v('appeler', ['le chien', 'un taxi', 'la maîtresse']),
  v('jeter', ['les papiers à la poubelle', 'une pièce dans la fontaine', 'le ballon']),
  v('acheter', ['du pain', 'des fruits au marché', 'un livre']),
  v('lever', ['la main', 'les bras']),
  v('promener', ['le chien', 'le petit frère']),
  v('peler', ['une orange', 'une pomme']),
  v('préférer', ['le chocolat', 'la mer', 'les jeux de société'], { sansImperatif: true, etat: true }),
  v('répéter', ['la consigne', 'la poésie', 'la question']),
];

/** 1er groupe conjugués avec être. */
export const PREMIER_ETRE: VerbeLex[] = [
  v('arriver', ['à l’heure', 'en retard', 'à la gare', 'à l’école']),
  v('tomber', ['dans la neige', 'de vélo', 'dans une flaque'], { sansImperatif: true }),
  v('rester', ['à la maison', 'au lit', 'dans la cour']),
  v('entrer', ['dans la classe', 'dans le magasin']),
  v('rentrer', ['de l’école', 'à la maison', 'tard']),
];

export const DEUXIEME: VerbeLex[] = [
  v('finir', ['le puzzle', 'la course', 'le repas', 'les exercices']),
  v('choisir', ['un livre', 'une glace à la fraise', 'la bonne réponse']),
  v('grandir', ['très vite', 'à la campagne', 'beaucoup'], { sansImperatif: true }),
  v('réussir', ['l’exercice', 'le gâteau', 'le tour de magie']),
  v('remplir', ['le seau', 'la bouteille', 'la grille']),
  v('obéir', ['aux règles du jeu', 'à l’arbitre']),
  v('réfléchir', ['avant de répondre', 'longtemps']),
  v('applaudir', ['les musiciens', 'très fort']),
  v('bondir', ['de joie', 'par-dessus le ruisseau']),
  v('nourrir', ['les poules', 'le chat', 'les poissons']),
  v('saisir', ['la balle', 'la corde']),
  v('ralentir', ['dans le virage', 'avant le passage piéton']),
  v('franchir', ['la ligne d’arrivée', 'le ruisseau']),
  v('bâtir', ['une cabane', 'un château de sable']),
];

/** Les 8 verbes irréguliers du BO (+ revenir, apprendre, comprendre). */
export const IRREGULIERS_BO: VerbeLex[] = [
  v('aller', ['à la piscine', 'au marché', 'à l’école', 'chez le dentiste', 'en forêt']),
  v('faire', ['un gâteau', 'du vélo', 'une cabane', 'un puzzle', 'les courses']),
  v('dire', ['bonjour', 'la vérité', 'merci', 'un secret']),
  v('venir', ['à la fête', 'en bus', 'au spectacle', 'de la plage']),
  v('pouvoir', ['nager très loin', 'jouer dehors', 'porter ce sac', 'entrer'], { sansImperatif: true }),
  v('voir', ['un arc-en-ciel', 'la mer', 'un écureuil', 'le spectacle'], { sansImperatif: true }),
  v('vouloir', ['un chocolat chaud', 'jouer dehors', 'un chien', 'une glace'], { sansImperatif: true }),
  v('prendre', ['le bus', 'un parapluie', 'une photo', 'le train']),
  v('revenir', ['de vacances', 'à la maison', 'du marché']),
  v('apprendre', ['une poésie', 'à nager', 'la leçon']),
  v('comprendre', ['la consigne', 'la règle du jeu', 'la question']),
];

/** Autres verbes du 3e groupe (pour aller plus loin au CM2). */
export const AUTRES_TROISIEME: VerbeLex[] = [
  v('partir', ['en vacances', 'à la mer', 'tôt', 'en voyage']),
  v('sortir', ['dans le jardin', 'de la classe', 'avec le chien']),
  v('dormir', ['dans une tente', 'profondément', 'sous la couette']),
  v('mettre', ['un manteau', 'la table', 'des bottes']),
  v('écrire', ['une lettre', 'un poème', 'une histoire']),
  v('lire', ['un livre', 'une bande dessinée', 'le journal', 'une histoire']),
];

export const TOUS_VERBES: VerbeLex[] = [
  ...Object.values(ETRE_AVOIR),
  ...PREMIER_SIMPLES,
  ...PREMIER_IER,
  ...PREMIER_CER_GER,
  ...PREMIER_RADICAL,
  ...PREMIER_ETRE,
  ...DEUXIEME,
  ...IRREGULIERS_BO,
  ...AUTRES_TROISIEME,
];

/** Fiche lexicale d'un verbe. */
export function lex(inf: string): VerbeLex {
  const f = TOUS_VERBES.find((x) => x.inf === inf);
  if (!f) throw new Error(`Verbe absent du lexique : ${inf}`);
  return f;
}

/* ------------------------------------------------------------------ */
/* Sujets                                                              */
/* ------------------------------------------------------------------ */

export interface Sujet {
  texte: string;
  p: Personne;
  /** Genre connu (accord du participe passé avec être) ; undefined = inconnu (je, tu, nous, vous, on). */
  fem?: boolean;
  pronom: boolean;
}

const s = (texte: string, p: Personne, fem: boolean | undefined, pronom = false): Sujet => ({
  texte,
  p,
  fem,
  pronom,
});

export const PRONOMS_SUJETS: Sujet[] = [
  s('je', 0, undefined, true),
  s('tu', 1, undefined, true),
  s('il', 2, false, true),
  s('elle', 2, true, true),
  s('on', 2, undefined, true),
  s('nous', 3, undefined, true),
  s('vous', 4, undefined, true),
  s('ils', 5, false, true),
  s('elles', 5, true, true),
];

export const PRENOMS: Sujet[] = [
  s('Léa', 2, true),
  s('Tom', 2, false),
  s('Nora', 2, true),
  s('Simon', 2, false),
  s('Inès', 2, true),
  s('Malik', 2, false),
  s('Jade', 2, true),
  s('Hugo', 2, false),
  s('Chloé', 2, true),
  s('Yanis', 2, false),
  s('Zoé', 2, true),
  s('Noé', 2, false),
  s('Aya', 2, true),
  s('Lucas', 2, false),
  s('Sofia', 2, true),
  s('Rayan', 2, false),
];

export const GN_SINGULIER: Sujet[] = [
  s('le maître', 2, false),
  s('la maîtresse', 2, true),
  s('mon frère', 2, false),
  s('ma sœur', 2, true),
  s('mon cousin', 2, false),
  s('ma cousine', 2, true),
  s('le voisin', 2, false),
  s('la voisine', 2, true),
  s('mon grand-père', 2, false),
  s('ma grand-mère', 2, true),
];

export const GN_PLURIEL: Sujet[] = [
  s('les enfants', 5, false),
  s('les élèves', 5, false),
  s('mes parents', 5, false),
  s('les filles', 5, true),
  s('les garçons', 5, false),
  s('mes cousines', 5, true),
  s('les voisins', 5, false),
  s('Léa et Tom', 5, false),
  s('Nora et Jade', 5, true),
  s('Inès et Zoé', 5, true),
  s('Hugo et Malik', 5, false),
];

/** Prénoms pour l'apostrophe à l'impératif ou devant « tu » / « vous » (genre connu). */
export const APOSTROPHES_SG = PRENOMS;
export const APOSTROPHES_PL: { texte: string; fem: boolean }[] = [
  { texte: 'Les enfants', fem: false },
  { texte: 'Les filles', fem: true },
  { texte: 'Les garçons', fem: false },
  { texte: 'Mes amis', fem: false },
  { texte: 'Mes amies', fem: true },
];

/* ------------------------------------------------------------------ */
/* Indicateurs de temps                                                */
/* ------------------------------------------------------------------ */

export const INDICATEURS: Record<Temps, readonly string[]> = {
  present: ['Aujourd’hui', 'En ce moment', 'Maintenant', 'Tous les jours', 'Le mercredi'],
  imparfait: ['Autrefois', 'Avant', 'Il y a longtemps', 'À cette époque', 'Dans le temps'],
  futur: ['Demain', 'Bientôt', 'La semaine prochaine', 'Plus tard', 'Dans deux jours', 'L’été prochain'],
  passe_compose: ['Hier', 'Ce matin', 'La semaine dernière', 'Hier soir', 'Samedi dernier'],
  passe_simple: ['Ce jour-là', 'Soudain', 'Tout à coup', 'Le lendemain', 'Un matin', 'Ce soir-là'],
  plus_que_parfait: ['La veille', 'Quelques jours plus tôt', 'Le jour d’avant', 'Avant la fête'],
  conditionnel: ['Avec un peu de chance', 'Si c’était possible', 'S’il faisait beau', 'Avec plus de temps'],
  imperatif: [],
};
