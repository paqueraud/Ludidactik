/**
 * Compléments du 08/10/2026 (audit BO) : entrées ajoutées aux fiches pour que chaque jeu proposé ait
 * assez d'items à chaque niveau (sciences au Facile : Laboratoire, Puzzle, Machine à remonter le temps ;
 * Attrape-Bulles au Plus loin : réponses courtes ; frises et paires du Facile en histoire).
 * Elles s'ajoutent aux entrées des fiches d'origine (`index.ts`).
 */
import type { Fiche } from './outils';

export const COMPLEMENTS: Record<string, Omit<Partial<Fiche>, 'lecon'>> = {
  /* ------------------------------ Sciences ------------------------------ */
  'CM2.SC.MATIERE': {
    classements: [
      {
        id: 'chauffer-refroidir',
        niv: 'f',
        prompt: 'Pour obtenir cela, faut-il chauffer ou refroidir ?',
        cats: ['chauffer', 'refroidir'],
        els: [
          ['faire fondre un glaçon', 0, '🧊'],
          ['faire fondre du chocolat', 0, '🍫'],
          ['faire bouillir de l’eau', 0, '♨️'],
          ['fabriquer des glaçons', 1, '❄️'],
          ['faire geler de l’eau', 1],
          ['faire durcir de la cire fondue', 1, '🕯️'],
        ],
        e: 'En chauffant, un solide fond et un liquide bout ; en refroidissant, un liquide devient solide.',
      },
    ],
    etapes: [
      {
        id: 'chocolat',
        niv: 'f',
        prompt: 'On fait fondre du chocolat, puis on le met au frais : remets les étapes dans l’ordre.',
        els: [
          'du chocolat en tablette (solide)',
          'du chocolat fondu (liquide)',
          'du chocolat durci au frais (solide)',
        ],
        e: 'En chauffant, le chocolat fond ; au frais, il redevient solide : c’est toujours du chocolat.',
      },
      {
        id: 'flaque',
        niv: 'f',
        prompt: 'Une flaque au soleil : remets les étapes dans l’ordre.',
        els: [
          'Il pleut : une flaque se forme.',
          'Le soleil chauffe la flaque.',
          'L’eau s’évapore peu à peu.',
          'La flaque a disparu.',
        ],
        e: 'L’eau de la flaque ne disparaît pas vraiment : elle devient de la vapeur d’eau dans l’air.',
      },
    ],
  },
  'CM2.SC.ENERGIE': {
    classements: [
      {
        id: 'electrique',
        niv: 'f',
        prompt: 'Cet objet a-t-il besoin d’électricité pour fonctionner ?',
        cats: ['oui, il a besoin d’électricité', 'non'],
        els: [
          ['le réfrigérateur', 0],
          ['la lampe de chevet', 0, '💡'],
          ['le grille-pain', 0],
          ['le vélo', 1, '🚲'],
          ['le cerf-volant', 1, '🪁'],
          ['la planche à voile', 1],
        ],
        e: 'Le réfrigérateur, la lampe et le grille-pain se branchent sur une prise ; le vélo avance grâce aux muscles, le cerf-volant et la planche à voile grâce au vent.',
      },
    ],
    etapes: [
      {
        id: 'eolienne-f',
        niv: 'f',
        prompt: 'Remets dans l’ordre : comment le vent allume une lampe grâce à une éolienne.',
        els: [
          'Le vent souffle.',
          'Les pales de l’éolienne tournent.',
          'L’électricité produite allume une lampe.',
        ],
        e: 'L’énergie du vent fait tourner l’éolienne, qui produit de l’électricité.',
      },
      {
        id: 'grille-pain',
        niv: 'f',
        prompt: 'Remets dans l’ordre : comment le grille-pain fait griller le pain.',
        els: [
          'On branche le grille-pain sur une prise.',
          'L’électricité fait chauffer le grille-pain.',
          'Le pain devient doré et croustillant.',
        ],
        e: 'L’électricité est transformée en chaleur, qui fait griller le pain.',
      },
    ],
  },
  'CM2.SC.MOUVEMENT': {
    classements: [
      {
        id: 'droit-rond',
        niv: 'f',
        prompt: 'Ce mouvement se fait-il en ligne droite ou en rond ?',
        cats: ['en ligne droite', 'en rond'],
        els: [
          ['un coureur de 100 mètres', 0, '🏃'],
          ['un ascenseur qui monte', 0],
          ['une boule de bowling lancée tout droit', 0, '🎳'],
          ['la nacelle d’une grande roue', 1, '🎡'],
          ['un cheval de manège', 1, '🎠'],
          ['le bout de l’aiguille d’une horloge', 1, '🕰️'],
        ],
        e: 'En ligne droite, la trajectoire est rectiligne ; en rond, elle est circulaire.',
      },
    ],
  },
  'CM2.SC.SIGNAL': {
    classements: [
      {
        id: 'danger',
        niv: 'f',
        prompt: 'Ce signal prévient-il d’un danger ?',
        cats: ['il prévient d’un danger', 'il donne une autre information'],
        els: [
          ['la sirène des pompiers', 0, '🚒'],
          ['le détecteur de fumée qui sonne', 0],
          ['le panneau « attention, travaux »', 0, '🚧'],
          ['la sonnerie de fin de récréation', 1, '🔔'],
          ['le feu vert', 1, '🟢'],
          ['la sonnerie du téléphone', 1, '📱'],
        ],
        e: 'Certains signaux avertissent d’un danger (sirène, alarme) ; d’autres donnent une information (feu vert, sonnerie).',
      },
      {
        id: 'emetteur-recepteur',
        niv: 'p',
        prompt: 'Émetteur ou récepteur du signal ?',
        cats: ['émetteur (il envoie le signal)', 'récepteur (il reçoit le signal)'],
        els: [
          ['la lampe qui clignote en morse', 0, '🔦'],
          ['le haut-parleur', 0, '🔊'],
          ['la télécommande', 0],
          ['l’œil qui voit la lumière', 1, '👁️'],
          ['l’oreille', 1, '👂'],
          ['l’antenne d’un poste de radio', 1, '📻'],
        ],
        e: 'L’émetteur envoie le signal ; le récepteur le reçoit et le transforme en information.',
      },
    ],
  },
  'CM2.SC.VIVANT.CLASSER': {
    classements: [
      {
        id: 'animal-vegetal',
        niv: 'f',
        prompt: 'Animal ou végétal ?',
        cats: ['animal', 'végétal'],
        els: [
          ['l’escargot', 0, '🐌'],
          ['la baleine', 0, '🐋'],
          ['le moineau', 0, '🐦'],
          ['le chêne', 1, '🌳'],
          ['la fougère', 1, '🌿'],
          ['la tulipe', 1, '🌷'],
        ],
        e: 'Pour classer les êtres vivants, on commence par séparer les animaux et les végétaux.',
      },
    ],
  },
  'CM2.SC.VIVANT.CORPS': {
    classements: [
      {
        id: 'sante',
        niv: 'f',
        prompt: 'Bon pour ma santé, ou à limiter ?',
        cats: ['bon pour ma santé', 'à limiter'],
        els: [
          ['dormir 10 heures par nuit', 0, '🛏️'],
          ['boire de l’eau', 0, '💧'],
          ['faire du sport', 0, '⚽'],
          ['manger des fruits', 0, '🍎'],
          ['boire des sodas', 1, '🥤'],
          ['manger des bonbons chaque jour', 1, '🍬'],
          ['regarder un écran tard le soir', 1, '📱'],
        ],
        e: 'Dormir, bouger, boire de l’eau et manger des fruits aident le corps ; le sucre et les écrans du soir sont à limiter.',
      },
    ],
    etapes: [
      {
        id: 'air-f',
        niv: 'f',
        prompt: 'Remets dans l’ordre le trajet de l’air quand je respire.',
        els: [
          'L’air entre par le nez ou la bouche.',
          'Il descend dans la trachée.',
          'Il remplit les poumons.',
        ],
        e: 'Quand on inspire, l’air passe par le nez ou la bouche, la trachée, puis arrive dans les poumons.',
      },
      {
        id: 'effort',
        niv: 'f',
        prompt: 'Remets dans l’ordre : que se passe-t-il quand je cours ?',
        els: [
          'Je cours vite.',
          'Mon cœur bat plus fort et je respire plus vite.',
          'Je me repose et mon cœur ralentit.',
        ],
        e: 'Pendant un effort, les muscles ont besoin de plus d’oxygène : le cœur et la respiration accélèrent.',
      },
    ],
  },
  'CM2.SC.VIVANT.ECOSYS': {
    classements: [
      {
        id: 'vegetal-animal',
        niv: 'f',
        prompt: 'Végétal ou animal ?',
        cats: ['végétal', 'animal'],
        els: [
          ['l’herbe', 0, '🌱'],
          ['le chêne', 0, '🌳'],
          ['les algues', 0],
          ['le renard', 1, '🦊'],
          ['la mésange', 1, '🐦'],
          ['la coccinelle', 1, '🐞'],
        ],
        e: 'Les végétaux fabriquent leur propre matière ; les animaux mangent d’autres êtres vivants.',
      },
    ],
    etapes: [
      {
        id: 'sauterelle',
        niv: 'f',
        prompt: 'Chaîne alimentaire : range du végétal jusqu’au dernier mangeur (« est mangé par »).',
        els: ['l’herbe', 'la sauterelle', 'la grenouille'],
        e: 'L’herbe est mangée par la sauterelle, qui est mangée par la grenouille.',
      },
      {
        id: 'souris',
        niv: 'f',
        prompt: 'Chaîne alimentaire : range du végétal jusqu’au dernier mangeur (« est mangé par »).',
        els: ['les graines', 'la souris', 'la chouette'],
        e: 'Les graines sont mangées par la souris, qui est mangée par la chouette.',
      },
    ],
    qcm: [
      {
        id: 'decomposeur-court',
        niv: 'p',
        q: 'Que fait un décomposeur, comme le ver de terre ?',
        r: 'il recycle les restes',
        f: ['il fabrique du sucre', 'il chasse des proies', 'il pollinise les fleurs'],
        e: 'Les décomposeurs transforment les feuilles mortes et les restes en sels minéraux pour le sol.',
      },
      {
        id: 'producteur-court',
        niv: 'p',
        q: 'Lequel de ces êtres vivants est un producteur ?',
        r: 'le blé',
        f: ['le ver de terre', 'le renard', 'la vache'],
        e: 'Un producteur fabrique sa matière grâce à la lumière : c’est un végétal vert, comme le blé.',
      },
      {
        id: 'pollinisation-court',
        niv: 'p',
        q: 'Pourquoi les abeilles sont-elles utiles à la biodiversité ?',
        r: 'elles pollinisent les fleurs',
        f: ['elles mangent les pucerons', 'elles arrosent les plantes', 'elles chassent les guêpes'],
        e: 'En transportant le pollen de fleur en fleur, les abeilles permettent aux plantes de donner des fruits et des graines.',
      },
    ],
  },
  'CM2.SC.TERRE': {
    classements: [
      {
        id: 'risques-f',
        niv: 'f',
        prompt: 'Risque naturel ou phénomène sans danger ?',
        cats: ['risque naturel', 'phénomène sans danger'],
        els: [
          ['un séisme', 0],
          ['une éruption volcanique', 0, '🌋'],
          ['une tempête', 0, '🌪️'],
          ['un arc-en-ciel', 1, '🌈'],
          ['le lever du Soleil', 1, '🌅'],
          ['la pleine lune', 1, '🌕'],
        ],
        e: 'Séismes, éruptions et tempêtes peuvent être dangereux : ce sont des risques naturels.',
      },
    ],
    etapes: [
      {
        id: 'journee',
        niv: 'f',
        prompt: 'Remets dans l’ordre le trajet apparent du Soleil dans le ciel pendant une journée.',
        els: [
          'Le matin, le Soleil se lève à l’est.',
          'À midi, il est au plus haut dans le ciel.',
          'Le soir, il se couche à l’ouest.',
        ],
        e: 'Le Soleil semble se déplacer d’est en ouest : c’est en réalité la Terre qui tourne sur elle-même.',
      },
    ],
  },
  'CM2.SC.TECHNO': {
    classements: [
      {
        id: 'naturel-fabrique',
        niv: 'f',
        prompt: 'Matériau naturel ou fabriqué par l’homme ?',
        cats: ['naturel', 'fabriqué par l’homme'],
        els: [
          ['le bois', 0, '🪵'],
          ['la laine', 0, '🧶'],
          ['la pierre', 0, '🪨'],
          ['le plastique', 1],
          ['le verre', 1],
          ['l’acier', 1],
        ],
        e: 'Le bois, la laine et la pierre se trouvent dans la nature ; le plastique, le verre et l’acier sont fabriqués par l’homme.',
      },
    ],
  },

  /* ------------------------------ Histoire ------------------------------ */
  'CM2.HI20.T2.ENERGIES': {
    paires: [
      {
        id: 'machines-f',
        niv: 'f',
        prompt: 'Associe chaque machine à l’énergie qui la fait fonctionner.',
        relation: 'machine → énergie',
        pairs: [
          ['la locomotive', 'le charbon'],
          ['le tramway', 'l’électricité'],
          ['l’automobile', 'l’essence'],
          ['le moulin à vent', 'le vent'],
        ],
        e: 'La locomotive à vapeur brûle du charbon, le tramway roule à l’électricité, l’automobile à l’essence et le moulin tourne grâce au vent.',
      },
    ],
  },
  'CM2.HI26.T2': {
    lieux: [
      {
        id: 'europe-f',
        niv: 'f',
        map: 'monde',
        target: 'europe',
        label: 'l’Europe',
        prompt: 'Touche le continent où se trouve la France.',
        e: 'La France se trouve en Europe ; son empire colonial s’étendait sur d’autres continents.',
      },
    ],
  },
  'CM2.HI26.T4': {
    evts: [
      { id: 'verdun-f', niv: 'f', nivAnnee: null, label: 'Bataille de Verdun', date: '1916', t: 1916.02 },
      {
        id: 'soldat-inconnu',
        niv: 'f',
        nivAnnee: null,
        label: 'Le Soldat inconnu repose sous l’Arc de triomphe',
        date: '11 novembre 1920',
        t: 1920.1111,
      },
    ],
    paires: [
      {
        id: 'mots-f',
        niv: 'f',
        prompt: 'Associe chaque mot à son sens.',
        relation: 'mot → sens',
        pairs: [
          ['le poilu', 'le soldat français'],
          ['la tranchée', 'le fossé des soldats'],
          ['l’armistice', 'la fin des combats'],
          ['le front', 'la ligne des combats'],
        ],
        e: 'Le poilu est le soldat français ; il vit dans la tranchée, sur le front, jusqu’à l’armistice du 11 novembre 1918.',
      },
    ],
  },

  /* ------------------------------ Géographie ------------------------------ */
  'CM2.GE20.T3.HABITER': {
    qcm: [
      {
        id: 'compost-court',
        niv: 'p',
        q: 'Que devient le compost ?',
        r: 'de l’engrais pour le jardin',
        f: ['du plastique', 'de l’essence', 'du verre'],
        e: 'Les épluchures se décomposent en compost, un engrais naturel pour les plantes.',
      },
      {
        id: 'isolation-court',
        niv: 'p',
        q: 'À quoi sert l’isolation d’un logement ?',
        r: 'à garder la chaleur',
        f: ['à faire plus de bruit', 'à laisser entrer le froid', 'à agrandir la maison'],
        e: 'Une maison bien isolée garde la chaleur en hiver : on dépense moins d’énergie pour chauffer.',
      },
      {
        id: 'toit-vegetal',
        niv: 'p',
        q: 'Que permet un toit couvert de plantes ?',
        r: 'rafraîchir le bâtiment',
        f: ['produire du pétrole', 'faire tomber la pluie', 'chauffer la rue'],
        e: 'Les plantes rafraîchissent le bâtiment l’été, retiennent l’eau de pluie et accueillent des insectes.',
      },
    ],
  },
  'CM2.GE26.T1': {
    paires: [
      {
        id: 'regions-f2',
        niv: 'f',
        prompt: 'Associe chaque région à sa capitale régionale.',
        relation: 'région → capitale',
        pairs: [
          ['l’Occitanie', 'Toulouse'],
          ['le Grand Est', 'Strasbourg'],
          ['la Normandie', 'Rouen'],
          ['les Hauts-de-France', 'Lille'],
        ],
        e: 'Toulouse (Occitanie), Strasbourg (Grand Est), Rouen (Normandie), Lille (Hauts-de-France).',
      },
    ],
    vf: [
      {
        id: 'chef-lieu',
        niv: 'p',
        s: 'Toulouse est le chef-lieu de la région Occitanie.',
        v: true,
        e: 'Le chef-lieu d’une région est la ville où siègent le conseil régional et le préfet de région : Toulouse pour l’Occitanie.',
      },
    ],
  },

  /* ------------------------------ EMC ------------------------------ */
  'CM2.EMC.DROITS': {
    qcm: [
      {
        id: 'ecole-court',
        niv: 'f',
        q: 'Quel droit permet à chaque enfant d’aller à l’école ?',
        r: 'le droit à l’éducation',
        f: ['le droit de vote', 'le droit de conduire'],
        e: 'La Convention internationale des droits de l’enfant (1989) protège le droit à l’éducation.',
      },
      {
        id: '119-court',
        niv: 'f',
        q: 'Quel numéro appeler si un enfant est en danger ?',
        r: 'le 119',
        f: ['le 911', 'le 1789'],
        e: 'Le 119 (Allô enfance en danger) est gratuit et répond jour et nuit ; le 911 est un numéro d’urgence américain.',
      },
      {
        id: 'egalite-court',
        niv: 'f',
        q: 'Les filles et les garçons ont-ils les mêmes droits ?',
        r: 'oui, les mêmes droits',
        f: ['non, pas les mêmes', 'seulement à l’école'],
        e: 'Filles et garçons sont égaux en droits : c’est l’égalité filles-garçons.',
        g: false,
      },
    ],
  },
  'CM2.EMC.NUMERIQUE': {
    qcm: [
      {
        id: 'source-court',
        niv: 'p',
        q: 'Avant de partager une information, que dois-je vérifier ?',
        r: 'sa source',
        f: ['sa couleur', 'sa longueur', 'son nombre d’émojis'],
        e: 'Je cherche qui a publié l’information et si d’autres sources sérieuses disent la même chose.',
      },
      {
        id: 'image-court',
        niv: 'p',
        q: 'Que faut-il avant de publier la photo d’un ami ?',
        r: 'son accord',
        f: ['un bon téléphone', 'un filtre', 'beaucoup d’abonnés'],
        e: 'C’est le droit à l’image : on demande l’accord de la personne avant de publier sa photo.',
      },
      {
        id: 'pseudo-court',
        niv: 'p',
        q: 'Sur un jeu en ligne, quel pseudonyme choisir ?',
        r: 'un nom inventé',
        f: ['mon nom et mon prénom', 'mon adresse', 'le nom de mon école'],
        e: 'Un pseudonyme inventé protège mes données personnelles.',
      },
    ],
  },
  'CM2.EMC.ENGAGEMENT': {
    qcm: [
      {
        id: 'secret-court',
        niv: 'p',
        q: 'Pourquoi vote-t-on à bulletin secret ?',
        r: 'pour voter librement',
        f: ['pour aller plus vite', 'pour gagner un prix', 'pour cacher les candidats'],
        e: 'Le vote secret permet à chacun de choisir librement, sans être influencé.',
      },
      {
        id: 'benevole-court',
        niv: 'p',
        q: 'Un bénévole est une personne qui…',
        r: 'aide sans être payée',
        f: ['travaille à la mairie', 'est élue', 'vend des objets'],
        e: 'Le bénévole donne de son temps gratuitement, souvent dans une association.',
      },
      {
        id: 'eco-court',
        niv: 'p',
        q: 'Quel geste est un écogeste ?',
        r: 'éteindre la lumière',
        f: ['laisser couler l’eau', 'jeter ses déchets par terre', 'laisser la fenêtre ouverte l’hiver'],
        e: 'Éteindre la lumière en sortant économise l’énergie.',
      },
    ],
  },
};

/** Ajoute les compléments aux entrées d'une fiche. */
export function completer(f: Fiche): Fiche {
  const c = COMPLEMENTS[f.lecon];
  if (!c) return f;
  const out: Fiche = { ...f };
  for (const [k, v] of Object.entries(c) as [keyof Fiche, unknown[]][])
    (out as unknown as Record<string, unknown[]>)[k] = [
      ...(((f as unknown as Record<string, unknown[] | undefined>)[k] as unknown[]) ?? []),
      ...v,
    ];
  return out;
}
