/**
 * Exemples d'items RÉELLEMENT produits par les modules de contenu (copiés tels quels, graine fixe) pour les
 * jeux de géométrie, mesures, données et probabilités : tests unitaires et revue visuelle dans le Labo.
 * Généré par un script ; à ne pas modifier à la main.
 */
import type { Item, ItemKind } from '@/content/schemas';

export const EXEMPLES: Partial<Record<ItemKind, Item[]>> = {
  geometry_shape: [
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.SYMETRIE:geometry_shape:sym-vertical-2,1;2,2;1,3;2,3:1p705hr',
      lessonId: 'CE1.MA.GEO.SYMETRIE',
      prompt: 'Colorie les cases symétriques par rapport à l’axe vertical.',
      task: 'symetrie',
      shape: 'grille',
      answer: '5,1;5,2;5,3;6,3',
      grid: {
        cols: 8,
        rows: 6,
        cells: [
          [2, 1],
          [2, 2],
          [1, 3],
          [2, 3],
        ],
        axis: 'vertical',
      },
      explication:
        'Chaque case symétrique est à la même distance de l’axe, de l’autre côté, comme dans un miroir.',
      difficulty: 0.44,
      meta: {
        solution: [
          [5, 1],
          [5, 2],
          [5, 3],
          [6, 3],
        ],
        axe: {
          entreColonnes: [3, 4],
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.SYMETRIE:geometry_shape:sym-horizontal-0,1;1,1;0,2;1,2;2,2:1k2p5q3',
      lessonId: 'CE1.MA.GEO.SYMETRIE',
      prompt: 'Colorie les cases symétriques par rapport à l’axe horizontal.',
      task: 'symetrie',
      shape: 'grille',
      answer: '0,3;1,3;2,3;0,4;1,4',
      grid: {
        cols: 8,
        rows: 6,
        cells: [
          [0, 1],
          [1, 1],
          [0, 2],
          [1, 2],
          [2, 2],
        ],
        axis: 'horizontal',
      },
      explication:
        'Chaque case symétrique est à la même distance de l’axe, de l’autre côté, comme dans un miroir.',
      difficulty: 0.6,
      meta: {
        solution: [
          [0, 3],
          [1, 3],
          [2, 3],
          [0, 4],
          [1, 4],
        ],
        axe: {
          entreLignes: [2, 3],
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.SYMETRIE:geometry_shape:sym-diagonale-3,0;4,0;5,0;3,1;4,1;5,1;3,2:7147w9',
      lessonId: 'CE1.MA.GEO.SYMETRIE',
      prompt: 'Colorie les cases symétriques par rapport à l’axe en diagonale.',
      task: 'symetrie',
      shape: 'grille',
      answer: '0,3;1,3;2,3;0,4;1,4;0,5;1,5',
      grid: {
        cols: 6,
        rows: 6,
        cells: [
          [3, 0],
          [4, 0],
          [5, 0],
          [3, 1],
          [4, 1],
          [5, 1],
          [3, 2],
        ],
        axis: 'diagonale',
      },
      explication:
        'Chaque case symétrique est à la même distance de l’axe, de l’autre côté, comme dans un miroir.',
      difficulty: 0.92,
      meta: {
        solution: [
          [0, 3],
          [1, 3],
          [2, 3],
          [0, 4],
          [1, 4],
          [0, 5],
          [1, 5],
        ],
        axe: {
          diagonale: 'haut-gauche → bas-droite',
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.SYMETRIE:geometry_shape:sym-anti-diagonale-8x8-2,0;2,1;1,2;2,2;3,2;1,3;2,3;3,3:1cmwxul',
      lessonId: 'CM2.MA.GEO.SYMETRIE',
      prompt:
        'Colorie les cases symétriques par rapport à l’axe qui suit l’autre diagonale du quadrillage (du coin en haut à droite au coin en bas à gauche).',
      task: 'symetrie',
      shape: 'grille',
      answer: '4,4;5,4;4,5;5,5;6,5;7,5;4,6;5,6',
      grid: {
        cols: 8,
        rows: 8,
        cells: [
          [2, 0],
          [2, 1],
          [1, 2],
          [2, 2],
          [3, 2],
          [1, 3],
          [2, 3],
          [3, 3],
        ],
        axis: 'diagonale',
      },
      explication:
        'Avec un axe en diagonale, chaque case symétrique est de l’autre côté de l’axe, à la même distance, en traversant les carreaux en diagonale : comme si on pliait le quadrillage le long de l’axe.',
      difficulty: 0.85,
      meta: {
        solution: [
          [4, 4],
          [5, 4],
          [4, 5],
          [5, 5],
          [6, 5],
          [7, 5],
          [4, 6],
          [5, 6],
        ],
        mode: 'colorier',
        axe: {
          type: 'anti-diagonale',
          de: 'haut-droite',
          vers: 'bas-gauche',
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.SYMETRIE:geometry_shape:sym-vertical-12x10-5,3;6,3;4,4;5,4;6,4;7,4;6,5;6,6:18r93q3',
      lessonId: 'CM2.MA.GEO.SYMETRIE',
      prompt: 'Complète la figure pour qu’elle soit symétrique par rapport à l’axe vertical.',
      task: 'symetrie',
      shape: 'grille',
      answer: '5,5;5,6',
      grid: {
        cols: 12,
        rows: 10,
        cells: [
          [5, 3],
          [6, 3],
          [4, 4],
          [5, 4],
          [6, 4],
          [7, 4],
          [6, 5],
          [6, 6],
        ],
        axis: 'vertical',
      },
      explication:
        'Chaque case symétrique est à la même distance de l’axe, de l’autre côté, comme dans un miroir.',
      difficulty: 0.65,
      meta: {
        solution: [
          [5, 5],
          [5, 6],
        ],
        mode: 'completer',
        axe: {
          type: 'vertical',
          entreColonnes: [5, 6],
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.FIGURES:geometry_shape:nommer-triangle_rectangle:1e1cunb',
      lessonId: 'CE1.MA.GEO.FIGURES',
      prompt: 'Comment s’appelle cette figure ?',
      task: 'nommer',
      shape: 'triangle_rectangle',
      choices: ['rectangle', 'cercle', 'triangle', 'triangle rectangle'],
      answer: 'triangle rectangle',
      explication: 'C’est un triangle rectangle : un triangle qui a un angle droit.',
      difficulty: 0.5,
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.FIGURES:geometry_shape:prop-Les 4 côtés de ce rectangle ont-ils tous la même longueur ?:93el4x',
      lessonId: 'CE1.MA.GEO.FIGURES',
      prompt: 'Les 4 côtés de ce rectangle ont-ils tous la même longueur ?',
      task: 'proprietes',
      shape: 'rectangle',
      choices: ['oui', 'non'],
      answer: 'non',
      explication: 'Dans ce rectangle, seuls les côtés opposés ont la même longueur.',
      difficulty: 0.45,
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.FIGURES:geometry_shape:angle-angle_droit:8y6aux',
      lessonId: 'CE1.MA.GEO.FIGURES',
      prompt: 'Cet angle est…',
      task: 'proprietes',
      shape: 'angle_droit',
      choices: ['droit', 'aigu', 'obtus'],
      answer: 'droit',
      explication: 'Il a la forme du coin de l’équerre : c’est un angle droit.',
      difficulty: 0.55,
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.FIGURES:geometry_shape:angle-points_alignes:m9eoma',
      lessonId: 'CE1.MA.GEO.FIGURES',
      prompt: 'Ces trois points sont-ils alignés ?',
      task: 'proprietes',
      shape: 'points_alignes',
      choices: ['oui', 'non'],
      answer: 'oui',
      explication:
        'On peut tracer une ligne droite qui passe par les trois points (on vérifie avec la règle).',
      difficulty: 0.55,
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.FIGURES:geometry_shape:prop-trapeze-anglesDroits:darf5o',
      lessonId: 'CM2.MA.GEO.FIGURES',
      prompt: 'Combien d’angles droits ce trapèze a-t-il ?',
      task: 'proprietes',
      shape: 'trapeze',
      choices: ['0', '1', '2', '4'],
      answer: '0',
      explication:
        'Un trapèze, c’est un quadrilatère qui a deux côtés opposés parallèles. Ce trapèze-ci a 0 angle droit et 1 paire de côtés parallèles.',
      difficulty: 0.45,
      meta: {
        figure: {
          cotes: 4,
          anglesDroits: 0,
          pairesParalleles: 1,
          longueurs: 'pas forcément de côtés de même longueur',
          points: [
            [1, 0],
            [5, 0],
            [7, 3],
            [0, 3],
          ],
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.FIGURES:geometry_shape:prop-losange-pairesParalleles:1n5d536',
      lessonId: 'CM2.MA.GEO.FIGURES',
      prompt: 'Combien de paires de côtés parallèles ce losange a-t-il ?',
      task: 'proprietes',
      shape: 'losange',
      choices: ['0', '1', '2'],
      answer: '2',
      explication:
        'Un losange, c’est un quadrilatère qui a 4 côtés de même longueur. Ce losange-ci a 0 angle droit et 2 paires de côtés parallèles.',
      difficulty: 0.6,
      meta: {
        figure: {
          cotes: 4,
          anglesDroits: 0,
          pairesParalleles: 2,
          longueurs: '4 côtés de même longueur',
          points: [
            [3, 0],
            [6, 2],
            [3, 4],
            [0, 2],
          ],
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.FIGURES:geometry_shape:inclusion-carre-Ce carré est-il aussi un rectangle ?:174xudm',
      lessonId: 'CM2.MA.GEO.FIGURES',
      prompt: 'Ce carré est-il aussi un rectangle ?',
      task: 'proprietes',
      shape: 'carre',
      choices: [
        'non, car ses 4 côtés ont la même longueur',
        'non, un carré n’est jamais un rectangle',
        'oui, car il a 4 angles droits',
      ],
      answer: 'oui, car il a 4 angles droits',
      explication:
        'Un rectangle, c’est un quadrilatère qui a 4 angles droits : le carré en a 4, c’est donc un rectangle particulier.',
      difficulty: 0.75,
      meta: {
        figure: {
          cotes: 4,
          anglesDroits: 4,
          pairesParalleles: 2,
          longueurs: '4 côtés de même longueur',
          points: [
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
          ],
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.FIGURES:geometry_shape:nommer-hexagone:1yib9ej',
      lessonId: 'CM2.MA.GEO.FIGURES',
      prompt: 'Comment s’appelle cette figure ?',
      task: 'nommer',
      shape: 'hexagone',
      choices: ['cercle', 'carré', 'pentagone', 'hexagone'],
      answer: 'hexagone',
      explication: 'C’est un hexagone : c’est un polygone qui a 6 côtés.',
      difficulty: 0.2,
      meta: {
        figure: {
          cotes: 6,
          anglesDroits: 0,
          pairesParalleles: 3,
          longueurs: '6 côtés',
          points: [
            [1.5, 0],
            [4.5, 0],
            [6, 2.6],
            [4.5, 5.2],
            [1.5, 5.2],
            [0, 2.6],
          ],
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.TRACER:geometry_shape:reproduire-rectangle-1,1;8,1;1,5;8,5:yijqqn',
      lessonId: 'CE1.MA.GEO.TRACER',
      prompt: 'Reproduis ce rectangle sur le quadrillage.',
      task: 'tracer',
      shape: 'rectangle',
      answer: 'rectangle',
      grid: {
        cols: 12,
        rows: 10,
        cells: [
          [1, 1],
          [8, 1],
          [8, 5],
          [1, 5],
        ],
      },
      explication: 'Compte les carreaux entre les sommets, puis relie-les à la règle.',
      difficulty: 0.3,
      meta: {
        tracer: {
          figure: 'rectangle',
          sommets: [
            [1, 1],
            [8, 1],
            [8, 5],
            [1, 5],
          ],
          instrument: 'regle',
          support: 'quadrillage',
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.TRACER:geometry_shape:segment-3:n9c5v',
      lessonId: 'CE1.MA.GEO.TRACER',
      prompt: 'Trace un segment de 3 cm.',
      task: 'tracer',
      shape: 'segment',
      answer: '3 cm',
      explication: 'On part du 0 de la règle et on s’arrête à 3.',
      difficulty: 0.4,
      meta: {
        tracer: {
          figure: 'segment',
          longueur: 3,
          unite: 'cm',
          instrument: 'regle',
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.TRACER:geometry_shape:cercle-3:1mkq41z',
      lessonId: 'CE1.MA.GEO.TRACER',
      prompt: 'Trace un cercle de centre O qui passe par le point A (OA = 3 cm).',
      task: 'tracer',
      shape: 'cercle',
      answer: 'rayon 3 cm',
      explication: 'On pique la pointe du compas sur O, on écarte jusqu’à A (3 cm), puis on tourne.',
      difficulty: 0.55,
      meta: {
        tracer: {
          figure: 'cercle',
          rayon: 3,
          unite: 'cm',
          instrument: 'compas',
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.TRACER:geometry_shape:angle-droit:y6o752',
      lessonId: 'CE1.MA.GEO.TRACER',
      prompt: 'Trace un angle droit avec l’équerre.',
      task: 'tracer',
      shape: 'angle_droit',
      answer: 'angle droit',
      explication: 'On place le coin de l’équerre sur le sommet et on trace le long des deux bords.',
      difficulty: 0.5,
      meta: {
        tracer: {
          figure: 'angle_droit',
          instrument: 'equerre',
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.TRACER:geometry_shape:rectangle-8-5:6zvyyh',
      lessonId: 'CE1.MA.GEO.TRACER',
      prompt: 'Trace un rectangle de 8 cm sur 5 cm avec la règle et l’équerre.',
      task: 'tracer',
      shape: 'rectangle',
      answer: 'rectangle 8 cm × 5 cm',
      explication:
        'On trace un côté à la règle, puis les angles droits à l’équerre, et on reporte les longueurs.',
      difficulty: 0.7,
      meta: {
        tracer: {
          figure: 'rectangle',
          longueur: 8,
          largeur: 5,
          unite: 'cm',
          instrument: 'equerre',
        },
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.VOCAB:geometry_shape:milieu_droit-6,2-6,8:g1myi',
      lessonId: 'CM2.MA.GEO.VOCAB',
      prompt: 'Place le point M, milieu du segment [AB].',
      task: 'tracer',
      shape: 'points',
      answer: '6,5',
      grid: {
        cols: 12,
        rows: 8,
        cells: [],
      },
      explication:
        'De A à B, on se déplace de 6 carreaux vers le bas ; le milieu est à mi-chemin : 3 carreaux vers le bas à partir de A.',
      difficulty: 0.25,
      meta: {
        noeuds: true,
        points: {
          A: [6, 2],
          B: [6, 8],
        },
        segments: [['A', 'B']],
        solution: [6, 5],
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.VOCAB:geometry_shape:perp-7,6-10,3:lrfbr7',
      lessonId: 'CM2.MA.GEO.VOCAB',
      prompt:
        'Place le point E, au-dessus de la droite (AB), pour que le segment [AE] soit perpendiculaire au segment [AB] et de même longueur.',
      task: 'tracer',
      shape: 'points',
      answer: '4,3',
      grid: {
        cols: 12,
        rows: 8,
        cells: [],
      },
      explication:
        'De A à B, on fait 3 carreaux vers la droite et 3 carreaux vers le haut. Pour tourner d’un angle droit, on échange les deux nombres de carreaux : de A à E, 3 carreaux vers la gauche et 3 carreaux vers le haut. On vérifie l’angle droit avec l’équerre.',
      difficulty: 0.8,
      meta: {
        noeuds: true,
        points: {
          A: [7, 6],
          B: [10, 3],
        },
        segments: [['A', 'B']],
        solution: [4, 3],
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.CONSTRUIRE:geometry_shape:sommet-carré-6,2-8,4-6,6:1rqkzb8',
      lessonId: 'CM2.MA.GEO.CONSTRUIRE',
      prompt: 'Les points A, B et C sont trois sommets d’un carré ABCD. Place le point D.',
      task: 'tracer',
      shape: 'carre',
      answer: '4,4',
      grid: {
        cols: 12,
        rows: 9,
        cells: [],
      },
      explication:
        'Dans un carré, les côtés opposés sont parallèles et de même longueur : de B à C, on fait 2 carreaux vers la gauche et 2 carreaux vers le bas ; on fait le même déplacement à partir de A pour trouver D.',
      difficulty: 0.55,
      meta: {
        noeuds: true,
        points: {
          A: [6, 2],
          B: [8, 4],
          C: [6, 6],
        },
        segments: [
          ['A', 'B'],
          ['B', 'C'],
        ],
        solution: [4, 4],
        figure: 'carré',
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.SOLIDES:geometry_shape:nommer-cylindre:1ui3pif',
      lessonId: 'CE1.MA.GEO.SOLIDES',
      prompt: 'Quel est ce solide ?',
      task: 'solide',
      shape: 'cylindre',
      choices: ['pavé', 'cône', 'cylindre', 'boule'],
      answer: 'cylindre',
      explication: 'C’est un cylindre : il a deux disques et roule.',
      difficulty: 0.25,
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.SOLIDES:geometry_shape:compter-pyramide-sommets:2x8l3g',
      lessonId: 'CE1.MA.GEO.SOLIDES',
      prompt: 'Combien cette pyramide à base carrée a-t-elle de sommets ?',
      task: 'proprietes',
      shape: 'pyramide',
      choices: ['4', '5', '6', '8', '12'],
      answer: '5',
      explication: 'La pyramide à base carrée a 5 faces (des triangles et un carré), 8 arêtes et 5 sommets.',
      difficulty: 0.55,
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.SOLIDES:geometry_shape:patron-0,0;0,1;1,1;2,1;3,1;2,2:8bultp',
      lessonId: 'CE1.MA.GEO.SOLIDES',
      prompt: 'Ce patron permet-il de fabriquer un cube ?',
      task: 'patron',
      shape: 'patron_cube',
      choices: ['oui', 'non'],
      answer: 'oui',
      grid: {
        cols: 6,
        rows: 4,
        cells: [
          [0, 0],
          [0, 1],
          [1, 1],
          [2, 1],
          [3, 1],
          [2, 2],
        ],
      },
      explication: 'En pliant, chacune des 6 faces trouve sa place : on obtient un cube.',
      difficulty: 0.8,
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.SOLIDES:geometry_shape:patron-1,0;1,1;2,1;3,1;4,1;3,2:ruarh1',
      lessonId: 'CM2.MA.GEO.SOLIDES',
      prompt: 'Cet assemblage de 6 carrés est-il un patron de cube ?',
      task: 'patron',
      shape: 'patron_cube',
      choices: ['oui', 'non'],
      answer: 'oui',
      grid: {
        cols: 7,
        rows: 5,
        cells: [
          [1, 0],
          [1, 1],
          [2, 1],
          [3, 1],
          [4, 1],
          [3, 2],
        ],
      },
      explication: 'En pliant, chacune des 6 faces trouve sa place sans se superposer : on obtient un cube.',
      difficulty: 0.55,
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.SOLIDES:geometry_shape:completer-1,1;2,1;2,2;3,2;4,2:1xp3zwo',
      lessonId: 'CM2.MA.GEO.SOLIDES',
      prompt:
        'Il manque un carré pour obtenir un patron de cube. Colorie une case qui convient (il y a plusieurs possibilités).',
      task: 'patron',
      shape: 'patron_cube_incomplet',
      answer: '3,3',
      grid: {
        cols: 7,
        rows: 5,
        cells: [
          [1, 1],
          [2, 1],
          [2, 2],
          [3, 2],
          [4, 2],
        ],
      },
      explication:
        'Un patron de cube a 6 carrés ; en pliant, chaque carré doit devenir une face différente : le carré ajouté doit fermer la seule face encore ouverte.',
      difficulty: 0.55,
      meta: {
        solutions: ['0,1', '2,3', '3,3', '4,3'],
        validation: 'une des solutions',
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.SOLIDES:geometry_shape:pave-3-1-2-0-0-aucune:yvxoqs',
      lessonId: 'CM2.MA.GEO.SOLIDES',
      prompt:
        'Ce patron permet-il de fabriquer un pavé ? (Chaque rectangle est une face ; les longueurs sont en carreaux.)',
      task: 'patron',
      shape: 'patron_pave',
      choices: ['oui', 'non'],
      answer: 'oui',
      grid: {
        cols: 8,
        rows: 4,
        cells: [
          [0, 0],
          [1, 0],
          [2, 0],
          [0, 1],
          [1, 1],
          [2, 1],
          [0, 2],
          [1, 2],
          [2, 2],
          [3, 1],
          [3, 2],
          [4, 1],
          [5, 1],
          [6, 1],
          [4, 2],
          [5, 2],
          [6, 2],
          [7, 1],
          [7, 2],
          [0, 3],
          [1, 3],
          [2, 3],
        ],
      },
      explication:
        'Les faces vont par paires identiques (3 × 1, 3 × 2, 1 × 2) et les bords qui se touchent ont la même longueur : en pliant, on obtient un pavé.',
      difficulty: 0.75,
      meta: {
        rectangles: [
          {
            x: 0,
            y: 0,
            w: 3,
            h: 1,
          },
          {
            x: 0,
            y: 1,
            w: 3,
            h: 2,
          },
          {
            x: 3,
            y: 1,
            w: 1,
            h: 2,
          },
          {
            x: 4,
            y: 1,
            w: 3,
            h: 2,
          },
          {
            x: 7,
            y: 1,
            w: 1,
            h: 2,
          },
          {
            x: 0,
            y: 3,
            w: 3,
            h: 1,
          },
        ],
        dimensions: {
          L: 3,
          l: 1,
          h: 2,
        },
        rendu: 'contours de meta.rectangles',
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.SOLIDES:geometry_shape:compter-prisme_base_hexagonale-faces:1etldgk',
      lessonId: 'CM2.MA.GEO.SOLIDES',
      prompt: 'Combien de faces ce prisme droit à base hexagonale a-t-il ?',
      task: 'proprietes',
      shape: 'prisme_base_hexagonale',
      choices: ['4', '6', '5', '8'],
      answer: '8',
      explication:
        'Le prisme droit à base hexagonale a 8 faces (2 hexagones et 6 rectangles), 18 arêtes et 12 sommets. Sur un dessin en perspective, n’oublie pas les arêtes cachées en pointillés !',
      difficulty: 0.7,
      meta: {
        perspective: true,
        cachees: 'pointillés',
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.REPERAGE:geometry_shape:robot-1,2-3,1-0-:1ciz1zr',
      lessonId: 'CE1.MA.GEO.REPERAGE',
      prompt: 'Programme le robot avec les flèches pour qu’il atteigne le trésor.',
      task: 'tracer',
      shape: 'robot',
      answer: '↑ → →',
      explication: 'Un chemin possible : ↑ → → (3 cases).',
      difficulty: 0.27,
      meta: {
        robot: {
          cols: 5,
          rows: 5,
          depart: [1, 2],
          cible: [3, 1],
          obstacles: [],
          relatif: false,
          orientation: 'haut',
        },
        codes: {
          '↑': 'haut',
          '→': 'droite',
          '↓': 'bas',
          '←': 'gauche',
        },
        longueurMini: 3,
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CE1.MA.GEO.REPERAGE:geometry_shape:robot-4,3-2,2-0-1,3;4,1:1j6jwk4',
      lessonId: 'CE1.MA.GEO.REPERAGE',
      prompt:
        'Programme le robot (il regarde vers le haut) pour qu’il atteigne le trésor. A = avancer d’une case, D = pivoter d’un quart de tour à droite, G = pivoter d’un quart de tour à gauche.',
      task: 'tracer',
      shape: 'robot',
      answer: 'A G A A',
      explication:
        'Un programme possible (4 instructions) : A G A A. Pivoter ne fait pas changer de case, seulement de direction.',
      difficulty: 0.51,
      meta: {
        robot: {
          cols: 6,
          rows: 6,
          depart: [4, 3],
          cible: [2, 2],
          obstacles: [
            [1, 3],
            [4, 1],
          ],
          relatif: true,
          orientation: 'haut',
        },
        codes: {
          A: 'avancer d’une case',
          D: 'quart de tour à droite',
          G: 'quart de tour à gauche',
        },
        longueurMini: 4,
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.DEPLACEMENTS:geometry_shape:robot-1,3-5,1-3-3,1;2,2;3,2;1,5:1m16gru',
      lessonId: 'CM2.MA.GEO.DEPLACEMENTS',
      prompt:
        'Programme le robot (il regarde vers la gauche) pour qu’il atteigne le trésor sans toucher les rochers. A = avancer d’une case, D = quart de tour à droite, G = quart de tour à gauche.',
      task: 'tracer',
      shape: 'robot',
      answer: 'D D A A A A G A A',
      explication:
        'Un programme possible (9 instructions) : D D A A A A G A A. Un quart de tour ne fait pas changer de case : il change seulement la direction du robot.',
      difficulty: 0.62,
      meta: {
        robot: {
          cols: 7,
          rows: 7,
          depart: [1, 3],
          cible: [5, 1],
          obstacles: [
            [1, 5],
            [3, 1],
            [2, 2],
            [3, 2],
          ],
          relatif: true,
          orientation: 'gauche',
        },
        codes: {
          A: 'avancer d’une case',
          D: 'quart de tour à droite',
          G: 'quart de tour à gauche',
        },
        longueurMini: 9,
        validation: 'simulation',
      },
    },
    {
      kind: 'geometry_shape',
      id: 'CM2.MA.GEO.DEPLACEMENTS:geometry_shape:boucle-2,4-répéter 4 fois [ A G A D ]-8,1;9,1;3,2;7,2;1,6:1u2v8f7',
      lessonId: 'CM2.MA.GEO.DEPLACEMENTS',
      prompt:
        'Le robot regarde vers la droite. Écris un programme court pour qu’il atteigne le trésor en suivant l’escalier, avec « répéter … fois [ … ] ». A = avancer d’une case, D = quart de tour à droite, G = quart de tour à gauche.',
      task: 'tracer',
      shape: 'robot',
      answer: 'répéter 4 fois [ A G A D ]',
      explication:
        'Un programme possible : répéter 4 fois [ A G A D ]. Le motif A G A D monte une marche ; il y a 4 marches, donc on le répète 4 fois : répéter 4 fois [ A G A D ] (au lieu de 16 instructions).',
      difficulty: 0.8,
      meta: {
        robot: {
          cols: 10,
          rows: 8,
          depart: [2, 4],
          cible: [6, 0],
          obstacles: [
            [7, 2],
            [1, 6],
            [3, 2],
            [9, 1],
            [8, 1],
          ],
          relatif: true,
          orientation: 'droite',
        },
        boucles: {
          fois: 4,
          motif: ['A', 'G', 'A', 'D'],
        },
        programmeDeplie: 'A G A D A G A D A G A D A G A D',
        validation: 'simulation',
        codes: {
          A: 'avancer d’une case',
          D: 'quart de tour à droite',
          G: 'quart de tour à gauche',
          'répéter n fois [ … ]': 'refaire n fois les instructions entre crochets',
        },
      },
    },
  ],
  classification: [
    {
      kind: 'classification',
      id: 'CE1.MA.GEO.FIGURES:classification:classer-cercle|rectangle|triangle|triangle_rectangle:1dtwqg8',
      lessonId: 'CE1.MA.GEO.FIGURES',
      prompt: 'Range chaque figure selon son nombre de côtés.',
      categories: ['3 côtés', '4 côtés', 'aucun côté'],
      elements: [
        {
          label: 'cercle',
          category: 2,
          image: '⚪',
        },
        {
          label: 'rectangle',
          category: 1,
          image: '▬',
        },
        {
          label: 'triangle',
          category: 0,
          image: '🔺',
        },
        {
          label: 'triangle rectangle',
          category: 0,
          image: '◺',
        },
      ],
      explication:
        'On compte les côtés : 3 pour un triangle, 4 pour un carré ou un rectangle, aucun pour un cercle.',
      difficulty: 0.45,
    },
    {
      kind: 'classification',
      id: 'CM2.MA.GEO.VOCAB:classification:droites-les deux diagonales d’un rectangle qui n’est pas un carré|deux droites parallèles à une même droite|les deux diagonales d’un carré|deux droites perpendiculaires à une même droite|les aiguilles d’une horloge à 9 h|les aiguilles d’une horloge à 2 h:ludv1b',
      lessonId: 'CM2.MA.GEO.VOCAB',
      prompt: 'Range ces paires de lignes : sont-elles perpendiculaires, parallèles, ou ni l’un ni l’autre ?',
      categories: ['perpendiculaires', 'parallèles', 'ni l’un ni l’autre'],
      elements: [
        {
          label: 'les deux diagonales d’un rectangle qui n’est pas un carré',
          category: 2,
        },
        {
          label: 'deux droites parallèles à une même droite',
          category: 1,
        },
        {
          label: 'les deux diagonales d’un carré',
          category: 0,
        },
        {
          label: 'deux droites perpendiculaires à une même droite',
          category: 1,
        },
        {
          label: 'les aiguilles d’une horloge à 9 h',
          category: 0,
        },
        {
          label: 'les aiguilles d’une horloge à 2 h',
          category: 2,
        },
      ],
      explication:
        'Perpendiculaires : elles se coupent en faisant un angle droit. Parallèles : elles ne se coupent jamais et gardent le même écart. Ni l’un ni l’autre : elles se coupent, mais sans faire d’angle droit.',
      difficulty: 0.75,
      meta: {
        dessins: {
          'les deux diagonales d’un rectangle qui n’est pas un carré': {
            d1: [
              [2, 6],
              [10, 6],
            ],
            d2: [
              [3, 4],
              [9, 8],
            ],
          },
          'deux droites parallèles à une même droite': {
            d1: [
              [6, 2],
              [6, 10],
            ],
            d2: [
              [8, 2],
              [8, 10],
            ],
          },
          'les deux diagonales d’un carré': {
            d1: [
              [2, 4],
              [10, 8],
            ],
            d2: [
              [8, 2],
              [4, 10],
            ],
          },
          'deux droites perpendiculaires à une même droite': {
            d1: [
              [3, 3],
              [9, 9],
            ],
            d2: [
              [5, 3],
              [11, 9],
            ],
          },
          'les aiguilles d’une horloge à 9 h': {
            d1: [
              [6, 6],
              [6, 2],
            ],
            d2: [
              [6, 6],
              [3, 6],
            ],
          },
          'les aiguilles d’une horloge à 2 h': {
            d1: [
              [6, 6],
              [6, 2],
            ],
            d2: [
              [6, 6],
              [9, 4],
            ],
          },
        },
        repere: 'noeuds',
      },
    },
    {
      kind: 'classification',
      id: 'CM2.MA.DON.LIRE:classification:evol-La température moyenne de chaque mois à Paris-janvier,février,mars,avril,mai,juin-5000,6000,9000,12000,16000,19000:fv9eyf',
      lessonId: 'CM2.MA.DON.LIRE',
      prompt:
        'Courbe « La température moyenne de chaque mois à Paris » — janvier : 5 °C, février : 6 °C, mars : 9 °C, avril : 12 °C, mai : 16 °C, juin : 19 °C.\nD’un relevé au suivant, la température moyenne est-elle en hausse, stable ou en baisse ?',
      spoken: 'D’un relevé au suivant, la température moyenne est-elle en hausse, stable ou en baisse ?',
      categories: ['en hausse', 'stable', 'en baisse'],
      elements: [
        {
          label: 'de janvier à février',
          category: 0,
        },
        {
          label: 'de février à mars',
          category: 0,
        },
        {
          label: 'de mars à avril',
          category: 0,
        },
        {
          label: 'de avril à mai',
          category: 0,
        },
        {
          label: 'de mai à juin',
          category: 0,
        },
      ],
      explication:
        'Je compare chaque relevé au précédent : si la courbe monte, c’est une hausse ; si elle descend, c’est une baisse ; si elle reste à la même hauteur, c’est stable.',
      difficulty: 0.7,
      meta: {
        graphique: {
          type: 'courbe',
          titre: 'La température moyenne de chaque mois à Paris',
          etiquettes: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin'],
          valeurs: [5, 6, 9, 12, 16, 19],
          unite: '°C',
        },
        question: 'D’un relevé au suivant, la température moyenne est-elle en hausse, stable ou en baisse ?',
      },
    },
    {
      kind: 'classification',
      id: 'CM2.MA.PROBA:classification:classe-On lance un dé à 6 faces numérotées de 1 à 6.-obtenir 1 ou 2|obtenir un nombre de 1 à 6|obtenir un nombre plus petit que 7|obtenir 0:nfqjqc',
      lessonId: 'CM2.MA.PROBA',
      prompt: 'On lance un dé à 6 faces numérotées de 1 à 6. Range chaque évènement.',
      categories: ['impossible', 'possible mais pas certain', 'certain'],
      elements: [
        {
          label: 'Obtenir 1 ou 2',
          category: 1,
        },
        {
          label: 'Obtenir un nombre de 1 à 6',
          category: 2,
        },
        {
          label: 'Obtenir un nombre plus petit que 7',
          category: 2,
        },
        {
          label: 'Obtenir 0',
          category: 0,
        },
      ],
      explication:
        'Impossible : cela ne peut jamais arriver ; certain : cela arrive à coup sûr ; possible mais pas certain : cela peut arriver ou pas.',
      difficulty: 0.25,
    },
    {
      kind: 'classification',
      id: 'CM2.MA.PROBA:classification:classe-Une roue est partagée en 4 parts égales : 1 part verte, 1 part rouge et 2 parts noires. On fait tourner la flèche.-tomber sur une part bleue|tomber sur une part verte|tomber sur une part qui n’est pas bleue|tomber sur une part rouge:26g6wf',
      lessonId: 'CM2.MA.PROBA',
      prompt:
        'Une roue est partagée en 4 parts égales : 1 part verte, 1 part rouge et 2 parts noires. On fait tourner la flèche. Range chaque évènement.',
      categories: ['impossible', 'peu probable', 'probable', 'certain'],
      elements: [
        {
          label: 'Tomber sur une part bleue',
          category: 0,
        },
        {
          label: 'Tomber sur une part verte',
          category: 1,
        },
        {
          label: 'Tomber sur une part qui n’est pas bleue',
          category: 3,
        },
        {
          label: 'Tomber sur une part rouge',
          category: 1,
        },
      ],
      explication:
        'Je compte les issues qui conviennent : aucune → impossible ; toutes → certain ; au moins les deux tiers → probable ; au plus un tiers → peu probable.',
      difficulty: 0.5,
    },
    {
      kind: 'classification',
      id: 'CM2.MA.PROBA:classification:classe-Dans un sac, il y a 6 billes rouges, 3 billes noires et 3 billes bleues. On tire une bille au hasard.-tirer une bille noire|tirer une bille qui n’est pas jaune|tirer une bille rouge ou noire|tirer une bille bleue|tirer une bille jaune:ovob2s',
      lessonId: 'CM2.MA.PROBA',
      prompt:
        'Dans un sac, il y a 6 billes rouges, 3 billes noires et 3 billes bleues. On tire une bille au hasard. Range chaque évènement.',
      categories: ['impossible', 'peu probable', 'probable', 'certain'],
      elements: [
        {
          label: 'Tirer une bille noire',
          category: 1,
        },
        {
          label: 'Tirer une bille qui n’est pas jaune',
          category: 3,
        },
        {
          label: 'Tirer une bille rouge ou noire',
          category: 2,
        },
        {
          label: 'Tirer une bille bleue',
          category: 1,
        },
        {
          label: 'Tirer une bille jaune',
          category: 0,
        },
      ],
      explication:
        'Je compte les issues qui conviennent : aucune → impossible ; toutes → certain ; au moins les deux tiers → probable ; au plus un tiers → peu probable.',
      difficulty: 0.5,
    },
    {
      kind: 'classification',
      id: 'CM2.MA.PROBA:classification:classe-On lance trois pièces de monnaie l’une après l’autre.-obtenir au moins un pile|obtenir trois fois pile|obtenir quatre fois pile:1uypqe4',
      lessonId: 'CM2.MA.PROBA',
      prompt: 'On lance trois pièces de monnaie l’une après l’autre. Range chaque évènement.',
      categories: ['impossible', 'peu probable', 'probable', 'certain'],
      elements: [
        {
          label: 'Obtenir au moins un pile',
          category: 2,
        },
        {
          label: 'Obtenir trois fois pile',
          category: 1,
        },
        {
          label: 'Obtenir quatre fois pile',
          category: 0,
        },
      ],
      explication:
        'Je compte les issues qui conviennent : aucune → impossible ; toutes → certain ; au moins les deux tiers → probable ; au plus un tiers → peu probable.',
      difficulty: 0.75,
    },
    {
      kind: 'classification',
      id: 'CM2.MA.GM.ANGLES:classification:angles-180;50;75;90;150;180;75-HTAPBFK:43u8hk',
      lessonId: 'CM2.MA.GM.ANGLES',
      prompt:
        'Range chaque angle : est-il aigu, droit, obtus ou plat ? Vérifie les angles droits avec ton équerre.',
      categories: ['aigu', 'droit', 'obtus', 'plat'],
      elements: [
        {
          label: 'angle de sommet H',
          category: 3,
        },
        {
          label: 'angle de sommet T',
          category: 0,
        },
        {
          label: 'angle de sommet A',
          category: 0,
        },
        {
          label: 'angle de sommet P',
          category: 1,
        },
        {
          label: 'angle de sommet B',
          category: 2,
        },
        {
          label: 'angle de sommet F',
          category: 3,
        },
        {
          label: 'angle de sommet K',
          category: 0,
        },
      ],
      explication:
        'Plus petit qu’un angle droit : aigu ; exactement un angle droit (90°) : droit ; plus grand : obtus ; deux angles droits côte à côte (180°) : plat.',
      difficulty: 0.63,
      meta: {
        angles: [180, 50, 75, 90, 150, 180, 75],
      },
    },
  ],
  numeric_answer: [
    {
      kind: 'numeric_answer',
      id: 'CE1.MA.DON.LIRE:numeric_answer:lire-Les déchets ramassés dans la cour-6-5-3-1:hm8eac',
      lessonId: 'CE1.MA.DON.LIRE',
      prompt:
        'Les déchets ramassés dans la cour — papiers : 6, bouteilles : 5, canettes : 3.\nCombien de déchets pour « bouteilles » ?',
      spoken: 'Combien de déchets pour « bouteilles » ?',
      answer: 5,
      decimals: 0,
      explication: 'On lit la hauteur de chaque barre : « bouteilles » a 5 déchets.',
      difficulty: 0.2,
      unit: 'déchets',
      meta: {
        graphique: {
          type: 'barres',
          titre: 'Les déchets ramassés dans la cour',
          etiquettes: ['papiers', 'bouteilles', 'canettes'],
          valeurs: [6, 5, 3],
          unite: 'déchets',
        },
        question: 'Combien de déchets pour « bouteilles » ?',
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CE1.MA.DON.LIRE:numeric_answer:double-21-11-12-6-5-28-11-7-2-0-true:wm3tn7',
      lessonId: 'CE1.MA.DON.LIRE',
      prompt:
        'Tableau « Comment viens-tu à l’école ? » — à pied : 21 filles et 11 garçons ; à vélo : 12 filles et 6 garçons ; en voiture : 5 filles et 28 garçons ; en bus : 11 filles et 7 garçons.\nCombien d’élèves viennent en voiture en tout (filles et garçons) ?',
      spoken: 'Combien d’élèves viennent en voiture en tout (filles et garçons) ?',
      answer: 33,
      decimals: 0,
      explication: 'On lit la ligne « en voiture » : 5 + 28 = 33.',
      difficulty: 0.7,
      unit: 'élèves',
      meta: {
        question: 'Combien d’élèves viennent en voiture en tout (filles et garçons) ?',
        tableauDouble: {
          lignes: ['à pied', 'à vélo', 'en voiture', 'en bus'],
          colonnes: ['filles', 'garçons'],
          valeurs: [
            [21, 11],
            [12, 6],
            [5, 28],
            [11, 7],
          ],
        },
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CE1.MA.DON.LIRE:numeric_answer:construire-🍓🍌🍓🍎🍌🍌🍓🍓🍓🍌🍓🍓🍌🍓-🍎:c36ze1',
      lessonId: 'CE1.MA.DON.LIRE',
      prompt:
        'Voici les réponses de l’enquête « fruit préféré » : 🍓 🍌 🍓 🍎 🍌 🍌 🍓 🍓 🍓 🍌 🍓 🍓 🍌 🍓.\nPour construire le diagramme en barres (1 carreau = 1 élève), combien de carreaux de haut doit mesurer la barre 🍎 ?',
      spoken: 'Compte les 🍎 dans les réponses de l’enquête.',
      answer: 1,
      decimals: 0,
      explication: 'On compte les 🍎 : il y en a 1, donc la barre monte jusqu’à 1.',
      difficulty: 0.45,
      unit: 'carreaux',
      meta: {
        question:
          'Pour construire le diagramme en barres (1 carreau = 1 élève), combien de carreaux de haut doit mesurer la barre 🍎 ?',
        enquete: ['🍓', '🍌', '🍓', '🍎', '🍌', '🍌', '🍓', '🍓', '🍓', '🍌', '🍓', '🍓', '🍌', '🍓'],
        aConstruire: '🍎',
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CM2.MA.DON.LIRE:numeric_answer:evol-0-5-La température moyenne de chaque mois à Paris-juillet,août,septembre,octobre,novembre,décembre-21000,21000,17000,13000,8000,6000:196rpxy',
      lessonId: 'CM2.MA.DON.LIRE',
      prompt:
        'Courbe « La température moyenne de chaque mois à Paris » — juillet : 21 °C, août : 21 °C, septembre : 17 °C, octobre : 13 °C, novembre : 8 °C, décembre : 6 °C.\nDe combien la température moyenne a-t-elle diminué entre juillet et décembre ?',
      spoken: 'De combien la température moyenne a-t-elle diminué entre juillet et décembre ?',
      answer: 15,
      decimals: 0,
      explication: 'En juillet, on lit 21 °C ; en décembre, on lit 6 °C. La différence est 21 − 6 = 15.',
      difficulty: 0.6,
      unit: '°C',
      meta: {
        graphique: {
          type: 'courbe',
          titre: 'La température moyenne de chaque mois à Paris',
          etiquettes: ['juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
          valeurs: [21, 21, 17, 13, 8, 6],
          unite: '°C',
        },
        question: 'De combien la température moyenne a-t-elle diminué entre juillet et décembre ?',
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CM2.MA.DON.LIRE:numeric_answer:circ-Comment les 36 élèves de CM2 viennent à l’école-à pied,en bus,en voiture-18000,9000,9000-2:1hdrwl4',
      lessonId: 'CM2.MA.DON.LIRE',
      prompt:
        'Diagramme circulaire « Comment les 36 élèves de CM2 viennent à l’école » — à pied : la moitié, en bus : le quart, en voiture : le quart. Il y a 36 élèves en tout.\nCombien d’élèves viennent « en voiture » ?',
      spoken: 'Combien d’élèves viennent « en voiture » ?',
      answer: 9,
      decimals: 0,
      explication: '« en voiture » occupe le quart du disque : 36 ÷ 4 = 9 élèves.',
      difficulty: 0.4,
      unit: 'élèves',
      meta: {
        graphique: {
          type: 'circulaire',
          titre: 'Comment les 36 élèves de CM2 viennent à l’école',
          etiquettes: ['à pied', 'en bus', 'en voiture'],
          valeurs: [18, 9, 9],
          unite: 'élèves',
        },
        question: 'Combien d’élèves viennent « en voiture » ?',
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CM2.MA.DON.LIRE:numeric_answer:produire-Les déchets ramassés pendant le nettoyage de la plage-bouteilles en plastique,canettes,mégots,sacs en plastique,bouchons-525000,675000,275000,175000,700000-0-25:1hsovsn',
      lessonId: 'CM2.MA.DON.LIRE',
      prompt:
        'Tableau « Les déchets ramassés pendant le nettoyage de la plage » — bouteilles en plastique : 525, canettes : 675, mégots : 275, sacs en plastique : 175, bouchons : 700.\nTu construis le diagramme en barres avec 1 carreau pour 25 déchets. Combien de carreaux de haut doit mesurer la barre « bouteilles en plastique » ?',
      spoken:
        'Tu construis le diagramme en barres avec 1 carreau pour 25 déchets. Combien de carreaux de haut doit mesurer la barre « bouteilles en plastique » ?',
      answer: 21,
      decimals: 0,
      explication: 'Chaque carreau vaut 25 : 525 ÷ 25 = 21, la barre mesure 21 carreaux.',
      difficulty: 0.75,
      unit: 'carreaux',
      meta: {
        graphique: {
          type: 'tableau',
          titre: 'Les déchets ramassés pendant le nettoyage de la plage',
          etiquettes: ['bouteilles en plastique', 'canettes', 'mégots', 'sacs en plastique', 'bouchons'],
          valeurs: [525, 675, 275, 175, 700],
          unite: 'déchets',
        },
        question:
          'Tu construis le diagramme en barres avec 1 carreau pour 25 déchets. Combien de carreaux de haut doit mesurer la barre « bouteilles en plastique » ?',
        echelle: 25,
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CE1.MA.GM.LONGUEURS:numeric_answer:mesure-✏️-12:mav3sy',
      lessonId: 'CE1.MA.GM.LONGUEURS',
      prompt: 'Mesure le crayon avec la règle.',
      spoken: 'Mesure le crayon avec la règle.',
      answer: 12,
      decimals: 0,
      explication: 'On place le 0 de la règle au bout de l’objet et on lit le nombre à l’autre bout : 12 cm.',
      difficulty: 0.2,
      unit: 'cm',
      meta: {
        mesure: {
          objet: '✏️',
          longueur: 12,
          unite: 'cm',
        },
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CE1.MA.GEO.TRACER:numeric_answer:mesure-📎-9:1b6eyp6',
      lessonId: 'CE1.MA.GEO.TRACER',
      prompt: 'Mesure le trombone avec la règle graduée.',
      spoken: 'Mesure le trombone avec la règle graduée.',
      answer: 9,
      decimals: 0,
      explication: 'On place bien le 0 de la règle au bout de l’objet : il mesure 9 cm.',
      difficulty: 0.3,
      unit: 'cm',
      meta: {
        mesure: {
          objet: '📎',
          longueur: 9,
          unite: 'cm',
        },
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CE1.MA.GM.LONGUEURS:numeric_answer:conv-5 m 30 cm = … cm:1iaywf9',
      lessonId: 'CE1.MA.GM.LONGUEURS',
      prompt: '5 m 30 cm = … cm',
      spoken: '5 mètres 30 centimètres égale combien de centimètres',
      answer: 530,
      decimals: 0,
      explication: '5 m = 500 cm, et 500 cm + 30 cm = 530 cm.',
      difficulty: 0.55,
      unit: 'cm',
    },
    {
      kind: 'numeric_answer',
      id: 'CE1.MA.GM.MASSES:numeric_answer:balance-la banane-100+50+20:jx1wto',
      lessonId: 'CE1.MA.GM.MASSES',
      prompt:
        'La balance est en équilibre : la banane est sur un plateau, et sur l’autre il y a 100 g + 50 g + 20 g. Combien pèse la banane ?',
      spoken:
        'La balance est en équilibre : la banane est sur un plateau, et sur l’autre il y a 100 grammes plus 50 grammes plus 20 grammes. Combien pèse la banane ?',
      answer: 170,
      decimals: 0,
      explication:
        'La balance est en équilibre, donc la banane pèse autant que les masses : 100 + 50 + 20 = 170 g.',
      difficulty: 0.39,
      unit: 'g',
      meta: {
        balance: {
          masses: [100, 50, 20],
          unite: 'g',
          objet: '🍌',
        },
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CM2.MA.GM.AIRES:numeric_answer:quad-4,2;5,2;4,3;5,3;6,3;2,4;3,4;4,4;5,4;6,4;4,5;5,5-:1r8ip6a',
      lessonId: 'CM2.MA.GM.AIRES',
      prompt: 'Chaque carreau du quadrillage a une aire de 1 cm². Quelle est l’aire de la figure coloriée ?',
      spoken:
        'Chaque carreau du quadrillage a une aire de 1 centimètre carré. Quelle est l’aire de la figure coloriée ?',
      answer: 12,
      decimals: 0,
      explication: 'On compte les carreaux de la figure : il y en a 12, donc l’aire est de 12 cm².',
      difficulty: 0.39,
      unit: 'cm²',
      meta: {
        quadrillage: {
          cols: 8,
          rows: 6,
          cells: [
            [4, 2],
            [5, 2],
            [4, 3],
            [5, 3],
            [6, 3],
            [2, 4],
            [3, 4],
            [4, 4],
            [5, 4],
            [6, 4],
            [4, 5],
            [5, 5],
          ],
        },
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CM2.MA.GM.AIRES:numeric_answer:quad-4,1;5,1;6,1;4,2;5,2;6,2;4,3;6,3-5,3,bd;6,0,bg;3,3,bg:fvnawr',
      lessonId: 'CM2.MA.GM.AIRES',
      prompt:
        'Chaque carreau du quadrillage a une aire de 1 cm². Deux demi-carreaux font un carreau. Quelle est l’aire de la figure coloriée ?',
      spoken:
        'Chaque carreau du quadrillage a une aire de 1 centimètre carré. Deux demi-carreaux font un carreau. Quelle est l’aire de la figure coloriée ?',
      answer: 9.5,
      decimals: 1,
      explication: 'On compte 8 carreaux entiers et 3 demi-carreaux (1,5 carreaux) : 8 + 1,5 = 9,5 cm².',
      difficulty: 0.6,
      unit: 'cm²',
      meta: {
        quadrillage: {
          cols: 8,
          rows: 6,
          cells: [
            [4, 1],
            [5, 1],
            [6, 1],
            [4, 2],
            [5, 2],
            [6, 2],
            [4, 3],
            [6, 3],
          ],
          demis: [
            [5, 3, 'bd'],
            [6, 0, 'bg'],
            [3, 3, 'bg'],
          ],
        },
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CM2.MA.GM.AIRES:numeric_answer:comp-12-5-5-4-cm:1yeelox',
      lessonId: 'CM2.MA.GM.AIRES',
      prompt:
        'Une figure est formée de deux rectangles accolés : l’un mesure 12 cm sur 5 cm, l’autre 5 cm sur 4 cm. Quelle est l’aire de la figure ?',
      spoken:
        'Une figure est formée de deux rectangles accolés : l’un mesure 12 centimètres sur 5 centimètres, l’autre 5 centimètres sur 4 centimètres. Quelle est l’aire de la figure ?',
      answer: 80,
      decimals: 0,
      explication:
        'On ajoute les aires des deux rectangles : 12 × 5 = 60 et 5 × 4 = 20, donc 60 + 20 = 80 cm².',
      difficulty: 0.65,
      unit: 'cm²',
      meta: {
        rectangles: [
          [12, 5],
          [5, 4],
        ],
        unite: 'cm',
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CM2.MA.GM.PERIMETRE:numeric_answer:poly-7.1;5.7;4.7;5.2;3.4;5.9:1fy4jot',
      lessonId: 'CM2.MA.GM.PERIMETRE',
      prompt:
        'Les côtés d’un hexagone mesurent 7,1 cm, 5,7 cm, 4,7 cm, 5,2 cm, 3,4 cm et 5,9 cm. Quel est son périmètre ?',
      spoken:
        'Les côtés d’un hexagone mesurent 7 virgule 1 centimètres, 5 virgule 7 centimètres, 4 virgule 7 centimètres, 5 virgule 2 centimètres, 3 virgule 4 centimètres et 5 virgule 9 centimètres. Quel est son périmètre ?',
      answer: 32,
      decimals: 0,
      explication:
        'On additionne les longueurs de tous les côtés : 7,1 + 5,7 + 4,7 + 5,2 + 3,4 + 5,9 = 32 cm.',
      difficulty: 0.64,
      unit: 'cm',
      meta: {
        figure: {
          type: 'polygone',
          cotes: [7.1, 5.7, 4.7, 5.2, 3.4, 5.9],
          unite: 'cm',
        },
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CM2.MA.GM.PERIMETRE:numeric_answer:cercle-d-22-cm:1aaqlog',
      lessonId: 'CM2.MA.GM.PERIMETRE',
      prompt:
        'Un cercle a un diamètre de 22 cm. Quelle est la longueur de son tour ? (Prends 3,14 × le diamètre.)',
      spoken:
        'Un cercle a un diamètre de 22 centimètres. Quelle est la longueur de son tour ? (Prends 3 virgule 14 fois le diamètre.)',
      answer: 69.08,
      decimals: 2,
      explication: 'Le tour d’un cercle mesure environ 3,14 fois son diamètre : 3,14 × 22 = 69,08 cm.',
      difficulty: 0.6,
      unit: 'cm',
      meta: {
        figure: {
          type: 'cercle',
          cotes: [],
          unite: 'cm',
          diametre: 22,
        },
      },
    },
    {
      kind: 'numeric_answer',
      id: 'CM2.MA.GM.LONG_MASSE_CONT:numeric_answer:comp-9 m 56 cm = … cm:1utgy55',
      lessonId: 'CM2.MA.GM.LONG_MASSE_CONT',
      prompt: '9 m 56 cm = … cm',
      spoken: '9 mètres 56 centimètres égale combien de centimètres',
      answer: 956,
      decimals: 0,
      explication: '1 m = 100 cm, donc 9 m = 900 cm, et 900 + 56 = 956 cm.',
      difficulty: 0.5,
      unit: 'cm',
    },
  ],
  mcq: [
    {
      kind: 'mcq',
      id: 'CE1.MA.DON.LIRE:mcq:qcm-Les oiseaux vus dans la cour-37-23-25-28-false:1c06je',
      lessonId: 'CE1.MA.DON.LIRE',
      question:
        'Les oiseaux vus dans la cour — moineaux : 37, pigeons : 23, merles : 25, mésanges : 28.\nQu’a-t-on le moins compté ?',
      choices: ['moineaux', 'merles', 'mésanges', 'pigeons'],
      answerIndex: 3,
      explication: 'On lit chaque case du tableau : « pigeons » a 23 oiseaux, c’est le plus petit nombre.',
      difficulty: 0.4,
      guillotine: true,
      meta: {
        graphique: {
          type: 'tableau',
          titre: 'Les oiseaux vus dans la cour',
          etiquettes: ['moineaux', 'pigeons', 'merles', 'mésanges'],
          valeurs: [37, 23, 25, 28],
          unite: 'oiseaux',
        },
        question: 'Qu’a-t-on le moins compté ?',
      },
    },
    {
      kind: 'mcq',
      id: 'CM2.MA.DON.LIRE:mcq:circ-part-Le goûter préféré des 56 élèves de l’école-un fruit,un yaourt,une tartine,un gâteau-28000,14000,7000,7000-0:1ges032',
      lessonId: 'CM2.MA.DON.LIRE',
      question:
        'Diagramme circulaire « Le goûter préféré des 56 élèves de l’école » (un fruit : 28 élèves, un yaourt : 14 élèves, une tartine : 7 élèves, un gâteau : 7 élèves).\nQuelle part des élèves préfèrent « un fruit » ?',
      choices: ['la moitié', 'les trois quarts', 'le quart', 'le sixième'],
      answerIndex: 0,
      explication: '28 élèves sur 56 : 56 ÷ 2 = 28, donc c’est la moitié.',
      difficulty: 0.45,
      guillotine: true,
      meta: {
        graphique: {
          type: 'circulaire',
          titre: 'Le goûter préféré des 56 élèves de l’école',
          etiquettes: ['un fruit', 'un yaourt', 'une tartine', 'un gâteau'],
          valeurs: [28, 14, 7, 7],
          unite: 'élèves',
        },
        question: 'Quelle part des élèves préfèrent « un fruit » ?',
      },
    },
    {
      kind: 'mcq',
      id: 'CM2.MA.DON.LIRE:mcq:erreur-Les visiteurs du musée de la ville pendant une semaine-mercredi,jeudi,vendredi,samedi,dimanche-759000,444000,614000,691000,541000-1-533:1axwrq1',
      lessonId: 'CM2.MA.DON.LIRE',
      question:
        'Tableau « Les visiteurs du musée de la ville pendant une semaine » — mercredi : 759, jeudi : 444, vendredi : 614, samedi : 691, dimanche : 541.\nDiagramme de Léo — mercredi : 759, jeudi : 533, vendredi : 614, samedi : 691, dimanche : 541.\nLéo a construit le diagramme en barres. Quelle barre est fausse ?',
      choices: ['dimanche', 'samedi', 'mercredi', 'vendredi', 'jeudi'],
      answerIndex: 4,
      explication:
        'On compare chaque barre au tableau : pour « jeudi », la barre monte à 533 au lieu de 444.',
      difficulty: 0.8,
      guillotine: true,
      meta: {
        graphique: {
          type: 'barres',
          titre: 'Les visiteurs du musée de la ville pendant une semaine',
          etiquettes: ['mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
          valeurs: [759, 533, 614, 691, 541],
          unite: 'visiteurs',
        },
        question: 'Léo a construit le diagramme en barres. Quelle barre est fausse ?',
        tableauJuste: [759, 444, 614, 691, 541],
      },
    },
    {
      kind: 'mcq',
      id: 'CM2.MA.DON.LIRE:mcq:hausse-La température moyenne de chaque mois à Paris-février,mars,avril,mai,juin,juillet-6000,9000,12000,16000,19000,21000:1739wfl',
      lessonId: 'CM2.MA.DON.LIRE',
      question:
        'Courbe « La température moyenne de chaque mois à Paris » — février : 6 °C, mars : 9 °C, avril : 12 °C, mai : 16 °C, juin : 19 °C, juillet : 21 °C.\nEntre quels relevés la température moyenne a-t-elle le plus augmenté ?',
      choices: ['entre mars et avril', 'entre mai et juin', 'entre avril et mai', 'entre juin et juillet'],
      answerIndex: 2,
      explication:
        'On calcule chaque augmentation ; la plus grande est entre avril et mai : 16 − 12 = 4 °C. C’est là que la courbe monte le plus.',
      difficulty: 0.8,
      guillotine: true,
      meta: {
        graphique: {
          type: 'courbe',
          titre: 'La température moyenne de chaque mois à Paris',
          etiquettes: ['février', 'mars', 'avril', 'mai', 'juin', 'juillet'],
          valeurs: [6, 9, 12, 16, 19, 21],
          unite: '°C',
        },
        question: 'Entre quels relevés la température moyenne a-t-elle le plus augmenté ?',
      },
    },
    {
      kind: 'mcq',
      id: 'CM2.MA.PROBA:mcq:chances-On tire au hasard une carte parmi 10 cartes numérotées de 1 à 10.-tirer le nombre 10:10idrqd',
      lessonId: 'CM2.MA.PROBA',
      question:
        'On tire au hasard une carte parmi 10 cartes numérotées de 1 à 10. Combien de chances a-t-on de tirer le nombre 10 ?',
      choices: ['1 chance sur 10', '9 chances sur 10', '1 chance sur 11', '1 chance sur 9'],
      answerIndex: 0,
      explication:
        'Il y a 10 issues possibles, qui ont toutes la même chance, et 1 permet de tirer le nombre 10 : 1 chance sur 10.',
      difficulty: 0.45,
      guillotine: true,
    },
    {
      kind: 'mcq',
      id: 'CM2.MA.PROBA:mcq:comparer-On lance deux pièces de monnaie, une rouge et une bleue.-obtenir au moins un pile|obtenir pile ou face sur chaque pièce|obtenir trois fois pile|obtenir un pile et un face:1f20wbq',
      lessonId: 'CM2.MA.PROBA',
      question:
        'On lance deux pièces de monnaie, une rouge et une bleue. Quel évènement est le plus probable ?',
      choices: [
        'Obtenir un pile et un face',
        'Obtenir au moins un pile',
        'Obtenir trois fois pile',
        'Obtenir pile ou face sur chaque pièce',
      ],
      answerIndex: 3,
      explication:
        'On compte les issues qui conviennent pour chaque évènement : obtenir au moins un pile → 3 chances sur 4 ; obtenir pile ou face sur chaque pièce → 4 chances sur 4 ; obtenir trois fois pile → 0 chance sur 4 ; obtenir un pile et un face → 2 chances sur 4.',
      difficulty: 0.75,
      guillotine: true,
    },
    {
      kind: 'mcq',
      id: 'CM2.MA.GM.LONG_MASSE_CONT:mcq:estim-la longueur d’une voiture:2jerar',
      lessonId: 'CM2.MA.GM.LONG_MASSE_CONT',
      question: '🚗 Quelle est la mesure la plus vraisemblable pour la longueur d’une voiture ?',
      choices: ['4 cm', '4 m', '4 km'],
      answerIndex: 1,
      explication:
        'La longueur d’une voiture est d’environ 4 m : il faut choisir une unité adaptée à ce que l’on mesure.',
      difficulty: 0.25,
      guillotine: true,
      meta: {
        grandeur: 'longueur',
      },
    },
    {
      kind: 'mcq',
      id: 'CE1.MA.GM.MASSES:mcq:estim-Un paquet de sucre pèse…:19ll6tx',
      lessonId: 'CE1.MA.GM.MASSES',
      question: 'Un paquet de sucre pèse…',
      choices: ['1 kg', '1 g', '100 kg'],
      answerIndex: 0,
      explication: 'Un paquet de sucre pèse 1 kg : c’est une masse de référence à retenir.',
      difficulty: 0.35,
      guillotine: true,
    },
  ],
};
