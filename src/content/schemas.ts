import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Énumérations communes                                               */
/* ------------------------------------------------------------------ */

export const CLASSES = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] as const;
export const ClasseSchema = z.enum(CLASSES);
export type Classe = z.infer<typeof ClasseSchema>;

export const MATIERES = [
  'francais',
  'maths',
  'questionner_le_monde',
  'histoire',
  'geographie',
  'sciences',
  'emc',
  'anglais',
] as const;
export const MatiereSchema = z.enum(MATIERES);
export type Matiere = z.infer<typeof MatiereSchema>;

export const LEVELS = ['facile', 'normal', 'plus_loin'] as const;
export const LevelSchema = z.enum(LEVELS);
export type Level = z.infer<typeof LevelSchema>;

export const MODALITIES = ['ecrire', 'ecouter', 'parler', 'regarder', 'manipuler'] as const;
export const ModalitySchema = z.enum(MODALITIES);
export type Modality = z.infer<typeof ModalitySchema>;

export const ITEM_KINDS = [
  'numeric_answer',
  'spelling_word',
  'mcq',
  'true_false',
  'ordering',
  'classification',
  'pairing',
  'fill_blank',
  'number_line',
  'visual_fraction',
  'clock',
  'money',
  'geometry_shape',
  'map_point',
  'read_aloud',
  'oral_answer',
  'bar_model',
] as const;
export const ItemKindSchema = z.enum(ITEM_KINDS);
export type ItemKind = z.infer<typeof ItemKindSchema>;

/** « en_vigueur » : version du programme encore à confirmer (EMC, langues vivantes). */
export const ProgrammeSchema = z.enum(['2020', '2024', '2025', '2026', 'en_vigueur']);
export type Programme = z.infer<typeof ProgrammeSchema>;

const Periode = z.number().int().min(1).max(5);

/* ------------------------------------------------------------------ */
/* Curriculum                                                          */
/* ------------------------------------------------------------------ */

export const LessonSourceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('generator'),
    /** « TODO:… » = générateur pas encore écrit (leçon affichée « Bientôt »). */
    generator: z.string().min(1),
    params: z.record(LevelSchema, z.unknown()).optional(),
  }),
  z.object({
    kind: z.literal('static'),
    file: z.string().regex(/^data\/.+\.json$/),
    filter: z.record(z.string(), z.unknown()).optional(),
  }),
  /** Listes de mots saisies par les parents (Dexie). */
  z.object({ kind: z.literal('parents') }),
]);
export type LessonSource = z.infer<typeof LessonSourceSchema>;

export const LessonSchema = z
  .object({
    id: z
      .string()
      .regex(/^(CP|CE1|CE2|CM1|CM2)\.[A-Z0-9_]+(\.[A-Z0-9_]+)*$/, 'identifiant de leçon invalide'),
    classe: ClasseSchema,
    matiere: MatiereSchema,
    domaine: z.string().min(1),
    titre: z.string().min(1),
    programme: ProgrammeSchema,
    boRef: z.string().min(10),
    periodes: z.array(Periode).min(1),
    niveaux: z.object({ facile: z.string().min(1), normal: z.string().min(1), plus_loin: z.string().min(1) }),
    itemKinds: z.array(ItemKindSchema).min(1),
    jeuxSuggeres: z.array(z.string()).default([]),
    source: LessonSourceSchema,
    rappel: z.string().min(1),
    contenus: z.string().optional(),
  })
  .strict()
  .refine((l) => l.id.startsWith(`${l.classe}.`), { message: 'le préfixe de l’id doit être la classe' });
export type Lesson = z.infer<typeof LessonSchema>;

export const CurriculumSchema = z
  .object({
    $comment: z.string().optional(),
    classe: ClasseSchema,
    anneeScolaire: z.string().regex(/^\d{4}-\d{4}$/),
    lecons: z.array(LessonSchema).min(1),
  })
  .strict()
  .superRefine((c, ctx) => {
    const seen = new Set<string>();
    c.lecons.forEach((l, i) => {
      if (seen.has(l.id))
        ctx.addIssue({ code: 'custom', message: `id en double : ${l.id}`, path: ['lecons', i, 'id'] });
      seen.add(l.id);
      if (l.classe !== c.classe)
        ctx.addIssue({
          code: 'custom',
          message: `classe ${l.classe} ≠ ${c.classe}`,
          path: ['lecons', i, 'classe'],
        });
    });
  });
export type Curriculum = z.infer<typeof CurriculumSchema>;

/* ------------------------------------------------------------------ */
/* Listes de mots (dictée)                                             */
/* ------------------------------------------------------------------ */

export const WordEntrySchema = z
  .object({
    mot: z.string().min(1),
    phrase: z.string().min(3).optional(),
    classeGram: z.string().optional(),
    /** Courte définition d’enfant (mots croisés, bonhomme de neige). */
    definition: z.string().min(3).optional(),
  })
  .strict();
export type WordEntry = z.infer<typeof WordEntrySchema>;

export const WordListSchema = z
  .object({
    id: z.string().min(1),
    titre: z.string().min(1),
    periodes: z.array(Periode).min(1),
    theme: z.string().min(1),
    niveau: LevelSchema,
    lessonId: z.string().min(1),
    mots: z.array(WordEntrySchema).min(4),
  })
  .strict();
export type WordList = z.infer<typeof WordListSchema>;

export const DictationSentenceSchema = z
  .object({ phrase: z.string().min(5), niveau: LevelSchema, notions: z.array(z.string()).default([]) })
  .strict();
export type DictationSentence = z.infer<typeof DictationSentenceSchema>;

export const WordListFileSchema = z
  .object({
    $comment: z.string().optional(),
    classe: ClasseSchema,
    listes: z.array(WordListSchema).min(1),
    /** Phrases de dictée (mode « dictée de phrases » des jeux d'orthographe). */
    phrasesDictee: z.array(DictationSentenceSchema).default([]),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Banques de questions (histoire, questionner le monde, EMC…)         */
/* ------------------------------------------------------------------ */

export const QuestionSchema = z
  .object({
    id: z.string().min(1),
    lessonId: z.string().min(1),
    programme: ProgrammeSchema,
    niveau: LevelSchema,
    type: z.enum(['mcq', 'true_false']),
    question: z.string().min(5),
    choix: z.array(z.string().min(1)).min(2).max(4),
    /** Index de la bonne réponse AVANT mélange. */
    bonne: z.number().int().min(0),
    explication: z.string().min(5),
    /** false = thème sensible : jamais joué dans la Guillotine. */
    guillotine: z.boolean(),
  })
  .strict()
  .refine((q) => q.bonne < q.choix.length, { message: 'bonne hors des choix' })
  .refine((q) => new Set(q.choix).size === q.choix.length, { message: 'choix en double' });
export type Question = z.infer<typeof QuestionSchema>;

export const QuestionFileSchema = z
  .object({ $comment: z.string().optional(), questions: z.array(QuestionSchema).min(1) })
  .strict()
  .superRefine((f, ctx) => {
    const seen = new Set<string>();
    f.questions.forEach((q, i) => {
      if (seen.has(q.id))
        ctx.addIssue({ code: 'custom', message: `id en double : ${q.id}`, path: ['questions', i] });
      seen.add(q.id);
    });
  });

/* ------------------------------------------------------------------ */
/* Textes de lecture                                                   */
/* ------------------------------------------------------------------ */

export const ReadingTextSchema = z
  .object({
    id: z.string().min(1),
    classe: ClasseSchema,
    niveau: LevelSchema,
    titre: z.string().min(1),
    texte: z.string().min(20),
    nbMots: z.number().int().positive(),
    questions: z
      .array(
        z.union([
          z
            .object({
              type: z.literal('mcq'),
              question: z.string().min(5),
              choix: z.array(z.string()).min(2).max(4),
              bonne: z.number().int().min(0),
              /** Phrase du texte qui justifie la réponse (absente pour une question de vocabulaire). */
              preuve: z.string().min(1).optional(),
              notion: z.string().optional(),
            })
            .strict()
            .refine((q) => q.bonne < q.choix.length, { message: 'bonne hors des choix' }),
          z
            .object({
              type: z.literal('ordering'),
              question: z.string().min(5),
              elements: z.array(z.string()).min(2),
            })
            .strict(),
        ]),
      )
      .min(1),
  })
  .strict();
export const ReadingFileSchema = z
  .object({ $comment: z.string().optional(), textes: z.array(ReadingTextSchema).min(1) })
  .strict();

/* Items : voir items.ts (contrat contenu ↔ jeux) */
export * from './items';
