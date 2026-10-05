# Hébergement — accessible partout (maison, 4G/5G), gratuitement

## Le choix : GitHub Pages (gratuit, HTTPS)

Ludidactik est une **PWA 100 % côté navigateur** : pas de serveur, pas de base de données en ligne. Il suffit donc
d'un hébergement de **fichiers statiques** en **HTTPS** (obligatoire pour le mode hors-ligne, l'installation sur
l'écran d'accueil et le micro).

| Solution | Coût | Avantages | Limites |
|---|---|---|---|
| **GitHub Pages** ✅ retenu | Gratuit | Déjà lié au code (Git), déploiement automatique à chaque `git push`, HTTPS, domaine perso possible | Dépôt **public** requis avec un compte gratuit ; 100 Go/mois de bande passante (largement suffisant) |
| Cloudflare Pages | Gratuit | Très rapide en France, bande passante illimitée, dépôt privé possible | Compte Cloudflare en plus |
| Netlify / Vercel | Gratuit | Simple, dépôt privé possible | Quotas mensuels |

→ **GitHub Pages** est le plus simple puisque le projet est déjà sous Git. Si vous préférez garder le code privé,
**Cloudflare Pages** fonctionne avec le même build (`npm run build`, dossier `dist`).

L'adresse sera : `https://<votre-pseudo-github>.github.io/Ludidactik/`

## Mise en ligne (une seule fois)

1. Créer un compte sur https://github.com (gratuit) puis un dépôt **public** nommé `Ludidactik` (vide).
2. Dans le dépôt : **Settings → Pages → Build and deployment → Source : « GitHub Actions »**.
3. Sur le PC, dans le dossier du projet :
   ```bash
   git remote add origin https://github.com/<votre-pseudo>/Ludidactik.git
   git push -u origin main
   ```
4. Onglet **Actions** du dépôt : le workflow « Déployer sur GitHub Pages » valide le contenu, lance les tests,
   construit l'app et la publie (≈ 2 min). L'adresse s'affiche à la fin.

Ensuite, chaque `git push` met l'app à jour ; les appareils récupèrent la nouvelle version automatiquement.

## Sur la tablette / le téléphone / le PC

- Ouvrir l'adresse dans Chrome (Android, PC) ou Safari (iPad/iPhone).
- **Installer** : Chrome → menu ⋮ → « Installer l'application » ; Safari → Partager → « Sur l'écran d'accueil ».
- L'app fonctionne ensuite **hors connexion**.

## ⚠️ À savoir : les données restent sur chaque appareil

Les profils, étoiles et records sont stockés **dans le navigateur de l'appareil** (IndexedDB) — c'est voulu
(aucune donnée d'enfant envoyée en ligne). Conséquence : la tablette et le PC ont chacun leurs propres profils.
Pour passer d'un appareil à l'autre : **Mon profil → Sauvegarder (fichier)**, puis **Qui joue ? → Importer une
sauvegarde** sur l'autre appareil. Une synchronisation automatique entre appareils demanderait un service en ligne
(compte, base de données) : possible plus tard, uniquement si vous le souhaitez.

## Sur le Wi-Fi de la maison, sans publier (pendant le développement)

`npm run dev` affiche une adresse « Network » (ex. `http://192.168.1.20:5173`) utilisable depuis la tablette sur le
même Wi-Fi. Attention : sans HTTPS, le mode hors-ligne et le micro ne sont pas disponibles sur ces appareils —
la version publiée sur GitHub Pages n'a pas cette limite.
