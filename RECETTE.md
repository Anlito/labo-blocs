# Recette — jalon 1 (noyau et parcours du distributeur)

À faire par Thomas sur un poste du collège, avec **Chrome ou Edge**, en ouvrant `site/index.html` depuis le dossier
réseau (double-clic). Compter 30 à 40 minutes. Noter ✔ ou ✘ et une remarque pour chaque ligne.

La recette automatique (`npm run recette`, compte rendu dans `RECETTE-AUTO.md`) vérifie déjà dans un vrai navigateur :
ouverture en file:// sans internet, polices, parcours, écart et réussite, les 14 solutions, simulateur, code du niveau 3,
indices, mode Firefox, reprise après fermeture de l'onglet. Ici, on vérifie ce qu'elle ne peut pas faire : les vrais
dossiers du réseau, l'écran du collège, et l'avis du professeur.

## 1. Accueil et dossier de l'équipe

| # | Action | Attendu | ✔/✘ |
|---|---|---|---|
| 1.1 | Ouvrir `site/index.html` depuis le dossier réseau | Accueil « Atelier de programmation », bandeau marron du distributeur, lisible sur l'écran du collège | |
| 1.2 | « Nouvelle équipe » : deux prénoms, une classe, « Choisir mon dossier » | Le chemin `5A › COMMUN › TECHNOLOGIE › DISTRIBUTEUR DE CEREALES › Prénom_Prénom` s'affiche | |
| 1.3 | Choisir le dossier **DISTRIBUTEUR DE CEREALES** | Le sous-dossier de l'équipe est créé, « Dossier validé », puis « Commencer » | |
| 1.4 | Refaire 1.2–1.3 avec la même équipe | « Ce dossier contient déjà la sauvegarde de … » : rien n'est écrasé, « Ouvrir cette sauvegarde » | |
| 1.5 | « Ouvrir notre sauvegarde » avec un fichier d'une équipe de **l'atelier actuel** (ex. `Léa_Hugo.json`) | Le parcours montre les exercices déjà réussis dans l'atelier ; l'équipe reprend où elle en était | |

## 2. Parcours

| # | Action | Attendu | ✔/✘ |
|---|---|---|---|
| 2.1 | Regarder le parcours d'une nouvelle équipe | 14 cartes ; le 1 « En cours », les autres « Réussis le précédent pour l'ouvrir », 13B « Défi facultatif » | |
| 2.2 | Cliquer sur un exercice verrouillé | Message « Cet exercice s'ouvrira quand tu auras réussi le précédent. » | |
| 2.3 | « Continuer : exercice 1 » | L'exercice 1 s'ouvre | |

## 3. Exercice (faire l'exercice 1, puis le 5 et le 13A en mode enseignant : `index.html?enseignant=1`)

| # | Action | Attendu | ✔/✘ |
|---|---|---|---|
| 3.1 | Lire la consigne (bandeau en haut), ouvrir « À savoir », cliquer sur un mot souligné, ouvrir « Lexique » | Fiche, définition (sous le mot) et lexique comme dans l'atelier ; « Besoin d'aide ? » et les composants restent visibles à gauche, même au 8 et au 13A | |
| 3.2 | Construire le programme, « Lancer », cliquer sur les boutons du simulateur | Les LED, le servo et le bloc en cours (contour jaune) suivent | |
| 3.3 | « Pas » plusieurs fois | Un bloc à la fois, surligné | |
| 3.4 | « Vérifier mon programme » avec un programme incomplet | Une phrase en **ambre**, qui décrit ce que fait le programme, sans la réponse ; « Voir le test » rejoue le test | |
| 3.5 | Vérifier le bon programme | Message vert « Ton programme fait ce qu'on attend. L'exercice 2 est ouvert. » | |
| 3.6 | « Besoin d'aide ? » : ouvrir les 3 indices | Ils s'ouvrent un par un, le compteur passe à « 3 sur 3 utilisés », la silhouette a des cases « ? » | |
| 3.7 | Niveau « 3 · Code » puis cliquer sur un bloc | Le code Arduino s'affiche en bas, les lignes du bloc sont surlignées | |
| 3.8 | Exercice 13A (7 composants + distributeur) sur l'écran du collège | Tout est visible et lisible sans faire défiler le simulateur | |
| 3.9 | Cliquer sur les languettes bleues à mi-hauteur, entre les colonnes (‹ et ›), puis sur les bandes verticales ; « Masquer le texte » puis « Afficher le texte » dans la consigne | La zone de programmation s'agrandit, les colonnes se rouvrent ; le choix est gardé après rechargement | |
| 3.10 | Lire la consigne des exercices 5 et 7 | Les mots **si**, **alors**, **sinon** sont surlignés comme les blocs ; chaque « si » commence une ligne, « alors » et « sinon » sont en retrait dessous | |

## 4. Enregistrement

| # | Action | Attendu | ✔/✘ |
|---|---|---|---|
| 4.1 | Après une vérification | « Enregistré à hh:mm » dans le bandeau ; le fichier `Prénom_Prénom.json` est à jour dans le dossier | |
| 4.2 | Fermer l'onglet, rouvrir `index.html` | « Reprendre le travail de … » ; « Reprendre » retrouve tout | |
| 4.3 | Deux équipes sur deux postes | Chacune n'ouvre que son propre fichier | |
| 4.4 | Firefox | Message « Tu utilises Firefox… » ; « Enregistrer » télécharge le fichier | |

## 5. Avis du professeur

- Textes (consignes, messages, indices) : à reprendre ?
- Écran d'exercice en trois colonnes (consigne · programme · tester) : lisible à 1366 × 768 ?
- Vidéoprojecteur : `index.html?enseignant=1&projecteur=1` (tout plus grand) : suffisant pour montrer un exemple ?
