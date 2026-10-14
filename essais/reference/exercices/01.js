definirExercice({
  "id": "1",
  "titre": "Allumer une LED",
  "consigne": "Allumer la LED sur la broche D9.",
  "composants": [
    { "type": "led", "broche": "D9" }
  ],
  "blocsAutorises": ["led_etat"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "La LED s'allume", "etapes": [
      { "attendre": 1 },
      { "verifier": { "D9": 1 }, "delai": 0 }
    ] }
  ],
  "indices": [
    "Allume la LED D9 une seule fois, au démarrage.",
    "Utilise le bloc « contrôler la LED » avec HAUT et la broche D9, dans « Au démarrage »."
  ],
  "aSavoir": "1",
  "solutionReference": {
    "demarrage": [
      { "bloc": "led_etat", "broche": "D9", "etat": 1 }
    ],
    "boucle": []
  }
});
