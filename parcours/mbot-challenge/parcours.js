// Parcours « mBot Challenge », version 1.0.0 (Labo Blocs).
// Ce fichier est écrit par « Mettre à jour les exercices » (outil du professeur) : ne pas le modifier à la main.
definirParcours({
  "format": "labo-blocs/parcours",
  "version": 1,
  "id": "mbot-challenge",
  "titre": "mBot Challenge",
  "versionParcours": "1.0.0",
  "date": "2026-10-26",
  "moteurMinimum": "0.5.0",
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
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [],
      "id": "mbc-01",
      "numero": "1",
      "titre": "Les couleurs des LED",
      "libre": true,
      "consigne": "Au démarrage, la LED gauche et la LED droite du mBot prennent deux couleurs différentes, de votre choix.\nEnvoyez le programme dans le mBot. Quand les deux LED ont bien leurs couleurs, cliquez sur « J’ai terminé ».",
      "blocsAutorises": [
        "mbot_led"
      ],
      "indices": [
        "Il faut un bloc pour chaque LED : la gauche, puis la droite. Tout se passe une seule fois, au démarrage.",
        "Dans le bloc « LED … en … », le premier menu choisit la LED, le second sa couleur."
      ],
      "solutionReference": {
        "demarrage": [
          {
            "bloc": "mbot_led",
            "quelle": "2",
            "couleur": "jaune"
          },
          {
            "bloc": "mbot_led",
            "quelle": "1",
            "couleur": "vert"
          }
        ],
        "boucle": []
      },
      "competence": "C9"
    },
    {
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [],
      "id": "mbc-02",
      "numero": "2",
      "titre": "Les LED clignotent",
      "libre": true,
      "consigne": "La LED gauche passe d’une couleur à une autre toutes les secondes, sans jamais s’arrêter (par exemple jaune, puis bleu, puis jaune…). Choisissez vos deux couleurs.\nQuand le clignotement marche sur le mBot, cliquez sur « J’ai terminé ».",
      "blocsAutorises": [
        "mbot_led",
        "attendre"
      ],
      "indices": [
        "Ce qui se répète sans arrêt va dans « Répéter indéfiniment » : couleur 1, on attend, couleur 2, on attend.",
        "Sans « attendre », les couleurs changent si vite qu’on ne les voit pas."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "mbot_led",
            "quelle": "2",
            "couleur": "jaune"
          },
          {
            "bloc": "attendre",
            "duree": 1
          },
          {
            "bloc": "mbot_led",
            "quelle": "2",
            "couleur": "bleu"
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
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Une note quand on appuie, rien sinon",
          "etapes": [
            {
              "entendre": "D8",
              "aucune": true,
              "delai": 1.5
            },
            {
              "maintenir": "bouton"
            },
            {
              "entendre": "D8",
              "delai": 1.5
            },
            {
              "relacher": "bouton"
            },
            {
              "attendre": 1
            },
            {
              "entendre": "D8",
              "aucune": true,
              "delai": 1.5
            }
          ]
        }
      ],
      "id": "mbc-03",
      "numero": "3",
      "titre": "Son et bouton",
      "consigne": "Quand on appuie sur le petit bouton de la carte (à côté des LED), le mBot joue une note. Sans appui, il reste silencieux.",
      "blocsAutorises": [
        "mbot_bouton",
        "mbot_note",
        "si_alors",
        "si_sinon"
      ],
      "indices": [
        "Le mBot regarde sans arrêt le bouton : « si le bouton est appuyé, alors jouer une note ».",
        "La condition « le bouton de la carte est appuyé » se glisse dans le losange du bloc « si … alors »."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_alors",
            "condition": {
              "bloc": "mbot_bouton"
            },
            "alors": [
              {
                "bloc": "mbot_note",
                "note": "262",
                "duree": 0.5
              }
            ]
          }
        ]
      },
      "competence": "C9"
    },
    {
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Rouges, bleues pendant l’appui, puis rouges",
          "etapes": [
            {
              "verifier": {
                "LED gauche": 16711680,
                "LED droite": 16711680
              }
            },
            {
              "maintenir": "bouton"
            },
            {
              "verifier": {
                "LED gauche": 255,
                "LED droite": 255
              }
            },
            {
              "relacher": "bouton"
            },
            {
              "verifier": {
                "LED gauche": 16711680,
                "LED droite": 16711680
              }
            }
          ]
        }
      ],
      "id": "mbc-04",
      "numero": "4",
      "titre": "Bouton et LED",
      "consigne": "En temps normal, les deux LED sont rouges. Tant qu’on appuie sur le bouton de la carte, elles deviennent bleues. Dès qu’on relâche, elles redeviennent rouges.",
      "blocsAutorises": [
        "mbot_bouton",
        "mbot_led",
        "si_alors",
        "si_sinon"
      ],
      "indices": [
        "Deux cas cette fois : le bouton est appuyé, ou il ne l’est pas. Chaque cas a sa couleur.",
        "Le bloc « si … alors … sinon » a deux branches : une pour chaque état du bouton."
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
                "bloc": "mbot_led",
                "quelle": "0",
                "couleur": "bleu"
              }
            ],
            "sinon": [
              {
                "bloc": "mbot_led",
                "quelle": "0",
                "couleur": "rouge"
              }
            ]
          }
        ]
      },
      "competence": "C9"
    },
    {
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Chaque LED montre ce que voit son capteur",
          "etapes": [
            {
              "regler": {
                "ligne": 3
              }
            },
            {
              "verifier": {
                "LED gauche": 0,
                "LED droite": 0
              }
            },
            {
              "regler": {
                "ligne": 1
              }
            },
            {
              "verifier": {
                "LED gauche": 65280,
                "LED droite": 0
              }
            },
            {
              "regler": {
                "ligne": 2
              }
            },
            {
              "verifier": {
                "LED gauche": 0,
                "LED droite": 65280
              }
            },
            {
              "regler": {
                "ligne": 0
              }
            },
            {
              "verifier": {
                "LED gauche": 65280,
                "LED droite": 65280
              }
            }
          ]
        }
      ],
      "id": "mbc-05",
      "numero": "5",
      "titre": "Capteur de ligne et LED",
      "consigne": "Le suiveur de ligne a deux capteurs : un à gauche, un à droite. Quand le capteur gauche voit du noir, la LED gauche s’allume en vert ; sinon elle est éteinte. Pareil à droite : capteur droit, LED droite.\nDans le simulateur, choisissez ce que voit le suiveur de ligne avec le réglage « Ligne ».",
      "blocsAutorises": [
        "mbot_ligne_voit",
        "mbot_led",
        "si_alors",
        "si_sinon"
      ],
      "indices": [
        "Faites d’abord le côté gauche et essayez-le ; le côté droit est le même programme avec « droit » et « droite ».",
        "Un « si … alors … sinon » par côté, avec « le capteur … du suiveur de ligne voit du noir »."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "mbot_ligne_voit",
              "cote": "gauche",
              "couleur": "noir"
            },
            "alors": [
              {
                "bloc": "mbot_led",
                "quelle": "2",
                "couleur": "vert"
              }
            ],
            "sinon": [
              {
                "bloc": "mbot_led",
                "quelle": "2",
                "couleur": "eteinte"
              }
            ]
          },
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "mbot_ligne_voit",
              "cote": "droit",
              "couleur": "noir"
            },
            "alors": [
              {
                "bloc": "mbot_led",
                "quelle": "1",
                "couleur": "vert"
              }
            ],
            "sinon": [
              {
                "bloc": "mbot_led",
                "quelle": "1",
                "couleur": "eteinte"
              }
            ]
          }
        ]
      },
      "competence": "C6"
    },
    {
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Il avance seulement sur la ligne",
          "etapes": [
            {
              "regler": {
                "ligne": 3
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
                "ligne": 0
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
                "ligne": 1
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
                "ligne": 0
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
                "ligne": 2
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
      "id": "mbc-06",
      "numero": "6",
      "titre": "Capteur de ligne et moteurs",
      "consigne": "Si le capteur gauche ET le capteur droit voient tous les deux du noir, le mBot avance à la vitesse 50 %. Sinon, il reste arrêté.",
      "blocsAutorises": [
        "mbot_ligne_voit",
        "mbot_deplacer",
        "mbot_arreter",
        "si_alors",
        "si_sinon",
        "logique"
      ],
      "indices": [
        "Une seule condition, mais faite de deux morceaux : le capteur gauche voit du noir, et le capteur droit aussi.",
        "L’opérateur « … et … » (catégorie Décisions) réunit les deux capteurs dans le losange du « si »."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": [
          {
            "bloc": "si_sinon",
            "condition": {
              "bloc": "logique",
              "op": "et",
              "a": {
                "bloc": "mbot_ligne_voit",
                "cote": "gauche",
                "couleur": "noir"
              },
              "b": {
                "bloc": "mbot_ligne_voit",
                "cote": "droit",
                "couleur": "noir"
              }
            },
            "alors": [
              {
                "bloc": "mbot_deplacer",
                "direction": "avancer",
                "vitesse": 50
              }
            ],
            "sinon": [
              {
                "bloc": "mbot_arreter"
              }
            ]
          }
        ]
      },
      "competence": "C6"
    },
    {
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Il s’arrête devant l’obstacle",
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
                "distance": 3
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
                "distance": 8
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
      "id": "mbc-07",
      "numero": "7",
      "titre": "Capteur d’obstacle et moteurs",
      "consigne": "Le capteur à ultrasons mesure la distance entre le mBot et un obstacle. Si l’obstacle est à moins de 5 cm, le mBot s’arrête. Sinon, il avance à la vitesse 50 %.\nDans le simulateur, réglez la distance avec le curseur « Distance (ultrasons) ».",
      "blocsAutorises": [
        "mbot_distance",
        "mbot_deplacer",
        "mbot_arreter",
        "si_alors",
        "si_sinon",
        "comparaison"
      ],
      "indices": [
        "Le mBot mesure sans arrêt la distance : si elle est plus petite que 5, il s’arrête ; sinon il avance.",
        "La comparaison « … < … » (catégorie Décisions) reçoit la distance mesurée et le nombre 5."
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
                "valeur": 5
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
      },
      "competence": "C6"
    },
    {
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [
        {
          "nom": "Il tourne à gauche devant l’obstacle, puis repart",
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
                "distance": 6
              }
            },
            {
              "verifier": {
                "moteur gauche": -50,
                "moteur droit": 50
              },
              "delai": 0.15
            },
            {
              "regler": {
                "distance": 100
              }
            },
            {
              "verifier": {
                "moteur gauche": 50,
                "moteur droit": 50
              },
              "delai": 1
            }
          ]
        }
      ],
      "id": "mbc-08",
      "numero": "8",
      "titre": "Éviter l’obstacle",
      "consigne": "Cette fois, si l’obstacle est à moins de 10 cm, le mBot ne s’arrête pas : il tourne à gauche à la vitesse 50 % pendant un court instant (environ 0,3 s). Sinon, il avance à la vitesse 50 %.\nAjustez la durée du virage en essayant sur le vrai mBot.",
      "blocsAutorises": [
        "mbot_distance",
        "mbot_deplacer",
        "mbot_deplacer_pendant",
        "mbot_arreter",
        "attendre",
        "si_alors",
        "si_sinon",
        "comparaison"
      ],
      "indices": [
        "Le programme de l’exercice 7 est presque le bon : seule la branche « obstacle proche » change.",
        "Le bloc « tourner à gauche à la vitesse … pendant … s » fait le virage puis arrête les moteurs."
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
                "valeur": 10
              }
            },
            "alors": [
              {
                "bloc": "mbot_deplacer_pendant",
                "direction": "gauche",
                "vitesse": 50,
                "duree": 0.3
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
      },
      "competence": "C9"
    },
    {
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [],
      "id": "mbc-d1",
      "numero": "D1",
      "titre": "Défi 1 · Suivre la ligne",
      "libre": true,
      "ouvertApres": "mbc-08",
      "consigne": "Le mBot suit la ligne noire du circuit et fait un tour, le plus vite possible. S’il sort de la piste, c’est un malus et on le replace.\nMéthode : écrivez d’abord l’algorithme (si… alors… sinon…), commencez lentement, puis augmentez la vitesse. Notez chaque essai (vitesse, temps, sorties de piste) dans le carnet d’essais.\nQuand votre mBot fait le tour sans sortir, cliquez sur « J’ai terminé » : vous pourrez toujours l’améliorer.",
      "blocsAutorises": [
        "mbot_ligne_voit",
        "mbot_ligne",
        "mbot_deplacer",
        "mbot_moteur",
        "mbot_arreter",
        "mbot_led",
        "attendre",
        "si_alors",
        "si_sinon",
        "logique",
        "non",
        "comparaison"
      ],
      "indices": [
        "Quatre cas possibles : noir des deux côtés, noir seulement à gauche, noir seulement à droite, blanc des deux côtés. Que doit faire le mBot dans chaque cas ?",
        "Si la ligne n’est vue que d’un côté, le mBot est en train de la quitter de l’autre côté : il doit tourner vers le côté qui voit le noir."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": []
      },
      "competence": "C9"
    },
    {
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [],
      "id": "mbc-d2",
      "numero": "D2",
      "titre": "Défi 2 · Sortir les obstacles",
      "libre": true,
      "ouvertApres": "mbc-08",
      "consigne": "Dans la zone bordée de noir, le mBot sort les 3 objets en moins de 2 minutes, sans sortir lui-même de la zone (sinon, malus). Le défi n’est réussi que si les 3 objets sont dehors à temps.\nIl faut deux capteurs : les ultrasons pour trouver les objets, le suiveur de ligne pour rester dans la zone.\nQuand votre mBot vide la zone, cliquez sur « J’ai terminé ».",
      "blocsAutorises": [
        "mbot_distance",
        "mbot_ligne_voit",
        "mbot_ligne",
        "mbot_deplacer",
        "mbot_deplacer_pendant",
        "mbot_moteur",
        "mbot_arreter",
        "mbot_led",
        "mbot_note",
        "attendre",
        "si_alors",
        "si_sinon",
        "logique",
        "non",
        "comparaison",
        "repeter_n"
      ],
      "indices": [
        "Deux règles à la fois : si le suiveur voit la bordure noire, le mBot recule et tourne ; sinon, s’il voit un objet devant lui, il fonce dessus ; sinon, il cherche en tournant.",
        "Quelle règle passe en premier ? Rester dans la zone est plus important que pousser un objet."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": []
      },
      "competence": "C9"
    },
    {
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [],
      "id": "mbc-d3",
      "numero": "D3",
      "titre": "Défi 3 · Le labyrinthe au clavier",
      "libre": true,
      "ouvertApres": "mbc-08",
      "modes": [
        "simulateur",
        "direct"
      ],
      "consigne": "Le pilote fait sortir le mBot du labyrinthe le plus vite possible avec les flèches du clavier, en mode « En direct » par la clé 2.4G. Chaque contact avec un des 4 obstacles est un malus.\nProgrammez les quatre flèches (avancer, reculer, tourner à gauche, tourner à droite) et l’arrêt quand aucune touche n’est appuyée. Réglez les vitesses pour être rapide sans toucher les obstacles.\nQuand le pilote sort du labyrinthe d’entraînement, cliquez sur « J’ai terminé ».",
      "blocsAutorises": [
        "touche_appuyee",
        "mbot_deplacer",
        "mbot_moteur",
        "mbot_arreter",
        "mbot_led",
        "mbot_note",
        "si_alors",
        "si_sinon",
        "logique"
      ],
      "indices": [
        "Le mBot regarde sans arrêt le clavier. Une touche appuyée = un mouvement ; aucune touche = il s’arrête.",
        "Des « si … sinon » emboîtés : flèche haut, sinon flèche bas, sinon flèche gauche, sinon flèche droite, sinon arrêter."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": []
      },
      "competence": "C9"
    },
    {
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [],
      "id": "mbc-d4",
      "numero": "D4",
      "titre": "Défi 4 · La Récolte",
      "libre": true,
      "ouvertApres": "mbc-08",
      "modes": [
        "simulateur",
        "direct"
      ],
      "consigne": "Duel de 90 secondes : le pilote ramène un maximum de balles dans le panier de l’écurie, avec l’outil de ramassage que vous avez fabriqué.\nRègle de sécurité : le mBot ne doit jamais franchir la bordure noire de l’arène. Si le suiveur de ligne voit du noir, le mBot recule tout seul, même si le pilote appuie sur une flèche.\nQuand le pilotage et la sécurité marchent ensemble, cliquez sur « J’ai terminé ».",
      "blocsAutorises": [
        "touche_appuyee",
        "mbot_ligne_voit",
        "mbot_ligne",
        "mbot_deplacer",
        "mbot_deplacer_pendant",
        "mbot_moteur",
        "mbot_arreter",
        "mbot_led",
        "mbot_note",
        "attendre",
        "si_alors",
        "si_sinon",
        "logique",
        "non",
        "comparaison"
      ],
      "indices": [
        "Le programme du labyrinthe est un bon départ. Où placer la règle de sécurité pour qu’elle passe avant les flèches ?",
        "Le premier « si » regarde la bordure ; seulement « sinon », le mBot écoute le clavier."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": []
      },
      "competence": "C9"
    },
    {
      "defi": false,
      "composants": [],
      "blocsDepart": null,
      "scenarios": [],
      "id": "mbc-d5",
      "numero": "D5",
      "titre": "Défi 5 · Le défilé",
      "libre": true,
      "ouvertApres": "mbc-08",
      "consigne": "Le jour du tournoi, votre mBot habillé défile devant le jury pendant environ 30 secondes : déplacements, lumières et musique, à vous de créer le spectacle de l’écurie !\nLe défilé commence quand on appuie sur le bouton de la carte : vous posez le mBot sur la piste, puis vous appuyez.\nQuand votre défilé est prêt et dure environ 30 secondes, cliquez sur « J’ai terminé ».",
      "blocsAutorises": [
        "mbot_bouton",
        "mbot_deplacer",
        "mbot_deplacer_pendant",
        "mbot_arreter",
        "mbot_led",
        "mbot_note",
        "attendre",
        "si_alors",
        "repeter_n"
      ],
      "indices": [
        "Écrivez d’abord le scénario du défilé sur une feuille, seconde par seconde : où va le mBot, quelles couleurs, quelle musique ?",
        "Tout le spectacle va dans « si le bouton de la carte est appuyé, alors … » ; « répéter … fois » évite de recopier les mêmes blocs."
      ],
      "solutionReference": {
        "demarrage": [],
        "boucle": []
      },
      "competence": "C9"
    }
  ]
});
