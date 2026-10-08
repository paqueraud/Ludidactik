/**
 * Contenu de l'application, chargé **par classe, à la demande** : un enfant de CM2 ne télécharge
 * ni le curriculum ni les générateurs du CE1 (et inversement).
 *
 * - `chargerClasses(['CM2'])` charge les JSON de data/ de la classe (+ fichiers communs), les valide
 *   par zod, et charge les modules de contenu (`modules/`) correspondants.
 * - `useContenuPret(classes)` (React) déclenche le chargement et indique quand c'est prêt.
 * - `content`, `getLesson`, `lessonsOf`… restent synchrones : ils voient tout ce qui est chargé.
 *   Les écrans sont protégés par `ContenuRequis` (src/app) qui attend le chargement.
 */
import { useEffect, useSyncExternalStore } from 'react';
import type { ContentIndex, ContentIssue, RawFiles } from './parse';
import { type ContentModule, mergeModules, remplacerContenuCharge } from './registry';
import type { Classe, Lesson, Matiere } from './schemas';

// (copie de `CLASSES` de schemas.ts : importer schemas.ts ferait entrer zod dans le JS initial)
const CLASSES: readonly Classe[] = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];

/* ------------------------------------------------------------------ */
/* Sources paresseuses                                                 */
/* ------------------------------------------------------------------ */

const DONNEES = import.meta.glob('/data/**/*.json', { import: 'default' });
const MODULES = import.meta.glob<ContentModule>(
  ['./modules/*.ts', './modules/*/index.ts', '!./modules/index.ts', '!./modules/**/*.test.ts'],
  { import: 'contenu' },
);

/** Classe d'un fichier d'après son nom (« ce1_mots.json », « maths-cm2/index.ts ») ; null = commun. */
function classeDe(chemin: string): Classe | null {
  const m = /(?:^|[/_.-])(cp|ce1|ce2|cm1|cm2)(?=[/_.-]|$)/i.exec(chemin);
  return m ? (m[1]!.toUpperCase() as Classe) : null;
}

const concerne = (chemin: string, classes: Set<Classe>) => {
  const c = classeDe(chemin);
  return c === null || classes.has(c);
};

/** Ordre de fusion identique à `modules/index.ts` (un module plus loin l'emporte sur un même type d'item). */
const ORDRE_MODULES = ['calcul-mental', 'maths', 'conjugaison', 'francais', 'monde'];
const rangModule = (chemin: string) => {
  const nom = chemin.replace(/^\.\/modules\//, '');
  const i = ORDRE_MODULES.findIndex((p) => nom.startsWith(p));
  return i < 0 ? ORDRE_MODULES.length : i;
};

/* ------------------------------------------------------------------ */
/* État                                                                */
/* ------------------------------------------------------------------ */

/** Index du contenu chargé (objet stable, rempli en place à chaque chargement). */
export const content: ContentIndex = {
  curricula: {},
  lessons: new Map(),
  wordLists: [],
  questions: [],
  sentences: [],
};

/** Classes livrées (d'après les fichiers data/curriculum/*.json, sans les charger). */
export const CLASSES_ACTIVES: Classe[] = Object.keys(DONNEES)
  .filter((k) => k.startsWith('/data/curriculum/'))
  .map((k) => classeDe(k))
  .filter((c): c is Classe => !!c && CLASSES.includes(c))
  .sort();

const fichiers: RawFiles = {};
const modulesCharges = new Map<string, ContentModule>();
const chargees = new Set<Classe>();
const enCours = new Map<Classe, Promise<void>>();
const erreursVues = new Set<string>();
let version = 0;
let essai = 0;
const erreurs = new Map<string, unknown>();
const abonnes = new Set<() => void>();

function notifier() {
  version++;
  for (const f of abonnes) f();
}

/** zod (validation) n'est téléchargé qu'au premier chargement de contenu. */
async function reconstruire() {
  const { parseContent } = await import('./parse');
  const { index, issues } = parseContent(fichiers);
  Object.assign(content, index);
  const nouvelles = issues.filter(
    (i: ContentIssue) => i.severity === 'erreur' && !erreursVues.has(`${i.file}|${i.message}`),
  );
  for (const i of nouvelles) erreursVues.add(`${i.file}|${i.message}`);
  if (nouvelles.length) console.error('[contenu] erreurs de validation :', nouvelles);
  const tries = [...modulesCharges.entries()]
    .sort(([a], [b]) => rangModule(a) - rangModule(b) || a.localeCompare(b))
    .map(([, m]) => m);
  remplacerContenuCharge(mergeModules(...tries));
}

async function chargerUne(classe: Classe): Promise<void> {
  const cible = new Set([classe]);
  const donnees = Object.entries(DONNEES).filter(([k]) => concerne(k, cible) && !(k.slice(1) in fichiers));
  const modules = Object.entries(MODULES).filter(([k]) => concerne(k, cible) && !modulesCharges.has(k));
  const [d, m] = await Promise.all([
    Promise.all(donnees.map(async ([k, load]) => [k.slice(1), await load()] as const)),
    Promise.all(modules.map(async ([k, load]) => [k, await load()] as const)),
  ]);
  for (const [k, v] of d) fichiers[k] = v;
  for (const [k, v] of m) modulesCharges.set(k, v);
  await reconstruire();
  chargees.add(classe);
  notifier();
}

export const contenuCharge = (classes: readonly Classe[]) => classes.every((c) => chargees.has(c));

/** Charge le contenu de ces classes (idempotent ; les chargements concurrents sont mutualisés). */
export function chargerClasses(classes: readonly Classe[]): Promise<void> {
  return Promise.all(
    classes
      .filter((c) => CLASSES_ACTIVES.includes(c) && !chargees.has(c))
      .map((c) => {
        let p = enCours.get(c);
        if (!p) {
          p = chargerUne(c).finally(() => enCours.delete(c));
          enCours.set(c, p);
        }
        return p;
      }),
  ).then(() => undefined);
}

/** Tout le contenu (espace parents, labo, tests). */
export const chargerTout = () => chargerClasses(CLASSES_ACTIVES);

const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

/**
 * Hook : charge le contenu des classes demandées. Renvoie `true` quand il est prêt,
 * ou l'erreur de chargement (ex. hors ligne avant la mise en cache).
 */
export function useContenuPret(classes: readonly Classe[]): { pret: boolean; erreur: unknown } {
  useSyncExternalStore(abonner, () => version);
  const tentative = useSyncExternalStore(abonner, () => essai);
  const cle = [...classes].sort().join(',');
  const pret = contenuCharge(classes);
  const erreur = erreurs.get(cle);
  useEffect(() => {
    if (!cle) return;
    const liste = cle.split(',') as Classe[];
    if (contenuCharge(liste)) return;
    erreurs.delete(cle);
    chargerClasses(liste).catch((e: unknown) => {
      erreurs.set(cle, e);
      notifier();
    });
  }, [cle, tentative]);
  return { pret, erreur };
}
/** Relance les chargements en échec (bouton « Réessayer »). */
export function reessayerChargement() {
  erreurs.clear();
  essai++;
  notifier();
}

/* ------------------------------------------------------------------ */
/* API de lecture (inchangée)                                          */
/* ------------------------------------------------------------------ */

/** Programme histoire-géographie / sciences choisi par le parent. */
export type ProgrammeHG = '2020' | '2026';
const MATIERES_HG: Matiere[] = ['histoire', 'geographie', 'sciences', 'questionner_le_monde'];

export function lessonVisible(l: Lesson, programmeHG: ProgrammeHG): boolean {
  if (!MATIERES_HG.includes(l.matiere)) return true;
  if (l.programme === '2020' || l.programme === '2026') return l.programme === programmeHG;
  return true;
}

export function lessonsOf(classe: Classe, programmeHG: ProgrammeHG, matiere?: Matiere): Lesson[] {
  return (content.curricula[classe]?.lecons ?? []).filter(
    (l) => (!matiere || l.matiere === matiere) && lessonVisible(l, programmeHG),
  );
}

export function matieresOf(classe: Classe, programmeHG: ProgrammeHG): Matiere[] {
  const seen: Matiere[] = [];
  for (const l of content.curricula[classe]?.lecons ?? [])
    if (!seen.includes(l.matiere) && lessonVisible(l, programmeHG)) seen.push(l.matiere);
  return seen;
}

export const getLesson = (id: string) => content.lessons.get(id);

/** Classe d'une leçon d'après son identifiant (« CM2.MATHS… » → CM2), sans charger le contenu. */
export function classeDeLecon(id: string): Classe | null {
  const c = id.split('.')[0]?.toUpperCase() as Classe | undefined;
  return c && CLASSES.includes(c) ? c : null;
}
