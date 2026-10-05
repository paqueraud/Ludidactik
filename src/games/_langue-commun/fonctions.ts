/**
 * Labo des fonctions : une phrase (`meta.phrase`) découpée en groupes (`elements` de l'item
 * `classification`), et les manipulations syntaxiques du BO appliquées à un groupe :
 * supprimer, déplacer, encadrer par « c'est … qui », remplacer (si l'item fournit la phrase obtenue).
 * Fonctions purement mécaniques : le jeu montre la phrase transformée, l'enfant juge et conclut.
 */
import type { ClassificationItem, Item } from '@/content/schemas';
import { normalizeText } from '@/engine/answer';
import { majuscule } from './texte';

export interface Segment {
  texte: string;
  /** Index du groupe (élément de l'item) ou null pour le reste de la phrase (verbe, liaisons…). */
  groupe: number | null;
}

export interface PhraseLabo {
  item: ClassificationItem;
  phrase: string;
  segments: Segment[];
  /** Ponctuation finale (« . », « ! »…). */
  finale: string;
  /** Pour chaque groupe (même ordre que `item.elements`) : index du segment dans la phrase. */
  segmentDuGroupe: number[];
  /** Phrases obtenues en remplaçant un groupe (meta.remplacements : groupe → phrase). */
  remplacements: Record<string, string>;
}

const bas = (s: string) => s.toLocaleLowerCase('fr');

/**
 * Mots-outils qui perdent leur majuscule quand on déplace le groupe qui commençait la phrase.
 * Un autre mot (nom propre probable : « Léo ») garde sa majuscule.
 */
const MOTS_OUTILS = new Set(
  (
    "le la les l un une des du de d au aux ce cet cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs " +
    "je j tu il elle on nous vous ils elles chaque tout toute tous toutes quelques plusieurs aucun aucune " +
    "dans sur sous avec sans pendant depuis après avant à en par pour chez vers devant derrière entre près loin " +
    "hier demain aujourd soudain ensuite puis enfin alors parfois souvent toujours jamais autrefois maintenant " +
    "tôt tard ici là quand lorsque comme parce puisque mais et ou donc car dès cela ceci celui celle ceux celles"
  ).split(' '),
);

function premierMot(s: string): string {
  return bas(s.split(/[\s'’-]/)[0] ?? '');
}

/** Retire la majuscule d'un groupe déplacé (sauf nom propre probable). */
export function minusculeSiOutil(groupe: string): string {
  return MOTS_OUTILS.has(premierMot(groupe)) ? groupe.charAt(0).toLocaleLowerCase('fr') + groupe.slice(1) : groupe;
}

/** Recolle des morceaux de phrase proprement (espaces, virgules orphelines). */
export function recoller(morceaux: string[]): string {
  return normalizeText(morceaux.filter((m) => m.trim()).join(' '))
    .replace(/^[,;:\s]+/, '')
    .replace(/[,;:\s]+$/, '')
    .replace(/,\s*,/g, ',')
    .replace(/\s+,/g, ',')
    .replace(/(['’])\s+/g, '$1');
}

/** Découpe la phrase de l'item en segments (groupes de l'item + reste). null si un groupe est introuvable. */
export function versLabo(item: Item): PhraseLabo | null {
  if (item.kind !== 'classification') return null;
  const brute = item.meta?.phrase;
  if (typeof brute !== 'string' || !brute.trim()) return null;
  const nettoyee = normalizeText(brute);
  const m = /\s*([.!?…]+)$/.exec(nettoyee);
  const finale = m?.[1] ?? '.';
  const phrase = m ? nettoyee.slice(0, m.index) : nettoyee;
  const minus = bas(phrase);

  // Position de chaque groupe (premier emplacement libre, sur des limites de mots)
  const plages: { debut: number; fin: number; groupe: number }[] = [];
  const libre = (d: number, f: number) => plages.every((p) => f <= p.debut || d >= p.fin);
  const limite = (i: number) => i <= 0 || i >= phrase.length || /[\s,;:'’()«»"-]/.test(phrase[i - 1]! + phrase[i]!);
  for (let g = 0; g < item.elements.length; g++) {
    const label = bas(normalizeText(item.elements[g]!.label));
    let depuis = 0;
    let trouve = -1;
    while (depuis <= minus.length) {
      const i = minus.indexOf(label, depuis);
      if (i < 0) break;
      const f = i + label.length;
      if (limite(i) && limite(f) && libre(i, f)) {
        trouve = i;
        break;
      }
      depuis = i + 1;
    }
    if (trouve < 0) return null;
    plages.push({ debut: trouve, fin: trouve + label.length, groupe: g });
  }
  plages.sort((a, b) => a.debut - b.debut);

  const segments: Segment[] = [];
  let pos = 0;
  for (const p of plages) {
    const avant = phrase.slice(pos, p.debut).trim();
    if (avant) segments.push({ texte: avant, groupe: null });
    segments.push({ texte: phrase.slice(p.debut, p.fin), groupe: p.groupe });
    pos = p.fin;
  }
  const reste = phrase.slice(pos).trim();
  if (reste) segments.push({ texte: reste, groupe: null });

  const segmentDuGroupe = item.elements.map((_, g) => segments.findIndex((s) => s.groupe === g));
  const rempl = item.meta?.remplacements;
  const remplacements: Record<string, string> = {};
  if (rempl && typeof rempl === 'object')
    for (const [k, v] of Object.entries(rempl as Record<string, unknown>))
      if (typeof v === 'string' && v.trim()) remplacements[bas(normalizeText(k))] = v.trim();

  return { item, phrase, segments, finale, segmentDuGroupe, remplacements };
}

export type Manipulation = 'supprimer' | 'deplacer' | 'encadrer' | 'remplacer';

/** Phrase de départ, telle qu'affichée. */
export const phraseInitiale = (p: PhraseLabo) => `${p.phrase}${p.finale}`;

/** Texte des segments sauf le groupe visé, le premier mot de la phrase restante sans majuscule si besoin. */
function sansGroupe(p: PhraseLabo, g: number): string[] {
  const idx = p.segmentDuGroupe[g]!;
  return p.segments
    .filter((_, i) => i !== idx)
    .map((s, i) => (i === 0 && idx !== 0 ? minusculeSiOutil(s.texte) : s.texte));
}

/**
 * Applique une manipulation au groupe `g`. Renvoie la phrase obtenue (avec ponctuation finale),
 * ou null si la manipulation n'est pas possible (remplacement non fourni par l'item).
 */
export function manipuler(p: PhraseLabo, g: number, manip: Manipulation): string | null {
  const idx = p.segmentDuGroupe[g];
  if (idx === undefined || idx < 0) return null;
  const groupe = p.segments[idx]!.texte;
  switch (manip) {
    case 'supprimer': {
      const reste = p.segments.filter((_, i) => i !== idx).map((s) => s.texte);
      return `${majuscule(recoller(reste))}${p.finale}`;
    }
    case 'deplacer': {
      const reste = p.segments.filter((_, i) => i !== idx).map((s) => s.texte);
      if (idx === 0) {
        // le groupe en tête part à la fin
        return `${majuscule(recoller(reste))} ${minusculeSiOutil(groupe)}${p.finale}`.replace(/\s+([.!?…])$/, '$1');
      }
      const debut = reste.map((t, i) => (i === 0 ? minusculeSiOutil(t) : t));
      return `${majuscule(groupe)}, ${recoller(debut)}${p.finale}`;
    }
    case 'encadrer': {
      // Un groupe détaché en tête (« Ce matin, ») reste devant : « Ce matin, c'est les enfants qui… »
      const virgule = p.segments.findIndex((s) => s.groupe === null && s.texte.trim() === ',');
      if (virgule > 0 && virgule < idx) {
        const tete = recoller(p.segments.slice(0, virgule).map((s) => s.texte));
        const suite = p.segments.filter((_, i) => i > virgule && i !== idx).map((s) => s.texte);
        return `${tete}, c’est ${groupe} qui ${recoller(suite)}${p.finale}`;
      }
      const reste = sansGroupe(p, g);
      const g2 = idx === 0 ? minusculeSiOutil(groupe) : groupe;
      return `C’est ${g2} qui ${recoller(reste)}${p.finale}`;
    }
    case 'remplacer':
      return p.remplacements[bas(normalizeText(groupe))] ?? null;
  }
}
