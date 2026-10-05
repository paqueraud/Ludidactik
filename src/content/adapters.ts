/**
 * Adaptateurs : dérivent un type d'item d'un autre quand une leçon n'a pas de contenu natif de ce type.
 * C'est ce qui permet à chaque notion d'être révisée par plusieurs jeux de modalités différentes
 * (un calcul → QCM, vrai/faux, paires de Memory, réponse orale ; un mot → bonne orthographe…).
 */
import { formatNumber, normalizeText } from '@/engine/answer';
import { graphiesNombre } from '@/engine/nombres';
import type { Rng } from '@/engine/rng';
import type {
  FillBlankItem,
  Item,
  McqItem,
  NumericItem,
  OralItem,
  PairingItem,
  SpellingItem,
  TrueFalseItem,
} from './items';
import type { ItemKind } from './schemas';

/* ------------------------------------------------------------------ */
/* Distracteurs                                                        */
/* ------------------------------------------------------------------ */

/** Erreurs plausibles d'enfant pour un résultat numérique (±1, ±10, chiffres inversés…). */
export function numericDistractors(item: NumericItem, rng: Rng, count = 3): number[] {
  const a = item.answer;
  const step = item.decimals > 0 ? 10 ** -item.decimals : 1;
  const candidates = new Set<number>();
  const add = (x: number) => {
    const v = Math.round(x * 1000) / 1000;
    if (v >= 0 && v !== a && (item.decimals > 0 || Number.isInteger(v))) candidates.add(v);
  };
  add(a + step);
  add(a - step);
  add(a + 10 * step);
  add(a - 10 * step);
  const digits = String(a).split('');
  if (digits.length >= 2 && /^\d+$/.test(String(a))) {
    const sw = [...digits];
    [sw[sw.length - 1], sw[sw.length - 2]] = [sw[sw.length - 2]!, sw[sw.length - 1]!];
    add(Number(sw.join('')));
  }
  add(a * 10);
  if (a >= 10) add(a / 10);
  add(a + 2 * step);
  return rng.shuffle([...candidates]).slice(0, count);
}

const DOUBLABLES = /([bcdfglmnprst])/;

/** Fautes d'orthographe plausibles (accent, consonne doublée/simplifiée, lettre finale muette…). */
export function misspellings(word: string, rng: Rng, count = 3): string[] {
  const out = new Set<string>();
  const w = word;
  const tries: Array<() => string> = [
    () => w.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC'),
    () => w.replace(/([bcdfglmnprst])\1/, '$1'),
    () => {
      const m = [...w.matchAll(new RegExp(DOUBLABLES, 'g'))];
      if (!m.length) return w;
      const pos = rng.pick(m).index!;
      return w.slice(0, pos + 1) + w[pos] + w.slice(pos + 1);
    },
    () => (/[tdsxe]$/.test(w) && w.length > 3 ? w.slice(0, -1) : w + 'e'),
    () => w.replace('é', 'è').replace('ê', 'é'),
    () => w.replace(/au|eau|o(?!u)/, (s) => (s === 'o' ? 'au' : 'o')),
    () => w.replace(/s(?=[aeiouy])/, 'ss').replace(/^ss/, 's'),
    () => w.replace(/an|en/, (s) => (s === 'an' ? 'en' : 'an')),
    () => w.replace(/qu/, 'k').replace(/c(?=[aou])/, 'k'),
    () => w.replace(/ph/, 'f').replace(/ai/, 'è'),
    () => {
      if (w.length < 4) return w;
      const i = rng.int(1, w.length - 2);
      return w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
    },
  ];
  for (const t of rng.shuffle(tries)) {
    const v = t();
    if (v !== w && v.trim() && normalizeText(v) !== normalizeText(w)) out.add(v);
    if (out.size >= count) break;
  }
  return [...out];
}

/* ------------------------------------------------------------------ */
/* Conversions                                                         */
/* ------------------------------------------------------------------ */

const sayNumber = (n: number) => formatNumber(n).replace(/ /g, ' ').replace(',', ' virgule ');

function numericToMcq(it: NumericItem, rng: Rng): McqItem {
  const good = formatNumber(it.answer);
  const choices = rng.shuffle([good, ...numericDistractors(it, rng, 3).map((d) => formatNumber(d))]);
  return {
    kind: 'mcq',
    id: `${it.id}~qcm`,
    lessonId: it.lessonId,
    question: `${it.prompt}${/[=?…]/.test(it.prompt) ? '' : ' = ?'}`,
    spoken: it.spoken,
    choices,
    answerIndex: choices.indexOf(good),
    explication: it.explication,
    guillotine: true,
    difficulty: it.difficulty,
  };
}

function numericToTrueFalse(it: NumericItem, rng: Rng): TrueFalseItem | null {
  if (/…|\?/.test(it.prompt)) return null; // énoncé à trou : pas d'égalité simple à juger
  const truth = rng.chance(0.5);
  const shown = truth ? it.answer : (numericDistractors(it, rng, 1)[0] ?? it.answer + 1);
  const isLabel = /^(Le|La|L’|Combien)/.test(it.prompt);
  return {
    kind: 'true_false',
    id: `${it.id}~vf`,
    lessonId: it.lessonId,
    statement: isLabel ? `${it.prompt} : ${formatNumber(shown)}` : `${it.prompt} = ${formatNumber(shown)}`,
    spoken: `${it.spoken} égale ${sayNumber(shown)}`,
    answer: shown === it.answer,
    explication: it.explication,
    difficulty: it.difficulty,
  };
}

function numericToOral(it: NumericItem): OralItem {
  const a = it.answer;
  const accepted = [String(a), formatNumber(a).replace(/ /g, ' '), String(a).replace('.', ',')];
  if (Number.isInteger(a) && a >= 0 && a <= 999_999_999) accepted.push(...graphiesNombre(a));
  return {
    kind: 'oral_answer',
    id: `${it.id}~oral`,
    lessonId: it.lessonId,
    prompt: it.prompt,
    spoken: it.spoken,
    answer: formatNumber(a),
    accepted: [...new Set(accepted)],
    explication: it.explication,
    difficulty: it.difficulty,
  };
}

function numericsToPairing(items: NumericItem[], lessonId: string): PairingItem | null {
  const seenL = new Set<string>();
  const seenR = new Set<string>();
  const pairs: PairingItem['pairs'] = [];
  for (const it of items) {
    const l = it.prompt;
    const r = formatNumber(it.answer);
    if (seenL.has(l) || seenR.has(r)) continue;
    seenL.add(l);
    seenR.add(r);
    pairs.push({ left: l, right: r });
    if (pairs.length >= 6) break;
  }
  if (pairs.length < 3) return null;
  return {
    kind: 'pairing',
    id: `${lessonId}~paires~${pairs.map((p) => p.left).join('|')}`,
    lessonId,
    prompt: 'Associe chaque calcul à son résultat.',
    pairs,
    relation: 'calcul → résultat',
    explication: 'Calcule chaque opération, puis cherche la carte qui porte le résultat.',
  };
}

function mcqToTrueFalse(it: McqItem, rng: Rng): TrueFalseItem {
  const truth = rng.chance(0.5);
  const wrong = it.choices.filter((_, i) => i !== it.answerIndex);
  const shown = truth || !wrong.length ? it.choices[it.answerIndex]! : rng.pick(wrong);
  return {
    kind: 'true_false',
    id: `${it.id}~vf`,
    lessonId: it.lessonId,
    statement: `${it.question}\n→ ${shown}`,
    spoken: `${it.spoken ?? it.question} Réponse proposée : ${shown}.`,
    answer: shown === it.choices[it.answerIndex],
    explication: it.explication,
    lang: it.lang,
    difficulty: it.difficulty,
  };
}

function mcqsToPairing(items: McqItem[], lessonId: string): PairingItem | null {
  const pairs: PairingItem['pairs'] = [];
  const seenL = new Set<string>();
  const seenR = new Set<string>();
  for (const it of items) {
    const r = it.choices[it.answerIndex]!;
    if (it.question.length > 70 || r.length > 40 || seenL.has(it.question) || seenR.has(r)) continue;
    seenL.add(it.question);
    seenR.add(r);
    pairs.push({ left: it.question, right: r });
    if (pairs.length >= 5) break;
  }
  if (pairs.length < 3) return null;
  return {
    kind: 'pairing',
    id: `${lessonId}~paires~${pairs.map((p) => p.right).join('|')}`,
    lessonId,
    prompt: 'Associe chaque question à sa réponse.',
    pairs,
    relation: 'question → réponse',
    explication: 'Relis bien chaque question avant de chercher sa réponse.',
  };
}

function spellingToMcq(it: SpellingItem, rng: Rng): McqItem | null {
  if (it.isSentence) return null;
  const wrong = misspellings(it.word, rng, 3);
  if (wrong.length < 2) return null;
  const choices = rng.shuffle([it.word, ...wrong]);
  return {
    kind: 'mcq',
    id: `${it.id}~qcm`,
    lessonId: it.lessonId,
    question: 'Quelle est la bonne orthographe ?',
    spoken: `Quelle est la bonne orthographe du mot : ${it.word} ?`,
    choices,
    answerIndex: choices.indexOf(it.word),
    explication: `On écrit « ${it.word} ». ${it.explication}`,
    guillotine: true,
  };
}

function spellingToTrueFalse(it: SpellingItem, rng: Rng): TrueFalseItem | null {
  if (it.isSentence) return null;
  const truth = rng.chance(0.5);
  const wrong = misspellings(it.word, rng, 1)[0];
  const shown = truth || !wrong ? it.word : wrong;
  return {
    kind: 'true_false',
    id: `${it.id}~vf`,
    lessonId: it.lessonId,
    statement: `Ce mot est bien écrit : « ${shown} »`,
    spoken: 'Ce mot est-il bien écrit ?',
    answer: shown === it.word,
    explication: `On écrit « ${it.word} ».`,
  };
}

function fillBlankToMcq(it: FillBlankItem): McqItem | null {
  if (!it.choices) return null;
  return {
    kind: 'mcq',
    id: `${it.id}~qcm`,
    lessonId: it.lessonId,
    question: it.sentence,
    spoken: it.spoken,
    choices: it.choices,
    answerIndex: it.choices.indexOf(it.answer),
    explication: it.explication,
    guillotine: true,
  };
}

function fillBlankToTrueFalse(it: FillBlankItem, rng: Rng): TrueFalseItem | null {
  if (!it.choices) return null;
  const truth = rng.chance(0.5);
  const wrong = it.choices.filter((c) => c !== it.answer);
  const shown = truth || !wrong.length ? it.answer : rng.pick(wrong);
  return {
    kind: 'true_false',
    id: `${it.id}~vf`,
    lessonId: it.lessonId,
    statement: it.sentence.replace('___', shown),
    answer: shown === it.answer,
    explication: it.explication,
  };
}

/* ------------------------------------------------------------------ */
/* Table des dérivations                                               */
/* ------------------------------------------------------------------ */

/** Pour chaque type cible : depuis quel type natif on peut le dériver, et comment. */
export const DERIVATIONS: Partial<
  Record<
    ItemKind,
    {
      from: ItemKind;
      one?: (it: Item, rng: Rng) => Item | null;
      many?: (items: Item[], lessonId: string) => Item | null;
    }[]
  >
> = {
  mcq: [
    { from: 'numeric_answer', one: (it, rng) => numericToMcq(it as NumericItem, rng) },
    { from: 'fill_blank', one: (it) => fillBlankToMcq(it as FillBlankItem) },
    { from: 'spelling_word', one: (it, rng) => spellingToMcq(it as SpellingItem, rng) },
  ],
  true_false: [
    { from: 'numeric_answer', one: (it, rng) => numericToTrueFalse(it as NumericItem, rng) },
    { from: 'mcq', one: (it, rng) => mcqToTrueFalse(it as McqItem, rng) },
    { from: 'fill_blank', one: (it, rng) => fillBlankToTrueFalse(it as FillBlankItem, rng) },
    { from: 'spelling_word', one: (it, rng) => spellingToTrueFalse(it as SpellingItem, rng) },
  ],
  oral_answer: [{ from: 'numeric_answer', one: (it) => numericToOral(it as NumericItem) }],
  pairing: [
    { from: 'numeric_answer', many: (items, id) => numericsToPairing(items as NumericItem[], id) },
    { from: 'mcq', many: (items, id) => mcqsToPairing(items as McqItem[], id) },
  ],
};
