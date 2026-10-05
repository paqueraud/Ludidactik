---
description: Scaffolde un nouveau mini-jeu conforme à l'interface GameModule
argument-hint: <id-du-jeu> (ex. tables-ninja)
---
Crée le mini-jeu `$ARGUMENTS` :
1. Lis sa fiche dans docs/CATALOGUE_JEUX.md (modalités, itemKinds, mécanique, 3 niveaux). S'il n'y figure pas, propose-moi d'abord une fiche dans le même format.
2. Crée `src/games/$ARGUMENTS/` : `index.ts` (GameModule), `Game.tsx`, éventuels assets SVG, `Game.test.tsx`.
3. Le jeu ne contient aucun contenu pédagogique en dur ; il consomme des Items. Respecte DESIGN_UI (tactile ≥ 48 px, 🔊 sur consignes, reduced-motion).
4. Enregistre-le dans le registre des jeux, ajoute un test E2E de fumée (lancer une partie Facile, répondre, voir le bilan).
5. Fais relire par l'agent pedagogue, lance lint + tests, mets à jour docs/JOURNAL.md.
