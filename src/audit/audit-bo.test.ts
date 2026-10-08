/**
 * Audit de conformité BO (/verifier-bo).
 * - Toujours : contrôles rapides des métadonnées du curriculum (boRef, niveaux, rappel, titres).
 * - Avec `AUDIT_BO=1` (et `AUDIT_OUT=<dossier>`) : audit complet de chaque leçon (items à chaque niveau,
 *   bornes, jeux jouables, modalités) → `audit-bo.md`, `audit-bo.json` et `echantillon-*.txt` dans AUDIT_OUT.
 *   AUDIT_BO=1 AUDIT_OUT=./tmp npx vitest run src/audit/audit-bo.test.ts
 */
import { describe, expect, it } from 'vitest';
import { content } from '@/content';
import { type Lesson, LEVELS } from '@/content/schemas';
import { createRng } from '@/engine/rng';
import { CTX, MENTION_INTERNE, type LessonAudit, auditLesson, describeItem, sampleLesson } from './audit-bo';

const lecons: Lesson[] = [...content.lessons.values()];

/** Accès minimal à Node (le tsconfig de l'app n'a pas les types Node). */
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
interface Fs {
  mkdirSync(p: string, o: { recursive: boolean }): void;
  writeFileSync(p: string, d: string, e: 'utf8'): void;
}
const join = (...parts: string[]) => parts.join('/');

describe('Audit BO — métadonnées du curriculum', () => {
  it('chaque leçon a un boRef précis, sans mention interne', () => {
    for (const l of lecons) {
      expect(l.boRef.length, l.id).toBeGreaterThan(20);
      expect(l.boRef, l.id).toMatch(/BO n°\d+|Programme/);
      expect(MENTION_INTERNE.test(l.boRef), `${l.id} : ${l.boRef}`).toBe(false);
    }
  });

  it('titres sans note interne, rappels rédigés', () => {
    for (const l of lecons) {
      expect(MENTION_INTERNE.test(l.titre), `${l.id} : ${l.titre}`).toBe(false);
      expect(l.rappel.length, l.id).toBeGreaterThan(15);
      expect(l.rappel.startsWith('TODO'), l.id).toBe(false);
    }
  });

  it('3 niveaux distincts (hors listes des parents)', () => {
    for (const l of lecons.filter((x) => x.source.kind !== 'parents')) {
      const { facile, normal, plus_loin } = l.niveaux;
      expect(new Set([facile, normal, plus_loin]).size, l.id).toBe(3);
    }
  });

  it('un Normal au-delà de la classe (6e, CE2) est étiqueté « Pour aller plus loin »', () => {
    for (const l of lecons) {
      if (/\b(6e|CE2|collège)\b/.test(l.niveaux.normal))
        expect(/plus loin/i.test(l.titre + l.niveaux.normal), l.id).toBe(true);
    }
  });
});

const COMPLET = !!env.AUDIT_BO;

/** Grande matière (échantillon relu par le pédagogue). */
function grandeMatiere(l: Lesson): string {
  if (l.matiere === 'francais') return 'francais';
  if (l.matiere === 'maths') return 'maths';
  if (l.matiere === 'emc' || l.matiere === 'anglais') return 'emc-anglais';
  return 'monde';
}

const MOD_COURT: Record<string, string> = {
  ecrire: 'É',
  ecouter: 'O',
  parler: 'P',
  regarder: 'R',
  manipuler: 'M',
};

function ligne(a: LessonAudit): string {
  const l = a.lesson;
  const mods = ['ecrire', 'ecouter', 'parler', 'regarder', 'manipuler']
    .map((m) => (a.modalites.includes(m as never) ? MOD_COURT[m] : '·'))
    .join('');
  const parNiveau = LEVELS.map((lv) => a.niveaux[lv].jeux.length).join('/');
  const etat = a.problemes.length ? '⚠️' : '✅';
  return `| ${etat} | ${l.id} | ${l.titre.replace(/\|/g, '/')} | ${a.jeux.length} (${parNiveau}) | ${mods} | ${a.jeux
    .map((j) => j.id)
    .join(', ')} | ${[...a.problemes, ...a.avertissements].join(' ; ').replace(/\|/g, '/') || '—'} |`;
}

describe.runIf(COMPLET)('Audit BO — rapport complet', () => {
  it('audite toutes les leçons et écrit le rapport', async () => {
    const { mkdirSync, writeFileSync } = (await import(/* @vite-ignore */ `node:${'fs'}`)) as Fs;
    const out = env.AUDIT_OUT ?? 'audit-out';
    mkdirSync(out, { recursive: true });
    const audits = lecons.map(auditLesson);
    const md: string[] = [];
    for (const classe of ['CE1', 'CM2']) {
      const as = audits.filter((a) => a.lesson.classe === classe);
      md.push(`\n## ${classe} — ${as.length} leçons\n`);
      md.push('| État | Leçon | Titre | Jeux (F/N/PL) | Modalités ÉOPRM | Jeux | Écarts |');
      md.push('|---|---|---|---|---|---|---|');
      for (const a of as) md.push(ligne(a));
    }
    writeFileSync(join(out, 'audit-bo.md'), md.join('\n'), 'utf8');
    writeFileSync(
      join(out, 'audit-bo.json'),
      JSON.stringify(
        audits.map((a) => ({
          id: a.lesson.id,
          matiere: a.lesson.matiere,
          programme: a.lesson.programme,
          jeux: a.jeux.map((j) => `${j.id}:${j.kind}`),
          modalites: a.modalites,
          native: a.native,
          available: a.available,
          parNiveau: Object.fromEntries(
            LEVELS.map((lv) => [
              lv,
              {
                items: a.niveaux[lv].items,
                jeux: a.niveaux[lv].jeux.length,
                erreurs: a.niveaux[lv].erreurs,
                bornes: a.niveaux[lv].bornes,
                distracteurs: a.niveaux[lv].distracteurs,
              },
            ]),
          ),
          recouvrement: Math.round(a.recouvrement * 100),
          problemes: a.problemes,
          avertissements: a.avertissements,
        })),
        null,
        1,
      ),
      'utf8',
    );

    // Échantillons pour la relecture pédagogique : 30 items par classe et grande matière (graine fixe).
    for (const classe of ['CE1', 'CM2'])
      for (const gm of ['francais', 'maths', 'monde', 'emc-anglais']) {
        const ls = lecons.filter((l) => l.classe === classe && grandeMatiere(l) === gm);
        const rng = createRng(20261008);
        const lignes: string[] = [];
        const vus = new Set<string>();
        for (let i = 0; lignes.length < 30 && i < 400; i++) {
          const l = rng.pick(ls);
          if (l.source.kind === 'parents') continue;
          const level = rng.pick(LEVELS);
          const { out: items } = sampleLesson(l, level, rng.int(1, 1e6), 4);
          if (!items.length) continue;
          const { item } = rng.pick(items);
          const txt = describeItem(item);
          if (vus.has(txt)) continue;
          vus.add(txt);
          lignes.push(`${lignes.length + 1}. ${l.id} [${level}] ${txt}`);
        }
        writeFileSync(join(out, `echantillon-${classe}-${gm}.txt`), lignes.join('\n'), 'utf8');
      }

    // l'audit ne doit trouver aucun item invalide
    const invalides = audits.flatMap((a) =>
      LEVELS.flatMap((lv) => a.niveaux[lv].erreurs.map((e) => `${a.lesson.id} [${lv}] ${e}`)),
    );
    expect(invalides).toEqual([]);
    expect(CTX.parentLists).toEqual([]);
  }, 1_200_000);
});
