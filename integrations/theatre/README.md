# Compatibilité avec l’ancien éditeur du Théâtre

Ce dossier conserve l’ancien écran et les définitions nécessaires à la lecture des
fichiers historiques dans l’outil professeur. Il ne fournit plus le parcours élève.

Le parcours courant est **parcours/theatre-ombre/parcours.js**, modifiable dans
**site/editeur.html**. L’intégration utilise **interface/theatre-parcours.js** et
les écrans communs de Labo Blocs (caméra, éditeur, VM, simulateur et carte).

La page élève du Théâtre charge directement le module commun et le parcours,
et range leurs données dans la rubrique programmation du fichier de l’équipe.
