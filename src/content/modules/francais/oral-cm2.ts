/**
 * CM2 — Oral : écouter pour comprendre. BO n°16 du 17/04/2025, cycle 3, CM2 : « Construire sa posture
 * d'auditeur en maintenant une écoute active orientée en fonction du but » ; « Comprendre un message oral
 * provenant d'un tiers ou d'un média (interview, reportage) » ; « Manifester sa compréhension des textes
 * entendus » ; « Identifier les caractéristiques des différents genres de discours ».
 *
 * Les messages ne sont pas écrits : ils s'écoutent (champ `spoken`, bouton 🔊). Questions sur
 * l'information explicite (Facile), l'inférence et le genre du message (Normal), l'intention de celui qui
 * parle et l'implicite (Plus loin). Le Détective du texte reçoit aussi les messages sous forme de
 * transcription (`meta.texte`) : on peut l'écouter avec le haut-parleur, puis retrouver la preuve.
 */
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext } from '../../registry';
import type { Item, Level } from '../../schemas';
import { aucun, diff, g, hash, make, oral, qcm } from './util';

type Niv = 'f' | 'n' | 'p';

/** [question, bonne réponse, mauvaises réponses, explication, phrase-preuve du message]. */
type Question = [string, string, string[], string, string];
/** [affirmation, vraie ?, explication]. */
type Affirmation = [string, boolean, string];

interface Message {
  id: string;
  niv: Niv;
  /** Ce qu'on écoute : « l’annonce », « le bulletin météo »… */
  quoi: string;
  titre: string;
  texte: string;
  questions: Question[];
  vf: Affirmation[];
}

const MESSAGES: Message[] = [
  /* ------------------------------ Facile ------------------------------ */
  {
    id: 'gare',
    niv: 'f',
    quoi: 'l’annonce',
    titre: 'Annonce en gare',
    texte:
      'Mesdames et messieurs, le train pour Lyon partira du quai numéro 3 à 10 h 15. Nous vous souhaitons un bon voyage.',
    questions: [
      [
        'Vers quelle ville part le train ?',
        'Lyon',
        ['Marseille', 'Lille', 'Nantes'],
        'L’annonce dit : « le train pour Lyon ».',
        'le train pour Lyon partira du quai numéro 3 à 10 h 15.',
      ],
      [
        'De quel quai part le train ?',
        'du quai 3',
        ['du quai 13', 'du quai 5', 'du quai 10'],
        'Le train part « du quai numéro 3 » ; 10 h 15, c’est l’heure du départ.',
        'le train pour Lyon partira du quai numéro 3 à 10 h 15.',
      ],
    ],
    vf: [
      ['Le train part à 10 h 15.', true, 'L’annonce dit : « à 10 h 15 ».'],
      ['Le train part pour Paris.', false, 'Le train part pour Lyon, pas pour Paris.'],
    ],
  },
  {
    id: 'consigne-sciences',
    niv: 'f',
    quoi: 'la consigne',
    titre: 'La consigne du maître',
    texte:
      'Prenez votre cahier de sciences et ouvrez-le à la page 12. Nous allons observer la photo d’un volcan.',
    questions: [
      [
        'Quel cahier faut-il prendre ?',
        'le cahier de sciences',
        ['le cahier de poésie', 'le cahier du jour', 'le cahier de brouillon'],
        'La consigne dit : « Prenez votre cahier de sciences ».',
        'Prenez votre cahier de sciences et ouvrez-le à la page 12.',
      ],
      [
        'Que va-t-on observer ?',
        'la photo d’un volcan',
        ['une carte de France', 'le dessin d’une fleur', 'une vidéo de la mer'],
        'Le maître annonce : « Nous allons observer la photo d’un volcan ».',
        'Nous allons observer la photo d’un volcan.',
      ],
    ],
    vf: [
      ['Il faut ouvrir le cahier à la page 12.', true, 'La consigne dit : « ouvrez-le à la page 12 ».'],
      ['La classe va lire une poésie.', false, 'La classe va observer la photo d’un volcan.'],
    ],
  },
  {
    id: 'meteo-simple',
    niv: 'f',
    quoi: 'le bulletin météo',
    titre: 'La météo de demain',
    texte:
      'Demain, il fera beau dans le sud de la France. Dans le nord, attention : la pluie arrivera dans l’après-midi.',
    questions: [
      [
        'Quel temps fera-t-il dans le sud ?',
        'du beau temps',
        ['de la pluie', 'de la neige', 'du brouillard'],
        'Le bulletin dit : « il fera beau dans le sud ».',
        'Demain, il fera beau dans le sud de la France.',
      ],
      [
        'Quand la pluie arrivera-t-elle dans le nord ?',
        'l’après-midi',
        ['le matin', 'la nuit', 'à midi'],
        'Le bulletin dit : « la pluie arrivera dans l’après-midi ».',
        'Dans le nord, attention : la pluie arrivera dans l’après-midi.',
      ],
    ],
    vf: [
      ['Il pleuvra dans le nord.', true, 'Dans le nord, la pluie arrivera l’après-midi.'],
      ['Il neigera dans le sud.', false, 'Dans le sud, il fera beau.'],
    ],
  },
  {
    id: 'chat',
    niv: 'f',
    quoi: 'l’histoire',
    titre: 'Le petit chat',
    texte:
      'Ce matin, Inès a trouvé un petit chat sous la pluie. Elle l’a séché avec une serviette et lui a donné du lait.',
    questions: [
      [
        'Où Inès a-t-elle trouvé le chat ?',
        'sous la pluie',
        ['dans un arbre', 'dans la cuisine', 'dans son lit'],
        'Inès a trouvé le petit chat « sous la pluie ».',
        'Ce matin, Inès a trouvé un petit chat sous la pluie.',
      ],
      [
        'Qu’a-t-elle donné au chat ?',
        'du lait',
        ['de l’eau', 'du poisson', 'des croquettes'],
        'Inès « lui a donné du lait ».',
        'Elle l’a séché avec une serviette et lui a donné du lait.',
      ],
    ],
    vf: [
      ['Inès a séché le chat avec une serviette.', true, 'Elle l’a séché avec une serviette.'],
      ['Inès a trouvé un chien.', false, 'Inès a trouvé un petit chat.'],
    ],
  },
  {
    id: 'piscine',
    niv: 'f',
    quoi: 'l’annonce',
    titre: 'Message de l’école',
    texte:
      'Attention, la sortie à la piscine est reportée à jeudi, car le bus est en panne. N’oubliez pas votre maillot de bain.',
    questions: [
      [
        'Quel jour aura lieu la sortie ?',
        'jeudi',
        ['mardi', 'vendredi', 'lundi'],
        'La sortie « est reportée à jeudi ».',
        'Attention, la sortie à la piscine est reportée à jeudi, car le bus est en panne.',
      ],
      [
        'Pourquoi la sortie est-elle reportée ?',
        'le bus est en panne',
        ['il pleut', 'la piscine est fermée', 'le maître est malade'],
        'Le mot « car » donne la raison : « le bus est en panne ».',
        'Attention, la sortie à la piscine est reportée à jeudi, car le bus est en panne.',
      ],
    ],
    vf: [
      [
        'Il faut apporter son maillot de bain.',
        true,
        'L’annonce dit : « N’oubliez pas votre maillot de bain ».',
      ],
      ['La sortie a lieu au musée.', false, 'La sortie a lieu à la piscine.'],
    ],
  },

  /* ------------------------------ Normal ------------------------------ */
  {
    id: 'meteo-samedi',
    niv: 'n',
    quoi: 'le bulletin météo',
    titre: 'La météo du samedi',
    texte:
      'Voici la météo de ce samedi. Sur la Bretagne, le ciel restera gris et des averses tomberont toute la journée. En montagne, la neige fera son retour au-dessus de 1 500 mètres. Sur la Méditerranée, profitez du soleil : il fera jusqu’à 24 degrés.',
    questions: [
      [
        'Quel genre de message entends-tu ?',
        'un bulletin météo',
        ['une publicité', 'un conte', 'une recette'],
        'Le message annonce le temps qu’il fera : c’est un bulletin météo.',
        'Voici la météo de ce samedi.',
      ],
      [
        'Où fera-t-il le plus chaud ?',
        'sur la Méditerranée',
        ['en Bretagne', 'en montagne', 'partout pareil'],
        'Sur la Méditerranée, il fera jusqu’à 24 degrés, avec du soleil.',
        'Sur la Méditerranée, profitez du soleil : il fera jusqu’à 24 degrés.',
      ],
      [
        'Qu’est-il utile d’emporter en Bretagne ?',
        'un parapluie',
        ['de la crème solaire', 'des skis', 'un maillot de bain'],
        'On ne le dit pas, on le devine : des averses toute la journée, il faut un parapluie.',
        'Sur la Bretagne, le ciel restera gris et des averses tomberont toute la journée.',
      ],
    ],
    vf: [
      [
        'Il neigera au-dessus de 1 500 mètres.',
        true,
        'En montagne, la neige revient au-dessus de 1 500 mètres.',
      ],
      ['Il fera beau en Bretagne.', false, 'En Bretagne, le ciel sera gris, avec des averses.'],
    ],
  },
  {
    id: 'interview-dessin',
    niv: 'n',
    quoi: 'l’interview',
    titre: 'Interview d’un jeune dessinateur',
    texte:
      'La journaliste : Bonjour Lucas, tu as gagné le concours de dessin de ta ville. Qu’as-tu dessiné ? Lucas : J’ai dessiné le port, avec les bateaux de pêche qui rentrent le soir. La journaliste : Combien de temps t’a-t-il fallu ? Lucas : Trois semaines ! J’allais au port tous les mercredis avec mon grand-père.',
    questions: [
      [
        'Quel genre de message entends-tu ?',
        'une interview',
        ['une recette', 'un poème', 'un bulletin météo'],
        'Une personne pose des questions à Lucas, qui répond : c’est une interview.',
        'Bonjour Lucas, tu as gagné le concours de dessin de ta ville.',
      ],
      [
        'Qu’a dessiné Lucas ?',
        'le port et ses bateaux',
        ['la mer en tempête', 'son grand-père', 'sa ville la nuit'],
        'Lucas a dessiné « le port, avec les bateaux de pêche ».',
        'J’ai dessiné le port, avec les bateaux de pêche qui rentrent le soir.',
      ],
      [
        'Pourquoi Lucas allait-il au port le mercredi ?',
        'pour dessiner le port',
        ['pour voir sa sœur', 'pour prendre le bateau', 'pour acheter du poisson'],
        'On le devine : Lucas a mis trois semaines à dessiner le port, il y allait pour le dessiner.',
        'J’allais au port tous les mercredis avec mon grand-père.',
      ],
    ],
    vf: [
      ['Lucas a mis trois semaines pour faire son dessin.', true, 'Lucas répond : « Trois semaines ! »'],
      ['Lucas allait au port avec sa sœur.', false, 'Lucas allait au port avec son grand-père.'],
    ],
  },
  {
    id: 'abeilles',
    niv: 'n',
    quoi: 'le reportage',
    titre: 'Reportage : les abeilles',
    texte:
      'Les abeilles sont indispensables : en allant de fleur en fleur, elles transportent le pollen, ce qui permet aux plantes de donner des fruits. Mais depuis plusieurs années, elles sont moins nombreuses, à cause de certains pesticides et du manque de fleurs.',
    questions: [
      [
        'Quel est le sujet de ce reportage ?',
        'les abeilles',
        ['les fleurs du jardin', 'le miel', 'les fruits'],
        'Le reportage parle des abeilles, de leur rôle et de leur diminution.',
        'Les abeilles sont indispensables : en allant de fleur en fleur, elles transportent le pollen, ce qui permet aux plantes de donner des fruits.',
      ],
      [
        'Pourquoi les abeilles sont-elles utiles aux plantes ?',
        'elles transportent le pollen',
        ['elles mangent les insectes', 'elles arrosent les fleurs', 'elles font pousser les feuilles'],
        'En allant de fleur en fleur, les abeilles transportent le pollen : les plantes peuvent donner des fruits.',
        'Les abeilles sont indispensables : en allant de fleur en fleur, elles transportent le pollen, ce qui permet aux plantes de donner des fruits.',
      ],
      [
        'Que se passerait-il sans abeilles ?',
        'moins de fruits',
        ['plus de fleurs', 'des arbres plus grands', 'plus de miel'],
        'On le déduit : sans abeilles pour transporter le pollen, les plantes donneraient moins de fruits.',
        'Les abeilles sont indispensables : en allant de fleur en fleur, elles transportent le pollen, ce qui permet aux plantes de donner des fruits.',
      ],
    ],
    vf: [
      [
        'Les abeilles sont de moins en moins nombreuses.',
        true,
        'Le reportage dit qu’elles sont moins nombreuses depuis plusieurs années.',
      ],
      ['Les pesticides aident les abeilles.', false, 'Certains pesticides font disparaître les abeilles.'],
    ],
  },
  {
    id: 'conte-sel',
    niv: 'n',
    quoi: 'le conte',
    titre: 'Le roi et ses trois filles',
    texte:
      'Il était une fois un roi qui avait trois filles. Un jour, il leur demanda : « Combien m’aimez-vous ? » La première répondit : « Comme l’or. » La deuxième dit : « Comme les diamants. » La plus jeune dit simplement : « Comme le sel. » Le roi, vexé, la chassa du château.',
    questions: [
      [
        'Quel genre de texte entends-tu ?',
        'un conte',
        ['un bulletin météo', 'une recette', 'une interview'],
        '« Il était une fois », un roi, un château : ce sont les marques du conte.',
        'Il était une fois un roi qui avait trois filles.',
      ],
      [
        'Comment se sent le roi après la réponse de la plus jeune ?',
        'vexé',
        ['fier', 'joyeux', 'reconnaissant'],
        'Le conte le dit : « Le roi, vexé, la chassa du château ».',
        'Le roi, vexé, la chassa du château.',
      ],
      [
        'Pourquoi le roi est-il vexé ?',
        'le sel lui semble sans valeur',
        ['il n’aime pas le sel', 'il est malade', 'sa fille est partie'],
        'On le devine : comparé à l’or et aux diamants, le sel paraît sans valeur au roi.',
        'La plus jeune dit simplement : « Comme le sel. »',
      ],
    ],
    vf: [
      ['Le roi a trois filles.', true, 'Le conte commence ainsi : « un roi qui avait trois filles ».'],
      [
        'La plus jeune aime le roi comme l’or.',
        false,
        'C’est la première fille qui dit « comme l’or » ; la plus jeune dit « comme le sel ».',
      ],
    ],
  },
  {
    id: 'lentilles',
    niv: 'n',
    quoi: 'la consigne',
    titre: 'Faire pousser des lentilles',
    texte:
      'Pour faire pousser des lentilles, pose du coton au fond d’un pot. Mouille-le bien, puis dépose trois lentilles dessus. Place le pot près d’une fenêtre et arrose un peu chaque jour. Dans une semaine, de petites tiges apparaîtront.',
    questions: [
      [
        'Que faut-il poser en premier au fond du pot ?',
        'du coton',
        ['les lentilles', 'de la terre', 'de l’eau'],
        'La première étape est : « pose du coton au fond d’un pot ».',
        'Pour faire pousser des lentilles, pose du coton au fond d’un pot.',
      ],
      [
        'Où faut-il placer le pot ?',
        'près d’une fenêtre',
        ['dans un placard', 'dans le réfrigérateur', 'sous le lit'],
        'La consigne dit : « Place le pot près d’une fenêtre ».',
        'Place le pot près d’une fenêtre et arrose un peu chaque jour.',
      ],
      [
        'Pourquoi place-t-on le pot près d’une fenêtre ?',
        'pour la lumière',
        ['pour le froid', 'pour le bruit', 'pour le vent'],
        'On ne le dit pas, mais on le sait : les plantes ont besoin de lumière pour pousser.',
        'Place le pot près d’une fenêtre et arrose un peu chaque jour.',
      ],
    ],
    vf: [
      ['Il faut arroser un peu chaque jour.', true, 'La consigne dit : « arrose un peu chaque jour ».'],
      ['Les tiges apparaissent le lendemain.', false, 'Les petites tiges apparaissent dans une semaine.'],
    ],
  },
  {
    id: 'soleil',
    niv: 'n',
    quoi: 'le message',
    titre: 'Message de prévention',
    texte:
      'Cet été, protège-toi du soleil : porte un chapeau, mets de la crème solaire et bois souvent de l’eau, même si tu n’as pas soif.',
    questions: [
      [
        'À quoi sert ce message ?',
        'à donner des conseils',
        ['à raconter une histoire', 'à vendre un chapeau', 'à annoncer la météo'],
        'Le message dit ce qu’il faut faire pour se protéger : il donne des conseils.',
        'Cet été, protège-toi du soleil : porte un chapeau, mets de la crème solaire et bois souvent de l’eau, même si tu n’as pas soif.',
      ],
      [
        'Quand faut-il boire de l’eau ?',
        'souvent, même sans soif',
        ['seulement quand on a soif', 'le soir', 'jamais au soleil'],
        'Le message dit : « bois souvent de l’eau, même si tu n’as pas soif ».',
        'Cet été, protège-toi du soleil : porte un chapeau, mets de la crème solaire et bois souvent de l’eau, même si tu n’as pas soif.',
      ],
    ],
    vf: [
      ['Le message conseille de porter un chapeau.', true, 'Il dit : « porte un chapeau ».'],
      ['Il faut boire seulement quand on a soif.', false, 'Il faut boire souvent, même sans soif.'],
    ],
  },

  /* ------------------------------ Plus loin ------------------------------ */
  {
    id: 'glacier',
    niv: 'p',
    quoi: 'le reportage',
    titre: 'Reportage au pied du Mont-Blanc',
    texte:
      'Nous sommes à Chamonix, au pied du Mont-Blanc. Il y a cent ans, le glacier descendait jusqu’à l’endroit où je me trouve. Aujourd’hui, il faut marcher plus d’une heure pour l’atteindre. Les scientifiques mesurent sa longueur chaque année : elle ne cesse de diminuer, car les étés sont de plus en plus chauds.',
    questions: [
      [
        'Où se trouve le journaliste ?',
        'à Chamonix',
        ['au sommet du Mont-Blanc', 'à Paris', 'sur un bateau'],
        'Il le dit au début : « Nous sommes à Chamonix, au pied du Mont-Blanc ».',
        'Nous sommes à Chamonix, au pied du Mont-Blanc.',
      ],
      [
        'Que montre la marche d’une heure ?',
        'le glacier a reculé',
        ['le journaliste est perdu', 'le chemin est fermé', 'le glacier a grandi'],
        'Autrefois, le glacier arrivait jusqu’au journaliste ; il faut maintenant une heure de marche : il a reculé.',
        'Aujourd’hui, il faut marcher plus d’une heure pour l’atteindre.',
      ],
      [
        'Quelle cause le journaliste donne-t-il ?',
        'des étés plus chauds',
        ['trop de neige', 'les randonneurs', 'les tremblements de terre'],
        'Le mot « car » donne la cause : « les étés sont de plus en plus chauds ».',
        'Les scientifiques mesurent sa longueur chaque année : elle ne cesse de diminuer, car les étés sont de plus en plus chauds.',
      ],
    ],
    vf: [
      [
        'Le glacier est plus long aujourd’hui qu’il y a cent ans.',
        false,
        'Sa longueur ne cesse de diminuer : il est plus court qu’il y a cent ans.',
      ],
      [
        'Les scientifiques mesurent le glacier chaque année.',
        true,
        'Le reportage le dit : ils mesurent sa longueur chaque année.',
      ],
    ],
  },
  {
    id: 'sommeil',
    niv: 'p',
    quoi: 'l’interview',
    titre: 'Interview d’une médecin',
    texte:
      'Le journaliste : Docteure, combien d’heures un enfant de dix ans doit-il dormir ? La médecin : Entre neuf et douze heures. Pendant le sommeil, le corps grandit et le cerveau range ce qu’on a appris dans la journée. Le journaliste : Et les écrans, le soir ? La médecin : Leur lumière trompe le cerveau, qui croit qu’il fait encore jour. Mieux vaut les éteindre une heure avant le coucher.',
    questions: [
      [
        'Qui répond aux questions ?',
        'une médecin',
        ['une maîtresse', 'une sportive', 'une journaliste'],
        'La personne interrogée est appelée « Docteure » : c’est une médecin.',
        'Docteure, combien d’heures un enfant de dix ans doit-il dormir ?',
      ],
      [
        'Combien d’heures un enfant de dix ans doit-il dormir ?',
        'entre 9 et 12 heures',
        ['entre 6 et 8 heures', '15 heures', '5 heures'],
        'La médecin répond : « Entre neuf et douze heures ».',
        'Entre neuf et douze heures.',
      ],
      [
        'Pourquoi éteindre les écrans une heure avant de dormir ?',
        'pour s’endormir plus facilement',
        ['pour économiser l’électricité', 'pour lire plus vite', 'pour se lever plus tôt'],
        'La lumière des écrans fait croire au cerveau qu’il fait jour : on en déduit qu’elle empêche de s’endormir.',
        'Leur lumière trompe le cerveau, qui croit qu’il fait encore jour.',
      ],
    ],
    vf: [
      [
        'Pendant le sommeil, le cerveau range ce qu’on a appris.',
        true,
        'La médecin le dit : le cerveau range ce qu’on a appris dans la journée.',
      ],
      [
        'La lumière des écrans aide à s’endormir.',
        false,
        'Elle trompe le cerveau, qui croit qu’il fait encore jour.',
      ],
    ],
  },
  {
    id: 'corbeau',
    niv: 'p',
    quoi: 'la fable',
    titre: 'Le Corbeau et le Renard (Jean de La Fontaine)',
    texte:
      'Maître Corbeau, sur un arbre perché, tenait en son bec un fromage. Maître Renard, par l’odeur alléché, lui tint à peu près ce langage : « Hé ! bonjour, Monsieur du Corbeau. Que vous êtes joli ! que vous me semblez beau ! Sans mentir, si votre ramage se rapporte à votre plumage, vous êtes le Phénix des hôtes de ces bois. »',
    questions: [
      [
        'Quel genre de texte entends-tu ?',
        'une fable',
        ['un reportage', 'une interview', 'une recette'],
        'Un court récit en vers, avec des animaux qui parlent : c’est une fable de La Fontaine.',
        'Maître Corbeau, sur un arbre perché, tenait en son bec un fromage.',
      ],
      [
        'Pourquoi le Renard fait-il des compliments au Corbeau ?',
        'pour avoir le fromage',
        ['parce qu’il l’admire', 'pour devenir son ami', 'pour l’aider'],
        'Le Renard est attiré par l’odeur du fromage : ses compliments sont une ruse pour l’obtenir.',
        'Maître Renard, par l’odeur alléché, lui tint à peu près ce langage :',
      ],
      [
        'Qu’est-ce qui attire le Renard ?',
        'l’odeur du fromage',
        ['le chant du Corbeau', 'l’arbre', 'les plumes du Corbeau'],
        '« Par l’odeur alléché » : c’est l’odeur du fromage qui attire le Renard.',
        'Maître Renard, par l’odeur alléché, lui tint à peu près ce langage :',
      ],
    ],
    vf: [
      [
        'Le Renard pense vraiment que le Corbeau est beau.',
        false,
        'Le Renard flatte le Corbeau pour obtenir son fromage : il ne le pense pas vraiment.',
      ],
      [
        'Le Corbeau tient un fromage dans son bec.',
        true,
        'La fable le dit : il « tenait en son bec un fromage ».',
      ],
    ],
  },
  {
    id: 'aeroport',
    niv: 'p',
    quoi: 'l’annonce',
    titre: 'Annonce à l’aéroport',
    texte:
      'Mesdames et messieurs, en raison d’un incident technique, le vol à destination de Montréal partira avec deux heures de retard. Les passagers sont invités à se présenter à la porte 14 à partir de 16 heures. Un bon de repas est disponible au comptoir d’information.',
    questions: [
      [
        'Où entend-on ce message ?',
        'dans un aéroport',
        ['dans une gare', 'à l’école', 'dans un port'],
        'Un vol, une porte d’embarquement, des passagers : on est dans un aéroport.',
        'Mesdames et messieurs, en raison d’un incident technique, le vol à destination de Montréal partira avec deux heures de retard.',
      ],
      [
        'Pourquoi offre-t-on un bon de repas ?',
        'pour faire patienter',
        ['le vol est annulé', 'c’est l’heure du goûter', 'pour fêter le départ'],
        'On le devine : les passagers doivent attendre deux heures de plus, le repas les aide à patienter.',
        'Un bon de repas est disponible au comptoir d’information.',
      ],
      [
        'Quelle est la destination du vol ?',
        'Montréal',
        ['Marseille', 'Madrid', 'Moscou'],
        'Le vol est « à destination de Montréal ».',
        'Mesdames et messieurs, en raison d’un incident technique, le vol à destination de Montréal partira avec deux heures de retard.',
      ],
    ],
    vf: [
      ['Le vol est annulé.', false, 'Le vol n’est pas annulé : il partira avec deux heures de retard.'],
      ['Les passagers doivent aller à la porte 14.', true, 'Ils sont invités à se présenter à la porte 14.'],
    ],
  },
  {
    id: 'debat',
    niv: 'p',
    quoi: 'le débat',
    titre: 'Débat en classe',
    texte:
      'Emma : Moi, je pense qu’il faudrait interdire les voitures devant l’école : l’air serait moins pollué et ce serait moins dangereux. Yanis : Je ne suis pas d’accord : certains parents habitent loin et n’ont pas d’autre moyen pour venir. Chloé : Alors, on pourrait organiser un pédibus : les enfants viendraient à pied, en groupe, accompagnés par des adultes.',
    questions: [
      [
        'De quoi les élèves discutent-ils ?',
        'des voitures devant l’école',
        ['de la cantine', 'des vacances', 'du sport'],
        'Le premier élève propose d’interdire les voitures devant l’école ; les autres répondent.',
        'Moi, je pense qu’il faudrait interdire les voitures devant l’école : l’air serait moins pollué et ce serait moins dangereux.',
      ],
      [
        'Quel argument donne l’élève qui n’est pas d’accord ?',
        'des parents habitent loin',
        ['les voitures sont belles', 'le bus coûte trop cher', 'il aime la pollution'],
        'Il dit : « certains parents habitent loin et n’ont pas d’autre moyen pour venir ».',
        'Je ne suis pas d’accord : certains parents habitent loin et n’ont pas d’autre moyen pour venir.',
      ],
      [
        'Qu’est-ce qu’un pédibus ?',
        'des enfants venant à pied en groupe',
        ['un bus électrique', 'un vélo à plusieurs places', 'une voiture partagée'],
        'Le dernier élève l’explique : les enfants viennent à pied, en groupe, accompagnés par des adultes.',
        'Alors, on pourrait organiser un pédibus : les enfants viendraient à pied, en groupe, accompagnés par des adultes.',
      ],
    ],
    vf: [
      ['Tous les élèves sont d’accord.', false, 'Un élève dit : « Je ne suis pas d’accord ».'],
      ['Le premier élève parle de pollution.', true, 'Il dit que l’air serait moins pollué.'],
    ],
  },
];

const NIVEAUX: Record<Level, Niv[]> = { facile: ['f'], normal: ['n'], plus_loin: ['p', 'n'] };
const duNiveau = (level: Level) => MESSAGES.filter((m) => NIVEAUX[level].includes(m.niv));
const DIFF: Record<Niv, number> = { f: 0.2, n: 0.5, p: 0.8 };

const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** QCM écouté (Attrape-Bulles) et QCM du Détective du texte (transcription + preuve). */
function poolQcm(level: Level, rng: Rng, ctx: GenContext): Item[] {
  return duNiveau(level).flatMap((m) =>
    m.questions.flatMap(([question, bonne, fausses, explication, preuve]) => {
      const max = level === 'facile' ? 3 : 4;
      const entendu = qcm(ctx, rng, `ecoute-${m.id}-${hash(question)}`, {
        question: `🔊 Écoute ${m.quoi} (touche le haut-parleur), puis réponds : ${minuscule(question)}`,
        spoken: `${m.texte} … ${question}`,
        good: bonne,
        wrong: fausses,
        max,
        explication,
        difficulty: DIFF[m.niv],
      });
      const detective = qcm(ctx, rng, `dossier-${m.id}-${hash(question)}`, {
        question,
        good: bonne,
        wrong: fausses,
        max,
        explication,
        difficulty: DIFF[m.niv],
        meta: { texte: m.texte, titre: `🔊 ${m.titre}`, preuve },
      });
      return [entendu, detective];
    }),
  );
}

function poolVraiFaux(level: Level, _rng: Rng, ctx: GenContext): Item[] {
  return duNiveau(level).flatMap((m) =>
    m.vf.map(([affirmation, vrai, explication]) =>
      make(ctx, 'true_false', `ecoute-${m.id}-${hash(affirmation)}`, {
        statement: `🔊 Écoute ${m.quoi}, puis dis si c’est vrai ou faux : ${g(affirmation)}`,
        spoken: `${m.texte} … Vrai ou faux ? ${affirmation}`,
        answer: vrai,
        explication,
        difficulty: DIFF[m.niv],
      }),
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Réponses à voix haute (Perroquet savant)                            */
/* ------------------------------------------------------------------ */

/** [ce qu'on entend, réponse, variantes acceptées, explication, niveau]. */
const ORAL: [string, string, string[], string, Niv][] = [
  [
    'Écoute l’annonce : « Le train pour Lyon partira à dix heures. » À quelle heure part le train ?',
    'à 10 heures',
    ['à 10 heures', '10 heures', 'dix heures', 'à dix heures', '10 h'],
    'L’annonce dit : « à dix heures ».',
    'f',
  ],
  [
    'Écoute la consigne : « Sortez votre ardoise et votre craie. » Que faut-il sortir avec l’ardoise ?',
    'la craie',
    ['craie', 'la craie', 'une craie', 'ma craie', 'votre craie'],
    'La consigne demande l’ardoise et la craie.',
    'f',
  ],
  [
    'Écoute la météo : « Demain, il neigera sur les Alpes. » Quel temps fera-t-il sur les Alpes ?',
    'de la neige',
    ['neige', 'la neige', 'il neigera', 'il va neiger', 'de la neige'],
    'Le bulletin annonce de la neige sur les Alpes.',
    'f',
  ],
  [
    'Écoute : « Ce matin, Inès a trouvé un petit chat sous la pluie. » Quel animal Inès a-t-elle trouvé ?',
    'un chat',
    ['chat', 'un chat', 'le chat', 'un petit chat', 'chaton', 'un chaton'],
    'Inès a trouvé un petit chat.',
    'f',
  ],
  [
    'Écoute : « Tom rentre trempé, ses chaussures pleines d’eau. » Quel temps fait-il dehors ?',
    'il pleut',
    ['pluie', 'la pluie', 'il pleut', 'il a plu', 'il pleuvait'],
    'On ne le dit pas, on le devine : Tom est trempé, il pleut.',
    'n',
  ],
  [
    'Écoute : « Le pompier crie : sortez vite, la fumée est dangereuse ! » Que se passe-t-il ?',
    'un incendie',
    ['incendie', 'un incendie', 'un feu', 'le feu', 'il y a le feu', 'il y a un incendie'],
    'Un pompier et de la fumée : on devine qu’il y a un incendie.',
    'n',
  ],
  [
    'Écoute : « Léa monte sur la plus haute marche du podium et reçoit une médaille d’or. » Quelle place a-t-elle obtenue ?',
    'la première',
    ['première', 'la première', 'la première place', 'première place', 'elle a gagné', 'elle est première'],
    'La médaille d’or et la plus haute marche : Léa est première.',
    'n',
  ],
  [
    'Écoute : « Je vous parle en direct du stade, où quarante mille supporters chantent. » Où est le journaliste ?',
    'au stade',
    ['stade', 'au stade', 'dans le stade', 'le stade', 'dans un stade'],
    'Il le dit : « en direct du stade ».',
    'n',
  ],
  [
    'Écoute le début : « Il était une fois une princesse qui vivait dans un château. » Quel genre de texte commence ainsi ?',
    'un conte',
    ['conte', 'un conte', 'le conte', 'un conte de fées', 'conte de fées'],
    '« Il était une fois » : c’est le début d’un conte.',
    'n',
  ],
  [
    'Écoute : « Malo regarde l’heure, soupire, puis regarde encore l’heure : le bus n’est toujours pas là. » Comment se sent Malo ?',
    'impatient',
    ['impatient', 'il est impatient', 'il s’impatiente', 'énervé', 'agacé'],
    'Regarder l’heure et soupirer en attendant : Malo est impatient.',
    'p',
  ],
  [
    'Écoute : « Rien ne sert de courir ; il faut partir à point. » Quel genre de texte contient une leçon, une morale, comme celle-ci ?',
    'une fable',
    ['fable', 'une fable', 'la fable', 'une fable de La Fontaine'],
    'Une fable donne une leçon de vie, la morale, au début ou à la fin.',
    'p',
  ],
  [
    'Écoute : « Après la tempête, le marin dit : nous avons eu de la chance, le mât a tenu. » Où était le marin pendant la tempête ?',
    'sur un bateau',
    ['bateau', 'sur un bateau', 'sur le bateau', 'en mer', 'sur la mer', 'un bateau'],
    'Un mât, c’est sur un bateau : le marin était en mer.',
    'p',
  ],
  [
    'Écoute : « Ce texte a été écrit pour vous donner envie d’acheter ce jouet. » De quel genre de message s’agit-il ?',
    'une publicité',
    ['publicité', 'une publicité', 'la publicité', 'une pub', 'pub'],
    'Un message qui donne envie d’acheter est une publicité.',
    'p',
  ],
  [
    'Écoute : « Le reporter chuchote : la maman ourse et ses petits dorment juste derrière ce buisson. » Pourquoi chuchote-t-il ?',
    'pour ne pas les réveiller',
    [
      'pour ne pas les réveiller',
      'pour ne pas réveiller les ours',
      'pour ne pas faire de bruit',
      'pour ne pas les déranger',
      'pour ne pas leur faire peur',
    ],
    'Les ours dorment tout près : le reporter chuchote pour ne pas les réveiller.',
    'p',
  ],
];

function poolOral(level: Level, _rng: Rng, ctx: GenContext): Item[] {
  return ORAL.filter(([, , , , n]) => NIVEAUX[level].includes(n) || (level === 'normal' && n === 'f')).map(
    ([entendu, rep, acc, expl, n]) =>
      oral(ctx, `ecoute-${hash(entendu)}`, {
        // Le message et la question s'écoutent avec le haut-parleur (consigne lue) ; `spoken` = réponse modèle
        prompt: `🔊 ${entendu} Réponds à voix haute.`,
        spoken: rep,
        answer: rep,
        accepted: acc,
        explication: expl,
        difficulty: diff(level, DIFF[n]),
      }),
  );
}

/* ------------------------------------------------------------------ */
/* Écouter l'intonation (Feu tricolore)                                */
/* ------------------------------------------------------------------ */

/** [phrase sans ponctuation, signe entendu, niveau]. Les mêmes mots changent de sens avec la voix. */
const INTONATIONS: [string, '.' | '?' | '!', Niv][] = [
  ['Tu viens jouer avec nous', '?', 'f'],
  ['Tu viens jouer avec nous', '.', 'f'],
  ['Quelle belle journée', '!', 'f'],
  ['Le chat dort sur le canapé', '.', 'f'],
  ['Tu as faim', '?', 'f'],
  ['Comme ce gâteau est bon', '!', 'f'],
  ['Tu as fini tes devoirs', '?', 'n'],
  ['Tu as fini tes devoirs', '.', 'n'],
  ['Il est déjà huit heures', '?', 'p'],
  ['Il est déjà huit heures', '.', 'p'],
  ['Que ce paysage est beau', '!', 'n'],
  ['Vous partez demain matin', '?', 'p'],
  ['Vous partez demain matin', '.', 'p'],
  ['La sortie est annulée', '?', 'p'],
  ['La sortie est annulée', '.', 'p'],
  ['Quel courage tu as eu', '!', 'p'],
];

const POURQUOI: Record<'.' | '?' | '!', string> = {
  '?': 'La voix monte à la fin : c’est une question, il faut un point d’interrogation.',
  '.': 'La voix descend à la fin : la phrase donne une information, il faut un point.',
  '!': 'La voix exprime un sentiment fort (joie, surprise) : il faut un point d’exclamation.',
};

function poolIntonation(level: Level, rng: Rng, ctx: GenContext): Item[] {
  return INTONATIONS.filter(([, , n]) => NIVEAUX[level].includes(n) || (level === 'normal' && n === 'f')).map(
    ([phrase, signe, n]) =>
      qcm(ctx, rng, `intonation-${hash(phrase + signe)}`, {
        question: `🔊 Écoute bien la voix : quel signe faut-il à la fin de la phrase ? ${g(phrase)}`,
        spoken: signe === '.' ? `${phrase}.` : `${phrase} ${signe}`,
        good: signe,
        wrong: ['.', '?', '!'],
        fixedOrder: ['.', '?', '!'],
        explication: POURQUOI[signe],
        difficulty: DIFF[n],
        meta: { phrase },
      }),
  );
}

export const ORAL_CM2: ContentModule = {
  'CM2.FR.ORAL.ECOUTE': {
    pools: {
      mcq: (level, rng, ctx) => [...poolQcm(level, rng, ctx), ...poolIntonation(level, rng, ctx)],
      true_false: poolVraiFaux,
      oral_answer: poolOral,
      pairing: aucun,
    },
  },
};
