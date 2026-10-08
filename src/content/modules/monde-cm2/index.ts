/**
 * Module de contenu « monde-cm2 » — voir docs/GUIDE_DEV_JEUX_CONTENU.md.
 * Histoire (programmes 2020 et 2026, rappel CM1), géographie (2020 et 2026), sciences et technologie (2020),
 * EMC et anglais du CM2. Chaque leçon est décrite par une fiche déclarative (`outils.ts`) transformée en
 * banques d'items (`pools`) ; les QCM simples d'histoire complètent la banque `data/histoire/cm2_questions.json`.
 * Les mots-clés à savoir écrire (`mots-cles.ts`) rendent jouables les jeux d'écriture.
 */
import { motsDe, poolMotsCles } from '../../generators/mots-cles';
import type { ContentModule, LessonContent } from '../../registry';
import { ANGLAIS } from './anglais';
import { EMC } from './emc';
import { GEOGRAPHIE } from './geographie';
import { HISTOIRE_2020 } from './histoire2020';
import { HISTOIRE_2026 } from './histoire2026';
import { completer } from './complements';
import { MOTS_CM2 } from './mots-cles';
import { type Fiche, contenuDe } from './outils';
import { SCIENCES } from './sciences';

/** Fiches des leçons, avec les compléments du 08/10/2026 (`complements.ts`). */
export const FICHES: Fiche[] = [
  ...HISTOIRE_2020,
  ...HISTOIRE_2026,
  ...GEOGRAPHIE,
  ...SCIENCES,
  ...EMC,
  ...ANGLAIS,
].map(completer);

/** Contenu d'une fiche, avec ses mots-clés à écrire s'il y en a. */
function contenuAvecMots(f: Fiche): LessonContent {
  const c = contenuDe(f);
  const mots = MOTS_CM2[f.lecon];
  return mots ? { ...c, pools: { ...c.pools, spelling_word: poolMotsCles(motsDe(mots)) } } : c;
}

export const contenu: ContentModule = Object.fromEntries(FICHES.map((f) => [f.lecon, contenuAvecMots(f)]));
