# Labo Blocs

Outil de programmation par blocs pour les projets de technologie du collège (5e, 4e, 3e) : parcours d'exercices
avec correction automatique, indices, simulateur, mode en direct et envoi du programme dans la carte
(Arduino Uno, mBot mCore, micro:bit). Remplace Vittascience / mBlock. Un seul style de blocs et un seul
fonctionnement pour tous les projets : celui de l'atelier du distributeur de céréales.

Fonctionne hors ligne depuis un dossier réseau, sans compte ; Chrome et Edge (Firefox : téléchargement de secours).

## Documents

| Document | Contenu |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | plan de travail validé (arborescence, formats, module partagé, jalon 0) |
| [docs/BRIEF-CLAUDE-CODE-labo-blocs.md](docs/BRIEF-CLAUDE-CODE-labo-blocs.md) | brief de développement : contraintes, décisions, jalons |
| [docs/BRIEF-CLAUDE-DESIGN-labo-blocs.md](docs/BRIEF-CLAUDE-DESIGN-labo-blocs.md) | principes d'interface, écrans, style des blocs |
| [docs/CAHIER-DES-CHARGES-outil-blocs.md](docs/CAHIER-DES-CHARGES-outil-blocs.md) | cahier des charges v5 |
| [Maquette](https://claude.ai/artifact/NUiEuKMzsMxzubE188MAoH) | charte et écrans A1, A3–A6, B9, B10, C13 |

Code repris : [atelier-cereales](https://github.com/Anlito/atelier-cereales) et
[theatre-ombre](https://github.com/Anlito/theatre-ombre).

## Organisation

| Dossier | Contenu |
|---|---|
| `noyau/` | module partagé, sans affichage (aussi exécuté sous Node) : cartes (`cartes.js` : profils Uno / mBot / micro:bit, blocs de carte, carte simulée), programme ⇄ Blockly, code octet, interpréteur, simulateur, vérification par scénarios, code Arduino, paquet de parcours, sauvegarde et progression, édition d'un parcours (`edition.js`) |
| `interface/` | partie navigateur du module : blocs (style de l'atelier), éditeur, simulateur (micro:bit, tableau du mBot), aides, mode « Dans la carte » (`carte.js`, `televersement.js`), fichiers, écrans élève (`gabarits.js`), charte (`css/`), `integration.js` (`LaboBlocs.monterExercice` : l'écran d'exercice dans la page d'un projet) |
| `cartes/` | programmes des cartes 0.2 (`arduino/` Uno et mBot, `microbit/` MicroPython), fichiers construits (`*.hex`, `firmwares.js`), interpréteur sur l'ordinateur pour les tests (`hote/`) |
| `parcours/` | paquets de parcours (`distributeur/` : exercices 01 à 13B, fiches, lexique ; `decouverte-mbot/`, `decouverte-microbit/` : `site/index.html?parcours=…` ; `index.js` : la liste ouverte par l'éditeur) |
| `site/` | application Labo Blocs : `index.html` (élève ; `?enseignant=1` : tout ouvert, rien n'est enregistré ; `&projecteur=1` : grand affichage), `editeur.html` (professeur : éditeur de parcours), `projet.js` (réglages du projet), polices et Blockly copiés dans `vendor/` |
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
npm run publier          # dossier _site/ publié sur GitHub Pages (application + parcours en ligne)
npm run firmwares        # reconstruire les programmes des cartes (cartes/ ; avr-gcc + ARDUINO_CORE et SERVO, microbit-fs)
npm run essais:mesures   # taille du code octet des programmes
npm run essais:firmware  # recompiler le firmware (arduino-cli, ou avr-gcc + ARDUINO_CORE et SERVO)
npm run essais:microbit  # refaire les fichiers micro:bit
```

Le site marche aussi en ouvrant directement `site/index.html` depuis un dossier (file://), sans serveur ni internet.

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
- **Jalon 4 (en direct) livré (16/10/2026), recette avec le matériel à faire** : mode « En direct » (le programme
  tourne dans l'ordinateur, la carte obéit, ses boutons et capteurs remontent), clé 2.4G du mBot, modes par parcours
  et par exercice — [RECETTE.md](RECETTE.md) §9.
