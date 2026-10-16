definirExercice({
  "id": "3",
  "titre": "Deux LED en alternance",
  "consigne": "Faire clignoter la LED de la broche D9 et la LED de la broche D10, en alternance, toutes les 2 secondes.",
  "composants": [
    { "type": "led", "broche": "D9" },
    { "type": "led", "broche": "D10" }
  ],
  "blocsAutorises": ["led_etat", "attendre"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "La LED D9 clignote", "etapes": [
      { "sequence": "D9", "valeurs": [1, 0], "intervalle": 2, "duree": 10, "changements": 4 }
    ] },
    { "nom": "Les deux LED font l'inverse", "etapes": [
      { "opposees": ["D9", "D10"], "duree": 10 }
    ] }
  ],
  "indices": [
    "Quand D9 est allumée, D10 est éteinte. Puis on inverse, toutes les 2 secondes.",
    "Blocs : quatre « contrôler la LED » et deux « attendre », dans « Répéter indéfiniment »."
  ],
  "aSavoir": "3",
  "solutionReference": {
    "demarrage": [],
    "boucle": [
      { "bloc": "led_etat", "broche": "D9", "etat": 1 },
      { "bloc": "led_etat", "broche": "D10", "etat": 0 },
      { "bloc": "attendre", "duree": 2 },
      { "bloc": "led_etat", "broche": "D9", "etat": 0 },
      { "bloc": "led_etat", "broche": "D10", "etat": 1 },
      { "bloc": "attendre", "duree": 2 }
    ]
  }
});
