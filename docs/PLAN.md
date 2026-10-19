# Plan de travail — Labo Blocs

Version 0.2 · 14/10/2026 · **validé par Thomas le 14/10/2026** (réponses en §9).

Sources : `BRIEF-CLAUDE-CODE-labo-blocs.md`, `BRIEF-CLAUDE-DESIGN-labo-blocs.md`, maquette
https://claude.ai/artifact/NUiEuKMzsMxzubE188MAoH, code de `atelier-cereales` et `theatre-ombre`.
Cahier des charges v5 : `docs/CAHIER-DES-CHARGES-outil-blocs.md`.

## 1. Ce que je reprends de l'existant

| Existant | Où | Devient dans Labo Blocs |
|---|---|---|
| Programme simplifié `{demarrage, boucle}`, conversion Blockly ⇄ programme | atelier `js/moteur/programme.js` | base du **programme v1** (§3), les noms de blocs sont gardés |
| Simulation en temps virtuel (ms), journal d'événements | atelier `js/moteur/simulation.js` | couche « broches » du simulateur, étendue aux fils « quand… » |
| Validation par scénarios, phrases bienveillantes, premier écart seulement | atelier `js/moteur/validation.js` | reprise telle quelle, étapes ajoutées pour les nouvelles entrées |
| Blocs, thème « atelier » Zelos pastel | atelier `js/blocs.js`, `css/atelier.css` | **définitions uniques** des blocs (brief design §4) |
| Génération C++ | atelier `js/moteur/arduino.js` | panneau « code Arduino » niveau 3 (lecture seule, lignes reliées aux blocs) |
| Flasher STK500 (Web Serial), messages d'erreur | atelier `js/flasher.js` | profil Uno / mBot |
| Protocole live v1, SerialLink, carte simulée jumelle du `.ino` | théâtre `js/protocol.js`, `serial.js`, `simulated-board.js` | protocole live **v2** (§6) |
| Fils « quand… » (comme Scratch) | théâtre `js/runtime.js` | sémantique des fils du programme v1 (mais exécutés par notre moteur, pas JS-Interpreter, cf. §3) |
| Sauvegarde `.json` par équipe, choix du dossier, secours navigateur, Firefox = téléchargement | atelier `js/fichiers.js`, `session.js` | module « sauvegarde » commun |
| Tests `node:test`, recette navigateur puppeteer, `RECETTE.md` | les deux | même méthode |

Contrainte technique gardée de l'atelier : **le site doit marcher ouvert en `file://`** depuis le dossier réseau.
Donc scripts classiques (pas de modules ES au chargement), données en `definirXxx({...})` plutôt qu'en JSON
chargé par `fetch`, Blockly copié dans le dépôt, aucun CDN. Le théâtre d'ombre est en modules ES : son code sera
converti en scripts classiques en le reprenant.

## 2. Arborescence

```
labo-blocs/
  README.md · CLAUDE.md · RECETTE.md · package.json
  docs/                    briefs, CdC, ce plan, décisions, rapports du jalon 0
  noyau/                   ⇐ MODULE PARTAGÉ (sans affichage, tourne sous Node et dans le navigateur)
    programme/             modèle v1, lecture/écriture Blockly, contrôle de forme, migration depuis l'atelier
    simulation/            temps virtuel, fils, couche broches, couches composants (LED, bouton, servo, buzzer…)
    validation/            scénarios, phrases d'écart
    generateurs/           C++ Arduino (lecture seule, avec correspondance bloc → lignes), code octet carte
    parcours/              paquet de parcours : lecture, contrôle, comparaison de versions, mise à jour
    sauvegarde/            rubrique « programmation » de la sauvegarde, migrations
    protocole/             live v2 : commandes, réponses, erreurs en français
  interface/               ⇐ partie navigateur du module partagé
    blocs/                 définitions des blocs, thème « atelier », palette filtrée par exercice
    editeur/ simulateur/ carte/ (Web Serial, flasher STK500, connexion, messages) messages/ css/
  extensions/              une extension = blocs + éléments de simulateur + commandes live + support firmware
    sons/  vision-ia/  mbot/  escape/          (créées au fil des projets, R2)
  cartes/
    uno/  mbot/  microbit/ profil (broches, capacités) + firmware/ (sources) + image précompilée
  parcours/
    distributeur/          les exercices 01 à 13B repris de l'atelier, en paquet de parcours
  site/                    application Labo Blocs autonome
    index.html             élève (A1–A6)
    prof.html              professeur (B8–B12)
    admin.html             admin d'un projet (C13)
    vendor/                Blockly + copie du module construit
  tests/                   node:test (moteur, parcours, sauvegarde, protocole, firmware jumeau)
  tools/                   serveur local, copie Blockly, construction du module, copie vers un projet,
                           compilation des firmwares, recette navigateurs, archive ZIP
  dist/                    (ignoré) labo-blocs-noyau-<version>/ : ce qu'un projet copie dans son vendor/
```

## 3. Format du programme (R1)

Un seul objet JSON alimente simulateur, live, C++ et envoi carte. Il est **produit à partir de Blockly** et n'est
jamais édité à la main. Le programme de l'atelier `{demarrage, boucle}` se convertit sans perte.

```json
{
  "format": "labo-blocs/programme",
  "version": 1,
  "variables": ["CHOIX"],
  "listes": ["NOTES"],
  "fonctions": [
    { "nom": "clignoter", "parametres": ["fois"], "corps": [ … ] }
  ],
  "fils": [
    { "quand": "demarrage", "corps": [ … ] },
    { "quand": "boucle",    "corps": [ … ] },
    { "quand": "broche",    "broche": "D8", "front": "appui", "corps": [ … ] },
    { "quand": "extension", "extension": "vision-ia", "evenement": "je_vois", "args": { "perso": "loup" }, "corps": [ … ] }
  ]
}
```

- **Instructions et expressions** : `{ "bloc": "<type>", "id": "<id Blockly>", …champs }` comme dans l'atelier
  (`led_etat`, `attendre`, `servo_angle`, `affecter`, `si_alors`, `si_sinon`, `comparaison`, `bouton_etat`…).
  Ajouts : `repeter_n`, `tant_que`, `hasard`, opérations, `liste_*`, `appeler`, `retourner`, et
  `{ "bloc": "ext", "extension": "sons", "action": "jouer", … }` pour les extensions.
- **Exécution** (comme `setup`/`loop`) : « au démarrage » une fois, puis « répéter indéfiniment » en boucle ; les
  autres fils démarrent sur leur événement. Fils coopératifs : chacun s'interrompt seulement sur `attendre`.
  Un événement qui revient pendant que son fil tourne est **ignoré** (pas de relance) — validé.
- **Pourquoi pas JS-Interpreter** (théâtre) : notre moteur en temps virtuel est déterministe, rejouable à ×1/×2/×5,
  testable sous Node et permet la validation instantanée. Le même modèle se compile en code octet pour la carte.
- Chaque bloc garde son `id` → surlignage pendant l'exécution, lignes C++ reliées, écart « bloc hors programme ».

## 4. Paquet de parcours (CdC §4.10)

Dossier `parcours/<id>/` en scripts `definirParcours({...})` / `definirExercice({...})` (lisibles en `file://`),
plus un **fichier unique d'échange** `<id>-<version>.labo-parcours.json` pour l'import/export et la mise à jour
par fichier (un `<input type=file>` marche en `file://`).

```json
{
  "format": "labo-blocs/parcours", "version": 1,
  "id": "distributeur", "titre": "Distributeur de céréales", "accent": "#F7AE5E",
  "versionParcours": "1.2.0", "moteurMinimum": "1.0.0",
  "cartes": ["uno"], "modes": ["simulateur", "carte"], "extensions": [],
  "parametres": { "dureePetiteDose": 3, "dureeGrandeDose": 7 },
  "exercices": [
    { "id": "dist-ex05", "titre": "Allumer, sinon éteindre", "defi": false,
      "niveau": 1, "carte": "uno", "modes": null,
      "consigne": "…", "composants": [ { "type": "bouton", "broche": "D3" }, … ],
      "blocsAutorises": [ … ], "blocsDepart": null,
      "scenarios": [ … ], "indices": [ "…", "…" ], "aSavoir": "5",
      "solutionReference": { …programme v1… },
      "empreinte": "sha256:…" }
  ]
}
```

- `id` d'exercice **stable, jamais réutilisé** (`dist-ex05`, pas un numéro d'ordre) : l'ordre peut changer.
- `empreinte` = hachage de ce qui change le résultat (consigne, composants, scénarios, solution). Si l'empreinte
  d'un exercice réussi change → « modifié, à revérifier » ; les blocs de l'équipe sont gardés.
- Comparaison de deux versions → ajoutés / modifiés / supprimés / déplacés (écran C13), refus si
  `moteurMinimum` > version du moteur, refus si une évaluation est verrouillée, version précédente gardée pour
  « Revenir à la version précédente ».
- Le 3e indice n'est pas écrit : il est tiré de la solution (comme le brief design B9).

## 5. Sauvegarde (R6)

Chaque projet garde **son** fichier d'équipe. Labo Blocs y écrit une rubrique versionnée et ne touche pas au reste :

```json
{
  "application": "atelier-cereales", "format": 1, "equipe": { … }, "carnet": { … },
  "programmation": {
    "format": "labo-blocs/sauvegarde", "version": 1,
    "parcours": { "id": "distributeur", "version": "1.2.0" },
    "exercices": {
      "dist-ex05": { "blockly": { … }, "statut": "reussi", "empreinte": "sha256:…",
                     "indicesOuverts": 1, "verifications": [ … ], "envoisCarte": [ … ], "temps": 312 }
    },
    "reglages": { "niveau": 2, "mode": "simulateur" }
  }
}
```

- Migration à la lecture des sauvegardes actuelles de l'atelier (exercices `"1"`…`"13B"` → `dist-ex01`…), sans
  jamais réécrire l'ancien fichier avant que l'équipe ait travaillé. Tests sur les sauvegardes d'exemple de l'atelier.
- Écriture : comme l'atelier (automatique, jamais d'écrasement d'un fichier plus récent, copie de secours).

## 6. Cartes, envoi et live (R3, R5, décision « option C »)

**Un firmware de base par carte** = interpréteur de code octet + protocole live v2. Il est installé une fois
(« installation du programme de la carte », écran A6), puis l'élève envoie seulement son programme compilé
en **code octet** (quelques centaines d'octets) : pas de compilation C++ en classe, pas de serveur.

Deux pistes à départager au jalon 0 pour **garder le programme après coupure** :
1. **EEPROM** (1 Ko sur ATmega328P) : envoi par le port série, simple, mais programmes courts.
2. **Flash** : le navigateur recopie l'image du firmware avec le code octet ajouté dans une zone réservée, et
   l'envoie avec le flasher STK500 déjà écrit (≈ 10 s). Taille ≫ 1 Ko, aucun besoin d'écrire la flash depuis le
   firmware. Plus lent, mais c'est ce que fait déjà l'atelier.

Je propose de mesurer les deux : taille réelle du code octet des solutions 01–13B et des programmes de
Simon Rétro Game (hasard + listes), temps d'envoi, survie à la coupure.

> Jalon 0 (14/10) : **l'EEPROM suffit** — 130 octets pour le distributeur 13B, 524 pour un Simon complet
> (`essais/RAPPORT-JALON-0.md`). La piste flash reste en réserve. À confirmer sur les vraies cartes.

- **mBot mCore** : ATmega328P + bootloader Uno → même chemin que la Uno, profil de broches différent.
- **micro:bit** : pas de Web Serial vers le bootloader ; piste = copie d'une image `.hex` (firmware + code octet)
  via WebUSB/DAPLink, comme l'éditeur Python officiel, et le live par le port série USB. V1 (16 Ko RAM) et V2 à tester.
- **Live v2** : garde v1 tel quel (`PING→PONG v2`, `D`, `A`, `T`, `OFF`, arrêt après 3 s sans signe de vie), ajoute
  `R <broche>` (lecture numérique), `RA <broche>` (analogique), `S <broche> <angle>` (servo), `W <0|1>` (les
  entrées changées sont envoyées par la carte sans qu'on demande), puis `X <extension> …`. Carte simulée jumelle
  du firmware pour les tests, comme le théâtre.
- **Vider la carte** = envoyer un code octet vide (le firmware reste installé).

## 7. Découpage du module partagé et versions (R7)

- `noyau/` et `interface/` forment **le module**, construit dans `dist/labo-blocs-noyau-<version>/`
  (un `labo-blocs.js` + `labo-blocs.css` + `blockly/`) que chaque projet copie dans son `site/vendor/` par
  `npm run vers-projet -- ../atelier-cereales`. Le projet note la version copiée ; pas de lien réseau.
- Versions séparées, toutes affichées dans « À propos » et vérifiées : **moteur** (semver du module),
  **programme** (format), **parcours** (de chaque paquet), **protocole** live, **firmware** de chaque carte
  (« carte pas à jour » si différent).
- Un projet fournit seulement : son paquet de parcours (ou une référence id + version), son accent, ses extensions,
  ses pages propres (carnet…), et appelle `LaboBlocs.monter(element, options)`.

## 8. Jalon 0 — essais (en premier, jetables, dans `essais/`)

| Essai | Mesure | Livré |
|---|---|---|
| a. Interpréteur Uno | octets de code octet des solutions 01–13B ; EEPROM vs flash ; survie à la coupure | rapport + carte qui exécute un programme venu de blocs |
| b. mBot mCore | envoi par le même flasher, broches/moteurs du mCore | rapport |
| c. micro:bit V1/V2 | envoi d'une image par WebUSB, place disponible | rapport + décision |
| d. Live v2 | `R` et `W` : lecture d'un bouton, latence | carte simulée jumelle + test sur vraie carte |
| e. Web Serial | reconfirmation sur un autre poste du collège | ✔ / ✘ par poste |

Ce qui demande **ta main** (je n'ai pas de carte ici) : brancher les cartes, lancer les pages d'essai, me dire ce qui
s'affiche. Je prépare des pages d'essai qui affichent un compte rendu à copier-coller.

## 9. Réponses de Thomas (14/10/2026)

1. Cahier des charges v5 ajouté dans `docs/`.
2. **Matériel en salle** : Arduino Uno, mBot (mCore), micro:bit V1 et V2.
3. Fils « quand… » : un événement qui revient pendant que son fil tourne est **ignoré**.
4. **Tous les projets utilisent le moteur de Labo Blocs** (le distributeur d'abord, puis le théâtre d'ombre, etc.).
5. Mise à jour « en ligne » : par **GitHub Pages**, comme l'atelier.
6. Brief design : version du 14/10 (style des blocs de l'atelier).
7. **mBot** : ultrasons toujours sur le **port 3**, suiveur de ligne sur le **port 2** (imposé aux élèves) : blocs sans choix de port.
8. **Boutons** (distributeur) : poussoirs à 2 fils vers GND, résistance interne de la carte.
9. **Jalon 0 terminé le 15/10/2026** (`essais/RAPPORT-JALON-0.md`) : Uno, mBot, micro:bit V2 validés ; **micro:bit V1
   abandonnée** (pas en salle).
10. **Jalon 1 livré le 15/10/2026** (recette à faire, `RECETTE.md`). Écarts au plan : les modules sont dans `noyau/` et
   `interface/` à la racine et le site les charge par `../` (pas encore de module construit dans `dist/` : il viendra avec
   l'intégration au distributeur, jalon 1 bis) ; le simulateur exécute le **même code octet** que les cartes (une seule
   source de vérité) ; les indices et « À savoir » s'ouvrent par-dessus l'éditeur (comme l'atelier) plutôt que dans la
   colonne de gauche de la maquette.
11. **Retours de Thomas sur le jalon 1 (15/10/2026), intégrés et validés** : colonnes repliables par des languettes à
   mi-hauteur entre les colonnes ; mots si / alors / sinon (et tant que, répéter…) mis en évidence dans la consigne, une
   ligne par « si », « alors » et « sinon » en retrait ; consigne en **bandeau au-dessus des composants et du programme**
   (la colonne Tester garde toute la hauteur pour le simulateur du 13A), « Besoin d'aide ? » au-dessus des composants,
   « Masquer le texte » ; bouton **Plein écran** dans le bandeau.
12. **Jalon 1 bis livré le 15/10/2026, recette validée par Thomas le 16/10/2026** (`RECETTE.md` §6). L'atelier du distributeur
   (`atelier-cereales`, même branche) utilise le module de Labo Blocs : écran d'exercice, moteur (simulation,
   vérification, code Arduino), sauvegarde. Ce qui a été décidé en le faisant :
   - **Module construit** (`npm run module`) : `labo-blocs-noyau.js` (aussi `require()` sous Node pour les tests des
     projets), `labo-blocs-interface.js`, `labo-blocs.css` dont chaque règle est limitée à `.labo-blocs` (les pages
     du projet ne changent pas), polices, Blockly, `VERSION.json`. Copié dans `site/vendor/labo-blocs/` du projet par
     `npm run vers-projet`. Moteur 0.2.0. Écran d'exercice décrit une seule fois (`interface/gabarits.js`), posé
     dans la page d'un projet par `LaboBlocs.monterExercice(element, options)` : retour au carnet, mode enseignant
     (« Solution », liste des exercices), actions après réussite (envoi dans la carte).
   - **Atelier** : `site/parcours/distributeur.js` remplace `site/exercices/` ; l'ancien moteur, les blocs et l'écran
     d'exercice de l'atelier sont supprimés. Fichier d'équipe au **format 2** : les exercices sont dans la rubrique
     `programmation` (identifiants `dist-01`…) ; le carnet, l'outil du professeur et la notation les lisent toujours
     par numéro (vue calculée, jamais écrite). Les fichiers au format 1 se lisent et sont recopiés sans perte.
   - **Mettre à jour les exercices** dans `prof.html` (bouton « Exercices ») : version installée, nouvelle version en
     ligne (`https://anlito.github.io/labo-blocs/parcours/distributeur.labo-parcours.json`, publiée par
     `.github/workflows/pages.yml` — Pages à activer dans les réglages du dépôt) ou par fichier ; contrôle (format,
     identifiant, moteur minimum) ; différences avec aperçu (consigne avant / après) ; validation = réécriture de
     `parcours/distributeur.js` dans le dossier du site choisi par le professeur, l'ancien gardé dans
     `distributeur-precedent.js` (« Revenir à la version précédente ») ; Firefox ou site en ligne : téléchargement.
   - **Carte du distributeur** : les programmes 13A/13B restent précompilés (firmware Labo Blocs au jalon 3) ; leur
     empreinte (solution + broches) est rangée avec les `.hex`. Si une mise à jour change le 13, l'outil le signale et
     l'atelier refuse d'envoyer l'ancien programme (« demande à ton professeur »).
   - **Pas encore** : verrouillage d'une évaluation (jalon 5) ; l'écran de mise à jour devra le respecter.
   - Corrigé au passage dans le module : quand le message de résultat s'affiche, le dessin de la carte rétrécit et la
     colonne défile, au lieu de cacher « Lancer / Pause / Pas » (exercice 13 à 1366 × 768).
13. **Jalon 2 livré le 16/10/2026, recette validée par Thomas le 16/10/2026** (`RECETTE.md` §7) : éditeur de parcours `site/editeur.html`
   (écrans B8 et B9). Liste des exercices réordonnable (glisser, monter, descendre), ajouter, dupliquer, supprimer ;
   identifiants jamais réutilisés (`idsRetires`) ; numéros renumérotés dans l'ordre (13A / 13B gardés) ; exercice :
   titre, consigne, niveau de blocs (au choix de l'élève, ou imposé pour une évaluation : `niveau`, `niveauVerrouille`,
   respectés par l'écran élève), défi, fiche « À savoir » (choisie, modifiée ou créée), composants et broches (une
   broche changée suit dans la solution et les scénarios), blocs proposés par catégorie, deux indices ; solution
   construite en blocs avec la palette cochée ; scénarios à étapes (attendre, appuyer, maintenir, relâcher, vérifier,
   rester stable, impulsion, suite d'états, alternance ; phrase pour l'élève facultative) ; « Tester mes scénarios sur
   ma solution » ; aperçu du simulateur. Réglages du parcours (titre, carte, boutons, paramètres `$nom`). Brouillon
   gardé dans le navigateur ; « Exporter » (.labo-parcours.json) ; « Publier » refuse un parcours dont une solution ne
   passe pas ses scénarios, puis écrit `parcours/<id>/parcours.js` (et `parcours/index.js` pour un nouveau parcours)
   et télécharge le fichier d'échange pour les projets. Opérations testées sous Node dans `noyau/edition.js`.
   Moteur 0.3.0 (niveau par exercice) : recopié dans l’atelier. Pas encore : cartes mBot et micro:bit dans l’éditeur (jalon 3), lexique (gardé tel quel), édition des schémas et
   étapes en blocs des fiches (gardés tels quels).
14. **Jalon 3 — décisions de Thomas (16/10/2026)** :
   - **Distributeur : l'élève envoie son propre programme** dans la Uno (mode « Dans la carte », tout exercice), avec
     le programme de la carte Labo Blocs installé une fois par Uno ; l'envoi de la solution précompilée disparaît.
   - **Blocs mBot comme mBlock** : avancer, reculer, tourner à gauche ou à droite à une vitesse (%), pendant un
     temps ou non, arrêter, moteur gauche ou droit seul, distance aux ultrasons (cm, port 3), suiveur de ligne
     (port 2), bouton de la carte, LED RGB, jouer une note.
   - **Simulateur : micro:bit oui, mBot non** (cahier des charges) : pour le mBot, un tableau montre les moteurs et
     les LED, et les capteurs se règlent à la main ; le vrai test se fait sur le robot.
   - **Blocs micro:bit V2** : écran (nombre, image, pixel, effacer, texte qui défile), boutons A et B, logo tactile,
     broches P0 à P2, capteurs (secouer et pencher, température, lumière), note sur le haut-parleur.

15. **Jalon 3 livré le 16/10/2026, recette validée par Thomas avec le matériel le 16/10/2026** (`RECETTE.md` §8 : Uno, mBot et micro:bit reçoivent un programme et se vident ; sens des moteurs, LED gauche/droite et ports du mBot conformes). Retour intégré : case de valeur à droite du bloc « comparaison ». Ce qui a été fait :
   - `noyau/cartes.js` : profils Uno / mBot / micro:bit V2 (broches des menus, programme de la carte, installation par
     le câble ou par fichier), blocs de carte décrits une seule fois (Blockly, programme, compilateur les lisent) et
     déroulés en blocs de base + commandes d'extension ; carte simulée (écran 5 × 5, boutons A/B, logo, capteurs ;
     moteurs, LED RGB, ultrasons, suiveur de ligne, bouton du mBot). Couleur lilas + pictogramme puzzle.
   - Une commande de carte porte 4 valeurs au plus (C et MicroPython) : le texte de la micro:bit part en morceaux de
     4 lettres (commande 14, puis 11) ; le compilateur refuse une commande à plus de 4 valeurs.
   - `cartes/` : programmes de carte 0.2 (Uno, mCore, micro:bit V2) et leur construction (`npm run firmwares`) ;
     tests : même déroulé dans le simulateur, le C et le MicroPython ; une seule version partout.
   - `interface/carte.js` + `interface/televersement.js` : mode « Dans la carte » (écran A6, 9 états de la maquette +
     « mauvaise carte » et « programme à revoir »), Web Serial, protocole v2, installation STK500 (Uno, mBot) ou
     fichier à copier (micro:bit), « Vider la carte » ; une seule connexion pour la page ; une carte déjà autorisée est
     reprise sans fenêtre. Envois et vidages dans l'historique de l'exercice.
   - Scénarios : boutons de la carte (A, B, logo, bouton du mBot) et moteurs du mBot comme des composants ; étape
     « Régler un capteur de la carte » (distance, suiveur de ligne, lumière, température, accélération, geste).
   - Éditeur : carte du parcours (composants, broches et blocs suivent), mode « Dans la carte » dans les réglages.
   - Parcours de découverte `decouverte-mbot` et `decouverte-microbit` (3 exercices chacun), ouverts par
     `site/index.html?parcours=…` ; distributeur 1.1.0 avec le mode « Dans la carte ».
   - Atelier : l'élève envoie son programme ; « Vider la carte » du carnet ; envoi précompilé retiré.
   - Recette automatique avec une carte virtuelle (`tests/outils/carte-virtuelle.js`) : Labo Blocs 20/20, atelier 23/23.
   - **À vérifier avec le matériel** : sens des moteurs du mBot (« tourner à gauche »), quelle LED est « gauche »
     (commande 6 : 1 = droite, 2 = gauche supposé), port des capteurs (ultrasons 3, ligne 2), copie du fichier
     micro:bit puis envoi par le câble.
16. **Jalon 4 livré le 16/10/2026, recette validée par Thomas** (`RECETTE.md` §9) : Arduino Uno et micro:bit en direct et en envoi dans la carte ; clé 2.4G du mBot reportée à la V2. Mode « En direct » :
   - `noyau/direct.js` : le simulateur tourne au rythme de l'horloge ; chaque sortie changée part en commande v2 (`D`, `A`,
     `S`, `T`, `X` arrondis à l'entier), boutons surveillés (`M`, `W` → événements `E`), capteurs relus (`X` de lecture
     trouvés dans le programme), ordres répétés filtrés (boucle sans attente), arrêt `W` + `OFF`.
   - `interface/carte.js` : une connexion pour la page ; file de commandes (une réponse attendue à la fois), lectures
     quand rien n'attend, `PING` au moins toutes les 0,8 s ; 3 réponses manquées → « La carte ne répond plus » ; onglet
     fermé → `OFF` (sinon la carte éteint tout après 3 s). Aucun changement des programmes de carte (0.2).
   - **mBot : clé 2.4G** (réponse de Thomas, 16/10) : c'est un périphérique HID pour l'ordinateur (pas un port série) →
     WebHID, rapports « longueur + octets » portant le même protocole ; direct et envoi dans le robot par la clé ;
     l'installation du programme de base reste au câble (redémarrage nécessaire). **Format des rapports à confirmer
     avec la vraie clé** ; la clé virtuelle de la recette suit ce format. **Décision de Thomas (16/10/2026) : la clé
     2.4G sera testée en V2** (pas de clé sous la main) ; le code reste, non validé avec le matériel.
   - Bluetooth de l'ordinateur : il ne parle pas au module 2.4G (autre radio). Il faudrait le module Bluetooth de
     Makeblock sur le robot (Web Bluetooth, Chrome/Edge) : piste possible plus tard.
   - Modes par parcours (`modes`) et par exercice (`exercice.modes`, prioritaire) ; le simulateur reste toujours
     (« Vérifier »). Éditeur : réglages du parcours et « Modes pour tester » de chaque exercice. Distributeur 1.2.0 et
     découvertes 1.1.0 avec les trois modes ; atelier : « Essayer en direct sur la maquette ».
   - Recette automatique : Labo Blocs 23/23, atelier 24/24.
17. **Jalon 5 livré le 16/10/2026, recette validée par Thomas le 16/10/2026** (`RECETTE.md` §10). Décisions de Thomas (16/10) : compétences qui
   donnent une note ; pas de lien direct avec Pronote : la correspondance avec les élèves se fait dans son **Carnet de
   classe** (`Anlito/gestion-de-classe-et-suivi-projet`), avec correction à la main ; liste de compétences proposée ;
   un outil du professeur par projet (l'atelier garde le sien).
   - `noyau/competences.js` : C5, C6, C8, C9 (libellés du programme de cycle 4, BO 2024, repris du Carnet) ; score d'un
     exercice (retenues pour indices et vérifications ratées avant la réussite, participation) ; niveau par compétence
     (seuils 25 % / 60 %, Dépassé = Atteint + défi réussi) ; note /20 = moyenne des niveaux × 5 (comme le Carnet) ;
     fichier `labo-blocs/resultats` (prénoms, classe, niveaux, note, commentaire) et CSV.
   - `noyau/classe.js` + `site/prof.html` (B10 tableau, B11 fiche) : dossier de la classe relu toutes les 30 s ou fichiers
     importés ; fiche avec niveaux forcés, commentaire, programme rejoué dans l'écran d'exercice (lecture seule) ;
     réglages du professeur dans `labo-blocs-professeur.json` (fichiers des élèves jamais modifiés).
   - Éditeur : « Compétence évaluée » de chaque exercice ; distributeur 1.3.0 (C9 : 1–3, 9–11, 13A/B ; C6 : 4–8, 12),
     découvertes 1.2.0.
   - Carnet de classe 1.22.0 : Notes › « Importer des résultats Labo Blocs » (fusionné dans `main` et en ligne le 16/10/2026).
   - Atelier : bouton « Carnet de classe » et compétences dans le bilan d'une équipe.
   - Recette automatique : Labo Blocs 24/24, atelier 24/24, tests du Carnet 71/71 (dont 4 nouveaux).
18. **Kit nouveau projet (16/10/2026)**, demandé par Thomas après le jalon 5 : ce qu'il faut fournir à un futur projet
   pour que sa partie programmation soit reliée à Labo Blocs.
   - `npm run nouveau-projet -- <dossier> --titre … --parcours <id | fichier .labo-parcours.json> [--classes] [--chemin]
     [--accent]` : `site/programmation.html` (élèves, tirée de `site/index.html`), `site/programmation-prof.html`
     (professeur, tirée de `site/prof.html`), `site/projet-labo-blocs.js`, `site/parcours/<id>.js`,
     `site/vendor/labo-blocs/`, `docs/BRIEF-LABO-BLOCS.md`, `LISEZ-MOI-LABO-BLOCS.md`. Rien n'est écrasé.
   - Module : l'outil du professeur (`interface/professeur.js`) et `labo-blocs-professeur.css`, plus `logo.svg`.
     Version du moteur inchangée (0.3.0) : ajout seulement, aucun parcours n'est refusé par l'atelier.
   - Sauvegarde : le fichier d'un autre projet (son `application`, ses rubriques) est lu s'il porte une rubrique
     `programmation` de Labo Blocs.
   - Outil du professeur : l'exemple du dossier de la classe suit les réglages du projet.
   - `docs/BRIEF-LABO-BLOCS-POUR-UN-PROJET.md` : principe, fichiers reçus, contraintes, `monterExercice`, sauvegarde,
     outil du professeur, mises à jour, recette.
19. **Accueil du professeur et code professeur (16/10/2026)**, demandés par Thomas : l'adresse de Labo Blocs ouvrait les
   exercices du distributeur ; elle ouvre maintenant `site/accueil.html` (créer ou modifier un parcours, suivre une
   classe, essayer chaque parcours en mode enseignant), protégé par un **code professeur** (choix de Thomas : code
   d'accès simple). `interface/porte-professeur.js` cache la page jusqu'au bon code (PBKDF2-SHA-256, sel, empreinte dans
   `site/code-professeur.js`, `npm run code-professeur` ; le code n'est écrit nulle part) ; mémorisé sur l'ordinateur,
   « Verrouiller » le redemande. Pages concernées : accueil, éditeur, suivi de classe, mode enseignant (`?enseignant`) ;
   la page des élèves reste libre. Limite dite à Thomas : dépôt public sans serveur, barrière pour les élèves et non
   vraie sécurité (aucune donnée d'élève en ligne).
20. **Nouveau parcours par un simple fichier ; classes et dossier dans le parcours (16/10/2026)**, demandés par Thomas.
   - Le site lit la liste `parcours/index.js` (`LaboBlocs.chargerParcoursDuSite`) : `index.html` et `prof.html` ne listent
     plus les parcours à la main. `tools/parcours-depot.js` : chaque dossier `parcours/<id>/` et chaque fichier
     `.labo-parcours.json` déposé dans `parcours/` (GitHub › « Add file › Upload files ») ; la version la plus récente
     l'emporte. `npm run publier` écrit le script et la liste de chacun dans `_site/` ; le module et les outils
     (`vers-projet`, `nouveau-projet`) les voient aussi.
   - Éditeur › Réglages : « Classes proposées » et « Dossier de l'équipe » (champs `classes`, `cheminSauvegarde` du
     parcours, contrôlés). Sur le site de Labo Blocs ils remplacent ceux de `projet.js` ; un projet créé par le kit garde
     les siens (`reglagesDuProjetPrioritaires`) et les prend comme valeurs de départ.
   - « Publier » en ligne : un seul fichier téléchargé, avec la marche à suivre sur GitHub.
   - Accueil : « Essayer » et « Copier le lien élèves » pour chaque parcours.
   - Tests lancés l'un après l'autre (`--test-concurrency=1`) : plusieurs reconstruisent `dist/`.
21. **Exercice libre (16/10/2026)**, idée de Thomas ; ses choix : composants actuels (LED, bouton, servomoteur,
   buzzer), pas de niveau, pas de contrainte vérifiée, à faire tout de suite.
   - Exercice `libre: true` : ni solution ni scénario exigés (`controler`, publication). Sur Arduino Uno, les composants
     viennent des blocs posés (`composantsDuProgramme` : LED, bouton — condition ou « quand » —, servomoteur, buzzer,
     dans l'ordre d'apparition) ; une broche employée pour deux composants est signalée en ambre (le premier est
     gardé). mBot et micro:bit : les composants de la carte, comme d'habitude.
   - Élève : la liste des composants et le simulateur suivent le programme ; « J'ai terminé » remplace « Vérifier »
     (`noterTermine` : fait, le suivant s'ouvre, historique « termine ») ; pas d'indice s'il n'y en a pas, pas de
     solution. Écran du parcours : « Exercice libre · terminé ».
   - Compétences : un exercice libre ne compte dans aucune (le professeur juge à la fiche de l'équipe).
   - Éditeur : case « Exercice libre » ; composants, scénarios et compétence masqués ; la solution devient un
     « Exemple (facultatif) » dont l'aperçu montre les composants.
22. **Plus d'ancienne version gardée par le navigateur (16/10/2026)** : Thomas ne voyait pas la case « Exercice libre »
   après la publication (GitHub Pages laisse les navigateurs garder les fichiers 10 min). La publication ajoute
   `?v=<numéro>` aux scripts et aux styles des pages ; les parcours (`parcours/index.js`, `<id>/parcours.js`) sont
   toujours relus (`?t=<instant>`).
23. **Mise en ligne directe des parcours (16/10/2026)**, demandée par Thomas : « Publier » envoie le parcours dans
   `parcours/` du dépôt GitHub (`interface/github-depot.js`, API GitHub, branche main ; fichier remplacé s'il existe).
   Clé d'accès « fine-grained » créée par Thomas (dépôt labo-blocs seul, « Contents : Read and write »), enregistrée
   dans l'accueil (vérifiée, gardée dans ce navigateur, « Oublier la clé ») ; mode d'emploi dans l'accueil. Sans clé :
   téléchargement comme avant. Erreurs de GitHub en français avec la prochaine action. Seul le parcours part (aucune
   donnée d'élève), et seulement vers api.github.com.
24. **Page des élèves et publication jamais bloquée par un parcours ajouté (16/10/2026).** Premier vrai envoi de Thomas
   (« TEst » 1.0.0) arrivé sur GitHub, mais la publication s'est arrêtée : un test exigeait exactement les 3 parcours
   d'origine. Les tests ne dépendent plus des parcours ajoutés par le professeur. `site/eleves.html` (demande de
   Thomas) : tous les parcours, sans code professeur, chacun ouvre l'accueil de l'équipe ; lien (et « Copier le lien »)
   dans l'accueil du professeur.
25. **Dossier de l'équipe toujours créé par Labo Blocs (16/10/2026)**, demande de Thomas : l'élève sélectionne le
   dossier du projet (avant-dernier du chemin, surligné), Labo Blocs y crée ou retrouve le dossier de l'équipe. Le
   dossier de l'équipe choisi directement est refusé avec « choisis le dossier qui le contient » ; un autre dossier :
   « créer dedans » ou rechoisir (plus de « utiliser ce dossier quand même »). Chemin du distributeur et des nouveaux
   projets aligné sur l'atelier : `Bureau › Classe › {classe} › COMMUN › TECHNOLOGIE › … › {equipe}`.
26. **Exercice libre : composants sur une même broche (16/10/2026)**, retour de Thomas : les deux composants restent
   (simulateur et liste, marqués « broche partagée », en ambre), tous les conflits sont décrits, dès l'ouverture ;
   l'aperçu de l'éditeur les signale aussi. Vue du simulateur : une carte par composant (plus par broche).
27. **Variables créées par les élèves (16/10/2026)**, demande de Thomas : par exercice, « Variables données aux élèves »
   (absent : CHOIX, comme avant) et « Les élèves créent leurs propres variables » (bouton « Créer une variable » dans la
   palette). Nom vérifié (`nomDeVariable` : sans accent ni espace, une lettre au début, 16 caractères, pas un mot du
   langage de la carte, pas déjà pris) ; menus des blocs de variables avec toutes les variables connues. Simulateur,
   carte et code Arduino acceptaient déjà tout nom.
   - Pages du kit nouveau projet : `html { height: 100% }` (l'espace de programmation était trop petit en mode
     enseignant).
28. **Réglages du collège communs à tous les outils (16/10/2026)**, demande de Thomas (« avoir la main facilement sur
   l'ensemble des projets »). Décisions : liste en ligne avec copie de secours (exception à « aucune ressource en
   ligne », inscrite dans CLAUDE.md) ; modification dans une page protégée ; liste commune d'abord, puis l'écran de
   départ uniformisé projet par projet (validé à chaque fois).
   - `site/college.js` : `definirCollege({ classes, cheminClasse })` (ex. `Bureau › Classe › {classe} › COMMUN ›
     TECHNOLOGIE`), publié à https://anlito.github.io/labo-blocs/site/college.js (même adresse que Labo Blocs : la clé
     GitHub de Thomas suffit). Accueil › « Réglages du collège » : classes et chemin, « Publier les réglages ».
   - `interface/college.js` (aussi dans le module) : copie de secours lue d'abord, version en ligne ensuite
     (`chargerCollegeEnLigne`, jamais bloquant, jamais une copie gardée par le navigateur) ; un projet dit ses
     `niveaux` (['5']) et son `cheminProjet` (['DISTRIBUTEUR DE CEREALES']) ; `projetAvecCollege` complète classes et
     chemin ; l'accueil des élèves se redessine si la version en ligne arrive après.
   - Distributeur : niveaux 5 ; autres parcours du site : toutes les classes, dossier = titre du parcours (sauf
     réglages du parcours dans l'éditeur) ; kit nouveau projet : `--niveaux`, copie de secours `site/college.js`.
   - Prochaines étapes (une validation à chaque fois) : atelier céréales, Théâtre d'ombre, Concept Store 3D, Vitrine.
29. **Groupes de classe (17/10/2026)**, demande de Thomas : une classe qui finit par un chiffre après la lettre (3D1)
   est un groupe de la classe 3D ; son dossier est au bout du chemin de la classe (`… › 3D › COMMUN › TECHNOLOGIE ›
   3D1 › projet › équipe`). `{groupe}` dans le chemin, `remplirChemin` ; même règle dans les autres outils.
30. **Refonte graphique de l'accueil professeur (17/10/2026)**, maquettes Claude Design de Thomas : bandeau clair,
   cartes à liseré coloré, liste des parcours en lignes, `interface/css/accueil-refonte.css` ; nouvelle page
   `site/reglages.html` (« Réglages du collège », « Mise en ligne des parcours »), liée depuis le bandeau et le pied de
   l'accueil, protégée par le code professeur. Textes conservés.
31. **Jalon 6 — caméra et IA (17/10/2026)**, demande de Thomas (projets futurs avec Arduino, micro:bit, mBot ; le
   Théâtre d'ombre passera dessus plus tard). Décisions : apprentissage par les élèves dans Labo Blocs (panneau
   « Caméra et IA ») ; blocs en simulateur et « En direct » seulement (la caméra est dans l'ordinateur).
   - Noyau : extension 3 « caméra » (1 reconnaît n° → 0/1, 2 certitude n° → 0..100), jamais envoyée à la carte ;
     blocs `camera_reconnait`, `camera_certitude` ; événement `quand_camera` (reconnaît / ne reconnaît plus) compilé en
     boucle de surveillance (aucun changement de la machine virtuelle ni des programmes de carte). Simulation :
     capteur `camera` (n°, 0 = rien) et `certitudes` ; scénarios `regler: { camera: n }`.
   - Exercice : `camera: { etiquettes: ['Pouce levé', 'Main ouverte'] }` (n° 1, 2… ; 0 = « Rien »). Éditeur de
     parcours : champ « Étiquettes », catégorie « Caméra », réglage de la caméra dans les scénarios.
   - IA : `noyau/knn.js` (k plus proches voisins, cosinus ; stabilité : 5 images à 80 %) ; `interface/camera.js`
     (webcam, photos, vignettes, « faire comme si » sans caméra) ; MobileNet v2 0.5 et TensorFlow.js dans
     `site/vendor/vision/`, le modèle en script classique (`tools/vision-modele.js`) pour marcher en `file://`.
     Photos de l'équipe : rubrique `programmation.camera` (par nom d'étiquette, partagée par les exercices).
   - Module : `vision/` copié dans le module ; `vers-projet` ne le copie que pour un parcours avec caméra (ou
     `--camera`). Parcours d'exemple « Découverte de la caméra (IA) » (Uno).
32. **Caméra : améliorations après essai (17/10/2026)**, demandes de Thomas : étiquettes créées par les élèves
   (option d'exercice `camera.etiquettesLibres`, case dans l'éditeur ; ajouter, renommer, supprimer la dernière —
   les programmes utilisent les numéros ; enregistrées dans `programmation.camera.etiquettes` ; exercice d'exemple
   `cam-03`) ; « + 10 photos » cumule (et « Effacer les photos ») ; « Ce que pense l'IA, en direct » : barres par
   étiquette avec le seuil, images de suite, photo apprise la plus proche (`reconnaitre` renvoie `proche`).
33. **Afficheur LED Matrix 8×16 du mBot (19/10/2026)**, demande de Thomas. Décisions : branché sur le **port 4**
   (imposé, comme les ultrasons et le suiveur de ligne) ; blocs dessin à cliquer, texte, nombre, heure (pas de points
   ni « effacer » : un dessin vide efface).
   - Extension 1, commandes 10 à 15 : dessin en deux moitiés (4 valeurs de 2 colonnes chacune), nombre en centièmes
     (le mode direct n'envoie que des entiers), heure, texte en morceaux de 4 lettres. Colonne = octet, bit 0 = haut.
   - Texte : police 5 × 7 ; immobile et centré s'il tient (2 lettres), sinon il défile une fois (100 ms par colonne),
     sans bloquer le programme ; le même texte redonné pendant qu'il défile continue de défiler. Nombre : chiffres
     étroits 3 × 7, 2, 1 ou 0 décimales selon la place ; trop grand, il défile. Heure « hh:mm » sur 16 colonnes.
   - Programme de la carte du mBot **0.3** (version propre à chaque carte : `profil.version`, `firmwares.js` →
     `versions`) ; l'Uno et la micro:bit restent en 0.2 (rien à réinstaller). Pilote de l'afficheur comme MeLEDMatrix
     (horloge S1 = A0, données S2 = A1) ; sens de l'afficheur à vérifier sur le robot (`MATRICE_HAUT_BAS`,
     `MATRICE_GAUCHE_DROITE`). Test : la partie mBot du `.ino` tourne sur l'ordinateur et ses fils sont décodés.
   - « En direct » : les morceaux d'un ordre (texte, dessin) partent avec sa dernière commande ; corrige aussi un
     texte répété de la micro:bit qui laissait des lettres en trop.
34. **Caméra : cadrer en prenant les photos (19/10/2026)**, retour de Thomas (il fallait descendre vers les étiquettes et
   l'image de la caméra disparaissait) : l'image reste collée en haut de la colonne (`position: sticky`), haute d'un
   tiers d'écran au plus ; une étiquette amenée à l'écran s'arrête sous l'image.
35. **Clé 2.4G du mBot : page d'essai (19/10/2026)** — Thomas a la clé. Avant la recette 9.9 à 9.12, `site/essai-cle.html`
   (lien dans Réglages › Matériel) choisit la clé, décrit ses rapports HID, envoie `PING` emballé comme Labo Blocs
   (longueur + octets), puis d'autres façons si le robot ne répond pas, et garde un compte rendu à copier. Rien n'est
   envoyé ailleurs que vers la clé.
36. **Clavier de l'ordinateur (19/10/2026)**, demande de Thomas (piloter en direct Arduino, micro:bit et mBot, le mBot
   aussi par la clé 2.4G) : blocs `quand_touche` (appuyée / relâchée) et `touche_appuyee`, catégorie « Clavier » (toutes
   les cartes) ; flèches, espace, lettres, chiffres.
   - Extension 4 (1 : la touche, code → 0/1), jamais envoyée à la carte ; « quand la touche » compilé comme
     « quand la caméra » (boucle de surveillance). Une touche est une entrée du simulateur (`touche:haut`) : les
     scénarios l'appuient comme un bouton (« Maintenir appuyée la touche flèche haut », accord au féminin).
   - Page : les touches vont au programme pendant qu'il tourne (capture avant l'éditeur de blocs, ni défilement ni clic
     de bouton), jamais dans un champ de texte ni avec Ctrl / Alt ; touches lâchées si la fenêtre perd la main ; ligne
     « touche appuyée : … » sous le simulateur. « Dans la carte » refuse un programme qui utilise le clavier.
   - Exercice d'exemple `mbot-05` « Télécommande au clavier » (simulateur et direct), Découverte du mBot 1.4.0.
37. **Clavier : 16 blocs « quand… » (19/10/2026)**, retour de Thomas (les 4 flèches appuyées et relâchées, soit 8 blocs
   « quand la touche », ne marchaient pas) : la carte garde 6 fils au plus, mais un programme avec « quand la
   touche » ou « quand la caméra » reste dans l'ordinateur, il en a 16 (`noyau/code-octet.js`, `noyau/vm.js`). Un
   programme qui ne peut pas démarrer le dit sous le simulateur (« Ton programme ne peut pas démarrer : … ») au lieu
   de ne rien faire.
38. **micro:bit : dessin 5 × 5 (19/10/2026)**, demande de Thomas. Décisions : points allumés / éteints (sans
   luminosité) ; programme de la carte de la micro:bit en **0.3** (une mise à jour par micro:bit, fichier à glisser).
   Bloc `mb_dessin` (catégorie Écran), champ `field_dessin_microbit` : même grille à cliquer que l'afficheur du mBot
   (champ commun, `interface/blocs.js`). Extension 2, commande 15 : 2 valeurs (lignes 0 à 2, puis 3 et 4) ;
   `main.py` les remet en `Image`. Exercice libre d'exemple `mb-04` « Mon dessin » (Découverte de la micro:bit 1.3.0).
39. **Commentaires (19/10/2026)**, demande de Thomas (informations sur les exercices ; les élèves commentent leur code).
   Décision : le professeur les écrit dans un **programme de départ** (onglet à côté de la solution, éditeur de
   parcours). Commentaires de Blockly : sur un bloc (bulle) et notes libres (`workspaceComments`) ; bouton
   « Commentaire » dans la zone des blocs (bloc choisi, sinon une note), clic droit aussi. Programme v1 : `commentaire`
   sur tout bloc ou fil, `notes` (texte, x, y, largeur, hauteur) ; gardés par `solutionDepuisProgramme`, `versSimplifie`,
   `versV1` ; sans effet sur le code octet. Code Arduino : lignes « // … ». La sauvegarde de l'équipe (Blockly) les
   garde déjà.

40. **Joystick (19/10/2026)**, demande de Thomas pour un futur projet. Décisions : Arduino Uno et micro:bit ; module
   2 axes + bouton (KY-023) ; blocs « position X / Y », « direction », « bouton du joystick », événement « quand le
   joystick est poussé … » ; broches réglées par l'exercice (composant `{ type: 'joystick', broche: X, y: Y, bouton:
   SW, inverserX?, inverserY? }`), au départ A0 / A1 / D2 (Uno) et P0 / P1 / P2 (micro:bit).
   - Aucun nouvel ordre dans le code octet ni dans les programmes de carte : les blocs du joystick se déroulent en
     blocs de base (`deroulerJoystick`, `noyau/cartes.js`) : lecture analogique, position = arrondi de
     (brut − 512) × 100 / 512 (−100 à 100, signe changé si inversé), direction au-delà de 50 ; le bouton se lit comme
     un bouton vers la masse (résistance interne). « Quand le joystick est poussé » : surveillance comme « quand la
     caméra », une fois à chaque entrée dans la direction.
   - Simulateur : manche à tirer (souris, doigt, flèches), retour au centre au lâcher ; bouton SW à côté
     (`sim.changerAnalogique`). Scénarios : réglage « joystick » comme un capteur (0 centre, 1 haut, 2 bas, 3 gauche,
     4 droite). En direct : axes relus par `RA` (déjà dans les programmes de carte 0.2), bouton surveillé (`W`).
   - Code Arduino : fonction `positionJoystick(broche)`, `pinMode(SW, INPUT_PULLUP)`. Éditeur de parcours : sorte
     « Joystick » (3 broches, cases « Inverser »). Exercice libre : le joystick est ajouté aux composants quand le
     programme l'utilise.

41. **Ré-étalonner et valeur brute du joystick (19/10/2026)**, pour le projet Labyrinthe robotisé (5e et 4e, Arduino
   Uno : joystick A0 / A1 / SW D4, servomoteurs D5 / D6, plus de mBlock). Décision de Thomas : le joystick doit faire
   tourner un servomoteur de 0° à 180° ; on garde le vocabulaire de mBlock et de la fiche « à retenir ».
   - Bloc `reetalonner` (Calculs) : « ré-étalonner v depuis (a, b) vers (c, d) », départ (0, 1023) → (0, 180). Déroulé
     en blocs de base (`deroulerReetalonner`, `noyau/code-octet.js`) : c + (v − a) × (d − c) ÷ (b − a), arrondi à
     l'entier (t − (t mod 1), t = x + 0,5) ; a = b → c. Aucun nouvel ordre pour les cartes. Code Arduino :
     `reetalonner()` avec `floor(… + 0.5)` (même résultat que le simulateur).
   - Bloc `joystick_valeur` (Joystick) : « valeur du joystick sur X / Y (0 à 1023) », lecture analogique de la broche
     de l'axe, sans « Inverser » (déroulé dans `deroulerJoystick`). Code Arduino : `analogRead()`.
   - Moteur **0.4.0** : un parcours qui utilise ces blocs demande `moteurMinimum: '0.4.0'` (un module plus ancien le
     refuse au lieu de dire « Bloc inconnu »). Les parcours existants ne changent pas.
   - Parcours **`labyrinthe` 1.0.0** (`parcours/labyrinthe/parcours.js`, modes simulateur et carte) : 1 plateau à plat
     (D5 à 90°), 2 pencher le plateau (60° ↔ 120°), 3 lire le joystick (VRX > 700), 4 trois positions (directions),
     5 ré-étalonner un axe (1023, 0) → (0, 180), 6 les deux axes, 7 **final** 60° à 120° (feu vert pour le plateau et
     l'envoi dans la carte), 8 **défi** 80° à 100° + bouton SW → plateau à plat. Les exercices 6 à 8 partent du
     programme de l'exercice précédent (on modifie, on ne repart pas de zéro).
