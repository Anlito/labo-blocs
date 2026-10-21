# Labo Blocs

## Corrections du parcours Théâtre et de l’éditeur — 21 octobre 2026

- L’éditeur propose le type « Entraînement de l’IA sans programmation » : caméra, nombre de personnages et photos minimales sont modifiables. Ces exercices se publient sans bloc, solution ni scénario de programme ; les exercices de programmation gardent leurs contrôles habituels.
- La caméra peut être activée avec le fond vide seul. « Rien — fond vide » est indiquée comme étiquette automatique ; l’éditeur et la caméra filtrent ce nom réservé et les doublons. Les photos déjà enregistrées restent conservées. « Rien » ne compte pas comme un personnage dans les critères de réussite.
- Le parcours Théâtre passe en version 1.2.0, en reprenant la version 1.1.0 publiée par le professeur (titre modifié conservé). Le bloc ajouté pour contourner le contrôle de publication et le second « Rien » sont retirés du premier exercice. Les consignes expliquent les photos, la validation et l’enregistrement.
- L’intégration commune `interface/theatre-parcours.js` accepte une liste intégrée au site hôte (`listeHote`). Les exercices gardent l’écran commun en pleine page ; « Parcours » revient à la liste et actualise la progression.
- Vérifications : 142 tests logiciels réussis (63 essais nécessitant des outils externes non disponibles ignorés), construction du site, et essais Chrome de la liste, des dix photos avec extraction de test, du retour, de l’éditeur et du contrôle de publication. La précision de l’IA et l’Arduino réel restent à vérifier en classe.

<!-- suivi-maintenance:debut -->
## État du projet et améliorations documentées — 21 octobre 2026

- Le module commun est publié à /module/ et les parcours à /parcours/. Le distributeur, le Labyrinthe et le Théâtre les chargent en ligne ; leurs dépôts n’embarquent plus ces copies.
- Le parcours Théâtre d’ombre augmenté est ajouté à la liste et à l’éditeur : six exercices d’IA et de programmation, caméra partagée, contrôle des photos enregistrées et reprise du programme précédent pour l’exercice final.
- Les exercices d’apprentissage mettent la caméra au premier plan. Leurs exigences (photos et étiquettes) ainsi que la reprise d’un programme se modifient dans l’éditeur.
- Les niveaux, blocs, simulateur et mode En direct sont les mêmes que pour les autres parcours. La reconnaissance IA nécessite l’ordinateur ; l’Arduino reçoit les commandes par USB.
- Points d’entrée : parcours/theatre-ombre/parcours.js, interface/theatre-parcours.js, interface/ecran-exercice.js, interface/editeur-parcours.js et noyau/sauvegarde.js.
- Les sources de l’ancien éditeur du Théâtre sous integrations/theatre servent à la compatibilité historique. Le parcours élève courant utilise le moteur et les écrans communs.
- Validations antérieures : 139 tests logiciels Labo Blocs et parcours navigateur complet du Théâtre avec données d’essai. Les vérifications matérielles restent distinctes.

### Référence locale et maintenance

Dossier de travail de référence : **Documents/labo-blocs**. Dépôt : [Anlito/labo-blocs](https://github.com/Anlito/labo-blocs). La branche principale est **main**. Les copies temporaires d’un chat ou les worktrees servent au travail intermédiaire ; elles ne remplacent pas ce dossier.

À chaque intervention :

1. Vérifier les modifications locales et la version publiée avant de commencer ; sauvegarder le travail non enregistré.
2. Décrire dans ce README les améliorations, les vérifications, les limites et les opérations restantes.
3. Publier les changements autorisés, puis synchroniser le dossier local de référence avec le même commit.
4. Contrôler le commit local, le commit distant et les fichiers restants avant d’annoncer que le projet est à jour. Signaler explicitement tout décalage ou travail conservé hors publication.

Cette règle permet de reprendre le projet dans un autre outil local sans perdre les dernières améliorations. Une publication du site ne met pas automatiquement à jour les dossiers du PC.

<!-- suivi-maintenance:fin -->

Outil de programmation par blocs pour les projets de technologie du collège (5e, 4e, 3e) : parcours d'exercices
avec correction automatique, indices, simulateur, mode en direct et envoi du programme dans la carte
(Arduino Uno, mBot mCore, micro:bit). Remplace Vittascience / mBlock. Un seul style de blocs et un seul
fonctionnement pour tous les projets : celui de l'atelier du distributeur de céréales.

L’application Labo Blocs peut être utilisée depuis ses fichiers locaux. Les projets raccordés au module central en ligne nécessitent Internet. Chrome et Edge sont recommandés (Firefox : téléchargement de secours).

## Documents

| Document | Contenu |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | plan de travail validé (arborescence, formats, module partagé, jalon 0) |
| [docs/BRIEF-CLAUDE-CODE-labo-blocs.md](docs/BRIEF-CLAUDE-CODE-labo-blocs.md) | brief de développement : contraintes, décisions, jalons |
| [docs/BRIEF-CLAUDE-DESIGN-labo-blocs.md](docs/BRIEF-CLAUDE-DESIGN-labo-blocs.md) | principes d'interface, écrans, style des blocs |
| [docs/BRIEF-LABO-BLOCS-POUR-UN-PROJET.md](docs/BRIEF-LABO-BLOCS-POUR-UN-PROJET.md) | relier un nouveau projet à Labo Blocs (à donner à Claude Code dans le projet) |
| [docs/CAHIER-DES-CHARGES-outil-blocs.md](docs/CAHIER-DES-CHARGES-outil-blocs.md) | cahier des charges v5 |
| [Maquette](https://claude.ai/artifact/NUiEuKMzsMxzubE188MAoH) | charte et écrans A1, A3–A6, B9, B10, C13 |

Code repris : [atelier-cereales](https://github.com/Anlito/atelier-cereales) et
[theatre-ombre](https://github.com/Anlito/theatre-ombre).

## Organisation

| Dossier | Contenu |
|---|---|
| `noyau/` | module partagé, sans affichage (aussi exécuté sous Node) : cartes (`cartes.js` : profils Uno / mBot / micro:bit, blocs de carte, carte simulée), programme ⇄ Blockly, code octet, interpréteur, simulateur, vérification par scénarios, code Arduino, paquet de parcours, sauvegarde et progression, édition d'un parcours (`edition.js`) |
| `interface/` | partie navigateur du module : blocs (style de l'atelier), éditeur, simulateur (micro:bit, tableau du mBot), aides, mode « Dans la carte » (`carte.js`, `televersement.js`), fichiers, écrans élève (`gabarits.js`), charte (`css/`), `integration.js` (`LaboBlocs.monterExercice` : l'écran d'exercice dans la page d'un projet) |
| `cartes/` | programmes des cartes 0.2 (mBot et micro:bit : 0.3) (`arduino/` Uno et mBot, `microbit/` MicroPython), fichiers construits (`*.hex`, `firmwares.js`), interpréteur sur l'ordinateur pour les tests (`hote/`) |
| `parcours/` | paquets de parcours (`distributeur/` : exercices 01 à 13B, fiches, lexique ; `decouverte-mbot/`, `decouverte-microbit/` : `site/index.html?parcours=…` ; `index.js` : la liste ouverte par l'éditeur) |
| `site/` | application Labo Blocs : `prof.html` (professeur : suivi de classe, niveaux par compétence, exports), `index.html` (élève ; `?enseignant=1` : tout ouvert, rien n'est enregistré ; `&projecteur=1` : grand affichage), `editeur.html` (professeur : éditeur de parcours), `projet.js` (réglages du projet), polices et Blockly copiés dans `vendor/` |
| `essais/` | essais du jalon 0 (firmware Uno/mBot, micro:bit, page d'essai des cartes) |
| `tests/` | tests Node (`node:test`) |
| `tools/` | serveur local, copie de Blockly et des polices, recette dans un vrai navigateur, conversion du distributeur, construction du module (`construire-module.js`), copie dans un projet (`vers-projet.js`), publication (`publier.js`) |
| `dist/` | (construit, ignoré par git) `labo-blocs-<version>/` : le module que chaque projet copie dans `site/vendor/labo-blocs/` ; `parcours/` : parcours exportés (`.labo-parcours.json`) |

## Commandes

```bash
npm install              # Blockly, polices, puppeteer-core (recette), microbit-fs
npm run vendor           # copie Blockly et les polices dans site/vendor
npm test                 # tests (gcc ; simavr en option : apt install gcc libsimavr-dev libelf-dev)
npm start                # http://localhost:8080
npm run recette          # critères du jalon dans Chrome/Edge (file://) → RECETTE-AUTO.md
npm run module           # construit le module dans dist/labo-blocs-<version>/ et exporte les parcours
npm run vers-projet -- ../atelier-cereales [--parcours distributeur]   # copie le module (et le parcours) dans un projet
npm run nouveau-projet -- ../pont-levis --titre "Pont-levis" --parcours <id> [--classes 4A,4B]   # crée un projet relié à Labo Blocs
npm run code-professeur  # change le code professeur (seule son empreinte est écrite, dans site/code-professeur.js)
npm run publier          # dossier _site/ publié sur GitHub Pages (application + parcours en ligne)
npm run firmwares        # reconstruire les programmes des cartes (cartes/ ; avr-gcc + ARDUINO_CORE et SERVO, microbit-fs)
npm run classe-test      # classe test de 8 équipes fictives (dist/classe-test/5A)
npm run essais:mesures   # taille du code octet des programmes
npm run essais:firmware  # recompiler le firmware (arduino-cli, ou avr-gcc + ARDUINO_CORE et SERVO)
npm run essais:microbit  # refaire les fichiers micro:bit
```

Le site marche aussi en ouvrant directement `site/accueil.html` depuis un dossier (file://), sans serveur ni internet :
accueil du professeur (éditeur de parcours, suivi de classe, parcours à essayer en mode enseignant, lien à donner aux
élèves). **Ajouter un parcours au site** : avec une clé GitHub enregistrée dans la page Réglages (« Mise en ligne des parcours », liée depuis l'accueil),
« Publier » l'envoie directement dans `parcours/` ; sans clé, le fichier `.labo-parcours.json` téléchargé se dépose à
la main dans ce dossier (GitHub › « Add file › Upload files »). La publication fait le reste. Ses classes et le dossier
des équipes se règlent dans l'éditeur (« Réglages »). Un exercice peut être **libre** (case dans l'éditeur) : l'élève
invente son programme avec les blocs proposés, le simulateur montre les composants qu'il utilise, « J'ai terminé »
remplace « Vérifier », et aucun niveau n'est calculé. En ligne :
https://anlito.github.io/labo-blocs/ ouvre cet accueil ; **les élèves** vont sur
https://anlito.github.io/labo-blocs/site/eleves.html (tous les parcours, sans code). L'accueil, l'éditeur, le suivi de classe et le mode enseignant
demandent le **code professeur** (une fois par ordinateur ; « Verrouiller » le redemande). C'est une barrière pour les
élèves curieux, pas une vraie sécurité : le site est public et sans serveur, et rien de personnel n'y est en ligne.

## État

- **Jalon 0 terminé (15/10/2026)** : Uno, mBot et micro:bit V2 reçoivent un programme venu de blocs, le gardent après
  une coupure et se vident — [essais/RAPPORT-JALON-0.md](essais/RAPPORT-JALON-0.md).
- **Jalon 1 (noyau) validé (15/10/2026)** : le parcours du distributeur (01 à 13B) tourne dans Labo Blocs —
  [RECETTE.md](RECETTE.md), [RECETTE-AUTO.md](RECETTE-AUTO.md).
- **Jalon 1 bis (intégration) validé (16/10/2026)** : l'atelier du distributeur utilise le module de Labo Blocs
  (écran d'exercice, moteur, sauvegarde) ; son outil du professeur a « Mettre à jour les exercices » (en ligne ou par
  fichier, différences, validation, retour en arrière) — [RECETTE.md](RECETTE.md) §6.
- **Jalon 2 (éditeur de parcours) validé (16/10/2026)** : `site/editeur.html` crée et modifie les exercices sans
  toucher au code, teste les scénarios sur la solution et publie une nouvelle version — [RECETTE.md](RECETTE.md) §7.
- **Jalon 3 (cartes) validé (16/10/2026)** : profils Arduino Uno, mBot et micro:bit V2,
  blocs mBot (comme mBlock) et micro:bit, simulateur micro:bit et tableau du mBot, mode « Dans la carte » (installer le
  programme de la carte, envoyer le programme de l'élève, « Vider la carte ») ; l'atelier du distributeur envoie le
  programme de l'élève — [RECETTE.md](RECETTE.md) §8.
- **Jalon 4 (en direct) validé** (Uno et micro:bit ; clé 2.4G du mBot en V2) : mode « En direct » (le programme
  tourne dans l'ordinateur, la carte obéit, ses boutons et capteurs remontent), clé 2.4G du mBot, modes par parcours
  et par exercice — [RECETTE.md](RECETTE.md) §9.
- **Jalon 5 (professeur) validé (16/10/2026)** : suivi de classe et fiche d'équipe (`site/prof.html`),
  niveaux par compétence du programme de cycle 4 et note, exports CSV et « résultats » importés par le Carnet de
  classe — [RECETTE.md](RECETTE.md) §10.
- **Kit nouveau projet (16/10/2026)** : `npm run nouveau-projet` crée le dossier d'un futur projet déjà relié à Labo
  Blocs (page des élèves, outil du professeur, réglages, parcours, module) et y range
  [la consigne pour Claude Code](docs/BRIEF-LABO-BLOCS-POUR-UN-PROJET.md) — [RECETTE.md](RECETTE.md) §11.
- **Jalon 6 (caméra et IA), en recette** : un exercice peut avoir des **étiquettes** (« Pouce levé », « Loup »…) ;
  l'élève les apprend à l'IA avec la webcam (panneau « Caméra et IA », photos gardées dans le fichier de l'équipe) et
  programme avec les blocs « quand la caméra reconnaît … », « la caméra reconnaît … », « certitude de l'IA ». Arduino,
  micro:bit et mBot, en simulateur et « En direct » (la caméra est dans l'ordinateur). IA : TensorFlow.js et MobileNet
  copiés dans `site/vendor/vision/` (aucun CDN, marche en `file://`). Parcours d'exemple « Découverte de la caméra
  (IA) » — [RECETTE.md](RECETTE.md) §21.
- **Afficheur LED Matrix 8×16 du mBot, en recette (19/10/2026)** : branché sur le **port 4** ; blocs « afficher le
  dessin » (grille de 16 × 8 points à cliquer), « afficher le texte » (défile s'il est trop long), « afficher le
  nombre », « afficher l'heure ». Simulateur (l'afficheur sous le robot), « En direct » et « Dans la carte » : le
  programme de la carte du mBot passe en **0.3** (l'Uno et la micro:bit restent en 0.2). Exercice d'exemple
  « L'afficheur » (Découverte du mBot) — [RECETTE.md](RECETTE.md) §22.
- **Clavier de l'ordinateur, en recette (19/10/2026)** : blocs « quand la touche … est appuyée » et « la touche … est
  appuyée » (flèches, espace, lettres, chiffres), pour piloter la carte ou le robot depuis l'ordinateur : simulateur
  et « En direct » (Uno, micro:bit, mBot par le câble ou la clé 2.4G). Exercice d'exemple « Télécommande au clavier »
  — [RECETTE.md](RECETTE.md) §23.
- **micro:bit : dessin 5 × 5, en recette (19/10/2026)** : bloc « afficher le dessin » avec une grille à cliquer ;
  programme de la carte de la micro:bit en 0.3 — [RECETTE.md](RECETTE.md) §24.
- **Commentaires, en recette (19/10/2026)** : bouton « Commentaire » dans la zone des blocs (sur un bloc, ou une note
  libre) ; le professeur écrit un **programme de départ** commenté dans l'éditeur de parcours ; les commentaires
  deviennent des « // … » dans le code Arduino — [RECETTE.md](RECETTE.md) §25.
- **Joystick, en recette (19/10/2026)** : module 2 axes + bouton sur l'Arduino Uno (A0, A1, D2) ou la micro:bit
  (P0, P1, P2), broches réglées par l'exercice ; blocs « quand le joystick est poussé … », « le joystick est … »,
  « position du joystick », « le bouton du joystick est appuyé » ; manche à tirer dans le simulateur ; « En direct » et
  « Dans la carte » sans mise à jour des cartes — [RECETTE.md](RECETTE.md) §26.
