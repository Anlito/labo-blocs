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

## État

Plan validé le 14/10/2026. **Jalon 0 terminé le 15/10/2026** : Uno, mBot et micro:bit V2 reçoivent un programme venu de
blocs, le gardent après une coupure et se vident — voir [essais/RAPPORT-JALON-0.md](essais/RAPPORT-JALON-0.md).

```bash
npm test                 # tests (gcc ; simavr en option : apt install gcc libsimavr-dev libelf-dev)
npm run essais:mesures   # taille du code octet des programmes
npm run essais:firmware  # recompiler le firmware (arduino-cli, ou avr-gcc + ARDUINO_CORE et SERVO)
npm run essais:microbit  # refaire le fichier micro:bit (npm install d'abord)
```
