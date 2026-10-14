definirExercice({
  "id": "13B",
  "titre": "Le distributeur complet (défi)",
  "version": "défi",
  "consigne": "Créer le programme du distributeur de céréales automatique.\nAffectation des éléments :\n- LED PetiteDose : Broche D9\n- LED GrandeDose : Broche D10\n- LED Trappe : Broche D11\n- BOUTON PetiteDose : Broche D3\n- BOUTON GrandeDose : Broche D4\n- BOUTON Trappe : Broche D5\n- servo moteur : Broche D6\nAttention : J'ai ajouté une variable qui se nomme \"CHOIX\" elle permet de lui donner la valeur que l'on veut. Elle est utile pour stocker l'information du choix de la dose (petite ou grande dose) afin de jouer sur le temps où on laisse la trappe ouverte. CHOIX prends la valeur :\n- de 3 si on choisi petite dose\n- de 7 si on choisi la grande dose\n- 0 sinon",
  "composants": [
    { "type": "led", "nom": "PetiteDose", "broche": "D9" },
    { "type": "led", "nom": "GrandeDose", "broche": "D10" },
    { "type": "led", "nom": "Trappe", "broche": "D11" },
    { "type": "bouton", "nom": "PetiteDose", "broche": "D3" },
    { "type": "bouton", "nom": "GrandeDose", "broche": "D4" },
    { "type": "bouton", "nom": "Trappe", "broche": "D5" },
    { "type": "servo", "nom": "Trappe", "broche": "D6" }
  ],
  "distributeur": true,
  "blocsAutorises": ["led_etat", "attendre", "si_alors", "si_sinon", "bouton_etat", "valeur_haut_bas", "comparaison", "servo_angle", "affecter", "variable", "nombre"],
  "blocsDepart": null,
  "scenarios": [
    { "nom": "Petite dose, puis grande dose", "etapes": [
      { "attendre": 0.5 },
      { "verifier": { "D6": 90, "D9": 0, "D10": 0, "D11": 0 }, "delai": 0, "contexte": "au démarrage" },
      { "appuyer": "D3" },
      { "attendre": 0.5 },
      { "appuyer": "D5" },
      { "impulsion": { "D6": 0, "D11": 1 }, "duree": "$dureePetiteDose", "tolerance": 0.5 },
      { "verifier": { "D6": 90, "D11": 0 }, "contexte": "après la distribution" },
      { "attendre": 1 },
      { "appuyer": "D4" },
      { "attendre": 0.5 },
      { "appuyer": "D5" },
      { "impulsion": { "D6": 0, "D11": 1 }, "duree": "$dureeGrandeDose", "tolerance": 0.5 },
      { "verifier": { "D6": 90, "D11": 0 }, "contexte": "après la distribution" }
    ] },
    { "nom": "Trappe sans choix de dose", "etapes": [
      { "attendre": 0.5 },
      { "appuyer": "D5" },
      { "stable": { "D6": 90, "D11": 0 }, "duree": 2,
        "contexte": "quand on appuie sur le bouton Trappe (D5) sans avoir choisi de dose",
        "attendu": "la trappe devrait rester fermée (moteur D6 à 90°, LED Trappe éteinte)" }
    ] },
    { "nom": "Deuxième appui sur Trappe sans nouveau choix", "etapes": [
      { "attendre": 0.5 },
      { "appuyer": "D3" },
      { "attendre": 0.5 },
      { "appuyer": "D5" },
      { "impulsion": { "D6": 0, "D11": 1 }, "duree": "$dureePetiteDose", "tolerance": 0.5 },
      { "attendre": 0.2 },
      { "appuyer": "D5" },
      { "stable": { "D6": 90, "D11": 0 }, "duree": 2,
        "contexte": "quand on appuie une deuxième fois sur le bouton Trappe (D5) sans choisir de nouvelle dose",
        "attendu": "la trappe devrait rester fermée (CHOIX doit revenir à 0 après la distribution)" }
    ] }
  ],
  "indices": [
    "Comme pour 13A, mais la trappe s'ouvre seulement si une dose a été choisie, et CHOIX revient à 0 après.",
    "Blocs : un « si CHOIX ≠ 0 alors » à l'intérieur du « si » du bouton Trappe, et « affecter à CHOIX la valeur 0 » à la fin."
  ],
  "aSavoir": "13",
  "solutionReference": {
    "demarrage": [
      { "bloc": "affecter", "variable": "CHOIX", "valeur": 0 },
      { "bloc": "servo_angle", "broche": "D6", "angle": 90 }
    ],
    "boucle": [
      { "bloc": "si_alors",
        "condition": { "bloc": "comparaison", "op": "=", "a": { "bloc": "bouton_etat", "broche": "D3" }, "b": { "bloc": "valeur_haut_bas", "valeur": 1 } },
        "alors": [
          { "bloc": "led_etat", "broche": "D9", "etat": 1 },
          { "bloc": "led_etat", "broche": "D10", "etat": 0 },
          { "bloc": "affecter", "variable": "CHOIX", "valeur": "$dureePetiteDose" }
        ] },
      { "bloc": "si_alors",
        "condition": { "bloc": "comparaison", "op": "=", "a": { "bloc": "bouton_etat", "broche": "D4" }, "b": { "bloc": "valeur_haut_bas", "valeur": 1 } },
        "alors": [
          { "bloc": "led_etat", "broche": "D9", "etat": 0 },
          { "bloc": "led_etat", "broche": "D10", "etat": 1 },
          { "bloc": "affecter", "variable": "CHOIX", "valeur": "$dureeGrandeDose" }
        ] },
      { "bloc": "si_alors",
        "condition": { "bloc": "comparaison", "op": "=", "a": { "bloc": "bouton_etat", "broche": "D5" }, "b": { "bloc": "valeur_haut_bas", "valeur": 1 } },
        "alors": [
          { "bloc": "si_alors",
            "condition": { "bloc": "comparaison", "op": "≠", "a": { "bloc": "variable", "variable": "CHOIX" }, "b": 0 },
            "alors": [
              { "bloc": "led_etat", "broche": "D9", "etat": 0 },
              { "bloc": "led_etat", "broche": "D10", "etat": 0 },
              { "bloc": "led_etat", "broche": "D11", "etat": 1 },
              { "bloc": "servo_angle", "broche": "D6", "angle": 0 },
              { "bloc": "attendre", "duree": { "bloc": "variable", "variable": "CHOIX" } },
              { "bloc": "led_etat", "broche": "D11", "etat": 0 },
              { "bloc": "servo_angle", "broche": "D6", "angle": 90 },
              { "bloc": "affecter", "variable": "CHOIX", "valeur": 0 }
            ] }
        ] }
    ]
  }
});
