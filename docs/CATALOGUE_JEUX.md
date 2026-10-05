# Catalogue des mini-jeux — Ludidactik

> 56 mini-jeux. Légende modalités : ✏️ écrire · 👂 écouter · 🗣️ parler · 👀 regarder · ✋ manipuler (glisser, tracer, toucher).
> ⭐ = jeu signature (Phase 2). Chaque jeu est un `GameModule` ; il consomme des `ItemKind` (voir ARCHITECTURE §3.2), donc **le même jeu sert plusieurs leçons** et **chaque leçon a plusieurs jeux**.
> Les 3 niveaux règlent toujours : la difficulté des items (via la leçon), la pression temporelle, l'aide disponible.
> Règle générale des niveaux de jeu : **Facile** = pas de chrono bloquant, indices visuels, 3 vies bonus · **Normal** = rythme attendu, 1 indice · **Pour aller plus loin** = items au-delà du BO, chrono plus serré, pas d'indice, bonus ×1,5.

Inspirations : ANTON (structure leçons + jeux récompenses), Duolingo (séries, ligues, bilan), DragonBox (manipulation qui fait comprendre), Mathador (compte est bon), Fruit Ninja, Subway Surfers, Crossy Road (courses/réflexes), Candy Crush (combos), Wordle (déduction de lettres), Kahoot (quiz rythmé), Dobble, Memory, Tetris, Angry Birds (trajectoire), Mario Kart (fantômes), Animal Crossing (île/avatar), Lalilo (lecture à voix haute).

---

## A. NOMBRES & CALCUL

### ⭐ 1. Le Grand Prix (course de chevaux) — ✏️👀 (+🗣️ en option)
- **Items** : `numeric_answer` (calcul mental, tables, compléments, doubles/moitiés, ×10…)
- **Mécanique** : 4 couloirs. La vitesse du cheval = f(justesse, temps de réponse) : < 2 s → galop + poussière dorée, 2-5 s → trot, > 5 s → pas ; erreur → le cheval trébuche (0,8 s). Adversaires : 2 chevaux-bots calibrés sur le niveau + le **fantôme** du record personnel (silhouette translucide). Pavé numérique géant + clavier physique. Commentateur audio (« Et Tonnerre passe en tête ! »). Le cheval et sa robe se personnalisent dans la boutique.
- **Facile** : 6 calculs, bots lents. **Normal** : 12 calculs (cible BO CE1 : 12 résultats en 3 min ; tables : 8 en 1 min). **Plus loin** : 20 calculs, bots rapides, obstacles (haie = calcul en 2 étapes).
- **Addictif** : record à battre, médailles bronze/argent/or, trophée de saison.
- **Duel** : écran partagé haut/bas sur tablette.

### 2. Tables Ninja — 👀✋
- `numeric_answer` (résultats affichés sur des fruits). Une opération en haut (« 7 × 8 »), des fruits volent avec des nombres : trancher (swipe) le bon, éviter les bombes (mauvaises réponses fréquentes : 54, 48…). Combo x2/x3.
- Facile : tables ×2 ×5 ×10, fruits lents. Normal : toutes tables étudiées. Plus loin : divisions inverses (« 56 ÷ 8 »).

### 3. La Fusée des compléments — ✏️👀
- `numeric_answer`. Faire le plein : réservoir gradué, compléter à 10 / 100 / 1 000 (CE1), à l'unité/dizaine supérieure pour décimaux (CM2 : 3,7 + ? = 4). Chaque bonne réponse = un étage de fusée ; 10 étages = décollage animé vers une planète à collectionner (album des planètes).

### 4. Le Robot calculateur (oral) — 👂🗣️
- `numeric_answer` + `oral_answer`. Le robot énonce le calcul à l'oral, l'enfant répond **à voix haute** (STT). Repli : clavier. Entraîne le calcul mental « à l'ardoise » prévu par le BO (problèmes oraux brefs).

### 5. Le Perroquet des nombres (dictée de nombres) — 👂✏️
- Le perroquet dit un nombre ; l'enfant l'écrit en chiffres (CE1 ≤ 1 000 ; CM2 ≤ 999 999 999 et décimaux). Mode inverse : nombre affiché → choisir/écrire en lettres (piège : traits d'union, « cents », « vingts », rectifications 1990 acceptées).

### 6. Le Bâtisseur (matériel multibase virtuel) — ✋👀
- `numeric_answer` décomposition. Glisser plaques (100), barres (10), cubes (1) pour construire 635 ; échanges « 10 barres = 1 plaque » animés. CM2 : millièmes, dixièmes avec matériel décimal. Inspiré DragonBox : on comprend en manipulant.

### 7. Le Funambule (droite graduée) — ✋👀
- `number_line`. Placer le nombre sur le fil ; le funambule marche jusqu'à la position choisie ; si l'écart > tolérance, il tombe dans le filet (rigolo). CE1 : graduations 1/10/100. CM2 : fractions, décimaux, fractions > 1.

### 8. Bataille navale graduée — 👀✋
- `number_line`. Repérer un bateau ennemi par sa coordonnée sur une demi-droite graduée et tirer. Mode 2 joueurs.

### 9. Les Crocodiles gloutons (<, >, =) — 👀✋
- `mcq`. Le crocodile ouvre la gueule vers le plus grand ; l'enfant le tourne. Entiers, fractions (CE1 même dénominateur), décimaux (piège 3,5 vs 3,45).

### 10. Le Compte est bon (Mathador junior) — ✏️✋
- `numeric_answer` à cibles. 5 nombres + 1 cible ; combiner avec + − × ÷. Points bonus pour utiliser toutes les opérations (comme Mathador). Facile : 3 nombres, + et − seulement.

### 11. La Petite Épicerie (monnaie) — ✋👀
- `money`. Payer avec pièces/billets (glisser), rendre la monnaie au client. CE1 : euros et centimes simples ; CM2 : décimaux, promotions (% via fractions simples — plus loin).

### 12. L'Horloger — ✋👀👂
- `clock`. Régler les aiguilles (glisser), lire l'heure, calculer des durées. CE1 : heures, demi, quarts. CM2 : h-min-s, durées à étapes. Mode « Le train part dans… ».

### 13. Le Pizzaïolo des fractions — 👀✋
- `visual_fraction`. Commandes de clients (« 3/8 de pizza aux champignons »). Couper la pizza en parts égales puis garnir. CE1 : dénominateurs 2-10, ≤ 1, somme même dénominateur. CM2 : fractions > 1 (plusieurs pizzas), fraction d'une quantité, ≤ 60.

### 14. Le Chocolatier — 👀✋
- `visual_fraction` en barre/tablette (modèle « bande » du BO) : comparer, additionner, compléter à 1.

### 15. L'Ascenseur de la virgule — ✋👀
- `numeric_answer`. Glisse-nombres BO : ×10/×100/×1 000 et ÷ : les chiffres montent/descendent d'étage dans un immeuble-tableau de numération. CE1 : ×10 sur entiers ; CM2 : décimaux.

### 16. Le Détective des problèmes — 👀✏️✋
- `bar_model`. Respecte les **4 phases BO** : *Comprendre* (reformuler : choisir la bonne histoire parmi 3), *Modéliser* (construire le schéma en barre en glissant les blocs), *Calculer*, *Répondre* (phrase réponse), *Réguler* (« Est-ce possible ? »). Enquêtes illustrées. Problèmes : parties-tout, transformation, comparaison, multiplicatifs, partage, 2 étapes, mixtes ; CM2 : comparaison multiplicative, proportionnalité, durées.

### 17. Le Pâtissier proportionnel (CM2) — 👀✏️
- `numeric_answer`. Adapter une recette au nombre d'invités (tableaux de proportionnalité, passage par l'unité). Gâteau final décoré selon les étoiles.

### 18. La Machine à programmes de calcul (CM2) — ✏️👀
- `numeric_answer`. Machine à engrenages : « choisis un nombre → ×3 → +5 ». Retrouver l'entrée (algèbre BO 2025), suites de motifs (« combien d'allumettes à l'étape 10 ? »).

### 19. Les Diviseurs mystères (CM2) — 👀✋
- `classification`. Ranger des nombres dans des paniers « divisible par 2 / 5 / 10 », trouver tous les diviseurs ≤ 30, multiples communs : chasse aux œufs dans un jardin.

### 20. Le Grand Huit des opérations posées — ✏️👀
- `numeric_answer` chiffre par chiffre. Poser et calculer en colonnes (addition, soustraction par cassage/compensation, multiplication, division) ; le wagonnet avance case par case ; retenues animées. Un seul algorithme par opération (cohérent CE1→CM2 comme le demande le BO).

## B. GÉOMÉTRIE, MESURES, DONNÉES

### 21. Le Géomètre — 👀✋
- `geometry_shape`. Reconnaître/nommer les figures et leurs propriétés ; tracer sur quadrillage (règle virtuelle, équerre virtuelle, compas virtuel). CE1 : carré, rectangle, triangle, triangle rectangle, cercle, angle droit. CM2 : triangles particuliers, losange, trapèze, pentagone, hexagone, parallèles/perpendiculaires, programme de construction.

### 22. Le Miroir magique (symétrie) — ✋👀
- Compléter le dessin symétrique sur quadrillage, axe vertical/horizontal (CM2 : diagonale). Le dessin s'anime s'il est juste (papillon qui s'envole).

### 23. Tangram & Formes — ✋👀
- Reproduire une silhouette avec des pièces (repérage, figures planes). Défis quotidiens possibles.

### 24. L'Usine à patrons (CM2) — 👀✋
- Plier en 3D (CSS 3D/three.js léger) des patrons : lequel forme un cube/pavé ? Nommer solides (cube, pavé, cylindre, cône, pyramide, prisme, boule).

### 25. Le Robot codeur — 👀✋
- `ordering`. Programmer un robot avec des flèches pour atteindre un trésor (repérage, déplacements, pensée informatique). CE1 : flèches absolues ; CM2 : avancer/tourner gauche-droite, boucles « répéter ».

### 26. La Station météo (données) — 👀
- `mcq`. Lire tableaux, diagrammes en barres, courbes (CM2). Construire un diagramme en barres en tirant les barres. Thèmes réels (pluie, déchets, espèces) comme le suggère le BO.

### 27. La Roue des probabilités (CM2) — 👀✋
- `classification`. Classer des événements : impossible / peu probable / probable / certain ; tester avec dés, roues, cartes animées.

### 28. Le Mesureur — ✋👀
- Mesurer avec une règle virtuelle, estimer (« la voiture fait 4 m ou 40 m ? »), convertir par relations (1 m = 100 cm) sans tableau (conforme BO 2025). CM2 : aires en cm²/dm²/m² sur quadrillage, angles (comparaison, 90°).

## C. FRANÇAIS — ORTHOGRAPHE & DICTÉE

### ⭐ 29. L'Ascension (dictée-montagne) — 👂✏️
- `spelling_word` (mots BO + **listes des parents**). Le mot est dit (TTS ou voix du parent : mot → phrase → mot). L'enfant l'écrit ; juste = l'alpiniste grimpe d'un palier (camps de base, refuges, drapeau au sommet). Faute = glisse d'un palier + affichage de la différence lettre à lettre + réécriture du mot juste (copie active). Météo : soleil → orage si erreurs répétées. Sommets à collectionner (Mont Blanc, Mont Ventoux… puis Kilimandjaro, Everest au Plus loin).
- **Facile** : 8 mots, première lettre donnée, bouton réécouter illimité. **Normal** : 12 mots. **Plus loin** : phrases complètes (accords GN, sujet-verbe) — mode « dictée de phrases ».

### 30. L'Appareil photo (mémoire visuelle) — 👀✏️
- `spelling_word`. Le mot s'affiche 3 s (flash) puis disparaît ; l'écrire. Méthode « photographier le mot ». Bon pour les visuels.

### 31. Les Lettres en vrac — 👀✋
- `spelling_word`. Anagramme : remettre les lettres tombées (façon Tetris) dans l'ordre. Facile : sans lettre intruse ; Plus loin : lettres intruses.

### 32. Le Bonhomme de neige qui fond (pendu bienveillant) — 👀✋👂
- `spelling_word`. Deviner lettre par lettre ; chaque erreur fait fondre un peu le bonhomme ; le soleil se couche si on trouve. Indice audio : entendre le mot.

### 33. Wordle des mots de la semaine — 👀✏️
- `spelling_word`. 6 essais, couleurs vert/jaune/gris ; uniquement des mots de la liste de la leçon ou du parent → révision par déduction.

### 34. Les Mots croisés automatiques — 👀✏️
- `spelling_word` + définition/image/audio. Grille générée automatiquement depuis n'importe quelle liste (y compris parentale).

### 35. La Chasse aux lettres muettes — 👂👀
- `mcq`/`fill_blank`. « chan_ ? » → trouver la lettre muette grâce au mot de la même famille (chanter → t). BO CE1.

### 36. La Pêche aux homophones — 👀✋
- `fill_blank`. Des poissons portent a/à, et/est, son/sont, on/ont, (CM2 : ces/ses/c'est/s'est, leur/leurs, ou/où, -é/-er/-ez/-ait/-ais) : pêcher le bon pour la phrase. Astuce de substitution affichée (« remplace par *avait* »).

### 37. Le Train des accords — ✋👀✏️
- `fill_blank`. Wagons déterminant + nom + adjectif : accrocher les bons wagons pour que le train « roule » (chaîne d'accords BO). CM2 : sujet-verbe-attribut, participe passé avec être.

### 38. La Dictée-duel — 👂✏️ (2 joueurs)
- Même mot pour deux joueurs, premier juste marque. Bon pour les fratries.

## D. FRANÇAIS — GRAMMAIRE, CONJUGAISON, LEXIQUE, LECTURE

### 39. La Forge du verbe (machine à sous de conjugaison) — 👀✏️
- `fill_blank`. Trois rouleaux : sujet | verbe | temps → l'enfant forge la forme. Chaque forme juste devient une pièce d'armure pour le chevalier. CE1 : être, avoir, 1er groupe — présent, imparfait, futur, passé composé. CM2 : tous temps et verbes BO 2025 (+ marque de temps / marque de personne colorées).

### 40. Le Chef d'orchestre des classes de mots — 👀✋
- `classification`. Les mots-instruments tombent, les ranger dans les pupitres : déterminant, nom commun, nom propre, adjectif, verbe, pronom (CM2 : préposition, conjonction de subordination, adverbe). Plus loin : fonctions.

### 41. Le Labo des fonctions (CM2) — 👀✋
- `classification`. Manipulations syntaxiques BO (déplacer, supprimer, remplacer, encadrer « c'est… qui ») sur des phrases-éprouvettes pour trouver sujet, COD, COI, CC (temps/lieu/cause), attribut. Les manipulations sont **gestuelles** (glisser le groupe hors de la phrase pour tester la suppression).

### 42. Le Puzzle de phrases — ✋👀
- `ordering`. Remettre les étiquettes-mots dans l'ordre + choisir la ponctuation ; types de phrases (déclarative, interrogative, impérative), formes négative/exclamative ; transformations.

### 43. Le Feu tricolore de la ponctuation — 👂👀
- `mcq`. On entend une phrase lue avec intonation → choisir . ? ! Développe l'oreille prosodique.

### 44. Le Karaoké de lecture (fluence) — 👀🗣️
- `read_aloud`. Texte adapté ; les mots s'illuminent ; la reconnaissance vocale suit la lecture et mesure les **mots correctement lus par minute** (cible BO : CE1 70 MCLM fin d'année, CM2 120). Courbe de progrès. Sans micro : mode « lis avec le métronome » + auto-évaluation parent.

### 45. Le Perroquet savant (lecture/phonologie) — 👀🗣️
- `oral_answer`. Lire à voix haute syllabes, pseudo-mots (BO CE1 : « doir, stag, choust »), mots avec graphèmes complexes ; le perroquet répète s'il a compris.

### 46. Le Détective du texte (compréhension) — 👀👂
- `mcq`. Court texte (lu ou écouté) + questions : explicite, inférences, anaphores (« Qui est *il* ? »), titre à choisir. Indices = surligner la phrase-preuve (justifier par retour au texte, BO).

### 47. Le Dobble des mots — 👀✋
- `pairing`. Trouver vite le lien entre deux cartes : synonymes, contraires (in-/dé-), familles, générique/spécifique (aliment > fromage > gruyère), sens propre/figuré, niveaux de langue.

### 48. Memory des familles & affixes — 👀✋
- `pairing`. Retourner les cartes : radical ↔ dérivé, préfixe ↔ sens, mot ↔ image, expression ↔ sens.

## E. HISTOIRE, GÉOGRAPHIE, SCIENCES, EMC, ANGLAIS

### ⭐ 49. La Guillotine — 👀👂
- `mcq`/`true_false`. Décor révolutionnaire stylisé (papier découpé, pas réaliste). Le personnage de l'enfant (son avatar en costume d'époque) attend ; la lame monte d'un cran à chaque bonne réponse (série), descend d'un cran à chaque erreur. 5 crans. Au dernier : fondu au noir + écran comique « **Vous avez perdu la tête !!** » (bonnet phrygien qui s'envole, aucun corps) et bouton « Rejouer ». Victoire après N bonnes réponses : « La Nation vous acquitte ! » + cocarde.
- Thèmes : Révolution 1789 (CM1 — en révision au CM2), République & Empire 1792-1815 (CM2 prog. 2026), Le temps de la République (CM2 prog. 2020)… Variante de décor réutilisable pour d'autres périodes : **Le Pont-levis** (Moyen Âge, CE2/CM1), **Le Pigeon voyageur** qui doit traverser le front (14-18, sans violence montrée), **Le Train de la Libération** (39-45).
- Facile : QCM 2 choix. Normal : 4 choix. Plus loin : dates à saisir, questions « pourquoi ».

### 50. La Machine à remonter le temps (frise) — ✋👀
- `ordering`. Placer des cartes-événements sur une frise ; la machine voyage si l'ordre est juste. CE1 : avant/après, générations, objets d'autrefois, jour/semaine/mois/année. CM2 : dates repères BO.

### 51. Le Tour de France / Globe-trotteur — 👀✋
- `map_point`. Carte SVG cliquable : régions & capitales, fleuves, massifs, agglomérations, pays de l'UE (CM2) ; continents & océans, paysages (CE1). Un camping-car avance d'étape en étape.

### 52. Qui suis-je ? — 👂👀
- `mcq` à indices progressifs (5 indices, points décroissants) : personnages historiques, animaux (sciences), monuments.

### 53. Le Laboratoire des sciences — 👀✋
- `classification`/`ordering`. CE1 : états de l'eau (solide/liquide/gaz, glace qui fond), vivant/non-vivant, régimes alimentaires, cycle de vie (ordonner œuf → chenille → chrysalide → papillon), dents & hygiène, circuit électrique simple (allumer l'ampoule). CM2 : chaînes alimentaires, mélanges, énergie, Terre dans le système solaire, corps humain.

### 54. Le Conseil de la classe (EMC) — 👀👂
- `mcq` situations de vie : choisir la réponse respectueuse, symboles de la République (Marianne, drapeau, devise, 14 juillet, Marseillaise), règles, droits de l'enfant. Pas de « mauvaise » note humiliante : discussions guidées.

### 55. Jacques a dit / Simon says (anglais) — 👂✋🗣️
- `pairing`/`oral_answer`. Écouter un mot anglais → toucher l'image ; répéter (STT en-GB). Couleurs, nombres, animaux, corps, salutations, jours, météo (CE1) ; CM2 attendus fin d'année.

### 56. Le Vrai ou Faux express — 👀✋ (toutes matières)
- `true_false`. Swipe gauche/droite (à la Tinder pour enfants), 30 s, combo. Excellent pour les défis quotidiens.

---

## Matrice minimale « une notion → plusieurs jeux » (exemples)
| Notion | Jeux |
|---|---|
| Tables de multiplication | Grand Prix ✏️, Tables Ninja ✋, Robot calculateur 🗣️, Memory 👀, Compte est bon ✏️ |
| Mots de dictée | Ascension 👂✏️, Appareil photo 👀, Lettres en vrac ✋, Wordle ✏️, Bonhomme de neige 👂, Mots croisés ✏️, Dictée-duel |
| Homophones | Pêche aux homophones ✋, Vrai/Faux express, Forge du verbe, Ascension (phrases) |
| Fractions | Pizzaïolo ✋, Chocolatier ✋, Funambule ✋, Crocodiles 👀, Robot oral 🗣️ |
| Conjugaison | Forge du verbe ✏️, Robot oral 🗣️, Grand Prix version verbe ✏️, Memory 👀, Vrai/Faux |
| Histoire | Guillotine 👀👂, Frise ✋, Qui suis-je 👂, Vrai/Faux, Memory des dates |

> Priorité si le temps manque : les jeux 8, 23 et 38 sont optionnels.
