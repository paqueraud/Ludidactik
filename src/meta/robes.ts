/**
 * Robes de cheval du Grand Prix (GAMIFICATION §2) : achetées dans la boutique avec les Ludis,
 * rangées dans l'inventaire du profil (id d'objet `robe-<id>`), portées par le cheval du joueur.
 */

export type MotifRobe = 'aucun' | 'pommele' | 'pie' | 'balzanes' | 'licorne';

export interface RobeCheval {
  id: string;
  nom: string;
  /** Prix en Ludis (0 = robe de base offerte). */
  prix: number;
  robe: string;
  criniere: string;
  motif: MotifRobe;
  /** Couleur des taches, balzanes ou de la corne. */
  motifCouleur?: string;
}

export const ROBES: readonly RobeCheval[] = [
  { id: 'alezan', nom: 'Alezan', prix: 0, robe: '#C68642', criniere: '#5A3825', motif: 'aucun' },
  {
    id: 'bai',
    nom: 'Bai',
    prix: 40,
    robe: '#8B4A2B',
    criniere: '#1F1A17',
    motif: 'balzanes',
    motifCouleur: '#1F1A17',
  },
  {
    id: 'noir',
    nom: 'Noir',
    prix: 60,
    robe: '#2B2A2E',
    criniere: '#111013',
    motif: 'balzanes',
    motifCouleur: '#F4F1EA',
  },
  { id: 'palomino', nom: 'Palomino', prix: 80, robe: '#E2B866', criniere: '#FFF6DC', motif: 'aucun' },
  {
    id: 'gris-pommele',
    nom: 'Gris pommelé',
    prix: 100,
    robe: '#AEB6BF',
    criniere: '#EEF1F4',
    motif: 'pommele',
    motifCouleur: '#7E8893',
  },
  {
    id: 'pie',
    nom: 'Pie',
    prix: 120,
    robe: '#F4F1EA',
    criniere: '#3B2A20',
    motif: 'pie',
    motifCouleur: '#6B4226',
  },
  {
    id: 'licorne',
    nom: 'Licorne arc-en-ciel',
    prix: 250,
    robe: '#FFFFFF',
    criniere: '#FF7AB6',
    motif: 'licorne',
    motifCouleur: '#FFD45C',
  },
];

export const ROBE_DE_BASE = 'alezan';
export const PREFIXE_ROBE = 'robe-';

export const itemIdRobe = (robeId: string) => `${PREFIXE_ROBE}${robeId}`;
export const robeParId = (id: string | undefined): RobeCheval => ROBES.find((r) => r.id === id) ?? ROBES[0]!;
/** Prix d'une robe à partir de l'id d'objet d'inventaire (`robe-<id>`), ou undefined. */
export function prixRobe(itemId: string): number | undefined {
  if (!itemId.startsWith(PREFIXE_ROBE)) return undefined;
  const r = ROBES.find((x) => itemIdRobe(x.id) === itemId);
  return r && r.prix > 0 ? r.prix : undefined;
}
/** La robe est-elle disponible pour ce profil (offerte ou achetée) ? */
export const possedeRobe = (robeId: string, inventaire: readonly string[]) =>
  robeParId(robeId).id === robeId &&
  (robeParId(robeId).prix === 0 || inventaire.includes(itemIdRobe(robeId)));
