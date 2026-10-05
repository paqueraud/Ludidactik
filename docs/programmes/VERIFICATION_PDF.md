# Vérification des synthèses `docs/programmes/*.md` contre les PDF officiels

Date : 5 octobre 2026 — PDF vérifiés : `resources/eduscol/*.pdf`.

**Méthode.** Le texte des PDF a été extrait avec `pdftotext -layout -enc UTF-8`, car l'outil Read ne peut pas afficher les PDF (`pdftoppm` absent). Les deux PDF de sciences BO n°24-2026 (`cycle2_sciences`, 12 p. ; `cycle3_sciences`, 18 p.) sont des scans « Microsoft Print to PDF » sans couche texte. Ils ont été convertis en images avec PyMuPDF puis lus visuellement (sommaire et principes).
Les numéros de page « p. N » renvoient à la **page physique du PDF**.

**Limite importante.** Les PDF fournis ne contiennent que les **annexes**, c'est-à-dire les programmes eux-mêmes. Les **arrêtés**, qui fixent les dates d'application, n'y figurent pas. Aucune date d'entrée en vigueur n'a donc pu être confirmée par ces fichiers (points 5, 6 et 7 → ❓).

---

## 1. CE1 — Mathématiques (`cycle2_maths_BO41-2024.pdf`) → `CE1_MATHS.md`

| Point vérifié | Synthèse | PDF (citation courte + page) | Verdict |
|---|---|---|---|
| Nombres ≤ 1 000 | jusqu'à 1 000 ; centaine dès P1 ; 1 000 au plus tard en P2 | « Les connaissances et savoir-faire attendus concernent les nombres jusqu'à mille » ; « La centaine est abordée dès le début de la période 1 » ; « Au plus tard en période 2 … jusqu'à mille » (p. 10) | ✅ |
| Ordinaux | jusqu'à 100 | « Connaitre les nombres ordinaux jusqu'à cent » (p. 11) | ✅ |
| Fluence (calculs par procédures) | 12 résultats en 3 min | « la fluence attendue en fin de CE1 est la restitution de douze résultats en trois minutes » (p. 14) | ✅ |
| Tables d'addition | 12 égalités en 1 min | « À la fin du CE1, l'élève sait compléter douze égalités de ce type en une minute » (p. 14) | ✅ |
| Tables de multiplication et faits multiplicatifs | 8 égalités en 1 min ; mémorisation imparfaite acceptée | « peut compléter huit égalités de ce type en une minute » ; « pourra être encore imparfaite en fin de CE1 » (p. 14) | ✅ |
| Doubles et moitiés | liste BO | doubles de 1 à 15 ; de 20, 25, 30, 35, 40, 45 et 50 ; de 100, 150, 200, 250, 300 et 500 ; moitiés des pairs de 2 à 30, des dizaines 40-100, des centaines 200-600 et 1 000 ; 1×25 … 4×25 (p. 14) | ✅ (liste identique) |
| Moitié d'un pair par décomposition (470) | placée en « Plus loin » (CE1.MA.CM.DOUBLES_MOITIES) | « Déterminer la moitié d'un nombre pair … la moitié de 470 » est une procédure **attendue** au CE1 (p. 16) | ⚠️ niveau trop haut |
| Champ du calcul mental | — | « nombres en jeu et résultats … inférieurs ou égaux à 1 000 » (p. 14) | ✅ |
| Fractions | dénominateurs 2, 3, 4, 5, 6, 8, 10 ; ≤ 1 ; dès P2 ; comparaison dès P4 | « ont un dénominateur égal à 2, 3, 4, 5, 6, 8 ou 10 » ; « inférieures ou égales à 1 » ; « dès la période 2 » ; « Dès la période 4 … comparer » (p. 12) | ✅ |
| Soustraction posée | au plus tard P3, un seul algorithme pour l'école | « introduit en période 3 au plus tard. Un unique et même algorithme … du CE1 au CM2 » (p. 13) | ✅ |
| Problèmes | ≥ 10 par semaine ; 4 phases + régulation | « au moins dix problèmes par semaine » (p. 17) ; schéma Comprendre / Modéliser / Calculer / Répondre + Régulation (p. 16) | ✅ |
| Problèmes de partage avec reste | « reste » en Plus loin (CE1.MA.PB.MULT) | Exemples attendus : « 189 photos … 10 photos par page. Combien de pages ? » ; « 75 œufs … boites de 6 » (p. 18) | ⚠️ le reste est attendu en Normal |
| Pas de calculatrice | oui | « La calculatrice n'est pas utilisée au cycle 2 » (p. 13) | ✅ |
| Longueurs | cm, m, km ; 1 m = 100 cm ; km↔m en Plus loin | « 1 m = 100 cm et 1 km = 1 000 m » ; « 1 m + 46 cm = 146 cm » ; pas d'écriture à virgule (p. 27). Le mm et le dm relèvent du **CE2** (p. 29) | ⚠️ km↔m relève du Normal ; mm reste en Plus loin |
| Masses | g, kg ; 1 kg = 1 000 g | « Savoir que 1 kg est égal à 1 000 g » ; ordonner « 1 kg et 300 g ; 1 000 g … » ; balance Roberval ou digitale (p. 27) | ✅ |
| Monnaie | pièces de 1 c à 2 €, billets de 5 € à 100 € ; payer, rendre | Centimes introduits « au plus tard en période 2 », écriture à virgule « à partir de la période 3 » ; « 100 centimes = 1 € » ; « 2 € et 5 centimes s'écrit 2,05 € » ; rendre la monnaie (p. 27-28). La liste exacte des pièces et billets **n'est pas** dans le BO | ✅ sur le fond, ❓ pour la liste pièces/billets (ajout de la synthèse, cohérent) |
| Temps | « jours, semaines, mois, années » ; heure ; 1 h = 60 min en Plus loin | « s'applique aux temps courts, exprimés en heure et en minute » ; heures > 12, demi-heure, quarts d'heure ; « 1 heure = 60 minutes ; 1 demi-heure = 30 minutes ; 1 quart d'heure = 15 minutes » ; durées (8 h 30 → 8 h 45) ; « 2 heures et 130 minutes » (p. 28-29) | ⚠️ 1 h = 60 min relève du Normal ; jours/mois/années relèvent de « Questionner le monde », pas des maths |
| Figures planes | carré, rectangle, triangle, triangle rectangle, cercle ; losange en Plus loin | Vocabulaire CE1 : « carré, rectangle, triangle, triangle rectangle, côté, sommet, angle, disque, cercle, centre ; point, droite, segment, milieu ; angle droit, angle aigu, angle obtus » ; vérification à l'équerre (p. 34). Losange : **CE2** (p. 36) | ✅ (ajouter aigu/obtus, milieu, alignement) |
| Tracés | équerre en Plus loin (CE1.MA.GEO.TRACER) | « tracer … avec une règle (graduée ou non) et une équerre » ; « tracer un cercle avec un compas » (p. 34) | ⚠️ équerre et compas attendus en Normal |
| **Symétrie axiale** | leçon CE1.MA.GEO.SYMETRIE (axe vertical/horizontal en Normal) | **Absente du CE1.** Elle apparaît au **CE2** : « compléter une figure pour la rendre symétrique … (l'axe étant vertical ou horizontal) » (p. 36) | ⚠️ **hors programme CE1** |
| Solides | cube, pavé, boule, cylindre, cône, pyramide ; faces, arêtes, sommets ; patrons en Plus loin | Liste identique (p. 33) ; « Construire un cube, un pavé droit ou une pyramide » (p. 34). Patrons : **CE2** (p. 35) | ✅ |
| Repérage | vocabulaire, plans, codage ; instructions relatives en Plus loin | Plans de l'école et du quartier ; codage de déplacements ; robot : « avancer de », « pivoter d'un quart de tour à droite/gauche », « au maximum quinze instructions, dont quatre virages » (p. 34-35) | ⚠️ les instructions relatives (quart de tour) relèvent du Normal |
| Données | lire en Normal, construire en Plus loin | « Produire un tableau ou un diagramme en barres » ; « tableau à double entrée » (p. 38) | ⚠️ produire un diagramme est attendu en Normal |

## 2. CE1 — Français (`cycle2_francais_BO41-2024.pdf`) → `CE1_FRANCAIS.md`

| Point vérifié | Synthèse | PDF | Verdict |
|---|---|---|---|
| Fluence fin CE1 | 70 mots/min | « Lire un texte adapté à son niveau de lecture avec une vitesse de 70 mots par minute » (p. 6) | ✅ |
| Compréhension autonome | ~15 lignes | « d'une quinzaine de lignes » (p. 7) | ✅ |
| Production | 6 ou 7 phrases en fin d'année | « Écrire un texte de six ou sept phrases maximum » (p. 12, objectif de fin d'année CE1) | ✅ |
| Copie | 5-6 lignes, puis ~10 lignes | « Copier cinq ou six lignes sans erreur » ; « Recopier sans effort une dizaine de lignes » (p. 11) | ✅ |
| Dictée et horaire | une dictée par jour ; 3 h de langue par semaine | Tableau « Tous les jours … fait une dictée » ; « Toutes les semaines … à partir du CE1, trois heures d'enseignement explicite de la langue » (p. 3) | ✅ |
| Vocabulaire | 5 corpus par période | « quatre corpus par période au CP, cinq au CE1 » (p. 16) | ✅ |
| Temps de conjugaison | présent, imparfait, futur, passé composé ; être, avoir, 1er groupe | « Apprendre à conjuguer au présent, à l'imparfait, au futur puis au passé composé de l'indicatif être et avoir et les verbes du premier groupe » (p. 21) | ✅ (ordre BO : passé composé en dernier) |
| Infinitif | « ils plieront, tu as plié → plier » | Exemple identique, plus « elles plièrent » (p. 21) | ✅ |
| Classes de mots | déterminant, nom commun, nom propre, adjectif, verbe, pronom personnel sujet | Liste identique (p. 21) | ✅ |
| Types et formes | déclarative, interrogative, impérative ; négative, exclamative | Identique (p. 21) | ✅ |
| Phrase | GS, verbe, compléments sans les distinguer ; manipulations en Plus loin | « groupe sujet (GS), verbe et compléments sans distinguer ces derniers » ; manipulations déplacement, suppression, ajout, substitution **attendues** (p. 21) | ⚠️ les manipulations relèvent du Normal |
| Substitution pronominale | Elle la raconte / leur | Exemple identique (p. 21) | ✅ (« la » et « leur » font partie de l'exemple BO : le Plus loin « pronoms compléments le/la/leur » est discutable) |
| **Homophones grammaticaux** (a/à, et/est, son/sont, on/ont) | leçon CE1.FR.GRAM.HOMOPHONES | **Aucune mention** des homophones dans le programme cycle 2 2024. Seuls « poisson/poison » apparaissent, au titre des CGP (p. 17) | ❓ non trouvé → contenu hors lettre du BO |
| Accents | é/è/ê | « Tenir compte des accents » (p. 18) | ✅ |
| Lettre muette finale | sang/sanguin en Plus loin | « blanc/blanche, sang/sanguin » cité comme objectif CE1 (p. 18) | ⚠️ mineur |
| Mots invariables | listes analogiques tôt/aussitôt/plutôt ; ici/là-bas | Identique (p. 18) | ✅ |
| Lexique | générique/spécifique, niveaux de langue, sens propre/figuré, préfixes in-/dé- | Identique : « aliment > laitage > fromage > gruyère » ; « visible/invisible, ranger/déranger » (p. 17) | ✅ |
| Pseudo-mots | doir, stag, choust, valin, cagnou | Identique (p. 6) | ✅ |

## 3. CM2 — Mathématiques (`cycle3_maths_BO16-2025.pdf`) → `CM2_MATHS.md`

> Ce PDF ne donne que les **objectifs d'apprentissage**, sans les « exemples de réussite » du cycle 2. Les exemples cités par la synthèse ne peuvent donc pas tous être retrouvés.

| Point vérifié | Synthèse | PDF | Verdict |
|---|---|---|---|
| Entiers | ≤ 999 999 999 ; ≤ 6 chiffres en P1-P2 | « nombres s'écrivant avec au plus neuf chiffres » ; « pendant les deux premières périodes … au plus six chiffres » ; « jusqu'à 999 999 999 » (p. 9) | ✅ |
| Milliard | Plus loin | « En classe de 6e, le milliard est introduit » (p. 13) | ✅ |
| Fractions | dénominateurs ≤ 60 ; décimales /10, /100, /1 000 | « dénominateur inférieur ou égal à 60, hormis les fractions décimales … 100 ou 1 000 » (p. 10) | ✅ |
| Décimaux | jusqu'aux millièmes | « L'étude des nombres décimaux s'étend aux millièmes » (p. 10) | ✅ |
| Divisibilité | critères 2, 5, 10 uniquement ; diviseurs ≤ 30 ; communs ≤ 30 ; multiples communs < 15 | « Seuls les critères de divisibilité par 2, 5 et 10 » ; diviseur ≤ 10 ; « des diviseurs d'un nombre ≤ 100 » ; « tous les diviseurs d'un nombre ≤ 30 » ; communs ≤ 30 ; multiples communs < 15 (p. 9) | ✅ (la synthèse omet « diviseurs ≤ 10 » et « des diviseurs d'un nombre ≤ 100 ») |
| Calcul mental (liste) | moitiés des impairs ≤ 15, décimal ± entier, ×/÷ 10/100/1 000, somme de deux décimaux < 10, ±8, 9 … 98, 99, 30 × 400, distributivité, double/moitié décimal, ÷4 ÷8, ×5, ×50 | Liste identique (p. 11) | ✅ |
| Décimal + entier avec retenue | « Décimal ± entier (avec/sans retenue) » | Avec retenue : **seulement l'addition** (« Ajouter un nombre entier à un nombre décimal lorsqu'il y a une retenue ») (p. 11) | ⚠️ mineur (soustraction avec retenue hors attendu) |
| Opérations | parenthèses (1 ou 2 paires), décimal × entier, division décimale (diviseur à 1 chiffre) | Identique (p. 11) | ✅ |
| Calculatrice | pas de calculatrice personnelle | « les élèves ne disposent pas de calculatrice personnelle » (p. 11) | ✅ |
| Problèmes | ≥ 10 par semaine | « au moins 10 problèmes par semaine » (p. 12) | ✅ |
| Algèbre | égalités à trous (178 − … = 6 × 8), ciseaux/stylos, programmes de calcul, suites | Identique (p. 12-13) ; programmes de calcul « jusqu'à trois instructions » (p. 28) | ✅ |
| Conversions | sans tableau, par relations | « les élèves n'utilisent pas de tableaux pour effectuer des conversions … 3,5 mètres est égal à 350 centimètres » (p. 18) | ✅ |
| Formules | « Aires sans mémorisation de formule » | « Il n'est pas attendu de mémorisation de formules de **périmètres** … au CM2 » (p. 18) ; « Déterminer l'aire d'un carré ou d'un rectangle » (p. 18) ; les formules « s'installent » en 6e (p. 19) | ⚠️ formulation : c'est le périmètre que le BO cite pour le CM2 (au CM1 : périmètres **et** aires, p. 17) |
| Angles | pas de rapporteur ; angle droit = 90° | « Savoir qu'un angle droit mesure 90° » ; « rapporteur ne relève pas du CM2 » ; « angles saillants » ; somme, multiple, moitié par pliage (p. 18) | ✅ (« 180° » en Plus loin est cohérent : seuls les angles saillants sont étudiés) |
| Durées | h, min, s | introduction des secondes ; problèmes à une ou plusieurs étapes (p. 18) | ✅ |
| Périmètre du cercle | Plus loin | « calculer le périmètre d'un disque » : 6e (p. 19) | ✅ |
| Figures | triangles, quadrilatères, pentagone, hexagone | Liste identique, plus le cercle comme ensemble de points (p. 21-22) | ✅ |
| Notations [AB], (AB), [AB) | listées dans CM2.MA.GEO.VOCAB | « aucune connaissance de ces conventions n'est exigible pour les élèves » (p. 21) | ⚠️ à ne pas évaluer (lecture seulement, consignes explicites) |
| Programme de construction | « rédiger un programme » en Plus loin | « Élaborer un programme de construction » (p. 22) ; « produire des programmes de construction dans des cas simples » (p. 28) | ⚠️ relève du Normal (cas simples) |
| Symétrie | axes vertical, horizontal, diagonal | « par rapport à une droite verticale, horizontale ou une diagonale du quadrillage » (p. 22) | ✅ |
| Solides | patrons cube/pavé | « Reconnaître/Construire un patron d'un cube ; Reconnaître un patron d'un pavé » ; identifier un solide sur une perspective, sans en construire (p. 22) | ✅ (construire seulement le patron du **cube**) |
| Données | « construire courbe » en Plus loin | Lire un **diagramme circulaire** et une courbe ; produire « un ensemble de points dans un repère » (p. 25) | ⚠️ diagramme circulaire absent de la synthèse |
| Probabilités | impossible / certain / probable ; « fractions de chance » en Plus loin | « exprimer la probabilité … sous la forme "a chances sur b" » ; comparer ; indépendance ; tableau ou arbre pour 2 étapes ; « amorcé au plus tard en période 2 » (p. 25) | ⚠️ « a chances sur b » et l'arbre à 2 étapes relèvent du Normal |
| Proportionnalité | « règle de trois sans le nom » en Normal ; pourcentages en Plus loin | « n'utilisent pas de tableaux de proportionnalité » ; « Seuls des raisonnements fondés sur les propriétés de linéarité … ni coefficient de proportionnalité, ni produit en croix » ; uniquement dans le cadre des grandeurs (p. 27). Pourcentages : 6e (p. 13-14) | ⚠️ retirer « règle de trois » et parler de raisonnements de linéarité |

## 4. CM2 — Français (`cycle3_francais_BO16-2025.pdf`) → `CM2_FRANCAIS.md`

| Point vérifié | Synthèse | PDF | Verdict |
|---|---|---|---|
| Fluence | 120 mots/min | « Lire correctement en ciblant 120 mots par minute en moyenne » (p. 4). CM1 = 110 ; 6e = 130 | ✅ (Plus loin à 140 : au-delà de la 6e, à ramener à 130) |
| Œuvres | 3 du patrimoine + 4 de littérature de jeunesse | « Au CM2 : au moins 3 œuvres issues du patrimoine et 4 ouvrages de [littérature de jeunesse] » (p. 3-4) | ✅ |
| **Temps de conjugaison au CM2** | présent, imparfait, passé simple, futur, **conditionnel présent**, passé composé, plus-que-parfait, **impératif présent** | **CM2 :** « Conjugaisons à mémoriser et à maîtriser : **passé simple, plus-que-parfait** » (p. 19). **CM1 :** présent, imparfait, futur, passé composé (p. 18). **6e :** « **impératif présent, conditionnel présent** » (p. 21). La liste de la synthèse reprend en fait la *terminologie du cycle* (p. 16), et non les attendus du CM2 | ⚠️ **écart majeur** : le conditionnel présent et l'impératif présent relèvent de la **6e** |
| Verbes | être, avoir, 1er et 2e groupes, faire, aller, dire, venir, pouvoir, voir, vouloir, prendre | Identique (p. 19) | ✅ |
| Temps composés et participe passé | accord avec être ; COD placé avant pour les verbes étudiés ; négation | « Accorder le participe passé avec le sujet … être » ; « avec le COD pour les verbes étudiés … avoir » ; « transformation à la forme négative … aux temps composés » (p. 20) | ✅ (la négation des temps composés relève du Normal et non du Plus loin dans CM2.FR.CONJ.PC/PQP) |
| Marques | marque de temps et de personne ; variations du radical | Identique (p. 20) | ✅ |
| Fonctions | sujet inversé (cas simples), GS/GV/groupe circonstanciel, attribut vs COD, COD vs COI, CC de temps, lieu, cause | Identique (p. 19) | ✅ |
| Classes | prépositions, conjonctions de subordination, pronoms personnels sujets et compléments | Identique, plus « Identifier les pronoms personnels compléments d'objet » (p. 19) | ⚠️ les pronoms compléments relèvent du Normal (CM2.FR.GRAM.COD_COI les met en Plus loin) |
| GN | expansions, complément du nom, épithète vs attribut | « Aborder la notion d'expansion … complément du nom ; Différencier épithète et attribut du sujet » (p. 19) | ✅ |
| Phrase complexe | repérage des verbes conjugués | Identique (p. 19) | ✅ |
| Manipulations | déplacement, suppression, substitution, ajout, encadrement | « effacement), substitution (ou remplacement), addition (ou ajout), encadrement » (p. 17) | ✅ |
| **Homophones** | leçon CM2.FR.ORTH.HOMOPHONES (10 séries) | **Aucune mention** dans le programme cycle 3 2025. Seul « homonyme » figure dans la terminologie (p. 16) | ❓ non trouvé |
| Vocabulaire | polysémie, morphologie, dictionnaires | « polysémie dans un contexte non référentiel » ; « relations morphologiques et sémantiques » ; « Utiliser des dictionnaires » (p. 14). Synonymes/antonymes : objectif **6e** (p. 15) ; étymologie : 6e (p. 15) | ✅ (racines grecques/latines bien en Plus loin) |

## 5. Histoire-géographie BO n°22-2026 (`cycle2_` et `cycle3_histoire-geo_BO22-2026.pdf`) → `CM2_HISTGEO_SCIENCES_EMC_ANGLAIS.md` §B et §C, `00_CALENDRIER_PROGRAMMES.md`

| Point vérifié | Synthèse | PDF | Verdict |
|---|---|---|---|
| Calendrier (CE1/CM2 à la rentrée 2027 ; CP/CM1 dès 2026) | oui | Aucune date dans les annexes : pas d'occurrence de « rentrée » ni de « 2027 » | ❓ non vérifiable avec ces PDF (arrêté du BO n°22 nécessaire) |
| Thèmes CM2 et périodes | T1 1792-1815 (P1), T2 IIe/IIIe République (P2), T3 âge industriel (P2), T4 1914-18 (P3), T5 1939-45 (P4), T6 depuis 1945 (P5) | Identique (sommaire p. 1 ; p. 6-8) | ✅ |
| T1 repères | mars 1792 Pauline Léon ; avril 1792 Marseillaise ; sept. 1792 ; 1794 ; 1802 ; 2 déc. 1804 ; Code civil, lycées, préfets | Identique : « Pétition de 319 femmes (Pauline Léon) » (p. 6). Mots-clés : aussi « liberté de la presse » | ✅ |
| T2 repères | 1848 ; 1882-1886 lois Ferry ; 9 déc. 1905 ; symboles ; empire colonial | Identique (p. 6-7) ; « Localiser sur un planisphère les territoires de l'empire colonial » | ✅ |
| T3 repères | Stephenson ; « Pasteur, 1885 » ; « droit de grève (1864) » ; « liberté syndicale (1884) » | Le BO ne donne **pas d'année** : « Début XIXe siècle : … locomotive (Stephenson) » ; « Fin du XIXe siècle : … vaccin contre la rage par Pasteur » ; « Seconde moitié du XIXe siècle : droit de grève et loi relative à la liberté syndicale » (p. 7) | ⚠️ les dates précises sont exactes historiquement mais ne sont pas des repères BO : exigibles en Plus loin seulement |
| T4 | ~10 M de morts dont ~1,4 M de Français | « 10 millions dont 1,4 millions de Français » ; repère « Une grande bataille de la Première Guerre mondiale en France » ; rôle des femmes (p. 7) | ✅ (ajouter « une grande bataille », par ex. Verdun) |
| T5 | 18 juin 1940, Vichy, Résistance, Vel d'Hiv 1942, 6 juin 1944, 8 mai 1945, génocide | Identique (p. 7) ; en plus : « 60 et 70 millions de morts dans le monde, dont 6 millions de Juifs (60 % des Juifs d'Europe) », « persécutions des Tsiganes », « Justes parmi les Nations », « drôle de guerre » (p. 7-8) | ✅ (compléments à ajouter) |
| T6 — **euro** | « 2002 (euro fiduciaire ; BO : "2000 : l'euro remplace le franc" — vérifier) » | Citation exacte : « **2000 : l'euro remplace le franc.** » (p. 8). Le programme **2020** (fiche Éduscol CM2 thème 3, p. 3) dit « l'Euro est mis en place comme monnaie fiduciaire en **2002** » | ⚠️ la formulation BO 2026 est bien « 2000 ». Historiquement : euro scriptural en 1999, pièces et billets en 2002 |
| T6 autres repères | 1944, Sécurité sociale, 1957, 1958, 1965 | « 1944 : droit de vote des femmes » ; « 1957 : traité de Rome créant la CEE » ; « 1958 : fondation de la Ve République avec le général de Gaulle » ; « 1965 : les Françaises peuvent travailler sans l'autorisation de leur époux et ouvrir un compte bancaire » (p. 8). Sécurité sociale = mot-clé | ✅ |
| Géo T1 | 5 agglomérations, axes, 18 régions et capitales, département | « Les cinq principales agglomérations » ; « Les dix-huit Régions administratives et leur capitale régionale » ; « Le département où vit l'élève » ; « au moins deux Régions dont celle de l'école » (p. 12) | ✅ |
| Géo T2 | fleuves (Garonne, Loire, Maroni, Rhin, Rhône, Seine), 6 massifs, 2 grands lacs | Identique ; « Deux grands lacs français **dont un lac naturel** » (p. 13) | ✅ |
| Géo T3 — « 10 pays membres dont 6 fondateurs » | formulation de la synthèse | « Localiser et nommer **dix pays membres de l'UE (dont les six pays fondateurs)** » ; 1957 Rome ; 1992 Maastricht ; « Un aménagement réalisé avec le soutien de l'UE dans la région de l'école » (p. 13) | ⚠️ conforme sur le fond, mais la formulation de la synthèse laisse croire que l'UE compte 10 membres (elle en compte 27) |
| Géo T3 durée | — | « (1 période) » ; T1 et T2 : « (2 périodes) » chacun (p. 12-13) | ✅ (info utile) |
| CE1 2026 (cycle 2) | `CE1_QLM` : « préparer la version 2026 » | Histoire CE1 : T1 « Du passé proche au passé lointain », T2 « Les grandes périodes de l'histoire », T3 « Les traces du passé » ; Géographie CE1 : « où vivent les êtres humains ? » — T1 « La Terre est peuplée », T2 « Découvrir les lieux où vivent les êtres humains » (p. 1) | ✅ (contenu à extraire pour `programme: "2026"`) |

Programme 2020 (fiches Éduscol CM2) : les repères du thème 1 (« 1880 : 14 juillet, fête nationale ; 1881-1882 : lois Ferry ; 1905 ; 1944 », p. 5), l'obligation scolaire de 6 à 13 ans (p. 3) et l'euro en 2002 confirment la section A. ✅

## 6. Langues vivantes BO n°12-2026 (`cycle2_` et `cycle3_langues-vivantes_BO12-2026.pdf`)

| Point vérifié | Synthèse | PDF | Verdict |
|---|---|---|---|
| Date d'application CE1 et CM2 | « à vérifier » | Annexes 1 et 2 sans date. Seule mention : « volume horaire en vigueur au 1er septembre 2024, à savoir 54 heures annuelles, soit 90 minutes par semaine » (cycle 2, p. 3) | ❓ non trouvé (consulter l'arrêté du BO n°12 du 19/03/2026) |
| Niveau visé en fin de CM2 | — | « En fin de CM2, le niveau A1 minimum est visé … A1+ voire A2 » ; tableau « CM2 : A1 consolidé » (cycle 3, p. 2) | info à ajouter |
| Structure cycle 2 | — | Activités par niveau CP/CE1/CE2 : CO, EOC, etc. (p. 1) | info |

## 7. Sciences et technologie BO n°24-2026 (PDF scannés)

| Point vérifié | Synthèse | PDF | Verdict |
|---|---|---|---|
| Date d'application | CE1 et CM2 à la rentrée 2027 | Annexes 1 (cycle 2) et 2 (cycle 3) de l'arrêté **MENE2611650A** (métadonnées du PDF) ; aucune date dans le sommaire ni dans les principes (p. 1-2) | ❓ non trouvé |
| Contenus CE1 2026 | — | Sommaire (p. 1) : *La matière, les mesures, l'électricité* (masse et volumes, états physiques, électricité) ; *Les êtres vivants* (nutrition, sens et perception chez les animaux, environnement proche, protéger l'environnement) ; *Corps humain et santé* (alimentation, croissance et mouvement, santé et hygiène) ; *Objets techniques* | info pour la version `2026` |
| Contenus CM2 2026 | §D (programme 2020) | Sommaire (p. 1) : *Matière, mouvements, signaux* (états et constitution, types de mouvement, signaux) ; *Êtres vivants* (unité et diversité, écosystèmes, la Terre planète active) ; *Corps humain* (alimentation humaine, puberté et reproduction humaine) ; *Objets techniques* (démarche de conception et de réalisation, programmation) | info : en 2026, l'**énergie** n'apparaît plus comme rubrique CM2 du sommaire |

---

## Corrections proposées

### `docs/programmes/CE1_MATHS.md`
1. Retirer la mention « ⚠️ … à vérifier sur le PDF » de l'en-tête, des titres « Grandeurs et mesures (à vérifier PDF) » et « Espace et géométrie (à vérifier PDF) ». Remplacer par « vérifié le 05/10/2026 (VERIFICATION_PDF.md) ».
2. **CE1.MA.GEO.SYMETRIE : la retirer du CE1** (la symétrie relève du CE2 dans le BO 2024). Elle peut devenir une leçon « Pour aller plus loin (CE2) », hors du niveau Normal, ou être supprimée. Faire de même pour le losange et les patrons, déjà en Plus loin : les étiqueter « (CE2) ».
3. CE1.MA.GEO.TRACER : Normal = règle graduée **+ équerre** (angles droits) ; ajouter le cercle au compas ; Plus loin = figures obliques ou assemblages.
4. CE1.MA.GEO.FIGURES : ajouter au Normal « angle aigu / obtus », « milieu d'un segment (pliage) », « points alignés », « code de l'angle droit ».
5. CE1.MA.GEO.REPERAGE : Normal = codage avec « avancer de / pivoter d'un quart de tour à droite/gauche » (≤ 15 instructions, 4 virages max) ; Plus loin = programmes plus longs.
6. CE1.MA.GM.LONGUEURS : Normal = « m↔cm **et km↔m** (1 km = 1 000 m), encadrer une longueur au cm, estimer » ; Plus loin = mm, dm (CE2).
7. CE1.MA.GM.TEMPS : centrer la leçon sur les **temps courts** (h, min) ; Normal = heures > 12 (14 h 15), demi et quarts d'heure, **1 h = 60 min, ½ h = 30 min, ¼ h = 15 min**, durées dans une même journée, comparer 2 h et 130 min. Déplacer « jours, semaines, mois, années » vers CE1.QLM.TEMPS.CALENDRIER.
8. CE1.MA.GM.MONNAIE : préciser « centimes au plus tard en P2, écriture à virgule dès P3 ; 100 c = 1 € ; 2,05 € ≠ 2,50 € ». Indiquer que la liste des pièces et billets est un choix de l'app, pas une citation BO.
9. CE1.MA.CM.DOUBLES_MOITIES : passer « moitié de 470 par décomposition » du Plus loin au **Normal** (procédure BO). Plus loin = moitié d'un nombre à 3 chiffres plus difficile (ex. 974).
10. CE1.MA.PB.MULT : passer « reste » au **Normal** (exemples BO 189 photos / 10 et 75 œufs / 6). Plus loin = nombres plus grands.
11. CE1.MA.DON.LIRE : Normal = lire **et produire** un diagramme en barres (axe gradué de 1 en 1) + tableau à double entrée.
12. Ajouter dans « Repères chiffrés » : « champ du calcul mental ≤ 1 000 » et « pas d'écriture à virgule pour longueurs et masses ».

### `docs/programmes/CE1_FRANCAIS.md`
13. CE1.FR.GRAM.HOMOPHONES : l'étiqueter **« Pour aller plus loin / hors BO 2024 »** ou la rattacher explicitement à un objectif BO, par exemple « Identifier la relation sujet-verbe » (son/sont, on/ont), avec un `boRef` justifié, ou la retirer du niveau Normal. Les homophones ne figurent pas dans le programme cycle 2 2024.
14. CE1.FR.GRAM.PHRASE : passer les manipulations (déplacement, suppression, ajout, substitution) au **Normal**.
15. CE1.FR.ORTH.MUETTE : l'exemple « sang/sanguin » est cité par le BO pour le CE1 et relève donc du Normal. Mettre en Plus loin d'autres dérivés moins transparents.
16. CE1.FR.GRAM.SUBST : « Elle la raconte / Elle leur raconte » est l'exemple BO et relève du Normal. Ajuster le Plus loin.

### `docs/programmes/CM2_MATHS.md`
17. Repères BO : remplacer « Aires sans mémorisation de formule » par « pas de mémorisation des formules de **périmètre** au CM2 ; aire du carré et du rectangle à déterminer, formules installées en 6e ».
18. CM2.MA.NUM.DIVISIBILITE : préciser « diviseur ≤ 10 d'un nombre ; des diviseurs d'un nombre ≤ 100 ; tous les diviseurs d'un nombre ≤ 30 ; diviseurs communs (≤ 30) ; multiples communs (< 15) ».
19. CM2.MA.CM.DEC_ENTIER : Normal = « décimal ± entier sans retenue ; décimal **+** entier avec retenue ». La soustraction avec retenue passe en Plus loin.
20. CM2.MA.PROBA : Normal = « a chances sur b » (équiprobabilité), comparer des probabilités, indépendance, tableau ou arbre pour 2 étapes. Supprimer « fractions de chance » du Plus loin, ou viser des expériences à 3 étapes.
21. CM2.MA.PB.PROPORTION : supprimer « règle de trois ». Écrire « raisonnements de linéarité (× et +) en langage naturel, **sans tableau de proportionnalité, sans coefficient, sans produit en croix**, uniquement avec des grandeurs ». Pourcentages : Plus loin (6e).
22. CM2.MA.GEO.VOCAB : noter « notations [AB], (AB), [AB) non exigibles : consignes toujours explicites (“le segment [AB]”) ». Aucun item ne doit évaluer la notation seule.
23. CM2.MA.GEO.CONSTRUIRE : « élaborer un programme de construction (cas simples) » passe au **Normal**.
24. CM2.MA.GEO.SOLIDES : préciser « construire le patron du **cube** ; reconnaître celui du pavé ; reconnaître un solide en perspective sans le dessiner ».
25. CM2.MA.DON.LIRE : ajouter le **diagramme circulaire** (lecture) et « ensemble de points dans un repère » (production) au Normal.
26. CM2.MA.ALG.PROGRAMMES : préciser « jusqu'à 3 instructions ».

### `docs/programmes/CM2_FRANCAIS.md`
27. **Attendus de conjugaison (écart majeur)** : remplacer la ligne « Conjugaison — temps » par :
    « CM2 : **passé simple** et **plus-que-parfait** (à mémoriser), en consolidant les temps du CM1 (présent, imparfait, futur, passé composé) ; participe passé ; temps composés. Le **conditionnel présent** et l'**impératif présent** relèvent de la **6e** (BO 16-2025, p. 21). »
28. CM2.FR.CONJ.CONDITIONNEL et CM2.FR.CONJ.IMPERATIF : les étiqueter **« Pour aller plus loin (6e) »**, ou n'en garder qu'une découverte en Facile ou Plus loin, et non un niveau Normal « verbes BO ».
29. CM2.FR.CONJ.PC / PQP : la forme négative des temps composés relève du **Normal** (BO p. 20) et non du Plus loin.
30. CM2.FR.GRAM.COD_COI : les pronoms personnels compléments d'objet relèvent du **Normal** au CM2.
31. CM2.FR.ORTH.HOMOPHONES : étiqueter « hors lettre du BO 2025 (aucune mention) — consolidation orthographique ». Si la leçon est maintenue en Normal, la rattacher à un `boRef` d'orthographe grammaticale, par exemple « accord sujet-verbe / participe passé » pour -é/-er/-ez.
32. CM2.FR.LEC.FLUENCE : Plus loin = **130 MCLM** (attendu de 6e) au lieu de 140.
33. CM2.FR.VOC.SYN_ANT : signaler que synonymes et antonymes sont un objectif explicite de **6e**. Au CM2, ils restent des outils de réemploi.

### `docs/programmes/CM2_HISTGEO_SCIENCES_EMC_ANGLAIS.md`
34. §B CM2.HI26.T6 : remplacer la parenthèse par « **Repère BO : “2000 : l'euro remplace le franc”** (citation exacte BO 22-2026, p. 8). Exactitude historique : monnaie scripturale en 1999, pièces et billets en 2002. Dans les jeux, accepter 2002 en Plus loin et afficher l'explication. » Ajouter « 1958 : Ve République **avec le général de Gaulle** » et « 1957 : traité de Rome **créant la CEE** ».
35. §B CM2.HI26.T3 : indiquer que le BO date les repères par période (« début XIXe » Stephenson ; « fin XIXe » Pasteur ; « seconde moitié du XIXe » droit de grève et liberté syndicale). Les années 1864, 1884 et 1885 sont réservées au Plus loin.
36. §B CM2.HI26.T4 : ajouter le repère « une grande bataille de la Première Guerre mondiale en France » (ex. Verdun) et « rôle des femmes ».
37. §B CM2.HI26.T5 : ajouter « drôle de guerre », « bilan : 60 à 70 millions de morts dont 6 millions de Juifs (60 % des Juifs d'Europe) », « persécution des Tsiganes », « Justes parmi les Nations ».
38. §C CM2.GE26.T3 : reformuler en « Localiser et nommer **10 pays membres de l'UE (dont les 6 fondateurs)** — l'UE compte 27 membres » et ajouter « un aménagement réalisé avec le soutien de l'UE dans la région de l'école ».
39. §C CM2.GE26.T2 : « 2 grands lacs **dont un lac naturel** ». §C CM2.GE26.T1 : ajouter « caractéristiques d'au moins deux Régions dont celle de l'école ».
40. §D : ajouter une note sur la structure CM2 du programme sciences 2026 (matière/mouvements/signaux ; vivant : diversité, écosystèmes, Terre planète active ; alimentation, puberté ; conception d'objets, programmation). L'**énergie** n'est plus une rubrique CM2.
41. §F : ajouter « niveau visé fin CM2 : **A1 consolidé** (A1+ voire A2 possible) — BO 12-2026 annexe 2 ». Conserver « date d'application à vérifier ».

### `docs/programmes/00_CALENDRIER_PROGRAMMES.md`
42. Ligne Langues vivantes : laisser « date d'application à vérifier ». Préciser que l'**annexe** ne la contient pas et qu'il faut l'**arrêté** du BO n°12 du 19/03/2026 (texte réglementaire). Ajouter « 54 h annuelles, 90 min par semaine au cycle 2 ».
43. Lignes HG et Sciences : ajouter la note « dates non vérifiables dans les annexes PDF (`resources/eduscol/`) : télécharger les arrêtés (BO n°22 du 28/05/2026, BO n°24 du 11/06/2026, référence MENE2611650A pour les sciences) pour confirmation ».
44. Conséquence n°3 : compléter la liste de géographie CM2 2026 (« territoire français (2 périodes), eau douce (2 périodes), UE (1 période) »).

### `docs/programmes/CE1_QLM_EMC_ANGLAIS.md`
45. Ajouter un encart « Programme 2026 CE1 (rentrée 2027, à confirmer) » avec les thèmes du BO 22-2026 : histoire (du passé proche au passé lointain ; les grandes périodes de l'histoire ; les traces du passé) et géographie (« Où vivent les êtres humains ? » : la Terre est peuplée ; découvrir les lieux où vivent les êtres humains). Ajouter aussi les rubriques sciences CE1 du BO 24-2026 (masse et volumes, états de la matière, électricité ; nutrition des êtres vivants, sens chez les animaux ; alimentation, croissance, hygiène ; objets techniques).
46. CE1.QLM.TEMPS.CALENDRIER : y regrouper « jours, semaines, mois, années » retirés de CE1.MA.GM.TEMPS (voir correction 7).
