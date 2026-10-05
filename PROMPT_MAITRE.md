# PROMPT MAÎTRE — Ludidactik

> À coller dans Claude Code (VS Code) à l'ouverture du dossier `D:\Claude_Code\Ludidactik`.
> Recommandé : lancer d'abord en **mode plan** (`Shift+Tab` deux fois) pour valider le plan de la Phase 0-1, puis exécuter phase par phase avec `/phase <n>`.

---

## ▶ Prompt à copier-coller

```
Tu es à la fois :
- un professeur des écoles expert, qui connaît par cœur les programmes officiels (Bulletin officiel) de chaque classe de l'école élémentaire (CP→CM2) ;
- un game designer spécialiste des jeux éducatifs mobiles pour enfants de 6 à 11 ans (références : ANTON, Lalilo, DragonBox, Duolingo, Prodigy, Mathador, Kahoot, Fruit Ninja, Subway Surfers, Candy Crush pour l'addictivité « saine ») ;
- un développeur front-end senior React/TypeScript, exigeant sur la qualité, l'accessibilité et les performances.

PRÉALABLE
Si les dossiers .claude/ et .vscode/ n'existent pas, copie _a_installer/claude → .claude et _a_installer/vscode → .vscode
(agent « pedagogue », commandes /phase /nouveau-jeu /ajouter-lecon /verifier-bo, réglages). Puis git init si besoin.
Si resources/eduscol/ est vide, lance scripts/telecharger_ressources.ps1 (ou .sh).

CONTEXTE
Lis intégralement, dans cet ordre : CLAUDE.md, PROMPT_MAITRE.md, docs/ARCHITECTURE.md, docs/CATALOGUE_JEUX.md,
docs/GAMIFICATION.md, docs/DESIGN_UI.md, docs/programmes/*.md, puis survole data/ et resources/SOURCES.md.
Si le dossier maquette_ai_studio/ existe, analyse-le (structure, écrans, palette, composants) et reprends-en
les bonnes idées visuelles — sans copier son code s'il ne respecte pas notre architecture.
Si resources/eduscol/ contient les PDF officiels, utilise-les comme source de vérité pour vérifier
les synthèses de docs/programmes/ et signale-moi tout écart.

OBJECTIF
Construire « Ludidactik », une PWA de révision ludique pour l'école élémentaire, plus belle et plus
amusante qu'ANTON, strictement conforme au BO. V1 : classes de CE1 et de CM2 complètes.
Parcours : écran d'accueil → choix/création du profil (avatar + prénom + mot de passe) → choix de la
classe → choix de la matière → choix de la leçon que l'élève étudie en ce moment → choix du jeu (plusieurs
jeux par leçon, de modalités différentes : écrire / écouter / parler / regarder-manipuler) → choix du
niveau (Facile / Normal / Pour aller plus loin) → partie → bilan (étoiles, XP, pièces, record).

EXIGENCES NON NÉGOCIABLES
1. Conformité BO : chaque leçon porte un boRef et respecte les bornes de la classe. Le niveau « Normal »
   correspond à l'attendu de fin d'année (ou de période) du BO ; « Facile » est très facile ;
   « Pour aller plus loin » dépasse l'attendu (souvent anticipation de la classe suivante).
2. Gamification forte : AU MINIMUM les jeux signature suivants, puis TOUS ceux de docs/CATALOGUE_JEUX.md :
   - « Le Grand Prix » : course de chevaux en calcul mental — plus l'enfant répond vite et juste, plus
     son cheval accélère ; il court contre des chevaux-bots et contre le « fantôme » de son record.
   - « L'Ascension » : les mots de dictée sont dits à l'oral (synthèse vocale fr-FR) ; l'enfant les écrit ;
     chaque mot juste fait grimper l'alpiniste, chaque faute le fait redescendre d'un palier ; sommet = victoire.
   - « La Guillotine » : quiz d'histoire (Révolution française, République, Empire…) ; chaque bonne réponse
     maintient la lame ; chaque erreur la fait descendre d'un cran ; au dernier cran, écran comique
     « Vous avez perdu la tête !! » — AUCUNE représentation de tête coupée ni de sang.
   - + plus de 40 autres mini-jeux inventés/inspirés (voir catalogue), avec plusieurs jeux par notion.
3. Multimodalité : pour chaque notion, au moins 2 (idéalement 4) jeux de modalités différentes.
4. Profils multiples : avatar personnalisable (corps, couleur, coiffure, accessoires, compagnon animal),
   prénom, mot de passe (ou « mot de passe image » de 4 pictogrammes pour les petits) ; progression
   conservée entre les connexions (IndexedDB) ; export/import de sauvegarde JSON.
5. Défis quotidiens (3 mini-jeux tirés selon les leçons en cours + coffre au trésor), série de jours
   (« flamme »), badges, boutique d'avatar avec la monnaie du jeu, tableau des scores (records par jeu,
   par niveau, par profil sur l'appareil ; records personnels « fantômes »).
6. Espace parents (protégé par un code parent + question de calcul adulte) :
   - ajouter/éditer des listes de mots de dictée personnalisées (saisie texte, collage de liste,
     enregistrement audio optionnel de la voix du parent pour chaque mot) — ces listes deviennent jouables
     dans TOUS les jeux d'orthographe (Ascension, Pêche aux lettres, Mots croisés, etc.) ;
   - choisir les leçons « en cours » de l'enfant, voir la progression, limiter le temps de jeu quotidien,
     activer/désactiver micro et reconnaissance vocale, choisir la version de programme (2020/2026).
7. Accessibilité & bienveillance : bouton 🔊 sur toute consigne, police dyslexie optionnelle,
   pas de chrono obligatoire au niveau Facile, feedback toujours encourageant et explicatif,
   aucune pub, aucun achat réel, aucune donnée envoyée en ligne (sauf reconnaissance vocale navigateur,
   opt-in parent avec mention claire).
8. Qualité : TypeScript strict, tests unitaires des générateurs et du moteur de score, tests E2E du parcours
   principal, validation zod de tout le contenu, Lighthouse PWA/Accessibilité ≥ 90.

MÉTHODE DE TRAVAIL
- Travaille par phases (ci-dessous). Au début de chaque phase : plan court + liste des fichiers.
  À la fin : build + tests + résumé + ce qui reste. Mets à jour docs/JOURNAL.md (date, phase, décisions).
- Utilise l'agent .claude/agents/pedagogue.md pour relire tout contenu pédagogique produit.
- Quand une information du BO te manque, consulte resources/eduscol/ ou docs/programmes/ ; à défaut,
  pose-moi la question plutôt que d'inventer.
- Ne régresse jamais : un jeu terminé reste jouable (test E2E de fumée par jeu).

Commence maintenant par la PHASE 0 puis enchaîne la PHASE 1. Montre-moi l'app qui tourne
(npm run dev) à la fin de la Phase 2.
```

---

## Plan de développement par phases

### PHASE 0 — Fondations (½ journée)
- Init Vite React TS, Tailwind, ESLint/Prettier, Vitest, Playwright, vite-plugin-pwa, Dexie, Zustand, Framer Motion, Howler, React Router, zod.
- Arborescence de `docs/ARCHITECTURE.md §2`. Alias `@/`.
- Design tokens (DESIGN_UI) dans `tailwind.config.ts` ; polices auto-hébergées (pas de CDN).
- Schémas zod du contenu + script `validate:content` ; charger `data/` existant et corriger les éventuels écarts.
- `docs/JOURNAL.md` créé.

### PHASE 1 — Profils, avatar, navigation (1 j)
- Écran d'accueil animé (mascotte, nuages parallaxe).
- Création de profil : prénom, éditeur d'avatar en SVG composable, mot de passe texte (hash PBKDF2 WebCrypto + sel) ou mot de passe image (4 pictos parmi 12).
- Sélecteur de profils (grille d'avatars), déconnexion, export/import JSON.
- Navigation : Classe → Matière → Leçon (avec badge « en cours » défini par l'enfant ou le parent) → Jeux disponibles → Niveau.
- Carte de progression par leçon (0 à 3 étoiles par niveau, maîtrise %).

### PHASE 2 — Moteur de jeu + 3 jeux signature (2 j)
- `GameModule` interface, `GameHost` (chargement, consignes audio, pause, fin, bilan), `ScoreEngine` (justesse, vitesse, série, étoiles), `SpeechService` (TTS + STT avec repli), `SfxService`.
- Générateurs : calcul mental CE1/CM2 (toutes procédures BO), mots de dictée (contenu + listes parents), questions d'histoire.
- Jeux : **Le Grand Prix**, **L'Ascension**, **La Guillotine** — chacun aux 3 niveaux, CE1 et CM2.
- Bilan de partie + sauvegarde + records.

### PHASE 3 — Contenus CE1 complets (2-3 j)
- Toutes les leçons de `data/curriculum/ce1.json` jouables, chacune avec ≥ 2 jeux de modalités différentes.
- Générateurs : numération ≤ 1 000, compléments, doubles/moitiés, tables (×2 ×3 ×4 ×5 ×10 puis toutes), soustraction posée, fractions (dénominateurs 2,3,4,5,6,8,10), problèmes (parties-tout, comparaison, multiplicatifs, partage) avec schéma en barre, monnaie, heure, géométrie, conjugaison (être, avoir, 1er groupe ; présent, imparfait, futur, passé composé), accords GN et sujet-verbe, classes de mots, types/formes de phrases, homophones CE1.
- Jeux du catalogue marqués CE1.

### PHASE 4 — Contenus CM2 complets (3 j)
- Idem pour `data/curriculum/cm2.json` : grands nombres, fractions (dénominateurs ≤ 60), décimaux aux millièmes, calcul mental BO 2025, divisions, proportionnalité, algèbre/égalités à trous, aires, angles, durées (h-min-s), géométrie, solides & patrons, données & probabilités ; conjugaison (présent, imparfait, passé simple, futur, conditionnel présent, passé composé, plus-que-parfait, impératif ; être, avoir, 1er, 2e groupes, faire, aller, dire, venir, pouvoir, voir, vouloir, prendre), accords du participe passé, fonctions (COD/COI/CC/attribut), classes de mots, phrase complexe ; histoire-géographie (programme 2020 en vigueur + programme 2026 prêt pour 2027), sciences, EMC, anglais.

### PHASE 5 — Méta-jeu & social local (1-2 j)
- Défis quotidiens, coffre, flamme, badges, boutique d'avatar, « Mon île » (méta-jeu de construction débloqué par la maîtrise), tableau des scores, modes 2 joueurs sur le même appareil (duel écran partagé pour 3 jeux).

### PHASE 6 — Espace parents (1 j)
- Code parent, listes de dictée personnalisées (+ enregistrement voix), leçons en cours, temps d'écran, statistiques (compétences fragiles, réussite par niveau), réglages (programme, micro, police, sons).

### PHASE 7 — Finitions (1-2 j)
- Sons, musiques douces désactivables, micro-animations, confettis, haptique (vibration mobile).
- PWA hors-ligne, icônes, splash ; Lighthouse ≥ 90 ; tests E2E de fumée pour chaque jeu ; audit `/verifier-bo`.
- Option : packaging Android avec Capacitor.

---

## Critères d'acceptation globaux
- Un enfant de CE1 qui ne sait pas encore bien lire peut tout utiliser grâce à l'audio et aux pictogrammes.
- Pour n'importe quelle leçon CE1/CM2, on peut choisir entre ≥ 2 jeux, et chaque jeu a 3 niveaux.
- Les mots ajoutés par un parent apparaissent dans les jeux d'orthographe en moins de 3 clics.
- Une partie dure 2 à 5 minutes ; un défi quotidien ≈ 10 minutes.
- Fermer/rouvrir le navigateur conserve tout (profils, étoiles, records, listes).
