import { Lesson, DifficultyLevel, MountainWord, HistoryQuestion, ScienceItem } from '../types';

export const CURRICULUM_LESSONS: Lesson[] = [
  // ==========================================
  // CE1 - CYCLE 2 (ANNÉE COMPLÈTE - MODALITÉS MULTIPLES)
  // ==========================================
  {
    id: 'ce1-maths-additions-p1',
    grade: 'CE1',
    subject: 'maths',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Course de Calcul : Additions & Compléments à 10',
    subtitle: 'Galop réflexe des amis de 10 et des doubles',
    icon: 'Calculator',
    badgeName: 'Galopeur des Nombres',
    gameType: 'horse-race',
    modality: 'reflexe',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - Attendu CE1 P1 : "Mémoriser des faits numériques élémentaires (tables d\'addition, doubles, compléments à 10)"',
    boObjectives: [
      'Mémoriser les compléments à 10 (1+9, 2+8, 3+7...)',
      'Connaître les doubles jusqu\'à 5+5',
      'Calculer mentalement des sommes simples sans poser l\'opération'
    ],
    memo: {
      ruleTitle: 'L\'astuce des Amis de 10 et des Doubles',
      keyPoints: [
        'Les amis de 10 font toujours 10 ensemble : 1+9, 2+8, 3+7, 4+6, 5+5.',
        'Les doubles sont faciles à retenir : 2+2=4, 3+3=6, 4+4=8, 5+5=10.',
        'Pour faire 8+5 : je fais 8+2=10, puis 10+3=13 !'
      ],
      example: 'Exemple : 7 + 3 = 10 | 4 + 4 = 8 | 8 + 5 = 13',
      proTip: 'Cherche toujours à faire 10 d\'abord, c\'est le tremplin du calcul !'
    }
  },
  {
    id: 'ce1-maths-bulles-visuel-p1',
    grade: 'CE1',
    subject: 'maths',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Attrape-Bulles : Les Nombres Complémentaires',
    subtitle: 'Détection visuelle rapide des paires qui font 10',
    icon: 'Sparkles',
    badgeName: 'Œil de Lynx Spatial',
    gameType: 'bubble-catch',
    modality: 'regarder',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CE1 : "Reconnaître visuellement et instantanément les décompositions additives de 10"',
    boObjectives: [
      'Scanner visuellement l\'espace pour repérer les compléments à 10',
      'Éviter les bulles pièges',
      'Développer la vitesse d\'analyse visuelle'
    ],
    memo: {
      ruleTitle: 'Repérage visuel des compléments à 10',
      keyPoints: [
        'Repère immédiatement : 9+1, 8+2, 7+3, 6+4, 5+5.',
        'Ignore les intrus comme 7+2=9 ou 5+3=8 !'
      ],
      example: 'Bulle 7+3 -> À éclater sans hésiter !',
      proTip: 'Garde ton œil au centre de l\'écran pour voir toutes les bulles monter.'
    }
  },
  {
    id: 'ce1-maths-soustractions-p2',
    grade: 'CE1',
    subject: 'maths',
    period: 'P2',
    periodLabel: 'Période 2 (Nov-Déc)',
    title: 'Course de Calcul : Soustractions & Reculer',
    subtitle: 'Enlever un petit nombre et calculer un écart',
    icon: 'Zap',
    badgeName: 'Flèche du Retrait',
    gameType: 'horse-race',
    modality: 'reflexe',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CE1 P2 : "Calculer mentalement des soustractions simples"',
    boObjectives: [
      'Soustraire un petit nombre en reculant sur la file numérique',
      'Calculer le complément à la dizaine supérieure'
    ],
    memo: {
      ruleTitle: 'Comment bien soustraire mentalement',
      keyPoints: [
        'Pour faire 10 - 4 : je pense aux amis de 10, c\'est 6 !',
        'Pour 14 - 5 : j\'enlève 4 pour aller à 10, puis encore 1 pour faire 9.'
      ],
      example: '10 - 7 = 3 | 16 - 4 = 12 | 14 - 5 = 9',
      proTip: 'Recule d\'abord jusqu\'à 10, c\'est toujours plus facile !'
    }
  },
  {
    id: 'ce1-francais-mots-invariables-p1',
    grade: 'CE1',
    subject: 'francais',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Ascension Orthographe : Mots Invariables',
    subtitle: 'Dictée audio & escalade des mots qui ne changent jamais',
    icon: 'Feather',
    badgeName: 'Alpiniste des Lettres',
    gameType: 'mountain-climb',
    modality: 'ecouter',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CE1 P1 : "Mémoriser l\'orthographe des mots invariables les plus fréquents"',
    boObjectives: [
      'Mémoriser les mots fréquents (avec, dans, plus, très)',
      'Identifier les lettres muettes finales (s, t)',
      'Écrire sous la dictée audio sans faute'
    ],
    memo: {
      ruleTitle: 'Ces petits mots fidèles qui ne changent jamais',
      keyPoints: [
        'Un mot invariable ne prend ni féminin ni pluriel.',
        '"dans" et "très" finissent par un "s" muet.',
        '"avec" s\'écrit avec un c à la fin.'
      ],
      example: '"avec", "dans", "très", "plus"',
      proTip: 'Pense à faire une photo du mot dans ta tête !'
    }
  },
  {
    id: 'ce1-francais-gutenberg-p1',
    grade: 'CE1',
    subject: 'francais',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Presse de Gutenberg : Tampons de Mots',
    subtitle: 'Reconstitution physique et kinesthésique lettre par lettre',
    icon: 'PenTool',
    badgeName: 'Apprenti Typographe',
    gameType: 'gutenberg-press',
    modality: 'ecrire',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CE1 : "Former les mots en manipulant l\'ordre exact des graphèmes"',
    boObjectives: [
      'Placer les lettres dans l\'ordre séquentiel parfait',
      'Identifier les lettres muettes finales',
      'Développer la motricité d\'assemblage orthographique'
    ],
    memo: {
      ruleTitle: 'L\'art d\'imprimer les mots',
      keyPoints: [
        'Chaque mot est composé de lettres rangées dans l\'ordre précis.',
        'La presse de Gutenberg vérifie chaque lettre une par une.'
      ],
      example: 'c - h - â - t - e - a - u -> château',
      proTip: 'Vérifie bien les accents avant d\'actionner le levier de la presse !'
    }
  },
  {
    id: 'ce1-francais-pluriel-p2',
    grade: 'CE1',
    subject: 'francais',
    period: 'P2',
    periodLabel: 'Période 2 (Nov-Déc)',
    title: 'Le Train des Sons : Singulier ou Pluriel ?',
    subtitle: 'Discrimination auditive et aiguillage des trains',
    icon: 'BookOpen',
    badgeName: 'Chef de Gare Grammatical',
    gameType: 'sound-train',
    modality: 'ecouter',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CE1 P2 : "Distinguer auditivement et orthographier le pluriel"',
    boObjectives: [
      'Écouter la phrase et identifier le singulier ou le pluriel',
      'Aiguiller le train sur la bonne voie'
    ],
    memo: {
      ruleTitle: 'L\'accord à l\'oreille et à l\'écrit',
      keyPoints: [
        'Les oiseaux -> finit par un x.',
        'Les chiens -> prend un s.'
      ],
      example: 'des gâteaux, des oiseaux',
      proTip: 'Écoute bien le petit mot avant (le déterminant) : un ou des ?'
    }
  },
  {
    id: 'ce1-histoire-temps-p2',
    grade: 'CE1',
    subject: 'histoire',
    period: 'P2',
    periodLabel: 'Période 2 (Nov-Déc)',
    title: 'Le Défi du Temps : L\'École d\'Autrefois',
    subtitle: 'La plume, l\'encrier, le poêle et le buvard',
    icon: 'Hourglass',
    badgeName: 'Voyageur du Temps',
    gameType: 'guillotine-history',
    modality: 'regarder',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - Cycle 2 : "Comparer l\'école d\'autrefois et l\'école d\'aujourd\'hui"',
    boObjectives: [
      'Identifier les objets scolaires d\'autrefois',
      'Comprendre la vie quotidienne des élèves au début du XXe siècle',
      'Connaître le rôle de Jules Ferry'
    ],
    memo: {
      ruleTitle: 'L\'école de nos arrière-grands-parents',
      keyPoints: [
        'On écrivait avec une plume métallique trempée dans un encrier.',
        'Le buvard buvait le surplus d\'encre pour éviter les pâtés.',
        'La classe était chauffée par un poêle à bois ou à charbon.'
      ],
      example: 'En 1882, Jules Ferry rend l\'école gratuite et obligatoire.',
      proTip: 'Les élèves méritants gagnaient des bons points !'
    }
  },
  {
    id: 'ce1-histoire-reporter-oral-p2',
    grade: 'CE1',
    subject: 'histoire',
    period: 'P2',
    periodLabel: 'Période 2 (Nov-Déc)',
    title: 'Micro du Reporter : Raconte l\'École d\'Antan',
    subtitle: 'Expression orale au micro en direct pour la radio',
    icon: 'Shield',
    badgeName: 'Jeune Reporter Historien',
    gameType: 'speech-reporter',
    modality: 'parler',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - Cycle 2 : "Prendre la parole et formuler oralement des connaissances"',
    boObjectives: [
      'Répondre à voix haute dans le micro',
      'Exprimer les notions d\'Histoire avec clarté',
      'Développer l\'aisance à l\'oral'
    ],
    memo: {
      ruleTitle: 'L\'art de raconter à voix haute',
      keyPoints: [
        'Parle distinctement et calmement dans le micro.',
        'Utilise les mots justes : plume, encrier, buvard, blouse.'
      ],
      example: '"Les écoliers écrivaient à la plume et à l\'encre."',
      proTip: 'Articule bien chaque syllabe devant le micro !'
    }
  },
  {
    id: 'ce1-sciences-etats-eau-p1',
    grade: 'CE1',
    subject: 'sciences',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Sciences : Les 3 États de l\'Eau',
    subtitle: 'Solide, liquide et gazeux dans la nature',
    icon: 'Droplets',
    badgeName: 'Savant de l\'Eau',
    gameType: 'lab-quiz',
    modality: 'regarder',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - Matière Cycle 2 : "Identifier les trois états de l\'eau et leurs changements"',
    boObjectives: [
      'Reconnaître l\'eau liquide, solide et gazeuse',
      'Comprendre la fusion et la solidification'
    ],
    memo: {
      ruleTitle: 'Les métamorphoses de l\'eau',
      keyPoints: [
        'À moins de 0°C : l\'eau gèle et devient solide.',
        'À 100°C : l\'eau bout et s\'évapore en vapeur d\'eau.'
      ],
      example: 'Un glaçon au soleil = Fusion (solide vers liquide).',
      proTip: 'La buée, c\'est de la vapeur qui redevient liquide !'
    }
  },

  // ==========================================
  // CM2 - CYCLE 3 (ANNÉE COMPLÈTE - MODALITÉS MULTIPLES)
  // ==========================================
  {
    id: 'cm2-maths-grandes-tables-p1',
    grade: 'CM2',
    subject: 'maths',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Course de Calcul : Grandes Tables & Multiples',
    subtitle: 'Tables de 6, 7, 8, 9 et carrés parfaits au galop',
    icon: 'Gauge',
    badgeName: 'Champion des Multiples',
    gameType: 'horse-race',
    modality: 'reflexe',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CM2 P1 : "Mémoriser les tables de multiplication jusqu\'à 9 et savoir les utiliser avec rapidité"',
    boObjectives: [
      'Automatiser les produits réflexes (7×8=56, 8×9=72, 6×7=42)',
      'Connaître les carrés parfaits (6×6=36, 7×7=49, 8×8=64, 9×9=81)'
    ],
    memo: {
      ruleTitle: 'Les tables expertes sans hésitation',
      keyPoints: [
        '5, 6, 7, 8 : c\'est le secret de 56 = 7 × 8 !',
        'Pour la table de 9 : la somme des chiffres fait 9 (54 -> 5+4=9).'
      ],
      example: '7 × 8 = 56 | 8 × 9 = 72 | 6 × 9 = 54',
      proTip: 'Pour 9 × 7 : fais 10 × 7 = 70 puis retire 7 = 63 !'
    }
  },
  {
    id: 'cm2-maths-bulles-multiples-p1',
    grade: 'CM2',
    subject: 'maths',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Attrape-Bulles : Les Multiples Mystères',
    subtitle: 'Réflexe visuel spatial : éclate uniquement les multiples de 5 et 10',
    icon: 'Sparkles',
    badgeName: 'Laser des Multiples',
    gameType: 'bubble-catch',
    modality: 'regarder',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CM2 : "Reconnaître visuellement les multiples des nombres usuels"',
    boObjectives: [
      'Repérer instantanément les multiples de 5 et 10',
      'Développer l\'agilité visuelle sous pression du chrono'
    ],
    memo: {
      ruleTitle: 'Reconnaître les multiples au premier coup d\'œil',
      keyPoints: [
        'Un multiple de 5 se termine toujours par 0 ou 5 (25, 40, 75, 100).',
        'Un nombre qui se termine par 3, 7 ou 9 n\'est jamais un multiple de 5 !'
      ],
      example: 'Bulle 45 -> Multiple de 5 ! Bulle 37 -> Piège !',
      proTip: 'Regarde uniquement le chiffre des unités !'
    }
  },
  {
    id: 'cm2-maths-fractions-pourcentages-p3',
    grade: 'CM2',
    subject: 'maths',
    period: 'P3',
    periodLabel: 'Période 3 (Janv-Fév)',
    title: 'Course de Calcul : Fractions & Pourcentages',
    subtitle: 'Moitiés (50%), quarts (25%), dixièmes (10%)',
    icon: 'PieChart',
    badgeName: 'Maître des Fractions',
    gameType: 'horse-race',
    modality: 'reflexe',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CM2 P3 : "Calculer des pourcentages simples (50%, 25%, 10%)"',
    boObjectives: [
      'Calculer mentalement 50% (la moitié) et 25% (le quart)',
      'Calculer 10% en divisant par 10'
    ],
    memo: {
      ruleTitle: 'Les équivalences magiques',
      keyPoints: [
        '50% d\'un nombre = couper en deux (50% de 80 = 40).',
        '25% d\'un nombre = couper en deux deux fois (le quart) : 25% de 80 = 20.',
        '10% d\'un nombre = diviser par 10 : 10% de 350 = 35.'
      ],
      example: '1/2 de 64 = 32 | 25% de 100 = 25 | 10% de 80 = 8',
      proTip: 'Pour 75%, additionne 50% et 25% !'
    }
  },
  {
    id: 'cm2-francais-homophones-train-p1',
    grade: 'CM2',
    subject: 'francais',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Le Train des Homophones : a/à, et/est, son/sont',
    subtitle: 'Écoute la phrase et règle l\'aiguillage sur la bonne voie',
    icon: 'Headphones',
    badgeName: 'Maître Aiguilleur Homophones',
    gameType: 'sound-train',
    modality: 'ecouter',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CM2 P1 : "Distinguer les homophones grammaticaux fondamentaux à l\'audition et à l\'écrit"',
    boObjectives: [
      'Distinguer a/à avec le test de l\'imparfait "avait"',
      'Distinguer et/est avec le test "était"',
      'Aiguiller le train sans faire d\'accident'
    ],
    memo: {
      ruleTitle: 'Les tests infaillibles de substitution',
      keyPoints: [
        'a / à : si je peux remplacer par "avait", c\'est le verbe avoir -> "a" sans accent !',
        'et / est : si je peux remplacer par "était", c\'est le verbe être -> "est" ! Sinon "et" = "et puis".'
      ],
      example: 'Il a (avait) pris son vélo et (et puis) il est (était) parti.',
      proTip: 'Mets la phrase à l\'imparfait dans ta tête !'
    }
  },
  {
    id: 'cm2-francais-homophones-p1',
    grade: 'CM2',
    subject: 'francais',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Ascension Orthographe : Homophones a/à, et/est',
    subtitle: 'Grimpe la montagne des homophones sous la dictée',
    icon: 'Feather',
    badgeName: 'As de l\'Orthographe',
    gameType: 'mountain-climb',
    modality: 'ecrire',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CM2 P1 : "Distinguer les homophones grammaticaux fondamentaux"',
    boObjectives: [
      'Appliquer le test de substitution à l\'écrit',
      'Orthographier sans faute les prépositions et verbes'
    ],
    memo: {
      ruleTitle: 'Les astuces de l\'alpiniste',
      keyPoints: [
        'son / sont : si je peux dire "étaient", c\'est "sont" (verbe être).'
      ],
      example: 'Les enfants sont attentifs.',
      proTip: 'Vérifie toujours si le sujet est au singulier ou au pluriel !'
    }
  },
  {
    id: 'cm2-histoire-revolution-p1',
    grade: 'CM2',
    subject: 'histoire',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Défi de la Révolution : Sauve ta Tête !',
    subtitle: '1789, la Bastille, le Tiers-État et la République',
    icon: 'Shield',
    badgeName: 'Citoyen Sans-Culotte',
    gameType: 'guillotine-history',
    modality: 'regarder',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CM2 P1 : "1789 : l\'année de tous les bouleversements"',
    boObjectives: [
      'Connaître les 3 ordres de l\'Ancien Régime (Clergé, Noblesse, Tiers-État)',
      'Retenir les dates fondamentales : 14 juillet 1789 et 26 août 1789',
      'Comprendre les symboles républicains'
    ],
    memo: {
      ruleTitle: '1789 : Quand la France entre dans une ère nouvelle',
      keyPoints: [
        'Le Tiers-État (98% du peuple) paie tous les impôts.',
        '14 juillet 1789 : prise de la Bastille à Paris.',
        '26 août 1789 : Déclaration des Droits de l\'Homme et du Citoyen.'
      ],
      example: 'Devise : Liberté, Égalité, Fraternité.',
      proTip: 'Les Sans-Culottes portaient des pantalons rayés et le bonnet phrygien !'
    }
  },
  {
    id: 'cm2-histoire-reporter-oral-p1',
    grade: 'CM2',
    subject: 'histoire',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Micro du Reporter : Révolution en Direct',
    subtitle: 'Parle dans le micro à la radio pour raconter 1789 !',
    icon: 'Radio',
    badgeName: 'Reporter Révolutionnaire',
    gameType: 'speech-reporter',
    modality: 'parler',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - Cycle 3 : "S\'exprimer à l\'oral avec précision sur les repères historiques"',
    boObjectives: [
      'Formuler la réponse oralement dans le microphone',
      'Prononcer les dates clés (1789, 1792, 1804)',
      'Développer l\'éloquence et la prestance orale'
    ],
    memo: {
      ruleTitle: 'Prendre l\'antenne à la radio',
      keyPoints: [
        'Le reporter d\'Histoire annonce les dates avec assurance.',
        '1789 : Prise de la Bastille.',
        '1804 : Sacre de Napoléon.'
      ],
      example: '"La Bastille a été prise en 1789 par le peuple de Paris !"',
      proTip: 'Parle bien en face du micro pour que la radio capte ta voix !'
    }
  },
  {
    id: 'cm2-sciences-systeme-solaire-p1',
    grade: 'CM2',
    subject: 'sciences',
    period: 'P1',
    periodLabel: 'Période 1 (Sept-Oct)',
    title: 'Sciences : Le Système Solaire & La Terre',
    subtitle: 'Les 8 planètes, la rotation terrestre et l\'espace',
    icon: 'Compass',
    badgeName: 'Commandant Spatial',
    gameType: 'lab-quiz',
    modality: 'regarder',
    officialBulletinRef: 'BO n°31 du 30 juillet 2020 - CM2 P1 : "Situer la Terre dans le système solaire et caractériser les conditions de la vie"',
    boObjectives: [
      'Connaître l\'ordre des 8 planètes depuis le Soleil',
      'Distinguer planètes rocheuses et géantes gazeuses'
    ],
    memo: {
      ruleTitle: 'L\'Univers autour de nous',
      keyPoints: [
        'Phrase magique : "Me Voici Tout Mouillé, J\'ai Suivi Un Nuage".',
        'Les 4 rocheuses : Mercure, Vénus, Terre, Mars.',
        'Les 4 géantes gazeuses : Jupiter, Saturne, Uranus, Neptune.'
      ],
      example: 'Jupiter est la plus grande planète du système solaire !',
      proTip: 'La Terre met 24h pour tourner sur elle-même (le jour) !'
    }
  }
];

export const MOUNTAIN_WORDS_DATA: Record<string, Record<DifficultyLevel, MountainWord[]>> = {
  'ce1-francais-mots-invariables-p1': {
    facile: [
      { word: 'avec', sentenceExample: 'Je joue avec mon camarade.', ruleExplanation: 'Mot invariable simple de 4 lettres : a-v-e-c.', difficultyBadge: 'Échauffement' },
      { word: 'dans', sentenceExample: 'Le livre est dans le sac.', ruleExplanation: 'Finit par un "s" muet.', difficultyBadge: 'Échauffement' },
      { word: 'très', sentenceExample: 'Cet exercice est très facile.', ruleExplanation: 'Accent grave sur le "è" et "s" muet.', difficultyBadge: 'Échauffement' },
      { word: 'plus', sentenceExample: 'Il y a plus de pommes que de poires.', ruleExplanation: 'Finit par un "s" muet.', difficultyBadge: 'Échauffement' }
    ],
    normal: [
      { word: 'toujours', sentenceExample: 'Le soleil se lève toujours à l\'est.', ruleExplanation: '"toujours" prend TOUJOURS un "s" à la fin !', difficultyBadge: 'Objectif BO' },
      { word: 'jamais', sentenceExample: 'Il ne faut jamais traverser sans regarder.', ruleExplanation: 'Son [è] écrit "ai" et "s" muet final.', difficultyBadge: 'Objectif BO' },
      { word: 'beaucoup', sentenceExample: 'J\'ai beaucoup appris en classe.', ruleExplanation: '"beau" (e-a-u) + "coup" (finit par p).', difficultyBadge: 'Objectif BO' },
      { word: 'demain', sentenceExample: 'Demain, nous irons au parc.', ruleExplanation: 'Le son [in] s\'écrit "ain".', difficultyBadge: 'Objectif BO' }
    ],
    expert: [
      { word: 'longtemps', sentenceExample: 'Nous avons marché longtemps.', ruleExplanation: '"long" (avec g) + "temps" (avec p et s).', difficultyBadge: 'Défi Sommet' },
      { word: 'pendant', sentenceExample: 'Écoute pendant la leçon.', ruleExplanation: '"en" puis "an" avec un t final.', difficultyBadge: 'Défi Sommet' },
      { word: 'maintenant', sentenceExample: 'C\'est maintenant l\'heure de partir.', ruleExplanation: '"main" + "tenant".', difficultyBadge: 'Défi Sommet' }
    ]
  },
  'ce1-francais-pluriel-p2': {
    facile: [
      { word: 'chiens', sentenceExample: 'Les chiens aboient joyeusement.', ruleExplanation: 'Ajoute un "s" au pluriel régulier.', difficultyBadge: 'Échauffement' },
      { word: 'pommes', sentenceExample: 'Je mange trois pommes.', ruleExplanation: 'Deux m et un s.', difficultyBadge: 'Échauffement' }
    ],
    normal: [
      { word: 'bateaux', sentenceExample: 'Les bateaux naviguent sur l\'eau.', ruleExplanation: 'Les mots en -eau prennent un "x" au pluriel !', difficultyBadge: 'Objectif BO' },
      { word: 'oiseaux', sentenceExample: 'Les oiseaux chantent dans les arbres.', ruleExplanation: 'Prend un "x" au pluriel.', difficultyBadge: 'Objectif BO' },
      { word: 'châteaux', sentenceExample: 'Nous visitons des châteaux forts.', ruleExplanation: 'Terminaison en -eaux avec un accent sur le â.', difficultyBadge: 'Objectif BO' }
    ],
    expert: [
      { word: 'chevaux', sentenceExample: 'Les magnifiques chevaux galopent.', ruleExplanation: 'Un cheval -> des chevaux (-aux).', difficultyBadge: 'Défi Sommet' },
      { word: 'bijoux', sentenceExample: 'La reine admire ses bijoux.', ruleExplanation: 'Un des 7 mots en -ou qui prennent un x !', difficultyBadge: 'Défi Sommet' }
    ]
  },
  'cm2-francais-homophones-p1': {
    facile: [
      { word: 'a', sentenceExample: 'Léo a faim ce matin.', ruleExplanation: 'On peut dire "avait" : verbe avoir sans accent.', difficultyBadge: 'Échauffement' },
      { word: 'et', sentenceExample: 'Il aime le sport et la musique.', ruleExplanation: 'On peut dire "et puis" : conjonction "et".', difficultyBadge: 'Échauffement' }
    ],
    normal: [
      { word: 'à', sentenceExample: 'Nous partons à la plage.', ruleExplanation: 'On ne peut pas dire "avait" : préposition à avec accent !', difficultyBadge: 'Objectif BO' },
      { word: 'est', sentenceExample: 'Le train est en gare.', ruleExplanation: 'On peut dire "était" : verbe être "est".', difficultyBadge: 'Objectif BO' },
      { word: 'sont', sentenceExample: 'Les enfants sont calmes.', ruleExplanation: 'On peut dire "étaient" : verbe être "sont".', difficultyBadge: 'Objectif BO' },
      { word: 'ont', sentenceExample: 'Ils ont gagné la coupe.', ruleExplanation: 'On peut dire "avaient" : verbe avoir "ont".', difficultyBadge: 'Objectif BO' }
    ],
    expert: [
      { word: 'c\'est', sentenceExample: 'C\'est une très belle journée.', ruleExplanation: 'Contraction de "cela est", remplaçable par "c\'était".', difficultyBadge: 'Défi Sommet' },
      { word: 's\'est', sentenceExample: 'Le loup s\'est caché dans le bois.', ruleExplanation: 'Verbe pronominal "se cacher" au passé composé : "s\'est".', difficultyBadge: 'Défi Sommet' },
      { word: 'leurs', sentenceExample: 'Ils portent leurs cartables.', ruleExplanation: 'Déterminant pluriel devant un nom pluriel : avec un s !', difficultyBadge: 'Défi Sommet' }
    ]
  }
};

export const HISTORY_QUESTIONS_DATA: Record<string, Record<DifficultyLevel, HistoryQuestion[]>> = {
  'cm2-histoire-revolution-p1': {
    facile: [
      {
        id: 'rev-f1',
        question: 'Quelle est la date célèbre de la prise de la Bastille à Paris ?',
        options: ['14 juillet 1789', '25 décembre 1800', '1er mai 1750', '11 novembre 1918'],
        correctIndex: 0,
        historicalContext: 'La Bastille était une forteresse et une prison royale symbole de l\'absolutisme. Les Parisiens la prennent le 14 juillet 1789.',
        anecdote: 'Cette date est aujourd\'hui célébrée chaque année comme notre Fête Nationale !'
      },
      {
        id: 'rev-f2',
        question: 'Quel roi régnait sur la France au tout début de la Révolution en 1789 ?',
        options: ['Louis XVI', 'Charlemagne', 'Napoléon Ier', 'Louis XIV'],
        correctIndex: 0,
        historicalContext: 'Louis XVI régnait en monarque absolu depuis 1774 aux côtés de son épouse la reine Marie-Antoinette.',
        anecdote: 'Louis XVI aimait beaucoup la serrurerie et la géographie !'
      }
    ],
    normal: [
      {
        id: 'rev-n1',
        question: 'Sous l\'Ancien Régime, quel ordre représentait 98% du peuple qui travaillait et payait les impôts ?',
        options: ['Le Tiers-État', 'Le Clergé', 'La Noblesse', 'L\'Ordre des Chevaliers'],
        correctIndex: 0,
        historicalContext: 'Le Tiers-État regroupait paysans, artisans et bourgeois. Les deux ordres privilégiés (Noblesse et Clergé) ne payaient pas d\'impôts directs.',
        anecdote: 'L\'abbé Sieyès disait : "Qu\'est-ce que le Tiers-État ? Tout."'
      },
      {
        id: 'rev-n2',
        question: 'Adopté le 26 août 1789, comment s\'appelle le texte proclamant que "Les hommes naissent et demeurent libres et égaux en droits" ?',
        options: [
          'La Déclaration des Droits de l\'Homme et du Citoyen',
          'Le Code Civil',
          'La Charte Royale',
          'Le Traité de Versailles'
        ],
        correctIndex: 0,
        historicalContext: 'La Déclaration des Droits de l\'Homme et du Citoyen (DDHC) met fin aux privilèges féodaux et fonde les libertés fondamentales.',
        anecdote: 'Ce texte fondamental inspire encore la Constitution française d\'aujourd\'hui !'
      },
      {
        id: 'rev-n3',
        question: 'Comment appelait-on les révolutionnaires qui portaient un pantalon rayé à la place des culottes de la noblesse ?',
        options: ['Les Sans-Culottes', 'Les Mousquetaires', 'Les Hussards', 'Les Écuyers'],
        correctIndex: 0,
        historicalContext: 'Les nobles portaient des culottes serrées au genou. Les ouvriers et artisans portaient de vrais pantalons : d\'où le surnom de Sans-Culottes !',
        anecdote: 'Ils coiffaient fièrement le bonnet phrygien rouge, symbole antique de l\'homme libre.'
      }
    ],
    expert: [
      {
        id: 'rev-e1',
        question: 'Le 20 juin 1789, dans quelle salle sportive les députés du Tiers-État ont-ils juré de donner une Constitution à la France ?',
        options: ['Dans la salle du Jeu de Paume', 'À la Bastille', 'Au Palais des Tuileries', 'À l\'Hôtel de Ville'],
        correctIndex: 0,
        historicalContext: 'Le Serment du Jeu de Paume est l\'acte fondateur de la souveraineté nationale par les députés du peuple.',
        anecdote: 'Mirabeau y prononça : "Nous sommes ici par la volonté du peuple !"'
      },
      {
        id: 'rev-e2',
        question: 'En quelle année la Première République française a-t-elle été proclamée ?',
        options: ['1792', '1789', '1804', '1815'],
        correctIndex: 0,
        historicalContext: 'Le 21 septembre 1792, après la victoire militaire de Valmy, la Convention proclame la Ire République.',
        anecdote: 'Ils ont instauré un nouveau calendrier où 1792 devenait l\'An I !'
      }
    ]
  },
  'ce1-histoire-temps-p2': {
    facile: [
      {
        id: 't-f1',
        question: 'Avec quoi écrivaient les élèves à l\'école au début du siècle dernier ?',
        options: ['Une plume en métal et un encrier', 'Un ordinateur portable', 'Un feutre fluo', 'Un stylo 4 couleurs'],
        correctIndex: 0,
        historicalContext: 'Chaque table en bois d\'écolier possédait un encrier en porcelaine rempli d\'encre violette.',
        anecdote: 'Si on appuyait trop fort sur la plume, ça faisait un vilain "pâté" d\'encre !'
      },
      {
        id: 't-f2',
        question: 'À quoi servait le buvard dans le cahier des écoliers ?',
        options: ['À sécher l\'encre fraîche sans baver', 'À effacer les fautes', 'À tracer des traits droits', 'À colorier'],
        correctIndex: 0,
        historicalContext: 'Le buvard épongeait immédiatement le surplus d\'encre liquide avant qu\'on ne tourne la page.',
        anecdote: 'Les buvards étaient souvent décorés de jolies fables ou réclames !'
      }
    ],
    normal: [
      {
        id: 't-n1',
        question: 'Comment chauffait-on la classe d\'école autrefois en plein hiver ?',
        options: ['Avec un poêle à bois ou à charbon', 'Avec un climatiseur réversible', 'Avec des radiateurs électriques', 'Avec des panneaux solaires'],
        correctIndex: 0,
        historicalContext: 'Le poêle en fonte au milieu de la pièce était allumé très tôt le matin par le maître ou les grands élèves.',
        anecdote: 'Les élèves assis près du poêle avaient très chaud, et ceux du fond gardaient leur écharpe !'
      },
      {
        id: 't-n2',
        question: 'Qui a rendu l\'école gratuite, laïque et obligatoire en France en 1882 ?',
        options: ['Jules Ferry', 'Napoléon', 'Louis XIV', 'Victor Hugo'],
        correctIndex: 0,
        historicalContext: 'Les lois de Jules Ferry en 1881 et 1882 ont permis à tous les enfants de France de fréquenter l\'école primaire républicaine.',
        anecdote: 'Aujourd\'hui, des centaines d\'écoles portent fièrement son nom !'
      }
    ],
    expert: [
      {
        id: 't-e1',
        question: 'Quel vêtement noir ou gris tous les écoliers portaient-ils pour protéger leurs habits de l\'encre ?',
        options: ['Une blouse (ou sarrau)', 'Une cape de velours', 'Un costume à cravate', 'Un manteau de cuir'],
        correctIndex: 0,
        historicalContext: 'La blouse noire protégeait les vêtements et assurait l\'égalité entre tous les élèves de la classe.',
        anecdote: 'Chaque soir, on la secouait pour chasser la poussière de craie !'
      }
    ]
  }
};

export const SCIENCE_LAB_DATA: Record<string, Record<DifficultyLevel, ScienceItem[]>> = {
  'cm2-sciences-systeme-solaire-p1': {
    facile: [
      {
        id: 'sci-f1',
        prompt: 'La reine des planètes',
        question: 'Quelle est la planète la plus gigantesque de tout notre système solaire ?',
        options: ['Jupiter', 'Mars', 'La Terre', 'Mercure'],
        correctIndex: 0,
        explanation: 'Jupiter est une géante gazeuse si immense qu\'on pourrait y faire entrer plus de 1 300 fois la Terre !'
      },
      {
        id: 'sci-f2',
        prompt: 'La planète bleue',
        question: 'Pourquoi la Terre est-elle appelée la "planète bleue" vue depuis l\'espace ?',
        options: ['Parce que les océans d\'eau liquide couvrent 71% de sa surface', 'Parce que son atmosphère est en verre bleu', 'À cause de la couleur des montagnes', 'À cause de la glace'],
        correctIndex: 0,
        explanation: 'Vue du cosmos, notre planète brille d\'un éclat bleu en raison de ses immenses océans d\'eau liquide, indispensables à la vie.'
      }
    ],
    normal: [
      {
        id: 'sci-n1',
        prompt: 'Ordre depuis le Soleil',
        question: 'Quelle planète se situe exactement entre Vénus et Mars ?',
        options: ['La Terre', 'Mercure', 'Jupiter', 'Saturne'],
        correctIndex: 0,
        explanation: 'L\'ordre depuis le Soleil est : Mercure, Vénus, Terre, Mars. La Terre est la 3e planète !'
      },
      {
        id: 'sci-n2',
        prompt: 'Rocheuse ou gazeuse ?',
        question: 'Laquelle de ces planètes est une géante gazeuse (et non une planète tellurique rocheuse) ?',
        options: ['Saturne', 'Mars', 'Mercure', 'Vénus'],
        correctIndex: 0,
        explanation: 'Les 4 planètes telluriques rocheuses sont Mercure, Vénus, Terre et Mars. Les 4 géantes gazeuses sont Jupiter, Saturne, Uranus et Neptune.'
      },
      {
        id: 'sci-n3',
        prompt: 'Rythme de la Terre',
        question: 'Combien de temps met la Terre pour tourner sur elle-même (ce qui donne l\'alternance du jour et de la nuit) ?',
        options: ['24 heures (un jour)', '365 jours (une année)', '12 heures', '30 jours (un mois)'],
        correctIndex: 0,
        explanation: 'La rotation de la Terre sur elle-même dure 24 heures (le jour). Sa révolution autour du Soleil prend 365 jours et 6 heures (l\'année).'
      }
    ],
    expert: [
      {
        id: 'sci-e1',
        prompt: 'Les anneaux majestueux',
        question: 'De quoi sont principalement formés les spectaculaires anneaux qui entourent Saturne ?',
        options: ['De milliards de fragments de glace d\'eau et de roches', 'De gaz incandescent brûlant', 'D\'or massif et d\'argent', 'De lave liquide en suspension'],
        correctIndex: 0,
        explanation: 'Les anneaux de Saturne sont constitués de poussières et de blocs de glace d\'eau pure, allant de la taille d\'un grain de sable à celle d\'une maison !'
      }
    ]
  },
  'ce1-sciences-etats-eau-p1': {
    facile: [
      {
        id: 'eau-f1',
        prompt: 'Au congélateur',
        question: 'Quand on place de l\'eau liquide au congélateur à moins de 0°C, elle devient...',
        options: ['De la glace (état solide)', 'De la fumée (état gazeux)', 'De l\'huile', 'Du sable'],
        correctIndex: 0,
        explanation: 'L\'eau durcit et gèle en dessous de zéro degré : c\'est la solidification !'
      },
      {
        id: 'eau-f2',
        prompt: 'Sous l\'averse',
        question: 'Sous quelle forme l\'eau tombe-t-elle lors d\'une pluie ordinaire ?',
        options: ['Liquide', 'Solide', 'Gazeuse', 'Gélatineuse'],
        correctIndex: 0,
        explanation: 'La pluie est de l\'eau liquide qui s\'écoule.'
      }
    ],
    normal: [
      {
        id: 'eau-n1',
        prompt: 'La casserole qui bout',
        question: 'Quand l\'eau bout à 100°C dans une casserole, elle se transforme en vapeur d\'eau. C\'est...',
        options: ['L\'évaporation (ou vaporisation)', 'La fusion', 'La solidification', 'La congélation'],
        correctIndex: 0,
        explanation: 'Sous l\'effet de la forte chaleur (100°C), l\'eau liquide s\'évapore et passe à l\'état gazeux invisible.'
      },
      {
        id: 'eau-n2',
        prompt: 'Au soleil de printemps',
        question: 'Quand le bonhomme de neige fond et redevient de l\'eau liquide, on appelle ce phénomène...',
        options: ['La fusion (ou la fonte)', 'La solidification', 'L\'ébullition', 'La condensation'],
        correctIndex: 0,
        explanation: 'La fusion transforme la glace solide en eau liquide quand la température s\'adoucit.'
      }
    ],
    expert: [
      {
        id: 'eau-e1',
        prompt: 'Sur le miroir froid',
        question: 'La buée qui se dépose sur la vitre froide de la salle de bain est de la vapeur qui redevient liquide. Quel est ce phénomène ?',
        options: ['La condensation (ou liquéfaction)', 'La dissolution', 'La sublimation', 'L\'ébullition'],
        correctIndex: 0,
        explanation: 'Quand la vapeur d\'eau chaude touche une surface froide, elle se condense en minuscules gouttelettes d\'eau liquide.'
      }
    ]
  }
};
