/**
 * Vacances scolaires (GAMIFICATION §4) : pendant les vacances, la flamme est gelée (elle ne s'éteint
 * pas et n'use pas les 2 gels de la semaine). Calendrier officiel 2026-2027 (métropole), arrêté publié
 * au Journal officiel en octobre 2025 ; recoupé avec plusieurs sources (vacances-scolaires.com, Onisep).
 *
 * Convention : `debut` = premier jour sans classe (le samedi, « fin des cours après la classe »),
 * `fin` = dernier jour de vacances (la veille de la reprise). Bornes incluses, jours « AAAA-MM-JJ ».
 */

export type Zone = 'A' | 'B' | 'C';
export type ZoneOuAucune = Zone | 'aucune';

export interface PeriodeVacances {
  nom: string;
  debut: string;
  fin: string;
}

export interface ReglageVacances {
  zone: ZoneOuAucune;
  /** Périodes ajoutées par le parent (vacances décalées, voyage, maladie…). */
  perso: PeriodeVacances[];
}

export const CLE_REGLAGE_VACANCES = 'vacances';
export const REGLAGE_VACANCES_DEFAUT: ReglageVacances = { zone: 'B', perso: [] };

export const ACADEMIES: Record<Zone, string> = {
  A: 'Besançon, Bordeaux, Clermont-Ferrand, Dijon, Grenoble, Limoges, Lyon, Poitiers',
  B: 'Aix-Marseille, Amiens, Lille, Nancy-Metz, Nantes, Nice, Normandie, Orléans-Tours, Reims, Rennes, Strasbourg',
  C: 'Créteil, Montpellier, Paris, Toulouse, Versailles',
};

/** Périodes communes aux trois zones (2026-2027). */
const COMMUNES: PeriodeVacances[] = [
  // Toussaint : fin des cours samedi 17 octobre 2026, reprise lundi 2 novembre 2026.
  { nom: 'Vacances de la Toussaint', debut: '2026-10-17', fin: '2026-11-01' },
  // Noël : fin des cours samedi 19 décembre 2026, reprise lundi 4 janvier 2027.
  { nom: 'Vacances de Noël', debut: '2026-12-19', fin: '2027-01-03' },
  // Pont de l'Ascension : jeudi 6 mai (férié) + vendredi 7 mai 2027 (pas de classe) + week-end.
  { nom: 'Pont de l’Ascension', debut: '2027-05-06', fin: '2027-05-09' },
  // Été : fin des cours samedi 3 juillet 2027. La date de la rentrée 2027 n'est pas encore fixée :
  // fin au 31 août « à vérifier » quand le calendrier 2027-2028 sera publié.
  { nom: 'Vacances d’été', debut: '2027-07-03', fin: '2027-08-31' },
];

/** Hiver et printemps, par zone (2027). */
const PAR_ZONE: Record<Zone, PeriodeVacances[]> = {
  A: [
    { nom: 'Vacances d’hiver', debut: '2027-02-13', fin: '2027-02-28' },
    { nom: 'Vacances de printemps', debut: '2027-04-10', fin: '2027-04-25' },
  ],
  B: [
    { nom: 'Vacances d’hiver', debut: '2027-02-20', fin: '2027-03-07' },
    { nom: 'Vacances de printemps', debut: '2027-04-17', fin: '2027-05-02' },
  ],
  C: [
    { nom: 'Vacances d’hiver', debut: '2027-02-06', fin: '2027-02-21' },
    { nom: 'Vacances de printemps', debut: '2027-04-03', fin: '2027-04-18' },
  ],
};

/** Périodes officielles d'une zone, dans l'ordre chronologique. */
export function vacancesOfficielles(zone: ZoneOuAucune): PeriodeVacances[] {
  if (zone === 'aucune') return [];
  return [...COMMUNES, ...PAR_ZONE[zone]].sort((a, b) => a.debut.localeCompare(b.debut));
}

/** Toutes les périodes applicables (officielles de la zone + personnalisées). */
export function periodesDe(reglage: ReglageVacances): PeriodeVacances[] {
  return [...vacancesOfficielles(reglage.zone), ...reglage.perso.filter((p) => p.debut <= p.fin)];
}

/** Période de vacances contenant ce jour (bornes incluses), ou null. */
export function periodeDuJour(day: string, reglage: ReglageVacances): PeriodeVacances | null {
  return periodesDe(reglage).find((p) => p.debut <= day && day <= p.fin) ?? null;
}

/** Prédicat « jour de vacances » pour le calcul de la flamme. */
export const estEnVacances =
  (reglage: ReglageVacances) =>
  (day: string): boolean =>
    periodeDuJour(day, reglage) !== null;

const JOUR_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Relit prudemment une valeur stockée (table `settings`) : retombe sur la zone B par défaut. */
export function normaliserReglage(valeur: unknown): ReglageVacances {
  const v = (valeur ?? {}) as Partial<ReglageVacances>;
  const zone: ZoneOuAucune = ['A', 'B', 'C', 'aucune'].includes(v.zone as string)
    ? (v.zone as ZoneOuAucune)
    : REGLAGE_VACANCES_DEFAUT.zone;
  const perso = Array.isArray(v.perso)
    ? v.perso.filter(
        (p): p is PeriodeVacances =>
          !!p && JOUR_RE.test(p.debut) && JOUR_RE.test(p.fin) && typeof p.nom === 'string',
      )
    : [];
  return { zone, perso };
}
