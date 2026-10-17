// Parcours « Découverte de la caméra (IA) », version 1.1.0 (Labo Blocs).
// Ce fichier est écrit par « Mettre à jour les exercices » (outil du professeur) : ne pas le modifier à la main.
definirParcours({
  "format": "labo-blocs/parcours",
  "version": 1,
  "id": "decouverte-camera",
  "titre": "Découverte de la caméra (IA)",
  "versionParcours": "1.1.0",
  "date": "2026-10-17",
  "moteurMinimum": "0.3.0",
  "carte": "uno",
  "modes": [
    "simulateur",
    "direct"
  ],
  "boutonsVersMasse": true,
  "parametres": {},
  "fiches": {},
  "lexique": [],
  "exercices": [
    {
      "id": "cam-01",
      "numero": "1",
      "titre": "Le pouce levé allume la LED",
      "defi": false,
      "consigne": "Apprends d’abord à l’IA à reconnaître ton pouce levé, ta main ouverte, et « Rien » (la caméra sans rien devant) : panneau « Caméra et IA », au moins 10 photos chacun.\nQuand la caméra reconnaît le pouce levé, la LED D3 s’allume. Quand elle ne le reconnaît plus, la LED s’éteint.",
      "composants": [
        {
          "type": "led",
          "broche": "D3"
        }
      ],
      "camera": {
        "etiquettes": [
          "Pouce levé",
          "Main ouverte"
        ]
      },
      "blocsAutorises": [
        "quand_camera",
        "led_etat"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Le pouce levé",
          "etapes": [
            {
              "verifier": {
                "D3": 0
              }
            },
            {
              "regler": {
                "camera": 1
              }
            },
            {
              "verifier": {
                "D3": 1
              }
            },
            {
              "regler": {
                "camera": 0
              }
            },
            {
              "verifier": {
                "D3": 0
              }
            },
            {
              "regler": {
                "camera": 2
              }
            },
            {
              "verifier": {
                "D3": 0
              }
            }
          ]
        }
      ],
      "indices": [
        "Deux événements : quand la caméra reconnaît le pouce levé, et quand elle ne le reconnaît plus.",
        "Blocs : deux « quand la caméra … », chacun avec un « contrôler la LED »."
      ],
      "solutionReference": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": []
          },
          {
            "quand": "boucle",
            "corps": []
          },
          {
            "quand": "camera",
            "etiquette": 1,
            "front": "voit",
            "corps": [
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 1
              }
            ]
          },
          {
            "quand": "camera",
            "etiquette": 1,
            "front": "plus",
            "corps": [
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              }
            ]
          }
        ]
      },
      "competence": "C9"
    },
    {
      "id": "cam-02",
      "numero": "2",
      "titre": "Deux gestes, deux LED",
      "defi": false,
      "consigne": "La LED D3 est allumée tant que la caméra reconnaît le pouce levé. La LED D4 est allumée tant qu’elle reconnaît la main ouverte. Sinon, les deux LED sont éteintes.",
      "composants": [
        {
          "type": "led",
          "broche": "D3"
        },
        {
          "type": "led",
          "broche": "D4"
        }
      ],
      "camera": {
        "etiquettes": [
          "Pouce levé",
          "Main ouverte"
        ]
      },
      "blocsAutorises": [
        "camera_reconnait",
        "si_sinon",
        "led_etat"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Les deux gestes",
          "etapes": [
            {
              "verifier": {
                "D3": 0,
                "D4": 0
              }
            },
            {
              "regler": {
                "camera": 1
              }
            },
            {
              "verifier": {
                "D3": 1,
                "D4": 0
              }
            },
            {
              "regler": {
                "camera": 2
              }
            },
            {
              "verifier": {
                "D3": 0,
                "D4": 1
              }
            },
            {
              "regler": {
                "camera": 0
              }
            },
            {
              "verifier": {
                "D3": 0,
                "D4": 0
              }
            }
          ]
        }
      ],
      "indices": [
        "La carte regarde sans arrêt ce que reconnaît la caméra : pouce levé, main ouverte, ou rien.",
        "Blocs : deux « si … alors … sinon » l’un dans l’autre, avec « la caméra reconnaît … »."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "camera_reconnait",
              "etiquette": "1"
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 1
              },
              {
                "bloc": "led_etat",
                "broche": "D4",
                "etat": 0
              }
            ],
            "sinon": [
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "camera_reconnait",
                  "etiquette": "2"
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 0
                  },
                  {
                    "bloc": "led_etat",
                    "broche": "D4",
                    "etat": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 0
                  },
                  {
                    "bloc": "led_etat",
                    "broche": "D4",
                    "etat": 0
                  }
                ]
              }
            ]
          }
        ]
      },
      "competence": "C9"
    },
    {
      "id": "cam-03",
      "numero": "3",
      "titre": "À toi d’inventer",
      "defi": false,
      "libre": true,
      "consigne": "Crée tes propres étiquettes dans le panneau « Caméra et IA » (par exemple tes personnages ou tes objets), apprends-les à l’IA, puis invente un programme : chaque étiquette reconnue allume une LED ou fait sonner le buzzer.\nQuand ton programme marche, clique sur « J’ai terminé ».",
      "composants": [],
      "camera": {
        "etiquettes": [],
        "etiquettesLibres": true
      },
      "blocsAutorises": [
        "quand_camera",
        "camera_reconnait",
        "camera_certitude",
        "led_etat",
        "son",
        "attendre",
        "si_sinon",
        "si_alors"
      ],
      "blocsDepart": null,
      "scenarios": [],
      "indices": [
        "",
        ""
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": []
      },
      "competence": "C9"
    }
  ]
});
