definirExercice({
  "id": "9",
  "titre": "Le servomoteur",
  "consigne": "Déplacer le moteur d'un angle de 180°. Le moteur est branché sur la broche D6.",
  "composants": [
    { "type": "servo", "broche": "D6" }
  ],
  "blocsAutorises": ["servo_angle"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "Le moteur va à 180°", "etapes": [
      { "attendre": 1 },
      { "verifier": { "D6": 180 }, "delai": 0 },
      { "stable": { "D6": 180 }, "duree": 3 }
    ] }
  ],
  "indices": [
    "Le moteur doit aller à 180°, une seule fois.",
    "Bloc : « contrôler l'angle à 180 ° sur la broche D6 », dans « Au démarrage »."
  ],
  "aSavoir": "9",
  "solutionReference": {
    "demarrage": [
      { "bloc": "servo_angle", "broche": "D6", "angle": 180 }
    ],
    "boucle": []
  }
});
