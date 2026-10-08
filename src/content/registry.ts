/**
 * Registre du contenu généré : chaque domaine (calcul, maths CE1, conjugaison…) exporte un
 * `ContentModule` qui associe un id de leçon à des générateurs (flux infini) ou des banques
 * (liste finie) par type d'item. Les modules sont rassemblés dans `modules/index.ts`.
 */
import type { Rng } from '@/engine/rng';
import type { ParentWordList } from '@/services/storage/db';
import type { Item } from './items';
import type { ContentIndex } from './parse';
import type { ItemKind, Lesson, Level } from './schemas';

export interface GenContext {
  index: ContentIndex;
  lesson: Lesson;
  /** Listes de mots des parents (pour ce profil). */
  parentLists: ParentWordList[];
}

/** Générateur : produit un nouvel item à chaque appel (flux infini). Doit être pur vis-à-vis de `rng`. */
export type ItemGen = (level: Level, rng: Rng, ctx: GenContext) => Item;
/** Banque : liste finie d'items pour ce niveau. */
export type ItemPool = (level: Level, rng: Rng, ctx: GenContext) => Item[];

export interface LessonContent {
  gens?: Partial<Record<ItemKind, ItemGen>>;
  pools?: Partial<Record<ItemKind, ItemPool>>;
}

/** id de leçon → contenu. */
export type ContentModule = Record<string, LessonContent>;

/** Fusionne plusieurs modules (un même id de leçon peut recevoir des types d'items de plusieurs modules). */
export function mergeModules(...modules: ContentModule[]): ContentModule {
  const out: ContentModule = {};
  for (const m of modules)
    for (const [id, c] of Object.entries(m)) {
      const cur = (out[id] ??= {});
      if (c.gens) cur.gens = { ...cur.gens, ...c.gens };
      if (c.pools) cur.pools = { ...cur.pools, ...c.pools };
    }
  return out;
}

/**
 * Contenu chargé à la demande (par classe, voir `chargerClasses` dans `index.ts`) : c'est ce registre
 * que lit le fournisseur d'items. Son contenu est remplacé en place à chaque chargement.
 */
export const CONTENU_CHARGE: ContentModule = {};

export function remplacerContenuCharge(mod: ContentModule) {
  for (const k of Object.keys(CONTENU_CHARGE)) delete CONTENU_CHARGE[k];
  Object.assign(CONTENU_CHARGE, mod);
}
