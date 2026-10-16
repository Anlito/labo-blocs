# Brief Claude Code — Labo Blocs (version 1, 14/10/2026)

## 0. À lire d'abord
1. `CAHIER-DES-CHARGES-outil-blocs.md` (v5) : référence fonctionnelle. Lire surtout §4.10 (intégration), §6 (architecture), §10 (revue du code existant, exigences R1–R8, décisions).
2. `BRIEF-CLAUDE-DESIGN-labo-blocs.md` : principes d'interface et style des blocs (§4).
3. Maquette Claude Design : https://claude.ai/artifact/NUiEuKMzsMxzubE188MAoH (charte, A1 accueil, A3 parcours, A4 exercice, A5 indices/résultats, A6 carte, B9 éditeur d'exercice, B10 suivi de classe, C13 mise à jour). Les données d'exemple (équipes, modifications) sont fictives. À faire en suivant la maquette : cohérence visuelle, textes courts en français, messages bienveillants.
4. Code existant à réutiliser (dépôts GitHub `Anlito`) : `atelier-cereales` (blocs, éditeur, simulation en temps virtuel, validation par scénarios, C++, compilation arduino-cli, flasher STK500) et `theatre-ombre` (protocole live v1, SerialLink, carte simulée jumelle du .ino, runtime JS-Interpreter avec fils « quand… »).

## 1. But
Un seul outil de programmation par blocs pour tous les projets de technologie (remplace Vittascience / mBlock) : parcours d'exercices avec solutions et correction automatique, indices, simulateur, mode live ou envoi du programme dans la carte (Arduino Uno, mBot mCore, micro:bit V1 et V2). Même style de blocs et même fonctionnement partout : **celui de l'atelier du distributeur de céréales** (Blockly, rendu Zelos, thème pastel).

## 2. Contraintes non négociables
- Hors ligne, depuis un dossier réseau du collège ; aucun compte, aucune donnée en ligne. Chrome et Edge (accès dossier, Web Serial) ; Firefox : téléchargement de secours.
- Sauvegarde = celle des autres projets : un `.json` par équipe dans le dossier de classe, enregistrement automatique, jamais d'écrasement. Chaque projet garde son fichier ; Labo Blocs écrit une rubrique « programmation » versionnée ; les anciennes sauvegardes restent lisibles (R6).
- Module partagé et versionné (Blockly, flasher, simulateur, validation, protocole) sorti des projets (R7).
- Pas de fiche qui donne la réponse : les blocs de la palette partent d'une broche par défaut (D2).
- Pas de supposition sur le matériel : demander à Thomas ce qui est réellement disponible quand c'est nécessaire.

## 3. Décisions déjà prises
- Envoi dans la carte = **firmware embarqué / interpréteur** (option C) pour les programmes libres des élèves, sur Arduino Uno et mBot mCore ; micro:bit : solution propre à étudier. Le programme doit survivre à la coupure de courant. Limite à vérifier : EEPROM ≈ 1 Ko sur ATmega328P, donc programmes courts.
- Simulateur couche « broches » en v1 ; pas de simulateur de scène pour le mBot en v1 (test en direct avec le vrai robot), mais l'architecture doit permettre de l'ajouter.
- SEGPA : plus tard. Nom : **Labo Blocs**.
- Projets à prévoir dès la conception : distributeur de céréales (premier), théâtre d'ombre, puis mBot Challenge, escape game, Simon Rétro Game (besoin : hasard, listes, fonctions), Labyrinthe Robotisé (Arduino Uno).

## 4. Architecture (rappel des exigences R1–R8 du CdC §10.3)
- **R1** modèle de programme JSON commun : « au démarrage » + « répéter indéfiniment », fils événementiels, variables, conditions, boucles, hasard, listes, fonctions. Alimente simulateur, live, C++ et envoi carte. Point de départ : « programme simplifié » de l'atelier + fils du théâtre d'ombre.
- **R2** extensions déclarées par projet (Vision IA, Sons, mBot, modules escape) : blocs, éléments de simulateur, commandes live, support firmware.
- **R3** protocole live v2 : garder le v1 (`PING→PONG`, `D`, `A`, `T`, `OFF`, arrêt après 3 s, version dans la réponse) et ajouter la lecture des entrées, le servo, puis les commandes d'extensions.
- **R4** simulateur en couches.
- **R5** un firmware de base par carte (live + chargement d'un programme court).
- **R6–R8** sauvegarde, module unique, tests de la même méthode que l'existant (tests moteur, `RECETTE.md`, carte simulée jumelle).
- **Intégration (CdC §4.10)** : paquet de parcours versionné avec identifiants d'exercice stables ; un projet référence un parcours + version ; l'admin du projet a « Mettre à jour les exercices » (en ligne ou par fichier) avec comparaison ajouté / modifié / supprimé / déplacé, validation et retour arrière ; le travail des élèves est protégé (blocs gardés, exercice « à revérifier ») ; pas de mise à jour pendant une évaluation verrouillée ; version minimale du moteur.

## 5. Ordre de travail
**Avant de coder : proposer un plan** (arborescence, format du paquet de parcours, format du programme JSON, découpage du module partagé) et le faire valider par Thomas.

| Jalon | À livrer | Réussite |
|---|---|---|
| **0 · Essais** (en premier) | Prototypes jetables : (a) interpréteur embarqué sur Uno : combien d'octets de programme, tient-il après coupure ; (b) envoi d'un programme libre dans un mBot mCore ; (c) piste micro:bit V1 et V2 ; (d) protocole live v2 avec lecture d'une entrée. Reconfirmer Web Serial sur un autre poste du collège. | Rapport court + décision sur chaque point, une carte exécute un programme venant de blocs |
| **1 · Noyau** | Module partagé versionné, exercice générique avec ID stable, paquet de parcours, indices, sauvegarde commune | Le parcours du distributeur (exercices 01 à 13B) refait sans code spécifique |
| **1 bis · Intégration** | « Mettre à jour les exercices » dans l'admin du distributeur | Exercice modifié dans Labo Blocs → arrive dans le distributeur sans perdre le travail d'une équipe test |
| **2 · Parcours** | Éditeur de parcours, d'exercice et de scénarios (maquette B9) | Exercice complet créé sans toucher au code |
| **3 · Cartes** | Profils Uno, mBot, micro:bit, envoi, « Vider la carte » | Trois cartes reçoivent un programme et se vident |
| **4 · Live** | Mode live, choix du mode par projet et par exercice | Un exercice tourne en simulateur, live, puis téléversement |
| **5 · Professeur** | Suivi de classe, notes, export CSV Pronote | Classe test de 8 équipes suivie et exportée |

S'arrêter après chaque jalon pour une recette avec Thomas.

## 6. Critères de qualité
- Tests automatiques du moteur à chaque jalon ; recette manuelle documentée (même format que `RECETTE.md`).
- Accessibilité : jamais la couleur seule, contrastes, texte ≥ 13 px.
- Erreurs USB toujours en français, avec la prochaine action à faire (cf. maquette A6).
- Programmes ne donnant pas le résultat attendu : écart affiché en ambre, jamais en rouge.

## 7. Inconnues à poser à Thomas pendant le travail
mBot Challenge (capteurs / moteurs exacts), modules de l'escape game, composants et carte exacts de Simon Rétro Game, autres composants et mode d'exécution du Labyrinthe Robotisé. Écrans professeur encore non maquettés : dossier d'équipe (A2), éditeur de parcours (B8), fiche d'équipe (B11), réglages du projet (B12), version projecteur de l'exercice : les proposer dans le même style avant de les construire.

## 8. Dépôt
À créer ou à choisir avec Thomas (compte GitHub `Anlito`). Ajouter un `README` et un `CLAUDE.md` qui renvoient à ces documents.
