# Programmation du Théâtre d’ombre

Source unique de l’écran Programmer intégré au projet `Anlito/theatre-ombre`.
Les blocs, les niveaux 1/2/3, la traduction JavaScript et Arduino, l’interpréteur
isolé et l’interface des programmes se modifient ici, dans Labo Blocs.

`npm run publier` construit `module/theatre/manifest.json`, le chargeur et une
révision contenant les modules ES. Le Théâtre appelle `module/theatre/charger.js`
au démarrage : aucune copie de ces fichiers n’est embarquée dans son site.
Une publication de Labo Blocs suffit ; recharger le Théâtre récupère la nouvelle
révision. Le manifeste est demandé sans cache et chaque révision a sa propre URL,
ce qui évite de mélanger des imports de plusieurs versions dans une session.

Le projet hôte fournit les personnages entraînés, les sons, la carte, les réglages,
les icônes et le nom des fichiers via `setupProgramScreen`. Le format Blockly des
programmes et les identifiants des blocs sont conservés pour relire les sauvegardes.
Webcam, carnet, fichiers des équipes, suivi professeur et protocole matériel restent
dans le Théâtre. Sans connexion au module central, le chargement affiche Réessayer
avant d’ouvrir une session ou de modifier une sauvegarde.

Les tests fonctionnels du Théâtre chargent aussi le module publié dans un dossier
de test ignoré. Avant publication, utiliser `LABO_THEATRE_SOURCE` pour les relier
à ce dossier source localement, sans copier le module dans le site.
