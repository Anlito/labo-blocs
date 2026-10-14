# Brief Claude Design — Labo Blocs

Version 1 · 14/10/2026 · à lire avec `CAHIER-DES-CHARGES-outil-blocs.md` (v5)

## 1. Ce qu'il faut concevoir

Les maquettes de **Labo Blocs**, un outil web de programmation par blocs pour des collégiens de 5e, 4e et 3e (11 à 15 ans),
utilisé en classe sur ordinateur (Chrome ou Edge, écran de collège ordinaire, environ 1366 × 768 minimum).
Le professeur crée des parcours d'exercices ; les élèves programment, testent dans un simulateur, puis envoient le programme
dans une carte (Arduino, mBot, micro:bit) ou la pilotent en direct.

**Priorités de conception** : lisibilité immédiate pour un élève qui lit peu, un seul fonctionnement pour tous les projets,
des messages qui rassurent (jamais de reproche), et un poste de pilotage clair pour le professeur.

## 2. Principes à respecter

1. **Un seul style de blocs et un seul fonctionnement pour tous les projets.** Un élève qui change de projet ne
   réapprend rien : mêmes catégories de couleur, mêmes formes de blocs, mêmes boutons au même endroit.
2. **Peu de texte.** Consignes courtes, verbes d'action, pictogrammes. Les élèves lisent peu : ne pas afficher de
   paragraphes.
3. **Messages bienveillants et observables.** On décrit ce que le programme fait, jamais « tu as faux ». Exemple de ton :
   « Quand le bouton D8 est appuyé, la LED D3 devrait être allumée. Dans ton programme, elle reste éteinte. »
   Une vérification ne donne jamais la réponse.
4. **Erreurs de carte en français simple**, avec la prochaine action. Exemples de ton :
   « Débranche et rebranche le câble USB, puis réessaie. Si ça recommence, demande au professeur. »
   « La carte est déjà utilisée par un autre programme. Ferme-le, puis réessaie. »
5. **Identité propre à l'outil, couleur d'accent par projet.** Le noyau (blocs, boutons, structure) ne change pas ;
   chaque projet peut avoir sa couleur d'accent et son titre (ex. distributeur, théâtre d'ombre, mBot).
6. **Accessibilité** : contrastes forts, cibles larges, ne jamais coder une information par la couleur seule,
   textes lisibles à 12-14 ans, compatible plus tard avec un mode très simplifié (6e SEGPA : phrases courtes,
   pictogrammes, cases à cocher).
7. **Pas d'esthétique enfantine ni de manga imposée** pour l'outil : sobre, moderne, techno. (Les supports de quiz gardent
   leur style manga ailleurs.)

## 3. Écrans à maquetter

### A. Côté élève

1. **Accueil** : « Nouvelle équipe » (1 à 3 prénoms + classe), « Ouvrir notre sauvegarde », et une carte
   « Reprendre le travail de … » si un travail récent existe.
2. **Dossier de l'équipe** : affiche le chemin attendu (`5A › COMMUN › TECHNOLOGIE › <PROJET> › Prénom_Prénom`), bouton
   pour choisir le dossier, cas « le sous-dossier existe déjà : ouvrir la sauvegarde ? », version Firefox (sans choix de
   dossier : « Enregistrer » télécharge le fichier).
3. **Parcours** : liste d'exercices dans l'ordre, état de chacun (verrouillé, à faire, réussi, à revérifier après
   modification), exercices « défi » facultatifs, progression globale.
4. **Écran exercice** (le plus important) :
   - consigne courte, fiche « À savoir » et lexique accessibles ;
   - **espace de blocs** au centre, palette limitée aux blocs autorisés ;
   - **simulateur** (maquette de la carte et des composants : LED, boutons cliquables, servo, etc.) avec lecture, pause,
     vitesse ×1 / ×2 / ×5 et blocs surlignés pendant l'exécution ;
   - boutons : **Vérifier mon programme**, **Indice** (3 niveaux ouverts un par un, compteur visible), **Exécuter** ;
   - **sélecteur de mode**, avec seulement les modes proposés par le professeur : Simulateur / En direct / Dans la carte ;
   - zone de messages ; état d'enregistrement (« enregistrement… », « enregistré ») ;
   - niveaux 1 / 2 / 3 : au niveau 3, un panneau **code Arduino en lecture seule** relié aux blocs (clic sur un bloc =
     lignes surlignées).
5. **Résultat de la vérification** : réussite (message encourageant, ouverture de l'exercice suivant) et écart observé
   (une seule phrase, le premier écart).
6. **Connexion à la carte et envoi** : états à dessiner — aucune carte, choix du port, installation du programme de la
   carte (étape ponctuelle), connectée, envoi en cours, envoyé, **vider la carte** (fin de séance), carte déjà utilisée,
   carte pas à jour. Un bandeau clair indique en mode direct que **le câble doit rester branché et que le programme
   s'arrête si l'on ferme l'onglet**.
7. **Carnet / pages propres au projet** : seulement un emplacement dans la navigation (le contenu reste dans chaque
   projet).

### B. Côté professeur

8. **Éditeur de parcours** : liste d'exercices réordonnable, duplication, import / export du parcours, version du
   parcours affichée.
9. **Éditeur d'exercice** : titre, consigne, carte cible, composants et broches, **blocs autorisés** (cases à cocher par
   catégorie), niveau, **solution de référence** (espace de blocs), **scénarios de test** (éditeur à étapes : attendre,
   appuyer, relâcher, vérifier l'état d'une LED ou l'angle d'un servo…), 2 indices écrits (le 3e est tiré de la solution),
   fiche « À savoir », aperçu du simulateur et bouton « Tester mes scénarios sur ma solution ».
10. **Suivi d'une classe** : ouvrir le dossier de la classe, « Reprendre », import / glisser-déposer de fichiers ;
    tableau avec une ligne par équipe : progression par exercice, indices utilisés, dernier envoi dans la carte, dernière
    activité.
11. **Fiche d'une équipe** : programme de chaque exercice rejouable dans le simulateur, validation manuelle,
    commentaire, note avec barème et appréciation, export CSV pour Pronote.
12. **Réglages du projet** : modes d'exécution proposés, niveau verrouillé pour une évaluation, cartes autorisées.

### C. Admin d'un projet (distributeur, théâtre d'ombre…)

13. **Mettre à jour les exercices** : version actuelle du projet et version disponible ; liste des différences
    (ajoutés, modifiés, supprimés, déplacés) avec aperçu de chaque exercice ; compatibilité avec la version du moteur ;
    deux sources (en ligne, ou fichier déposé) ; **Valider la mise à jour** et **Revenir à la version précédente** ;
    blocage visible quand une évaluation est verrouillée ; message sur ce qui arrive au travail des élèves (blocs conservés,
    exercice marqué « modifié, à revérifier »).

## 4. Le style des blocs : celui de l'atelier du distributeur de céréales

Décision (14/10/2026) : Labo Blocs reprend **le rendu des blocs du distributeur de céréales**, pour ne pas perturber les élèves.
Source : `atelier-cereales/site/js/blocs.js` (thème Blockly « atelier ») et `css/atelier.css`.
- Rendu Blockly **Zelos** (blocs arrondis), thème dérivé de Classic, police Segoe UI en gras, taille 12 (échelle selon l'écran) ;
- aplats pastel, texte foncé `#1F2A30` en gras (contraste > 7:1), contour = couleur assombrie à 72 % ;
- familles : démarrage `#86C595` · lumière / sorties et décisions `#F7AE5E` · temps et calculs `#78B5D6` ·
  entrées et valeurs `#BCDAEB` · moteurs `#E78AB3` · variables `#EC8780` ;
- **nouvelle famille Extensions** (Vision IA, Sons, mBot, modules de l'escape game) : lilas `#C3B1E1`, bord pointillé, pictogramme puzzle ;
- blocs « Au démarrage » et « Répéter indéfiniment » avec pastille « ? » d'aide ;
- palette : colonne de catégories (tuile colorée 34 px + nom) puis tiroir gris-bleu `#EAF0F3` ; atelier `#F7FAFB` avec grille de points ;
- bloc en cours d'exécution : contour jaune `#FFC400` épais ; bloc hors programme : pointillé foncé ;
- les blocs de la palette ne donnent jamais la réponse (broche par défaut D2) ;
- un bloc ne dépend jamais d'un projet : seule la liste des blocs proposés change.

## 5. Ce qui est attendu en retour

- La **charte** : couleurs, typographie, composants d'interface, blocs.
- Les écrans A1 à A6, B8 à B12 et C13, en version ordinateur, avec leurs états importants (vide, en cours, erreur, réussite).
- Une version **vidéoprojecteur** de l'écran d'exercice (grande police) pour que le professeur montre un exemple à la classe.
- Les écrans commentés pour la reprise en développement dans Claude Code (composants réutilisables, états, messages).

## 6. Points techniques qui contraignent le design

- Fonctionne **hors ligne** depuis un dossier réseau et en ligne (pages statiques).
- Chrome / Edge : accès USB et choix de dossier ; Firefox : sans USB ni choix de dossier, avec message clair.
- Aucun compte, aucune donnée envoyée ailleurs : prénoms et classe uniquement, dans les dossiers de la classe.
- Projets à couvrir sans refonte : distributeur de céréales, théâtre d'ombre (webcam + IA), mBot Challenge, escape game,
  Simon Rétro Game, Labyrinthe Robotisé.
