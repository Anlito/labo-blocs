# Recette — jalons 1 à 3 (noyau, parcours du distributeur, éditeur, cartes)

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
| 3.2 | Construire le programme, « Lancer », maintenir le clic sur un bouton du simulateur, puis lâcher | Le bouton est un poussoir : appuyé tant qu'on le tient. Les LED, le servo et le bloc en cours (contour jaune) suivent | |
| 3.3 | « Pas » plusieurs fois | Un bloc à la fois, surligné | |
| 3.4 | « Vérifier mon programme » avec un programme incomplet | Une phrase en **ambre**, qui décrit ce que fait le programme, sans la réponse ; « Voir le test » rejoue le test | |
| 3.5 | Vérifier le bon programme | Message vert « Ton programme fait ce qu'on attend. L'exercice 2 est ouvert. » | |
| 3.6 | « Besoin d'aide ? » : ouvrir les 3 indices | Ils s'ouvrent un par un, le compteur passe à « 3 sur 3 utilisés », la silhouette a des cases « ? » | |
| 3.7 | Niveau « 3 · Code » puis cliquer sur un bloc | Le code Arduino s'affiche en bas, les lignes du bloc sont surlignées | |
| 3.8 | Exercice 13A (7 composants + distributeur) sur l'écran du collège | Tout est visible et lisible sans faire défiler le simulateur | |
| 3.9 | Cliquer sur les languettes bleues à mi-hauteur, entre les colonnes (‹ et ›), puis sur les bandes verticales ; « Masquer le texte » puis « Afficher le texte » dans la consigne | La zone de programmation s'agrandit, les colonnes se rouvrent ; le choix est gardé après rechargement | |
| 3.10 | Lire la consigne des exercices 5 et 7 | Les mots **si**, **alors**, **sinon** sont surlignés comme les blocs ; chaque « si » commence une ligne, « alors » et « sinon » sont en retrait dessous | |
| 3.11 | « Plein écran » en haut à droite, puis « Quitter le plein écran » (ou la touche Échap) | La page occupe tout l'écran (plus de barre d'onglets ni d'adresse), puis revient à la fenêtre normale | |

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

## 6. Jalon 1 bis — l'atelier du distributeur avec le moteur de Labo Blocs

Dépôt `atelier-cereales`, branche `claude/nice-volta-xpl2bp` (pas encore publiée : le site en ligne ne change pas tant
qu'elle n'est pas fusionnée dans `main`). Copier le dossier `site/` de cette branche dans un dossier de test du réseau.

> **Travailler sur des copies des fichiers d'équipes.** Un fichier réenregistré par cette version (format 2) ne s'ouvre
> plus dans l'atelier actuel, qui répond « Cette sauvegarde vient d'une version plus récente ». Rien n'est perdu, mais
> les élèves ne doivent passer à la nouvelle version qu'une fois la recette faite.
La recette automatique de l'atelier (`npm run recette`, 21 vérifications) fait déjà le parcours complet avec une équipe
test : ici, les vrais fichiers des élèves, l'écran du collège, la carte Arduino et l'avis du professeur.

| # | Action | Attendu | ✔/✘ |
|---|---|---|---|
| 6.1 | Ouvrir `index.html` de la copie, « Ouvrir notre sauvegarde » avec le fichier d'une équipe de cette année | Carnet retrouvé ; onglet Programmation : mêmes exercices réussis qu'avant, mêmes tentatives | |
| 6.2 | « Continuer » | L'écran d'exercice est celui de Labo Blocs (consigne en bandeau, languettes, Plein écran) ; les blocs de l'équipe sont là ; « Carnet » ramène au carnet | |
| 6.3 | Vérifier un exercice, puis « Carnet » | Le fichier de l'équipe est réenregistré (« Enregistré à hh:mm ») ; il se rouvre normalement | |
| 6.4 | Réussir le 13A (mode enseignant : « Solution »), puis « Envoyer dans la carte Arduino » dans le message de réussite, carte Uno branchée | Le programme arrive dans la carte, la maquette fonctionne comme avant | |
| 6.5 | `prof.html` : ouvrir le dossier d'une classe (fichiers anciens et réenregistrés mélangés) | Même tableau et mêmes notes qu'avec l'atelier actuel ; Historique › « Voir les blocs » et « Lancer ce programme » marchent | |
| 6.6 | `prof.html` › « Exercices » › « Choisir un fichier… » : `labo-blocs/tests/fixtures/distributeur-1.0.1-essai.labo-parcours.json` | Version 1.0.1 : exercice 1 modifié (consigne avant / après), exercice 3 « texte retouché » ; message sur le travail des élèves | |
| 6.7 | « Valider la mise à jour », choisir le dossier de la copie du site (celui qui contient `index.html`) | « Mise à jour installée : version 1.0.1 » ; `parcours/distributeur-precedent.js` apparaît dans le dossier | |
| 6.8 | Côté élève (équipe qui avait réussi l'exercice 1) : recharger l'atelier (F5), reprendre | Message « Ton professeur a modifié l'exercice 1… » ; dans le carnet, exercice 1 « ↻ modifié, à revérifier » ; ses blocs sont gardés, l'exercice 2 reste ouvert ; nouvelle consigne affichée | |
| 6.9 | `prof.html` › « Exercices » › « Revenir à la version précédente » | Retour à la version 1.0.0 ; l'élève retrouve l'ancienne consigne après F5 | |
| 6.10 | « Chercher en ligne » | Sans le site de Labo Blocs publié (à activer : Settings › Pages du dépôt labo-blocs) : message « La version en ligne est introuvable… » ; ensuite : la dernière version publiée | |
| 6.11 | Firefox : « Valider la mise à jour » | Le fichier `distributeur.js` est téléchargé, avec l'explication pour le copier dans `parcours/` | |

## 7. Jalon 2 — l'éditeur de parcours (créer un exercice sans toucher au code)

Ouvrir `site/editeur.html` (double-clic, Chrome ou Edge) dans le dossier de Labo Blocs. La recette automatique
(`npm run recette`, 15 critères) crée déjà un exercice complet, le publie et le fait réussir par un élève : ici, la main
du professeur, la souris et l'avis sur les mots.

| # | Action | Attendu | ✔/✘ |
|---|---|---|---|
| 7.1 | Ouvrir `site/editeur.html` | « Distributeur de céréales · version 1.0.0 · 14 exercices », « Ouvrir un fichier… », « Nouveau parcours » | |
| 7.2 | Ouvrir le distributeur, cliquer sur plusieurs exercices | Formulaire (titre, consigne, niveau, fiche), composants, blocs cochés, indices ; solution en blocs ; scénarios en phrases (« Vérifier que la LED D9 est allumée ») ; aperçu du simulateur | |
| 7.3 | Exercice 7 : « Tester mes scénarios sur ma solution », puis maintenir un bouton de l'aperçu | Chaque scénario en vert ; l'aperçu fait tourner la solution du moment (sans rien lancer) : la LED s'allume tant qu'on tient le bouton | |
| 7.4 | Exercice 7 : changer la broche du bouton PetiteDose (D3 → D7) | « 1 bloc de la solution et 4 étapes des scénarios mis à jour » ; « Remplacer aussi dans la consigne » corrige la consigne ; le test reste vert | |
| 7.5 | Cliquer sur 13B puis « Ajouter » : créer un exercice complet à la souris (titre, consigne, une LED, blocs cochés, solution construite avec les blocs, scénario « Vérifier / Attendre / Vérifier », deux indices) | « Tester mes scénarios » : vert. Sans vérification : message « Ce scénario ne vérifie rien » | |
| 7.6 | Glisser un exercice plus haut, « Dupliquer », « Supprimer » | Les numéros suivent l'ordre (13A / 13B restent ensemble) ; l'identifiant (ex. `dist-14`) ne change pas | |
| 7.7 | Sur un exercice : « Niveau de blocs : 3 · Code Arduino » + « Niveau imposé » | Côté élève (après publication) : le niveau 3 s'ouvre, les autres sont barrés, « Niveau imposé » | |
| 7.8 | Fermer l'onglet, rouvrir `editeur.html` | « Reprendre le brouillon : Distributeur de céréales » : tout est là | |
| 7.9 | « Publier la version 1.1.0 », choisir le dossier de Labo Blocs (celui qui contient `site` et `parcours`) | « Version 1.1.0 publiée » ; `parcours/distributeur/parcours.js` réécrit ; `distributeur-1.1.0.labo-parcours.json` téléchargé. Un exercice dont la solution ne passe pas ses scénarios bloque la publication, avec la phrase de l'écart | |
| 7.10 | Ouvrir `site/index.html?enseignant=1` | Le nouvel exercice est dans le parcours, sa consigne et sa palette sont celles de l'éditeur ; « Solution » puis « Vérifier » : réussi | |
| 7.11 | Atelier du distributeur (copie de test) : `prof.html` › « Exercices » › « Choisir un fichier… » avec le `.labo-parcours.json` | L'exercice ajouté apparaît dans les différences ; après validation et F5, les élèves l'ont | |
| 7.12 | Avis | Les mots des étapes, des blocs et des messages vous conviennent ? Manque-t-il une sorte d'étape ou de composant ? | |


## 8. Jalon 3 — les cartes : Arduino Uno, mBot, micro:bit V2

Matériel : une Arduino Uno (de préférence une qui a servi avec l'IDE Arduino ou l'ancien atelier), un mBot, une micro:bit
V2, leurs câbles USB ; **Chrome ou Edge**. La recette automatique (`npm run recette`, 20 critères) fait déjà tout le chemin
avec une carte virtuelle : ici, les vraies cartes. Succès du jalon : **les trois cartes reçoivent un programme et se vident**.

Pages : `site/index.html?enseignant=1` (distributeur, Uno), `site/index.html?parcours=decouverte-mbot&enseignant=1`,
`site/index.html?parcours=decouverte-microbit&enseignant=1`. Dans l'exercice : « Solution » pour avoir un programme
juste, puis à droite **« Tester » › « Dans la carte »**.

| # | Action | Attendu | ✔/✘ |
|---|---|---|---|
| 8.1 | Simulateur micro:bit (découverte micro:bit, ex. 1 à 3) : « Lancer », maintenir A, régler la température | Écran 5 × 5 (cœur, texte qui défile), LED P0, capteurs réglables à la main ; « Vérifier » : réussi avec la solution | |
| 8.2 | Simulateur mBot (découverte mBot, ex. 1 à 3) | Tableau : roues (▲ ▼), « Moteur gauche : 50 % en avant », LED avec leur couleur écrite ; curseur « Distance » : le robot s'arrête sous 20 cm | |
| 8.3 | **Uno** : « Connecter la carte », choisir la carte dans la fenêtre | Carte jamais utilisée avec Labo Blocs : « Installer le programme de la carte » ; sinon « Carte connectée · Arduino Uno · prête » | |
| 8.4 | « Installer le programme de la carte » | Barre « Installation : … % » (≈ 10 s), puis « Carte connectée » | |
| 8.5 | Exercice 2 (LED D9, câblée) : « Envoyer mon programme » | « Envoi : … % » puis « Programme envoyé » ; la LED clignote. Débrancher puis rebrancher le câble : le programme repart seul | |
| 8.6 | « Vider la carte » | « Carte vidée » ; la LED ne clignote plus, même après avoir rebranché | |
| 8.7 | Ouvrir l'IDE Arduino (moniteur série ouvert sur la carte), puis « Connecter la carte » dans Labo Blocs | « Carte déjà utilisée » (encadré rouge, pictogramme), « Ferme-le, puis réessaie » ; après fermeture de l'IDE : « Réessayer » marche | |
| 8.8 | **mBot** (découverte mBot, robot sur le dos ou sur cales) : connecter | « Installer le programme de la carte » (la carte a le programme de mBlock), puis « Carte connectée · mBot (carte mCore) » | |
| 8.9 | Ex. 1 : envoyer, poser le robot par terre, l'allumer | Il avance 2 s puis s'arrête. **Les deux roues vont-elles vers l'avant ?** | |
| 8.10 | Ex. 2 : envoyer ; appuyer sur le bouton de la carte | Le robot avance et ses deux LED sont vertes tant qu'on appuie. **Quelle LED est à gauche ?** (essayer aussi le bloc « LED gauche en rouge ») | |
| 8.11 | Ex. 3 : envoyer ; avancer la main devant les ultrasons (port 3) | Le robot s'arrête sous 20 cm. Faire aussi un essai « tourner à gauche » : **tourne-t-il bien à gauche ?** | |
| 8.12 | mBot : « Vider la carte » | « Carte vidée » : le robot ne bouge plus, même après extinction et rallumage | |
| 8.13 | **micro:bit V2** : connecter | « Installer le programme de la carte » ; « Enregistrer le fichier » télécharge `labo-blocs-microbit-0.2.hex` | |
| 8.14 | Glisser le fichier sur le lecteur MICROBIT, attendre la fin, « Connecter la carte » | « Carte connectée · micro:bit V2 · prête » | |
| 8.15 | Ex. 2 (LED sur P0) : envoyer | « Bonjour » défile, puis la LED P0 clignote ; ex. 3 : le bouton B affiche la température | |
| 8.16 | micro:bit : « Vider la carte » | « Carte vidée » : plus rien ne s'affiche | |
| 8.17 | Brancher la micro:bit mais ouvrir un exercice du distributeur (Uno) et connecter | « Ce n'est pas la bonne carte · Carte branchée : micro:bit V2 », « Branche la bonne carte » | |
| 8.18 | Atelier du distributeur (ZIP) : exercice 13A réussi → « Envoyer dans la carte Arduino » ; carnet › Programmation › « Envoyer mon programme dans la carte Arduino », puis « Vider la carte » | Le mode « Dans la carte » s'ouvre sur l'exercice 13 ; la maquette fonctionne avec le programme de l'équipe ; « Vider la carte » efface ; `prof.html` › équipe › Bilan : « Programme envoyé dans la carte : n fois » | |
| 8.19 | Éditeur (`site/editeur.html`) : « Nouveau parcours » › Réglages › Carte « micro:bit V2 » + « Dans la carte » | Composants P0–P2, catégories lilas Écran / Boutons / Capteurs / Musique ; étape « Régler un capteur de la carte » dans les scénarios | |
| 8.20 | Avis | Les mots des blocs mBot et micro:bit, les messages de la carte, le tableau du mBot vous conviennent ? | |
