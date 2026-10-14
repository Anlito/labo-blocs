definirExercice({
  "id": "11",
  "titre": "Une séquence d'angles",
  "consigne": "Le moteur (sur la broche D6) doit passer de 0° à 90° puis 180°. Une fois à 180° il doit revenir à 90° puis 0°. Il faut 2s de pause entre chaque état.",
  "composants": [
    { "type": "servo", "broche": "D6" }
  ],
  "blocsAutorises": ["servo_angle", "attendre"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "0°, 90°, 180°, 90°, 0°", "etapes": [
      { "sequence": "D6", "valeurs": [0, 90, 180, 90], "intervalle": 2, "intervalles": { "0": [2, 4] }, "duree": 20, "changements": 8 }
    ] }
  ],
  "indices": [
    "0°, attendre, 90°, attendre, 180°, attendre, 90°, attendre… puis ça recommence à 0°.",
    "Blocs : « contrôler l'angle » et « attendre 2 seconde(s) », quatre fois chacun, l'un après l'autre."
  ],
  "aSavoir": "11",
  "solutionReference": {
    "demarrage": [],
    "boucle": [
      { "bloc": "servo_angle", "broche": "D6", "angle": 0 },
      { "bloc": "attendre", "duree": 2 },
      { "bloc": "servo_angle", "broche": "D6", "angle": 90 },
      { "bloc": "attendre", "duree": 2 },
      { "bloc": "servo_angle", "broche": "D6", "angle": 180 },
      { "bloc": "attendre", "duree": 2 },
      { "bloc": "servo_angle", "broche": "D6", "angle": 90 },
      { "bloc": "attendre", "duree": 2 }
    ]
  }
});
