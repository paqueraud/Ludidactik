/**
 * « Mon île » (GAMIFICATION §3) : chaque matière est un quartier ; chaque leçon maîtrisée (≥ 80 %)
 * rapporte une gemme qui construit un bâtiment, puis l'agrandit (étage, puis drapeau doré).
 * Une leçon commencée mais pas encore maîtrisée montre un chantier : on voit où l'on en est.
 */
import type { Matiere } from '@/content/schemas';

export const SEUIL_GEMME = 0.8;
/** Maîtrise à partir de laquelle une leçon apparaît « en chantier ». */
export const SEUIL_CHANTIER = 0.2;

export type TypeBatiment =
  | 'maison'
  | 'moulin'
  | 'tour'
  | 'dome'
  | 'phare'
  | 'chateau'
  | 'cabane'
  | 'temple'
  | 'serre'
  | 'bateau'
  | 'kiosque'
  | 'bibliotheque';

export interface QuartierDef {
  id: string;
  nom: string;
  icone: string;
  matieres: Matiere[];
  /** Couleurs du sol et des toits. */
  sol: string;
  toit: string;
  batiments: { type: TypeBatiment; nom: string }[];
}

export const QUARTIERS: QuartierDef[] = [
  {
    id: 'nombres',
    nom: 'Village des Nombres',
    icone: '🔢',
    matieres: ['maths'],
    sol: '#BFE3FF',
    toit: '#2980E6',
    batiments: [
      { type: 'moulin', nom: 'Moulin à calculs' },
      { type: 'maison', nom: 'Maison des unités' },
      { type: 'tour', nom: 'Tour de l’horloge' },
      { type: 'kiosque', nom: 'Kiosque des tables' },
      { type: 'dome', nom: 'Observatoire des formes' },
      { type: 'maison', nom: 'Épicerie des mesures' },
    ],
  },
  {
    id: 'mots',
    nom: 'Forêt des Mots',
    icone: '🌳',
    matieres: ['francais'],
    sol: '#C8EFC0',
    toit: '#F06252',
    batiments: [
      { type: 'bibliotheque', nom: 'Bibliothèque' },
      { type: 'cabane', nom: 'Cabane des contes' },
      { type: 'maison', nom: 'Imprimerie' },
      { type: 'cabane', nom: 'Cabane-dictionnaire' },
      { type: 'tour', nom: 'Tour des poètes' },
      { type: 'kiosque', nom: 'Kiosque à journaux' },
    ],
  },
  {
    id: 'histoire',
    nom: 'Colline de l’Histoire',
    icone: '🏰',
    matieres: ['histoire'],
    sol: '#F5DDB4',
    toit: '#B5462F',
    batiments: [
      { type: 'chateau', nom: 'Château fort' },
      { type: 'temple', nom: 'Musée' },
      { type: 'maison', nom: 'Maison à colombages' },
      { type: 'tour', nom: 'Donjon' },
      { type: 'moulin', nom: 'Moulin d’autrefois' },
      { type: 'temple', nom: 'Salle des fêtes' },
    ],
  },
  {
    id: 'cartes',
    nom: 'Vallée des Cartes',
    icone: '🗺️',
    matieres: ['geographie'],
    sol: '#D7F0C8',
    toit: '#40A85C',
    batiments: [
      { type: 'dome', nom: 'Planétarium' },
      { type: 'maison', nom: 'Gare' },
      { type: 'tour', nom: 'Tour de la boussole' },
      { type: 'kiosque', nom: 'Office des cartes' },
      { type: 'moulin', nom: 'Éolienne' },
      { type: 'maison', nom: 'Refuge' },
    ],
  },
  {
    id: 'sciences',
    nom: 'Lac des Sciences',
    icone: '🔬',
    matieres: ['sciences', 'questionner_le_monde'],
    sol: '#C3F1EC',
    toit: '#1AB1AA',
    batiments: [
      { type: 'dome', nom: 'Observatoire' },
      { type: 'serre', nom: 'Serre' },
      { type: 'tour', nom: 'Station météo' },
      { type: 'serre', nom: 'Potager' },
      { type: 'maison', nom: 'Laboratoire' },
      { type: 'moulin', nom: 'Moulin à eau' },
    ],
  },
  {
    id: 'langues',
    nom: 'Port des Langues',
    icone: '⚓',
    matieres: ['anglais'],
    sol: '#D9D2FF',
    toit: '#9660DC',
    batiments: [
      { type: 'phare', nom: 'Phare' },
      { type: 'bateau', nom: 'Voilier' },
      { type: 'maison', nom: 'Auberge' },
      { type: 'bateau', nom: 'Bateau-école' },
      { type: 'kiosque', nom: 'Café du port' },
      { type: 'tour', nom: 'Capitainerie' },
    ],
  },
  {
    id: 'ensemble',
    nom: 'Place du Vivre-ensemble',
    icone: '🤝',
    matieres: ['emc'],
    sol: '#FFE6C7',
    toit: '#5C78DC',
    batiments: [
      { type: 'kiosque', nom: 'Kiosque à musique' },
      { type: 'temple', nom: 'Mairie' },
      { type: 'maison', nom: 'École' },
      { type: 'serre', nom: 'Jardin partagé' },
      { type: 'bibliotheque', nom: 'Médiathèque' },
      { type: 'tour', nom: 'Beffroi' },
    ],
  },
];

export const quartierDe = (m: Matiere) => QUARTIERS.find((q) => q.matieres.includes(m));

export interface BatimentEtat {
  type: TypeBatiment;
  nom: string;
  /** 0 = terrain libre, 1 = construit, 2 = agrandi, 3 = drapeau doré. */
  niveau: number;
  chantier: boolean;
}

export interface QuartierEtat {
  def: QuartierDef;
  lecons: number;
  gemmes: number;
  chantiers: number;
  batiments: BatimentEtat[];
}

/** État de l'île : gemmes par quartier, bâtiments construits (répartis à tour de rôle). */
export function etatIle(
  lecons: { id: string; matiere: Matiere }[],
  gemmes: ReadonlySet<string>,
  maitrises: ReadonlyMap<string, number>,
): QuartierEtat[] {
  const out: QuartierEtat[] = [];
  for (const def of QUARTIERS) {
    const ls = lecons.filter((l) => def.matieres.includes(l.matiere));
    if (!ls.length) continue;
    const g = ls.filter((l) => gemmes.has(l.id)).length;
    const chantiers = ls.filter(
      (l) => !gemmes.has(l.id) && (maitrises.get(l.id) ?? 0) >= SEUIL_CHANTIER,
    ).length;
    const n = def.batiments.length;
    const batiments = def.batiments.map((b, j) => ({
      ...b,
      niveau: Math.min(3, g > j ? Math.floor((g - 1 - j) / n) + 1 : 0),
      // le prochain terrain libre montre un chantier si une leçon est en route
      chantier: chantiers > 0 && g < n && j === g,
    }));
    out.push({ def, lecons: ls.length, gemmes: g, chantiers, batiments });
  }
  return out;
}
