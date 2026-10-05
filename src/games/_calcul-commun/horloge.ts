/**
 * Heure et durées (L'Horloger) : angles des aiguilles, écritures « 3 h 15 », analyse des items `duree`.
 * Fonctions pures.
 */
import type { ClockItem } from '@/content/schemas';

export interface Heure {
  h: number;
  m: number;
  s?: number;
}

/** Angles (degrés, 0 = midi, sens horaire) des trois aiguilles. */
export function angles({ h, m, s = 0 }: Heure) {
  return {
    heure: ((h % 12) * 30 + m * 0.5 + s / 120) % 360,
    minute: (m * 6 + s * 0.1) % 360,
    seconde: (s * 6) % 360,
  };
}

/** « 3 h 15 », « 15 h 05 », « 7 h », avec secondes : « 3 h 15 min 20 s ». */
export function formatHeure({ h, m, s }: Heure): string {
  if (s !== undefined && s > 0) return `${h} h ${String(m).padStart(2, '0')} min ${String(s).padStart(2, '0')} s`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/** « 45 min », « 1 h 15 min », « 2 h ». */
export function formatDuree(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

/** Lit une heure écrite : « 15 h 05 », « 3 h », « 3h15 », « 14:20 », « 3 h 15 min 20 s ». */
export function lireHeure(texte: string): Heure | null {
  const t = texte.replace(/\s+/g, ' ').trim().toLowerCase();
  let r = /^(\d{1,2}) ?(?:h|:) ?(\d{1,2})? ?(?:min)? ?(?:(\d{1,2}) ?s)?$/.exec(t);
  if (!r) r = /^(\d{1,2}) ?h$/.exec(t);
  if (!r) return null;
  const h = Number(r[1]);
  const m = r[2] ? Number(r[2]) : 0;
  const s = r[3] ? Number(r[3]) : undefined;
  if (h > 24 || m > 59 || (s ?? 0) > 59) return null;
  return s === undefined ? { h, m } : { h, m, s };
}

/** Lit une durée écrite : « 45 min », « 1 h 15 min », « 2 h ». Renvoie des minutes. */
export function lireDuree(texte: string): number | null {
  const t = texte.replace(/\s+/g, ' ').trim().toLowerCase();
  const r = /^(?:(\d+) ?h)? ?(?:(\d+) ?min)?$/.exec(t);
  if (!r || (!r[1] && !r[2])) return null;
  return Number(r[1] ?? 0) * 60 + Number(r[2] ?? 0);
}

export const enMinutes = ({ h, m }: Heure) => h * 60 + m;
export const depuisMinutes = (x: number): Heure => {
  const v = ((x % 1440) + 1440) % 1440;
  return { h: Math.floor(v / 60), m: v % 60 };
};

/** Même position des aiguilles (une horloge ne distingue pas 3 h et 15 h). */
export function memeCadran(a: Heure, b: Heure): boolean {
  return a.h % 12 === b.h % 12 && a.m === b.m && (a.s ?? 0) === (b.s ?? 0);
}

/** Même heure, en acceptant l'écriture du matin ou de l'après-midi. */
export const memeHeure = memeCadran;

export type ModeDuree = 'fin' | 'debut' | 'duree';

export interface AnalyseDuree {
  mode: ModeDuree;
  debut: Heure;
  fin: Heure;
  duree: number;
}

/**
 * Item « durée » : que cherche-t-on ? On compare `answerText` à l'heure de fin (heure + durée),
 * à l'heure de début (heure − durée) et à la durée elle-même.
 */
export function analyserDuree(item: ClockItem): AnalyseDuree | null {
  if (item.task !== 'duree' || item.durationMinutes === undefined) return null;
  const d = item.durationMinutes;
  const ici: Heure = { h: item.hours, m: item.minutes };
  const texte = item.answerText;
  const commeDuree = /min/.test(texte) ? lireDuree(texte) : null;
  const commeHeure = commeDuree === null ? lireHeure(texte) : null;
  const fin = depuisMinutes(enMinutes(ici) + d);
  const debut = depuisMinutes(enMinutes(ici) - d);
  if (commeHeure && memeCadran(commeHeure, fin)) return { mode: 'fin', debut: ici, fin: commeHeure, duree: d };
  if (commeHeure && memeCadran(commeHeure, debut))
    return { mode: 'debut', debut: commeHeure, fin: ici, duree: d };
  const dd = commeDuree ?? lireDuree(texte);
  if (dd !== null && dd === d) return { mode: 'duree', debut: ici, fin, duree: d };
  return null;
}

/** Item exploitable par l'Horloger. */
export function itemHorlogeValide(item: ClockItem): boolean {
  if (item.task === 'duree') return analyserDuree(item) !== null;
  return true;
}

/**
 * Propositions pour lire l'heure (niveau Facile) : la bonne + erreurs typiques
 * (aiguilles inversées, heure suivante, quart d'heure voisin).
 */
export function propositionsLecture(cible: Heure, nb = 4): string[] {
  const { h, m } = cible;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const cands: Heure[] = [];
  // aiguilles inversées : la grande montre l'heure, la petite les minutes
  if (m % 5 === 0) cands.push({ h: m === 0 ? 12 : m / 5, m: (h12 % 12) * 5 });
  cands.push({ h: h12 === 12 ? 1 : h12 + 1, m });
  cands.push({ h: h12, m: (m + 15) % 60 });
  cands.push({ h: h12 === 1 ? 12 : h12 - 1, m });
  cands.push({ h: h12, m: (m + 30) % 60 });
  const bonne = formatHeure({ h: h12, m, s: cible.s });
  const out = [bonne];
  for (const c of cands) {
    const t = formatHeure(c);
    if (!out.includes(t)) out.push(t);
    if (out.length >= nb) break;
  }
  return out;
}

/** Pas de réglage des minutes selon le niveau. */
export function arrondirMinutes(totalMinutes: number, pas: number): number {
  return Math.round(totalMinutes / pas) * pas;
}
