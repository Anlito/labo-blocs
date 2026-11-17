// Parcours « Simon Rétro Game · 5e », version 1.0.1 (Labo Blocs).
// Ce fichier est écrit par « Mettre à jour les exercices » (outil du professeur) : ne pas le modifier à la main.
definirParcours({
  "format": "labo-blocs/parcours",
  "version": 1,
  "id": "simon-5e",
  "titre": "Simon Rétro Game · 5e",
  "versionParcours": "1.0.1",
  "date": "2026-11-17",
  "niveaux": [
    "5"
  ],
  "moteurMinimum": "0.5.0",
  "carte": "uno",
  "modes": [
    "simulateur",
    "carte"
  ],
  "boutonsVersMasse": true,
  "parametres": {},
  "exercices": [
    {
      "numero": "1",
      "titre": "Allumer la LED bleue",
      "consigne": "Ta console Simon suit le standard de câblage de la classe (fiche « À savoir »).\nAu démarrage, allume la LED bleue. Elle reste allumée.",
      "composants": [
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        }
      ],
      "blocsAutorises": [
        "led_etat"
      ],
      "aideLed": true,
      "scenarios": [
        {
          "nom": "La LED bleue s’allume au démarrage",
          "etapes": [
            {
              "attendre": 0.5
            },
            {
              "verifier": {
                "D3": 1
              },
              "delai": 0,
              "contexte": "au démarrage"
            },
            {
              "stable": {
                "D3": 1
              },
              "duree": 2
            }
          ]
        }
      ],
      "indices": [
        "Un seul bloc suffit. Regarde dans la fiche « À savoir » sur quelle broche est branchée la LED bleue.",
        "Bloc : « contrôler la LED à l’état HAUT », dans « Au démarrage », avec la broche de la LED bleue."
      ],
      "aSavoir": "standard",
      "competence": "C9",
      "id": "simon-01",
      "defi": false,
      "solutionReference": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 1
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": []
          }
        ]
      },
      "blocsDepart": null
    },
    {
      "numero": "2",
      "titre": "Le bouton bleu allume la LED bleue",
      "consigne": "Tant qu’on appuie sur le bouton bleu, la LED bleue est allumée. Quand on le lâche, elle s’éteint.\nLe programme doit surveiller le bouton sans arrêt.",
      "composants": [
        {
          "type": "bouton",
          "nom": "bleu",
          "broche": "D2"
        },
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        }
      ],
      "blocsAutorises": [
        "led_etat",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison",
        "si_alors",
        "si_sinon"
      ],
      "aideLed": true,
      "scenarios": [
        {
          "nom": "Appuyer, puis lâcher le bouton bleu",
          "etapes": [
            {
              "attendre": 0.3
            },
            {
              "verifier": {
                "D3": 0
              }
            },
            {
              "maintenir": "D2"
            },
            {
              "verifier": {
                "D3": 1
              }
            },
            {
              "relacher": "D2"
            },
            {
              "verifier": {
                "D3": 0
              }
            },
            {
              "maintenir": "D2"
            },
            {
              "verifier": {
                "D3": 1
              }
            },
            {
              "relacher": "D2"
            }
          ]
        }
      ],
      "indices": [
        "Le bouton est un capteur, la LED un actionneur. « Si le bouton est appuyé, alors allumer, sinon éteindre », et ça recommence sans fin.",
        "Blocs : « si … alors … sinon » dans « Répéter indéfiniment », avec « état sur la broche » (bouton) et deux « contrôler la LED »."
      ],
      "aSavoir": "chaine",
      "competence": "C9",
      "id": "simon-02",
      "defi": false,
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
            "corps": [
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "bouton_etat",
                    "broche": "D2"
                  },
                  "b": {
                    "bloc": "valeur_haut_bas",
                    "valeur": 1
                  }
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 0
                  }
                ]
              }
            ]
          }
        ]
      },
      "blocsDepart": null
    },
    {
      "numero": "3",
      "titre": "Quatre boutons, quatre LED",
      "consigne": "Chaque bouton allume la LED de sa couleur, tant qu’on appuie dessus.\nRegarde le standard de câblage pour trouver les 8 broches. Tu peux tester avec la console, à droite.",
      "composants": [
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        },
        {
          "type": "led",
          "nom": "verte",
          "couleur": "#23C17A",
          "broche": "D5"
        },
        {
          "type": "led",
          "nom": "jaune",
          "couleur": "#FFCF3F",
          "broche": "D7"
        },
        {
          "type": "led",
          "nom": "rouge",
          "couleur": "#FF5566",
          "broche": "D9"
        },
        {
          "type": "bouton",
          "nom": "bleu",
          "broche": "D2"
        },
        {
          "type": "bouton",
          "nom": "vert",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "jaune",
          "broche": "D6"
        },
        {
          "type": "bouton",
          "nom": "rouge",
          "broche": "D8"
        }
      ],
      "illustration": "simon",
      "blocsAutorises": [
        "led_etat",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison",
        "si_alors",
        "si_sinon"
      ],
      "aideLed": true,
      "scenarios": [
        {
          "nom": "Le bouton bleu",
          "etapes": [
            {
              "attendre": 0.3
            },
            {
              "maintenir": "D2"
            },
            {
              "verifier": {
                "D3": 1,
                "D5": 0,
                "D7": 0,
                "D9": 0
              }
            },
            {
              "relacher": "D2"
            },
            {
              "verifier": {
                "D3": 0,
                "D5": 0,
                "D7": 0,
                "D9": 0
              }
            }
          ]
        },
        {
          "nom": "Le bouton vert",
          "etapes": [
            {
              "attendre": 0.3
            },
            {
              "maintenir": "D4"
            },
            {
              "verifier": {
                "D3": 0,
                "D5": 1,
                "D7": 0,
                "D9": 0
              }
            },
            {
              "relacher": "D4"
            },
            {
              "verifier": {
                "D3": 0,
                "D5": 0,
                "D7": 0,
                "D9": 0
              }
            }
          ]
        },
        {
          "nom": "Le bouton jaune",
          "etapes": [
            {
              "attendre": 0.3
            },
            {
              "maintenir": "D6"
            },
            {
              "verifier": {
                "D3": 0,
                "D5": 0,
                "D7": 1,
                "D9": 0
              }
            },
            {
              "relacher": "D6"
            },
            {
              "verifier": {
                "D3": 0,
                "D5": 0,
                "D7": 0,
                "D9": 0
              }
            }
          ]
        },
        {
          "nom": "Le bouton rouge",
          "etapes": [
            {
              "attendre": 0.3
            },
            {
              "maintenir": "D8"
            },
            {
              "verifier": {
                "D3": 0,
                "D5": 0,
                "D7": 0,
                "D9": 1
              }
            },
            {
              "relacher": "D8"
            },
            {
              "verifier": {
                "D3": 0,
                "D5": 0,
                "D7": 0,
                "D9": 0
              }
            }
          ]
        }
      ],
      "indices": [
        "Fais la même chose qu’à l’exercice 2, une fois pour chaque couleur.",
        "Quatre « si … alors … sinon » l’un sous l’autre dans « Répéter indéfiniment » : bouton D2 → LED D3, D4 → D5, D6 → D7, D8 → D9."
      ],
      "aSavoir": "standard",
      "competence": "C9",
      "id": "simon-03",
      "defi": false,
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
            "corps": [
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "bouton_etat",
                  "broche": "D2"
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 0
                  }
                ]
              },
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "bouton_etat",
                  "broche": "D4"
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 0
                  }
                ]
              },
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "bouton_etat",
                  "broche": "D6"
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 0
                  }
                ]
              },
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "bouton_etat",
                  "broche": "D8"
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
          }
        ]
      },
      "blocsDepart": null
    },
    {
      "numero": "4",
      "titre": "Une note par couleur",
      "consigne": "Un appui sur un bouton allume la LED de sa couleur et joue sa note sur le buzzer (broche D10), pendant 0,3 s, puis la LED s’éteint.\nNotes : bleu 262 Hz (do), vert 330 Hz (mi), jaune 392 Hz (sol), rouge 523 Hz (do aigu).",
      "composants": [
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        },
        {
          "type": "led",
          "nom": "verte",
          "couleur": "#23C17A",
          "broche": "D5"
        },
        {
          "type": "led",
          "nom": "jaune",
          "couleur": "#FFCF3F",
          "broche": "D7"
        },
        {
          "type": "led",
          "nom": "rouge",
          "couleur": "#FF5566",
          "broche": "D9"
        },
        {
          "type": "bouton",
          "nom": "bleu",
          "broche": "D2"
        },
        {
          "type": "bouton",
          "nom": "vert",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "jaune",
          "broche": "D6"
        },
        {
          "type": "bouton",
          "nom": "rouge",
          "broche": "D8"
        },
        {
          "type": "buzzer",
          "broche": "D10"
        }
      ],
      "illustration": "simon",
      "blocsAutorises": [
        "led_etat",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison",
        "si_alors",
        "si_sinon",
        "son",
        "attendre",
        "nombre"
      ],
      "scenarios": [
        {
          "nom": "Le bouton bleu joue sa note",
          "etapes": [
            {
              "attendre": 0.3
            },
            {
              "appuyer": "D2"
            },
            {
              "allumage": "D3",
              "delai": 0.5
            },
            {
              "entendre": "D10",
              "frequence": 262,
              "delai": 0.5,
              "contexte": "après un appui sur le bouton bleu (D2)"
            },
            {
              "attendre": 0.5
            },
            {
              "verifier": {
                "D3": 0
              }
            }
          ]
        },
        {
          "nom": "Le bouton vert joue sa note",
          "etapes": [
            {
              "attendre": 0.3
            },
            {
              "appuyer": "D4"
            },
            {
              "allumage": "D5",
              "delai": 0.5
            },
            {
              "entendre": "D10",
              "frequence": 330,
              "delai": 0.5,
              "contexte": "après un appui sur le bouton vert (D4)"
            },
            {
              "attendre": 0.5
            },
            {
              "verifier": {
                "D5": 0
              }
            }
          ]
        },
        {
          "nom": "Le bouton jaune joue sa note",
          "etapes": [
            {
              "attendre": 0.3
            },
            {
              "appuyer": "D6"
            },
            {
              "allumage": "D7",
              "delai": 0.5
            },
            {
              "entendre": "D10",
              "frequence": 392,
              "delai": 0.5,
              "contexte": "après un appui sur le bouton jaune (D6)"
            },
            {
              "attendre": 0.5
            },
            {
              "verifier": {
                "D7": 0
              }
            }
          ]
        },
        {
          "nom": "Le bouton rouge joue sa note",
          "etapes": [
            {
              "attendre": 0.3
            },
            {
              "appuyer": "D8"
            },
            {
              "allumage": "D9",
              "delai": 0.5
            },
            {
              "entendre": "D10",
              "frequence": 523,
              "delai": 0.5,
              "contexte": "après un appui sur le bouton rouge (D8)"
            },
            {
              "attendre": 0.5
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
        "Pour chaque couleur : si le bouton est appuyé, alors allumer la LED, jouer la note, attendre 0,3 s, éteindre la LED.",
        "Bloc « jouer la note … Hz pendant … s sur la broche D10 » (catégorie Son). Le programme n’attend pas la fin de la note : ajoute « attendre 0.3 »."
      ],
      "aSavoir": "son",
      "competence": "C9",
      "id": "simon-04",
      "defi": false,
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
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "bouton_etat",
                  "broche": "D2"
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.3
                  },
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 0
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "bouton_etat",
                  "broche": "D4"
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.3
                  },
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 0
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "bouton_etat",
                  "broche": "D6"
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.3
                  },
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 0
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "bouton_etat",
                  "broche": "D8"
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.3
                  },
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 0
                  }
                ]
              }
            ]
          }
        ]
      },
      "blocsDepart": null
    },
    {
      "numero": "5",
      "titre": "Appeler la fonction « allumer »",
      "consigne": "La fonction « allumer » est déjà écrite (en bas) : on lui donne un numéro de couleur (1 bleu, 2 vert, 3 jaune, 4 rouge), elle allume cette couleur, joue sa note, puis éteint tout.\nDans « Au démarrage », appelle-la 4 fois : avec 1, puis 2, puis 3, puis 4. Les 4 couleurs doivent s’allumer l’une après l’autre.",
      "composants": [
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        },
        {
          "type": "led",
          "nom": "verte",
          "couleur": "#23C17A",
          "broche": "D5"
        },
        {
          "type": "led",
          "nom": "jaune",
          "couleur": "#FFCF3F",
          "broche": "D7"
        },
        {
          "type": "led",
          "nom": "rouge",
          "couleur": "#FF5566",
          "broche": "D9"
        },
        {
          "type": "bouton",
          "nom": "bleu",
          "broche": "D2"
        },
        {
          "type": "bouton",
          "nom": "vert",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "jaune",
          "broche": "D6"
        },
        {
          "type": "bouton",
          "nom": "rouge",
          "broche": "D8"
        },
        {
          "type": "buzzer",
          "broche": "D10"
        }
      ],
      "illustration": "simon",
      "blocsAutorises": [
        "fonction_appeler_param",
        "nombre"
      ],
      "blocsDepart": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [],
            "commentaire": "Ici : 4 blocs « appeler allumer avec … » (1, 2, 3, 4)."
          },
          {
            "quand": "boucle",
            "corps": []
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          }
        ]
      },
      "indices": [
        "Catégorie Fonctions : le bloc « appeler allumer avec … ». Pose-le 4 fois dans « Au démarrage », l’un sous l’autre.",
        "Change le nombre de chaque appel : 1, 2, 3, 4."
      ],
      "scenarios": [
        {
          "nom": "Les 4 couleurs dans l’ordre",
          "etapes": [
            {
              "allumage": "D3",
              "delai": 1,
              "contexte": "au démarrage"
            },
            {
              "entendre": "D10",
              "frequence": 262,
              "delai": 0.3,
              "contexte": "quand la LED bleue s’allume"
            },
            {
              "allumage": "D5",
              "delai": 1.5,
              "contexte": "après la couleur bleue"
            },
            {
              "entendre": "D10",
              "frequence": 330,
              "delai": 0.3,
              "contexte": "quand la LED verte s’allume"
            },
            {
              "allumage": "D7",
              "delai": 1.5,
              "contexte": "après la couleur verte"
            },
            {
              "entendre": "D10",
              "frequence": 392,
              "delai": 0.3,
              "contexte": "quand la LED jaune s’allume"
            },
            {
              "allumage": "D9",
              "delai": 1.5,
              "contexte": "après la couleur jaune"
            },
            {
              "entendre": "D10",
              "frequence": 523,
              "delai": 0.3,
              "contexte": "quand la LED rouge s’allume"
            },
            {
              "attendre": 1
            },
            {
              "stable": {
                "D3": 0,
                "D5": 0,
                "D7": 0,
                "D9": 0
              },
              "duree": 1,
              "contexte": "à la fin",
              "attendu": "les 4 LED devraient être éteintes"
            }
          ]
        }
      ],
      "aSavoir": "fonction",
      "competence": "C9",
      "sansReprise": true,
      "id": "simon-05",
      "defi": false,
      "solutionReference": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  1
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  2
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  3
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  4
                ]
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": []
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          }
        ]
      }
    },
    {
      "numero": "6",
      "titre": "Ma séquence dans une liste",
      "consigne": "Ta séquence est rangée dans la liste « sequence ». Écris-y tes couleurs : au moins 4 (1 bleu, 2 vert, 3 jaune, 4 rouge).\nLa boucle montre chaque couleur de la liste, mais il manque un bloc : « ajouter 1 à i », pour passer à la couleur suivante.",
      "composants": [
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        },
        {
          "type": "led",
          "nom": "verte",
          "couleur": "#23C17A",
          "broche": "D5"
        },
        {
          "type": "led",
          "nom": "jaune",
          "couleur": "#FFCF3F",
          "broche": "D7"
        },
        {
          "type": "led",
          "nom": "rouge",
          "couleur": "#FF5566",
          "broche": "D9"
        },
        {
          "type": "bouton",
          "nom": "bleu",
          "broche": "D2"
        },
        {
          "type": "bouton",
          "nom": "vert",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "jaune",
          "broche": "D6"
        },
        {
          "type": "bouton",
          "nom": "rouge",
          "broche": "D8"
        },
        {
          "type": "buzzer",
          "broche": "D10"
        }
      ],
      "illustration": "simon",
      "listes": [
        "sequence"
      ],
      "variables": [
        "i"
      ],
      "blocsAutorises": [
        "ajouter_a",
        "variable",
        "nombre"
      ],
      "blocsDepart": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  1
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "liste_taille",
                  "liste": "sequence"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ],
                    "commentaire": "Il manque un bloc dessous : « ajouter à i la valeur 1 »."
                  }
                ]
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": []
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          }
        ]
      },
      "indices": [
        "« i » vaut 1, puis 2, puis 3… : c’est le numéro de la couleur montrée. Sans « ajouter 1 à i », on montre toujours la n° 1.",
        "Bloc « ajouter à i la valeur 1 » (catégorie Variables), sous « appeler allumer », dans la boucle."
      ],
      "scenarios": [
        {
          "nom": "La séquence est montrée dans l’ordre",
          "etapes": [
            {
              "liste": "sequence",
              "tailleMin": 4,
              "entre": [
                1,
                4
              ],
              "delai": 0.1,
              "contexte": "au démarrage"
            },
            {
              "allumage": {
                "liste": "sequence",
                "numero": 1
              },
              "leds": [
                "D3",
                "D5",
                "D7",
                "D9"
              ],
              "delai": 1.5,
              "contexte": "au démarrage"
            },
            {
              "allumage": {
                "liste": "sequence",
                "numero": 2
              },
              "leds": [
                "D3",
                "D5",
                "D7",
                "D9"
              ],
              "delai": 1.5,
              "contexte": "après la couleur n° 1"
            },
            {
              "allumage": {
                "liste": "sequence",
                "numero": 3
              },
              "leds": [
                "D3",
                "D5",
                "D7",
                "D9"
              ],
              "delai": 1.5,
              "contexte": "après la couleur n° 2"
            },
            {
              "allumage": {
                "liste": "sequence",
                "numero": 4
              },
              "leds": [
                "D3",
                "D5",
                "D7",
                "D9"
              ],
              "delai": 1.5,
              "contexte": "après la couleur n° 3"
            }
          ]
        }
      ],
      "aSavoir": "liste",
      "competence": "C9",
      "sansReprise": true,
      "id": "simon-06",
      "defi": false,
      "solutionReference": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  1,
                  3,
                  2,
                  4
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "liste_taille",
                  "liste": "sequence"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": []
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          }
        ]
      }
    },
    {
      "numero": "7",
      "titre": "Quel bouton le joueur appuie-t-il ?",
      "consigne": "Après avoir montré la séquence, le programme écoute le joueur. La fonction « lire_bouton » est déjà écrite : elle attend qu’un bouton soit appuyé, range son numéro dans « appui » (1 à 4), puis allume cette couleur.\nDans « Répéter indéfiniment », appelle « lire_bouton » : chaque appui allume la couleur du bouton.",
      "composants": [
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        },
        {
          "type": "led",
          "nom": "verte",
          "couleur": "#23C17A",
          "broche": "D5"
        },
        {
          "type": "led",
          "nom": "jaune",
          "couleur": "#FFCF3F",
          "broche": "D7"
        },
        {
          "type": "led",
          "nom": "rouge",
          "couleur": "#FF5566",
          "broche": "D9"
        },
        {
          "type": "bouton",
          "nom": "bleu",
          "broche": "D2"
        },
        {
          "type": "bouton",
          "nom": "vert",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "jaune",
          "broche": "D6"
        },
        {
          "type": "bouton",
          "nom": "rouge",
          "broche": "D8"
        },
        {
          "type": "buzzer",
          "broche": "D10"
        }
      ],
      "illustration": "simon",
      "listes": [
        "sequence"
      ],
      "variables": [
        "i",
        "appui"
      ],
      "blocsAutorises": [
        "fonction_appeler"
      ],
      "blocsDepart": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  1,
                  3,
                  2,
                  4
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "liste_taille",
                  "liste": "sequence"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [],
            "commentaire": "Ici : « appeler lire_bouton »."
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      },
      "indices": [
        "Catégorie Fonctions : le bloc « appeler lire_bouton ».",
        "Pose-le dans « Répéter indéfiniment » : le programme attend un appui, encore et encore."
      ],
      "scenarios": [
        {
          "nom": "Le joueur appuie sur le jaune puis sur le bleu",
          "etapes": [
            {
              "liste": "sequence",
              "tailleMin": 4,
              "entre": [
                1,
                4
              ],
              "delai": 0.1,
              "contexte": "au démarrage"
            },
            {
              "attendre": 26
            },
            {
              "appuyer": "D6"
            },
            {
              "allumage": "D7",
              "delai": 1
            },
            {
              "entendre": "D10",
              "frequence": 392,
              "delai": 0.3,
              "contexte": "après un appui sur le bouton jaune (D6)"
            },
            {
              "attendre": 1
            },
            {
              "appuyer": "D2"
            },
            {
              "allumage": "D3",
              "delai": 1
            },
            {
              "entendre": "D10",
              "frequence": 262,
              "delai": 0.3,
              "contexte": "après un appui sur le bouton bleu (D2)"
            }
          ]
        }
      ],
      "aSavoir": "fonction",
      "competence": "C9",
      "sansReprise": true,
      "id": "simon-07",
      "defi": false,
      "solutionReference": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  1,
                  3,
                  2,
                  4
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "liste_taille",
                  "liste": "sequence"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [
              {
                "bloc": "appeler",
                "fonction": "lire_bouton",
                "arguments": []
              }
            ]
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      "numero": "8",
      "titre": "Se tromper : son d’erreur",
      "consigne": "Le jeu montre la séquence, puis le joueur la refait. Le programme compare déjà chaque appui à la séquence : s’il y a une différence, « erreur » vaut 1.\nDans le « si erreur = 1 », joue un son d’erreur (une note différente de celles des couleurs, par exemple 110 Hz pendant 1 s), puis attends 1 s.",
      "composants": [
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        },
        {
          "type": "led",
          "nom": "verte",
          "couleur": "#23C17A",
          "broche": "D5"
        },
        {
          "type": "led",
          "nom": "jaune",
          "couleur": "#FFCF3F",
          "broche": "D7"
        },
        {
          "type": "led",
          "nom": "rouge",
          "couleur": "#FF5566",
          "broche": "D9"
        },
        {
          "type": "bouton",
          "nom": "bleu",
          "broche": "D2"
        },
        {
          "type": "bouton",
          "nom": "vert",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "jaune",
          "broche": "D6"
        },
        {
          "type": "bouton",
          "nom": "rouge",
          "broche": "D8"
        },
        {
          "type": "buzzer",
          "broche": "D10"
        }
      ],
      "illustration": "simon",
      "listes": [
        "sequence"
      ],
      "variables": [
        "i",
        "appui",
        "erreur"
      ],
      "blocsAutorises": [
        "son",
        "attendre",
        "nombre"
      ],
      "blocsDepart": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  1,
                  3,
                  2,
                  4
                ]
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "liste_taille",
                  "liste": "sequence"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "affecter",
                "variable": "erreur",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "logique",
                  "op": "ou",
                  "a": {
                    "bloc": "comparaison",
                    "op": ">",
                    "a": {
                      "bloc": "variable",
                      "variable": "i"
                    },
                    "b": {
                      "bloc": "liste_taille",
                      "liste": "sequence"
                    }
                  },
                  "b": {
                    "bloc": "comparaison",
                    "op": "=",
                    "a": {
                      "bloc": "variable",
                      "variable": "erreur"
                    },
                    "b": 1
                  }
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "lire_bouton",
                    "arguments": []
                  },
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "≠",
                      "a": {
                        "bloc": "variable",
                        "variable": "appui"
                      },
                      "b": {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "erreur",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "i",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "variable",
                    "variable": "erreur"
                  },
                  "b": 1
                },
                "alors": [],
                "commentaire": "Ici : le son d’erreur, puis « attendre 1 »."
              },
              {
                "bloc": "attendre",
                "duree": 1
              }
            ]
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      },
      "indices": [
        "Catégorie Son : « jouer la note … Hz pendant … s ». Choisis une note grave, différente des 4 couleurs (110 Hz par exemple).",
        "Dans le « si erreur = 1 » : « jouer la note 110 Hz pendant 1 s », puis « attendre 1 »."
      ],
      "scenarios": [
        {
          "nom": "Le joueur se trompe",
          "etapes": [
            {
              "jouerListe": "sequence",
              "boutons": [
                "D2",
                "D4",
                "D6",
                "D8"
              ],
              "calme": 1.5,
              "tours": "complet",
              "faute": true
            },
            {
              "entendre": "D10",
              "sauf": "couleurs",
              "delai": 3,
              "memeDepart": true,
              "contexte": "Quand le joueur se trompe",
              "attendu": "le buzzer devrait jouer un son d’erreur, différent des notes des couleurs"
            },
            {
              "attendre": 0.6
            },
            {
              "allumage": {
                "liste": "sequence",
                "numero": 1
              },
              "leds": [
                "D3",
                "D5",
                "D7",
                "D9"
              ],
              "delai": 8,
              "contexte": "Après l’erreur",
              "attendu": "le programme devrait recommencer en montrant la première couleur de la séquence"
            }
          ]
        },
        {
          "nom": "Le joueur refait la séquence sans se tromper",
          "etapes": [
            {
              "liste": "sequence",
              "tailleMin": 4,
              "entre": [
                1,
                4
              ],
              "delai": 0.1,
              "contexte": "au démarrage"
            },
            {
              "jouerListe": "sequence",
              "boutons": [
                "D2",
                "D4",
                "D6",
                "D8"
              ],
              "calme": 1.5,
              "tours": "complet"
            },
            {
              "entendre": "D10",
              "sauf": "couleurs",
              "aucune": true,
              "delai": 2,
              "memeDepart": true,
              "contexte": "Quand le joueur refait toute la séquence sans se tromper",
              "attendu": "le buzzer ne devrait pas jouer le son d’erreur"
            },
            {
              "attendre": 0.6
            },
            {
              "allumage": {
                "liste": "sequence",
                "numero": 1
              },
              "leds": [
                "D3",
                "D5",
                "D7",
                "D9"
              ],
              "delai": 6,
              "contexte": "Ensuite",
              "attendu": "le programme devrait recommencer en montrant la première couleur de la séquence"
            }
          ]
        }
      ],
      "aSavoir": "jeu",
      "competence": "C9",
      "sansReprise": true,
      "id": "simon-08",
      "defi": false,
      "solutionReference": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  1,
                  3,
                  2,
                  4
                ]
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "liste_taille",
                  "liste": "sequence"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "affecter",
                "variable": "erreur",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "logique",
                  "op": "ou",
                  "a": {
                    "bloc": "comparaison",
                    "op": ">",
                    "a": {
                      "bloc": "variable",
                      "variable": "i"
                    },
                    "b": {
                      "bloc": "liste_taille",
                      "liste": "sequence"
                    }
                  },
                  "b": {
                    "bloc": "comparaison",
                    "op": "=",
                    "a": {
                      "bloc": "variable",
                      "variable": "erreur"
                    },
                    "b": 1
                  }
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "lire_bouton",
                    "arguments": []
                  },
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "≠",
                      "a": {
                        "bloc": "variable",
                        "variable": "appui"
                      },
                      "b": {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "erreur",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "i",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "variable",
                    "variable": "erreur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 147,
                    "duree": 1
                  },
                  {
                    "bloc": "attendre",
                    "duree": 1
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 1
              }
            ]
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      "numero": "9",
      "titre": "Une couleur de plus à chaque tour",
      "consigne": "Comme le vrai Simon : au tour 1, le jeu montre 1 couleur ; au tour 2, 2 couleurs… La variable « etape » compte les couleurs du tour.\nTout est prêt, sauf un bloc : quand le joueur a réussi le tour, ajoute 1 à « etape », à l’endroit indiqué par le commentaire.",
      "composants": [
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        },
        {
          "type": "led",
          "nom": "verte",
          "couleur": "#23C17A",
          "broche": "D5"
        },
        {
          "type": "led",
          "nom": "jaune",
          "couleur": "#FFCF3F",
          "broche": "D7"
        },
        {
          "type": "led",
          "nom": "rouge",
          "couleur": "#FF5566",
          "broche": "D9"
        },
        {
          "type": "bouton",
          "nom": "bleu",
          "broche": "D2"
        },
        {
          "type": "bouton",
          "nom": "vert",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "jaune",
          "broche": "D6"
        },
        {
          "type": "bouton",
          "nom": "rouge",
          "broche": "D8"
        },
        {
          "type": "buzzer",
          "broche": "D10"
        }
      ],
      "illustration": "simon",
      "listes": [
        "sequence"
      ],
      "variables": [
        "i",
        "appui",
        "erreur",
        "etape"
      ],
      "blocsAutorises": [
        "ajouter_a",
        "variable",
        "nombre"
      ],
      "blocsDepart": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  1,
                  3,
                  2,
                  4
                ]
              },
              {
                "bloc": "affecter",
                "variable": "etape",
                "valeur": 1
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "variable",
                  "variable": "etape"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "affecter",
                "variable": "erreur",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "logique",
                  "op": "ou",
                  "a": {
                    "bloc": "comparaison",
                    "op": ">",
                    "a": {
                      "bloc": "variable",
                      "variable": "i"
                    },
                    "b": {
                      "bloc": "variable",
                      "variable": "etape"
                    }
                  },
                  "b": {
                    "bloc": "comparaison",
                    "op": "=",
                    "a": {
                      "bloc": "variable",
                      "variable": "erreur"
                    },
                    "b": 1
                  }
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "lire_bouton",
                    "arguments": []
                  },
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "≠",
                      "a": {
                        "bloc": "variable",
                        "variable": "appui"
                      },
                      "b": {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "erreur",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "i",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "variable",
                    "variable": "erreur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 147,
                    "duree": 1
                  },
                  {
                    "bloc": "attendre",
                    "duree": 1
                  },
                  {
                    "bloc": "affecter",
                    "variable": "etape",
                    "valeur": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "<",
                      "a": {
                        "bloc": "variable",
                        "variable": "etape"
                      },
                      "b": {
                        "bloc": "liste_taille",
                        "liste": "sequence"
                      }
                    },
                    "alors": [],
                    "sinon": [
                      {
                        "bloc": "affecter",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ],
                    "commentaire": "Tour réussi : ajoute dans « alors » 1 à etape."
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 1
              }
            ]
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      },
      "indices": [
        "« ajouter à etape la valeur 1 » : au prochain tour, le jeu montre une couleur de plus.",
        "Pose « ajouter à etape la valeur 1 » dans le « alors » du « si etape < nombre d’éléments »."
      ],
      "scenarios": [
        {
          "nom": "Après deux tours réussis, le jeu montre 3 couleurs",
          "etapes": [
            {
              "liste": "sequence",
              "tailleMin": 4,
              "entre": [
                1,
                4
              ],
              "delai": 0.1,
              "contexte": "au démarrage"
            },
            {
              "jouerListe": "sequence",
              "boutons": [
                "D2",
                "D4",
                "D6",
                "D8"
              ],
              "calme": 1.5,
              "tours": 2
            },
            {
              "entendre": "D10",
              "notes": 3,
              "exactement": true,
              "delai": 5,
              "contexte": "Après deux tours réussis",
              "attendu": "le jeu devrait montrer 3 couleurs (3 notes), puis attendre le joueur"
            }
          ]
        },
        {
          "nom": "Le joueur se trompe",
          "etapes": [
            {
              "jouerListe": "sequence",
              "boutons": [
                "D2",
                "D4",
                "D6",
                "D8"
              ],
              "calme": 1.5,
              "tours": 2,
              "faute": true
            },
            {
              "entendre": "D10",
              "sauf": "couleurs",
              "delai": 3,
              "memeDepart": true,
              "contexte": "Quand le joueur se trompe",
              "attendu": "le buzzer devrait jouer un son d’erreur, différent des notes des couleurs"
            },
            {
              "attendre": 0.6
            },
            {
              "allumage": {
                "liste": "sequence",
                "numero": 1
              },
              "leds": [
                "D3",
                "D5",
                "D7",
                "D9"
              ],
              "delai": 8,
              "contexte": "Après l’erreur",
              "attendu": "le programme devrait recommencer en montrant la première couleur de la séquence"
            }
          ]
        }
      ],
      "aSavoir": "jeu",
      "competence": "C9",
      "sansReprise": true,
      "id": "simon-09",
      "defi": false,
      "solutionReference": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  1,
                  3,
                  2,
                  4
                ]
              },
              {
                "bloc": "affecter",
                "variable": "etape",
                "valeur": 1
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "variable",
                  "variable": "etape"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "affecter",
                "variable": "erreur",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "logique",
                  "op": "ou",
                  "a": {
                    "bloc": "comparaison",
                    "op": ">",
                    "a": {
                      "bloc": "variable",
                      "variable": "i"
                    },
                    "b": {
                      "bloc": "variable",
                      "variable": "etape"
                    }
                  },
                  "b": {
                    "bloc": "comparaison",
                    "op": "=",
                    "a": {
                      "bloc": "variable",
                      "variable": "erreur"
                    },
                    "b": 1
                  }
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "lire_bouton",
                    "arguments": []
                  },
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "≠",
                      "a": {
                        "bloc": "variable",
                        "variable": "appui"
                      },
                      "b": {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "erreur",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "i",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "variable",
                    "variable": "erreur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 147,
                    "duree": 1
                  },
                  {
                    "bloc": "attendre",
                    "duree": 1
                  },
                  {
                    "bloc": "affecter",
                    "variable": "etape",
                    "valeur": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "<",
                      "a": {
                        "bloc": "variable",
                        "variable": "etape"
                      },
                      "b": {
                        "bloc": "liste_taille",
                        "liste": "sequence"
                      }
                    },
                    "alors": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "affecter",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 1
              }
            ]
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      "numero": "10",
      "titre": "Toute la séquence : victoire !",
      "consigne": "Quand le joueur a refait toute la séquence, joue une petite musique de victoire : au moins 2 notes, avec « attendre » entre elles. Le commentaire montre où la mettre.\nEnsuite, le jeu recommence au tour 1 (c’est déjà fait).",
      "composants": [
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        },
        {
          "type": "led",
          "nom": "verte",
          "couleur": "#23C17A",
          "broche": "D5"
        },
        {
          "type": "led",
          "nom": "jaune",
          "couleur": "#FFCF3F",
          "broche": "D7"
        },
        {
          "type": "led",
          "nom": "rouge",
          "couleur": "#FF5566",
          "broche": "D9"
        },
        {
          "type": "bouton",
          "nom": "bleu",
          "broche": "D2"
        },
        {
          "type": "bouton",
          "nom": "vert",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "jaune",
          "broche": "D6"
        },
        {
          "type": "bouton",
          "nom": "rouge",
          "broche": "D8"
        },
        {
          "type": "buzzer",
          "broche": "D10"
        }
      ],
      "illustration": "simon",
      "listes": [
        "sequence"
      ],
      "variables": [
        "i",
        "appui",
        "erreur",
        "etape"
      ],
      "blocsAutorises": [
        "son",
        "attendre",
        "nombre"
      ],
      "blocsDepart": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  1,
                  3,
                  2,
                  4
                ]
              },
              {
                "bloc": "affecter",
                "variable": "etape",
                "valeur": 1
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "variable",
                  "variable": "etape"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "affecter",
                "variable": "erreur",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "logique",
                  "op": "ou",
                  "a": {
                    "bloc": "comparaison",
                    "op": ">",
                    "a": {
                      "bloc": "variable",
                      "variable": "i"
                    },
                    "b": {
                      "bloc": "variable",
                      "variable": "etape"
                    }
                  },
                  "b": {
                    "bloc": "comparaison",
                    "op": "=",
                    "a": {
                      "bloc": "variable",
                      "variable": "erreur"
                    },
                    "b": 1
                  }
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "lire_bouton",
                    "arguments": []
                  },
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "≠",
                      "a": {
                        "bloc": "variable",
                        "variable": "appui"
                      },
                      "b": {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "erreur",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "i",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "variable",
                    "variable": "erreur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 147,
                    "duree": 1
                  },
                  {
                    "bloc": "attendre",
                    "duree": 1
                  },
                  {
                    "bloc": "affecter",
                    "variable": "etape",
                    "valeur": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "<",
                      "a": {
                        "bloc": "variable",
                        "variable": "etape"
                      },
                      "b": {
                        "bloc": "liste_taille",
                        "liste": "sequence"
                      }
                    },
                    "alors": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "affecter",
                        "variable": "etape",
                        "valeur": 1,
                        "commentaire": "Tout est réussi : ta musique de victoire au-dessus de ce bloc."
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 1
              }
            ]
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      },
      "indices": [
        "La musique se place juste avant « affecter à etape la valeur 1 », là où toute la liste est réussie.",
        "Exemple : do 523 Hz, mi 659 Hz, sol 784 Hz, do 1047 Hz, chacun pendant 0,15 s, avec « attendre 0.15 » entre les notes."
      ],
      "scenarios": [
        {
          "nom": "Le joueur réussit toute la séquence",
          "etapes": [
            {
              "liste": "sequence",
              "tailleMin": 4,
              "entre": [
                1,
                4
              ],
              "delai": 0.1,
              "contexte": "au démarrage"
            },
            {
              "jouerListe": "sequence",
              "boutons": [
                "D2",
                "D4",
                "D6",
                "D8"
              ],
              "calme": 1.5
            },
            {
              "entendre": "D10",
              "notes": 2,
              "delai": 2.5,
              "memeDepart": true,
              "contexte": "Quand le joueur a refait toute la séquence",
              "attendu": "le buzzer devrait jouer une musique de victoire (au moins 2 notes)"
            },
            {
              "attendre": 0.6
            },
            {
              "allumage": {
                "liste": "sequence",
                "numero": 1
              },
              "leds": [
                "D3",
                "D5",
                "D7",
                "D9"
              ],
              "delai": 8,
              "contexte": "Après la victoire",
              "attendu": "le programme devrait recommencer en montrant la première couleur de la séquence"
            }
          ]
        },
        {
          "nom": "Le joueur se trompe",
          "etapes": [
            {
              "jouerListe": "sequence",
              "boutons": [
                "D2",
                "D4",
                "D6",
                "D8"
              ],
              "calme": 1.5,
              "tours": 2,
              "faute": true
            },
            {
              "entendre": "D10",
              "sauf": "couleurs",
              "delai": 3,
              "memeDepart": true,
              "contexte": "Quand le joueur se trompe",
              "attendu": "le buzzer devrait jouer un son d’erreur, différent des notes des couleurs"
            },
            {
              "attendre": 0.6
            },
            {
              "allumage": {
                "liste": "sequence",
                "numero": 1
              },
              "leds": [
                "D3",
                "D5",
                "D7",
                "D9"
              ],
              "delai": 8,
              "contexte": "Après l’erreur",
              "attendu": "le programme devrait recommencer en montrant la première couleur de la séquence"
            }
          ]
        }
      ],
      "aSavoir": "son",
      "competence": "C9",
      "sansReprise": true,
      "id": "simon-10",
      "defi": false,
      "solutionReference": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  1,
                  3,
                  2,
                  4
                ]
              },
              {
                "bloc": "affecter",
                "variable": "etape",
                "valeur": 1
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "variable",
                  "variable": "etape"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "affecter",
                "variable": "erreur",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "logique",
                  "op": "ou",
                  "a": {
                    "bloc": "comparaison",
                    "op": ">",
                    "a": {
                      "bloc": "variable",
                      "variable": "i"
                    },
                    "b": {
                      "bloc": "variable",
                      "variable": "etape"
                    }
                  },
                  "b": {
                    "bloc": "comparaison",
                    "op": "=",
                    "a": {
                      "bloc": "variable",
                      "variable": "erreur"
                    },
                    "b": 1
                  }
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "lire_bouton",
                    "arguments": []
                  },
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "≠",
                      "a": {
                        "bloc": "variable",
                        "variable": "appui"
                      },
                      "b": {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "erreur",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "i",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "variable",
                    "variable": "erreur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 147,
                    "duree": 1
                  },
                  {
                    "bloc": "attendre",
                    "duree": 1
                  },
                  {
                    "bloc": "affecter",
                    "variable": "etape",
                    "valeur": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "<",
                      "a": {
                        "bloc": "variable",
                        "variable": "etape"
                      },
                      "b": {
                        "bloc": "liste_taille",
                        "liste": "sequence"
                      }
                    },
                    "alors": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 523,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 659,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 784,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 1047,
                        "duree": 0.4
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.6
                      },
                      {
                        "bloc": "affecter",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 1
              }
            ]
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      "numero": "11",
      "titre": "Mon Simon",
      "consigne": "Personnalise ton Simon : ta séquence (au moins 6 couleurs), tes notes, ta musique de victoire et ton son d’erreur. Ta séquence est dans « remplir la liste », tes notes dans la fonction « allumer », la musique de victoire et le son d’erreur à la fin de « Répéter indéfiniment ».\nC’est ce programme qui sera envoyé dans la Console Officielle pour le Grand Tournoi. Quand il est réussi, appelle le professeur.",
      "composants": [
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        },
        {
          "type": "led",
          "nom": "verte",
          "couleur": "#23C17A",
          "broche": "D5"
        },
        {
          "type": "led",
          "nom": "jaune",
          "couleur": "#FFCF3F",
          "broche": "D7"
        },
        {
          "type": "led",
          "nom": "rouge",
          "couleur": "#FF5566",
          "broche": "D9"
        },
        {
          "type": "bouton",
          "nom": "bleu",
          "broche": "D2"
        },
        {
          "type": "bouton",
          "nom": "vert",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "jaune",
          "broche": "D6"
        },
        {
          "type": "bouton",
          "nom": "rouge",
          "broche": "D8"
        },
        {
          "type": "buzzer",
          "broche": "D10"
        }
      ],
      "illustration": "simon",
      "listes": [
        "sequence"
      ],
      "variables": [
        "i",
        "appui",
        "erreur",
        "etape"
      ],
      "blocsAutorises": [
        "son",
        "attendre",
        "nombre"
      ],
      "blocsDepart": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  1,
                  3,
                  2,
                  4
                ],
                "commentaire": "Ta séquence : au moins 6 couleurs."
              },
              {
                "bloc": "affecter",
                "variable": "etape",
                "valeur": 1
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "variable",
                  "variable": "etape"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "affecter",
                "variable": "erreur",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "logique",
                  "op": "ou",
                  "a": {
                    "bloc": "comparaison",
                    "op": ">",
                    "a": {
                      "bloc": "variable",
                      "variable": "i"
                    },
                    "b": {
                      "bloc": "variable",
                      "variable": "etape"
                    }
                  },
                  "b": {
                    "bloc": "comparaison",
                    "op": "=",
                    "a": {
                      "bloc": "variable",
                      "variable": "erreur"
                    },
                    "b": 1
                  }
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "lire_bouton",
                    "arguments": []
                  },
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "≠",
                      "a": {
                        "bloc": "variable",
                        "variable": "appui"
                      },
                      "b": {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "erreur",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "i",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "variable",
                    "variable": "erreur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 147,
                    "duree": 1
                  },
                  {
                    "bloc": "attendre",
                    "duree": 1
                  },
                  {
                    "bloc": "affecter",
                    "variable": "etape",
                    "valeur": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "<",
                      "a": {
                        "bloc": "variable",
                        "variable": "etape"
                      },
                      "b": {
                        "bloc": "liste_taille",
                        "liste": "sequence"
                      }
                    },
                    "alors": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 523,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 659,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 784,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 1047,
                        "duree": 0.4
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.6
                      },
                      {
                        "bloc": "affecter",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 1
              }
            ]
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      },
      "indices": [
        "Change les nombres de « remplir la liste », les notes de la fonction « allumer », la musique de victoire et le son d’erreur.",
        "Ta liste doit contenir au moins 6 nombres entre 1 et 4, séparés par des virgules."
      ],
      "scenarios": [
        {
          "nom": "Le joueur réussit toute ma séquence",
          "etapes": [
            {
              "liste": "sequence",
              "tailleMin": 6,
              "entre": [
                1,
                4
              ],
              "delai": 0.1,
              "contexte": "au démarrage"
            },
            {
              "jouerListe": "sequence",
              "boutons": [
                "D2",
                "D4",
                "D6",
                "D8"
              ],
              "calme": 1.5,
              "attente": 30
            },
            {
              "entendre": "D10",
              "notes": 2,
              "delai": 3,
              "memeDepart": true,
              "contexte": "Quand le joueur a refait toute la séquence",
              "attendu": "le buzzer devrait jouer ta musique de victoire (au moins 2 notes)"
            },
            {
              "attendre": 0.6
            },
            {
              "allumage": {
                "liste": "sequence",
                "numero": 1
              },
              "leds": [
                "D3",
                "D5",
                "D7",
                "D9"
              ],
              "delai": 10,
              "contexte": "Après la victoire",
              "attendu": "le programme devrait recommencer en montrant la première couleur de la séquence"
            }
          ]
        },
        {
          "nom": "Le joueur se trompe",
          "etapes": [
            {
              "jouerListe": "sequence",
              "boutons": [
                "D2",
                "D4",
                "D6",
                "D8"
              ],
              "calme": 1.5,
              "tours": 3,
              "faute": true
            },
            {
              "entendre": "D10",
              "sauf": "couleurs",
              "delai": 4,
              "memeDepart": true,
              "contexte": "Quand le joueur se trompe",
              "attendu": "le buzzer devrait jouer un son d’erreur, différent des notes des couleurs"
            },
            {
              "attendre": 0.6
            },
            {
              "allumage": {
                "liste": "sequence",
                "numero": 1
              },
              "leds": [
                "D3",
                "D5",
                "D7",
                "D9"
              ],
              "delai": 8,
              "contexte": "Après l’erreur",
              "attendu": "le programme devrait recommencer en montrant la première couleur de la séquence"
            }
          ]
        }
      ],
      "aSavoir": "jeu",
      "competence": "C9",
      "sansReprise": true,
      "id": "simon-11",
      "defi": false,
      "solutionReference": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  4,
                  2,
                  2,
                  1,
                  3,
                  4,
                  1
                ]
              },
              {
                "bloc": "affecter",
                "variable": "etape",
                "valeur": 1
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "variable",
                  "variable": "etape"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "affecter",
                "variable": "erreur",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "logique",
                  "op": "ou",
                  "a": {
                    "bloc": "comparaison",
                    "op": ">",
                    "a": {
                      "bloc": "variable",
                      "variable": "i"
                    },
                    "b": {
                      "bloc": "variable",
                      "variable": "etape"
                    }
                  },
                  "b": {
                    "bloc": "comparaison",
                    "op": "=",
                    "a": {
                      "bloc": "variable",
                      "variable": "erreur"
                    },
                    "b": 1
                  }
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "lire_bouton",
                    "arguments": []
                  },
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "≠",
                      "a": {
                        "bloc": "variable",
                        "variable": "appui"
                      },
                      "b": {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "erreur",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "i",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "variable",
                    "variable": "erreur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 147,
                    "duree": 1
                  },
                  {
                    "bloc": "attendre",
                    "duree": 1
                  },
                  {
                    "bloc": "affecter",
                    "variable": "etape",
                    "valeur": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "<",
                      "a": {
                        "bloc": "variable",
                        "variable": "etape"
                      },
                      "b": {
                        "bloc": "liste_taille",
                        "liste": "sequence"
                      }
                    },
                    "alors": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 523,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 659,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 784,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 1047,
                        "duree": 0.4
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.6
                      },
                      {
                        "bloc": "affecter",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 1
              }
            ]
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 294,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 349,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 440,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 587,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      "numero": "12",
      "titre": "Défi : le Simon au hasard",
      "defi": true,
      "consigne": "Le vrai Simon invente sa séquence : au début de chaque tour, ajoute une couleur au hasard (1 à 4) à la fin de la liste, puis montre toute la liste et écoute le joueur.\nErreur : son d’erreur, la liste est vidée et on recommence. Bonus : garde le score (nombre de couleurs réussies) dans une variable.",
      "composants": [
        {
          "type": "led",
          "nom": "bleue",
          "couleur": "#3B82F6",
          "broche": "D3"
        },
        {
          "type": "led",
          "nom": "verte",
          "couleur": "#23C17A",
          "broche": "D5"
        },
        {
          "type": "led",
          "nom": "jaune",
          "couleur": "#FFCF3F",
          "broche": "D7"
        },
        {
          "type": "led",
          "nom": "rouge",
          "couleur": "#FF5566",
          "broche": "D9"
        },
        {
          "type": "bouton",
          "nom": "bleu",
          "broche": "D2"
        },
        {
          "type": "bouton",
          "nom": "vert",
          "broche": "D4"
        },
        {
          "type": "bouton",
          "nom": "jaune",
          "broche": "D6"
        },
        {
          "type": "bouton",
          "nom": "rouge",
          "broche": "D8"
        },
        {
          "type": "buzzer",
          "broche": "D10"
        }
      ],
      "illustration": "simon",
      "listes": [
        "sequence"
      ],
      "variables": [
        "i",
        "appui",
        "erreur",
        "score"
      ],
      "blocsAutorises": [
        "led_etat",
        "bouton_etat",
        "valeur_haut_bas",
        "comparaison",
        "si_alors",
        "si_sinon",
        "son",
        "attendre",
        "nombre",
        "fonction_definir_param",
        "fonction_appeler_param",
        "parametre",
        "liste_remplir",
        "liste_element",
        "liste_taille",
        "repeter_n",
        "affecter",
        "ajouter_a",
        "variable",
        "fonction_definir",
        "fonction_appeler",
        "repeter_jusqua",
        "logique",
        "non",
        "hasard",
        "liste_ajouter",
        "liste_vider",
        "operation"
      ],
      "blocsDepart": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_remplir",
                "liste": "sequence",
                "valeurs": [
                  4,
                  2,
                  2,
                  1,
                  3,
                  4,
                  1
                ]
              },
              {
                "bloc": "affecter",
                "variable": "etape",
                "valeur": 1
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "variable",
                  "variable": "etape"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "affecter",
                "variable": "erreur",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "logique",
                  "op": "ou",
                  "a": {
                    "bloc": "comparaison",
                    "op": ">",
                    "a": {
                      "bloc": "variable",
                      "variable": "i"
                    },
                    "b": {
                      "bloc": "variable",
                      "variable": "etape"
                    }
                  },
                  "b": {
                    "bloc": "comparaison",
                    "op": "=",
                    "a": {
                      "bloc": "variable",
                      "variable": "erreur"
                    },
                    "b": 1
                  }
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "lire_bouton",
                    "arguments": []
                  },
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "≠",
                      "a": {
                        "bloc": "variable",
                        "variable": "appui"
                      },
                      "b": {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "erreur",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "i",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "variable",
                    "variable": "erreur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 147,
                    "duree": 1
                  },
                  {
                    "bloc": "attendre",
                    "duree": 1
                  },
                  {
                    "bloc": "affecter",
                    "variable": "etape",
                    "valeur": 1
                  }
                ],
                "sinon": [
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "<",
                      "a": {
                        "bloc": "variable",
                        "variable": "etape"
                      },
                      "b": {
                        "bloc": "liste_taille",
                        "liste": "sequence"
                      }
                    },
                    "alors": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 523,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 659,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 784,
                        "duree": 0.15
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.15
                      },
                      {
                        "bloc": "son",
                        "broche": "D10",
                        "frequence": 1047,
                        "duree": 0.4
                      },
                      {
                        "bloc": "attendre",
                        "duree": 0.6
                      },
                      {
                        "bloc": "affecter",
                        "variable": "etape",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 1
              }
            ]
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 294,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 349,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 440,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 587,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      },
      "indices": [
        "« Au démarrage » : vider la liste. Au début de « Répéter indéfiniment » : ajouter un nombre au hasard entre 1 et 4 à la fin de la liste.",
        "Plus besoin de « etape » : on montre et on écoute toute la liste. En cas d’erreur, « vider la liste »."
      ],
      "scenarios": [
        {
          "nom": "La séquence s’allonge à chaque tour",
          "etapes": [
            {
              "jouerListe": "sequence",
              "boutons": [
                "D2",
                "D4",
                "D6",
                "D8"
              ],
              "calme": 1.5,
              "grandit": true,
              "tours": 4
            },
            {
              "liste": "sequence",
              "tailleMin": 5,
              "delai": 3,
              "contexte": "Après 4 tours réussis",
              "attendu": "la liste devrait avoir une couleur de plus à chaque tour (5 couleurs au moins)"
            }
          ]
        },
        {
          "nom": "Le joueur se trompe",
          "etapes": [
            {
              "jouerListe": "sequence",
              "boutons": [
                "D2",
                "D4",
                "D6",
                "D8"
              ],
              "calme": 1.5,
              "grandit": true,
              "tours": 3,
              "faute": true
            },
            {
              "entendre": "D10",
              "sauf": "couleurs",
              "delai": 3,
              "memeDepart": true,
              "contexte": "Quand le joueur se trompe",
              "attendu": "le buzzer devrait jouer un son d’erreur, différent des notes des couleurs"
            },
            {
              "liste": "sequence",
              "tailleMax": 1,
              "delai": 3,
              "contexte": "Après l’erreur",
              "attendu": "la liste devrait repartir de zéro (une seule couleur au nouveau tour)"
            }
          ]
        }
      ],
      "aSavoir": "jeu",
      "competence": "C9",
      "id": "simon-12",
      "solutionReference": {
        "format": "labo-blocs/programme",
        "version": 1,
        "fils": [
          {
            "quand": "demarrage",
            "corps": [
              {
                "bloc": "liste_vider",
                "liste": "sequence"
              }
            ]
          },
          {
            "quand": "boucle",
            "corps": [
              {
                "bloc": "liste_ajouter",
                "liste": "sequence",
                "valeur": {
                  "bloc": "hasard",
                  "min": 1,
                  "max": 4
                }
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "repeter_n",
                "fois": {
                  "bloc": "liste_taille",
                  "liste": "sequence"
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "allumer",
                    "arguments": [
                      {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    ]
                  },
                  {
                    "bloc": "ajouter_a",
                    "variable": "i",
                    "valeur": 1
                  }
                ]
              },
              {
                "bloc": "affecter",
                "variable": "i",
                "valeur": 1
              },
              {
                "bloc": "affecter",
                "variable": "erreur",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "logique",
                  "op": "ou",
                  "a": {
                    "bloc": "comparaison",
                    "op": ">",
                    "a": {
                      "bloc": "variable",
                      "variable": "i"
                    },
                    "b": {
                      "bloc": "liste_taille",
                      "liste": "sequence"
                    }
                  },
                  "b": {
                    "bloc": "comparaison",
                    "op": "=",
                    "a": {
                      "bloc": "variable",
                      "variable": "erreur"
                    },
                    "b": 1
                  }
                },
                "corps": [
                  {
                    "bloc": "appeler",
                    "fonction": "lire_bouton",
                    "arguments": []
                  },
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "comparaison",
                      "op": "≠",
                      "a": {
                        "bloc": "variable",
                        "variable": "appui"
                      },
                      "b": {
                        "bloc": "liste_element",
                        "liste": "sequence",
                        "position": {
                          "bloc": "variable",
                          "variable": "i"
                        }
                      }
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "erreur",
                        "valeur": 1
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "ajouter_a",
                        "variable": "i",
                        "valeur": 1
                      }
                    ]
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "variable",
                    "variable": "erreur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 147,
                    "duree": 1
                  },
                  {
                    "bloc": "attendre",
                    "duree": 1
                  },
                  {
                    "bloc": "affecter",
                    "variable": "score",
                    "valeur": {
                      "bloc": "liste_taille",
                      "liste": "sequence"
                    }
                  },
                  {
                    "bloc": "liste_vider",
                    "liste": "sequence"
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 1
              }
            ]
          }
        ],
        "fonctions": [
          {
            "nom": "allumer",
            "parametres": [
              "couleur"
            ],
            "corps": [
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 1
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D3",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 262,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 2
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D5",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 330,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 3
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D7",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 392,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "si_alors",
                "condition": {
                  "bloc": "comparaison",
                  "op": "=",
                  "a": {
                    "bloc": "parametre",
                    "parametre": "couleur"
                  },
                  "b": 4
                },
                "alors": [
                  {
                    "bloc": "led_etat",
                    "broche": "D9",
                    "etat": 1
                  },
                  {
                    "bloc": "son",
                    "broche": "D10",
                    "frequence": 523,
                    "duree": 0.3
                  }
                ]
              },
              {
                "bloc": "attendre",
                "duree": 0.3
              },
              {
                "bloc": "led_etat",
                "broche": "D3",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D5",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D7",
                "etat": 0
              },
              {
                "bloc": "led_etat",
                "broche": "D9",
                "etat": 0
              },
              {
                "bloc": "attendre",
                "duree": 0.2
              }
            ]
          },
          {
            "nom": "lire_bouton",
            "parametres": [],
            "corps": [
              {
                "bloc": "affecter",
                "variable": "appui",
                "valeur": 0
              },
              {
                "bloc": "repeter_jusqua",
                "condition": {
                  "bloc": "comparaison",
                  "op": "≠",
                  "a": {
                    "bloc": "variable",
                    "variable": "appui"
                  },
                  "b": 0
                },
                "corps": [
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D2"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 1
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D4"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 2
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D6"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 3
                      }
                    ]
                  },
                  {
                    "bloc": "si_alors",
                    "condition": {
                      "bloc": "bouton_etat",
                      "broche": "D8"
                    },
                    "alors": [
                      {
                        "bloc": "affecter",
                        "variable": "appui",
                        "valeur": 4
                      }
                    ]
                  },
                  {
                    "bloc": "attendre",
                    "duree": 0.01
                  }
                ]
              },
              {
                "bloc": "appeler",
                "fonction": "allumer",
                "arguments": [
                  {
                    "bloc": "variable",
                    "variable": "appui"
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ],
  "fiches": {
    "standard": {
      "titre": "Le standard de câblage de la console",
      "lignes": [
        "Toutes les consoles sont câblées pareil : ton programme marche sur n’importe laquelle.",
        "- Bleu (couleur 1) : bouton D2, LED D3",
        "- Vert (couleur 2) : bouton D4, LED D5",
        "- Jaune (couleur 3) : bouton D6, LED D7",
        "- Rouge (couleur 4) : bouton D8, LED D9",
        "- Buzzer : D10",
        "Les boutons relient la broche à la masse : appuyé, le bouton donne HAUT (1)."
      ]
    },
    "chaine": {
      "titre": "La chaîne d’information",
      "lignes": [
        "Une information entre, une action sort : capteurs → carte Arduino → actionneurs.",
        "Les boutons sont des capteurs : ils disent à la carte si on appuie.",
        "La carte Arduino traite l’information avec ton programme.",
        "Les LED et le buzzer sont des actionneurs : ils agissent (lumière, son)."
      ]
    },
    "son": {
      "titre": "Jouer une note",
      "lignes": [
        "Une note a une fréquence, en hertz (Hz) : plus elle est grande, plus le son est aigu.",
        "do 262 · ré 294 · mi 330 · fa 349 · sol 392 · la 440 · si 494 · do aigu 523 (et 659, 784, 1047 encore plus aigu).",
        "Le programme n’attend pas la fin de la note : ajoute « attendre » si la suite doit venir après."
      ]
    },
    "fonction": {
      "titre": "Les fonctions",
      "lignes": [
        "Une fonction est un groupe de blocs qui porte un nom. « appeler » exécute tous ses blocs, puis le programme continue.",
        "On l’écrit une fois, on l’appelle autant de fois qu’on veut : le programme est plus court et plus clair.",
        "Le paramètre (ici « couleur ») est la valeur donnée à chaque appel : « appeler allumer avec 3 » → couleur vaut 3."
      ]
    },
    "liste": {
      "titre": "Les listes",
      "lignes": [
        "Une liste range plusieurs nombres dans l’ordre, comme les cases d’un tableau.",
        "Le premier élément est le n° 1 : « élément n° 1 de la liste sequence ».",
        "« nombre d’éléments de la liste » : combien de nombres sont rangés.",
        "Pour parcourir la liste : une variable i vaut 1, puis 2, puis 3… (ajouter 1 à i à chaque tour)."
      ]
    },
    "jeu": {
      "titre": "L’algorithme du Simon",
      "lignes": [
        "1. Montrer les couleurs du tour.",
        "2. Écouter le joueur : un appui, puis le suivant…",
        "3. Comparer chaque appui à la couleur attendue.",
        "- si c’est faux alors : son d’erreur, on recommence au tour 1",
        "- sinon, si toute la séquence est réussie : victoire, on recommence",
        "- sinon : un tour de plus (une couleur de plus)"
      ]
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
      "definition": "Un petit trou de la carte où l’on branche un composant. Chaque broche a un nom, comme D2 ou D10."
    },
    {
      "mot": "Capteur",
      "icone": "info",
      "formes": [
        "capteur",
        "capteurs"
      ],
      "definition": "Un composant qui donne une information à la carte, comme un bouton."
    },
    {
      "mot": "Actionneur",
      "icone": "info",
      "formes": [
        "actionneur",
        "actionneurs"
      ],
      "definition": "Un composant qui agit : une LED éclaire, un buzzer fait du son."
    },
    {
      "mot": "Fréquence",
      "icone": "info",
      "formes": [
        "fréquence",
        "fréquences",
        "Hz"
      ],
      "definition": "Le nombre de vibrations par seconde d’un son, en hertz (Hz). Plus il est grand, plus le son est aigu."
    },
    {
      "mot": "Fonction",
      "icone": "info",
      "formes": [
        "fonction",
        "fonctions"
      ],
      "definition": "Un groupe de blocs qui porte un nom et qu’on appelle quand on en a besoin."
    },
    {
      "mot": "Paramètre",
      "icone": "info",
      "formes": [
        "paramètre",
        "paramètres"
      ],
      "definition": "La valeur donnée à une fonction quand on l’appelle (par exemple la couleur à allumer)."
    },
    {
      "mot": "Liste",
      "icone": "info",
      "formes": [
        "liste",
        "listes"
      ],
      "definition": "Plusieurs nombres rangés dans l’ordre. Le premier est le n° 1."
    },
    {
      "mot": "Variable",
      "icone": "info",
      "formes": [
        "variable",
        "variables"
      ],
      "definition": "Une boîte qui garde un nombre, qui peut changer pendant le programme (comme i, appui ou etape)."
    },
    {
      "mot": "Algorithme",
      "icone": "info",
      "formes": [
        "algorithme",
        "algorithmes"
      ],
      "definition": "La suite des étapes pour résoudre un problème, écrite avant de programmer."
    }
  ]
});
