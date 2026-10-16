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
13. **Jalon 2 livré le 16/10/2026** (recette à faire, `RECETTE.md` §7) : éditeur de parcours `site/editeur.html`
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

