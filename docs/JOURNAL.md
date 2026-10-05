# Journal de bord — Ludidactik

| Date | Phase | Décisions / changements |
|---|---|---|
| 2026-10-04 | Préparation | Dossier préparé : CLAUDE.md, PROMPT_MAITRE.md, docs (architecture, catalogue de 56 jeux, gamification, design, synthèses BO CE1/CM2 + calendrier), data de départ (203 leçons, 329 mots de dictée, 49 questions d'histoire, 4 textes), agent pedagogue, commandes slash, scripts de téléchargement des PDF officiels. Stack retenue : Vite + React + TS + Tailwind + Dexie (PWA hors-ligne). |
| 2026-10-05 | 0 — Fondations | Voir détail ci-dessous. |
| 2026-10-05 | 1 — Profils, avatar, navigation | Voir détail ci-dessous. |
| 2026-10-05 | 2 — Moteur + 3 jeux signature | Voir détail ci-dessous. |

---

## 2026-10-05 — Phases 0, 1 et 2

### Phase 0 — Fondations
- **Versions** : Vite 8, React 18.3, TypeScript 5.9 strict (TS 7 pas encore pris en charge par typescript-eslint), Tailwind 3.4 (`tailwind.config.ts`), zod 4, Dexie 4, Zustand 5, Framer Motion, React Router 7, vite-plugin-pwa 2, Vitest 5, Playwright 1.63.
- **Design tokens** DESIGN_UI en variables CSS (canaux RGB) → mode sombre automatique ; polices Baloo 2 / Andika / OpenDyslexic **auto-hébergées** (@fontsource, sous-ensemble latin).
- **Sons** : synthétisés en Web Audio (marimba doux) — aucun fichier, aucun réseau. Howler reste installé pour de futurs fichiers audio (musique, Phase 7).
- **PDF officiels** téléchargés (16 fichiers). Vérification des synthèses → `docs/programmes/VERIFICATION_PDF.md` (écarts à arbitrer, voir « À décider »).
- **Schémas zod** (`src/content/schemas.ts`) + `npm run validate:content` (0 erreur ; 152 avertissements = rappels « TODO » à rédiger en Phases 3-4).
- **Écarts de données corrigés** :
  - `domaine` contenait du markdown et des notes internes (« (à vérifier PDF) », « A. Histoire — programme 2020… ») → domaines lisibles par l'enfant (« Le temps », « Le vivant », « Le temps de la République »…).
  - `titre` / `niveaux` : `**gras**` retiré ; suffixes « — P1 » des thèmes 2026 → champ `periodes`.
  - 34 leçons sans `niveaux` (histoire, géographie, sciences, EMC, oral) → niveaux génériques issus des synthèses.
  - `boRef` « Voir docs/… » → références officielles (BO n°31 du 30/07/2020 pour les programmes 2020 ; BO n°22 du 28/05/2026 pour HG 2026).
  - Champ `periodes` ajouté (1-5) ; `programme: "en_vigueur"` accepté pour EMC/anglais CE1 (version à confirmer).
  - Matière `questionner_le_monde` ajoutée à l'enum ; source `{ kind: "parents" }` pour les listes parentales.
  - `phrasesDictee` (dictées de phrases) intégré au schéma et utilisé au niveau « Pour aller plus loin » de l'Ascension.
  - Questions de lecture de type `ordering` acceptées ; `preuve` facultative (questions de vocabulaire).

### Phase 1 — Profils, avatar, navigation
- Accueil animé (Ludo le hibou-explorateur, île, nuages qui dérivent, parallaxe au pointeur, `prefers-reduced-motion` respecté).
- Création de profil en 3 étapes : prénom + classe, **avatar SVG composable** (visage, teint ×8, yeux, bouche, coiffure ×8 + couleur, haut, accessoire, compagnon), mot de passe **texte** ou **image** (4 pictos parmi 12) — PBKDF2-SHA256 100 000 itérations + sel 16 octets.
- Sélecteur de profils, connexion (validation automatique du mot de passe image), « Mon profil » (avatar, niveau/XP, Ludis, sauvegarde, changer de joueur).
- **Session** conservée pour l'onglet (sessionStorage) : fermer le navigateur redemande le mot de passe ; toutes les données restent dans IndexedDB.
- **Export / import** JSON (`ludidactik-sauvegarde-<date>.json`, blobs audio en base64) — testé.
- Parcours Classe → Matière → Leçon → Jeu → Niveau, avec filtre par période (période actuelle surlignée — idée reprise de la maquette AI Studio), épingle « leçon en cours », étoiles par niveau, anneau de maîtrise, « Bientôt » si pas encore de jeu.
- Règle de déblocage : « Pour aller plus loin » s'ouvre avec 1★ en Normal sur la leçon (GAMIFICATION §1).

### Phase 2 — Moteur et jeux signature
- `GameModule` / `GameHost` (consigne lue à voix haute, 3-2-1, pause/reprendre/recommencer/quitter, bilan animé : étoiles, XP, Ludis, record, « À revoir »), `ScoreEngine`, adaptativité intra-niveau, Leitner 5 boîtes, `SpeechService` (meilleure voix fr-FR, protocole mot-phrase-mot, voix parent prioritaire, STT avec repli), `SfxService`.
- **Fournisseur d'items** (`content/provider.ts`) : générateurs / listes de mots / banques de questions / listes parentales → flux d'items ; le choix des jeux d'une leçon est calculé à partir du contenu réellement disponible.
- **Générateurs de calcul mental** : 9 leçons CE1 + 10 leçons CM2 × 3 niveaux, explications par item. Tests : bornes BO (CE1 ≤ 1 000), cohérence énoncé ↔ réponse sur 400 tirages par niveau, reproductibilité.
- **Le Grand Prix** : course au rythme des bonnes réponses (allure pas/trot/galop selon la vitesse), 2 chevaux-bots calibrés par niveau, fantôme du record, barre turbo (masquée en Facile), chrono figé pendant la lecture d'une correction.
- **L'Ascension** : dictée (voix parent ou TTS, mot-phrase-mot), 1re lettre donnée en Facile, réécoutes limitées en Normal/Plus loin, glissade + différence lettre à lettre + **copie active** du mot juste, météo qui change, dictée de phrases en Plus loin, repli « mot affiché 3 s » sans synthèse vocale.
- **La Guillotine** : décor papier découpé, lame qui descend d'un cran par erreur et remonte après 3 bonnes réponses, cocardes de protection en Facile, saisie de l'année en Plus loin, écran comique « Vous avez perdu la tête !! » (bonnet phrygien qui s'envole, aucune tête ni corps), « La Nation vous acquitte ! ». Thèmes sensibles exclus par filtre (`guillotine: false`).
- **CE1** : nouvelle banque `data/questions/ce1_questions.json` (calendrier, autrefois, symboles de la République — 33 questions) pour que la Guillotine soit jouable en CE1.
- **Relecture pédagogue** appliquée : q009/q023/q031/q046 exclues de la Guillotine (exécution de Louis XVI, esclavage, travail des enfants), distracteurs « Code noir » et « Travail, Famille, Patrie » remplacés, 6 questions CE1 reformulées, rappels CM2 orthographe rédigés, procédures CE1 (moitié de 470 en Normal) et CM2 (décimal ± entier) recalées.
- **Bugs trouvés et corrigés pendant les tests** : débordement horizontal à 360 px (éditeur d'avatar), jambes des chevaux détachées en grand écran (origine de rotation CSS ≠ viewBox → `animateTransform`), alpiniste mal placé quand la carte s'étire, délai Leitner décalé (un mot raté revenait le lendemain au lieu de tout de suite).
- **Hébergement** : GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`), voir `docs/HEBERGEMENT.md`.

### Qualité (fin de Phase 2)
- `npm run lint` : 0 erreur · `npm test` : 84 tests verts · `npm run validate:content` : 0 erreur · `npm run build` : OK (JS initial ≈ 231 ko gzip) · `npm run test:e2e` : 6/6 (parcours + 3 jeux, mobile Pixel 7 et 1280 px, sans erreur console).

### À décider (questions pour Nicolas)
Voir `docs/programmes/VERIFICATION_PDF.md` : conditionnel et impératif présent relèvent de la **6e** selon le BO 2025 (la synthèse les plaçait au CM2) ; symétrie axiale absente du BO CE1 (CE2) ; homophones non mentionnés explicitement dans les programmes 2024/2025 ; dates d'application HG/sciences/LV à confirmer dans les arrêtés.

### Reste à faire (prochaines phases)
- Phase 3-4 : 160 leçons encore « Bientôt » (générateurs à écrire), titres de leçons à rendre plus « enfant », ≥ 2 jeux de modalités différentes par leçon (aujourd'hui une leçon de calcul n'a que le Grand Prix), EMC et anglais CM2 absents du curriculum.
- Phase 5 : défis quotidiens, coffre, flamme, badges, boutique (pièces déjà marquées « boutique » dans l'éditeur), île, tableau des scores, duel.
- Phase 6 : espace parents (page provisoire en place).
- Phase 7 : Lighthouse, découpage du bundle (contenu JSON chargé à la demande), musique.
