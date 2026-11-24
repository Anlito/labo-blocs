// Parcours « Découverte du MOVE Motor », version 1.0.0 (Labo Blocs).
// Ce fichier est écrit par « Mettre à jour les exercices » (outil du professeur) : ne pas le modifier à la main.
definirParcours({
  "format": "labo-blocs/parcours",
  "version": 1,
  "id": "decouverte-move-motor",
  "titre": "Découverte du MOVE Motor",
  "versionParcours": "1.0.0",
  "date": "2026-11-24",
  "moteurMinimum": "0.5.0",
  "carte": "movemotor",
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
      "id": "mm-01",
      "numero": "1",
      "titre": "Avancer puis s’arrêter",
      "defi": false,
      "consigne": "Au démarrage, le robot avance à la vitesse 50 % pendant 2 secondes, puis il s’arrête.\nPose le robot par terre avant d’envoyer ton programme dans la carte !",
      "composants": [],
      "blocsAutorises": [
        "mm_deplacer",
        "mm_deplacer_pendant",
        "mm_arreter",
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
            "bloc": "mm_deplacer_pendant",
            "direction": "avancer",
            "vitesse": 50,
            "duree": 2
          }
        ],
        "boucle": []
      },
      "competence": "C9"
    },
    {
      "id": "mm-02",
      "numero": "2",
      "titre": "Aller-retour",
      "defi": false,
      "consigne": "Au démarrage, le robot avance à la vitesse 50 % pendant 1 seconde, klaxonne, puis recule à la vitesse 50 % pendant 1 seconde et s’arrête.",
      "composants": [],
      "blocsAutorises": [
        "mm_deplacer",
        "mm_deplacer_pendant",
        "mm_arreter",
        "mm_klaxon",
        "mm_note",
        "attendre"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Le robot avance, klaxonne, recule puis s’arrête",
          "etapes": [
            {
              "verifier": {
                "moteur gauche": 50,
                "moteur droit": 50
              }
            },
            {
              "entendre": "P0",
              "delai": 1.5,
              "notes": 1,
              "frequence": 185,
              "memeDepart": true
            },
            {
              "verifier": {
                "moteur gauche": -50,
                "moteur droit": -50
              },
              "delai": 1.5
            },
            {
              "verifier": {
                "moteur gauche": 0,
                "moteur droit": 0
              },
              "delai": 1
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
        "Trois choses l’une après l’autre, une seule fois : avancer pendant 1 s, klaxonner, reculer pendant 1 s.",
        "Blocs : « avancer à la vitesse … pendant … s », « klaxonner », puis « reculer à la vitesse … pendant … s », dans « Au démarrage »."
      ],
      "solutionReference": {
        "demarrage": [
          {
            "bloc": "mm_deplacer_pendant",
            "direction": "avancer",
            "vitesse": 50,
            "duree": 1
          },
          {
            "bloc": "mm_klaxon"
          },
          {
            "bloc": "mm_deplacer_pendant",
            "direction": "reculer",
            "vitesse": 50,
            "duree": 1
          }
        ],
        "boucle": []
      },
      "competence": "C9"
    },
    {
      "id": "mm-03",
      "numero": "3",
      "titre": "Le bouton A",
      "defi": false,
      "consigne": "Tant que le bouton A de la micro:bit est appuyé, le robot avance à la vitesse 40 % et ses 4 LED sont vertes. Sinon, il s’arrête et ses LED s’éteignent.",
      "composants": [],
      "blocsAutorises": [
        "mm_deplacer",
        "mm_arreter",
        "mm_led",
        "mb_bouton",
        "si_sinon"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Le bouton A fait avancer le robot",
          "etapes": [
            {
              "verifier": {
                "moteur gauche": 0,
                "moteur droit": 0
              }
            },
            {
              "maintenir": "A"
            },
            {
              "verifier": {
                "moteur gauche": 40,
                "moteur droit": 40,
                "LED avant gauche": 65280,
                "LED avant droite": 65280,
                "LED arrière droite": 65280,
                "LED arrière gauche": 65280
              }
            },
            {
              "relacher": "A"
            },
            {
              "verifier": {
                "moteur gauche": 0,
                "moteur droit": 0,
                "LED avant gauche": 0,
                "LED avant droite": 0,
                "LED arrière droite": 0,
                "LED arrière gauche": 0
              }
            }
          ]
        }
      ],
      "indices": [
        "Le robot regarde sans arrêt le bouton A : s’il est appuyé il avance, sinon il s’arrête.",
        "Blocs : « si … alors … sinon » dans « Répéter indéfiniment », avec « le bouton A est appuyé » ; « LED toutes en vert » ou « éteinte »."
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
                "bloc": "mm_deplacer",
                "direction": "avancer",
                "vitesse": 40
              },
              {
                "bloc": "mm_led",
                "quelle": "0",
                "couleur": "vert"
              }
            ],
            "sinon": [
              {
                "bloc": "mm_arreter"
              },
              {
                "bloc": "mm_led",
                "quelle": "0",
                "couleur": "eteinte"
              }
            ]
          }
        ]
      },
      "competence": "C9"
    },
    {
      "id": "mm-04",
      "numero": "4",
      "titre": "S’arrêter devant un obstacle",
      "defi": false,
      "consigne": "Le robot avance à la vitesse 50 %, LED éteintes. Quand un obstacle est à moins de 20 cm devant lui, il s’arrête et ses 4 LED s’allument en rouge.\nDans le simulateur, règle la distance avec le curseur « Distance (ultrasons) ».",
      "composants": [],
      "blocsAutorises": [
        "mm_deplacer",
        "mm_arreter",
        "mm_distance",
        "mm_led",
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
                "moteur droit": 50,
                "LED avant gauche": 0
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
                "moteur droit": 0,
                "LED avant gauche": 16711680,
                "LED avant droite": 16711680,
                "LED arrière droite": 16711680,
                "LED arrière gauche": 16711680
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
                "moteur droit": 50,
                "LED avant gauche": 0
              }
            }
          ]
        }
      ],
      "indices": [
        "Le robot mesure sans arrêt la distance : si elle est plus petite que 20, il s’arrête et allume ses LED en rouge ; sinon il avance, LED éteintes.",
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
                "bloc": "mm_distance"
              },
              "b": {
                "bloc": "nombre",
                "valeur": 20
              }
            },
            "alors": [
              {
                "bloc": "mm_arreter"
              },
              {
                "bloc": "mm_led",
                "quelle": "0",
                "couleur": "rouge"
              }
            ],
            "sinon": [
              {
                "bloc": "mm_deplacer",
                "direction": "avancer",
                "vitesse": 50
              },
              {
                "bloc": "mm_led",
                "quelle": "0",
                "couleur": "eteinte"
              }
            ]
          }
        ]
      },
      "competence": "C6"
    },
    {
      "id": "mm-05",
      "numero": "5",
      "titre": "Suivre une ligne",
      "defi": false,
      "consigne": "Le robot suit une ligne noire. Si le capteur gauche voit du noir, il tourne à gauche à la vitesse 30 %. Sinon, si le capteur droit voit du noir, il tourne à droite à la vitesse 30 %. Sinon, il avance à la vitesse 30 %.\nDans le simulateur, règle « Suivi de ligne » pour mettre du noir sous un capteur.",
      "composants": [],
      "blocsAutorises": [
        "mm_deplacer",
        "mm_arreter",
        "mm_ligne_voit",
        "mm_ligne_valeur",
        "si_alors",
        "si_sinon"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Le robot suit la ligne",
          "etapes": [
            {
              "regler": {
                "ligne": 3
              }
            },
            {
              "verifier": {
                "moteur gauche": 30,
                "moteur droit": 30
              }
            },
            {
              "regler": {
                "ligne": 1
              }
            },
            {
              "verifier": {
                "moteur gauche": -30,
                "moteur droit": 30
              }
            },
            {
              "regler": {
                "ligne": 3
              }
            },
            {
              "verifier": {
                "moteur gauche": 30,
                "moteur droit": 30
              }
            },
            {
              "regler": {
                "ligne": 2
              }
            },
            {
              "verifier": {
                "moteur gauche": 30,
                "moteur droit": -30
              }
            }
          ]
        }
      ],
      "indices": [
        "Le robot regarde sans arrêt ses deux capteurs. La ligne est sous le capteur gauche ? Le robot dérive vers la droite : il tourne à gauche pour revenir dessus.",
        "Blocs : « si le capteur gauche voit du noir alors … sinon … », et dans le « sinon », un deuxième « si … sinon … » pour le capteur droit."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "mm_ligne_voit",
              "cote": "gauche",
              "couleur": "noir"
            },
            "alors": [
              {
                "bloc": "mm_deplacer",
                "direction": "gauche",
                "vitesse": 30
              }
            ],
            "sinon": [
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "mm_ligne_voit",
                  "cote": "droit",
                  "couleur": "noir"
                },
                "alors": [
                  {
                    "bloc": "mm_deplacer",
                    "direction": "droite",
                    "vitesse": 30
                  }
                ],
                "sinon": [
                  {
                    "bloc": "mm_deplacer",
                    "direction": "avancer",
                    "vitesse": 30
                  }
                ]
              }
            ]
          }
        ]
      },
      "competence": "C6"
    },
    {
      "id": "mm-06",
      "numero": "6",
      "titre": "Télécommande au clavier",
      "defi": false,
      "consigne": "Pilote le robot avec le clavier de l’ordinateur, en mode « En direct » (le robot reste relié par le câble).\nTant que la flèche haut est appuyée, le robot avance à la vitesse 50 %. Flèche bas : il recule à la vitesse 50 %. Flèche gauche ou droite : il tourne de ce côté à la vitesse 40 %. Sinon, il s’arrête.",
      "composants": [],
      "modes": [
        "simulateur",
        "direct"
      ],
      "blocsAutorises": [
        "quand_touche",
        "touche_appuyee",
        "mm_deplacer",
        "mm_arreter",
        "si_alors",
        "si_sinon",
        "attendre"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Les flèches pilotent le robot",
          "etapes": [
            {
              "verifier": {
                "moteur gauche": 0,
                "moteur droit": 0
              }
            },
            {
              "maintenir": "touche:haut"
            },
            {
              "verifier": {
                "moteur gauche": 50,
                "moteur droit": 50
              }
            },
            {
              "relacher": "touche:haut"
            },
            {
              "verifier": {
                "moteur gauche": 0,
                "moteur droit": 0
              }
            },
            {
              "maintenir": "touche:bas"
            },
            {
              "verifier": {
                "moteur gauche": -50,
                "moteur droit": -50
              }
            },
            {
              "relacher": "touche:bas"
            },
            {
              "maintenir": "touche:gauche"
            },
            {
              "verifier": {
                "moteur gauche": -40,
                "moteur droit": 40
              }
            },
            {
              "relacher": "touche:gauche"
            },
            {
              "maintenir": "touche:droite"
            },
            {
              "verifier": {
                "moteur gauche": 40,
                "moteur droit": -40
              }
            },
            {
              "relacher": "touche:droite"
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
        "Le robot regarde sans arrêt le clavier : tout se passe dans « Répéter indéfiniment ».",
        "Blocs : « si la touche flèche haut est appuyée alors … sinon … », et dans chaque « sinon », un nouveau « si … sinon … » pour la flèche suivante."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "touche_appuyee",
              "touche": "haut"
            },
            "alors": [
              {
                "bloc": "mm_deplacer",
                "direction": "avancer",
                "vitesse": 50
              }
            ],
            "sinon": [
              {
                "bloc": "si_sinon",
                "condition": {
                  "bloc": "touche_appuyee",
                  "touche": "bas"
                },
                "alors": [
                  {
                    "bloc": "mm_deplacer",
                    "direction": "reculer",
                    "vitesse": 50
                  }
                ],
                "sinon": [
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "touche_appuyee",
                      "touche": "gauche"
                    },
                    "alors": [
                      {
                        "bloc": "mm_deplacer",
                        "direction": "gauche",
                        "vitesse": 40
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "si_sinon",
                        "condition": {
                          "bloc": "touche_appuyee",
                          "touche": "droite"
                        },
                        "alors": [
                          {
                            "bloc": "mm_deplacer",
                            "direction": "droite",
                            "vitesse": 40
                          }
                        ],
                        "sinon": [
                          {
                            "bloc": "mm_arreter"
                          }
                        ]
                      }
                    ]
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
      "id": "mm-07",
      "numero": "7",
      "titre": "Mon robot en fête",
      "defi": false,
      "libre": true,
      "consigne": "Invente un petit spectacle pour le robot : un dessin ou un texte sur l’écran de la micro:bit, des LED de couleur, des notes, des mouvements…\nPar exemple : au bouton A, le robot fait un tour sur lui-même en clignotant ; au bouton B, il joue une petite musique. Quand ton programme marche, clique sur « J’ai terminé ».",
      "composants": [],
      "blocsAutorises": [
        "mm_deplacer",
        "mm_deplacer_pendant",
        "mm_arreter",
        "mm_moteur",
        "mm_led",
        "mm_note",
        "mm_klaxon",
        "mm_distance",
        "mb_dessin",
        "mb_image",
        "mb_texte",
        "mb_nombre",
        "mb_effacer",
        "mb_bouton",
        "mb_logo",
        "attendre",
        "si_alors",
        "si_sinon",
        "repeter_n",
        "comparaison",
        "hasard"
      ],
      "blocsDepart": null,
      "scenarios": [],
      "indices": [
        "Dans « Répéter indéfiniment » : « si le bouton A est appuyé alors … », puis la même chose pour le bouton B.",
        "Pour faire clignoter : LED en couleur, attendre, LED éteinte, attendre… dans un « répéter … fois »."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": []
      },
      "competence": "C9"
    }
  ]
});
