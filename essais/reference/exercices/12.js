definirExercice({
  "id": "12",
  "titre": "Un bouton commande le moteur",
  "consigne": "Si on appuie sur le bouton qui est sur la broche D5 le moteur va sur l'angle de 90°. Sinon le moteur va sur l'angle 0°. Le moteur est sur la broche D6.",
  "composants": [
    { "type": "bouton", "broche": "D5" },
    { "type": "servo", "broche": "D6" }
  ],
  "blocsAutorises": ["servo_angle", "si_alors", "si_sinon", "bouton_etat", "valeur_haut_bas", "comparaison"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "Deux appuis", "etapes": [
      { "attendre": 0.5 },
      { "maintenir": "D5" },
      { "verifier": { "D6": 90 } },
      { "attendre": 0.5 },
      { "relacher": "D5" },
      { "verifier": { "D6": 0 } },
      { "attendre": 0.5 },
      { "maintenir": "D5" },
      { "verifier": { "D6": 90 } },
      { "attendre": 0.5 },
      { "relacher": "D5" },
      { "verifier": { "D6": 0 } }
    ] }
  ],
  "indices": [
    "Bouton D5 appuyé : moteur à 90°. Sinon : moteur à 0°. Attention, le moteur est sur la broche D6.",
    "Blocs : « si … alors … sinon », la condition « état sur la broche D5 = HAUT », et deux « contrôler l'angle » sur la broche D6."
  ],
  "aSavoir": "12",
  "solutionReference": {
    "demarrage": [],
    "boucle": [
      { "bloc": "si_sinon",
        "condition": { "bloc": "comparaison", "op": "=", "a": { "bloc": "bouton_etat", "broche": "D5" }, "b": { "bloc": "valeur_haut_bas", "valeur": 1 } },
        "alors": [
          { "bloc": "servo_angle", "broche": "D6", "angle": 90 }
        ],
        "sinon": [
          { "bloc": "servo_angle", "broche": "D6", "angle": 0 }
        ] }
    ]
  }
});
