# Plans courts — composants demandés par Escape Lab (brief Escape Lab §11.2)

À valider par Thomas **avant tout code**, un composant à la fois. Aucune broche n'est supposée : chaque bloc garde la
broche par défaut de Labo Blocs (D2) et l'élève choisit la sienne ; le câblage réel vient de la fiche du composant
validée par Thomas (relevé du matériel, `EscapeLab/docs/releve-materiel.md`). Un bloc ne dépend jamais d'un projet :
ces blocs servent à tous les parcours.

Ce que la carte sait déjà faire (vérifié dans `noyau/code-octet.js`) : sortie numérique (`BROCHE.sortie`), entrée
analogique (`BROCHE.analogique`, utilisée par le joystick, A0 à A5), et le type de composant `potentiometre` existe
déjà dans le compilateur. Le micrologiciel de l'Uno n'a **pas** besoin de changer pour les deux premiers composants.

| # | Composant | Travail | Micrologiciel | Difficulté |
|---|---|---|---|---|
| 1 | Potentiomètre | un bloc de valeur + simulateur | inchangé | faible |
| 2 | Relais (électro-aimant 12 V) | un bloc d'action + simulateur + règle de sécurité | inchangé | faible |
| 3 | Clavier à membrane 3×4 (Semageek 473) | balayage de 7 broches + 2 blocs + clavier cliquable | **à modifier** | moyenne |
| 4 | Écran LCD / afficheurs | selon le modèle (liaison I2C ?) | **à modifier** | moyenne à forte |
| 5 | Clavier tactile Grove 12 touches (UART) | liaison série | **à modifier**, conflit possible | forte, à décider |

## 1. Potentiomètre
- **Bloc** (valeur) : « valeur du potentiomètre sur [A0] (0 à 1023) », broches proposées A0 à A5 seulement.
- **Simulateur** : un curseur à côté du composant ; la valeur s'affiche.
- **Compilation** : `entree_analogique` existant (même chemin que le joystick).
- **Exercice libre** : ajouté à `composantsDuProgramme` (sorte `potentiometre`), conflit de broche signalé comme les autres.
- **Question à Thomas** : les potentiomètres du collège ont-ils trois pattes classiques (sans module) ?

## 2. Relais
- **Bloc** (action) : « relais sur [D2] : [activer / désactiver] ». Pas de minuterie cachée : l'élève utilise « attendre ».
- **Simulateur** : un voyant « relais activé / désactivé » et, si le parcours le dit, l'électro-aimant dessiné « tient / lâche ».
- **Compilation** : sortie numérique (comme la LED) ; un composant `relais` distinct pour le dessin et les messages.
- **Sécurité** : le bloc et le simulateur rappellent « la charge 12 V a son alimentation séparée ; le professeur valide
  avant la mise sous tension ». Aucune valeur électrique dans Labo Blocs.
- **Questions à Thomas** : module relais 1 canal ou plusieurs ? Le module s'active-t-il au niveau haut ou bas (inscrit
  sur la carte ou sa fiche) ? Si c'est au niveau bas, une case « s'active au niveau bas » dans le composant.

## 3. Clavier à membrane 3×4
- **Blocs** : « quand une touche du clavier est appuyée » (événement) et « dernière touche du clavier » (valeur : 0 à 9,
  * et #), plus « effacer la dernière touche ». Le code se construit avec les variables et listes existantes.
- **Composant** : 7 broches (4 lignes, 3 colonnes) choisies par l'élève ; l'ordre des fils vient de la fiche validée.
- **Micrologiciel** : un balayage du clavier ajouté au micrologiciel de l'Uno (nouvelle instruction « lire le clavier »),
  et la même chose dans le simulateur et le mode « En direct ».
- **Simulateur** : un clavier de 12 touches cliquable.
- **Questions à Thomas** : l'ordre des 7 fils sur le clavier réel ; combien de broches restent libres pour le reste de
  l'énigme (7 broches, c'est beaucoup sur l'Uno).

## 4. Écran LCD et afficheurs
- Impossible à prévoir sans le modèle : **liaison I2C (4 fils) ou parallèle (12 à 16 fils)**, nombre de lignes et de
  caractères, afficheur 7 segments (et sa puce : TM1637 ?).
- **Proposition** si c'est un LCD 16×2 en I2C : blocs « écrire [texte] à la ligne [1] » et « effacer l'écran » ; dans
  le simulateur, l'écran dessiné ; dans le micrologiciel, le pilote I2C (vérifier la place qui reste dans la mémoire
  de l'Uno).
- **Question à Thomas** : référence exacte et photo de l'étiquette (relevé du matériel).

## 5. Clavier tactile Grove 12 touches (UART)
- La liaison série de l'Uno sert déjà à envoyer le programme et au mode « En direct » : brancher le clavier dessus
  empêcherait ces deux fonctions pendant le jeu. Une liaison série logicielle sur deux autres broches est possible,
  mais elle est délicate et prend de la mémoire.
- **Proposition** : ne pas le faire dans un premier temps ; utiliser le clavier à membrane (3). À revoir si Thomas
  tient à ce modèle.

## Ordre proposé
1 puis 2 (sans changer le micrologiciel, utiles tout de suite), puis 3, puis 4 quand le modèle est connu ; 5 en attente.
Chaque composant : tests `node:test` du noyau, puis recette avec Thomas.
