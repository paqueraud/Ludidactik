# Ludidactik 🦉

Application de révision ludique pour l'école élémentaire (CE1 et CM2 en V1), conforme aux programmes officiels, pensée pour être développée avec **Claude Code dans VS Code**.

## Lancer l'application

```bash
npm install
npm run dev        # puis ouvrir http://localhost:5173 (ou l'adresse « Network » depuis une tablette du même Wi-Fi)
```

Autres commandes : `npm test` (tests unitaires), `npm run test:e2e` (parcours complets dans Chromium),
`npm run validate:content` (vérifie les JSON de `data/`), `npm run build` (version de production).

**Mise en ligne gratuite (GitHub Pages)** : voir [docs/HEBERGEMENT.md](docs/HEBERGEMENT.md).

## Démarrage du projet avec Claude Code (historique)
0. **Installer la config Claude Code / VS Code** — les dossiers cachés n'ont pas pu être écrits à distance : ils sont dans `_a_installer/`. Dans un terminal PowerShell ouvert sur ce dossier :
   `Copy-Item -Recurse _a_installer\claude .claude ; Copy-Item -Recurse _a_installer\vscode .vscode`
   (sinon, Claude Code le fera lui-même : c'est la première instruction du prompt maître).
1. **Ressources officielles** — dans un terminal VS Code ouvert sur ce dossier :
   `powershell -ExecutionPolicy Bypass -File scripts\telecharger_ressources.ps1`
   (télécharge les PDF des programmes dans `resources/eduscol/`).
2. **Maquette Google AI Studio** (facultatif mais conseillé) — dans AI Studio, ouvrez votre app puis utilisez l'export/téléchargement du code (ZIP) et décompressez-le dans `maquette_ai_studio/`.
3. **Prérequis** : Node.js 20+ (`node -v`), Git (`git init` dans ce dossier pour que Claude Code puisse committer).
4. Ouvrez le panneau **Claude Code** dans VS Code, passez en **mode plan** (Shift+Tab ×2), puis copiez-collez le bloc « Prompt à copier-coller » de `PROMPT_MAITRE.md`.
5. Ensuite, phase par phase : `/phase 0`, `/phase 1`, … Pour un jeu : `/nouveau-jeu tables-ninja`. Pour un audit : `/verifier-bo`.

## Contenu du dossier
| Chemin | Rôle |
|---|---|
| `CLAUDE.md` | Mémoire du projet (lue automatiquement par Claude Code) |
| `PROMPT_MAITRE.md` | Prompt idéal + plan en 8 phases + critères d'acceptation |
| `docs/ARCHITECTURE.md` | Stack, modèle de données, moteur de jeux, stockage, auth |
| `docs/CATALOGUE_JEUX.md` | 56 mini-jeux (écrire / écouter / parler / regarder / manipuler) |
| `docs/GAMIFICATION.md` | XP, pièces, avatar, île, défis quotidiens, scores, garde-fous |
| `docs/DESIGN_UI.md` | Direction artistique |
| `docs/programmes/` | Synthèses BO CE1 & CM2 + calendrier d'entrée en vigueur |
| `data/` | 203 leçons (squelette), 329 mots de dictée, 49 questions d'histoire, 4 textes de lecture |
| `.claude/` | Agent « pedagogue » + commandes `/phase`, `/nouveau-jeu`, `/ajouter-lecon`, `/verifier-bo` |
| `resources/SOURCES.md` | Tous les liens officiels |

## Points d'attention
- En 2026-2027, histoire-géo et sciences du CE1/CM2 restent sur les **programmes 2020** ; les nouveaux s'appliquent à la rentrée 2027 → l'app gère les deux (réglage parent).
- La Révolution française est au programme de **CM1** : au CM2 la Guillotine sert en rappel et sur 1792-1815 / la République.
- Les mots de passe des profils sont un verrou familial local, pas une sécurité forte (tout reste sur l'appareil).
