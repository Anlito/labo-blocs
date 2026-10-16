definirExercice({
  "id": "7",
  "titre": "Deux boutons, deux doses",
  "consigne": "Si on appuie sur le BOUTON PetiteDose (sur la broche D3) alors la LED de la broche D9 s'allume et la LED de la broche D10 s'éteint. Si on appuie sur le BOUTON GrandeDose (sur la broche D4) alors la LED de la broche D10 s'allume et la LED de la broche D9 s'éteint.",
  "composants": [
    { "type": "bouton", "nom": "PetiteDose", "broche": "D3" },
    { "type": "bouton", "nom": "GrandeDose", "broche": "D4" },
    { "type": "led", "nom": "PetiteDose", "broche": "D9" },
    { "type": "led", "nom": "GrandeDose", "broche": "D10" }
  ],
  "blocsAutorises": ["si_alors", "si_sinon", "bouton_etat", "valeur_haut_bas", "comparaison", "led_etat"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "PetiteDose, GrandeDose, PetiteDose", "etapes": [
      { "attendre": 0.5 },
      { "maintenir": "D3" },
      { "verifier": { "D9": 1, "D10": 0 } },
      { "attendre": 0.5 },
      { "relacher": "D3" },
      { "attendre": 0.5 },
      { "maintenir": "D4" },
      { "verifier": { "D10": 1, "D9": 0 } },
      { "attendre": 0.5 },
      { "relacher": "D4" },
      { "attendre": 0.5 },
      { "maintenir": "D3" },
      { "verifier": { "D9": 1, "D10": 0 } },
      { "attendre": 0.5 },
      { "relacher": "D3" }
    ] }
  ],
  "indices": [
    "Un « si » pour le bouton PetiteDose, un autre « si » pour le bouton GrandeDose.",
    "Blocs : deux « si … alors » l'un sous l'autre. Dans chacun, deux « contrôler la LED »."
  ],
  "aSavoir": "7",
  "solutionReference": {
    "demarrage": [],
    "boucle": [
      { "bloc": "si_alors",
        "condition": { "bloc": "comparaison", "op": "=", "a": { "bloc": "bouton_etat", "broche": "D3" }, "b": { "bloc": "valeur_haut_bas", "valeur": 1 } },
        "alors": [
          { "bloc": "led_etat", "broche": "D9", "etat": 1 },
          { "bloc": "led_etat", "broche": "D10", "etat": 0 }
        ] },
      { "bloc": "si_alors",
        "condition": { "bloc": "comparaison", "op": "=", "a": { "bloc": "bouton_etat", "broche": "D4" }, "b": { "bloc": "valeur_haut_bas", "valeur": 1 } },
        "alors": [
          { "bloc": "led_etat", "broche": "D10", "etat": 1 },
          { "bloc": "led_etat", "broche": "D9", "etat": 0 }
        ] }
    ]
  }
});
