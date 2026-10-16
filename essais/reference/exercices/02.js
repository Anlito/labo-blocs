definirExercice({
  "id": "2",
  "titre": "Faire clignoter une LED",
  "consigne": "Faire clignoter la LED sur la broche D9 toutes les 2 secondes.",
  "composants": [
    { "type": "led", "broche": "D9" }
  ],
  "blocsAutorises": ["led_etat", "attendre"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "La LED clignote", "etapes": [
      { "sequence": "D9", "valeurs": [1, 0], "intervalle": 2, "duree": 10, "changements": 4 }
    ] }
  ],
  "indices": [
    "Allume la LED, attends 2 secondes, éteins-la, attends encore 2 secondes… et ça recommence.",
    "Blocs : deux « contrôler la LED » et deux « attendre », dans « Répéter indéfiniment »."
  ],
  "aSavoir": "2",
  "solutionReference": {
    "demarrage": [],
    "boucle": [
      { "bloc": "led_etat", "broche": "D9", "etat": 1 },
      { "bloc": "attendre", "duree": 2 },
      { "bloc": "led_etat", "broche": "D9", "etat": 0 },
      { "bloc": "attendre", "duree": 2 }
    ]
  }
});
