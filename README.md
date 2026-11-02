# Pompon 🐱 — petits jeux pour apprendre

PWA douce, façon Duolingo, pour un enfant de 6 ans qui ne lit pas encore.
Zéro dépendance, zéro build : des fichiers HTML/CSS/JS, hébergés sur GitHub Pages.

## Parcours

Comme Duolingo : un chemin de **paliers numérotés** (30, par unités de 6). Chaque palier est une série de 6 exercices qui **mélange tous les mini-jeux** (syllabes, lecture, calcul, quiz, tracé + un jeu spécial : dessin ou tour). La difficulté monte tous les 3 paliers. Palier réussi à 50 % → suivant débloqué, 1 à 3 étoiles selon le score.

Bouton **🎯 Entraînement** : tous les mini-jeux en accès libre, pour s'entraîner sur un seul.

## Les 7 mini-jeux

| Jeu | Ce qu'on apprend |
|---|---|
| 🔤 Syllabes | Recopier un mot avec des tuiles de syllabes (comme Duolingo), retrouver une syllabe entendue |
| ✏️ Écrire | Tracer les lettres et les chiffres avec le doigt |
| 📖 Lire | Reconnaître une lettre par son son, retrouver un mot écrit à partir d'une image |
| 🔢 Compter | Compter des objets, puis petites additions |
| 🎨 Dessiner | Dessiner un personnage kawaii étape par étape (modèle en pointillés), galerie des dessins |
| 🧱 Équilibre | « La tour qui tremble » : empiler ou s'arrêter ? On apprend à mesurer le risque |
| 💡 Quiz | Questions en images + « Le savais-tu ? » (curiosité) |

Tout est lu à voix haute (synthèse vocale du téléphone). Pas de pénalité, pas de vies : on réessaie.
Chaque jeu a des niveaux ; une leçon réussie à 80 % passe au niveau suivant.

## Minuteur

Bouton ⏱️ en haut à droite : 5 / 10 / 15 / 20 / 30 min. À la fin, écran de pause.
Seul un parent peut arrêter le minuteur ou déverrouiller (petite addition à résoudre).

## Espace parents 🔒

Cadenas en haut à droite → addition à résoudre. On y trouve : progrès par jeu, temps d'écran (jour / semaine / jours de suite), prénom, minuteur par défaut, voix, dessins, export des données.

## Lien papa & maman (sync entre téléphones)

La base est déjà créée (Firebase Realtime Database, projet `pompon`, région europe-west1) et son URL est préremplie dans l'app.
Il ne reste qu'un **code famille** à entrer, le même sur chaque appareil :

1. Tablette de l'enfant → cadenas 🔒 → addition → *Lien papa & maman* → entrer le code → **Envoyer**.
2. Téléphone de chaque parent → même app, même code → **Recevoir**.

Ensuite, la tablette envoie automatiquement après chaque leçon ; les téléphones reçoivent à l'ouverture de l'espace parents.
Le code est la seule protection : choisissez-le long et non devinable (ex. `pompon-5c4i-wj0n`).

Pour recréer la base soi-même : console Firebase → Realtime Database → règles :
```json
{ "rules": { "families": { "$code": { ".read": true, ".write": true } } } }
```

## Installer sur une tablette / un téléphone

- **iPad / iPhone** : ouvrir le lien dans Safari → Partager → *Sur l'écran d'accueil*.
- **Android** : ouvrir dans Chrome → menu ⋮ → *Installer l'application*.

L'app fonctionne ensuite hors ligne.

## Développer

```bash
npx serve .      # ou python3 -m http.server
```

- `data.js` : tout le contenu (mots, syllabes, quiz, curiosités, personnages à dessiner). C'est là qu'on ajoute des choses.
- `games.js` : les 7 jeux.
- `app.js` : accueil, moteur de leçon, minuteur, espace parents, voix.
- `sync.js` : synchronisation Firebase (REST).
- `sw.js` : cache hors ligne. Pensez à changer `CACHE = 'pompon-vN'` quand vous publiez une nouvelle version.

## Feuille de route (idées notées)

- **Quiz « situations »** : une image-problème (un chat pleure en haut d'un arbre, un feu dans la cuisine…) et 4 solutions dont une seule bonne (appeler les pompiers, etc.). Même moteur que le quiz, nouveau type de contenu dans `data.js`.
- **Défi dessin validé par les parents** : après certains défis, l'enfant doit dessiner un personnage kawaii et le montrer à papa/maman ; le parent valide depuis l'espace parents (ou son téléphone via le lien famille) et envoie un « bravo » qui s'affiche chez l'enfant.
- **Simon** : reproduire une séquence de notes/couleurs qui s'allonge, comme le vrai jeu (mémoire + écoute). Sons en WebAudio, déjà en place.
- Icône/mascotte : licorne dodue originale (pas une reprise d'illustration existante).
- Niveaux plus progressifs pour le tracé (pénaliser doucement le gribouillage hors de la lettre).
