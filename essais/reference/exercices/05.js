definirExercice({
  "id": "5",
  "titre": "Allumer, sinon éteindre",
  "consigne": "Si on appuie sur le BOUTON qui est sur la broche D3 alors la LED de la broche D9 s'allume sinon elle est éteinte.",
  "composants": [
    { "type": "bouton", "broche": "D3" },
    { "type": "led", "broche": "D9" }
  ],
  "blocsAutorises": ["si_alors", "si_sinon", "bouton_etat", "valeur_haut_bas", "comparaison", "led_etat"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "Deux appuis", "etapes": [
      { "attendre": 0.5 },
      { "maintenir": "D3" },
      { "verifier": { "D9": 1 } },
      { "attendre": 0.5 },
      { "relacher": "D3" },
      { "verifier": { "D9": 0 } },
      { "attendre": 0.5 },
      { "maintenir": "D3" },
      { "verifier": { "D9": 1 } },
      { "attendre": 0.5 },
      { "relacher": "D3" },
      { "verifier": { "D9": 0 } }
    ] }
  ],
  "indices": [
    "Bouton appuyé : LED allumée. Bouton relâché : LED éteinte.",
    "Blocs : « si … alors … sinon », la condition « état sur la broche D3 = HAUT », et un « contrôler la LED » dans « alors » et un dans « sinon »."
  ],
  "aSavoir": "5",
  "solutionReference": {
    "demarrage": [],
    "boucle": [
      { "bloc": "si_sinon",
        "condition": { "bloc": "comparaison", "op": "=", "a": { "bloc": "bouton_etat", "broche": "D3" }, "b": { "bloc": "valeur_haut_bas", "valeur": 1 } },
        "alors": [
          { "bloc": "led_etat", "broche": "D9", "etat": 1 }
        ],
        "sinon": [
          { "bloc": "led_etat", "broche": "D9", "etat": 0 }
        ] }
    ]
  }
});
