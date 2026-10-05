# Architecture technique — Ludidactik

## 1. Principes
- **100 % client** (PWA) : aucune infrastructure serveur requise. Données dans IndexedDB (Dexie).
- **Découplage Contenu ↔ Mécanique** : une *leçon* produit des *items* typés ; un *jeu* consomme un ou plusieurs *types d'items*. → N jeux par notion, sans dupliquer le contenu.
- **Générateurs déterministes** (RNG seedé) pour le calcul, la conjugaison, les accords… ; **contenus statiques JSON** pour l'histoire, le vocabulaire, les textes de lecture.
- **Extensible par fichiers** : ajouter CE2 = ajouter `data/curriculum/ce2.json` + éventuels générateurs.

## 2. Arborescence cible

```
Ludidactik/
├─ CLAUDE.md, PROMPT_MAITRE.md, README.md
├─ .claude/ (agents, commands, settings)
├─ docs/ (specs, programmes, JOURNAL.md)
├─ data/
│  ├─ curriculum/ce1.json, cm2.json        # arbre classe → matière → domaine → leçon
│  ├─ dictees/ce1_mots.json, cm2_mots.json  # listes de mots par période / thème / niveau
│  ├─ histoire/cm2_questions.json, cm1_revolution.json
│  ├─ lecture/ (textes courts + questions)
│  └─ schemas/ (JSON Schema exportés depuis zod, pour info)
├─ resources/ (PDF officiels, SOURCES.md)
├─ scripts/ (téléchargement ressources, validation contenu)
├─ public/ (icônes, sons, polices, images libres de droits)
└─ src/
   ├─ app/              # routes, layout, providers
   ├─ screens/          # Accueil, Profils, Classe, Matière, Leçon, ChoixJeu, Bilan, Défis, Scores, Boutique, Île, Parents
   ├─ components/       # UI kit (Button, Card, Star, ProgressRing, Avatar/*, Keypad, LetterKeyboard, Mic, Speaker…)
   ├─ avatar/           # pièces SVG composables + catalogue boutique
   ├─ content/
   │  ├─ schemas.ts     # zod : Curriculum, Lesson, Item*, WordList, Question…
   │  ├─ loader.ts      # import JSON + validation + index
   │  └─ generators/    # math/*.ts, french/*.ts (conjugaison, accords, homophones…), index.ts (registry)
   ├─ engine/
   │  ├─ GameModule.ts  # interface
   │  ├─ GameHost.tsx   # cycle de vie partie
   │  ├─ score.ts       # étoiles, XP, pièces, records
   │  ├─ adaptivity.ts  # ajustement intra-niveau + répétition espacée (Leitner)
   │  ├─ rng.ts
   │  └─ answer.ts      # normalisation/comparaison des réponses (accents, majuscules, rectif. 1990, nombres)
   ├─ services/ speech.ts (TTS/STT), sfx.ts, haptics.ts, storage/db.ts (Dexie), auth.ts (PBKDF2)
   ├─ games/<id>/       # un dossier par jeu : index.ts (GameModule), Game.tsx, assets
   ├─ meta/             # défis quotidiens, badges, boutique, île, leaderboard
   └─ parents/          # espace parents
```

## 3. Modèle de contenu

### 3.1 Curriculum
```ts
type Level = 'facile' | 'normal' | 'plus_loin';
type Modality = 'ecrire' | 'ecouter' | 'parler' | 'regarder' | 'manipuler';

interface Lesson {
  id: string;                 // ex. "CE1.MA.CALC.TABLES_MULT"
  classe: 'CP'|'CE1'|'CE2'|'CM1'|'CM2';
  matiere: 'francais'|'maths'|'histoire'|'geographie'|'sciences'|'emc'|'anglais';
  domaine: string;            // ex. "Calcul mental"
  titre: string;              // titre enfant : "Les tables de multiplication"
  boRef: string;              // ex. "BO41-2024 C2 Maths — Calcul mental — Mémoriser des faits numériques"
  programme: '2020'|'2024'|'2025'|'2026';
  periodes: number[];         // 1..5
  source: { kind: 'generator'; generator: string; params: Record<Level, unknown> }
        | { kind: 'static'; file: string; filter?: Record<string, unknown> };
  itemKinds: ItemKind[];      // types d'items produits → détermine les jeux compatibles
  niveaux: Record<Level, string>;   // description lisible parent/enseignant
  rappel: string;             // la règle en une phrase d'enfant (affichée après erreur)
}
```

### 3.2 Types d'items (le « contrat » entre contenu et jeux)
| ItemKind | Forme | Exemples de jeux |
|---|---|---|
| `numeric_answer` | prompt (texte + oral), réponse numérique | Grand Prix, Fusée, Robot calculateur, Tables Ninja |
| `spelling_word` | mot, phrase-contexte, audio (TTS ou voix parent) | Ascension, Appareil photo, Mots croisés, Lettres en vrac, Bonhomme de neige |
| `mcq` | question, 2-4 choix, explication | Guillotine, Qui suis-je, Vrai/Faux express, Pêche |
| `true_false` | affirmation, booléen | Vrai/Faux express (swipe) |
| `ordering` | éléments à ordonner (dates, nombres, mots de phrase) | Machine à remonter le temps, Puzzle de phrases, Funambule |
| `classification` | éléments + catégories | Chef d'orchestre des mots, Laboratoire, Tri sélectif |
| `pairing` | paires (terme ↔ définition/image/résultat) | Memory, Dobble, Relie-moi |
| `fill_blank` | phrase à trou + options ou saisie | Forge du verbe, Pêche aux homophones, Train des accords |
| `number_line` | bornes, graduation, valeur cible | Funambule, Bataille navale graduée |
| `visual_fraction` | fraction, forme (pizza/barre/tablette) | Pizzaïolo, Chocolatier |
| `clock` | heure cible / durée | Horloger |
| `money` | prix, monnaie donnée | Petite épicerie |
| `geometry_shape` | figure, propriétés, grille | Géomètre, Miroir magique, Tangram |
| `map_point` | carte SVG, zone cible | Tour de France, Globe-trotteur |
| `read_aloud` | texte, nombre de mots | Karaoké de lecture (fluence MCLM) |
| `oral_answer` | prompt, réponses acceptées (variantes phonétiques) | Perroquet, Robot calculateur oral |
| `bar_model` | énoncé, schéma en barre, inconnue | Détective des problèmes |

Un jeu déclare `accepts: ItemKind[]`. Un écran « Choix du jeu » affiche **tous les jeux compatibles avec les itemKinds de la leçon**, groupés par modalité (icônes ✏️ 👂 🗣️ 👀 ✋).

### 3.3 Listes de mots parentales
```ts
interface WordList { id; profileIds: string[]; titre: string; semaine?: string;
  mots: { mot: string; phrase?: string; audioBlob?: Blob; classeGram?: string }[]; creeLe; }
```
Converties à la volée en items `spelling_word`. Saisie : un mot par ligne, ou collage d'une phrase (dictée de phrase : mode « dictée de phrases » dans l'Ascension).

## 4. Interface GameModule
```ts
interface GameModule {
  id: string; titre: string; description: string; icone: string;
  modalites: Modality[];           // ex. ['ecouter','ecrire']
  accepts: ItemKind[];
  classes: Classe[];               // où il a du sens
  dureeCible: number;              // secondes
  supportsDuel?: boolean;          // 2 joueurs même appareil
  needsMic?: boolean;
  component: React.LazyExoticComponent<React.FC<GameProps>>;
}
interface GameProps {
  items: AsyncIterable<Item> | Item[];  // flux (générateur) ou liste
  level: Level; profile: Profile; lesson: Lesson;
  onAnswer(r: AnswerEvent): void;       // {itemId, correct, ms, given, expected}
  onEnd(summary: GameSummary): void;
  speech: SpeechService; sfx: SfxService;
}
```
`GameHost` gère : écran de consigne (lue à voix haute), compte à rebours 3-2-1, pause, abandon, calcul du score, écran bilan, persistance, déblocage de badges.

## 5. Score, étoiles, adaptativité
- **Étoiles (0-3)** par (leçon, jeu, niveau) : 1★ ≥ 60 % juste, 2★ ≥ 80 %, 3★ ≥ 95 % ET temps ≤ cible.
- **Maîtrise d'une leçon** = moyenne pondérée des meilleurs résultats Normal (poids 2) + Plus loin (poids 1) + Facile (0,5), affichée en anneau.
- **Adaptativité intra-niveau** : 3 bonnes réponses d'affilée → items plus exigeants dans la fourchette du niveau ; 2 erreurs → items plus simples. Le niveau choisi n'est jamais changé sans l'enfant (proposition « Tu veux essayer le niveau suivant ? »).
- **Répétition espacée (Leitner 5 boîtes)** pour mots de dictée, faits numériques (tables), dates d'histoire : les items ratés reviennent plus souvent, y compris dans les défis quotidiens.

## 6. Stockage (Dexie)
Tables : `profiles`, `progress` (clé [profileId+lessonId+gameId+level]), `records` (meilleurs scores), `attempts` (journal compact, purgé > 90 j), `leitner`, `wordLists`, `dailyChallenges`, `inventory` (objets d'avatar), `settings`, `parent`.
Export/Import : fichier `ludidactik-sauvegarde-<date>.json` (blobs audio en base64).

## 7. Authentification locale
- Mot de passe texte : PBKDF2-SHA256 (WebCrypto), 100 000 itérations, sel 16 octets. **Ce n'est pas de la sécurité forte** (données locales) : c'est un verrou « familial / classe » pour séparer les profils. Le dire dans l'espace parents.
- Mot de passe image (CE1) : séquence de 4 pictos parmi 12 → hashée de même.
- Code parent séparé (4-6 chiffres) + question anti-enfant (ex. 7 × 8 + 13).
- Mot de passe oublié → réinitialisation par le code parent.

## 8. Voix
- **TTS** : `speechSynthesis`, sélection automatique de la meilleure voix `fr-FR` disponible (préférer « Google français », « Microsoft Denise/Henri Online (Natural) », « Amélie/Thomas » sur Apple). Débit réglable (0,7-1,0). Pour la dictée : mot seul, puis phrase-contexte, puis mot seul (protocole de dictée de classe).
- **STT** : `webkitSpeechRecognition` fr-FR si disponible et autorisé par le parent ; comparaison tolérante (normalisation, homophones acceptés pour les nombres « cent/sang »). **Repli** : bouton « Je l'ai dit ! » + auto-évaluation, ou bascule vers la modalité écrite. Option future hors-ligne : Vosk-browser (modèle fr small).
- Voix parent enregistrée (MediaRecorder) prioritaire sur le TTS pour les mots des listes parentales.

## 9. Normalisation des réponses (`engine/answer.ts`)
- Nombres : accepter espaces de milliers (« 12 500 »), virgule ou point décimal, zéros non significatifs au niveau Facile seulement.
- Orthographe : sensible aux accents (une faute d'accent = faute, mais feedback spécifique « il manque l'accent »), insensible à la casse sauf pour noms propres, accepter les rectifications de 1990 listées.
- Afficher la **différence lettre à lettre** en cas d'erreur (lettres manquantes/en trop colorées).

## 10. Performance & PWA
- Code-splitting par jeu (lazy), images SVG, sons < 50 ko, budget JS initial < 250 ko gz.
- Service worker : precache app shell + contenu JSON ; jeux mis en cache à la première ouverture.
- Cible : tablette Android d'entrée de gamme, 60 fps sur les animations (transform/opacity uniquement).
