---
description: Exécute une phase du plan de PROMPT_MAITRE.md
argument-hint: <numéro de phase 0-7>
---
Exécute la PHASE $ARGUMENTS décrite dans PROMPT_MAITRE.md.
Avant de coder : relis CLAUDE.md et les docs concernées, annonce un plan court et la liste des fichiers.
Pendant : commits logiques (git) avec messages en français.
À la fin : `npm run lint && npm run test && npm run build`, test E2E de fumée, mise à jour de docs/JOURNAL.md, et un résumé : fait / reste / risques. Ne passe pas à la phase suivante sans mon accord.
