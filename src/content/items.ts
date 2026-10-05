/**
 * Items : le contrat entre CONTENU et JEUX (ARCHITECTURE §3.2).
 * Un générateur ou une banque produit des items typés ; un jeu déclare les types qu'il accepte.
 * Toute donnée propre à un jeu qui ne rentre pas dans le contrat va dans `meta` (jamais de contenu
 * pédagogique en dur dans un jeu).
 */
import { z } from 'zod';

const Base = {
  id: z.string().min(1),
  lessonId: z.string().min(1),
  /** Explication courte affichée après une erreur (règle en une phrase d'enfant). */
  explication: z.string().min(3),
  /** Texte lu à voix haute (consigne/énoncé) si différent de l'affichage. */
  spoken: z.string().optional(),
  /** Langue de la lecture à voix haute (anglais : 'en-GB'). */
  lang: z.enum(['fr-FR', 'en-GB']).optional(),
  /** Difficulté relative dans le niveau [0,1] (adaptativité). */
  difficulty: z.number().min(0).max(1).optional(),
  /** Données facultatives propres à certains jeux. */
  meta: z.record(z.string(), z.unknown()).optional(),
};

/** Calcul / question à réponse numérique. */
export const NumericItemSchema = z.object({
  ...Base,
  kind: z.literal('numeric_answer'),
  /** Énoncé affiché (« 47 + 9 », « Le double de 25 »). */
  prompt: z.string().min(1),
  spoken: z.string().min(1),
  answer: z.number().finite(),
  /** Nombre de décimales attendues (0 = entier). */
  decimals: z.number().int().min(0).max(3),
  difficulty: z.number().min(0).max(1),
  /** Unité affichée après la case réponse (« cm », « € »). */
  unit: z.string().optional(),
});
export type NumericItem = z.infer<typeof NumericItemSchema>;

/** Mot (ou phrase) à écrire sous la dictée. */
export const SpellingItemSchema = z.object({
  ...Base,
  kind: z.literal('spelling_word'),
  word: z.string().min(1),
  /** Phrase-contexte lue entre deux lectures du mot. */
  sentence: z.string().optional(),
  /** Mode « dictée de phrase » : la réponse attendue est la phrase entière. */
  isSentence: z.boolean(),
  /** Clé d'un enregistrement audio parent (table Dexie `audio`). */
  audioKey: z.string().optional(),
  /** Définition ou indice (mots croisés, bonhomme de neige). */
  definition: z.string().optional(),
  source: z.enum(['programme', 'parents']),
});
export type SpellingItem = z.infer<typeof SpellingItemSchema>;

/** Question à choix multiples (2 à 6 choix). */
export const McqItemSchema = z.object({
  ...Base,
  kind: z.literal('mcq'),
  question: z.string().min(1),
  choices: z.array(z.string()).min(2).max(6),
  answerIndex: z.number().int().min(0),
  /** Réponse saisissable (ex. une année) pour le niveau « Pour aller plus loin ». */
  typedAnswer: z.string().optional(),
  /** Indices progressifs (Qui suis-je ?). */
  hints: z.array(z.string()).optional(),
  /** Emoji ou pictogramme illustrant la question. */
  image: z.string().optional(),
  /** false = thème sensible : jamais joué dans la Guillotine. */
  guillotine: z.boolean(),
});
export type McqItem = z.infer<typeof McqItemSchema>;

/** Affirmation vraie ou fausse. */
export const TrueFalseItemSchema = z.object({
  ...Base,
  kind: z.literal('true_false'),
  statement: z.string().min(1),
  answer: z.boolean(),
  image: z.string().optional(),
});
export type TrueFalseItem = z.infer<typeof TrueFalseItemSchema>;

/** Éléments à remettre dans l'ordre (`elements` est donné DANS LE BON ORDRE). */
export const OrderingItemSchema = z.object({
  ...Base,
  kind: z.literal('ordering'),
  prompt: z.string().min(1),
  elements: z.array(z.string().min(1)).min(2).max(10),
  /** Étiquettes révélées après réponse (dates d'une frise…), alignées sur `elements`. */
  labels: z.array(z.string()).optional(),
  /** chrono = frise ; croissant/decroissant = nombres ; phrase = mots d'une phrase ; etapes = procédure. */
  mode: z.enum(['chrono', 'croissant', 'decroissant', 'phrase', 'etapes']),
});
export type OrderingItem = z.infer<typeof OrderingItemSchema>;

/** Éléments à ranger dans des catégories. */
export const ClassificationItemSchema = z.object({
  ...Base,
  kind: z.literal('classification'),
  prompt: z.string().min(1),
  categories: z.array(z.string().min(1)).min(2).max(6),
  /** `category` = index dans `categories`. */
  elements: z
    .array(
      z.object({ label: z.string().min(1), category: z.number().int().min(0), image: z.string().optional() }),
    )
    .min(2)
    .max(16),
});
export type ClassificationItem = z.infer<typeof ClassificationItemSchema>;

/** Paires à associer (terme ↔ définition, calcul ↔ résultat, mot ↔ image…). */
export const PairingItemSchema = z.object({
  ...Base,
  kind: z.literal('pairing'),
  prompt: z.string().min(1),
  pairs: z
    .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
    .min(2)
    .max(10),
  /** Nature du lien (« synonymes », « contraires », « calcul → résultat »…). */
  relation: z.string().optional(),
});
export type PairingItem = z.infer<typeof PairingItemSchema>;

/** Phrase à trou : `sentence` contient « ___ » à l'endroit du trou. */
export const FillBlankItemSchema = z.object({
  ...Base,
  kind: z.literal('fill_blank'),
  sentence: z.string().includes('___'),
  answer: z.string().min(1),
  /** Autres réponses acceptées (rectifications 1990…). */
  accepted: z.array(z.string()).optional(),
  /** Choix proposés (pêche, wagons) ; absent = saisie libre. */
  choices: z.array(z.string()).min(2).max(6).optional(),
  /** Astuce de substitution (« remplace par avait »). */
  hint: z.string().optional(),
  /** Pour la conjugaison : rouleaux de la Forge. */
  conjugaison: z.object({ sujet: z.string(), verbe: z.string(), temps: z.string() }).optional(),
});
export type FillBlankItem = z.infer<typeof FillBlankItemSchema>;

/** Placer / lire un nombre sur une demi-droite graduée. */
export const NumberLineItemSchema = z.object({
  ...Base,
  kind: z.literal('number_line'),
  prompt: z.string().min(1),
  min: z.number(),
  max: z.number(),
  /** Pas des graduations principales. */
  step: z.number().positive(),
  /** Sous-graduations par pas (fractions : dénominateur). */
  subdivisions: z.number().int().min(1).optional(),
  target: z.number(),
  /** Écriture affichée de la cible (« 3/4 », « 2,5 », « 640 »). */
  display: z.string().min(1),
  /** Écart accepté (en valeur). */
  tolerance: z.number().min(0),
});
export type NumberLineItem = z.infer<typeof NumberLineItemSchema>;

/** Fraction à représenter / lire / comparer avec un modèle visuel. */
export const VisualFractionItemSchema = z.object({
  ...Base,
  kind: z.literal('visual_fraction'),
  prompt: z.string().min(1),
  numerator: z.number().int().min(0),
  denominator: z.number().int().min(1).max(60),
  shape: z.enum(['pizza', 'barre', 'tablette']),
  /** colorier = construire la fraction ; lire = écrire la fraction montrée ; comparer = choisir la plus grande. */
  task: z.enum(['colorier', 'lire', 'comparer']),
  /** Pour « comparer » : seconde fraction. */
  other: z.object({ numerator: z.number().int().min(0), denominator: z.number().int().min(1) }).optional(),
});
export type VisualFractionItem = z.infer<typeof VisualFractionItemSchema>;

/** Heure et durées. */
export const ClockItemSchema = z.object({
  ...Base,
  kind: z.literal('clock'),
  prompt: z.string().min(1),
  task: z.enum(['lire', 'regler', 'duree']),
  hours: z.number().int().min(0).max(23),
  minutes: z.number().int().min(0).max(59),
  seconds: z.number().int().min(0).max(59).optional(),
  /** Pour « duree » : durée en minutes à trouver ou à ajouter. */
  durationMinutes: z.number().int().min(0).optional(),
  /** Réponse attendue écrite (« 3 h 15 », « 45 min »). */
  answerText: z.string().min(1),
});
export type ClockItem = z.infer<typeof ClockItemSchema>;

/** Monnaie (montants en CENTIMES). */
export const MoneyItemSchema = z.object({
  ...Base,
  kind: z.literal('money'),
  prompt: z.string().min(1),
  task: z.enum(['payer', 'rendre']),
  priceCents: z.number().int().min(1),
  /** Pour « rendre » : somme donnée par le client. */
  givenCents: z.number().int().min(0).optional(),
  /** Pièces et billets disponibles (centimes) : 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000. */
  denominations: z.array(z.number().int().positive()).min(1),
});
export type MoneyItem = z.infer<typeof MoneyItemSchema>;

/** Géométrie : figures, propriétés, symétrie sur quadrillage, solides. */
export const GeometryItemSchema = z.object({
  ...Base,
  kind: z.literal('geometry_shape'),
  prompt: z.string().min(1),
  task: z.enum(['nommer', 'proprietes', 'symetrie', 'solide', 'patron', 'tracer']),
  /** Identifiant de figure (« carre », « triangle_rectangle », « cube », « patron_cube_1 »…). */
  shape: z.string().min(1),
  choices: z.array(z.string()).optional(),
  answer: z.string().min(1),
  /** Symétrie / tracé : quadrillage, cases déjà colorées, axe. */
  grid: z
    .object({
      cols: z.number().int().min(2).max(20),
      rows: z.number().int().min(2).max(20),
      cells: z.array(z.tuple([z.number().int(), z.number().int()])),
      axis: z.enum(['vertical', 'horizontal', 'diagonale', 'anti-diagonale']).optional(),
    })
    .optional(),
});
export type GeometryItem = z.infer<typeof GeometryItemSchema>;

/** Localiser un lieu sur une carte SVG. */
export const MapPointItemSchema = z.object({
  ...Base,
  kind: z.literal('map_point'),
  prompt: z.string().min(1),
  /** Carte : 'france-regions', 'france-fleuves', 'france-massifs', 'europe', 'monde'. */
  map: z.string().min(1),
  /** Identifiant de la zone cible dans la carte. */
  target: z.string().min(1),
  /** Nom affiché de la cible. */
  targetLabel: z.string().min(1),
});
export type MapPointItem = z.infer<typeof MapPointItemSchema>;

/** Texte à lire à voix haute (fluence, MCLM). */
export const ReadAloudItemSchema = z.object({
  ...Base,
  kind: z.literal('read_aloud'),
  title: z.string().min(1),
  text: z.string().min(10),
  nbMots: z.number().int().positive(),
  /** Objectif en mots correctement lus par minute. */
  targetMCLM: z.number().int().positive(),
});
export type ReadAloudItem = z.infer<typeof ReadAloudItemSchema>;

/** Réponse orale (reconnaissance vocale, repli écrit / auto-évaluation). */
export const OralItemSchema = z.object({
  ...Base,
  kind: z.literal('oral_answer'),
  /** Ce qu'il faut lire ou à quoi répondre. */
  prompt: z.string().min(1),
  /** Réponse affichée. */
  answer: z.string().min(1),
  /** Transcriptions acceptées (variantes : « 56 », « cinquante-six »). */
  accepted: z.array(z.string().min(1)).min(1),
});
export type OralItem = z.infer<typeof OralItemSchema>;

/** Problème avec schéma en barre (4 phases BO : comprendre, modéliser, calculer, répondre). */
export const BarModelItemSchema = z.object({
  ...Base,
  kind: z.literal('bar_model'),
  statement: z.string().min(10),
  structure: z.enum([
    'parties-tout',
    'transformation',
    'comparaison',
    'multiplicatif',
    'partage',
    'deux-etapes',
  ]),
  /** Barres du schéma : chaque barre = segments (valeur connue ou null = inconnue). */
  bars: z
    .array(
      z.object({
        label: z.string(),
        segments: z.array(z.object({ value: z.number().nullable(), label: z.string().optional() })),
      }),
    )
    .min(1)
    .max(3),
  /** Total (accolade) si pertinent ; null = inconnu. */
  total: z.number().nullable().optional(),
  question: z.string().min(3),
  answer: z.number(),
  unit: z.string().optional(),
  /** Phrase-réponse attendue avec « ___ » pour le nombre. */
  answerSentence: z.string().includes('___'),
  /** Phase « comprendre » : reformulations dont la 1re est la bonne. */
  reformulations: z.array(z.string()).min(2).max(3).optional(),
  /** Opération attendue (« 75 − 28 »), affichée en correction. */
  operation: z.string().min(1),
});
export type BarModelItem = z.infer<typeof BarModelItemSchema>;

export const ItemSchema = z.discriminatedUnion('kind', [
  NumericItemSchema,
  SpellingItemSchema,
  McqItemSchema,
  TrueFalseItemSchema,
  OrderingItemSchema,
  ClassificationItemSchema,
  PairingItemSchema,
  FillBlankItemSchema,
  NumberLineItemSchema,
  VisualFractionItemSchema,
  ClockItemSchema,
  MoneyItemSchema,
  GeometryItemSchema,
  MapPointItemSchema,
  ReadAloudItemSchema,
  OralItemSchema,
  BarModelItemSchema,
]);
export type Item = z.infer<typeof ItemSchema>;
/** Item d'un type donné : `ItemOf<'mcq'>`. */
export type ItemOf<K extends Item['kind']> = Extract<Item, { kind: K }>;

/** Validation stricte des invariants (utilisée par les tests des générateurs). */
export function checkItem(item: Item): string[] {
  const errs: string[] = [];
  const r = ItemSchema.safeParse(item);
  if (!r.success) errs.push(...r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
  switch (item.kind) {
    case 'mcq':
      if (item.answerIndex >= item.choices.length) errs.push('answerIndex hors des choix');
      if (new Set(item.choices).size !== item.choices.length) errs.push('choix en double');
      break;
    case 'classification':
      if (item.elements.some((e) => e.category >= item.categories.length)) errs.push('catégorie inexistante');
      break;
    case 'fill_blank':
      if (item.choices && !item.choices.includes(item.answer))
        errs.push('la réponse ne figure pas dans les choix');
      break;
    case 'number_line':
      if (item.target < item.min || item.target > item.max) errs.push('cible hors de la droite');
      break;
    case 'visual_fraction':
      if (item.task === 'comparer' && !item.other) errs.push('comparer sans seconde fraction');
      break;
    case 'pairing': {
      const lefts = item.pairs.map((p) => p.left);
      const rights = item.pairs.map((p) => p.right);
      if (new Set(lefts).size !== lefts.length || new Set(rights).size !== rights.length)
        errs.push('paires ambiguës (doublons)');
      break;
    }
    case 'ordering':
      if (new Set(item.elements).size !== item.elements.length) errs.push('éléments en double');
      break;
  }
  return errs;
}
