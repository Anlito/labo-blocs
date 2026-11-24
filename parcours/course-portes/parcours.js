// Parcours « La course aux portes (mBot + caméra) », version 1.0.0 (Labo Blocs).
// Ce fichier est écrit par « Mettre à jour les exercices » (outil du professeur) : ne pas le modifier à la main.
definirParcours({
  "format": "labo-blocs/parcours",
  "version": 1,
  "id": "course-portes",
  "titre": "La course aux portes (mBot + caméra)",
  "versionParcours": "1.0.0",
  "date": "2026-11-23",
  "niveaux": [
    "3"
  ],
  "moteurMinimum": "0.5.0",
  "carte": "mbot",
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
      "id": "cp-01",
      "numero": "1",
      "titre": "Avancer, puis s’arrêter",
      "defi": false,
      "consigne": "Choisissez ce que vous allez montrer à la caméra pour chaque commande : un geste de la main, une feuille de couleur, un personnage, un objet… C’est votre choix !\nPanneau « Caméra et IA » : prenez au moins 10 photos pour chaque commande, et 10 photos de « Rien » (la caméra sans rien devant).\nQuand la caméra reconnaît « Avancer », le mBot avance à la vitesse 40 %. Quand elle ne le reconnaît plus, il s’arrête.",
      "composants": [],
      "camera": {
        "etiquettes": [
          "Avancer",
          "Reculer",
          "Gauche",
          "Droite"
        ]
      },
      "blocsAutorises": [
        "quand_camera",
        "mbot_deplacer",
        "mbot_arreter"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Avancer puis s’arrêter",
          "etapes": [
            {
              "verifier": {
                "moteur gauche": 0,
                "moteur droit": 0
              }
            },
            {
              "regler": {
                "camera": 1
              }
            },
            {
              "verifier": {
                "moteur gauche": 40,
                "moteur droit": 40
              }
            },
            {
              "regler": {
                "camera": 0
              }
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
        "Deux événements : quand la caméra reconnaît « Avancer », et quand elle ne le reconnaît plus.",
        "Blocs : deux « quand la caméra … », l’un avec « avancer à la vitesse … », l’autre avec « arrêter les moteurs »."
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
                "bloc": "mbot_deplacer",
                "direction": "avancer",
                "vitesse": 40
              }
            ]
          },
          {
            "quand": "camera",
            "etiquette": 1,
            "front": "plus",
            "corps": [
              {
                "bloc": "mbot_arreter"
              }
            ]
          }
        ]
      },
      "competence": "C9"
    },
    {
      "id": "cp-02",
      "numero": "2",
      "titre": "Les quatre commandes",
      "defi": false,
      "consigne": "Le mBot obéit aux quatre commandes, toujours à la vitesse 40 % : Avancer, Reculer, tourner à Gauche, tourner à Droite.\nQuand la caméra ne reconnaît rien, le mBot s’arrête : c’est la sécurité si l’objet sort de l’image.",
      "composants": [],
      "camera": {
        "etiquettes": [
          "Avancer",
          "Reculer",
          "Gauche",
          "Droite"
        ]
      },
      "blocsAutorises": [
        "quand_camera",
        "camera_reconnait",
        "si_alors",
        "si_sinon",
        "mbot_deplacer",
        "mbot_arreter"
      ],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Les quatre commandes, puis rien",
          "etapes": [
            {
              "regler": {
                "camera": 1
              }
            },
            {
              "verifier": {
                "moteur gauche": 40,
                "moteur droit": 40
              }
            },
            {
              "regler": {
                "camera": 2
              }
            },
            {
              "verifier": {
                "moteur gauche": -40,
                "moteur droit": -40
              }
            },
            {
              "regler": {
                "camera": 3
              }
            },
            {
              "verifier": {
                "moteur gauche": -40,
                "moteur droit": 40
              }
            },
            {
              "regler": {
                "camera": 4
              }
            },
            {
              "verifier": {
                "moteur gauche": 40,
                "moteur droit": -40
              }
            },
            {
              "regler": {
                "camera": 0
              }
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
        "Le mBot regarde sans arrêt ce que reconnaît la caméra. Une commande reconnue = un mouvement ; rien = il s’arrête.",
        "Des « si … sinon » emboîtés : Avancer, sinon Reculer, sinon Gauche, sinon Droite, sinon arrêter les moteurs."
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
                "bloc": "mbot_deplacer",
                "direction": "avancer",
                "vitesse": 40
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
                    "bloc": "mbot_deplacer",
                    "direction": "reculer",
                    "vitesse": 40
                  }
                ],
                "sinon": [
                  {
                    "bloc": "si_sinon",
                    "condition": {
                      "bloc": "camera_reconnait",
                      "etiquette": "3"
                    },
                    "alors": [
                      {
                        "bloc": "mbot_deplacer",
                        "direction": "gauche",
                        "vitesse": 40
                      }
                    ],
                    "sinon": [
                      {
                        "bloc": "si_sinon",
                        "condition": {
                          "bloc": "camera_reconnait",
                          "etiquette": "4"
                        },
                        "alors": [
                          {
                            "bloc": "mbot_deplacer",
                            "direction": "droite",
                            "vitesse": 40
                          }
                        ],
                        "sinon": [
                          {
                            "bloc": "mbot_arreter"
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
      "id": "cp-03",
      "numero": "3",
      "titre": "Entraînement sur la piste",
      "defi": false,
      "libre": true,
      "modes": [
        "simulateur",
        "direct"
      ],
      "consigne": "Branchez la clé 2.4G, allumez le mBot et passez en mode « En direct ».\nLe pilote est devant la caméra, dos à la piste : il ne voit pas le robot. Le copilote regarde le mBot et annonce les commandes. Le mécanicien replace le robot à la dernière porte passée s’il sort.\nRéglez les vitesses (avancer, tourner) pour passer les portes sans les toucher. Changez de rôle à chaque essai.\nQuand votre équipe passe toutes les portes, cliquez sur « J’ai terminé ».",
      "composants": [],
      "camera": {
        "etiquettes": [
          "Avancer",
          "Reculer",
          "Gauche",
          "Droite"
        ]
      },
      "blocsAutorises": [
        "quand_camera",
        "camera_reconnait",
        "si_alors",
        "si_sinon",
        "mbot_deplacer",
        "mbot_moteur",
        "mbot_arreter",
        "mbot_led",
        "mbot_note"
      ],
      "blocsDepart": null,
      "scenarios": [],
      "indices": [
        "Si le robot va trop vite pour le copilote, baissez la vitesse ; s’il tourne trop, baissez la vitesse des virages.",
        "L’IA se trompe ? Ajoutez des photos de la commande mal reconnue, avec la lumière et le fond de la salle de course."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": []
      },
      "competence": "C9"
    },
    {
      "id": "cp-04",
      "numero": "4",
      "titre": "Bonus · Seulement si l’IA est sûre",
      "defi": false,
      "libre": true,
      "ouvertApres": "cp-02",
      "modes": [
        "simulateur",
        "direct"
      ],
      "consigne": "Pour les équipes rapides : le mBot obéit seulement quand l’IA est sûre d’elle (bloc « certitude »). Sinon, il s’arrête.\nEn plus, la LED du mBot change de couleur selon la commande, et une note sonne quand il recule.\nQuand votre mBot obéit sans se tromper, cliquez sur « J’ai terminé ».",
      "composants": [],
      "camera": {
        "etiquettes": [
          "Avancer",
          "Reculer",
          "Gauche",
          "Droite"
        ]
      },
      "blocsAutorises": [
        "quand_camera",
        "camera_reconnait",
        "camera_certitude",
        "comparaison",
        "logique",
        "si_alors",
        "si_sinon",
        "mbot_deplacer",
        "mbot_moteur",
        "mbot_arreter",
        "mbot_led",
        "mbot_note"
      ],
      "blocsDepart": null,
      "scenarios": [],
      "indices": [
        "La certitude est un nombre de 0 à 100 : à partir de combien l’IA est-elle assez sûre ?",
        "Un « si » avec « certitude > … » autour de tout le programme de l’exercice 2."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": []
      },
      "competence": "C9"
    }
  ]
});
