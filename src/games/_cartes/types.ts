/** Modèle d'une carte cliquable (données de jeu, aucune donnée pédagogique : seulement des lieux). */
import type { LonLat, Point } from './geo';

export interface ZoneCarte {
  /** Identifiant stable (utilisé par les items `map_point` : `target`). Voir IDS.md. */
  id: string;
  /** Nom affiché et lu (libellé accessible). */
  nom: string;
  forme: 'surface' | 'ligne';
  /** Tracé SVG. */
  d: string;
  /** Centre (étiquette, déplacement du véhicule, navigation au clavier). */
  centre: Point;
  /** Très petit territoire : rayon d'un cercle de touche ajouté (unités SVG). */
  rayonTouche?: number;
  /** Groupe d'appartenance (ex. Amérique du Nord → « amerique »). */
  groupe?: string;
  /** Couleur de repos (pastel) ; sinon la couleur `terre` de la carte. */
  couleur?: string;
  /** Anneaux d'origine (lon/lat) : tests d'exactitude. */
  geo?: readonly (readonly LonLat[])[];
}

export interface DecorCarte {
  d: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  /** Dessiné au-dessus des zones (lacs, mers intérieures). */
  dessus?: boolean;
}

export interface EncartCarte {
  x: number;
  y: number;
  w: number;
  h: number;
  titre: string;
}

export interface Carte {
  id: string;
  titre: string;
  largeur: number;
  hauteur: number;
  /** Couleur de la mer (fond). */
  mer: string;
  /** Couleur des zones cliquables au repos. */
  terre: string;
  decor: DecorCarte[];
  zones: ZoneCarte[];
  /** Groupes de zones ciblables par un seul id (« amerique » = Amérique du Nord + du Sud). */
  groupes?: Record<string, { nom: string; zones: string[] }>;
  encarts?: EncartCarte[];
  /** Les zones « surface » sont dessinées dans cet ordre ; les océans d'abord (dessous). */
  dessous?: string[];
}
