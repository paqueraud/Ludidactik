/**
 * npm run validate:content — valide tous les JSON de data/ contre les schémas zod.
 * Code de sortie 1 s'il y a au moins une erreur (les avertissements n'échouent pas).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseContent } from '../src/content/parse';

const root = join(import.meta.dirname, '..');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : [];
  });
}

const files: Record<string, unknown> = {};
for (const p of walk(join(root, 'data'))) {
  const key = relative(root, p).split('\\').join('/');
  try {
    files[key] = JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`✗ ${key} : JSON invalide — ${(e as Error).message}`);
    process.exit(1);
  }
}

const { index, issues } = parseContent(files);
const errors = issues.filter((i) => i.severity === 'erreur');
const warnings = issues.filter((i) => i.severity === 'avertissement');

for (const e of errors) console.error(`✗ ${e.file} — ${e.message}`);
if (process.argv.includes('--verbose')) for (const w of warnings) console.warn(`⚠ ${w.file} — ${w.message}`);

const lessons = [...index.lessons.values()];
const todo = warnings.filter((w) => w.message.includes('pas encore de contenu jouable')).length;
console.log(
  `\n${Object.keys(files).length} fichiers · ${lessons.length} leçons (${todo} pas encore jouables) · ` +
    `${index.wordLists.length} listes de mots · ${index.questions.length} questions`,
);
console.log(
  `${errors.length} erreur(s), ${warnings.length} avertissement(s)${warnings.length ? ' (--verbose pour le détail)' : ''}`,
);
process.exit(errors.length ? 1 : 0);
