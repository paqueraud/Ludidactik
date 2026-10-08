/**
 * Audit de conformité BO (commande /verifier-bo) — fonctions d'analyse.
 * Utilisé par `audit-bo.test.ts` : contrôles légers toujours actifs, rapport complet avec `AUDIT_BO=1`.
 */
import { content } from '@/content';
import type { Item } from '@/content/items';
import { checkItem } from '@/content/items';
import { CONTENU } from '@/content/modules';
import { availableKinds, countItems, createStream, itemKey } from '@/content/provider';
import type { ItemKind, Lesson, Level, Modality } from '@/content/schemas';
import { LEVELS } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { gamesForLesson } from '@/games/registry';

export const CTX = { parentLists: [] };

/** Mentions internes qui n'ont rien à faire dans un texte affiché (boRef, titre, niveaux). */
export const MENTION_INTERNE =
  /TODO|à confirmer|à vérifier|ci-dessus|docs\/|VERIFICATION|ne sont pas nommés|non nommés|\(liste BO/i;

/**
 * Types d'items natifs (sans adaptateur) qui produisent réellement des items.
 * Une banque vide déclarée (`aucun`) sert à bloquer un adaptateur : elle n'est pas comptée.
 */
export function nativeKinds(lesson: Lesson): ItemKind[] {
  const kinds = new Set<ItemKind>();
  const mod = CONTENU[lesson.id];
  const gctx = { index: content, lesson, parentLists: [] };
  for (const k of Object.keys(mod?.gens ?? {})) kinds.add(k as ItemKind);
  for (const [k, pool] of Object.entries(mod?.pools ?? {}))
    if (pool && LEVELS.some((lv) => pool(lv, createRng(1), gctx).length > 0)) kinds.add(k as ItemKind);
  if (content.wordLists.some((l) => l.lessonId === lesson.id)) kinds.add('spelling_word');
  for (const q of content.questions) if (q.lessonId === lesson.id) kinds.add(q.type);
  return [...kinds];
}

/** Texte lisible d'un item (relecture pédagogique). La bonne réponse est marquée ✔. */
export function describeItem(it: Item): string {
  const ex = ` — explication : ${it.explication}`;
  switch (it.kind) {
    case 'numeric_answer':
      return `[calcul] ${it.prompt}${it.prompt === it.spoken ? '' : ` (dit : « ${it.spoken} »)`} → ✔ ${it.answer}${it.unit ? ` ${it.unit}` : ''}${ex}`;
    case 'spelling_word':
      return `[dictée] ${it.word}${it.sentence ? ` (phrase : ${it.sentence})` : ''}${ex}`;
    case 'mcq':
      return `[QCM] ${it.question}${it.meta?.texte ? ` [texte : ${String(it.meta.texte).slice(0, 220)}…]` : ''} | ${it.choices
        .map((c, i) => (i === it.answerIndex ? `✔ ${c}` : c))
        .join(' / ')}${ex}`;
    case 'true_false':
      return `[vrai/faux] ${it.statement} → ✔ ${it.answer ? 'vrai' : 'faux'}${ex}`;
    case 'ordering':
      return `[ordre ${it.mode}] ${it.prompt} → ✔ ${it.elements.join(' | ')}${it.labels ? ` (${it.labels.join(', ')})` : ''}${ex}`;
    case 'classification':
      return `[classement] ${it.prompt}${it.meta?.phrase ? ` « ${String(it.meta.phrase)} »` : ''} → ${it.categories
        .map(
          (c, i) =>
            `${c} : ${it.elements
              .filter((e) => e.category === i)
              .map((e) => e.label)
              .join(', ')}`,
        )
        .join(' ; ')}${ex}`;
    case 'pairing':
      return `[paires] ${it.prompt} → ${it.pairs.map((p) => `${p.left} ↔ ${p.right}`).join(' ; ')}${ex}`;
    case 'fill_blank':
      return `[trou] ${it.sentence} → ✔ ${it.answer}${it.choices ? ` (choix : ${it.choices.join(' / ')})` : ''}${ex}`;
    case 'number_line':
      return `[droite ${it.min}…${it.max}, pas ${it.step}${it.subdivisions ? `/${it.subdivisions}` : ''}] ${it.prompt} → ✔ ${it.display}${ex}`;
    case 'visual_fraction':
      return `[fraction ${it.task}] ${it.prompt} → ✔ ${it.numerator}/${it.denominator}${it.other ? ` vs ${it.other.numerator}/${it.other.denominator}` : ''}${ex}`;
    case 'clock':
      return `[horloge ${it.task}] ${it.prompt} → ✔ ${it.answerText}${ex}`;
    case 'money':
      return `[monnaie ${it.task}] ${it.prompt} (prix ${it.priceCents / 100} €${it.givenCents ? `, donné ${it.givenCents / 100} €` : ''})${ex}`;
    case 'geometry_shape':
      return `[géométrie ${it.task}] ${it.prompt} → ✔ ${it.answer}${it.choices ? ` (choix : ${it.choices.join(' / ')})` : ''}${ex}`;
    case 'map_point':
      return `[carte ${it.map}] ${it.prompt} → ✔ ${it.targetLabel}${ex}`;
    case 'read_aloud':
      return `[lecture ${it.nbMots} mots, ${it.targetMCLM} MCLM] ${it.title} : ${it.text.slice(0, 200)}…`;
    case 'oral_answer':
      return `[oral] ${it.prompt} → ✔ ${it.answer}${ex}`;
    case 'bar_model':
      return `[problème ${it.structure}] ${it.statement} ${it.question} → ✔ ${it.answer}${it.unit ? ` ${it.unit}` : ''} (${it.operation})${ex}`;
  }
}

/** Tous les textes d'un item (pour les contrôles de bornes). */
function texts(it: Item): string[] {
  const out: string[] = [];
  const add = (...s: (string | number | undefined)[]) => {
    for (const x of s) if (x !== undefined) out.push(String(x));
  };
  switch (it.kind) {
    case 'numeric_answer':
      add(it.prompt, it.answer);
      break;
    case 'mcq':
      add(it.question, ...it.choices);
      break;
    case 'true_false':
      add(it.statement);
      break;
    case 'ordering':
      add(it.prompt, ...it.elements);
      break;
    case 'classification':
      add(it.prompt, ...it.elements.map((e) => e.label));
      break;
    case 'pairing':
      add(it.prompt, ...it.pairs.flatMap((p) => [p.left, p.right]));
      break;
    case 'fill_blank':
      add(it.sentence, it.answer, ...(it.choices ?? []));
      break;
    case 'number_line':
      add(it.prompt, it.display, it.max);
      break;
    case 'visual_fraction':
      add(it.prompt, `${it.numerator}/${it.denominator}`);
      break;
    case 'bar_model':
      add(it.statement, it.question, it.answer);
      break;
    case 'oral_answer':
      add(it.prompt, it.answer);
      break;
    case 'geometry_shape':
      add(it.prompt, it.answer, ...(it.choices ?? []));
      break;
    default:
      break;
  }
  return out;
}

const NOMBRE = /\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;

function nombres(s: string): { valeur: number; decimales: number }[] {
  return [...s.matchAll(NOMBRE)].map((m) => {
    const brut = m[0].replace(/[ \u00a0\u202f]/g, '');
    const [ent, dec = ''] = brut.split(',');
    return { valeur: Number(`${ent}.${dec || 0}`), decimales: dec.length };
  });
}

/** Écarts aux bornes BO de la classe (maths uniquement). */
export function horsBornes(lesson: Lesson, level: Level, it: Item): string[] {
  if (lesson.matiere !== 'maths' || level === 'plus_loin') return [];
  const out: string[] = [];
  const all = texts(it);
  const denoms: number[] = [];
  for (const s of all) for (const m of s.matchAll(/(\d+)\s*\/\s*(\d+)/g)) denoms.push(Number(m[2]));
  if (it.kind === 'visual_fraction') denoms.push(it.denominator);
  if (lesson.classe === 'CE1') {
    for (const s of all)
      for (const n of nombres(s)) {
        if (n.valeur > 1000) out.push(`entier > 1 000 (${n.valeur})`);
        if (n.decimales > 0 && !/€/.test(s)) out.push(`nombre à virgule hors monnaie (${s.slice(0, 40)})`);
      }
    for (const d of denoms)
      if (![2, 3, 4, 5, 6, 8, 10].includes(d)) out.push(`dénominateur ${d} hors liste CE1`);
  } else if (lesson.classe === 'CM2') {
    for (const s of all)
      for (const n of nombres(s)) {
        if (n.valeur > 999_999_999) out.push(`entier > 999 999 999 (${n.valeur})`);
        if (n.decimales > 3) out.push(`plus de 3 décimales (${n.valeur})`);
      }
    for (const d of denoms) if (d > 60 && d !== 100 && d !== 1000) out.push(`dénominateur ${d} > 60`);
  }
  return [...new Set(out)];
}

export interface LevelStat {
  items: number;
  erreurs: string[];
  bornes: string[];
  /** Clés d'items tirés (comparaison des niveaux). */
  cles: Set<string>;
  /** Jeux jouables (contenu suffisant) à ce niveau. */
  jeux: string[];
}

export interface LessonAudit {
  lesson: Lesson;
  native: ItemKind[];
  available: ItemKind[];
  itemKindsOk: boolean;
  jeux: { id: string; titre: string; kind: ItemKind; modalites: Modality[] }[];
  modalites: Modality[];
  niveaux: Record<Level, LevelStat>;
  /** Recouvrement des items Facile / Plus loin (0 = disjoints, 1 = identiques). */
  recouvrement: number;
  problemes: string[];
  avertissements: string[];
}

const N_GEN = 30;

/** Échantillon d'items d'une leçon à un niveau, tous types disponibles (graine fixe). */
export function sampleLesson(lesson: Lesson, level: Level, seed = 2026, perKind = N_GEN) {
  const out: { kind: ItemKind; item: Item }[] = [];
  const erreurs: string[] = [];
  for (const kind of availableKinds(content, lesson, CTX)) {
    const rng = createRng(seed);
    try {
      const st = createStream(content, lesson, kind, level, rng, CTX);
      if (!st) continue;
      const n = st.size === null ? perKind : Math.min(st.size, perKind);
      for (let i = 0; i < n; i++) out.push({ kind, item: st.next(0.5) });
    } catch (e) {
      erreurs.push(`${kind} : exception ${(e as Error).message}`);
    }
  }
  return { out, erreurs };
}

export function auditLesson(lesson: Lesson): LessonAudit {
  const problemes: string[] = [];
  const avertissements: string[] = [];
  const native = nativeKinds(lesson);
  const available = availableKinds(content, lesson, CTX);
  const itemKindsOk =
    [...new Set(lesson.itemKinds)].sort().join() === [...native].sort().join() ||
    lesson.source.kind === 'parents';

  // métadonnées
  if (!lesson.boRef || lesson.boRef.length < 20) problemes.push('boRef absent ou trop court');
  if (MENTION_INTERNE.test(lesson.boRef))
    avertissements.push(`boRef : mention interne (« ${lesson.boRef.match(MENTION_INTERNE)![0]} »)`);
  if (MENTION_INTERNE.test(lesson.titre)) problemes.push(`titre : mention interne (« ${lesson.titre} »)`);
  const nv = lesson.niveaux;
  if (new Set([nv.facile, nv.normal, nv.plus_loin]).size < 3 && lesson.source.kind !== 'parents')
    problemes.push('niveaux non distincts');
  if (!lesson.rappel || lesson.rappel.startsWith('TODO') || lesson.rappel.length < 15)
    problemes.push('rappel absent');
  if (!itemKindsOk)
    problemes.push(`itemKinds déclarés [${lesson.itemKinds.join(', ')}] ≠ natifs [${native.join(', ')}]`);
  const auDela = /\b(6e|CE2|collège)\b/;
  if (auDela.test(nv.normal) && !/plus loin/i.test(lesson.titre + nv.normal))
    problemes.push(`niveau Normal au-delà de la classe sans étiquette (« ${nv.normal} »)`);
  if (auDela.test(nv.facile) && !/plus loin/i.test(lesson.titre + nv.facile))
    problemes.push(`niveau Facile au-delà de la classe sans étiquette (« ${nv.facile} »)`);

  // items et jeux par niveau
  const niveaux = {} as Record<Level, LevelStat>;
  for (const level of LEVELS) {
    const { out, erreurs } = sampleLesson(lesson, level);
    const st: LevelStat = { items: out.length, erreurs: [...erreurs], bornes: [], cles: new Set(), jeux: [] };
    for (const { kind, item } of out) {
      const errs = checkItem(item);
      if (errs.length) st.erreurs.push(`${kind} ${item.id} : ${errs.join(' ; ')}`);
      if (item.lessonId !== lesson.id) st.erreurs.push(`${kind} ${item.id} : lessonId ${item.lessonId}`);
      if (/^TODO/.test(item.explication)) st.erreurs.push(`${kind} ${item.id} : explication TODO`);
      for (const b of horsBornes(lesson, level, item))
        st.bornes.push(`${kind} : ${b} — ${describeItem(item).slice(0, 120)}`);
      st.cles.add(`${kind}|${describeItem(item)}`);
    }
    st.erreurs = [...new Set(st.erreurs)].slice(0, 8);
    st.bornes = [...new Set(st.bornes)].slice(0, 6);
    niveaux[level] = st;
  }

  const jeux = gamesForLesson(lesson, CTX).map((g) => ({
    id: g.game.id,
    titre: g.game.titre,
    kind: g.kind,
    modalites: g.game.modalites,
  }));
  const rng = createRng(1);
  for (const level of LEVELS)
    niveaux[level].jeux = gamesForLesson(lesson, CTX)
      .filter((g) => {
        try {
          return countItems(content, lesson, g.kind, level, rng, CTX, g.game.filterItem) >= g.game.minItems;
        } catch (e) {
          niveaux[level].erreurs.push(`${g.game.id} (${g.kind}) : exception ${(e as Error).message}`);
          return false;
        }
      })
      .map((g) => g.game.id);

  const modalites = [...new Set(jeux.flatMap((j) => j.modalites))];
  if (lesson.source.kind !== 'parents') {
    if (jeux.length < 2) problemes.push(`${jeux.length} jeu(x) jouable(s)`);
    if (modalites.length < 2) problemes.push('une seule modalité');
    for (const level of LEVELS) {
      if (niveaux[level].items === 0) problemes.push(`aucun item au niveau ${level}`);
      if (niveaux[level].erreurs.length) problemes.push(`items invalides au niveau ${level}`);
      if (niveaux[level].jeux.length < jeux.length)
        avertissements.push(
          `niveau ${level} : ${jeux.length - niveaux[level].jeux.length} jeu(x) sans assez d’items (${jeux
            .map((j) => j.id)
            .filter((id) => !niveaux[level].jeux.includes(id))
            .join(', ')})`,
        );
    }
  }
  for (const level of ['facile', 'normal'] as const)
    if (niveaux[level].bornes.length) problemes.push(`bornes BO dépassées au niveau ${level}`);

  const a = niveaux.facile.cles;
  const b = niveaux.plus_loin.cles;
  const inter = [...a].filter((k) => b.has(k)).length;
  const recouvrement = a.size + b.size ? inter / Math.min(a.size || 1, b.size || 1) : 0;
  if (recouvrement > 0.6 && lesson.source.kind !== 'parents')
    avertissements.push(
      `niveaux peu différenciés : ${Math.round(recouvrement * 100)} % d’items communs Facile/Plus loin`,
    );

  return {
    lesson,
    native,
    available,
    itemKindsOk,
    jeux,
    modalites,
    niveaux,
    recouvrement,
    problemes,
    avertissements,
  };
}

/** Clé d'item (export pour l'échantillonnage). */
export { itemKey };
