---
description: Audit de conformité du contenu de l'app vis-à-vis des programmes officiels
---
Réalise un audit de conformité :
1. Liste toutes les leçons de data/curriculum/*.json et vérifie pour chacune : boRef présent, 3 niveaux définis, ≥ 2 jeux compatibles de modalités différentes, générateur/contenu existant et testé.
2. Compare la couverture avec docs/programmes/*.md et les PDF de resources/eduscol/ : quelles compétences BO ne sont couvertes par aucune leçon ?
3. Échantillonne 30 items par classe (générés avec seed) et fais-les relire par l'agent pedagogue.
4. Produis docs/AUDIT_BO_<date>.md : tableau de couverture, écarts, corrections proposées, puis applique les corrections simples.
