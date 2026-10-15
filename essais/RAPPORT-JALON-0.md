# Jalon 0 — Essais : rapport

14/10/2026 · État : **Uno validée sur une vraie carte (sauf le servo, en cours)** · mBot : prêt, à essayer quand Thomas aura un robot ·
micro:bit V1/V2 : prototype prêt à essayer · essai (e) : avec la page d'essai.

Les essais sont jetables (dossier `essais/`), mais le format du code octet, l'interpréteur C et le protocole v2 sont
faits pour être repris au jalon 1 s'ils tiennent sur les vraies cartes.

## Ce qui a été fait

| Essai | Fichiers | Testé ici |
|---|---|---|
| a. Interpréteur dans la Uno | `code-octet/compilateur.js` (blocs → code octet), `firmware/labo_blocs/vm.c` (interpréteur), `labo_blocs.ino` (firmware) | ✔ tests automatiques + vrai firmware dans une Uno émulée (simavr) |
| b. mBot mCore | même firmware compilé avec `CARTE_MCORE` : moteurs, ultrasons, suiveur de ligne, bouton et capteur de lumière de la carte, 2 LED RGB, buzzer | compilation seulement (simavr n'émule pas le mBot) |
| c. micro:bit V1 / V2 | `microbit/main.py` (MicroPython), `firmware/labo_blocs_microbit_v1.hex` et `_v2.hex` | ✔ tests automatiques (python3 et MicroPython) |
| d. Protocole direct v2 | dans le même firmware | ✔ dans la Uno émulée |
| e. Web Serial sur les postes | `page-essai/index.html` (champ « Poste » dans le compte rendu) | à faire sur place |

Commandes : `npm test` (tests), `npm run essais:mesures` (tailles), `npm run essais:firmware` (recompiler le firmware :
arduino-cli, ou avr-gcc + `ARDUINO_CORE` et `SERVO`, voir l'en-tête du script).

## Résultats

### a. Le programme tient en EEPROM et survit à la coupure

**Décision proposée : EEPROM (1 Ko)**, pas besoin de réécrire la mémoire flash.

| Programme | Octets | Part de l'EEPROM |
|---|---|---|
| Distributeur 01 à 12 (solutions) | 27 à 92 | 3 à 9 % |
| Distributeur 13A / 13B | 118 / 130 | 12 / 13 % |
| Simon complet (liste de 32 couleurs, hasard, 2 fonctions, 4 LED, 4 boutons, buzzer) | 524 | 51 % |

- **Même comportement que le simulateur** : pour les 14 exercices, la solution de référence **et les 47 programmes faux** de
  l'atelier donnent dans l'interpréteur C exactement les mêmes changements de LED et de servo, **à la milliseconde**,
  que dans le simulateur de l'atelier (`tests/essais-interpreteur.test.js`). C'est le critère « le même programme
  donne le même comportement en simulateur et sur la carte » (CdC §8), vérifié en temps virtuel.
- Blocs nouveaux du modèle R1, testés : répéter n fois, tant que, répéter jusqu'à, opérations, hasard, listes,
  fonctions avec paramètres et valeur renvoyée, fils « quand le bouton … est appuyé / relâché » qui tournent en même
  temps que la boucle (un appui pendant que le fil tourne est ignoré, comme décidé).
- Dans la Uno émulée, avec le **vrai firmware** : envoi, exécution, **redémarrage seul après une coupure**, « Vider la
  carte », envoi interrompu (la carte reste vide, jamais un programme à moitié écrit), programme abîmé refusé.
- Firmware : 20 Ko de flash sur 32 (mBot : 22 Ko), 1,3 Ko de mémoire vive fixe sur 2 Ko. Limites : 6 fils, 24 variables,
  4 listes (48 nombres en tout), 6 appels de fonction imbriqués, pas d'appel récursif.
- Sécurité : une boucle sans « attendre » ne bloque pas la carte (les autres fils et le port série continuent).

### b. mBot

Le mCore est conçu comme une Uno (même puce ; mBlock l’envoie comme une Uno) : même firmware, même envoi — à confirmer sur le robot. L'extension mBot (n° 1) a 6 commandes :
moteurs gauche/droite (−100 à 100), ultrasons (cm), suiveur de ligne (0 à 3), bouton de la carte, lumière, LED RGB.
**À vérifier sur le robot** : sens des moteurs, ports par défaut (ultrasons port 3, ligne port 2), LED RGB (envoi
bit à bit minuté, jamais testé sur une vraie carte).

### d. Protocole direct v2

Garde le v1 du théâtre d'ombre (`PING`, `D`, `A`, `T`, `OFF`, arrêt après 3 s) et ajoute : `S` servo, `M` mode d'une
broche, `R`/`RA` lecture, `W` surveillance (la carte envoie `E <broche> <niveau>` à chaque changement, anti-rebond
20 ms), `X` extensions, et l'envoi d'un programme (`PROG`, `H`, `FIN`, `RUN`, `STOP`, `EFFACE`). `PONG v2` donne la
version du firmware, la carte et la taille du programme gardé (pour « carte pas à jour » et « carte vide »).
Détail dans l'en-tête de `firmware/labo_blocs/labo_blocs.ino`. Toute commande directe arrête le programme gardé et
éteint tout ; il repart au prochain démarrage.

Défaut trouvé et corrigé grâce à la carte émulée : en « éteignant tout », une broche passait en entrée avec sa
résistance interne encore active, et une LED aurait pu rester faiblement allumée.

### c. micro:bit V1 et V2 — prototype prêt à essayer

**Choix : MicroPython officiel** (celui de l'éditeur Python du micro:bit : V1 1.1.1, V2 2.1.2) + un interpréteur du
code octet écrit en Python (`microbit/main.py`). Un fichier par version, `firmware/labo_blocs_microbit_v1.hex` et
`_v2.hex`, installé **en le glissant sur le lecteur MICROBIT** (aucun outil, marche aussi sous Firefox). Ensuite, c'est
exactement comme la Uno : même code octet, même protocole v2 par le câble USB, même page d'essai. Le programme est gardé
dans un fichier du micro:bit (`prog.lb`), qui survit à la coupure ; il est écrit en entier d'un coup, donc un envoi
interrompu ne laisse jamais un programme à moitié écrit.

- **Même comportement que la Uno** : l'interpréteur Python rejoue les 14 exercices (solutions et 47 programmes faux),
  le Simon, les fils « quand… » et les blocs nouveaux, et donne **exactement** la même sortie que l'interpréteur C,
  avec python3 et avec MicroPython (`tests/essais-microbit.test.js`).
- Extension micro:bit (n° 2) : afficher un nombre, une image (cœur, sourire…), un pixel, effacer, boutons A et B,
  accéléromètre, température, logo tactile (V2), lumière.
- Broches libres : P0, P1, P2, P8, P12 à P16 (les autres servent à l'écran, aux boutons et à l'I2C).

**Risque à vérifier : la mémoire de la V1.** L'interpréteur occupe environ 8 à 9 Ko une fois chargé ; la V1 n'en a
qu'environ 10. La V2 a de la marge (128 Ko). Si la V1 affiche « MemoryError », plan B : un firmware en C avec le même
`vm.c` que la Uno (la chaîne CODAL compile déjà pour la V2 ici ; pour la V1 elle est plus ancienne et demande du travail).

Pistes écartées : CODAL pour la V1 (le portage n'est plus entretenu depuis 2018, il ne compile plus avec les
bibliothèques actuelles).

## À faire par Thomas (environ 30 min par carte)

1. Ouvrir `essais/page-essai/index.html` dans **Chrome ou Edge** (double-clic, depuis le dossier réseau si possible).
2. Uno : installer le firmware, vérifier, envoyer « Clignoter la LED L », fermer le port, débrancher, rebrancher sur
   une autre alimentation → la LED doit clignoter. Puis « Vider la carte », rebrancher → plus rien.
3. Mode direct : LED D13, un bouton entre D2 et GND (surveiller, appuyer), servo, « Arrêter le signe de vie » → tout
   s'éteint en 3 s, « Mesurer l'aller-retour ».
4. Si possible, la maquette du distributeur avec « solution 13B ».
5. mBot : mêmes étapes avec les programmes mBot (robot posé par terre pour « avancer »).
6. Sur **un ou deux autres postes** : au moins « Vérifier la carte » et « Envoyer » (essai e).
7. Copier le compte rendu de chaque essai et me l'envoyer.

**Attention** : le firmware Labo Blocs remplace le programme de la carte. Pour revenir au distributeur actuel, renvoyer son
programme depuis l'atelier ; pour mBlock, mBlock réinstalle son propre firmware (« Mettre à jour le micrologiciel »).

## Premier essai sur une vraie Uno (Thomas, 14/10/2026, 18 h 15)

Carte : clone Uno avec puce USB CH340 (0x1a86:0x7523), Chrome 154 sous Windows.

| Étape | Résultat |
|---|---|
| Installation du firmware depuis le navigateur | ✔ 6,7 s, bootloader à 115200 bauds |
| Vérifier la carte (PING) | ✔ réponse en 5 ms |
| Envoi d'un programme venu de blocs (38 octets) | ✔ 140 ms |
| Programme gardé après passage en direct | ✔ « 38 octets » toujours là |
| Mode direct : LED D13, servo D6 (0°, 90°, 130°, 180°) | ✔ toutes les commandes acceptées |
| Ce qui s'est vu sur la carte (LED qui clignote, servo qui tourne) | à confirmer : cases non cochées |
| Coupure de courant, « Vider la carte », bouton, arrêt au bout de 3 s | pas encore fait |

La page posait mal les questions : les cases à cocher sont restées vides. Elle pose maintenant des questions
« Oui / Non » dans le journal au bon moment, et un bouton guide l'essai de coupure.

## Deuxième essai sur la Uno (Thomas, 14/10/2026, 18 h 40) — Uno validée, sauf le servo

| Étape | Résultat |
|---|---|
| Après l'envoi, le programme tourne | ✔ |
| Après débranchement puis nouvelle alimentation, il repart tout seul | ✔ **le programme survit à la coupure** |
| « Vider la carte » puis nouvelle alimentation : plus rien ne bouge | ✔ |
| Mode direct : LED immédiate, chaque appui du bouton D2 affiché (appuis rapides compris) | ✔ |
| Sans signe de vie, tout s'éteint au bout de 3 s | ✔ |
| Servo D6 | ✘ ne bouge pas |

Servo : dans la Uno émulée, le firmware envoie bien sur D6 les impulsions attendues (90° ≈ 1 470 µs, 0° ≈ 543 µs,
180° ≈ 2 400 µs), avec le signe de vie toutes les secondes. Pistes : branchement (signal orange/jaune sur D6, rouge sur
5V, marron/noir sur GND), alimentation, ou angle inchangé (seul 90° a été envoyé dans cet essai : un servo déjà à 90°
ne bouge pas). Ajout d'un bouton « Balayage 0° → 180° → 90° » dans la page d'essai.

Une fois, juste après l'ouverture du port, une commande est restée sans réponse et la réponse est arrivée à la commande
suivante (la carte redémarre à l'ouverture du port). À corriger dans le module carte du jalon 3 : vider les réponses
en retard et attendre que la carte réponde à PING avant d'envoyer des ordres.

## Troisième essai (Thomas, 14/10/2026, 19 h 10)

- **Uno, servo** : balayage 0° → 180° → 90° fait deux fois, le servo ne bouge pas. Le firmware émet pourtant les bonnes
  impulsions (vérifié dans la Uno émulée). À vérifier : le servo et son branchement avec un programme connu (exemple
  « Sweep » de l'IDE Arduino sur D6, ou le programme du distributeur).
- **micro:bit** (USB 0x0d28:0x0204, version V1/V2 à préciser) : après la copie du `.hex`, **un texte défile** sur l'écran
  (message d'erreur de MicroPython au démarrage) ; ensuite la carte ne répond pas. Texte à relever. Correction faite en
  attendant : la commande d'extension n'utilise plus la suppression de tranche de liste (`del s[a:]`), peut-être absente
  du MicroPython de la V1.
- **Cause trouvée** : le lecteur MICROBIT a créé `FAIL.TXT` : « The hex file cannot be decoded. Checksum calculation
  failure occurred. » Le fichier était juste (toutes les sommes de contrôle vérifiées), mais au format **universel**
  (V1 + V2 dans un fichier), que les V1 à puce USB (DAPLink) ancienne ne savent pas lire. Correction : **un fichier
  par version** (`labo_blocs_microbit_v1.hex`, `_v2.hex`), au format classique ; la page fait choisir la version.
  À retenir pour Labo Blocs : ne pas compter sur le fichier universel avec le parc du collège.

## Quatrième essai : micro:bit V2 (Thomas, 14/10/2026, 19 h 26)

Fichier `labo_blocs_microbit_v2.hex` copié sans erreur : **MicroPython + interpréteur Labo Blocs démarrent sur la V2**
(le fichier universel avait donc été refusé par cette V2 aussi : sa puce USB est ancienne).

| Étape | Résultat |
|---|---|
| Vérifier la carte | ✔ « microbit-v2 », réponse en 8 ms |
| Mode direct : cœur, effacer l'écran | ✔ affiché tout de suite |
| Bouton A, température (25 °C), accéléromètre (900 mg sur x) | ✔ |
| P0 à HAUT / BAS | commandes acceptées, effet non vérifié |
| Surveiller un bouton entre P1 et GND | ✔ le 15/10 (bouton branché) : appuis et relâchements reçus (`E 1 0`, `E 1 1`) |
| Envoi d'un programme, coupure, « Vider la carte » | pas encore fait |
| micro:bit V1 (mémoire) | pas encore essayé |

## Cinquième essai : mBot (Thomas, 15/10/2026, 15 h 47)

Carte mCore (USB 0x1a86:0x7523, puce CH340) :

| Étape | Résultat |
|---|---|
| Installation du firmware mcore depuis le navigateur | ✔ 7,6 s, bootloader à 115200 bauds (comme une Uno) |
| Programme « LED vertes, bouton de la carte = LED rouges + bip » | ✔ tourne : **LED RGB, bouton de la carte et buzzer marchent** |
| Programme « attendre 3 s, avancer 1 s, s'arrêter » | ✔ tourne : **moteurs commandés par un programme venu de blocs** |
| Sans signe de vie, tout s'éteint au bout de 3 s | ✔ |
| Vérifier juste après l'installation | ⚠ « réponse inattendue » (octets parasites au redémarrage) — la page réessaie maintenant jusqu'à 3 fois |
| Mode direct « Avancer 0,7 s » (40 %) | ⚠ seul le moteur gauche tourne — même commande pour les deux moteurs (vérifié dans le mCore émulé : D5 et D6 reçoivent la même PWM) ; le programme à 50 % fait tourner les deux : sans doute un moteur qui ne démarre pas à 40 %. Boutons ajoutés : 50 %, 100 %, chaque moteur seul |
| Ultrasons (port 3) | ✘ toujours la même valeur (laquelle ? 400 = pas d'écho). Bouton ajouté : mesure sur les 4 ports |
| Essai de coupure (15/10, 16 h) | ✔ **le programme repart tout seul** |
| Ultrasons sur les 4 ports | ✘ toujours 400 (aucun écho) — firmware : diagnostic ajouté (mesure sur chaque fil S1/S2 de chaque port, commande `X 1 7 <broche>`) |
| Suiveur de ligne (port 2) | 0 (« noir/noir ») — normal si le robot était roues en l'air, à refaire posé sur une feuille blanche |
| « Vider la carte » | ✔ la carte est bien vidée (« programme gardé : aucun » ensuite) ; la page affichait « échec (OK) » à cause d'octets parasites invisibles collés devant « OK » après un redémarrage — la page les retire maintenant de chaque réponse (à faire aussi dans le module carte du jalon 3) |

## Réponses de Thomas (14/10/2026)

1. **mBot : ports imposés** — les élèves branchent toujours les **ultrasons sur le port 3** et le **suiveur de ligne sur le
   port 2**. Les blocs mBot n'auront donc pas de choix de port (moins de texte, pas d'erreur de branchement possible
   dans le programme) ; la consigne de câblage le rappellera. Le firmware garde le numéro de port dans la commande,
   pour pouvoir changer plus tard sans le réinstaller.
2. **Boutons du distributeur** : poussoirs à 2 fils vers GND — réglage par défaut du compilateur
   (`boutonsVersMasse: true`) confirmé.
