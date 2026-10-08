/**
 * Utilitaires partagés par les jeux « nombres et calcul » (Ninja, Fusée, Robot, Perroquet, Bâtisseur,
 * Funambule, Bataille navale, Crocodiles, Compte est bon, Attrape-Bulles).
 * Le dossier commence par « _ » : il n'est pas découvert comme un jeu par le registre.
 * Aucun contenu pédagogique ici : uniquement de la mécanique (tirage, formatage, boucle d'animation).
 */
import { useEffect, useMemo, useRef } from 'react';
import { numericDistractors } from '@/content/adapters';
import type { ItemStream } from '@/content/provider';
import type { Item, NumericItem } from '@/content/schemas';
import { formatNumber } from '@/engine/answer';
import { type Rng, createRng } from '@/engine/rng';
import { itemSuivant } from '../_kit/session';

/**
 * Tire l'item suivant qui satisfait `ok` (le Labo et certains flux générés ne filtrent pas).
 * Renvoie null si aucun item convenable n'a été trouvé après `essais` tirages.
 */
export function tirer<T extends Item>(
  stream: ItemStream,
  target: number,
  ok: (it: Item) => it is T,
  essais = 30,
): T | null {
  for (let i = 0; i < essais; i++) {
    const it = itemSuivant(stream, target);
    if (!it) return null;
    if (ok(it)) return it;
  }
  return null;
}

/** Garde de type « item numérique ». */
export const estNumerique = (it: Item): it is NumericItem => it.kind === 'numeric_answer';

/** Nombre prêt à être lu à voix haute (« 3 virgule 5 », sans espace insécable). */
export function direNombre(n: number): string {
  return formatNumber(n)
    .replace(/[\s  ]/g, '')
    .replace(',', ' virgule ')
    .replace('−', 'moins ');
}

/**
 * Réponses proposées pour un item numérique : la bonne + des erreurs plausibles d'enfant,
 * sans doublon d'écriture. Renvoie les écritures et l'index de la bonne réponse.
 */
export function choixNumeriques(
  item: NumericItem,
  rng: Rng,
  n: number,
): { choix: string[]; bonne: number; valeurs: number[] } {
  const bonne = item.answer;
  const valeurs = new Set<number>([bonne]);
  for (const d of numericDistractors(item, rng, n + 4)) {
    if (valeurs.size >= n) break;
    // Pas de nombre à virgule comme piège quand la réponse est entière (CE1 : décimaux hors programme).
    if (item.decimals === 0 && !Number.isInteger(d)) continue;
    valeurs.add(d);
  }
  // Complète si besoin avec des voisins proches (petits résultats)
  const pas = item.decimals > 0 ? 10 ** -item.decimals : 1;
  let k = 2;
  while (valeurs.size < n) {
    const v = Math.round((bonne + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * pas) * 1000) / 1000;
    if (v >= 0) valeurs.add(v);
    k++;
  }
  const liste = rng.shuffle([...valeurs]);
  const choix = liste.map((v) => formatNumber(v));
  return { choix, bonne: liste.indexOf(bonne), valeurs: liste };
}

/** Générateur aléatoire stable pour la durée de vie du composant. */
export function useRng(): Rng {
  return useMemo(() => createRng(Date.now() ^ Math.floor(Math.random() * 1e9)), []);
}

/**
 * Boucle d'animation : appelle `tick(dt)` à chaque image (dt en secondes, plafonné à 0,1 s),
 * uniquement quand `actif` est vrai (pause, correction, fin de partie → la boucle s'arrête).
 */
export function useBoucle(actif: boolean, tick: (dt: number) => void) {
  const ref = useRef(tick);
  ref.current = tick;
  useEffect(() => {
    if (!actif) return;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      // l'horodatage de requestAnimationFrame peut précéder performance.now() : jamais de dt négatif
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;
      ref.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [actif]);
}

/** Lettres des raccourcis clavier (A-F). */
export const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Index d'un raccourci clavier (A-F ou 1-6), -1 sinon. */
export function indexTouche(key: string, n: number): number {
  const i = LETTRES.findIndex((l) => l.toLowerCase() === key.toLowerCase());
  const j = /^[1-6]$/.test(key) ? Number(key) - 1 : -1;
  const k = i >= 0 ? i : j;
  return k >= 0 && k < n ? k : -1;
}

/** Vrai si l'événement clavier vient d'un champ de saisie (on ne capte pas les touches). */
export function dansUnChamp(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName);
}

/** Phrase de bravo variée (encouragements, aucun contenu pédagogique). */
export function bravo(rng: Rng): string {
  return rng.pick(['Bravo !', 'Super !', 'Génial !', 'Exactement !', 'Bien joué !', 'Parfait !']);
}
