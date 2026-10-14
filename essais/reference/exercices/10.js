definirExercice({
  "id": "10",
  "titre": "Va-et-vient du moteur",
  "consigne": "Le moteur (sur la broche D6) passe de 0° à 90° et inversement toutes les 2 secondes.",
  "composants": [
    { "type": "servo", "broche": "D6" }
  ],
  "blocsAutorises": ["servo_angle", "attendre"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "Le moteur fait des allers-retours", "etapes": [
      { "sequence": "D6", "valeurs": [0, 90], "intervalle": 2, "duree": 10, "changements": 4 }
    ] }
  ],
  "indices": [
    "Moteur à 0°, attendre 2 secondes, moteur à 90°, attendre 2 secondes… et ça recommence.",
    "Blocs : deux « contrôler l'angle » et deux « attendre », dans « Répéter indéfiniment »."
  ],
  "aSavoir": "10",
  "solutionReference": {
    "demarrage": [],
    "boucle": [
      { "bloc": "servo_angle", "broche": "D6", "angle": 0 },
      { "bloc": "attendre", "duree": 2 },
      { "bloc": "servo_angle", "broche": "D6", "angle": 90 },
      { "bloc": "attendre", "duree": 2 }
    ]
  }
});
