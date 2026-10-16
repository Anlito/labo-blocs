// Parcours « Découverte de la micro:bit », version 1.2.0 (Labo Blocs).
// Ce fichier est écrit par « Mettre à jour les exercices » (outil du professeur) : ne pas le modifier à la main.
definirParcours({
  "format": "labo-blocs/parcours",
  "version": 1,
  "id": "decouverte-microbit",
  "titre": "Découverte de la micro:bit",
  "versionParcours": "1.2.0",
  "date": "2026-10-20",
  "moteurMinimum": "0.3.0",
  "carte": "microbit",
  "modes": [
    "simulateur",
    "direct",
    "carte"
  ],
  "boutonsVersMasse": true,
  "parametres": {},
  "fiches": {},
  "lexique": [],
  "exercices": [
    {
      "id": "mb-01",
      "numero": "1",
      "titre": "Le bouton A allume la LED",
      "defi": false,
      "consigne": "Une LED est branchée sur la broche P0. Tant que le bouton A est appuyé, la LED est allumée et l’écran montre un cœur. Sinon, la LED est éteinte et l’écran est effacé.",
      "composants": [
        {
          "type": "led",
          "broche": "P0"
        }
      ],
      "blocsAutorises": [
        "led_etat",
        "mb_bouton",
        "mb_image",
        "mb_effacer",
        "si_sinon"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Le bouton A",
          "etapes": [
            {
              "verifier": {
                "P0": 0
              }
            },
            {
              "maintenir": "A"
            },
            {
              "verifier": {
                "P0": 1
              }
            },
            {
              "relacher": "A"
            },
            {
              "verifier": {
                "P0": 0
              }
            }
          ]
        }
      ],
      "indices": [
        "La carte regarde sans arrêt le bouton A : appuyé, la LED s’allume ; sinon, elle s’éteint.",
        "Blocs : « si … alors … sinon » avec « le bouton A est appuyé », et deux « contrôler la LED »."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "mb_bouton",
              "bouton": "A"
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "P0",
                "etat": 1
              },
              {
                "bloc": "mb_image",
                "image": "3"
              }
            ],
            "sinon": [
              {
                "bloc": "led_etat",
                "broche": "P0",
                "etat": 0
              },
              {
                "bloc": "mb_effacer"
              }
            ]
          }
        ]
      },
      "competence": "C9"
    },
    {
      "id": "mb-02",
      "numero": "2",
      "titre": "Faire clignoter la LED",
      "defi": false,
      "consigne": "Au démarrage, l’écran fait défiler « Bonjour ». Ensuite, la LED de la broche P0 clignote : allumée 1 seconde, éteinte 1 seconde.",
      "composants": [
        {
          "type": "led",
          "broche": "P0"
        }
      ],
      "blocsAutorises": [
        "led_etat",
        "attendre",
        "mb_texte"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "La LED clignote",
          "etapes": [
            {
              "sequence": "P0",
              "valeurs": [
                1,
                0
              ],
              "intervalle": 1,
              "duree": 8,
              "changements": 6
            }
          ]
        }
      ],
      "indices": [
        "Allume, attends 1 seconde, éteins, attends encore 1 seconde… et ça recommence.",
        "Blocs : « faire défiler le texte » dans « Au démarrage » ; deux « contrôler la LED » et deux « attendre » dans « Répéter indéfiniment »."
      ],
      "solutionReference": {
        "demarrage": [
          {
            "bloc": "mb_texte",
            "texte": "Bonjour"
          }
        ],
        "boucle": [
          {
            "bloc": "led_etat",
            "broche": "P0",
            "etat": 1
          },
          {
            "bloc": "attendre",
            "duree": 1
          },
          {
            "bloc": "led_etat",
            "broche": "P0",
            "etat": 0
          },
          {
            "bloc": "attendre",
            "duree": 1
          }
        ]
      },
      "competence": "C9"
    },
    {
      "id": "mb-03",
      "numero": "3",
      "titre": "Alerte chaleur",
      "defi": false,
      "consigne": "Quand la température dépasse 25 °C, la LED de la broche P0 s’allume. Sinon, elle s’éteint. Le bouton B affiche la température sur l’écran.\nDans le simulateur, règle la température avec le curseur.",
      "composants": [
        {
          "type": "led",
          "broche": "P0"
        }
      ],
      "blocsAutorises": [
        "led_etat",
        "mb_temperature",
        "mb_bouton",
        "mb_nombre",
        "si_sinon",
        "si_alors",
        "comparaison"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Température",
          "etapes": [
            {
              "regler": {
                "temperature": 20
              }
            },
            {
              "verifier": {
                "P0": 0
              }
            },
            {
              "regler": {
                "temperature": 30
              }
            },
            {
              "verifier": {
                "P0": 1
              }
            },
            {
              "regler": {
                "temperature": 22
              }
            },
            {
              "verifier": {
                "P0": 0
              }
            }
          ]
        }
      ],
      "indices": [
        "La carte lit sans arrêt la température : plus de 25, la LED s’allume ; sinon, elle s’éteint.",
        "Blocs : « si … alors … sinon » avec « température (°C) > 25 »."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "comparaison",
              "op": ">",
              "a": {
                "bloc": "mb_temperature"
              },
              "b": {
                "bloc": "nombre",
                "valeur": 25
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "P0",
                "etat": 1
              }
            ],
            "sinon": [
              {
                "bloc": "led_etat",
                "broche": "P0",
                "etat": 0
              }
            ]
          },
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "mb_bouton",
              "bouton": "B"
            },
            "alors": [
              {
                "bloc": "mb_nombre",
                "valeur": {
                  "bloc": "mb_temperature"
                }
              }
            ]
          }
        ]
      },
      "competence": "C6"
    }
  ]
});
