// Parcours « Distributeur de céréales », version 1.3.0 (Labo Blocs).
// Ce fichier est écrit par « Mettre à jour les exercices » (outil du professeur) : ne pas le modifier à la main.
definirParcours({
  "format": "labo-blocs/parcours",
  "version": 1,
  "id": "distributeur",
  "titre": "Distributeur de céréales",
  "versionParcours": "1.3.0",
  "date": "2026-10-20",
  "moteurMinimum": "0.1.0",
  "carte": "uno",
  "modes": [
    "simulateur",
    "direct",
    "carte"
  ],
  "boutonsVersMasse": true,
  "parametres": {
    "dureePetiteDose": 3,
    "dureeGrandeDose": 7
  },
  "exercices": [
    {
      "id": "dist-01",
      "numero": "1",
      "titre": "Allumer une LED",
      "defi": false,
      "consigne": "Allumer la LED sur la broche D9.",
      "composants": [
        {
          "type": "led",
          "broche": "D9"
        }
      ],
      "blocsAutorises": [
        "led_etat"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "La LED s'allume",
          "etapes": [
            {
              "attendre": 1
            },
            {
              "verifier": {
                "D9": 1
              },
              "delai": 0
            }
          ]
        }
      ],
      "indices": [
        "Allume la LED D9 une seule fois, au démarrage.",
        "Utilise le bloc « contrôler la LED » avec HAUT et la broche D9, dans « Au démarrage »."
      ],
      "aSavoir": "1",
      "solutionReference": {
        "demarrage": [
          {
            "bloc": "led_etat",
            "broche": "D9",
            "etat": 1
          }
        ],
        "boucle": []
      },
      "aideLed": true,
      "competence": "C9"
    },
    {
      "id": "dist-02",
      "numero": "2",
      "titre": "Faire clignoter une LED",
      "defi": false,
      "consigne": "Faire clignoter la LED sur la broche D9 toutes les 2 secondes.",
      "composants": [
        {
          "type": "led",
          "broche": "D9"
        }
      ],
      "blocsAutorises": [
        "led_etat",
        "attendre"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "La LED clignote",
          "etapes": [
            {
              "sequence": "D9",
              "valeurs": [
                1,
                0
              ],
              "intervalle": 2,
              "duree": 10,
              "changements": 4
            }
          ]
        }
      ],
      "indices": [
        "Allume la LED, attends 2 secondes, éteins-la, attends encore 2 secondes… et ça recommence.",
        "Blocs : deux « contrôler la LED » et deux « attendre », dans « Répéter indéfiniment »."
      ],
      "aSavoir": "2",
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "led_etat",
            "broche": "D9",
            "etat": 1
          },
          {
            "bloc": "attendre",
            "duree": 2
          },
          {
            "bloc": "led_etat",
            "broche": "D9",
            "etat": 0
          },
          {
            "bloc": "attendre",
            "duree": 2
          }
        ]
      },
      "aideLed": true,
      "competence": "C9"
    },
    {
      "id": "dist-03",
      "numero": "3",
      "titre": "Deux LED en alternance",
      "defi": false,
      "consigne": "Faire clignoter la LED de la broche D9 et la LED de la broche D10, en alternance, toutes les 2 secondes.",
      "composants": [
        {
          "type": "led",
          "broche": "D9"
        },
        {
          "type": "led",
          "broche": "D10"
        }
      ],
      "blocsAutorises": [
        "led_etat",
        "attendre"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "La LED D9 clignote",
          "etapes": [
            {
              "sequence": "D9",
              "valeurs": [
                1,
                0
              ],
              "intervalle": 2,
              "duree": 10,
              "changements": 4
            }
          ]
        },
        {
          "nom": "Les deux LED font l'inverse",
          "etapes": [
            {
              "opposees": [
                "D9",
                "D10"
              ],
              "duree": 10
            }
          ]
        }
      ],
      "indices": [
        "Quand D9 est allumée, D10 est éteinte. Puis on inverse, toutes les 2 secondes.",
        "Blocs : quatre « contrôler la LED » et deux « attendre », dans « Répéter indéfiniment »."
      ],
      "aSavoir": "3",
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "led_etat",
            "broche": "D9",
            "etat": 1
          },
          {
            "bloc": "led_etat",
            "broche": "D10",
            "etat": 0
          },
          {
            "bloc": "attendre",
            "duree": 2
          },
          {
            "bloc": "led_etat",
            "broche": "D9",
            "etat": 0
          },
          {
            "bloc": "led_etat",
            "broche": "D10",
            "etat": 1
          },
          {
            "bloc": "attendre",
            "duree": 2
          }
        ]
      },
      "aideLed": true,
      "competence": "C9"
    },
    {
      "id": "dist-04",
      "numero": "4",
      "titre": "Un bouton allume la LED",
      "defi": false,
      "consigne": "Si on appuie sur le BOUTON qui est sur la broche D3 alors la LED de la broche D9 s'allume.",
      "composants": [
        {
          "type": "bouton",
          "broche": "D3"
        },
        {
          "type": "led",
          "broche": "D9"
        }
      ],
      "blocsAutorises": [
        "si_alors",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison",
        "led_etat"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Bouton relâché, puis appuyé",
          "etapes": [
            {
              "attendre": 0.5
            },
            {
              "verifier": {
                "D9": 0
              },
              "delai": 0
            },
            {
              "maintenir": "D3"
            },
            {
              "verifier": {
                "D9": 1
              }
            }
          ]
        }
      ],
      "indices": [
        "Si le bouton D3 est appuyé, alors on allume la LED D9.",
        "Blocs : « si … alors », « = », « état sur la broche D3 » et « HAUT », puis « contrôler la LED » dans « alors »."
      ],
      "aSavoir": "4",
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D3"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 1
              }
            ]
          }
        ]
      },
      "aideLed": true,
      "competence": "C6"
    },
    {
      "id": "dist-05",
      "numero": "5",
      "titre": "Allumer, sinon éteindre",
      "defi": false,
      "consigne": "Si on appuie sur le BOUTON qui est sur la broche D3 alors la LED de la broche D9 s'allume sinon elle est éteinte.",
      "composants": [
        {
          "type": "bouton",
          "broche": "D3"
        },
        {
          "type": "led",
          "broche": "D9"
        }
      ],
      "blocsAutorises": [
        "si_alors",
        "si_sinon",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison",
        "led_etat"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Deux appuis",
          "etapes": [
            {
              "attendre": 0.5
            },
            {
              "maintenir": "D3"
            },
            {
              "verifier": {
                "D9": 1
              }
            },
            {
              "attendre": 0.5
            },
            {
              "relacher": "D3"
            },
            {
              "verifier": {
                "D9": 0
              }
            },
            {
              "attendre": 0.5
            },
            {
              "maintenir": "D3"
            },
            {
              "verifier": {
                "D9": 1
              }
            },
            {
              "attendre": 0.5
            },
            {
              "relacher": "D3"
            },
            {
              "verifier": {
                "D9": 0
              }
            }
          ]
        }
      ],
      "indices": [
        "Bouton appuyé : LED allumée. Bouton relâché : LED éteinte.",
        "Blocs : « si … alors … sinon », la condition « état sur la broche D3 = HAUT », et un « contrôler la LED » dans « alors » et un dans « sinon »."
      ],
      "aSavoir": "5",
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D3"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 1
              }
            ],
            "sinon": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              }
            ]
          }
        ]
      },
      "aideLed": true,
      "competence": "C6"
    },
    {
      "id": "dist-06",
      "numero": "6",
      "titre": "Un bouton, deux LED",
      "defi": false,
      "consigne": "Si on appuie sur le BOUTON qui est sur la broche D3 alors la LED de la broche D9 s'allume et la LED de la broche D10 s'éteint. Sinon la LED D9 s'éteint et la LED D10 s'allume.",
      "composants": [
        {
          "type": "bouton",
          "broche": "D3"
        },
        {
          "type": "led",
          "broche": "D9"
        },
        {
          "type": "led",
          "broche": "D10"
        }
      ],
      "blocsAutorises": [
        "si_alors",
        "si_sinon",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison",
        "led_etat"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Deux appuis",
          "etapes": [
            {
              "attendre": 0.5
            },
            {
              "maintenir": "D3"
            },
            {
              "verifier": {
                "D9": 1,
                "D10": 0
              }
            },
            {
              "attendre": 0.5
            },
            {
              "relacher": "D3"
            },
            {
              "verifier": {
                "D9": 0,
                "D10": 1
              }
            },
            {
              "attendre": 0.5
            },
            {
              "maintenir": "D3"
            },
            {
              "verifier": {
                "D9": 1,
                "D10": 0
              }
            },
            {
              "attendre": 0.5
            },
            {
              "relacher": "D3"
            },
            {
              "verifier": {
                "D9": 0,
                "D10": 1
              }
            }
          ]
        }
      ],
      "indices": [
        "Bouton appuyé : D9 allumée et D10 éteinte. Sinon, c'est l'inverse.",
        "Blocs : « si … alors … sinon », avec deux « contrôler la LED » dans « alors » et deux dans « sinon »."
      ],
      "aSavoir": "6",
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D3"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 1
              },
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 0
              }
            ],
            "sinon": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 1
              }
            ]
          }
        ]
      },
      "competence": "C6"
    },
    {
      "id": "dist-07",
      "numero": "7",
      "titre": "Deux boutons, deux doses",
      "defi": false,
      "consigne": "Si on appuie sur le BOUTON PetiteDose (sur la broche D3) alors la LED de la broche D9 s'allume et la LED de la broche D10 s'éteint. Si on appuie sur le BOUTON GrandeDose (sur la broche D4) alors la LED de la broche D10 s'allume et la LED de la broche D9 s'éteint.",
      "composants": [
        {
          "type": "bouton",
          "nom": "PetiteDose",
          "broche": "D3"
        },
        {
          "type": "bouton",
          "nom": "GrandeDose",
          "broche": "D4"
        },
        {
          "type": "led",
          "nom": "PetiteDose",
          "broche": "D9"
        },
        {
          "type": "led",
          "nom": "GrandeDose",
          "broche": "D10"
        }
      ],
      "blocsAutorises": [
        "si_alors",
        "si_sinon",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison",
        "led_etat"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "PetiteDose, GrandeDose, PetiteDose",
          "etapes": [
            {
              "attendre": 0.5
            },
            {
              "maintenir": "D3"
            },
            {
              "verifier": {
                "D9": 1,
                "D10": 0
              }
            },
            {
              "attendre": 0.5
            },
            {
              "relacher": "D3"
            },
            {
              "attendre": 0.5
            },
            {
              "maintenir": "D4"
            },
            {
              "verifier": {
                "D10": 1,
                "D9": 0
              }
            },
            {
              "attendre": 0.5
            },
            {
              "relacher": "D4"
            },
            {
              "attendre": 0.5
            },
            {
              "maintenir": "D3"
            },
            {
              "verifier": {
                "D9": 1,
                "D10": 0
              }
            },
            {
              "attendre": 0.5
            },
            {
              "relacher": "D3"
            }
          ]
        }
      ],
      "indices": [
        "Un « si » pour le bouton PetiteDose, un autre « si » pour le bouton GrandeDose.",
        "Blocs : deux « si … alors » l'un sous l'autre. Dans chacun, deux « contrôler la LED »."
      ],
      "aSavoir": "7",
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D3"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 1
              },
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 0
              }
            ]
          },
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D4"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 1
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              }
            ]
          }
        ]
      },
      "competence": "C6"
    },
    {
      "id": "dist-08",
      "numero": "8",
      "titre": "La trappe",
      "defi": false,
      "consigne": "Si on appuie sur le BOUTON PetiteDose (sur la broche D3) alors la LED de la broche D9 s'allume et la LED de la broche D10 s'éteint. Si on appuie sur le BOUTON GrandeDose (sur la broche D4) alors la LED de la broche D10 s'allume et la LED de la broche D9 s'éteint. Si on appuie sur le BOUTON Trappe (sur la broche D5) alors les LEDs D9 et D10 s'éteignes et la LED Trappe (sur la broche D11) s'allume pendant 5 secondes puis s'éteint.",
      "composants": [
        {
          "type": "bouton",
          "nom": "PetiteDose",
          "broche": "D3"
        },
        {
          "type": "bouton",
          "nom": "GrandeDose",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "Trappe",
          "broche": "D5"
        },
        {
          "type": "led",
          "nom": "PetiteDose",
          "broche": "D9"
        },
        {
          "type": "led",
          "nom": "GrandeDose",
          "broche": "D10"
        },
        {
          "type": "led",
          "nom": "Trappe",
          "broche": "D11"
        }
      ],
      "blocsAutorises": [
        "si_alors",
        "si_sinon",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison",
        "led_etat",
        "attendre"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "PetiteDose, GrandeDose, puis Trappe",
          "etapes": [
            {
              "attendre": 0.5
            },
            {
              "maintenir": "D3"
            },
            {
              "verifier": {
                "D9": 1,
                "D10": 0
              }
            },
            {
              "attendre": 0.5
            },
            {
              "relacher": "D3"
            },
            {
              "attendre": 0.5
            },
            {
              "maintenir": "D4"
            },
            {
              "verifier": {
                "D10": 1,
                "D9": 0
              }
            },
            {
              "attendre": 0.5
            },
            {
              "relacher": "D4"
            },
            {
              "attendre": 0.5
            },
            {
              "appuyer": "D5"
            },
            {
              "verifier": {
                "D9": 0,
                "D10": 0,
                "D11": 1
              }
            },
            {
              "impulsion": {
                "D11": 1
              },
              "duree": 5,
              "tolerance": 0.5
            }
          ]
        }
      ],
      "indices": [
        "Garde ton programme de l'exercice 7 et ajoute un troisième « si » pour le bouton Trappe : LED Trappe allumée 5 secondes, puis éteinte.",
        "Blocs : un troisième « si … alors » avec la broche D5. Dedans : « contrôler la LED » pour D9, D10 et D11, « attendre 5 seconde(s) », puis D11 à BAS."
      ],
      "aSavoir": "8",
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D3"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 1
              },
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 0
              }
            ]
          },
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D4"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 1
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              }
            ]
          },
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D5"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D11",
                "etat": 1
              },
              {
                "bloc": "attendre",
                "duree": 5
              },
              {
                "bloc": "led_etat",
                "broche": "D11",
                "etat": 0
              }
            ]
          }
        ]
      },
      "illustration": "distributeur",
      "competence": "C6"
    },
    {
      "id": "dist-09",
      "numero": "9",
      "titre": "Le servomoteur",
      "defi": false,
      "consigne": "Déplacer le moteur d'un angle de 180°. Le moteur est branché sur la broche D6.",
      "composants": [
        {
          "type": "servo",
          "broche": "D6"
        }
      ],
      "blocsAutorises": [
        "servo_angle"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Le moteur va à 180°",
          "etapes": [
            {
              "attendre": 1
            },
            {
              "verifier": {
                "D6": 180
              },
              "delai": 0
            },
            {
              "stable": {
                "D6": 180
              },
              "duree": 3
            }
          ]
        }
      ],
      "indices": [
        "Le moteur doit aller à 180°, une seule fois.",
        "Bloc : « contrôler l'angle à 180 ° sur la broche D6 », dans « Au démarrage »."
      ],
      "aSavoir": "9",
      "solutionReference": {
        "demarrage": [
          {
            "bloc": "servo_angle",
            "broche": "D6",
            "angle": 180
          }
        ],
        "boucle": []
      },
      "competence": "C9"
    },
    {
      "id": "dist-10",
      "numero": "10",
      "titre": "Va-et-vient du moteur",
      "defi": false,
      "consigne": "Le moteur (sur la broche D6) passe de 0° à 90° et inversement toutes les 2 secondes.",
      "composants": [
        {
          "type": "servo",
          "broche": "D6"
        }
      ],
      "blocsAutorises": [
        "servo_angle",
        "attendre"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Le moteur fait des allers-retours",
          "etapes": [
            {
              "sequence": "D6",
              "valeurs": [
                0,
                90
              ],
              "intervalle": 2,
              "duree": 10,
              "changements": 4
            }
          ]
        }
      ],
      "indices": [
        "Moteur à 0°, attendre 2 secondes, moteur à 90°, attendre 2 secondes… et ça recommence.",
        "Blocs : deux « contrôler l'angle » et deux « attendre », dans « Répéter indéfiniment »."
      ],
      "aSavoir": "10",
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "servo_angle",
            "broche": "D6",
            "angle": 0
          },
          {
            "bloc": "attendre",
            "duree": 2
          },
          {
            "bloc": "servo_angle",
            "broche": "D6",
            "angle": 90
          },
          {
            "bloc": "attendre",
            "duree": 2
          }
        ]
      },
      "competence": "C9"
    },
    {
      "id": "dist-11",
      "numero": "11",
      "titre": "Une séquence d'angles",
      "defi": false,
      "consigne": "Le moteur (sur la broche D6) doit passer de 0° à 90° puis 180°. Une fois à 180° il doit revenir à 90° puis 0°. Il faut 2s de pause entre chaque état.",
      "composants": [
        {
          "type": "servo",
          "broche": "D6"
        }
      ],
      "blocsAutorises": [
        "servo_angle",
        "attendre"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "0°, 90°, 180°, 90°, 0°",
          "etapes": [
            {
              "sequence": "D6",
              "valeurs": [
                0,
                90,
                180,
                90
              ],
              "intervalle": 2,
              "intervalles": {
                "0": [
                  2,
                  4
                ]
              },
              "duree": 20,
              "changements": 8
            }
          ]
        }
      ],
      "indices": [
        "0°, attendre, 90°, attendre, 180°, attendre, 90°, attendre… puis ça recommence à 0°.",
        "Blocs : « contrôler l'angle » et « attendre 2 seconde(s) », quatre fois chacun, l'un après l'autre."
      ],
      "aSavoir": "11",
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "servo_angle",
            "broche": "D6",
            "angle": 0
          },
          {
            "bloc": "attendre",
            "duree": 2
          },
          {
            "bloc": "servo_angle",
            "broche": "D6",
            "angle": 90
          },
          {
            "bloc": "attendre",
            "duree": 2
          },
          {
            "bloc": "servo_angle",
            "broche": "D6",
            "angle": 180
          },
          {
            "bloc": "attendre",
            "duree": 2
          },
          {
            "bloc": "servo_angle",
            "broche": "D6",
            "angle": 90
          },
          {
            "bloc": "attendre",
            "duree": 2
          }
        ]
      },
      "competence": "C9"
    },
    {
      "id": "dist-12",
      "numero": "12",
      "titre": "Un bouton commande le moteur",
      "defi": false,
      "consigne": "Si on appuie sur le bouton qui est sur la broche D5 le moteur va sur l'angle de 90°. Sinon le moteur va sur l'angle 0°. Le moteur est sur la broche D6.",
      "composants": [
        {
          "type": "bouton",
          "broche": "D5"
        },
        {
          "type": "servo",
          "broche": "D6"
        }
      ],
      "blocsAutorises": [
        "servo_angle",
        "si_alors",
        "si_sinon",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Deux appuis",
          "etapes": [
            {
              "attendre": 0.5
            },
            {
              "maintenir": "D5"
            },
            {
              "verifier": {
                "D6": 90
              }
            },
            {
              "attendre": 0.5
            },
            {
              "relacher": "D5"
            },
            {
              "verifier": {
                "D6": 0
              }
            },
            {
              "attendre": 0.5
            },
            {
              "maintenir": "D5"
            },
            {
              "verifier": {
                "D6": 90
              }
            },
            {
              "attendre": 0.5
            },
            {
              "relacher": "D5"
            },
            {
              "verifier": {
                "D6": 0
              }
            }
          ]
        }
      ],
      "indices": [
        "Bouton D5 appuyé : moteur à 90°. Sinon : moteur à 0°. Attention, le moteur est sur la broche D6.",
        "Blocs : « si … alors … sinon », la condition « état sur la broche D5 = HAUT », et deux « contrôler l'angle » sur la broche D6."
      ],
      "aSavoir": "12",
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D5"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "servo_angle",
                "broche": "D6",
                "angle": 90
              }
            ],
            "sinon": [
              {
                "bloc": "servo_angle",
                "broche": "D6",
                "angle": 0
              }
            ]
          }
        ]
      },
      "competence": "C6"
    },
    {
      "id": "dist-13a",
      "numero": "13A",
      "titre": "Le distributeur complet",
      "defi": false,
      "consigne": "Créer le programme du distributeur de céréales automatique.\nAffectation des éléments :\n- LED PetiteDose : Broche D9\n- LED GrandeDose : Broche D10\n- LED Trappe : Broche D11\n- BOUTON PetiteDose : Broche D3\n- BOUTON GrandeDose : Broche D4\n- BOUTON Trappe : Broche D5\n- servo moteur : Broche D6\nAttention : J'ai ajouté une variable qui se nomme \"CHOIX\" elle permet de lui donner la valeur que l'on veut. Elle est utile pour stocker l'information du choix de la dose (petite ou grande dose) afin de jouer sur le temps où on laisse la trappe ouverte. CHOIX prends la valeur :\n- de 3 si on choisi petite dose\n- de 7 si on choisi la grande dose\n- 0 sinon",
      "composants": [
        {
          "type": "led",
          "nom": "PetiteDose",
          "broche": "D9"
        },
        {
          "type": "led",
          "nom": "GrandeDose",
          "broche": "D10"
        },
        {
          "type": "led",
          "nom": "Trappe",
          "broche": "D11"
        },
        {
          "type": "bouton",
          "nom": "PetiteDose",
          "broche": "D3"
        },
        {
          "type": "bouton",
          "nom": "GrandeDose",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "Trappe",
          "broche": "D5"
        },
        {
          "type": "servo",
          "nom": "Trappe",
          "broche": "D6"
        }
      ],
      "blocsAutorises": [
        "led_etat",
        "attendre",
        "si_alors",
        "si_sinon",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison",
        "servo_angle",
        "affecter",
        "variable",
        "nombre"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Petite dose, puis grande dose",
          "etapes": [
            {
              "attendre": 0.5
            },
            {
              "verifier": {
                "D6": 90,
                "D9": 0,
                "D10": 0,
                "D11": 0
              },
              "delai": 0,
              "contexte": "au démarrage"
            },
            {
              "appuyer": "D3"
            },
            {
              "attendre": 0.5
            },
            {
              "appuyer": "D5"
            },
            {
              "impulsion": {
                "D6": 0,
                "D11": 1
              },
              "duree": "$dureePetiteDose",
              "tolerance": 0.5
            },
            {
              "verifier": {
                "D6": 90,
                "D11": 0
              },
              "contexte": "après la distribution"
            },
            {
              "attendre": 1
            },
            {
              "appuyer": "D4"
            },
            {
              "attendre": 0.5
            },
            {
              "appuyer": "D5"
            },
            {
              "impulsion": {
                "D6": 0,
                "D11": 1
              },
              "duree": "$dureeGrandeDose",
              "tolerance": 0.5
            },
            {
              "verifier": {
                "D6": 90,
                "D11": 0
              },
              "contexte": "après la distribution"
            }
          ]
        }
      ],
      "indices": [
        "Les boutons PetiteDose et GrandeDose rangent une durée dans CHOIX. Le bouton Trappe ouvre la trappe pendant CHOIX secondes.",
        "Blocs : « affecter à CHOIX la valeur » (3 ou 7), trois « si … alors », « contrôler l'angle » (0° : ouverte, 90° : fermée) et « attendre » avec CHOIX dedans."
      ],
      "aSavoir": "13",
      "solutionReference": {
        "demarrage": [
          {
            "bloc": "affecter",
            "variable": "CHOIX",
            "valeur": 0
          },
          {
            "bloc": "servo_angle",
            "broche": "D6",
            "angle": 90
          }
        ],
        "boucle": [
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D3"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 1
              },
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 0
              },
              {
                "bloc": "affecter",
                "variable": "CHOIX",
                "valeur": "$dureePetiteDose"
              }
            ]
          },
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D4"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 1
              },
              {
                "bloc": "affecter",
                "variable": "CHOIX",
                "valeur": "$dureeGrandeDose"
              }
            ]
          },
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D5"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D11",
                "etat": 1
              },
              {
                "bloc": "servo_angle",
                "broche": "D6",
                "angle": 0
              },
              {
                "bloc": "attendre",
                "duree": {
                  "bloc": "variable",
                  "variable": "CHOIX"
                }
              },
              {
                "bloc": "led_etat",
                "broche": "D11",
                "etat": 0
              },
              {
                "bloc": "servo_angle",
                "broche": "D6",
                "angle": 90
              }
            ]
          }
        ]
      },
      "illustration": "distributeur",
      "competence": "C9"
    },
    {
      "id": "dist-13b",
      "numero": "13B",
      "titre": "Le distributeur complet (défi)",
      "defi": true,
      "consigne": "Créer le programme du distributeur de céréales automatique.\nAffectation des éléments :\n- LED PetiteDose : Broche D9\n- LED GrandeDose : Broche D10\n- LED Trappe : Broche D11\n- BOUTON PetiteDose : Broche D3\n- BOUTON GrandeDose : Broche D4\n- BOUTON Trappe : Broche D5\n- servo moteur : Broche D6\nAttention : J'ai ajouté une variable qui se nomme \"CHOIX\" elle permet de lui donner la valeur que l'on veut. Elle est utile pour stocker l'information du choix de la dose (petite ou grande dose) afin de jouer sur le temps où on laisse la trappe ouverte. CHOIX prends la valeur :\n- de 3 si on choisi petite dose\n- de 7 si on choisi la grande dose\n- 0 sinon",
      "composants": [
        {
          "type": "led",
          "nom": "PetiteDose",
          "broche": "D9"
        },
        {
          "type": "led",
          "nom": "GrandeDose",
          "broche": "D10"
        },
        {
          "type": "led",
          "nom": "Trappe",
          "broche": "D11"
        },
        {
          "type": "bouton",
          "nom": "PetiteDose",
          "broche": "D3"
        },
        {
          "type": "bouton",
          "nom": "GrandeDose",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "Trappe",
          "broche": "D5"
        },
        {
          "type": "servo",
          "nom": "Trappe",
          "broche": "D6"
        }
      ],
      "blocsAutorises": [
        "led_etat",
        "attendre",
        "si_alors",
        "si_sinon",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison",
        "servo_angle",
        "affecter",
        "variable",
        "nombre"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Petite dose, puis grande dose",
          "etapes": [
            {
              "attendre": 0.5
            },
            {
              "verifier": {
                "D6": 90,
                "D9": 0,
                "D10": 0,
                "D11": 0
              },
              "delai": 0,
              "contexte": "au démarrage"
            },
            {
              "appuyer": "D3"
            },
            {
              "attendre": 0.5
            },
            {
              "appuyer": "D5"
            },
            {
              "impulsion": {
                "D6": 0,
                "D11": 1
              },
              "duree": "$dureePetiteDose",
              "tolerance": 0.5
            },
            {
              "verifier": {
                "D6": 90,
                "D11": 0
              },
              "contexte": "après la distribution"
            },
            {
              "attendre": 1
            },
            {
              "appuyer": "D4"
            },
            {
              "attendre": 0.5
            },
            {
              "appuyer": "D5"
            },
            {
              "impulsion": {
                "D6": 0,
                "D11": 1
              },
              "duree": "$dureeGrandeDose",
              "tolerance": 0.5
            },
            {
              "verifier": {
                "D6": 90,
                "D11": 0
              },
              "contexte": "après la distribution"
            }
          ]
        },
        {
          "nom": "Trappe sans choix de dose",
          "etapes": [
            {
              "attendre": 0.5
            },
            {
              "appuyer": "D5"
            },
            {
              "stable": {
                "D6": 90,
                "D11": 0
              },
              "duree": 2,
              "contexte": "quand on appuie sur le bouton Trappe (D5) sans avoir choisi de dose",
              "attendu": "la trappe devrait rester fermée (moteur D6 à 90°, LED Trappe éteinte)"
            }
          ]
        },
        {
          "nom": "Deuxième appui sur Trappe sans nouveau choix",
          "etapes": [
            {
              "attendre": 0.5
            },
            {
              "appuyer": "D3"
            },
            {
              "attendre": 0.5
            },
            {
              "appuyer": "D5"
            },
            {
              "impulsion": {
                "D6": 0,
                "D11": 1
              },
              "duree": "$dureePetiteDose",
              "tolerance": 0.5
            },
            {
              "attendre": 0.2
            },
            {
              "appuyer": "D5"
            },
            {
              "stable": {
                "D6": 90,
                "D11": 0
              },
              "duree": 2,
              "contexte": "quand on appuie une deuxième fois sur le bouton Trappe (D5) sans choisir de nouvelle dose",
              "attendu": "la trappe devrait rester fermée (CHOIX doit revenir à 0 après la distribution)"
            }
          ]
        }
      ],
      "indices": [
        "Comme pour 13A, mais la trappe s'ouvre seulement si une dose a été choisie, et CHOIX revient à 0 après.",
        "Blocs : un « si CHOIX ≠ 0 alors » à l'intérieur du « si » du bouton Trappe, et « affecter à CHOIX la valeur 0 » à la fin."
      ],
      "aSavoir": "13",
      "solutionReference": {
        "demarrage": [
          {
            "bloc": "affecter",
            "variable": "CHOIX",
            "valeur": 0
          },
          {
            "bloc": "servo_angle",
            "broche": "D6",
            "angle": 90
          }
        ],
        "boucle": [
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D3"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 1
              },
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 0
              },
              {
                "bloc": "affecter",
                "variable": "CHOIX",
                "valeur": "$dureePetiteDose"
              }
            ]
          },
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D4"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D10",
                "etat": 1
              },
              {
                "bloc": "affecter",
                "variable": "CHOIX",
                "valeur": "$dureeGrandeDose"
              }
            ]
          },
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "comparaison",
              "op": "=",
              "a": {
                "bloc": "bouton_etat",
                "broche": "D5"
              },
              "b": {
                "bloc": "valeur_haut_bas",
                "valeur": 1
              }
            },
            "alors": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "CHOIX"
                  },
                  "b": 0
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 0
                  },
                  {
                    "bloc": "led_etat",
                    "broche": "D10",
                    "etat": 0
                  },
                  {
                    "bloc": "led_etat",
                    "broche": "D11",
                    "etat": 1
                  },
                  {
                    "bloc": "servo_angle",
                    "broche": "D6",
                    "angle": 0
                  },
                  {
                    "bloc": "attendre",
                    "duree": {
                      "bloc": "variable",
                      "variable": "CHOIX"
                    }
                  },
                  {
                    "bloc": "led_etat",
                    "broche": "D11",
                    "etat": 0
                  },
                  {
                    "bloc": "servo_angle",
                    "broche": "D6",
                    "angle": 90
                  },
                  {
                    "bloc": "affecter",
                    "variable": "CHOIX",
                    "valeur": 0
                  }
                ]
              }
            ]
          }
        ]
      },
      "illustration": "distributeur",
      "competence": "C9"
    }
  ],
  "fiches": {
    "1": {
      "titre": "La LED et la broche",
      "lignes": [
        "Une LED est une petite lampe branchée sur une broche de la carte.",
        "HAUT (1) : la broche envoie du courant, la LED s'allume.",
        "BAS (0) : plus de courant, la LED s'éteint.",
        "« Au démarrage » s'exécute une seule fois.",
        "« Répéter indéfiniment » recommence sans fin."
      ],
      "schema": {
        "type": "led"
      }
    },
    "2": {
      "titre": "Attendre",
      "lignes": [
        "La carte travaille très vite.",
        "Sans « attendre », la LED change des milliers de fois par seconde : on ne voit rien.",
        "« attendre 2 seconde(s) » garde la LED dans son état pendant 2 secondes.",
        "Pour clignoter : allumer, attendre, éteindre, attendre."
      ],
      "schema": {
        "type": "chronogramme",
        "series": [
          {
            "nom": "LED D9",
            "etats": [
              [
                2,
                "HAUT"
              ],
              [
                2,
                "BAS"
              ],
              [
                2,
                "HAUT"
              ],
              [
                2,
                "BAS"
              ]
            ]
          }
        ]
      }
    },
    "3": {
      "titre": "Alterner",
      "lignes": [
        "Deux LED qui font l'inverse : quand l'une est HAUT, l'autre est BAS.",
        "Les blocs s'exécutent de haut en bas, dans l'ordre.",
        "Deux blocs placés l'un sous l'autre, sans « attendre » entre eux, se font en même temps pour nos yeux."
      ],
      "schema": {
        "type": "chronogramme",
        "series": [
          {
            "nom": "LED D9",
            "etats": [
              [
                2,
                "HAUT"
              ],
              [
                2,
                "BAS"
              ],
              [
                2,
                "HAUT"
              ],
              [
                2,
                "BAS"
              ]
            ]
          },
          {
            "nom": "LED D10",
            "etats": [
              [
                2,
                "BAS"
              ],
              [
                2,
                "HAUT"
              ],
              [
                2,
                "BAS"
              ],
              [
                2,
                "HAUT"
              ]
            ]
          }
        ]
      }
    },
    "4": {
      "titre": "Le bouton et « si… alors »",
      "lignes": [
        "Le bouton est un capteur : il dit à la carte s'il est appuyé.",
        "Pour un bouton, HAUT veut dire « appuyé ».",
        "Une condition est une règle : SI c'est vrai, ALORS on agit.",
        "On construit le bloc en 3 étapes :"
      ],
      "etapes": [
        {
          "texte": "1. Pose le bloc « si … alors ». La case de la condition est vide.",
          "programme": {
            "boucle": [
              {
                "bloc": "si_alors",
                "condition": null,
                "alors": []
              }
            ]
          }
        },
        {
          "texte": "2. Fabrique la condition « état sur la broche D3 = HAUT » et glisse-la dans la case.",
          "programme": {
            "boucle": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "bouton_etat",
                    "broche": "D3"
                  },
                  "b": {
                    "bloc": "valeur_haut_bas",
                    "valeur": 1
                  }
                },
                "alors": []
              }
            ]
          }
        },
        {
          "texte": "3. Mets l'action dans « alors » : elle se fait seulement quand le bouton est appuyé.",
          "programme": {
            "boucle": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "bouton_etat",
                    "broche": "D3"
                  },
                  "b": {
                    "bloc": "valeur_haut_bas",
                    "valeur": 1
                  }
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "5": {
      "titre": "« Sinon »",
      "lignes": [
        "« si … alors … sinon » est une fourche : le programme prend un chemin ou l'autre.",
        "« alors » : ce qui se passe quand la condition est vraie (bouton appuyé).",
        "« sinon » : ce qui se passe quand elle n'est pas vraie (bouton relâché)."
      ],
      "schema": {
        "type": "fourche"
      }
    },
    "6": {
      "titre": "Plusieurs actions",
      "lignes": [
        "On peut empiler plusieurs blocs dans « alors » et dans « sinon ».",
        "Ils s'exécutent de haut en bas, l'un après l'autre.",
        "Exemple : une LED s'allume et l'autre s'éteint."
      ],
      "schema": {
        "type": "blocs",
        "programme": {
          "boucle": [
            {
              "bloc": "si_sinon",
              "condition": {
                "bloc": "comparaison",
                "op": "=",
                "a": {
                  "bloc": "bouton_etat",
                  "broche": "D3"
                },
                "b": {
                  "bloc": "valeur_haut_bas",
                  "valeur": 1
                }
              },
              "alors": [
                {
                  "bloc": "led_etat",
                  "broche": "D9",
                  "etat": 1
                },
                {
                  "bloc": "led_etat",
                  "broche": "D10",
                  "etat": 0
                }
              ],
              "sinon": [
                {
                  "bloc": "led_etat",
                  "broche": "D9",
                  "etat": 0
                },
                {
                  "bloc": "led_etat",
                  "broche": "D10",
                  "etat": 1
                }
              ]
            }
          ]
        }
      }
    },
    "7": {
      "titre": "Deux boutons",
      "lignes": [
        "Deux « si » placés l'un sous l'autre.",
        "À chaque tour de boucle, la carte regarde le premier bouton, puis le deuxième.",
        "Chaque « si » a sa propre condition et ses propres actions."
      ],
      "schema": {
        "type": "blocs",
        "programme": {
          "boucle": [
            {
              "bloc": "si_alors",
              "condition": {
                "bloc": "comparaison",
                "op": "=",
                "a": {
                  "bloc": "bouton_etat",
                  "broche": "D3"
                },
                "b": {
                  "bloc": "valeur_haut_bas",
                  "valeur": 1
                }
              },
              "alors": [
                {
                  "bloc": "led_etat",
                  "broche": "D9",
                  "etat": 1
                }
              ]
            },
            {
              "bloc": "si_alors",
              "condition": {
                "bloc": "comparaison",
                "op": "=",
                "a": {
                  "bloc": "bouton_etat",
                  "broche": "D4"
                },
                "b": {
                  "bloc": "valeur_haut_bas",
                  "valeur": 1
                }
              },
              "alors": [
                {
                  "bloc": "led_etat",
                  "broche": "D10",
                  "etat": 1
                }
              ]
            }
          ]
        }
      }
    },
    "8": {
      "titre": "La trappe",
      "lignes": [
        "La machine a trois boutons : PetiteDose, GrandeDose et Trappe.",
        "Un « attendre » placé dans un « si » : la LED Trappe reste allumée le temps de l'attente.",
        "Pendant l'attente, la carte ne fait rien d'autre."
      ],
      "schema": {
        "type": "chronogramme",
        "series": [
          {
            "nom": "Bouton Trappe",
            "etats": [
              [
                1,
                "BAS"
              ],
              [
                0.4,
                "HAUT"
              ],
              [
                6.6,
                "BAS"
              ]
            ]
          },
          {
            "nom": "LED Trappe",
            "etats": [
              [
                1,
                "BAS"
              ],
              [
                5,
                "HAUT"
              ],
              [
                2,
                "BAS"
              ]
            ]
          }
        ]
      }
    },
    "9": {
      "titre": "Le servo-moteur",
      "lignes": [
        "Un servo-moteur est un moteur qui se place à un angle précis, entre 0° et 180°.",
        "C'est un actionneur : il agit sur le monde réel, comme la LED.",
        "0° : bras à droite. 90° : bras en haut. 180° : bras à gauche."
      ],
      "schema": {
        "type": "servo"
      }
    },
    "10": {
      "titre": "Aller-retour",
      "lignes": [
        "Même idée que le clignotement, avec des angles.",
        "Sans « attendre », le moteur n'a pas le temps de finir son mouvement.",
        "Angle, attendre, autre angle, attendre… et la boucle recommence."
      ],
      "schema": {
        "type": "chronogramme",
        "series": [
          {
            "nom": "Moteur D6",
            "etats": [
              [
                2,
                "0°"
              ],
              [
                2,
                "90°"
              ],
              [
                2,
                "0°"
              ],
              [
                2,
                "90°"
              ]
            ]
          }
        ]
      }
    },
    "11": {
      "titre": "Une séquence",
      "lignes": [
        "Cinq positions dans l'ordre : 0°, 90°, 180°, 90°, 0°.",
        "Entre deux positions : « attendre 2 seconde(s) ».",
        "La boucle recommence ensuite."
      ],
      "schema": {
        "type": "angles",
        "angles": [
          0,
          90,
          180,
          90,
          0
        ]
      }
    },
    "12": {
      "titre": "Bouton et moteur",
      "lignes": [
        "Le capteur (le bouton) décide de ce que fait l'actionneur (le servo-moteur).",
        "C'est le principe de toute la machine.",
        "Attention à la broche du moteur : regarde bien la consigne."
      ],
      "schema": {
        "type": "capteur-actionneur"
      }
    },
    "13": {
      "titre": "La variable",
      "lignes": [
        "Une variable est une boîte avec une étiquette (son nom : CHOIX) qui garde une valeur.",
        "« affecter » met une valeur dans la boîte.",
        "Elle sert à se souvenir de la dose choisie jusqu'à l'appui sur le bouton Trappe.",
        "On peut l'utiliser dans « attendre » : attendre CHOIX secondes.",
        "« ≠ » veut dire « est différent de »."
      ],
      "schema": {
        "type": "variable",
        "nom": "CHOIX",
        "valeur": 3
      }
    },
    "demarrage-boucle": {
      "titre": "« Au démarrage » et « Répéter indéfiniment »",
      "lignes": [
        "« Au démarrage » : les blocs placés dedans s'exécutent une seule fois, quand la carte s'allume.",
        "« Répéter indéfiniment » : les blocs placés dedans s'exécutent de haut en bas, puis tout recommence au début, sans fin.",
        "La carte fait d'abord « Au démarrage », puis « Répéter indéfiniment » pour toujours.",
        "Exemple : pour allumer une LED et la laisser allumée, « Au démarrage » suffit. Pour la faire clignoter, il faut « Répéter indéfiniment »."
      ],
      "schema": {
        "type": "deroulement"
      }
    }
  },
  "lexique": [
    {
      "mot": "Broche",
      "icone": "lumiere",
      "formes": [
        "broche",
        "broches"
      ],
      "definition": "Un petit trou de la carte où l'on branche un composant. Chaque broche a un nom, comme D3."
    },
    {
      "mot": "HAUT (1) et BAS (0)",
      "icone": "info",
      "formes": [
        "HAUT",
        "BAS"
      ],
      "definition": "Pour une LED : HAUT (1) = allumée, BAS (0) = éteinte. Pour un bouton : HAUT (1) = appuyé, BAS (0) = relâché."
    },
    {
      "mot": "LED",
      "icone": "lumiere",
      "formes": [
        "LED",
        "LEDs"
      ],
      "definition": "Une petite lampe : à HAUT (1) elle est allumée, à BAS (0) elle est éteinte. C'est un actionneur."
    },
    {
      "mot": "Bouton poussoir",
      "icone": "bouton",
      "formes": [
        "BOUTON",
        "bouton"
      ],
      "definition": "Un bouton qu'on appuie avec le doigt. C'est un capteur : il dit à la carte s'il est appuyé (HAUT) ou relâché (BAS)."
    },
    {
      "mot": "Capteur",
      "icone": "bouton",
      "formes": [
        "capteur"
      ],
      "definition": "Un composant qui donne une information à la carte, comme un bouton. Le programme lit cette information pour décider."
    },
    {
      "mot": "Actionneur",
      "icone": "moteur",
      "formes": [
        "actionneur"
      ],
      "definition": "Un composant qui agit sur le monde réel, comme une LED ou un moteur. C'est le programme qui le commande."
    },
    {
      "mot": "Servo-moteur",
      "icone": "moteur",
      "formes": [
        "servo moteur",
        "servo-moteur",
        "servomoteur",
        "moteur"
      ],
      "definition": "Un moteur qui se place à un angle précis, entre 0° et 180°. C'est un actionneur."
    },
    {
      "mot": "Angle",
      "icone": "moteur",
      "formes": [
        "angle"
      ],
      "definition": "La position du bras du servo-moteur, en degrés (°). 0° : bras à droite, 90° : bras vers le haut, 180° : bras à gauche."
    },
    {
      "mot": "Carte Arduino",
      "icone": "variables",
      "formes": [
        "carte"
      ],
      "definition": "Un petit ordinateur qui exécute le programme. Les composants sont branchés sur ses broches."
    },
    {
      "mot": "Programme",
      "icone": "crayon",
      "formes": [
        "programme"
      ],
      "definition": "La liste des blocs que la carte exécute, dans l'ordre, de haut en bas. Tu le construis en assemblant des blocs."
    },
    {
      "mot": "Boucle",
      "icone": "recommencer",
      "formes": [
        "boucle"
      ],
      "definition": "Une partie du programme qui recommence sans fin. Ici, c'est le bloc « Répéter indéfiniment »."
    },
    {
      "mot": "Condition (si, alors, sinon)",
      "icone": "decisions",
      "formes": [
        "Si",
        "si",
        "alors",
        "sinon",
        "Sinon"
      ],
      "definition": "Une règle : SI c'est vrai, ALORS on fait quelque chose. SINON, on fait autre chose."
    },
    {
      "mot": "Variable",
      "icone": "variables",
      "formes": [
        "variable"
      ],
      "definition": "Une boîte avec une étiquette, son nom, qui garde une valeur. Ici, la variable s'appelle CHOIX."
    },
    {
      "mot": "Valeur",
      "icone": "variables",
      "formes": [
        "valeur"
      ],
      "definition": "Ce qu'on range dans une variable ou ce qu'on compare, par exemple 3 ou HAUT. Elle peut changer pendant le programme."
    },
    {
      "mot": "Seconde",
      "icone": "temps",
      "formes": [
        "secondes",
        "seconde",
        "2s"
      ],
      "definition": "Une unité de temps : 1 seconde, c'est le temps de dire « un crocodile ». On peut écrire 0.5 pour une demi-seconde."
    },
    {
      "mot": "Simulateur",
      "icone": "info",
      "formes": [
        "simulateur"
      ],
      "definition": "L'écran à droite qui montre ce que fait ton programme, sans vraie carte. Tu peux y appuyer sur les boutons."
    }
  ]
});
