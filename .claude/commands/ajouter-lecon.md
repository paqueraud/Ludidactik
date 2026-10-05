---
description: Ajoute une leçon au curriculum avec ses 3 niveaux et ses jeux
argument-hint: <classe> <matière> <intitulé>
---
Ajoute la leçon « $ARGUMENTS » :
1. Retrouve la compétence exacte dans docs/programmes/ (et les PDF de resources/eduscol/ si présents) ; renseigne boRef, programme, périodes.
2. Définis précisément les 3 niveaux (facile / normal = attendu BO / plus_loin) et la phrase « rappel ».
3. Implémente le générateur (src/content/generators/) avec tests (bornes, unicité des réponses, 100 tirages seedés) OU le fichier de contenu statique validé par zod.
4. Vérifie qu'au moins 2 jeux de modalités différentes l'acceptent ; sinon adapte un jeu existant.
5. Relecture par l'agent pedagogue, `npm run validate:content`, tests, JOURNAL.md.
