definirExercice({
  "id": "4",
  "titre": "Un bouton allume la LED",
  "consigne": "Si on appuie sur le BOUTON qui est sur la broche D3 alors la LED de la broche D9 s'allume.",
  "composants": [
    { "type": "bouton", "broche": "D3" },
    { "type": "led", "broche": "D9" }
  ],
  "blocsAutorises": ["si_alors", "bouton_etat", "valeur_haut_bas", "comparaison", "led_etat"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "Bouton relâché, puis appuyé", "etapes": [
      { "attendre": 0.5 },
      { "verifier": { "D9": 0 }, "delai": 0 },
      { "maintenir": "D3" },
      { "verifier": { "D9": 1 } }
    ] }
  ],
  "indices": [
    "Si le bouton D3 est appuyé, alors on allume la LED D9.",
    "Blocs : « si … alors », « = », « état sur la broche D3 » et « HAUT », puis « contrôler la LED » dans « alors »."
  ],
  "aSavoir": "4",
  "solutionReference": {
    "demarrage": [],
    "boucle": [
      { "bloc": "si_alors",
        "condition": { "bloc": "comparaison", "op": "=", "a": { "bloc": "bouton_etat", "broche": "D3" }, "b": { "bloc": "valeur_haut_bas", "valeur": 1 } },
        "alors": [
          { "bloc": "led_etat", "broche": "D9", "etat": 1 }
        ] }
    ]
  }
});
