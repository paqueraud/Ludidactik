/**
 * Anglais CE1 (langues vivantes cycle 2 ; programme LVER BO n°12 du 19/03/2026, date d'application à
 * confirmer) : saluer et se présenter, nombres, couleurs, animaux, corps (Simon says), jours, mois et
 * météo, famille, vêtements et nourriture. Orthographe et voix britanniques (colour, grey, trousers, mum).
 *
 * Formats (Jacques a dit) : `pairing` mot anglais ↔ emoji (`meta.consigne` = modèle de consigne),
 * `mcq` avec `lang: 'en-GB'` (`spoken` = ce que dit la voix anglaise), `oral_answer` en-GB
 * (`accepted` = variantes), `true_false` (énoncé en français, lu en français).
 */
import type { Rng } from '@/engine/rng';
import type { ContentModule, GenContext, ItemGen } from '../../registry';
import type { Item, ItemOf, Level } from '../../schemas';
import { DIFF, type Niv, type Q, hash, idDe, qcmItem } from './outils';

const EN = 'en-GB' as const;

interface Mot {
  en: string;
  fr: string;
  n: Niv;
  img?: string;
  /** Consigne dite par Simon si différente du mot (« touch your nose »). */
  cmd?: string;
  /** Autres réponses orales acceptées. */
  acc?: string[];
  /** Nom commun : « a cat », « the cat » sont acceptés à l'oral. */
  nom?: boolean;
}

interface Theme {
  id: string;
  mots: Mot[];
  /** Modèle de consigne de Jacques a dit (`{mot}`), sinon « touch the {mot} ». */
  consigne?: string;
}

interface Oral {
  n: Niv;
  id: string;
  prompt: string;
  spoken?: string;
  answer: string;
  acc: string[];
  ex: string;
}

/** Contenu particulier (phrases, dates…) tiré à la place d'un mot du vocabulaire. */
type Special = (level: Level, rng: Rng, ctx: GenContext) => Item | null;

interface Lecon {
  themes: Theme[];
  qcm?: Q[];
  oraux?: Oral[];
  /** Générateurs particuliers par type, et probabilité de les utiliser par niveau. */
  special?: Partial<Record<'mcq' | 'oral_answer' | 'true_false', Special>>;
  partSpecial?: Record<Level, number>;
}

const NIVEAUX_MOTS: Record<Level, Niv[]> = { facile: ['f'], normal: ['f', 'n'], plus_loin: ['f', 'n', 'p'] };
const motsDe = (t: Theme, level: Level) => t.mots.filter((m) => NIVEAUX_MOTS[level].includes(m.n));
const NB_CHOIX: Record<Level, number> = { facile: 3, normal: 4, plus_loin: 4 };
const difficulte = (level: Level) => (level === 'facile' ? 0.2 : level === 'normal' ? 0.5 : 0.8);

/** Thème au hasard parmi ceux qui ont au moins `min` mots au niveau (repli : le plus fourni). */
function themeAuHasard(l: Lecon, level: Level, rng: Rng, min: number, filtre?: (m: Mot) => boolean): Theme {
  const ok = l.themes.filter((t) => motsDe(t, level).filter(filtre ?? (() => true)).length >= min);
  if (ok.length) return rng.pick(ok);
  return [...l.themes].sort((a, b) => motsDe(b, level).length - motsDe(a, level).length)[0]!;
}

/** Distracteurs distincts tirés du même thème (mots du niveau d'abord). */
function autres(
  t: Theme,
  level: Level,
  rng: Rng,
  w: Mot,
  cle: (m: Mot) => string | undefined,
  k: number,
): string[] {
  const vus = new Set([cle(w)]);
  const out: string[] = [];
  for (const m of [...rng.shuffle(motsDe(t, level)), ...rng.shuffle(t.mots)]) {
    const v = cle(m);
    if (!v || vus.has(v)) continue;
    vus.add(v);
    out.push(v);
    if (out.length >= k) break;
  }
  return out;
}

const special = (
  l: Lecon,
  kind: 'mcq' | 'oral_answer' | 'true_false',
  level: Level,
  rng: Rng,
  ctx: GenContext,
) => {
  const f = l.special?.[kind];
  if (!f || !rng.chance(l.partSpecial?.[level] ?? 0)) return null;
  return f(level, rng, ctx);
};

/* ------------------------------------------------------------------ */
/* Générateurs communs                                                 */
/* ------------------------------------------------------------------ */

function genPaires(l: Lecon): ItemGen {
  return (level, rng, ctx) => {
    const nb = level === 'facile' ? 4 : 6;
    const t = themeAuHasard(l, level, rng, 3);
    const mots = motsDe(t, level);
    const avecImage = mots.filter((m) => m.img);
    const image = avecImage.length >= 3 && (avecImage.length === mots.length || rng.chance(0.7));
    const pool = rng.shuffle(image ? avecImage : mots);
    const pairs: { left: string; right: string }[] = [];
    for (const m of pool) {
      if (pairs.length >= nb) break;
      const left = image ? (m.cmd ?? m.en) : m.en;
      const right = image ? m.img! : m.fr;
      if (pairs.some((p) => p.left === left || p.right === right)) continue;
      pairs.push({ left, right });
    }
    const cle = pairs
      .map((p) => `${p.left}→${p.right}`)
      .sort()
      .join('|');
    const it: ItemOf<'pairing'> = {
      kind: 'pairing',
      id: idDe(ctx, 'paires', `${t.id}:${hash(cle)}`),
      lessonId: ctx.lesson.id,
      prompt: image
        ? 'Écoute le mot anglais et touche la bonne image.'
        : 'Associe chaque mot anglais à sa traduction.',
      pairs,
      relation: image ? 'mot anglais → image' : 'anglais → français',
      lang: EN,
      explication: pairs
        .map((p) => {
          const m = t.mots.find((x) => (x.cmd ?? x.en) === p.left || x.en === p.left)!;
          return `${m.en} = ${m.fr}`;
        })
        .join(', ')
        .concat('.'),
      difficulty: difficulte(level),
    };
    if (image && t.consigne) it.meta = { consigne: t.consigne };
    return it;
  };
}

function genQcm(l: Lecon): ItemGen {
  return (level, rng, ctx) => {
    const sp = special(l, 'mcq', level, rng, ctx);
    if (sp) return sp;
    const redige = (l.qcm ?? []).filter((q) => NIVEAUX_MOTS[level].includes(q.n));
    if (redige.length && rng.chance(0.25)) return qcmItem(rng.pick(redige), level, rng, ctx, true);
    const k = NB_CHOIX[level] - 1;
    const t = themeAuHasard(l, level, rng, k + 1);
    const w = rng.pick(motsDe(t, level));
    const ex = `« ${w.en} » veut dire « ${w.fr} ».`;
    const modes: ('image' | 'traduction' | 'lecture')[] = ['traduction', 'lecture'];
    const imgs = w.img ? autres(t, level, rng, w, (m) => m.img, k) : [];
    if (w.img && imgs.length >= Math.min(2, k)) modes.push('image', 'image');
    const mode = rng.pick(modes);
    let question: string;
    let good: string;
    let wrong: string[];
    let spoken: string | undefined;
    let image: string | undefined;
    if (mode === 'image') {
      question = 'Écoute et touche la bonne image.';
      spoken = w.cmd ?? w.en;
      good = w.img!;
      wrong = imgs;
    } else if (mode === 'traduction') {
      question = 'Écoute le mot anglais et choisis sa traduction.';
      spoken = w.en;
      good = w.fr;
      wrong = autres(t, level, rng, w, (m) => m.fr, k);
    } else {
      question = `Comment dit-on « ${w.fr} » en anglais ?`;
      image = w.img;
      good = w.en;
      wrong = autres(t, level, rng, w, (m) => m.en, k);
    }
    const choices = rng.shuffle([good, ...wrong]);
    const it: ItemOf<'mcq'> = {
      kind: 'mcq',
      id: idDe(ctx, 'mcq', `${mode}:${hash(`${question}|${spoken ?? ''}=${good}`)}`),
      lessonId: ctx.lesson.id,
      question,
      choices,
      answerIndex: choices.indexOf(good),
      lang: EN,
      explication: ex,
      difficulty: difficulte(level),
      guillotine: true,
    };
    if (spoken) it.spoken = spoken;
    if (image) it.image = image;
    return it;
  };
}

function genOral(l: Lecon): ItemGen {
  return (level, rng, ctx) => {
    const sp = special(l, 'oral_answer', level, rng, ctx);
    if (sp) return sp;
    const redige = (l.oraux ?? []).filter((o) => NIVEAUX_MOTS[level].includes(o.n));
    if (redige.length && rng.chance(0.4)) {
      const o = rng.pick(redige);
      const it: ItemOf<'oral_answer'> = {
        kind: 'oral_answer',
        id: idDe(ctx, 'oral', o.id),
        lessonId: ctx.lesson.id,
        prompt: o.prompt,
        spoken: o.spoken ?? o.prompt.replace(/\s*\p{Extended_Pictographic}.*$/u, ''),
        answer: o.answer,
        accepted: [...new Set([o.answer, ...o.acc])],
        lang: EN,
        explication: o.ex,
        difficulty: DIFF[o.n],
      };
      return it;
    }
    const t = themeAuHasard(l, level, rng, 1);
    const w = rng.pick(motsDe(t, level));
    const accepted = [w.en, ...(w.acc ?? [])];
    if (w.nom) accepted.push(`a ${w.en}`, `an ${w.en}`, `the ${w.en}`);
    const it: ItemOf<'oral_answer'> = {
      kind: 'oral_answer',
      id: idDe(ctx, 'oral', `${t.id}:${w.en}`),
      lessonId: ctx.lesson.id,
      prompt: `Dis en anglais : ${w.fr}${w.img ? ` ${w.img}` : ''}`,
      spoken: `Dis en anglais : ${w.fr}`,
      answer: w.en,
      accepted: [...new Set(accepted)],
      lang: EN,
      explication: `« ${w.fr} » se dit « ${w.en} ».`,
      difficulty: difficulte(level),
    };
    return it;
  };
}

function genVf(l: Lecon): ItemGen {
  return (level, rng, ctx) => {
    const sp = special(l, 'true_false', level, rng, ctx);
    if (sp) return sp;
    const t = themeAuHasard(l, level, rng, 2);
    const w = rng.pick(motsDe(t, level));
    const vrai = rng.chance(0.5);
    const shown = vrai ? w.fr : (autres(t, level, rng, w, (m) => m.fr, 1)[0] ?? w.fr);
    const statement = `« ${w.en} » veut dire « ${shown} ».`;
    const it: ItemOf<'true_false'> = {
      kind: 'true_false',
      id: idDe(ctx, 'tf', hash(statement)),
      lessonId: ctx.lesson.id,
      statement,
      answer: shown === w.fr,
      explication: `« ${w.en} » veut dire « ${w.fr} ».`,
      difficulty: difficulte(level),
    };
    if (level === 'facile' && w.img && it.answer) it.image = w.img;
    return it;
  };
}

function lecon(l: Lecon): ContentModule[string] {
  return {
    gens: { pairing: genPaires(l), mcq: genQcm(l), oral_answer: genOral(l), true_false: genVf(l) },
  };
}

/* ------------------------------------------------------------------ */
/* Greetings                                                           */
/* ------------------------------------------------------------------ */

const GREETINGS: Lecon = {
  themes: [
    {
      id: 'saluer',
      consigne: '{mot}',
      mots: [
        { en: 'Hello', fr: 'bonjour', n: 'f', img: '👋', acc: ['hello', 'hi', 'hallo', 'hullo'] },
        { en: 'Goodbye', fr: 'au revoir', n: 'f', acc: ['goodbye', 'bye', 'bye bye', 'good bye'] },
        { en: 'Thank you', fr: 'merci', n: 'f', img: '🙏', acc: ['thank you', 'thanks'] },
        { en: 'Good morning', fr: 'bonjour (le matin)', n: 'n', img: '🌅', acc: ['good morning'] },
        { en: 'Good night', fr: 'bonne nuit', n: 'n', img: '🌙', acc: ['good night', 'night night'] },
        { en: 'Please', fr: 's’il te plaît', n: 'n', acc: ['please'] },
      ],
    },
    {
      id: 'humeur',
      consigne: '{mot}',
      mots: [
        { en: 'I’m happy', fr: 'je suis content(e)', n: 'f', img: '😄', acc: ['i am happy', 'happy'] },
        { en: 'I’m sad', fr: 'je suis triste', n: 'f', img: '😢', acc: ['i am sad', 'sad'] },
        {
          en: 'I’m fine',
          fr: 'je vais bien',
          n: 'f',
          img: '🙂',
          acc: ['i am fine', 'fine', 'i’m ok', 'i’m good'],
        },
        { en: 'I’m tired', fr: 'je suis fatigué(e)', n: 'n', img: '😴', acc: ['i am tired', 'tired'] },
        { en: 'I’m angry', fr: 'je suis en colère', n: 'n', img: '😠', acc: ['i am angry', 'angry'] },
        { en: 'I’m hungry', fr: 'j’ai faim', n: 'n', img: '😋', acc: ['i am hungry', 'hungry'] },
      ],
    },
  ],
  qcm: [
    {
      n: 'f',
      id: 'how-are-you',
      q: 'Quelqu’un te demande « How are you? ». Que réponds-tu ?',
      ok: 'I’m fine, thank you.',
      ko: ['My name is Tom.', 'Goodbye!', 'I’m seven.'],
      spoken: 'How are you?',
      lang: EN,
      ex: '« How are you? » veut dire « Comment vas-tu ? » : on répond « I’m fine, thank you. »',
    },
    {
      n: 'n',
      id: 'whats-your-name',
      q: 'Quelqu’un te demande « What’s your name? ». Que réponds-tu ?',
      ok: 'My name is Léa.',
      ko: ['I’m fine.', 'Good night!', 'I’m seven.'],
      spoken: 'What’s your name?',
      lang: EN,
      ex: '« What’s your name? » veut dire « Comment t’appelles-tu ? » : on répond « My name is… »',
    },
    {
      n: 'n',
      id: 'night',
      q: 'Le soir, avant d’aller dormir, tu dis :',
      ok: 'Good night!',
      ko: ['Good morning!', 'Hello!', 'Thank you!'],
      lang: EN,
      ex: '« Good night! » veut dire « Bonne nuit ! »',
    },
    {
      n: 'n',
      id: 'thanks',
      q: 'Un ami te prête son crayon. Tu lui dis :',
      ok: 'Thank you!',
      ko: ['Goodbye!', 'Good night!', 'I’m sad.'],
      lang: EN,
      ex: '« Thank you! » veut dire « Merci ! »',
    },
    {
      n: 'p',
      id: 'how-old',
      q: 'Quelqu’un te demande « How old are you? ». Que réponds-tu ?',
      ok: 'I’m seven.',
      ko: ['I’m fine.', 'My name is Sam.', 'Goodbye!'],
      spoken: 'How old are you?',
      lang: EN,
      ex: '« How old are you? » veut dire « Quel âge as-tu ? » : « I’m seven. » = « J’ai sept ans. »',
    },
    {
      n: 'p',
      id: 'dialogue',
      q: 'Écoute le dialogue. Comment s’appelle la fille ?',
      ok: 'Emma',
      ko: ['Tom', 'Lucy', 'Sam'],
      spoken: 'Hello! What’s your name? — Hi! My name is Emma.',
      lang: EN,
      ex: '« My name is Emma » veut dire « Je m’appelle Emma ».',
    },
  ],
  oraux: [
    {
      n: 'f',
      id: 'hello',
      prompt: 'Dis bonjour en anglais 👋',
      answer: 'Hello!',
      acc: ['hello', 'hi', 'hallo', 'hullo', 'good morning'],
      ex: 'Pour dire bonjour : « Hello! » ou « Hi! »',
    },
    {
      n: 'f',
      id: 'goodbye',
      prompt: 'Dis au revoir en anglais 👋',
      answer: 'Goodbye!',
      acc: ['goodbye', 'good bye', 'bye', 'bye bye', 'see you'],
      ex: 'Pour dire au revoir : « Goodbye! » ou « Bye! »',
    },
    {
      n: 'n',
      id: 'name',
      prompt: 'Présente-toi en anglais : « Je m’appelle… »',
      answer: 'My name is…',
      acc: ['my name is', 'i am', 'i’m'],
      ex: 'Pour se présenter : « My name is… » ou « I’m… »',
    },
    {
      n: 'n',
      id: 'fine',
      prompt: 'Réponds à « How are you? »',
      spoken: 'Réponds à la question',
      answer: 'I’m fine, thank you.',
      acc: [
        'i’m fine',
        'i am fine',
        'fine',
        'i’m ok',
        'i’m good',
        'i’m great',
        'very well',
        'i’m happy',
        'i am happy',
        'not bad',
      ],
      ex: 'À « How are you? », on peut répondre « I’m fine, thank you. »',
    },
    {
      n: 'n',
      id: 'ask-how',
      prompt: 'Demande à un ami comment il va.',
      answer: 'How are you?',
      acc: ['how are you'],
      ex: '« Comment vas-tu ? » se dit « How are you? »',
    },
    {
      n: 'p',
      id: 'ask-name',
      prompt: 'Demande à un ami comment il s’appelle.',
      answer: 'What’s your name?',
      acc: ['what’s your name', 'what is your name'],
      ex: '« Comment t’appelles-tu ? » se dit « What’s your name? »',
    },
    {
      n: 'p',
      id: 'age',
      prompt: 'Dis ton âge en anglais : « J’ai sept ans. »',
      answer: 'I’m seven.',
      acc: ['i’m seven', 'i am seven', 'seven', 'i’m seven years old', 'i am seven years old'],
      ex: '« J’ai sept ans » se dit « I’m seven ».',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Numbers                                                             */
/* ------------------------------------------------------------------ */

const NOMBRES = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
];
const DIZAINES: [number, string][] = [
  [30, 'thirty'],
  [40, 'forty'],
  [50, 'fifty'],
  [60, 'sixty'],
  [70, 'seventy'],
  [80, 'eighty'],
  [90, 'ninety'],
  [100, 'one hundred'],
];
const pommes = (n: number) => '🍎'.repeat(n);

const NUMBERS: Lecon = {
  themes: [
    {
      id: 'compter',
      consigne: 'show me {mot}',
      mots: NOMBRES.slice(0, 6).map((en, i) => ({
        en,
        fr: String(i + 1),
        n: 'f' as const,
        img: pommes(i + 1),
        acc: [String(i + 1)],
      })),
    },
    {
      id: 'nombres',
      mots: [
        ...NOMBRES.slice(0, 10).map((en, i) => ({
          en,
          fr: String(i + 1),
          n: 'f' as const,
          acc: [String(i + 1)],
        })),
        ...NOMBRES.slice(10).map((en, i) => ({
          en,
          fr: String(i + 11),
          n: 'n' as const,
          acc: [String(i + 11)],
        })),
        ...DIZAINES.map(([v, en]) => ({
          en,
          fr: String(v),
          n: 'p' as const,
          acc: [String(v), ...(v === 100 ? ['a hundred', 'hundred'] : [])],
        })),
      ],
    },
  ],
  special: {
    // « 13 » ou « 30 » ? les pièges teen / ty
    mcq: (level, rng, ctx) => {
      if (level === 'facile') return null;
      const n = level === 'normal' ? rng.int(13, 19) : rng.pick([30, 40, 50, 60, 70, 80, 90]);
      const en = n < 20 ? NOMBRES[n - 1]! : DIZAINES.find(([v]) => v === n)![1];
      const jumeau = n < 20 ? (n - 10) * 10 : n / 10 + 10;
      const good = String(n);
      const wrong = [String(jumeau), String(n < 20 ? n - 10 : n / 10), String(n + 1)];
      const choices = rng.shuffle([good, ...new Set(wrong.filter((w) => w !== good))].slice(0, 4));
      return {
        kind: 'mcq',
        id: idDe(ctx, 'mcq', `teen-ty:${n}`),
        lessonId: ctx.lesson.id,
        question: 'Écoute bien et touche le nombre que tu entends.',
        spoken: en,
        lang: EN,
        choices,
        answerIndex: choices.indexOf(good),
        explication: `« ${en} » = ${n}. Les nombres en « -teen » (13 à 19) sont différents des dizaines en « -ty » (30, 40…).`,
        difficulty: 0.7,
        guillotine: true,
      };
    },
  },
  partSpecial: { facile: 0, normal: 0.3, plus_loin: 0.3 },
};

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

const COULEURS: Mot[] = [
  { en: 'red', fr: 'rouge', n: 'f', img: '🔴' },
  { en: 'blue', fr: 'bleu', n: 'f', img: '🔵' },
  { en: 'green', fr: 'vert', n: 'f', img: '🟢' },
  { en: 'yellow', fr: 'jaune', n: 'f', img: '🟡' },
  { en: 'orange', fr: 'orange', n: 'f', img: '🟠' },
  { en: 'purple', fr: 'violet', n: 'n', img: '🟣' },
  { en: 'black', fr: 'noir', n: 'n', img: '⚫' },
  { en: 'white', fr: 'blanc', n: 'n', img: '⚪' },
  { en: 'brown', fr: 'marron', n: 'n', img: '🟤' },
  { en: 'pink', fr: 'rose', n: 'n' },
  { en: 'grey', fr: 'gris', n: 'n', acc: ['gray'] },
];
/** Objets d'une couleur nette (Plus loin : « It's yellow. » → la banane). */
const OBJETS_COULEUR: [string, string, string][] = [
  ['yellow', '🍌', 'la banane'],
  ['red', '🍓', 'la fraise'],
  ['green', '🥦', 'le brocoli'],
  ['purple', '🍇', 'le raisin'],
  ['orange', '🥕', 'la carotte'],
  ['white', '⛄', 'le bonhomme de neige'],
  ['pink', '🐷', 'le cochon'],
  ['grey', '🐘', 'l’éléphant'],
  ['blue', '🐳', 'la baleine'],
];

const COLOURS: Lecon = {
  themes: [{ id: 'couleurs', consigne: 'point to {mot}', mots: COULEURS }],
  special: {
    mcq: (_level, rng, ctx) => {
      const [c, img, nomFr] = rng.pick(OBJETS_COULEUR);
      const wrong = rng
        .shuffle(OBJETS_COULEUR.filter((o) => o[0] !== c))
        .slice(0, 3)
        .map((o) => o[1]);
      const choices = rng.shuffle([img, ...wrong]);
      const fr = COULEURS.find((m) => m.en === c)!.fr;
      return {
        kind: 'mcq',
        id: idDe(ctx, 'mcq', `its:${c}`),
        lessonId: ctx.lesson.id,
        question: 'Écoute et touche ce qui est de cette couleur.',
        spoken: `It’s ${c}.`,
        lang: EN,
        choices,
        answerIndex: choices.indexOf(img),
        explication: `« It’s ${c} » veut dire « c’est ${fr} », comme ${nomFr} ${img}.`,
        difficulty: 0.8,
        guillotine: true,
      };
    },
    oral_answer: (_level, rng, ctx) => {
      const m = rng.pick(COULEURS.filter((x) => x.img));
      return {
        kind: 'oral_answer',
        id: idDe(ctx, 'oral', `its:${m.en}`),
        lessonId: ctx.lesson.id,
        prompt: `Dis en anglais : « C’est ${m.fr}. » ${m.img}`,
        spoken: `Dis en anglais : c’est ${m.fr}`,
        answer: `It’s ${m.en}.`,
        accepted: [`it’s ${m.en}`, `it is ${m.en}`],
        lang: EN,
        explication: `« C’est ${m.fr} » se dit « It’s ${m.en} ».`,
        difficulty: 0.8,
      };
    },
  },
  partSpecial: { facile: 0, normal: 0, plus_loin: 0.5 },
};

/* ------------------------------------------------------------------ */
/* Animals                                                             */
/* ------------------------------------------------------------------ */

const ANIMAUX: (Mot & { pl: string; frPl: string })[] = [
  { en: 'dog', fr: 'le chien', n: 'f', img: '🐶', nom: true, pl: 'dogs', frPl: 'les chiens' },
  { en: 'cat', fr: 'le chat', n: 'f', img: '🐱', nom: true, pl: 'cats', frPl: 'les chats' },
  { en: 'bird', fr: 'l’oiseau', n: 'f', img: '🐦', nom: true, pl: 'birds', frPl: 'les oiseaux' },
  { en: 'fish', fr: 'le poisson', n: 'f', img: '🐟', nom: true, pl: 'fish', frPl: 'les poissons' },
  { en: 'horse', fr: 'le cheval', n: 'f', img: '🐴', nom: true, pl: 'horses', frPl: 'les chevaux' },
  { en: 'rabbit', fr: 'le lapin', n: 'f', img: '🐰', nom: true, pl: 'rabbits', frPl: 'les lapins' },
  { en: 'cow', fr: 'la vache', n: 'n', img: '🐮', nom: true, pl: 'cows', frPl: 'les vaches' },
  { en: 'pig', fr: 'le cochon', n: 'n', img: '🐷', nom: true, pl: 'pigs', frPl: 'les cochons' },
  { en: 'sheep', fr: 'le mouton', n: 'n', img: '🐑', nom: true, pl: 'sheep', frPl: 'les moutons' },
  { en: 'duck', fr: 'le canard', n: 'n', img: '🦆', nom: true, pl: 'ducks', frPl: 'les canards' },
  { en: 'mouse', fr: 'la souris', n: 'n', img: '🐭', nom: true, pl: 'mice', frPl: 'les souris' },
  { en: 'lion', fr: 'le lion', n: 'n', img: '🦁', nom: true, pl: 'lions', frPl: 'les lions' },
  { en: 'elephant', fr: 'l’éléphant', n: 'n', img: '🐘', nom: true, pl: 'elephants', frPl: 'les éléphants' },
  { en: 'monkey', fr: 'le singe', n: 'n', img: '🐵', nom: true, pl: 'monkeys', frPl: 'les singes' },
  { en: 'frog', fr: 'la grenouille', n: 'n', img: '🐸', nom: true, pl: 'frogs', frPl: 'les grenouilles' },
];

const ANIMALS: Lecon = {
  themes: [{ id: 'animaux', mots: ANIMAUX }],
  special: {
    // « I like… / I don't like… »
    mcq: (_level, rng, ctx) => {
      const a = rng.pick(ANIMAUX);
      const aime = rng.chance(0.5);
      const phrase = `I ${aime ? 'like' : 'don’t like'} ${a.pl}.`;
      const good = aime ? `Oui, il aime ${a.frPl}.` : `Non, il n’aime pas ${a.frPl}.`;
      const bad = aime ? `Non, il n’aime pas ${a.frPl}.` : `Oui, il aime ${a.frPl}.`;
      const choices = rng.shuffle([good, bad]);
      return {
        kind: 'mcq',
        id: idDe(ctx, 'mcq', `like:${aime}:${a.en}`),
        lessonId: ctx.lesson.id,
        question: `Écoute ce que dit Sam. Aime-t-il ${a.frPl} ?`,
        spoken: phrase,
        lang: EN,
        image: a.img,
        choices,
        answerIndex: choices.indexOf(good),
        explication: `« I like » = « j’aime » ; « I don’t like » = « je n’aime pas ». Sam a dit : « ${phrase} »`,
        difficulty: 0.8,
        guillotine: true,
      };
    },
    oral_answer: (_level, rng, ctx) => {
      const a = rng.pick(ANIMAUX);
      return {
        kind: 'oral_answer',
        id: idDe(ctx, 'oral', `like:${a.en}`),
        lessonId: ctx.lesson.id,
        prompt: `Dis en anglais que tu aimes ${a.frPl}. ${a.img}`,
        spoken: `Dis en anglais que tu aimes ${a.frPl}`,
        answer: `I like ${a.pl}.`,
        accepted: [`i like ${a.pl}`, `i love ${a.pl}`],
        lang: EN,
        explication: `« J’aime ${a.frPl} » se dit « I like ${a.pl} ».`,
        difficulty: 0.8,
      };
    },
  },
  partSpecial: { facile: 0, normal: 0, plus_loin: 0.5 },
};

/* ------------------------------------------------------------------ */
/* Body (Simon says)                                                   */
/* ------------------------------------------------------------------ */

const CORPS: Mot[] = [
  {
    en: 'nose',
    fr: 'le nez',
    n: 'f',
    img: '👃',
    cmd: 'touch your nose',
    nom: true,
    acc: ['my nose', 'your nose'],
  },
  {
    en: 'ears',
    fr: 'les oreilles',
    n: 'f',
    img: '👂',
    cmd: 'touch your ears',
    acc: ['ear', 'my ears', 'your ears'],
  },
  {
    en: 'eyes',
    fr: 'les yeux',
    n: 'f',
    img: '👀',
    cmd: 'touch your eyes',
    acc: ['eye', 'my eyes', 'your eyes'],
  },
  {
    en: 'mouth',
    fr: 'la bouche',
    n: 'f',
    img: '👄',
    cmd: 'touch your mouth',
    nom: true,
    acc: ['my mouth', 'your mouth'],
  },
  {
    en: 'hand',
    fr: 'la main',
    n: 'f',
    img: '✋',
    cmd: 'wave your hand',
    nom: true,
    acc: ['hands', 'my hand', 'your hand'],
  },
  {
    en: 'foot',
    fr: 'le pied',
    n: 'f',
    img: '🦶',
    cmd: 'touch your foot',
    nom: true,
    acc: ['my foot', 'your foot'],
  },
  { en: 'arm', fr: 'le bras', n: 'n', img: '💪', cmd: 'touch your arm', nom: true, acc: ['arms', 'my arm'] },
  { en: 'leg', fr: 'la jambe', n: 'n', img: '🦵', cmd: 'touch your leg', nom: true, acc: ['legs', 'my leg'] },
  { en: 'teeth', fr: 'les dents', n: 'n', img: '🦷', cmd: 'show your teeth', acc: ['tooth', 'my teeth'] },
  {
    en: 'fingers',
    fr: 'les doigts',
    n: 'n',
    img: '👆',
    cmd: 'show me your fingers',
    acc: ['finger', 'my fingers'],
  },
  { en: 'hair', fr: 'les cheveux', n: 'n', img: '💇', cmd: 'touch your hair', acc: ['my hair', 'your hair'] },
  { en: 'head', fr: 'la tête', n: 'n', cmd: 'touch your head', nom: true, acc: ['my head'] },
];

const BODY: Lecon = {
  themes: [{ id: 'corps', mots: CORPS }],
  special: {
    // consignes enchaînées : « Touch your nose and your ears. »
    mcq: (_level, rng, ctx) => {
      const avec = CORPS.filter((m) => m.img && m.cmd?.startsWith('touch'));
      const [a, b] = rng.shuffle(avec).slice(0, 2) as [Mot, Mot];
      const good = `${a.img} + ${b.img}`;
      const wrong = new Set<string>();
      while (wrong.size < 3) {
        const [c, d] = rng.shuffle(avec).slice(0, 2) as [Mot, Mot];
        const s = `${c.img} + ${d.img}`;
        if (!(c === a && d === b) && !(c === b && d === a) && s !== good) wrong.add(s);
      }
      const choices = rng.shuffle([good, ...wrong]);
      const phrase = `Touch your ${a.en} and your ${b.en}.`;
      return {
        kind: 'mcq',
        id: idDe(ctx, 'mcq', `deux:${a.en}:${b.en}`),
        lessonId: ctx.lesson.id,
        question: 'Écoute les deux consignes de Simon et touche la bonne image.',
        spoken: `Simon says: ${phrase}`,
        lang: EN,
        choices,
        answerIndex: choices.indexOf(good),
        explication: `« ${phrase} » : touche ${a.fr} et ${b.fr}.`,
        difficulty: 0.8,
        guillotine: true,
      };
    },
    oral_answer: (_level, rng, ctx) => {
      const m = rng.pick(CORPS.filter((x) => x.cmd?.startsWith('touch')));
      const fr = m.fr.replace(/^le /, 'ton ').replace(/^la /, 'ta ').replace(/^les /, 'tes ');
      return {
        kind: 'oral_answer',
        id: idDe(ctx, 'oral', `cmd:${m.en}`),
        lessonId: ctx.lesson.id,
        prompt: `Joue Simon ! Dis en anglais : « Touche ${fr}. »${m.img ? ` ${m.img}` : ''}`,
        spoken: `Dis en anglais : touche ${fr}`,
        answer: `Touch your ${m.en}.`,
        accepted: [`touch your ${m.en}`, `simon says touch your ${m.en}`],
        lang: EN,
        explication: `« Touche ${fr} » se dit « Touch your ${m.en} ».`,
        difficulty: 0.8,
      };
    },
  },
  partSpecial: { facile: 0, normal: 0, plus_loin: 0.5 },
};

/* ------------------------------------------------------------------ */
/* Days, months, weather                                               */
/* ------------------------------------------------------------------ */

const JOURS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const JOURS_FR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MOIS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MOIS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];
const ORDINAUX = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth',
  'eleventh',
  'twelfth',
  'thirteenth',
  'fourteenth',
  'fifteenth',
  'sixteenth',
  'seventeenth',
  'eighteenth',
  'nineteenth',
  'twentieth',
  'twenty-first',
  'twenty-second',
  'twenty-third',
  'twenty-fourth',
  'twenty-fifth',
  'twenty-sixth',
  'twenty-seventh',
  'twenty-eighth',
];

const DAYS: Lecon = {
  themes: [
    { id: 'jours', mots: JOURS_EN.map((en, i) => ({ en, fr: JOURS_FR[i]!, n: 'f' as const })) },
    { id: 'mois', mots: MOIS_EN.map((en, i) => ({ en, fr: MOIS_FR[i]!, n: 'n' as const })) },
    {
      id: 'meteo',
      consigne: '{mot}',
      mots: [
        { en: 'It’s sunny', fr: 'il fait beau (soleil)', n: 'f', img: '☀️', acc: ['it is sunny', 'sunny'] },
        {
          en: 'It’s raining',
          fr: 'il pleut',
          n: 'f',
          img: '🌧️',
          acc: ['it is raining', 'it’s rainy', 'rainy'],
        },
        {
          en: 'It’s snowing',
          fr: 'il neige',
          n: 'f',
          img: '❄️',
          acc: ['it is snowing', 'it’s snowy', 'snowy'],
        },
        { en: 'It’s windy', fr: 'il y a du vent', n: 'n', img: '💨', acc: ['it is windy', 'windy'] },
        { en: 'It’s cloudy', fr: 'il y a des nuages', n: 'f', img: '☁️', acc: ['it is cloudy', 'cloudy'] },
        { en: 'It’s hot', fr: 'il fait chaud', n: 'n', img: '🥵', acc: ['it is hot', 'hot'] },
        { en: 'It’s cold', fr: 'il fait froid', n: 'n', img: '🥶', acc: ['it is cold', 'cold'] },
      ],
    },
  ],
  special: {
    // date complète : « Today is Monday, the third of December. »
    mcq: (_level, rng, ctx) => {
      const j = rng.int(0, 6);
      const d = rng.int(1, 28);
      const m = rng.int(0, 11);
      const date = (jj: number, dd: number, mm: number) =>
        `${JOURS_FR[jj]} ${dd === 1 ? '1er' : dd} ${MOIS_FR[mm]}`;
      const good = date(j, d, m);
      const wrong = new Set<string>();
      const d2 = d + 10 <= 28 ? d + 10 : d - 10;
      for (const w of [
        date((j + rng.int(1, 6)) % 7, d, m),
        date(j, d2, m),
        date(j, d, (m + rng.int(1, 11)) % 12),
      ])
        if (w !== good) wrong.add(w);
      const choices = rng.shuffle([good, ...wrong]);
      const phrase = `Today is ${JOURS_EN[j]}, the ${ORDINAUX[d - 1]} of ${MOIS_EN[m]}.`;
      return {
        kind: 'mcq',
        id: idDe(ctx, 'mcq', `date:${j}:${d}:${m}`),
        lessonId: ctx.lesson.id,
        question: 'Écoute la date et choisis la bonne réponse.',
        spoken: phrase,
        lang: EN,
        image: '📅',
        choices,
        answerIndex: choices.indexOf(good),
        explication: `« ${phrase} » veut dire « Aujourd’hui, nous sommes ${good}. »`,
        difficulty: 0.9,
        guillotine: true,
      };
    },
    oral_answer: (_level, rng, ctx) => {
      const j = rng.int(0, 6);
      return {
        kind: 'oral_answer',
        id: idDe(ctx, 'oral', `today:${j}`),
        lessonId: ctx.lesson.id,
        prompt: `Dis en anglais : « Aujourd’hui, c’est ${JOURS_FR[j]}. »`,
        spoken: `Dis en anglais : aujourd’hui, c’est ${JOURS_FR[j]}`,
        answer: `Today is ${JOURS_EN[j]}.`,
        accepted: [`today is ${JOURS_EN[j]}`, `today it’s ${JOURS_EN[j]}`, `it’s ${JOURS_EN[j]}`],
        lang: EN,
        explication: `« Aujourd’hui, c’est ${JOURS_FR[j]} » se dit « Today is ${JOURS_EN[j]} ».`,
        difficulty: 0.8,
      };
    },
  },
  partSpecial: { facile: 0, normal: 0, plus_loin: 0.5 },
};

/* ------------------------------------------------------------------ */
/* Family, clothes, food                                               */
/* ------------------------------------------------------------------ */

const FAMILY: Lecon = {
  themes: [
    {
      id: 'famille',
      consigne: 'point to {mot}',
      mots: [
        { en: 'Mum', fr: 'maman', n: 'f', img: '👩', acc: ['mum', 'mummy', 'mom', 'mother'] },
        { en: 'Dad', fr: 'papa', n: 'f', img: '👨', acc: ['dad', 'daddy', 'father'] },
        { en: 'brother', fr: 'le frère', n: 'f', img: '👦', nom: true },
        { en: 'sister', fr: 'la sœur', n: 'f', img: '👧', nom: true },
        { en: 'baby', fr: 'le bébé', n: 'f', img: '👶', nom: true },
        { en: 'Grandma', fr: 'mamie', n: 'n', img: '👵', acc: ['grandma', 'granny', 'grandmother', 'nan'] },
        {
          en: 'Grandpa',
          fr: 'papi',
          n: 'n',
          img: '👴',
          acc: ['grandpa', 'grandad', 'granddad', 'grandfather'],
        },
      ],
    },
    {
      id: 'vetements',
      mots: [
        { en: 'T-shirt', fr: 'le tee-shirt', n: 'n', img: '👕', nom: true, acc: ['t shirt', 'tshirt'] },
        { en: 'trousers', fr: 'le pantalon', n: 'n', img: '👖', acc: ['trouser'] },
        { en: 'dress', fr: 'la robe', n: 'n', img: '👗', nom: true },
        { en: 'socks', fr: 'les chaussettes', n: 'n', img: '🧦', acc: ['sock'] },
        { en: 'shoes', fr: 'les chaussures', n: 'n', img: '👞', acc: ['shoe'] },
        { en: 'coat', fr: 'le manteau', n: 'n', img: '🧥', nom: true },
        { en: 'scarf', fr: 'l’écharpe', n: 'n', img: '🧣', nom: true },
        { en: 'cap', fr: 'la casquette', n: 'n', img: '🧢', nom: true },
      ],
    },
    {
      id: 'nourriture',
      mots: [
        { en: 'apple', fr: 'la pomme', n: 'n', img: '🍎', nom: true },
        { en: 'banana', fr: 'la banane', n: 'n', img: '🍌', nom: true },
        { en: 'bread', fr: 'le pain', n: 'n', img: '🍞', acc: ['some bread'] },
        { en: 'cheese', fr: 'le fromage', n: 'n', img: '🧀', acc: ['some cheese'] },
        { en: 'milk', fr: 'le lait', n: 'n', img: '🥛', acc: ['some milk'] },
        { en: 'egg', fr: 'l’œuf', n: 'n', img: '🥚', nom: true },
        { en: 'cake', fr: 'le gâteau', n: 'n', img: '🍰', nom: true },
        { en: 'carrot', fr: 'la carotte', n: 'n', img: '🥕', nom: true },
      ],
    },
  ],
  qcm: [
    {
      n: 'p',
      id: 'sister',
      q: 'Écoute Tom. Qui est sur sa photo ?',
      ok: '👧',
      ko: ['👦', '👶', '👵'],
      spoken: 'This is my sister.',
      lang: EN,
      ex: '« This is my sister » veut dire « C’est ma sœur ».',
    },
    {
      n: 'p',
      id: 'grandpa',
      q: 'Écoute Lucy. Qui est sur sa photo ?',
      ok: '👴',
      ko: ['👵', '👨', '👦'],
      spoken: 'This is my grandpa.',
      lang: EN,
      ex: '« This is my grandpa » veut dire « C’est mon papi ».',
    },
    {
      n: 'p',
      id: 'brother',
      q: 'Écoute Sam. Que dit-il ?',
      ok: 'Il a un frère.',
      ko: ['Il a une sœur.', 'Il a un chien.', 'Il a un bébé.'],
      spoken: 'I’ve got a brother.',
      lang: EN,
      ex: '« I’ve got a brother » veut dire « J’ai un frère ».',
    },
    {
      n: 'p',
      id: 'wearing',
      q: 'Écoute Emma. Que porte-t-elle ?',
      ok: '👗',
      ko: ['👖', '🧥', '🧢'],
      spoken: 'I’m wearing a dress.',
      lang: EN,
      ex: '« I’m wearing a dress » veut dire « Je porte une robe ».',
    },
    {
      n: 'p',
      id: 'hungry-cheese',
      q: 'Écoute Ben. Qu’est-ce qu’il aime manger ?',
      ok: '🧀',
      ko: ['🍎', '🍰', '🥕'],
      spoken: 'I like cheese.',
      lang: EN,
      ex: '« I like cheese » veut dire « J’aime le fromage ».',
    },
  ],
  oraux: [
    {
      n: 'p',
      id: 'this-is-mum',
      prompt: 'Présente ta maman en anglais : « C’est ma maman. » 👩',
      answer: 'This is my mum.',
      acc: ['this is my mum', 'this is my mummy', 'this is my mother', 'this is my mom'],
      ex: '« C’est ma maman » se dit « This is my mum ».',
    },
    {
      n: 'p',
      id: 'got-brother',
      prompt: 'Dis en anglais : « J’ai un frère. » 👦',
      answer: 'I’ve got a brother.',
      acc: ['i’ve got a brother', 'i have got a brother', 'i have a brother'],
      ex: '« J’ai un frère » se dit « I’ve got a brother ».',
    },
  ],
};

export const ANGLAIS: ContentModule = {
  'CE1.EN.GREETINGS': lecon(GREETINGS),
  'CE1.EN.NUMBERS': lecon(NUMBERS),
  'CE1.EN.COLOURS': lecon(COLOURS),
  'CE1.EN.ANIMALS': lecon(ANIMALS),
  'CE1.EN.BODY': lecon(BODY),
  'CE1.EN.DAYS': lecon(DAYS),
  'CE1.EN.FAMILY': lecon(FAMILY),
};
