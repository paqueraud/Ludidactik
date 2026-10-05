# Guide de développement — jeux et contenus

À lire avant d'ajouter un mini-jeu ou du contenu. Complète CLAUDE.md, docs/ARCHITECTURE.md et docs/CATALOGUE_JEUX.md.

## 1. Le principe : contenu ↔ jeux découplés

```
leçon (data/curriculum)  →  module de contenu (src/content/modules/<domaine>)  →  items typés  →  jeux
                                   + listes de mots, banques de questions          (src/content/items.ts)
                                   + adaptateurs (src/content/adapters.ts)
```

- Un **item** est l'unité d'exercice. Les 17 types et leurs champs sont définis dans `src/content/items.ts`
  (zod). Exemples concrets de chaque type : `src/games/_kit/fixtures.ts`.
- Un **jeu** déclare `accepts: ItemKind[]` (par ordre de préférence) et ne contient **aucun contenu pédagogique en dur**.
- Les **adaptateurs** dérivent des types manquants : numérique → QCM / vrai-faux / paires / oral ;
  QCM → vrai-faux / paires ; mot de dictée → QCM « bonne orthographe » / vrai-faux ; phrase à trou → QCM / vrai-faux.
- Le choix des jeux d'une leçon est **calculé** (`gamesForLesson`) d'après le contenu réellement disponible.

## 2. Ajouter un mini-jeu

1. Créer `src/games/<id>/index.ts` qui **exporte par défaut** un `GameModule` (voir `src/engine/GameModule.ts`) :
   `id`, `numero` (n° du catalogue), `titre`, `description`, `consigne` (lue à voix haute), `icone` (emoji),
   `couleur` (dégradé Tailwind `from-x to-y`), `modalites`, `accepts`, `classes`, `dureeCible`, `minItems`,
   éventuellement `filterItem`, `lessons` (restreindre à certaines leçons), `needsMic`, `supportsDuel`,
   et `component: lazy(() => import('./MonJeu'))`.
   → Le jeu est **découvert automatiquement** (pas de registre à modifier).
2. Le composant reçoit `GameProps` : `stream.next(target())` donne l'item suivant ; appeler `onAnswer` à chaque
   réponse et `onEnd` une fois. **Utiliser le kit** `src/games/_kit/` :
   - `useGameSession({ paused, onAnswer, onEnd })` → `answer(item, correct, given, expected)`, `startQuestion()`,
     `end({ won, headline, score? })`, `stats` ;
   - `GameLayout`, `Prompt`, `ChoiceGrid` (clavier A-F/1-6), `Feedback` (juste / « Presque ! » + correction +
     Continuer/Entrée), `Hud`, `Vies` ; `useAutoSpeak`, `useEnterKey`, `parNiveau`.
   - Composants partagés : `Keypad`, `LetterKeyboard`, `usePhysicalKeyboard` (`src/components/Keypads.tsx`),
     `Button`, `SpeakButton`, `Stars` (`src/components/ui.tsx`), `Avatar`, `Confetti`, `Ludo`.
3. **Règles de jeu obligatoires**
   - 3 niveaux : **Facile** = pas de chrono bloquant, indices, vies bonus · **Normal** = rythme attendu, 1 indice ·
     **Plus loin** = plus rapide, sans indice. Une partie dure 2 à 5 min (≈ 6 à 15 manches).
   - Après une erreur : bonne réponse + `item.explication`, ton encourageant (« Presque ! », « On réessaie ? »),
     jamais de points retirés.
   - Jouable **au tactile ET au clavier** (toute manipulation glisser-déposer a une alternative « toucher puis
     toucher » et des touches). Cibles ≥ 48 px. Tout texte important a un bouton 🔊 (`SpeakButton`), lecture auto
     si `lectureAuto`. Respecter `paused` (figer les chronos/animations) et `prefers-reduced-motion`.
   - Animations : Framer Motion, transform/opacity. Visuels : SVG/emoji originaux, aucune image externe, aucune
     violence. Sons : `sfx.play('juste' | 'faux' | 'pop' | 'etoile' | 'fanfare' | 'monte' | 'glisse' | …)`.
   - Mise en page testée à **360 px** et **1280 px** sans défilement horizontal.
   - Micro (`needsMic`) : `speech.listen()` renvoie `null` si indisponible → **repli** obligatoire (saisie, ou
     bouton « Je l'ai dit ! » + auto-évaluation). Le micro n'est utilisé que si le réglage parent l'autorise
     (`useSettings().micro`).
4. **Tester dans le Labo** : `npm run dev` puis `http://localhost:5173/labo/<id>?niveau=facile|normal|plus_loin`
   (`&type=<ItemKind>` pour forcer un type). Ajouter un **test E2E de fumée** `tests/e2e/jeux/<id>.spec.ts` qui
   ouvre le Labo, joue au moins une manche (juste et/ou fausse) et vérifie l'absence d'erreur console.
   Modèle : `tests/e2e/jeux/signature.spec.ts`.

## 3. Ajouter du contenu

1. Chaque domaine a son dossier `src/content/modules/<domaine>/index.ts` qui exporte `contenu: ContentModule` :
   ```ts
   export const contenu: ContentModule = {
     'CE1.MA.NUM.COMPARER': {
       gens: { mcq: genComparer, number_line: genDroite },   // générateurs (flux infini, fonctions pures de rng)
       pools: { ordering: poolRanger },                        // banques finies
     },
   };
   ```
   Signature : `(level: Level, rng: Rng, ctx: GenContext) => Item` (gens) ou `=> Item[]` (pools).
   Tout item a `id` unique, `lessonId = ctx.lesson.id`, une `explication` d'enfant, et respecte `checkItem`.
2. **Tests obligatoires** (`*.test.ts` à côté) : pour chaque leçon × niveau, ~200 tirages → `checkItem(item)` vide,
   bornes BO de la classe respectées (CE1 : entiers ≤ 1 000 ; CM2 : ≤ 999 999 999, décimaux ≤ millièmes,
   dénominateurs ≤ 60), réponse juste (recalculée indépendamment quand c'est possible).
3. Dans `data/curriculum/<classe>.json`, **pour les leçons de son domaine uniquement** : remplacer `rappel: "TODO…"`
   par la règle en une phrase d'enfant, rendre le `titre` lisible par un enfant (le détail technique peut aller
   dans `contenus`), ajuster `itemKinds`, `periodes`, et `source.generator` (nom informatif sans « TODO: »).
4. Banques statiques possibles en JSON (validées par zod) : `data/questions/*.json` (QCM / vrai-faux,
   format de `QuestionSchema`), `data/dictees/*.json` (listes de mots). `npm run validate:content` doit rester à 0 erreur.
5. Conformité : niveau **Normal = attendu BO de fin d'année**, Facile très facile, Plus loin au-delà.
   Toute notion hors programme de la classe est étiquetée « Pour aller plus loin ». Sources :
   `docs/programmes/*.md` et `docs/programmes/VERIFICATION_PDF.md` (écarts relevés dans les PDF officiels).
   Thèmes sensibles (guerres, Shoah, esclavage, exécutions) : ton sobre, `guillotine: false`.

## 4. Fichiers partagés — ne pas modifier sans coordination

`src/content/items.ts`, `schemas.ts`, `provider.ts`, `adapters.ts`, `registry.ts`, `modules/index.ts`,
`src/games/registry.ts`, `src/games/_kit/*`, `src/engine/*`, `src/screens/*`, `package.json`.
Besoin d'un champ en plus sur un item ? Utiliser `meta` (objet libre). Besoin d'un utilitaire ? Le créer dans son
propre dossier. **Aucune nouvelle dépendance npm.**

## 5. Vérifications avant de livrer

```bash
npx tsc -b && npm run lint && npm test && npm run validate:content
E2E_PORT=4174 npx playwright test tests/e2e/jeux/<id>.spec.ts --project=tablette --project=mobile
```

## 6. Conventions `meta` partagées entre contenus et jeux

Les jeux spécialisés reconnaissent ces formes d'items ; les modules de contenu les produisent pour les leçons
concernées. Un jeu doit **ignorer** proprement un item qui n'a pas le `meta` attendu (ou filtrer via `filterItem`).

| Notion | Type d'item | Convention |
|---|---|---|
| Comparer (<, =, >) — Crocodiles | `mcq` | `choices = ['<', '=', '>']`, `meta.gauche` / `meta.droite` (écritures affichées, ex. « 3,5 » et « 3,45 ») |
| Dictée de nombres — Perroquet | `numeric_answer` | `meta.dictee = true` ; `spoken` = nombre à dire ; `prompt` = « Écris le nombre que tu entends » |
| Nombres en lettres | `fill_blank` ou `mcq` | `meta.lettres = true` (réponse en lettres, graphies de `graphiesNombre` acceptées) |
| Construire un nombre — Bâtisseur | `numeric_answer` | `meta.construire = true` ; `answer` = nombre à construire (entier ou décimal) |
| Compléments — Fusée | `numeric_answer` | `meta.complement = { depart, cible }` |
| ×/÷ 10, 100, 1 000 — Ascenseur de la virgule | `numeric_answer` | `meta.glisse = { nombre, operation: '×' \| '÷', facteur }` |
| Opération posée — Grand Huit | `numeric_answer` | `meta.posee = { a, b, op: '+' \| '−' \| '×' \| '÷' }` |
| Programme de calcul — Machine | `numeric_answer` | `meta.programme = { etapes: ['× 3', '+ 5'], entree: number \| null, sortie: number \| null }` (null = inconnue à trouver) |
| Suite de motifs | `numeric_answer` | `meta.suite = { termes: number[], etape: number }` |
| Proportionnalité — Pâtissier | `numeric_answer` | `meta.tableau = { entetes: [string, string], lignes: [number \| null, number \| null][] }` |
| Données — Station météo | `mcq` ou `numeric_answer` | `meta.graphique = { type: 'barres' \| 'tableau' \| 'courbe', titre, etiquettes: string[], valeurs: number[], unite }` |
| Mesurer — Mesureur | `numeric_answer` | `meta.mesure = { objet: emoji, longueur: number, unite: 'cm' \| 'mm' }` (règle virtuelle) |
| Probabilités — Roue | `classification` | `categories = ['impossible', 'peu probable', 'probable', 'certain']` |
| Déplacements — Robot codeur | `geometry_shape` | `shape: 'robot'`, `meta.robot = { cols, rows, depart: [x,y], cible: [x,y], obstacles: [x,y][], relatif: boolean }` |
| Symétrie — Miroir | `geometry_shape` | `task: 'symetrie'`, `grid` (cases à symétriser, axe) |
| Lettre muette — Chasse | `fill_blank` | `meta.famille = 'chanter'` (mot de la même famille qui fait entendre la lettre) |
| Conjugaison — Forge | `fill_blank` | champ `conjugaison = { sujet, verbe, temps }` |
| Homophones — Pêche | `fill_blank` | `choices` (a/à…) + `hint` (substitution) |
| Accords — Train | `fill_blank` | `choices` (formes accordées) ; `meta.groupe` = mots du GN ; `meta.lemme` = mot de base à accorder (affiché en Plus loin) |
| Fonctions — Labo des fonctions | `classification` | `meta.phrase` ; `elements` = groupes de la phrase, `categories` = fonctions |
| Ponctuation — Feu tricolore | `mcq` | `choices = ['.', '?', '!']`, `meta.phrase` (sans ponctuation finale) ; `spoken` = phrase avec l'intonation |
| Compréhension — Détective du texte | `mcq` | `meta.texte`, `meta.titre`, `meta.preuve` (phrase qui justifie) |
| Qui suis-je ? | `mcq` | `hints` : 3 à 5 indices du plus difficile au plus facile |
| Anglais — Jacques a dit | `pairing` (mot ↔ emoji), `mcq` / `oral_answer` avec `lang: 'en-GB'` | |
| Frise — Machine à remonter le temps | `ordering` | `mode: 'chrono'`, `labels` = dates |
| Cartes — Tour de France | `map_point` | `map` ∈ `france-regions`, `france-fleuves`, `france-massifs`, `europe`, `monde` |
| Mots de dictée (mots croisés, bonhomme de neige) | `spelling_word` | `definition` : courte définition d'enfant, fortement recommandée |
