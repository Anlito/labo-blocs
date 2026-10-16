// Parcours « Découverte du mBot », version 1.1.0 (Labo Blocs).
// Ce fichier est écrit par « Mettre à jour les exercices » (outil du professeur) : ne pas le modifier à la main.
definirParcours({
  "format": "labo-blocs/parcours",
  "version": 1,
  "id": "decouverte-mbot",
  "titre": "Découverte du mBot",
  "versionParcours": "1.1.0",
  "date": "2026-10-16",
  "moteurMinimum": "0.3.0",
  "carte": "mbot",
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
      "id": "mbot-01",
      "numero": "1",
      "titre": "Avancer puis s’arrêter",
      "defi": false,
      "consigne": "Au démarrage, le robot avance à la vitesse 50 % pendant 2 secondes, puis il s’arrête.\nPose le robot par terre avant d’envoyer ton programme dans la carte !",
      "composants": [],
      "blocsAutorises": [
        "mbot_deplacer",
        "mbot_deplacer_pendant",
        "mbot_arreter",
        "attendre"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Le robot avance 2 s puis s’arrête",
          "etapes": [
            {
              "verifier": {
                "moteur gauche": 50,
                "moteur droit": 50
              }
            },
            {
              "attendre": 1.5
            },
            {
              "verifier": {
                "moteur gauche": 0,
                "moteur droit": 0
              },
              "delai": 0.6
            },
            {
              "stable": {
                "moteur gauche": 0,
                "moteur droit": 0
              },
              "duree": 2
            }
          ]
        }
      ],
      "indices": [
        "Le robot avance, on attend 2 secondes, puis on arrête les moteurs. Tout se passe une seule fois.",
        "Blocs : « avancer à la vitesse … pendant … s » dans « Au démarrage »."
      ],
      "solutionReference": {
        "demarrage": [
          {
            "bloc": "mbot_deplacer_pendant",
            "direction": "avancer",
            "vitesse": 50,
            "duree": 2
          }
        ],
        "boucle": []
      }
    },
    {
      "id": "mbot-02",
      "numero": "2",
      "titre": "Le bouton de la carte",
      "defi": false,
      "consigne": "Tant que le bouton de la carte est appuyé, le robot avance à la vitesse 40 % et ses deux LED sont vertes. Sinon, il s’arrête et ses LED s’éteignent.",
      "composants": [],
      "blocsAutorises": [
        "mbot_deplacer",
        "mbot_arreter",
        "mbot_bouton",
        "mbot_led",
        "si_sinon"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Le bouton fait avancer le robot",
          "etapes": [
            {
              "verifier": {
                "moteur gauche": 0,
                "moteur droit": 0
              }
            },
            {
              "maintenir": "bouton"
            },
            {
              "verifier": {
                "moteur gauche": 40,
                "moteur droit": 40
              }
            },
            {
              "relacher": "bouton"
            },
            {
              "verifier": {
                "moteur gauche": 0,
                "moteur droit": 0
              }
            }
          ]
        }
      ],
      "indices": [
        "Le robot regarde sans arrêt le bouton : si il est appuyé il avance, sinon il s’arrête.",
        "Blocs : « si … alors … sinon » dans « Répéter indéfiniment », avec « le bouton de la carte est appuyé »."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "mbot_bouton"
            },
            "alors": [
              {
                "bloc": "mbot_deplacer",
                "direction": "avancer",
                "vitesse": 40
              },
              {
                "bloc": "mbot_led",
                "quelle": "0",
                "couleur": "vert"
              }
            ],
            "sinon": [
              {
                "bloc": "mbot_arreter"
              },
              {
                "bloc": "mbot_led",
                "quelle": "0",
                "couleur": "eteinte"
              }
            ]
          }
        ]
      }
    },
    {
      "id": "mbot-03",
      "numero": "3",
      "titre": "S’arrêter devant un obstacle",
      "defi": false,
      "consigne": "Le robot avance à la vitesse 50 %. Quand un obstacle est à moins de 20 cm devant lui, il s’arrête.\nDans le simulateur, règle la distance avec le curseur « Distance (ultrasons) ».",
      "composants": [],
      "blocsAutorises": [
        "mbot_deplacer",
        "mbot_arreter",
        "mbot_distance",
        "si_sinon",
        "comparaison"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Obstacle",
          "etapes": [
            {
              "regler": {
                "distance": 100
              }
            },
            {
              "verifier": {
                "moteur gauche": 50,
                "moteur droit": 50
              }
            },
            {
              "regler": {
                "distance": 10
              }
            },
            {
              "verifier": {
                "moteur gauche": 0,
                "moteur droit": 0
              }
            },
            {
              "regler": {
                "distance": 60
              }
            },
            {
              "verifier": {
                "moteur gauche": 50,
                "moteur droit": 50
              }
            }
          ]
        }
      ],
      "indices": [
        "Le robot mesure sans arrêt la distance : si elle est plus petite que 20, il s’arrête ; sinon il avance.",
        "Blocs : « si … alors … sinon » avec « distance mesurée par les ultrasons (cm) < 20 »."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "comparaison",
              "op": "<",
              "a": {
                "bloc": "mbot_distance"
              },
              "b": {
                "bloc": "nombre",
                "valeur": 20
              }
            },
            "alors": [
              {
                "bloc": "mbot_arreter"
              }
            ],
            "sinon": [
              {
                "bloc": "mbot_deplacer",
                "direction": "avancer",
                "vitesse": 50
              }
            ]
          }
        ]
      }
    }
  ]
});
