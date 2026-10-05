/** Contenu de l'application : tous les JSON de data/, importés par Vite et validés par zod au démarrage. */
import { parseContent, type RawFiles } from './parse';
import type { Classe, Lesson, Matiere } from './schemas';

const modules = import.meta.glob('/data/**/*.json', { eager: true, import: 'default' });
const files: RawFiles = Object.fromEntries(
  Object.entries(modules).map(([k, v]) => [k.replace(/^\//, ''), v]),
);

const parsed = parseContent(files);
export const content = parsed.index;

const errors = parsed.issues.filter((i) => i.severity === 'erreur');
if (errors.length) console.error('[contenu] erreurs de validation :', errors);

/** Classes livrées (les autres s'affichent « bientôt »). */
export const CLASSES_ACTIVES: Classe[] = (Object.keys(content.curricula) as Classe[]).sort();

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
