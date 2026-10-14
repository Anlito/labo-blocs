// Réglages communs aux exercices. Le professeur peut les modifier ici.
// Durée d'ouverture de la trappe (en secondes) : valeur de CHOIX pour chaque dose (exercice 13).
// Les captures du programme affectent 10 pour la grande dose, la consigne dit 7 : on suit la consigne.
definirParametres({
  // Jusqu'à cet exercice, le bloc LED rappelle « HAUT (1) : allumée » et « BAS (0) : éteinte ».
  // Après, il affiche seulement « HAUT (1) » et « BAS (0) ». Mettre 0 pour ne jamais l'afficher.
  "aideLedJusquAExercice": 5,
  // Boutons de la maquette (programme envoyé dans la vraie carte) : true = bouton poussoir à 2 fils
  // (signal + GND, comme dans le tutoriel de câblage) ; false = module bouton qui donne HAUT quand on appuie.
  // Après un changement : npm run firmware.
  "boutonsVersMasse": true,
  "dureePetiteDose": 3,
  "dureeGrandeDose": 7
});
