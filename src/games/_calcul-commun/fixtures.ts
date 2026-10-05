/**
 * Items d'exemple des jeux de calcul n° 11 à 20 (formes `meta` du GUIDE §6) : servent aux tests et à
 * enrichir les exemples partagés du Labo (`src/games/_kit/fixtures.ts`). Tous valides (`checkItem`).
 */
import type { Item } from '@/content/schemas';

const L = 'LABO';

const num = (
  id: string,
  prompt: string,
  spoken: string,
  answer: number,
  explication: string,
  meta: Record<string, unknown>,
  decimals = 0,
  unit?: string,
): Item => ({
  kind: 'numeric_answer',
  id,
  lessonId: L,
  prompt,
  spoken,
  answer,
  decimals,
  difficulty: 0.5,
  explication,
  meta,
  ...(unit ? { unit } : {}),
});

/** Ascenseur de la virgule : `meta.glisse`. */
export const EX_GLISSE: Item[] = [
  num('gl1', '35 × 10', '35 fois 10', 350, 'Multiplier par 10 : chaque chiffre monte d’un rang.', {
    glisse: { nombre: 35, operation: '×', facteur: 10 },
  }),
  num(
    'gl2',
    '4,2 × 100',
    '4 virgule 2 fois 100',
    420,
    'Multiplier par 100 : chaque chiffre monte de 2 rangs.',
    {
      glisse: { nombre: 4.2, operation: '×', facteur: 100 },
    },
  ),
  num(
    'gl3',
    '56 ÷ 1 000',
    '56 divisé par 1 000',
    0.056,
    'Diviser par 1 000 : chaque chiffre descend de 3 rangs.',
    { glisse: { nombre: 56, operation: '÷', facteur: 1000 } },
    3,
  ),
  num(
    'gl4',
    '7,5 ÷ 10',
    '7 virgule 5 divisé par 10',
    0.75,
    'Diviser par 10 : chaque chiffre descend d’un rang.',
    { glisse: { nombre: 7.5, operation: '÷', facteur: 10 } },
    2,
  ),
];

/** Grand Huit : `meta.posee` (et `meta.termes` pour l'addition de plusieurs nombres). */
export const EX_POSEE: Item[] = [
  num(
    'po1',
    '347 + 285',
    '347 plus 285',
    632,
    'On additionne colonne par colonne, sans oublier les retenues.',
    {
      posee: { a: 347, b: 285, op: '+' },
      termes: [347, 285],
    },
  ),
  num(
    'po2',
    '503 − 278',
    '503 moins 278',
    225,
    'Quand il n’y a pas assez en haut, on casse une dizaine ou une centaine.',
    {
      posee: { a: 503, b: 278, op: '−' },
      algorithme: 'cassage',
    },
  ),
  num(
    'po3',
    '146 × 23',
    '146 fois 23',
    3358,
    'On multiplie par 3, puis par 20, et on additionne les deux lignes.',
    {
      posee: { a: 146, b: 23, op: '×' },
    },
  ),
  num('po4', '175 ÷ 4', '175 divisé par 4', 43, 'Dans 17, 4 fois 4 ; dans 15, 3 fois 4, il reste 3.', {
    posee: { a: 175, b: 4, op: '÷' },
  }),
  num(
    'po5',
    '125 + 68 + 207',
    '125 plus 68 plus 207',
    400,
    'On additionne les trois nombres colonne par colonne.',
    {
      termes: [125, 68, 207],
    },
  ),
  num(
    'po6',
    '3,6 × 4',
    '3 virgule 6 fois 4',
    14.4,
    'On calcule 36 × 4 = 144, puis on place la virgule : 1 chiffre après la virgule.',
    { posee: { a: 3.6, b: 4, op: '×' } },
    1,
  ),
  num(
    'po7',
    '7 ÷ 4',
    '7 divisé par 4',
    1.75,
    'On continue la division après la virgule en abaissant des zéros.',
    { posee: { a: 7, b: 4, op: '÷' } },
    2,
  ),
];

/** Machine à programmes de calcul : `meta.programme` et `meta.suite`. */
export const EX_PROGRAMME: Item[] = [
  num(
    'pr1',
    'Programme : 4 → × 3 → + 5',
    'Choisis 4, multiplie par 3, ajoute 5.',
    17,
    '4 × 3 = 12, puis 12 + 5 = 17.',
    {
      programme: { etapes: ['× 3', '+ 5'], entree: 4, sortie: null },
    },
  ),
  num(
    'pr2',
    'Programme : ? → × 2 → − 3 → 15',
    'Quel nombre a-t-on choisi ? On multiplie par 2, on enlève 3 et on trouve 15.',
    9,
    'On remonte la machine : 15 + 3 = 18, puis 18 ÷ 2 = 9.',
    { programme: { etapes: ['× 2', '− 3'], entree: null, sortie: 15 } },
  ),
  num(
    'pr3',
    'Suite : 3, 7, 11, 15… Combien à l’étape 10 ?',
    'La suite 3, 7, 11, 15. Combien à l’étape 10 ?',
    39,
    'On ajoute 4 à chaque étape : 3 + 9 × 4 = 39.',
    { suite: { termes: [3, 7, 11, 15], etape: 10 } },
  ),
];

/** Pâtissier : `meta.tableau`. */
export const EX_TABLEAU: Item[] = [
  num(
    'ta1',
    'Pour 4 personnes, il faut 2 œufs. Combien d’œufs pour 12 personnes ?',
    'Pour 4 personnes, il faut 2 œufs. Combien d’œufs pour 12 personnes ?',
    6,
    '12, c’est 3 fois 4 : il faut 3 fois plus d’œufs, 2 × 3 = 6.',
    {
      tableau: {
        entetes: ['personnes', 'œufs'],
        lignes: [
          [4, 2],
          [12, null],
        ],
      },
    },
  ),
  num(
    'ta2',
    'Pour 6 crêpes, il faut 150 g de farine. Combien pour 9 crêpes ?',
    'Pour 6 crêpes, il faut 150 grammes de farine. Combien pour 9 crêpes ?',
    225,
    'Pour 3 crêpes : 75 g. 9 = 6 + 3, donc 150 + 75 = 225 g.',
    {
      tableau: {
        entetes: ['crêpes', 'farine (g)'],
        lignes: [
          [6, 150],
          [3, 75],
          [9, null],
        ],
      },
    },
    0,
    'g',
  ),
  num(
    'ta3',
    'Pour 5 gâteaux, il faut 400 g de sucre. Combien pour 1 gâteau ?',
    'Pour 5 gâteaux, il faut 400 grammes de sucre. Combien pour 1 gâteau ?',
    80,
    'Pour 1 gâteau, 5 fois moins : 400 ÷ 5 = 80 g.',
    {
      tableau: {
        entetes: ['gâteaux', 'sucre (g)'],
        lignes: [
          [5, 400],
          [1, null],
        ],
      },
    },
    0,
    'g',
  ),
];

/** Diviseurs mystères : classification de nombres (divisibilité). */
export const EX_DIVISIBILITE: Item[] = [
  {
    kind: 'classification',
    id: 'dv1',
    lessonId: L,
    prompt: 'Range les œufs : divisible par 2 ou non ?',
    categories: ['divisible par 2', 'non divisible par 2'],
    elements: [
      { label: '48', category: 0 },
      { label: '35', category: 1 },
      { label: '120', category: 0 },
      { label: '77', category: 1 },
      { label: '6', category: 0 },
      { label: '91', category: 1 },
    ],
    explication: 'Un nombre est divisible par 2 s’il se termine par 0, 2, 4, 6 ou 8.',
  },
  {
    kind: 'classification',
    id: 'dv2',
    lessonId: L,
    prompt: 'Range les œufs selon le dernier chiffre.',
    categories: ['divisible par 10', 'divisible par 5 mais pas par 10', 'non divisible par 5'],
    elements: [
      { label: '70', category: 0 },
      { label: '45', category: 1 },
      { label: '62', category: 2 },
      { label: '300', category: 0 },
      { label: '115', category: 1 },
      { label: '83', category: 2 },
    ],
    explication: 'Divisible par 10 : il se termine par 0. Divisible par 5 : il se termine par 0 ou 5.',
  },
  {
    kind: 'classification',
    id: 'dv3',
    lessonId: L,
    prompt: '6 est-il un diviseur de ces nombres ?',
    categories: ['6 est un diviseur', '6 n’est pas un diviseur'],
    elements: [
      { label: '18', category: 0 },
      { label: '20', category: 1 },
      { label: '24', category: 0 },
      { label: '27', category: 1 },
      { label: '30', category: 0 },
    ],
    explication: '6 est un diviseur d’un nombre s’il est dans la table de 6 : 6, 12, 18, 24, 30…',
  },
];

/** Monnaie, heure, fractions, problèmes : compléments aux exemples du Labo. */
export const EX_AUTRES: Item[] = [
  {
    kind: 'money',
    id: 'mo1',
    lessonId: L,
    prompt:
      'Le client achète pour 13,40 € et donne 20 €. Rends la monnaie avec le moins de pièces et de billets possible.',
    task: 'rendre',
    priceCents: 1340,
    givenCents: 2000,
    denominations: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
    explication: '20 € − 13,40 € = 6,60 € : 5 € + 1 € + 50 c + 10 c.',
    meta: { optimal: true, nbMini: 4 },
  },
  {
    kind: 'clock',
    id: 'ho1',
    lessonId: L,
    prompt: 'Quelle heure est-il ? (avec les secondes)',
    task: 'lire',
    hours: 10,
    minutes: 42,
    seconds: 30,
    answerText: '10 h 42 min 30 s',
    explication:
      'La petite aiguille a dépassé le 10, la grande est entre le 8 et le 9 : 42 minutes ; la trotteuse sur le 6 : 30 secondes.',
  },
  {
    kind: 'clock',
    id: 'ho2',
    lessonId: L,
    prompt: 'Le train part à 9 h 40 et arrive à 11 h 05. Combien de temps dure le trajet ?',
    task: 'duree',
    hours: 9,
    minutes: 40,
    durationMinutes: 85,
    answerText: '1 h 25 min',
    explication: '9 h 40 → 10 h : 20 min ; 10 h → 11 h 05 : 1 h 05. En tout 1 h 25 min.',
  },
  {
    kind: 'visual_fraction',
    id: 'fr1',
    lessonId: L,
    prompt: 'Le client commande 7/4 de pizza.',
    numerator: 7,
    denominator: 4,
    shape: 'pizza',
    task: 'colorier',
    explication: '7/4 = 4/4 + 3/4 : une pizza entière et 3 parts d’une deuxième.',
  },
  {
    kind: 'visual_fraction',
    id: 'fr2',
    lessonId: L,
    prompt: 'Qui a le plus de chocolat : 3/4 ou 5/8 de la tablette ?',
    numerator: 3,
    denominator: 4,
    shape: 'tablette',
    task: 'comparer',
    other: { numerator: 5, denominator: 8 },
    explication: '3/4 = 6/8 et 6/8 > 5/8.',
  },
  {
    kind: 'bar_model',
    id: 'bm1',
    lessonId: L,
    statement:
      'Dans l’école, il y a 257 filles et 211 garçons. Combien y a-t-il de filles de plus que de garçons ?',
    structure: 'comparaison',
    bars: [
      { label: 'Filles', segments: [{ value: 257 }] },
      { label: 'Garçons', segments: [{ value: 211 }, { value: null, label: 'écart' }] },
    ],
    total: null,
    question: 'Combien y a-t-il de filles de plus que de garçons ?',
    answer: 46,
    answerSentence: 'Il y a ___ filles de plus que de garçons.',
    reformulations: [
      'On compare les filles et les garçons : on cherche l’écart.',
      'On cherche le nombre total d’élèves de l’école.',
      'On cherche combien il y a de garçons.',
    ],
    operation: '257 − 211 = 46',
    explication: 'Pour trouver l’écart, on enlève le plus petit nombre du plus grand : 257 − 211 = 46.',
  },
];

export const EXEMPLES_CALCUL: Item[] = [
  ...EX_GLISSE,
  ...EX_POSEE,
  ...EX_PROGRAMME,
  ...EX_TABLEAU,
  ...EX_DIVISIBILITE,
  ...EX_AUTRES,
];
