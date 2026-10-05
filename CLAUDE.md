# CLAUDE.md — Ludidactik

> Mémoire projet pour Claude Code. Lis ce fichier en entier au début de chaque session.
> Langue de travail : **français** (code en anglais, UI/contenus/commentaires métier en français).

## 1. Mission

**Ludidactik** est une application web (PWA, installable sur tablette/PC/Android) de révision pour l'école élémentaire française, inspirée d'ANTON mais **plus belle, plus ludique et plus variée**.
L'élève choisit sa **classe**, puis la **leçon qu'il apprend en ce moment en classe**, puis un **jeu** parmi plusieurs qui font travailler cette même notion.

Priorités absolues, dans cet ordre :
1. **Conformité stricte aux programmes officiels** (Bulletin officiel) — voir `docs/programmes/`. Aucune notion hors programme sans être étiquetée « Pour aller plus loin ».
2. **Plaisir de jouer** : chaque leçon se révise via un mini-jeu, jamais via un simple QCM nu.
3. **Multimodalité** : pour chaque notion, au moins un jeu où l'on **écrit**, un où l'on **écoute**, un où l'on **parle**, un où l'on **regarde/manipule** (voir `docs/CATALOGUE_JEUX.md`).
4. **3 niveaux de difficulté partout** : `facile` (très facile, mise en confiance) · `normal` (attendu du BO pour la classe) · `plus_loin` (au-delà de l'attendu).
5. **Bienveillance et sécurité enfant** : pas de pub, pas d'achat, pas de données envoyées en ligne par défaut, pas d'image violente (la guillotine affiche « Vous avez perdu la tête !! », jamais de tête coupée).

Classes livrées en V1 : **CE1** et **CM2**. Architecture prête pour CP, CE2, CM1 (simple ajout de fichiers de contenu).

## 2. Documents de référence (à lire avant de coder une fonctionnalité)

| Fichier | Contenu |
|---|---|
| `PROMPT_MAITRE.md` | Le cahier des charges complet + plan de développement par phases |
| `docs/ARCHITECTURE.md` | Stack, arborescence, modèle de données, moteur de jeux, stockage, auth |
| `docs/CATALOGUE_JEUX.md` | Les ~50 mini-jeux, leurs modalités, notions, règles, 3 niveaux |
| `docs/GAMIFICATION.md` | XP, pièces, avatar, défis quotidiens, scores, séries, garde-fous |
| `docs/DESIGN_UI.md` | Direction artistique, palette, typographies, sons, animations, accessibilité |
| `docs/programmes/*.md` | Synthèses BO par classe et matière + calendrier d'entrée en vigueur |
| `data/` | Contenus de départ (curriculum JSON, listes de mots, questions d'histoire) |
| `resources/SOURCES.md` | Liens officiels Éduscol / BO (PDF) — script de téléchargement dans `scripts/` |
| `maquette_ai_studio/` | (si présent) export de la maquette Google AI Studio de Nicolas — s'en inspirer visuellement |

## 3. Stack technique (ne pas changer sans demander)

- **Vite + React 18 + TypeScript strict**
- **Tailwind CSS** + **Framer Motion** (animations) + **lucide-react** (icônes)
- **Zustand** (état) + **Dexie.js** (IndexedDB : profils, progression, scores, listes parentales)
- **React Router** (routes)
- **Howler.js** (sons) — sons courts libres de droits ou générés (Web Audio)
- **Web Speech API** : `speechSynthesis` (voix fr-FR pour dictées/consignes), `SpeechRecognition` (jeux oraux) avec **repli** gracieux si indisponible
- **vite-plugin-pwa** (hors-ligne, installable)
- **Vitest** + **Testing Library** (unitaires), **Playwright** (E2E — Chromium déjà installé si besoin)
- Option ultérieure : **Capacitor** pour APK Android

## 4. Commandes

```bash
npm install
npm run dev          # serveur de dev
npm run build        # build prod
npm run test         # vitest
npm run test:e2e     # playwright
npm run lint         # eslint + prettier
npm run validate:content   # vérifie tous les JSON de data/ contre les schémas zod
```

## 5. Règles de code

- Chaque jeu = un module autonome dans `src/games/<id-jeu>/` qui implémente l'interface `GameModule` (voir ARCHITECTURE §4). **Le jeu ne contient jamais de contenu pédagogique en dur** : il reçoit des `Item`s produits par un générateur ou un fichier de contenu. C'est ce découplage contenu/mécanique qui permet d'avoir plusieurs jeux pour une même notion.
- Les **générateurs** (calcul, conjugaison…) sont des fonctions pures, testées, paramétrées par `(classe, leçon, niveau, rng)`. Seed RNG pour tests reproductibles.
- Tout contenu (JSON) est validé par un schéma **zod** dans `src/content/schemas.ts`.
- Composants accessibles : tailles tactiles ≥ 48 px, contraste AA, tout son a un équivalent visuel, tout texte peut être lu à voix haute (bouton 🔊).
- Police lisible pour enfants (voir DESIGN_UI) ; option police **OpenDyslexic**.
- Pas de dépendance réseau au runtime (hors reconnaissance vocale navigateur, opt-in parent).
- Messages d'erreur à l'enfant : **toujours encourageants** (« Presque ! », « On réessaie ? »), jamais punitifs. Toujours montrer la bonne réponse + mini-explication après une erreur.
- Orthographe française irréprochable dans l'UI et les contenus (rectifications 1990 acceptées pour les réponses, ex. *connaitre/connaître* — le BO 2024 utilise l'orthographe rectifiée).

## 6. Conformité pédagogique (checklist pour toute nouvelle leçon/jeu)

- [ ] La leçon référence un identifiant de compétence BO (`boRef`) présent dans `docs/programmes/`.
- [ ] Les 3 niveaux sont définis et le niveau `normal` = attendu de fin d'année BO (ou de la période).
- [ ] Le contenu respecte les **bornes** de la classe (ex. CE1 : nombres ≤ 1 000 ; CM2 : ≤ 999 999 999, décimaux jusqu'aux millièmes).
- [ ] Il existe au moins 2 jeux différents pour la notion, de modalités différentes.
- [ ] Feedback correctif explicite (règle rappelée en une phrase d'enfant).
- [ ] Testé par l'agent `pedagogue` (`.claude/agents/pedagogue.md`).

## 7. Calendrier des programmes (IMPORTANT)

Année scolaire en cours : **2026-2027**.
- Français & maths CE1 : programmes BO n°41 du 31/10/2024 (en vigueur).
- Français & maths CM2 : programmes BO n°16 du 17/04/2025 (en vigueur au CM2 depuis la rentrée 2026).
- Histoire-géo, sciences, EPS **CE1 et CM2** : programmes 2020 encore en vigueur en 2026-2027 ; **nouveaux programmes (BO n°22 du 28/05/2026 et n°24 du 11/06/2026) applicables à la rentrée 2027**.
→ Le contenu porte un champ `programme: "2020" | "2024" | "2025" | "2026"` et un réglage parent « programme en vigueur » permet de basculer. Détails : `docs/programmes/00_CALENDRIER_PROGRAMMES.md`.

## 8. Définition de « terminé »

Build OK, lint OK, tests verts, contenu validé, jeu jouable aux 3 niveaux au clavier ET au tactile, lisible à voix haute, testé en largeur 360 px et 1280 px, aucune erreur console.

## 9. Commandes slash projet

- `/nouveau-jeu <nom>` — scaffolde un jeu conforme à l'interface
- `/ajouter-lecon <classe> <matière>` — ajoute une leçon au curriculum avec ses 3 niveaux
- `/verifier-bo` — audit de conformité du contenu vs `docs/programmes/`
- `/phase <n>` — exécute la phase n du `PROMPT_MAITRE.md`
