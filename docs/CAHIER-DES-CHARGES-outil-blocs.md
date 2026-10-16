# Cahier des charges — Labo Blocs : outil de programmation par blocs (parcours, correction automatique, simulateur, cartes)

Version 5 · 14/10/2026 · Auteur : Thomas · Statut : à valider avant le brief Claude Design / Claude Code

---

## 1. Contexte et objectif

Les projets de cycle 4 utilisent déjà de la programmation par blocs, mais chaque outil est écrit pour un seul projet
(distributeur de céréales, théâtre d'ombre augmenté). Objectif : **un seul outil générique**, dans lequel le
professeur crée lui-même des **parcours d'exercices** de programmation par blocs, que les élèves suivent, testent
dans un **simulateur** puis, selon le projet, **exécutent en direct** ou **téléversent dans la carte**.

Cet outil remplace Vittascience et mBlock pour les séances de programmation, et se substitue aux outils
« maison » propres à chaque projet.

## 2. Ce qui existe déjà et doit être réutilisé

| Brique | Dépôt | À réutiliser pour |
|---|---|---|
| Éditeur Blockly, palette de blocs autorisés par exercice | `atelier-cereales` (`js/blocs.js`, `editeur.js`, `vendor/blockly`) | Éditeur de blocs |
| Format d'exercice : `titre`, `consigne`, `composants`, `blocsAutorises`, `indices`, `solutionReference`, `scenarios`, `aSavoir` | `atelier-cereales` (`exercices/*.js`) | Modèle de données d'un exercice |
| Vérification par scénarios (attendre, appuyer, vérifier LED / servo) | `atelier-cereales` | Correction automatique |
| Simulateur (maquette) | `atelier-cereales` (`simulateur-vue.js`, `js/moteur`) | Simulateur |
| Envoi dans une carte Arduino en USB, « Vider la carte » | `atelier-cereales` (`flasher.js`, `carte-envoi.js`, `firmware/`) | Téléversement Arduino |
| Niveaux 1 / 2 / 3 (blocs → code Arduino), verrouillage par le professeur | `theatre-ombre` | Niveaux de difficulté d'un parcours |
| **Mode live déjà réalisé (sorties)** : programme fixe de la carte (`arduino/theatre_ombre/theatre_ombre.ino`), protocole texte USB (`protocol.js`), liaison Web Serial (`serial.js`, `board.js`), carte simulée jumelle (`simulated-board.js`), exécution des blocs dans le navigateur avec JS-Interpreter, un « fil » par bloc « quand… » (`runtime.js`) | `theatre-ombre` | Mode live |
| Installation du programme fixe dans la carte (STK500 en Web Serial, Uno / Nano) : `flasher.js` existe **en double**, copié d'un dépôt à l'autre | `theatre-ombre`, `atelier-cereales` | Téléversement Arduino ; preuve du besoin d'un module partagé |
| Sauvegarde, reprise, suivi professeur, notes, export CSV Pronote | `atelier-cereales`, `theatre-ombre` (`fichiers.js`, `prof.js`) | Sauvegarde et outil professeur |
| Déploiement GitHub Pages + archive ZIP pour le dossier réseau | `atelier-cereales` (`tools/archive.js`) | Distribution |
| Recette dans de vrais navigateurs | `atelier-cereales`, `theatre-ombre` (`RECETTE*.md`, `tools/recette.js`) | Critères de recette |

À relire avant le développement : le code réel de `flasher.js` (protocole d'envoi) et du moteur de simulation.

## 3. Utilisateurs

- **Élève / équipe (1 à 3 prénoms)** : suit un parcours, programme, teste, demande un indice, envoie sur la carte.
- **Professeur** : crée et modifie les parcours, choisit le mode d'exécution de chaque projet, suit les classes,
  note, exporte vers Pronote.
- Niveaux visés : 5e, 4e, 3e. Option 6e SEGPA plus tard (consignes très courtes, pictogrammes) : prévoir un
  « mode simplifié » dans la structure de données, sans le développer dans la version 1.

## 4. Fonctions attendues

### 4.1 Éditeur de blocs
- Blocs visuels (Blockly), palette limitée aux blocs autorisés par l'exercice.
- **Un seul style de blocs et un seul fonctionnement pour tous les projets** (mêmes couleurs, mêmes formes, mêmes
  noms de blocs, mêmes boutons, mêmes messages) : l'élève qui change de projet ne doit rien réapprendre.
- Trois niveaux de blocs, au choix du professeur et verrouillables pour une évaluation (comme dans le théâtre d'ombre) :
  1 premiers pas, 2 boucles / conditions / variables, 3 blocs + code texte Arduino affiché.
- Affichage du code généré (lecture seule en niveau 1-2).
- Annuler / rétablir, zoom, nettoyage de l'espace de travail.

### 4.2 Parcours et exercices (côté professeur, sans toucher au code)
- **Éditeur de parcours** intégré à l'outil : créer un parcours, ajouter / réordonner des exercices, dupliquer un exercice.
- Un exercice contient : titre, consigne, composants et broches, blocs autorisés, solution de référence, scénarios
  de test, indices, fiche « À savoir », niveau, carte cible.
- Un parcours est un **fichier de contenu** exportable et importable (`.json`) : le professeur peut le partager, le
  versionner, le copier d'une classe à l'autre.
- Règle de progression : réussir l'exercice N ouvre le N+1 ; exercices « défi » facultatifs ; option pour tout débloquer.
- Parcours d'exemple fournis (reprise du distributeur, exercices de base LED / bouton / servo).

### 4.3 Solutions et correction automatique
- Le professeur enregistre la **solution de référence** en construisant les blocs lui-même.
- Il décrit les **scénarios de test** avec un éditeur à étapes (attendre X s, appuyer sur un bouton, vérifier l'état
  d'une LED, l'angle d'un servo, etc.), sans écrire de code.
- Bouton « Vérifier mon programme » : l'outil exécute les scénarios dans le simulateur, indique ce qui est réussi
  et ce qui échoue, **sans donner la réponse**.
- Une solution différente de la référence est acceptée si elle passe tous les scénarios.

### 4.4 Système d'indices
- 3 niveaux d'indices, ouverts un par un : 1 et 2 écrits par le professeur, 3 généré à partir de la solution
  (par exemple la silhouette des blocs, comme aujourd'hui).
- Chaque indice utilisé est **noté pour le professeur** et peut compter dans le barème.

### 4.5 Simulateur
- Maquette de la carte et des composants de l'exercice (LED, bouton, servo, moteurs, capteurs…), construite à
  partir de la liste `composants` de l'exercice.
- Lecture pas à pas, vitesse réglable, boutons cliquables, état des broches visible.
- Le même moteur sert à la correction automatique (une seule source de vérité).

### 4.6 Modes d'exécution — choisis **par projet** (et surchargeables par exercice)

| Mode | Principe | Usage type |
|---|---|---|
| **Simulateur seul** | Aucune carte n'est branchée | Découverte, remplacement quand le matériel manque |
| **Live** | Les blocs s'exécutent dans le navigateur ; les ordres sont envoyés à la carte en direct par USB, et les capteurs remontent à l'écran | Voir la carte réagir tout de suite, déboguer, séances courtes |
| **Téléversement** | Le programme est envoyé dans la mémoire de la carte, qui tourne seule, débranchée de l'ordinateur | Projet fini, robot autonome (mBot), distributeur, escape game |

Le professeur règle, dans la fiche du projet, quels modes sont proposés aux élèves (un seul, ou plusieurs).
Le mode « Live » exige que l'ordinateur reste branché ; le programme s'arrête à la fermeture de l'onglet : à afficher
clairement à l'élève.

### 4.7 Cartes à gérer
Pour chaque carte : un **profil** (broches, composants disponibles, blocs spécifiques, méthode de live, méthode de
téléversement).

- **Arduino (Uno ou compatible)** : base déjà éprouvée dans l'atelier des céréales.
- **mBot** (carte mCore, compatible Arduino ; le mBot Ranger n'est pas dans le périmètre, aucun en salle) : blocs dédiés (moteurs, capteur de
  ligne, ultrasons, LED RGB, buzzer, bouton de la carte).
- **micro:bit (V1 et V2 : deux profils, la V2 ajoutant notamment haut-parleur et capteur tactile)** : blocs dédiés (écran LED, boutons A / B, accéléromètre, broches, radio éventuelle).
- Les profils sont des **données** : en ajouter un ne doit pas imposer de réécrire l'éditeur.

Moyen d'envoi « Vider la carte » (programme vierge de fin de séance, voir la fiche sécurité mBlock existante) pour les
trois cartes.

### 4.8 Sauvegarde — **à reprendre à l'identique des autres projets**
- Un seul fichier `.json` par équipe, nommé `Prénom_Prénom.json`, dans le dossier de l'équipe :
  `Classe › COMMUN › TECHNOLOGIE › <PROJET> › Prénom_Prénom`.
- Chrome / Edge : choix du dossier une fois, puis réenregistrement automatique peu après chaque modification et à chaque
  vérification. Firefox : « Enregistrer » télécharge le fichier, que l'élève range lui-même.
- Aucune sauvegarde existante n'est écrasée : l'outil propose de l'ouvrir. Création automatique du sous-dossier de
  l'équipe.
- Copie de secours dans le navigateur et carte « Reprendre le travail de… » à l'accueil.
- Pas de compte, pas de base de données, pas de serveur.
- Le fichier contient : équipe, parcours suivi (identifiant et version), programme en blocs de chaque exercice,
  réussites, indices utilisés, dates, envois dans la carte.
- Le format est versionné (`version` dans le fichier) pour pouvoir migrer les anciennes sauvegardes.
- Le professeur peut écrire un fichier à part (comme `validations.json`) dans le dossier de l'équipe, sans toucher
  au fichier de l'élève.

### 4.9 Outil professeur
- Même structure que les autres projets : accueil « Suivre une classe » (ouvrir le dossier de la classe, lecture de
  tous les dossiers d'équipes d'un coup, « Reprendre », import / glisser-déposer de `.json`).
- Tableau de classe : progression par exercice, indices utilisés, dernier envoi dans la carte, dernière activité.
- Fiche d'équipe : programme de chaque exercice (rejouable dans le simulateur), validation manuelle, commentaire.
- Notation avec barème paramétrable, appréciation générée, **export CSV** aux libellés Pronote (Non atteint,
  Partiellement atteint, Atteint, Dépassé), alignés sur les compétences du programme de technologie cycle 4 (BO 2024).
- Verrouillage du niveau et du mode d'exécution pour une évaluation.

### 4.10 Intégration avec les projets (distributeur de céréales, puis les autres)

**Principe** : l'outil général est la **source unique** des parcours de programmation. Chaque projet embarque une
copie du parcours qui le concerne ; son espace admin permet de la mettre à jour quand le professeur le décide.
Le projet garde ses propres parties (carnet, tutoriel de câblage, fiches, suivi) : seuls les exercices de
programmation viennent de l'outil général.

**Règles**
1. **Paquet de parcours versionné** : un identifiant, un numéro de version, une date, la liste des exercices.
   Chaque exercice a un **identifiant stable**, indépendant de sa position (jamais « exercice 3 » comme clé).
2. **Référence dans le projet** : la configuration du projet indique le parcours utilisé et sa version. Le projet
   fonctionne avec sa copie locale, donc **hors ligne** et sans changement imprévu.
3. **Mise à jour depuis l'admin du projet** : bouton « Mettre à jour les exercices » qui compare avec la version
   disponible et affiche les exercices ajoutés, modifiés, supprimés et déplacés. **Rien ne s'applique sans validation
   du professeur** ; retour à la version précédente possible.
4. **Deux moyens de récupérer le parcours** : en ligne (adresse de l'outil général) ou par fichier (export du parcours
   puis dépôt dans l'admin du projet, pour les sites utilisés depuis le dossier réseau).
5. **Protection du travail des élèves** : la sauvegarde d'une équipe référence les identifiants d'exercices et la
   version du parcours. Si un exercice a changé, les blocs de l'élève sont **conservés** et l'exercice est marqué
   « modifié, à revérifier » ; les réussites déjà obtenues ne sont pas effacées. Un exercice supprimé reste visible
   en lecture seule dans la sauvegarde.
6. **Pas de mise à jour pendant une évaluation** : le verrouillage du professeur (niveau, mode, parcours) empêche
   toute mise à jour tant qu'il est actif.
7. **Un seul moteur partagé** : l'éditeur de blocs, le simulateur, les scénarios de test et les profils de cartes forment
   un **module versionné** utilisé à l'identique par l'outil général et par tous les projets. Un parcours déclare la
   version minimale du moteur dont il a besoin ; l'admin du projet signale une incompatibilité avant la mise à jour.
8. **Apparence identique partout** : le module impose le même style de blocs, les mêmes noms et les mêmes
   comportements ; un projet ne peut personnaliser que ses couleurs d'accent et ses textes autour.

**Premier cas réel** : le distributeur de céréales. Ses exercices 01 à 13B deviennent un parcours de l'outil général,
et l'atelier existant est migré vers le module partagé (même carnet, même tutoriel, mêmes sauvegardes anciennes
lisibles grâce au champ `version`).

**À éviter** : charger en direct l'écran de programmation de l'outil général depuis chaque projet (plus de
fonctionnement hors ligne, modifications non maîtrisées en cours d'année).

## 5. Contraintes

- **Hors ligne** : l'outil doit fonctionner depuis le dossier réseau (double-clic sur `index.html`), sans internet.
  Il est aussi publié en ligne (GitHub Pages) comme les autres projets.
- **Navigateurs** : Chrome et Edge pour l'accès USB et aux dossiers ; Firefox utilisable sans USB ni choix de dossier.
- **Postes du collège** : l'accès USB depuis Chrome / Edge fonctionne sur les postes du collège (constaté avec le théâtre
  d'ombre). À reconfirmer sur plusieurs postes et pour le téléversement lui-même (jalon 0).
- **Données des élèves** : prénoms et classe uniquement, stockés dans le dossier de la classe, jamais envoyés à un
  service externe.
- **Maintenance par le professeur** : contenus modifiables sans toucher au code, procédure documentée en français
  (comme `LISEZ-MOI.md`).
- Interface en français, lisible à 12-14 ans, utilisable sur des écrans de collège ordinaires.
- Pas d'hypothèse sur le matériel : lister dans l'outil les cartes réellement disponibles en salle avant de proposer
  un projet (à confirmer par Thomas).

## 6. Architecture proposée

1. **Application web statique** (HTML / JavaScript, sans serveur), construite avec les mêmes choix que l'atelier des céréales.
2. **Séparation en trois couches** :
   - *contenu* (parcours, exercices, profils de cartes) en fichiers de données ;
   - *moteur* (exécution des blocs, simulateur, scénarios) ;
   - *interfaces* (élève, éditeur de parcours, professeur).
3. **Mode live** : sur la carte, un petit programme fixe (« serveur de commandes ») reçoit des ordres par USB et renvoie
   l'état des capteurs ; le navigateur exécute les blocs et envoie les ordres. Ce programme est téléversé une fois
   par séance (ou déjà présent sur la carte). **Déjà réalisé pour les sorties dans le théâtre d'ombre** (protocole v1 :
   `PING`, `D`, `A`, `T`, `OFF` ; la carte éteint tout après 3 s sans message). **À étendre** : la lecture des entrées
   (boutons, capteurs) n'existe pas encore dans ce protocole, il faut un protocole v2 (voir section 10).
4. **Mode téléversement — décision à prendre** (c'est le point technique le plus structurant) :
   - **Option A — firmware précompilé par exercice** : c'est l'existant (atelier des céréales). Simple et hors ligne, mais
     inutilisable pour un programme libre écrit par l'élève.
   - **Option B — compilation côté serveur** (arduino-cli ou équivalent) : programme libre possible, mais il faut un
     serveur et internet, ce qui contredit la contrainte « hors ligne ».
   - **Option C — interpréteur embarqué** : un firmware fixe sur la carte exécute un programme compact (bytecode)
     envoyé par l'outil, sans compilation. Fonctionne hors ligne et pour des programmes libres. Une partie est à
     développer pour chaque carte.
   - **Décision du 14/10 : option C (firmware embarqué) pour Arduino Uno et mBot mCore.** Pour le micro:bit, une
     solution propre à la carte reste à étudier (il se programme et se téléverse déjà dans le navigateur, mais avec
     ses propres outils). À valider par un prototype de quelques heures avant le brief Claude Code (jalon 0).
   - **Conséquence sur l'architecture** : les projets futurs ajouteront de nouvelles cartes, de nouveaux composants et de
     nouveaux blocs ; l'interpréteur embarqué et les profils de cartes doivent donc être pensés comme extensibles
     dès la conception.
5. **Export de secours** : chaque programme peut être exporté en code `.ino` / `.hex` pour l'IDE Arduino ou pour le
   micro:bit.

## 7. Jalons proposés

| Jalon | Contenu | Critère de réussite |
|---|---|---|
| **0 · Essais** | Accès USB et dossiers déjà validés sur un poste du collège (théâtre d'ombre), à reconfirmer sur d'autres postes ; prototype d'envoi libre dans une carte Arduino et un mBot | Une carte reçoit un programme écrit en blocs, sur un poste réel |
| **1 · Noyau** | Moteur partagé et versionné (blocs, simulateur, scénarios), exercice générique avec identifiants stables, paquet de parcours versionné, indices, sauvegarde commune | Le parcours du distributeur est refait dans l'outil générique sans code spécifique |
| **1 bis · Intégration** | Bouton « Mettre à jour les exercices » dans l'admin du distributeur (en ligne et par fichier), comparaison, validation, retour arrière, protection des sauvegardes | Un exercice modifié dans l'outil général arrive dans le distributeur après validation, sans perdre le travail d'une équipe test |
| **2 · Parcours** | Éditeur de parcours et de scénarios, import / export, verrouillage de niveaux | Le professeur crée un exercice complet sans toucher au code |
| **3 · Cartes** | Profils Arduino, mBot, micro:bit ; mode téléversement ; « Vider la carte » | Les trois cartes reçoivent un programme et se vident en fin de séance |
| **4 · Live** | Serveur de commandes, mode live, choix du mode par projet | Un même exercice tourne en simulateur, en live, puis en téléversement |
| **5 · Professeur** | Suivi de classe, notes, export CSV Pronote | Une classe test de 8 équipes est suivie et exportée |

## 8. Critères de recette (à compléter, même méthode que `RECETTE.md`)

- Un élève crée une équipe, choisit son dossier réseau, programme, ferme le navigateur, rouvre et retrouve tout.
- Deux équipes sur deux postes : chacune n'ouvre que son propre fichier.
- Un programme correct passe tous les scénarios ; un programme faux indique ce qui échoue sans donner la réponse.
- Les trois indices s'ouvrent dans l'ordre et sont comptés.
- Le même programme donne le même comportement en simulateur et sur la carte.
- En fin de séance, « Vider la carte » arrête tout mouvement sur Arduino, mBot et micro:bit.
- L'outil s'ouvre depuis le dossier réseau sans internet.
- Firefox : tout fonctionne sauf USB et choix de dossier, avec un message clair.

## 9. Questions ouvertes

1. ~~Cartes en salle~~ — **Réponse : Arduino Uno, mBot mCore, micro:bit.** micro:bit : **les deux versions (V1 et V2)** sont en salle, donc deux profils à gérer.
2. ~~USB depuis Chrome / Edge sur les postes du collège~~ — **Réponse : oui, ça fonctionne avec le théâtre d'ombre.**
3. ~~Option de téléversement~~ — **Réponse : option C, firmware embarqué** (section 6).
4. ~~Mode simplifié 6e SEGPA~~ — **Réponse : pas dans la version 1**, on garde seulement la place dans la structure des données.
5. ~~Nom de l'outil~~ — **Réponse : « Labo Blocs »** (nom provisoire, dépôt GitHub du même nom).
6. ~~Projets suivants~~ — **Réponse : le théâtre d'ombre passe ensuite sur le module partagé ; d'autres projets suivront, et il faut en tenir compte dès la construction du cahier des charges.** Tous les projets suivront le même style de blocs et le même fonctionnement. Projets à couvrir dès la conception : **mBot Challenge, Escape game, Simon Rétro Game, Labyrinthe Robotisé** (en plus du distributeur et du théâtre d'ombre). À vérifier pour chacun, avant le brief Claude Code : cartes, composants et blocs nécessaires, mode d'exécution (simulateur, live, téléversement), et ce qui reste spécifique au projet.

---

## 10. Revue des projets existants et prévus (14/10/2026)

Sources : code lu dans les dépôts `atelier-cereales` et `theatre-ombre` ; fiches de projet pour l'escape game et le mBot.
Ce qui n'est pas confirmé est marqué « à confirmer ».

### 10.1 Ce que la lecture du code apprend

1. **Deux moteurs différents aujourd'hui.**
   - *Atelier des céréales* : sauvegarde Blockly (JSON) → « programme simplifié » `{ demarrage, boucle }` → simulateur en
     temps virtuel (`moteur/simulation.js`), validation par scénarios qui observent le comportement (`moteur/validation.js`),
     et traduction en C++ (`moteur/arduino.js`) compilé **à l'avance** par arduino-cli pour les solutions de référence
     seulement, puis envoyé dans la carte (`.hex`, protocole STK500).
   - *Théâtre d'ombre* : blocs → JavaScript exécuté par JS-Interpreter, avec plusieurs « fils » indépendants (un par bloc
     « quand… », comme Scratch) ; la carte fait tourner un programme fixe qui reçoit des ordres par USB (mode live) ;
     le niveau 3 montre du C++ en lecture seule.
2. **Le mode téléversement d'aujourd'hui ne sait pas envoyer un programme libre** : il envoie des programmes compilés à
   l'avance. Pour que l'élève envoie le sien, il faut le firmware embarqué décidé en section 6.
3. **Le protocole live v1 ne gère que les sorties** (LED, intensité, note de buzzer, tout éteindre). Pour le distributeur
   (boutons) ou le mBot (capteurs), il faut lire les entrées.
4. **Code dupliqué** : `flasher.js` et Blockly 13 sont copiés dans les deux dépôts, ce qui justifie le module partagé.
5. **Sécurité déjà prévue et à garder** : la carte éteint tout après 3 s sans message ; les broches 0 et 1 sont refusées ;
   le programme des élèves tourne dans un interpréteur « en boîte » (pas d'accès à la page ni à internet).
6. **Limite de mémoire à garder en tête** : sur la puce des Uno et du mBot mCore (ATmega328P), la mémoire qui survit à
   la mise hors tension pour un programme chargé par un firmware embarqué (EEPROM) est d'environ 1 Ko : les programmes
   téléversés devront être **courts**. À mesurer au prototype (jalon 0).

### 10.2 Les projets face à l'architecture

| Projet | Carte | Composants et modules | Modes d'exécution | À prévoir dans Labo Blocs | Reste propre au projet |
|---|---|---|---|---|---|
| Distributeur de céréales (5e) | Uno | boutons, LED, servo | simulateur, téléversement ; live à ajouter pour tester | blocs existants (LED, attendre, servo, variable, si / sinon, bouton, comparaison) | carnet, tutoriel de câblage, fiches, notation |
| Théâtre d'ombre (3e) | Uno / Nano | LED (PWM), buzzer ; webcam | live (existant), carte simulée (existante) | extension **Vision IA** (quand je vois / ne vois plus, personnage vu, confiance) ; extension **Sons** (sons joués dans le navigateur) ; niveaux 1 à 3 | entraînement de l'IA à la webcam, vue 3D des STL, carnet en 5 étapes, suivi professeur |
| mBot Challenge (3e) | mBot mCore | moteurs, capteur de ligne, ultrasons, LED, buzzer, bouton (liste exacte à confirmer) | téléversement (robot autonome), live pour régler | extension **mBot** ; simulateur de circuit en 2D, très différent d'un simulateur de broches (à décider) | circuits, grilles d'évaluation, vidéos |
| Escape game (3e) | Uno | 2 boutons, 2 LED, buzzer + modules optionnels : écran LCD, afficheur 4 chiffres, digicode, électro-aimant | téléversement (énigme autonome), live pour tester | extension **Modules escape** (LCD, 4 chiffres, clavier, électro-aimant) avec les pilotes correspondants dans le firmware | scénario, cadenas, chaînage des énigmes |
| Simon Rétro Game | Arduino (modèle à confirmer) | à confirmer (LED, boutons, buzzer ?) | téléversement | **hasard, listes, fonctions** (confirmé) | document complet, format tournoi |
| Labyrinthe Robotisé (4e) | **Arduino Uno** (confirmé) | bouton « SW » comme objectif central, autres composants à confirmer | à confirmer | blocs de base à confirmer | câblage manuel |

### 10.3 Nouvelles exigences d'architecture

- **R1 · Modèle de programme commun** : un seul format JSON, sérialisable, qui sait décrire « au démarrage + répéter
  indéfiniment », des **fils événementiels** (comme les « quand… » du théâtre d'ombre), des variables, des boucles et
  des conditions. Ce même modèle alimente le simulateur, le mode live, le générateur de C++ et l'envoi dans la carte.
  Point de départ : le « programme simplifié » de l'atelier, auquel on ajoute les fils événementiels du théâtre d'ombre.
- **R2 · Extensions** : un projet déclare les extensions dont il a besoin (Vision IA, Sons, mBot, Modules escape…). Chaque
  extension apporte ses blocs, ses éléments dans le simulateur, ses commandes live et son support dans le firmware.
  Ajouter un projet futur = ajouter une extension, pas toucher au noyau.
- **R3 · Protocole live v2** : garder le v1 (`PING`, `D`, `A`, `T`, `OFF`, arrêt après 3 s, version dans la réponse pour
  repérer une carte mal programmée) et ajouter la lecture des entrées, le servo, puis les commandes propres aux extensions.
- **R4 · Simulateur en couches** : couche « broches » (LED, boutons, servo) dès la version 1 ; couche « scène »
  (circuit du mBot) : **décision du 14/10 : pas en version 1**, le mBot se teste en direct avec le vrai robot ; la structure
  doit simplement permettre d'ajouter ce simulateur plus tard.
- **R5 · Firmware par carte** : une base unique par carte (Uno / Nano / mCore, micro:bit V1 et V2 à part) qui fait à la
  fois le live et le chargement d'un programme court ; les pilotes de modules (servo, LCD, afficheur, clavier…) y sont
  ajoutés selon l'extension.
- **R6 · Sauvegarde** : les deux projets n'écrivent pas le même nom de fichier (`Prénom_Prénom.json` contre
  `PRENOM_PRENOM_theatre_ombre.json`). Principe retenu : chaque projet garde son fichier, avec une rubrique
  « programmation » versionnée écrite par Labo Blocs ; les anciennes sauvegardes restent lisibles.
- **R7 · Module partagé unique** : Blockly, l'envoi dans la carte (`flasher.js`), le simulateur, la validation et le
  protocole sortent des projets et deviennent un module versionné.
- **R8 · Tests** : reprendre la méthode existante (tests automatiques du moteur, recette dans de vrais navigateurs,
  carte simulée jumelle du firmware).

### 10.4 À confirmer avant le brief Claude Code

**Décisions du 14/10**
- Pas de simulateur de circuit pour le mBot en version 1 (test en direct avec le robot).
- Le programme téléversé **reste en mémoire hors tension** : programmes courts, limite à mesurer au jalon 0.
- Simon Rétro Game : blocs **hasard, listes et fonctions** à prévoir dès le noyau (le modèle de programme R1 doit les
  couvrir).
- Labyrinthe Robotisé : carte **Arduino Uno**.

**Reste à confirmer**
- mBot Challenge : liste exacte des capteurs et moteurs utilisés.
- Escape game : modules réellement prévus (LCD, afficheur, clavier, électro-aimant).
- Simon Rétro Game : carte exacte et composants.
- Labyrinthe Robotisé : composants autres que le bouton « SW », mode d'exécution.
