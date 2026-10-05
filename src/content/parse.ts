/**
 * Analyse et indexation du contenu : fonctions pures, utilisées à la fois par l'application
 * (fichiers importés par Vite) et par `npm run validate:content` (fichiers lus sur disque).
 */
import type { z } from 'zod';
import { CONTENU } from './modules';
import {
  type Classe,
  type Curriculum,
  type DictationSentence,
  CurriculumSchema,
  type Lesson,
  type Question,
  QuestionFileSchema,
  ReadingFileSchema,
  type WordList,
  WordListFileSchema,
} from './schemas';

export interface ContentIndex {
  curricula: Partial<Record<Classe, Curriculum>>;
  lessons: Map<string, Lesson>;
  wordLists: WordList[];
  questions: Question[];
  /** Phrases de dictée, par classe. */
  sentences: (DictationSentence & { classe: Classe })[];
}

export interface ContentIssue {
  file: string;
  severity: 'erreur' | 'avertissement';
  message: string;
}

/** Fichier brut : chemin relatif à la racine (« data/curriculum/ce1.json ») → JSON. */
export type RawFiles = Record<string, unknown>;

function formatZod(file: string, err: z.ZodError): ContentIssue[] {
  return err.issues.map((i) => ({ file, severity: 'erreur', message: `${i.path.join('.')} : ${i.message}` }));
}

export function parseContent(files: RawFiles): { index: ContentIndex; issues: ContentIssue[] } {
  const issues: ContentIssue[] = [];
  const index: ContentIndex = {
    curricula: {},
    lessons: new Map(),
    wordLists: [],
    questions: [],
    sentences: [],
  };

  for (const [file, raw] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    if (file.startsWith('data/curriculum/')) {
      const r = CurriculumSchema.safeParse(raw);
      if (!r.success) issues.push(...formatZod(file, r.error));
      else {
        index.curricula[r.data.classe] = r.data;
        for (const l of r.data.lecons) index.lessons.set(l.id, l);
      }
    } else if (file.startsWith('data/dictees/')) {
      const r = WordListFileSchema.safeParse(raw);
      if (!r.success) issues.push(...formatZod(file, r.error));
      else {
        index.wordLists.push(...r.data.listes);
        index.sentences.push(...r.data.phrasesDictee.map((p) => ({ ...p, classe: r.data.classe })));
      }
    } else if (file.startsWith('data/histoire/') || file.startsWith('data/questions/')) {
      const r = QuestionFileSchema.safeParse(raw);
      if (!r.success) issues.push(...formatZod(file, r.error));
      else index.questions.push(...r.data.questions);
    } else if (file.startsWith('data/lecture/')) {
      const r = ReadingFileSchema.safeParse(raw);
      if (!r.success) issues.push(...formatZod(file, r.error));
    } else if (file.endsWith('.json')) {
      issues.push({ file, severity: 'avertissement', message: 'fichier non reconnu (ignoré)' });
    }
  }

  issues.push(...crossCheck(index, files));
  return { index, issues };
}

/** Vérifications croisées : références entre fichiers, générateurs, rappels manquants. */
function crossCheck(index: ContentIndex, files: RawFiles): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const l of index.lessons.values()) {
    const file = `data/curriculum/${l.classe.toLowerCase()}.json`;
    const jouable =
      !!CONTENU[l.id] ||
      l.source.kind === 'parents' ||
      index.wordLists.some((w) => w.lessonId === l.id) ||
      index.questions.some((q) => q.lessonId === l.id);
    if (!jouable)
      issues.push({ file, severity: 'avertissement', message: `${l.id} : pas encore de contenu jouable` });
    for (const id of Object.keys(CONTENU))
      if (!index.lessons.has(id) && l === [...index.lessons.values()][0])
        issues.push({
          file: 'src/content/modules',
          severity: 'erreur',
          message: `module de contenu pour une leçon inconnue : ${id}`,
        });
    if (l.source.kind === 'static' && !(l.source.file in files))
      issues.push({ file, severity: 'erreur', message: `${l.id} : fichier source absent ${l.source.file}` });
    if (l.rappel.startsWith('TODO'))
      issues.push({ file, severity: 'avertissement', message: `${l.id} : rappel à rédiger` });
  }
  for (const w of index.wordLists)
    if (!index.lessons.has(w.lessonId))
      issues.push({
        file: 'data/dictees',
        severity: 'erreur',
        message: `liste ${w.id} : leçon inconnue ${w.lessonId}`,
      });
  for (const q of index.questions)
    if (!index.lessons.has(q.lessonId))
      issues.push({
        file: 'data/questions',
        severity: 'erreur',
        message: `question ${q.id} : leçon inconnue ${q.lessonId}`,
      });
  return issues;
}
