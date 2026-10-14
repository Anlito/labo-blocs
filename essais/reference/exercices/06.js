definirExercice({
  "id": "6",
  "titre": "Un bouton, deux LED",
  "consigne": "Si on appuie sur le BOUTON qui est sur la broche D3 alors la LED de la broche D9 s'allume et la LED de la broche D10 s'éteint. Sinon la LED D9 s'éteint et la LED D10 s'allume.",
  "composants": [
    { "type": "bouton", "broche": "D3" },
    { "type": "led", "broche": "D9" },
    { "type": "led", "broche": "D10" }
  ],
  "blocsAutorises": ["si_alors", "si_sinon", "bouton_etat", "valeur_haut_bas", "comparaison", "led_etat"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "Deux appuis", "etapes": [
      { "attendre": 0.5 },
      { "maintenir": "D3" },
      { "verifier": { "D9": 1, "D10": 0 } },
      { "attendre": 0.5 },
      { "relacher": "D3" },
      { "verifier": { "D9": 0, "D10": 1 } },
      { "attendre": 0.5 },
      { "maintenir": "D3" },
      { "verifier": { "D9": 1, "D10": 0 } },
      { "attendre": 0.5 },
      { "relacher": "D3" },
      { "verifier": { "D9": 0, "D10": 1 } }
    ] }
  ],
  "indices": [
    "Bouton appuyé : D9 allumée et D10 éteinte. Sinon, c'est l'inverse.",
    "Blocs : « si … alors … sinon », avec deux « contrôler la LED » dans « alors » et deux dans « sinon »."
  ],
  "aSavoir": "6",
  "solutionReference": {
    "demarrage": [],
    "boucle": [
      { "bloc": "si_sinon",
        "condition": { "bloc": "comparaison", "op": "=", "a": { "bloc": "bouton_etat", "broche": "D3" }, "b": { "bloc": "valeur_haut_bas", "valeur": 1 } },
        "alors": [
          { "bloc": "led_etat", "broche": "D9", "etat": 1 },
          { "bloc": "led_etat", "broche": "D10", "etat": 0 }
        ],
        "sinon": [
          { "bloc": "led_etat", "broche": "D9", "etat": 0 },
          { "bloc": "led_etat", "broche": "D10", "etat": 1 }
        ] }
    ]
  }
});
