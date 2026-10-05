# Direction artistique & UI — Ludidactik

## Ambiance
« Plus joli qu'ANTON » : illustrations **vectorielles douces, arrondies, chaleureuses** (style livre jeunesse moderne / jeu mobile premium), profondeur par ombres portées colorées, parallaxe légère, mascotte récurrente : **Ludo**, un petit hibou-explorateur avec sac à dos (création originale).

## Palette (tokens)
| Token | Hex | Usage |
|---|---|---|
| `--sky` | #4FC3F7 | fonds, ciel |
| `--grass` | #7BD389 | succès, progression |
| `--sun` | #FFD45C | étoiles, Ludis, highlights |
| `--coral` | #FF7A6B | erreur douce, alertes |
| `--grape` | #8E7CFF | Plus loin, magie |
| `--ink` | #24304A | texte |
| `--cream` | #FFF8EC | fond de carte |
Couleur par matière : Maths = bleu, Français = corail, Histoire = ocre #E0A458, Géo = vert, Sciences = turquoise, EMC = bleu-blanc-rouge pastel, Anglais = violet.
Niveaux : Facile = vert 🌱, Normal = bleu ⭐, Pour aller plus loin = violet 🚀.
Mode sombre automatique (prefers-color-scheme) avec palette équivalente.

## Typographie
- Titres : **Baloo 2** (ronde, enfantine, lisible) — auto-hébergée.
- Texte & consignes : **Andika** (conçue pour l'apprentissage de la lecture, a et g « scolaires ») — auto-hébergée.
- Option : **OpenDyslexic**. Taille de base 18 px (CE1 20 px), interlignage 1,5.
- Écriture cursive (CE1, copie) : police **Belle Allure** si licence OK, sinon ne pas simuler.

## Composants clés
Cartes leçons arrondies (radius 24), gros boutons (≥ 56 px) avec effet « enfoncé », anneaux de progression, pavé numérique géant, clavier lettres AZERTY avec accents (é è ê à ç ù î ô ë ï) en touches dédiées, bouton 🔊 sur chaque consigne, bouton 🎤 animé quand il écoute.

## Animations
Framer Motion ; uniquement transform/opacity ; durées 150-400 ms ; `prefers-reduced-motion` respecté (désactive parallaxe, confettis réduits).

## Sons
Courts, doux, cohérents (xylophone/marimba). Musique de fond facultative et désactivée par défaut. Toujours un équivalent visuel.

## Écrans
1. Accueil (île en parallaxe, Ludo, « Jouer ») · 2. Profils (grille avatars) · 3. Connexion (texte ou pictos) · 4. Carte des classes (CE1, CM2 actives ; CP, CE2, CM1 « bientôt ») · 5. Matières (tuiles illustrées) · 6. Leçons (liste par domaine, badge « En cours », étoiles) · 7. Choix du jeu (cartes avec icônes de modalité) · 8. Choix du niveau (3 grosses cartes) · 9. Jeu · 10. Bilan · 11. Défis du jour · 12. Scores · 13. Boutique/Avatar · 14. Mon île · 15. Espace parents.

## Images
Uniquement des créations originales (SVG) ou du domaine public / licence libre (Wikimedia Commons, avec attribution dans `public/CREDITS.md`). Aucun personnage de marque.
