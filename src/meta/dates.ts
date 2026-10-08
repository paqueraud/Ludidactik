/** Dates locales du méta-jeu : jour « AAAA-MM-JJ », semaine qui commence le lundi. */
export { dayKey } from '@/services/screenTime';

/** Date locale (minuit) d'un jour « AAAA-MM-JJ ». */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

/** Jour décalé de `n` jours (n négatif = dans le passé). */
export function addDays(day: string, n: number): string {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Lundi (jour « AAAA-MM-JJ ») de la semaine du jour donné. */
export function lundiDe(day: string): string {
  const dow = parseDay(day).getDay(); // 0 = dimanche
  return addDays(day, -((dow + 6) % 7));
}

/** Début (lundi 0 h, heure locale) de la semaine contenant `when` : le classement repart de zéro. */
export function debutSemaine(when: number | Date = Date.now()): number {
  const d = new Date(when);
  const dow = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow).getTime();
}

/** Samedi ou dimanche : le défi bonus « Boss » est ouvert. */
export function estWeekEnd(day: string): boolean {
  const dow = parseDay(day).getDay();
  return dow === 0 || dow === 6;
}

/** Graine numérique stable d'une chaîne (FNV-1a 32 bits). */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Période scolaire actuelle (P1 rentrée → Toussaint … P5 mai-juin). */
export function periodeActuelle(d = new Date()): number {
  const m = d.getMonth() + 1;
  if (m >= 9 && m <= 10) return 1;
  if (m >= 11) return 2;
  if (m <= 2) return 3;
  if (m <= 4) return 4;
  return 5;
}
