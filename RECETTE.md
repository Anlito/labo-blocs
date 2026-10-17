# Recette — jalons 1 à 5 (noyau, parcours du distributeur, éditeur, cartes, mode direct, professeur)

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

## 9. Jalon 4 — « En direct » : le programme tourne dans l'ordinateur, la carte obéit

Matériel : la maquette du distributeur (Uno câblée), le mBot, la micro:bit V2 ; Chrome ou Edge. Les points « (V2) » (clé 2.4G du mBot) sont reportés à la V2.
Les cartes ont déjà leur programme de base (jalon 3). La recette automatique (`npm run recette`, 23 critères) fait le
chemin avec une carte et une clé virtuelles ; ici, le vrai matériel. Réussite du jalon : **un même exercice tourne en
simulateur, en direct, puis dans la carte**.

Dans un exercice : « Solution », puis à droite **« Tester » › « En direct »**, « Connecter la carte », « Lancer ».

| # | Action | Attendu | ✔/✘ |
|---|---|---|---|
| 9.1 | Distributeur, exercice 7 (`site/index.html?enseignant=1&exercice=dist-07`) : « Vérifier » dans le simulateur | Réussi | |
| 9.2 | « En direct » › « Connecter la carte » › « Lancer » | Bandeau « Garde le câble branché… s'arrête si tu fermes l'onglet » ; « Lancer » est actif | |
| 9.3 | Appuyer sur le **vrai** bouton PetiteDose (D3), puis GrandeDose (D4) | Les vraies LED D9 / D10 changent tout de suite, et l'écran montre la même chose. Le bouton à l'écran ne fait rien (« appuie sur le vrai bouton ») | |
| 9.4 | Exercice 13A en direct | La trappe (servo) et les LED obéissent aux vrais boutons, avec les bonnes durées | |
| 9.5 | « Arrêter » (ou modifier un bloc) | Tout s'éteint sur la maquette | |
| 9.6 | En direct, fermer l'onglet | La maquette s'éteint (au plus tard 3 s après) | |
| 9.7 | Même exercice : « Dans la carte » › « Envoyer mon programme », débrancher | Le programme tourne seul sur la maquette | |
| 9.8 | Atelier (ZIP) : carnet › Programmation › « Essayer en direct sur la maquette » | L'exercice 13 s'ouvre en mode « En direct » | |
| 9.9 (V2) | **mBot, clé 2.4G** : brancher la clé, allumer le robot (programme de base déjà installé au câble), découverte mBot ex. 3 › « En direct » › **« Connecter par la clé 2.4G »** | Une fenêtre liste la clé (« Makeblock », « HID »…) ; après « Connexion » : « Carte connectée · mBot (carte mCore) (clé 2.4G) ». **Sinon : noter ce qui s'affiche et le nom de la clé dans la fenêtre** | |
| 9.10 | « Lancer », robot par terre ; mettre la main devant les ultrasons | Le robot avance, s'arrête sous 20 cm ; le curseur « Distance » montre la vraie mesure (verrouillé) | |
| 9.11 (V2) | mBot par la clé : « Dans la carte » › « Envoyer mon programme », puis « Vider la carte » | Envoyé sans fil : le robot garde le programme ; vidé : il ne bouge plus | |
| 9.12 (V2) | mBot neuf (programme de mBlock) par la clé | « Il s'installe avec le câble USB (une seule fois) » | |
| 9.13 | micro:bit en direct (découverte micro:bit ex. 1 et 3) | Bouton A de la vraie carte → cœur et LED P0 ; ex. 3 : le curseur température montre la vraie température | |
| 9.14 | Éditeur : Réglages › « En direct » ; un exercice › « Modes pour tester » : « Simulateur seulement » | Chez l'élève, cet exercice n'a plus le choix du mode ; les autres gardent ceux du parcours | |
| 9.15 | Avis | Les messages du direct, le bandeau, le choix câble / clé vous conviennent ? | |

Limite connue : en direct, une note de la micro:bit dure au moins 1 s (la suivante la remplace à son heure). Dans la
carte et dans le simulateur, la durée est exacte.

## 10. Jalon 5 — le professeur : suivi de classe, niveaux par compétence, Carnet de classe

Pas de matériel. Une **classe test de 8 équipes fictives** est dans le paquet (`classe-test/5A`, refaite par
`npm run classe-test`). La recette automatique (`npm run recette`, 24 critères) la suit et l'exporte déjà. Réussite du
jalon : **une classe test de 8 équipes est suivie et exportée**.

| # | Action | Attendu | ✔/✘ |
|---|---|---|---|
| 10.1 | Ouvrir `site/prof.html` (Chrome ou Edge) › « Ouvrir le dossier de la classe » › le dossier `classe-test/5A` | « Classe 5A », 8 équipes, 2 bloquées depuis plus de 10 min, 2 envois dans la carte ; une ligne par équipe : exercices (✓ ▶), indices, dernier envoi, activité, niveaux C6 / C9, note /20, état | |
| 10.2 | Cliquer sur « Lucas · Ethan » | Fiche : compétences avec niveau calculé, note, commentaire ; exercices (état, vérifications, indices, temps, envois) | |
| 10.3 | « Voir » sur un exercice | L'écran d'exercice de Labo Blocs s'ouvre avec le programme de l'équipe ; « Lancer » le rejoue dans le simulateur ; « Fermer » | |
| 10.4 | Forcer C9 à « 3 · Atteint », écrire un commentaire, revenir à la classe, recharger la page, « Reprendre » | La note a changé ; le niveau forcé (3*) et le commentaire sont toujours là (fichier `labo-blocs-professeur.json` dans le dossier de la classe). Les fichiers des élèves ne sont pas modifiés | |
| 10.5 | « Exercices attendus : jusqu'à l'exercice 5 » | Les niveaux et les notes ne comptent plus que les 5 premiers exercices | |
| 10.6 | « Exporter (.csv) » | Ouvert dans Excel : une ligne par équipe, colonnes C6 / C9 (« 3 - Atteint »…), note, commentaire | |
| 10.7 | « Exporter pour le Carnet de classe » | Fichier `…labo-resultats.json` dans les Téléchargements | |
| 10.8 | **Carnet de classe** (version de la branche, voir ci-dessous) : une classe avec un projet et des élèves aux mêmes prénoms › Notes › « Importer des résultats Labo Blocs » › ce fichier | Panneau : compétences → critères (retrouvés si même libellé du programme), équipes → élèves (« ⚠ à choisir » pour deux élèves du même prénom ou un prénom introuvable) et groupe (existant ou nouveau) | |
| 10.9 | Corriger un élève à la main, « Importer » | Niveaux posés sur les groupes, commentaire ajouté ; « Annuler » dans le message remet tout comme avant ; ajustements et export Pronote comme d'habitude | |
| 10.10 | Atelier (ZIP) : `prof.html` › classe › bouton « Carnet de classe » ; une équipe › Bilan | Même fichier de résultats ; « Compétences (Labo Blocs) » dans le bilan | |
| 10.11 | Éditeur de parcours : un exercice › « Compétence évaluée » | C5, C6, C8, C9 (libellés du programme) ; le choix change les colonnes du suivi de classe | |
| 10.12 | Avis | Seuils (moins de 25 % : Non atteint ; moins de 60 % : Partiellement ; sinon Atteint ; Dépassé avec un défi réussi), compétences de chaque exercice du distributeur, colonnes du tableau | |

## 11. Kit nouveau projet — un futur projet relié à Labo Blocs

Préparation (Claude Code ou depuis le dépôt) : `npm run nouveau-projet -- ../essai-projet --titre "Barrière de parking"
--parcours decouverte-mbot --classes 4A,4B` (ou dossier `projet-exemple` du ZIP).

| # | Action | Attendu | OK ? |
|---|---|---|---|
| 11.1 | Ouvrir `site/programmation.html` en double-cliquant (Chrome) | Titre « Barrière de parking », couleur du projet, classes 4A et 4B, dossier « 4A › COMMUN › TECHNOLOGIE › BARRIERE DE PARKING › … » | |
| 11.2 | Créer une équipe, choisir son dossier, faire l'exercice 1 | Le fichier de l'équipe est enregistré dans son dossier, l'exercice est réussi | |
| 11.3 | Ouvrir `site/programmation-prof.html`, puis le dossier de la classe | L'équipe apparaît avec sa progression ; l'exemple de dossier est celui du projet | |
| 11.4 | Lire `LISEZ-MOI-LABO-BLOCS.md` et `docs/BRIEF-LABO-BLOCS.md` | Clairs : ce qui est fourni, comment mettre à jour, quoi donner à Claude Code | |

## 12. Accueil du professeur et code professeur

| # | Action | Attendu | OK ? |
|---|---|---|---|
| 12.1 | Ouvrir https://anlito.github.io/labo-blocs/ | Page « Espace professeur » qui demande le code | |
| 12.2 | Taper un mauvais code | Message en ambre « Ce n’est pas le code professeur… », la page reste cachée | |
| 12.3 | Taper le bon code | Accueil : « Créer ou modifier un parcours », « Suivre une classe », les parcours à essayer | |
| 12.4 | Ouvrir l'éditeur, revenir par « Accueil », essayer un parcours | Pas de nouveau code demandé ; le parcours s'ouvre en mode enseignant | |
| 12.5 | « Verrouiller » | Le code est redemandé | |
| 12.6 | Dans les projets (atelier céréales), la page des élèves | Aucun code demandé | |

## 13. Un nouveau parcours pour les élèves, avec ses classes

| # | Action | Attendu | OK ? |
|---|---|---|---|
| 13.1 | Éditeur › un parcours › « Réglages » : classes « 4A, 4B », dossier « {classe} › COMMUN › TECHNOLOGIE › ROBOT » | Valider : « {equipe} a été ajouté à la fin du dossier » | |
| 13.2 | « Publier » | Un fichier `<id>-<version>.labo-parcours.json` téléchargé, et la marche à suivre pour GitHub | |
| 13.3 | GitHub › dépôt labo-blocs › dossier `parcours` › « Add file › Upload files » › déposer le fichier › « Commit changes » | 2 ou 3 minutes plus tard, le parcours est dans l'accueil | |
| 13.4 | Accueil › « Copier le lien élèves », ouvrir ce lien | Classes 4A et 4B proposées ; dossier « 4A › COMMUN › TECHNOLOGIE › ROBOT › Prénom_Prénom » | |
| 13.5 | Ouvrir la page des élèves sans parcours (distributeur) | Les classes de `site/projet.js` (5A à 5F) | |

## 14. Exercice libre

| # | Action | Attendu | OK ? |
|---|---|---|---|
| 14.1 | Éditeur › un exercice › cocher « Exercice libre » | Composants, scénarios et compétence disparaissent ; « Exemple (facultatif) » à la place de la solution | |
| 14.2 | Publier, ouvrir l'exercice comme un élève (sur une carte Arduino Uno) | « J'ai terminé » à la place de « Vérifier » ; « Pose un bloc… » dans les composants | |
| 14.3 | Poser « contrôler la LED … D5 » puis « état sur la broche D2 » | LED D5 et bouton D2 apparaissent dans la liste et dans le simulateur ; « Lancer » allume la LED | |
| 14.4 | Mettre une LED et un bouton sur la même broche | Message en ambre : la broche sert à deux composants | |
| 14.5 | « J'ai terminé » | Message « Ton programme est enregistré… », l'exercice suivant s'ouvre ; dans le suivi de classe, pas de niveau pour cet exercice | |

## 15. Mise en ligne directe d'un parcours

| # | Action | Attendu | OK ? |
|---|---|---|---|
| 15.1 | Créer la clé sur GitHub (accueil › « Créer la clé sur GitHub », 5 étapes) | Une clé qui commence par `github_pat_` | |
| 15.2 | Accueil › coller la clé › « Enregistrer la clé » | « Clé enregistrée : GitHub reconnaît le dépôt labo-blocs » | |
| 15.3 | Éditeur › un parcours › « Publier » | La fenêtre annonce « mise en ligne » ; après « Publier » : « Version … mise en ligne » | |
| 15.4 | 2 à 3 minutes plus tard, accueil (Ctrl + F5 si besoin) | Le parcours et sa nouvelle version sont proposés | |
| 15.5 | Sur un autre ordinateur (sans clé), « Publier » | Le fichier est téléchargé, comme avant | |

## 16. Dossier de l'équipe créé par Labo Blocs

| # | Action | Attendu | OK ? |
|---|---|---|---|
| 16.1 | Page des élèves › un parcours › nouvelle équipe › « Choisir mon dossier » | Chemin jusqu'au dossier du projet, celui-ci surligné ; « Labo Blocs crée lui-même dedans le dossier de ton équipe » | |
| 16.2 | Choisir directement un dossier `Prénom_Prénom` | Message : choisis le dossier qui le contient | |
| 16.3 | Choisir le dossier du projet | Le dossier de l'équipe et son fichier sont créés ; « Dossier validé » | |

## 17. Exercice libre : deux composants sur la même broche

| # | Action | Attendu | OK ? |
|---|---|---|---|
| 17.1 | Exercice libre : un buzzer et un servomoteur sur D5 | Les deux apparaissent dans le simulateur, marqués « broche partagée » ; message en ambre | |
| 17.2 | Même chose dans l'aperçu de l'éditeur (exemple) | Message sous l'aperçu | |

## 18. Variables

| # | Action | Attendu | OK ? |
|---|---|---|---|
| 18.1 | Éditeur › exercice › « Variables données aux élèves » : `score` | Les blocs de variables proposent `score` | |
| 18.2 | Cocher « Les élèves créent leurs propres variables », vider les variables données | Palette : seulement « Créer une variable » (et le nombre) | |
| 18.3 | Élève : « Créer une variable », taper `delay` puis `ma vitesse` | `delay` refusé (mot du langage), `ma_vitesse` créée et proposée dans les menus | |

## 19. Réglages du collège (liste de classes commune)

| # | Action | Attendu | OK ? |
|---|---|---|---|
| 19.1 | Accueil de Labo Blocs › « Réglages » (bandeau ou pied de page) › « Réglages du collège » | Les classes actuelles (5A à 5F) et le chemin `Bureau › Classe › {classe} › COMMUN › TECHNOLOGIE` | |
| 19.2 | Ajouter les classes des autres niveaux (ex. 4A… 3F), « Publier les réglages » | « Réglages publiés (n classes) » | |
| 19.3 | 2 à 3 minutes plus tard, page des élèves › Distributeur | Seulement les classes de 5e ; chemin `Bureau › Classe › 5A › COMMUN › TECHNOLOGIE › DISTRIBUTEUR DE CEREALES` | |
| 19.4 | Page des élèves › un autre parcours | Toutes les classes du collège | |
| 19.5 | Classe d'un groupe (ex. 3D1) dans un projet de 3e | Chemin `Bureau › Classe › 3D › COMMUN › TECHNOLOGIE › 3D1 › …` | |

## 20. Accueil du professeur et page Réglages (refonte graphique)

| # | Action | Attendu | OK ? |
|---|---|---|---|
| 20.1 | Ouvrir l'accueil (code professeur) | Bandeau clair « Labo Blocs · Mode professeur », lien « Réglages », « Verrouiller » ; deux cartes (éditeur bleu, suivi vert) avec « Ouvrir l'éditeur → » / « Ouvrir le suivi → » ; liste des parcours (« Essayer », « Copier le lien élèves ») et « Page des élèves » | |
| 20.2 | « Réglages » | Page Réglages : « Réglages du collège » et « Mise en ligne des parcours », « ← Accueil » | |
| 20.3 | Téléphone (ou fenêtre étroite) | Une colonne, aucun défilement horizontal, boutons en pleine largeur | |
| 20.4 | Ouvrir `reglages.html` sans code | Le code professeur est demandé | |

## 21. Jalon 6 — Caméra et IA

À faire sur un poste du collège avec une webcam (Chrome ou Edge), page des élèves › « Découverte de la caméra (IA) ».

| # | Action | Attendu | OK ? |
|---|---|---|---|
| 21.1 | Exercice 1 | Panneau « Caméra et IA » sous le simulateur : Rien, Pouce levé, Main ouverte ; pas de mode « Dans la carte » | |
| 21.2 | « Allumer la caméra » | Le navigateur demande la caméra (accepter) ; l'image s'affiche en quelques secondes (la première fois, l'IA se charge) | |
| 21.3 | « Prendre 10 photos » pour chaque étiquette (pouce levé, main ouverte, rien devant) | 10 photos chacune ; « L'IA reconnaît : … » suit le geste montré | |
| 21.4 | Programme : « quand la caméra reconnaît Pouce levé → allumer D3 », « … ne reconnaît plus … → éteindre D3 », Lancer | La LED du simulateur suit le pouce levé | |
| 21.5 | Même chose « En direct » avec une Uno (LED sur D3) | La vraie LED suit le pouce levé | |
| 21.6 | « Vérifier mon programme » | Réussite ; un programme qui n'éteint pas : « Quand la caméra ne reconnaît rien, la LED D3 devrait être éteinte… » (ambre) | |
| 21.7 | Fermer, rouvrir la sauvegarde de l'équipe | Les photos sont toujours là (nombre et vignettes) | |
| 21.8 | Sans webcam : boutons « Sans caméra, faire comme si elle voyait » | Le programme réagit comme avec la caméra | |
| 21.9 | Éditeur de parcours : un exercice › « Caméra et IA » › étiquettes « Loup, Roi » | Catégorie « Caméra » dans les blocs ; scénario « Régler : la caméra reconnaît « Loup » » | |
| 21.10 | Cliquer deux fois « + 10 photos » sur une étiquette | 20 photos : les photos s'ajoutent, rien n'est effacé ; « Effacer les photos » repart de zéro | |
| 21.11 | Caméra allumée, bouger devant | « Ce que pense l'IA, en direct » : une barre par étiquette avec le trait du seuil (80 %), « … : n images sur 5 de suite », et la photo apprise qui ressemble le plus (avec le %) | |
| 21.12 | Exercice 3 « À toi d'inventer » : créer « Loup », puis « loup » | « Loup » ajoutée (et dans le menu des blocs) ; « loup » : « L’étiquette « loup » existe déjà. » (ambre) | |
| 21.13 | Renommer « Loup » en « Renard », fermer et rouvrir la sauvegarde | Le bloc affiche « Renard » ; étiquettes et photos retrouvées | |
| 21.14 | Éditeur de parcours : cocher « Les élèves créent leurs propres étiquettes » | L'exercice propose « Nouvelle étiquette » aux élèves | |

