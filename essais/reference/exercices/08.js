definirExercice({
  "id": "8",
  "titre": "La trappe",
  "consigne": "Si on appuie sur le BOUTON PetiteDose (sur la broche D3) alors la LED de la broche D9 s'allume et la LED de la broche D10 s'éteint. Si on appuie sur le BOUTON GrandeDose (sur la broche D4) alors la LED de la broche D10 s'allume et la LED de la broche D9 s'éteint. Si on appuie sur le BOUTON Trappe (sur la broche D5) alors les LEDs D9 et D10 s'éteignes et la LED Trappe (sur la broche D11) s'allume pendant 5 secondes puis s'éteint.",
  "composants": [
    { "type": "bouton", "nom": "PetiteDose", "broche": "D3" },
    { "type": "bouton", "nom": "GrandeDose", "broche": "D4" },
    { "type": "bouton", "nom": "Trappe", "broche": "D5" },
    { "type": "led", "nom": "PetiteDose", "broche": "D9" },
    { "type": "led", "nom": "GrandeDose", "broche": "D10" },
    { "type": "led", "nom": "Trappe", "broche": "D11" }
  ],
  "distributeur": true,
  "blocsAutorises": ["si_alors", "si_sinon", "bouton_etat", "valeur_haut_bas", "comparaison", "led_etat", "attendre"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "PetiteDose, GrandeDose, puis Trappe", "etapes": [
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
      { "appuyer": "D5" },
      { "verifier": { "D9": 0, "D10": 0, "D11": 1 } },
      { "impulsion": { "D11": 1 }, "duree": 5, "tolerance": 0.5 }
    ] }
  ],
  "indices": [
    "Garde ton programme de l'exercice 7 et ajoute un troisième « si » pour le bouton Trappe : LED Trappe allumée 5 secondes, puis éteinte.",
    "Blocs : un troisième « si … alors » avec la broche D5. Dedans : « contrôler la LED » pour D9, D10 et D11, « attendre 5 seconde(s) », puis D11 à BAS."
  ],
  "aSavoir": "8",
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
        ] },
      { "bloc": "si_alors",
        "condition": { "bloc": "comparaison", "op": "=", "a": { "bloc": "bouton_etat", "broche": "D5" }, "b": { "bloc": "valeur_haut_bas", "valeur": 1 } },
        "alors": [
          { "bloc": "led_etat", "broche": "D9", "etat": 0 },
          { "bloc": "led_etat", "broche": "D10", "etat": 0 },
          { "bloc": "led_etat", "broche": "D11", "etat": 1 },
          { "bloc": "attendre", "duree": 5 },
          { "bloc": "led_etat", "broche": "D11", "etat": 0 }
        ] }
    ]
  }
});
