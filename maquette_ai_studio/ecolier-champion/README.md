# 🎒 Écolier Champion - Révisions Ludiques Primaire (BO Éducation Nationale)

Application ludo-éducative conforme au **Bulletin Officiel de l'Éducation Nationale** pour les classes de **CE1** et **CM2**.
Fonctionne **100% hors-ligne**, sans connexion internet requise.

---

## ⚡ Méthode Ultra-Rapide sous Windows (1 seul clic !)

> ⚠️ **Pourquoi le fichier `index.html` ne se lance pas directement par double-clic ?**  
> Les applications web modernes construites en React/TypeScript utilisent des modules JavaScript (`<script type="module">`). Par mesure de sécurité standard, les navigateurs (Chrome, Edge, Firefox) bloquent l'accès aux fichiers locaux lorsque l'URL commence par `file:///`.  
> Il suffit donc de démarrer un petit serveur local qui tourne directement sur votre machine sans internet.

### 👉 Option A : Lancement immédiat (Le plus simple, 0 installation npm requise !)
1. Assurez-vous d'avoir installé [Node.js](https://nodejs.org/) (gratuit, version LTS recommandée).
2. Double-cliquez simplement sur :
   ```
   3_LANCER_DIRECT_SANS_INSTALLATION.bat
   ```
3. Votre navigateur s'ouvre automatiquement sur `http://localhost:3000` avec la version prête à l'emploi !

---

### 👉 Option B : Mode Développement complet avec Vite
Si vous souhaitez utiliser l'environnement de développement complet :

1. Double-cliquez sur **`1_INSTALLER.bat`**  
   *(Résout automatiquement les dépendances avec `--legacy-peer-deps` et le fichier `.npmrc` inclus)*.
2. Double-cliquez sur **`2_LANCER.bat`**  
   *(Démarre le serveur Vite et ouvre automatiquement votre navigateur)*.

---

## 💻 Lancement manuel en ligne de commande (Mac, Linux, Windows)

Si vous préférez le terminal :

```bash
# 1. Installation des composants
npm install

# 2. Démarrage
npm run dev
```

Puis ouvrez votre navigateur à l'adresse :
```
http://localhost:3000
```

---

## 🎮 Contenu & Fonctionnalités

- **Multi-utilisateurs & Authentification** :
  - Profils indépendants avec prénom, mascotte et mot de passe/code PIN.
  - Sauvegarde locale automatique (`localStorage`) : aucune donnée n'est envoyée sur internet.

- **Conforme au Bulletin Officiel (BO)** :
  - Toutes les périodes scolaires (P1 à P5) pour CE1 et CM2.
  - Mathématiques, Français, Histoire et Sciences.

- **Mini-Jeux Multi-Sensoriels** :
  - 🐎 **Course de Calcul Mental au Galop** (Chrono & Turbo, calculs aléatoires infinis).
  - 🏔️ **Ascension de la Montagne des Mots** (Dictée vocale, glissade en cas d'erreur).
  - ⚖️ **Défi de la Révolution 1789** (Sauve ta tête de la guillotine avec humour !).
  - 🫧 **Attrape-Bulles Galactique** (Canal visuel et réflexes).
  - 🚂 **Train des Sons & Aiguillages** (Canal auditif et homophones).
  - 📜 **Presse Typographique de Gutenberg** (Canal kinesthésique avec tampons de lettres).
  - 🎙️ **Micro Magique du Reporter** (Canal oral à voix haute).
  - 🔬 **Laboratoire des Savoirs** (Sciences).

- **Espace Parents : Mots de classe** :
  - Permet d'ajouter n'importe quelle liste de dictée donnée par l'enseignant pour s'entraîner en jeu !

- **Défis Quotidiens & Palmarès des Records** :
  - Missions du jour avec coffre bonus et tableau des scores.
