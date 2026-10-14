// Programmes volontairement faux (au moins trois par exercice) et le début du message attendu.
const { led, att, servo, choix, CHOIX, egal, different, bouton, BAS, appuye, si, siSinon, prog } = require('./outils.js');

// Morceaux réutilisés par les exercices 7, 8 et 13.
const petite = si(appuye('D3'), [led('D9', 1), led('D10', 0)]);
const grande = si(appuye('D4'), [led('D10', 1), led('D9', 0)]);
const trappe5 = si(appuye('D5'), [led('D9', 0), led('D10', 0), led('D11', 1), att(5), led('D11', 0)]);
const choixPetite = si(appuye('D3'), [led('D9', 1), led('D10', 0), choix(3)]);
const choixGrande = si(appuye('D4'), [led('D9', 0), led('D10', 1), choix(7)]);
const ouvrir = (duree) => [led('D9', 0), led('D10', 0), led('D11', 1), servo('D6', 0), att(duree), led('D11', 0), servo('D6', 90)];

module.exports = {
  1: [
    {
      nom: 'mauvaise broche',
      programme: prog([led('D10', 1)]),
      message: 'Au bout de 1 s, la LED D9 devrait être allumée. Dans ton programme, elle reste éteinte. Ton programme agit sur la broche D10',
    },
    { nom: 'LED à BAS', programme: prog([led('D9', 0)]), message: 'Au bout de 1 s, la LED D9 devrait être allumée. Dans ton programme, elle reste éteinte.' },
    { nom: 'programme vide', programme: prog([], []), message: 'Au bout de 1 s, la LED D9 devrait être allumée.' },
  ],
  2: [
    {
      nom: 'oubli du second « attendre »',
      programme: prog([], [led('D9', 1), att(2), led('D9', 0)]),
      message: 'La LED D9 devrait s’allumer et s’éteindre en changeant toutes les 2 s. Dans ton programme, elle reste allumée.',
    },
    {
      nom: 'attente de 1 s',
      programme: prog([], [led('D9', 1), att(1), led('D9', 0), att(1)]),
      message: 'Dans ton programme, elle reste éteinte pendant 1 s.',
    },
    {
      nom: 'mauvaise broche',
      programme: prog([], [led('D10', 1), att(2), led('D10', 0), att(2)]),
      message: 'Dans ton programme, elle reste éteinte. Ton programme agit sur la broche D10',
    },
    {
      nom: 'aucun « attendre »',
      programme: prog([], [led('D9', 1), led('D9', 0)]),
      message: 'Dans ton programme, elle reste éteinte.',
    },
  ],
  3: [
    {
      nom: 'oubli des « attendre »',
      programme: prog([], [led('D9', 1), led('D10', 0), led('D9', 0), led('D10', 1)]),
      message: 'La LED D9 devrait s’allumer et s’éteindre',
    },
    {
      nom: 'les deux LED ensemble',
      programme: prog([], [led('D9', 1), led('D10', 1), att(2), led('D9', 0), led('D10', 0), att(2)]),
      message:
        'La LED D9 et la LED D10 devraient toujours faire l’inverse : quand l’une est allumée, l’autre est éteinte. Dans ton programme, elles sont toutes les deux allumées en même temps.',
    },
    {
      nom: 'D11 au lieu de D10',
      programme: prog([], [led('D9', 1), led('D11', 0), att(2), led('D9', 0), led('D11', 1), att(2)]),
      message: 'Dans ton programme, elles sont toutes les deux éteintes en même temps. Ton programme agit sur la broche D11',
    },
  ],
  4: [
    {
      nom: 'sans condition',
      programme: prog([], [led('D9', 1)]),
      message: 'Quand aucun bouton n’est appuyé, la LED D9 devrait être éteinte. Dans ton programme, elle reste allumée.',
    },
    {
      nom: 'mauvais bouton',
      programme: prog([], [si(appuye('D4'), [led('D9', 1)])]),
      message: 'Quand le bouton D3 est appuyé, la LED D9 devrait être allumée. Dans ton programme, elle reste éteinte. Ton programme lit un bouton sur la broche D4',
    },
    {
      nom: 'condition inversée (BAS)',
      programme: prog([], [si(egal(bouton('D3'), BAS), [led('D9', 1)])]),
      message: 'Quand aucun bouton n’est appuyé, la LED D9 devrait être éteinte. Dans ton programme, elle reste allumée.',
    },
    {
      nom: 'condition vide',
      programme: prog([], [si(null, [led('D9', 1)])]),
      message: 'Quand le bouton D3 est appuyé, la LED D9 devrait être allumée.',
    },
  ],
  5: [
    {
      nom: 'pas de « sinon »',
      programme: prog([], [si(appuye('D3'), [led('D9', 1)])]),
      message: 'Quand le bouton D3 est relâché, la LED D9 devrait être éteinte. Dans ton programme, elle reste allumée.',
    },
    {
      nom: 'LED inversées',
      programme: prog([], [siSinon(appuye('D3'), [led('D9', 0)], [led('D9', 1)])]),
      message: 'Quand le bouton D3 est appuyé, la LED D9 devrait être allumée. Dans ton programme, elle est éteinte.',
    },
    {
      nom: 'mauvaise broche de LED',
      programme: prog([], [siSinon(appuye('D3'), [led('D10', 1)], [led('D10', 0)])]),
      message: 'Quand le bouton D3 est appuyé, la LED D9 devrait être allumée. Dans ton programme, elle reste éteinte. Ton programme agit sur la broche D10',
    },
  ],
  6: [
    {
      nom: 'D10 oubliée',
      programme: prog([], [siSinon(appuye('D3'), [led('D9', 1)], [led('D9', 0)])]),
      message: 'Quand le bouton D3 est relâché, la LED D10 devrait être allumée. Dans ton programme, elle reste éteinte.',
    },
    {
      nom: 'LED inversées',
      programme: prog([], [siSinon(appuye('D3'), [led('D9', 0), led('D10', 1)], [led('D9', 1), led('D10', 0)])]),
      message: 'Quand le bouton D3 est appuyé, la LED D9 devrait être allumée.',
    },
    {
      nom: 'pas de « sinon »',
      programme: prog([], [si(appuye('D3'), [led('D9', 1), led('D10', 0)])]),
      message: 'Quand le bouton D3 est relâché, la LED D9 devrait être éteinte. Dans ton programme, elle reste allumée.',
    },
  ],
  7: [
    {
      nom: 'bouton GrandeDose oublié',
      programme: prog([], [petite]),
      message: 'Quand le bouton GrandeDose (D4) est appuyé, la LED GrandeDose (D10) devrait être allumée. Dans ton programme, elle reste éteinte.',
    },
    {
      nom: 'D9 pas éteinte par GrandeDose',
      programme: prog([], [si(appuye('D3'), [led('D9', 1), led('D10', 0)]), si(appuye('D4'), [led('D10', 1)])]),
      message: 'Quand le bouton GrandeDose (D4) est appuyé, la LED PetiteDose (D9) devrait être éteinte. Dans ton programme, elle reste allumée.',
    },
    {
      nom: 'boutons inversés',
      programme: prog([], [si(appuye('D4'), [led('D9', 1), led('D10', 0)]), si(appuye('D3'), [led('D10', 1), led('D9', 0)])]),
      message: 'Quand le bouton PetiteDose (D3) est appuyé, la LED PetiteDose (D9) devrait être allumée.',
    },
  ],
  8: [
    {
      nom: 'oubli de « attendre »',
      programme: prog([], [petite, grande, si(appuye('D5'), [led('D9', 0), led('D10', 0), led('D11', 1), led('D11', 0)])]),
      message: 'Après un appui sur le bouton Trappe (D5), la LED Trappe (D11) devrait être allumée. Dans ton programme, elle reste éteinte.',
    },
    {
      nom: 'attente de 2 s',
      programme: prog([], [petite, grande, si(appuye('D5'), [led('D9', 0), led('D10', 0), led('D11', 1), att(2), led('D11', 0)])]),
      message:
        'Après un appui sur le bouton Trappe (D5), la LED Trappe (D11) devrait rester allumée 5 s, puis s’éteindre. Dans ton programme, elle reste allumée pendant 2 s.',
    },
    {
      nom: 'LED D10 restée allumée',
      programme: prog([], [petite, grande, si(appuye('D5'), [led('D9', 0), led('D11', 1), att(5), led('D11', 0)])]),
      message: 'Après un appui sur le bouton Trappe (D5), la LED GrandeDose (D10) devrait être éteinte. Dans ton programme, elle reste allumée.',
    },
    {
      nom: 'LED Trappe jamais éteinte',
      programme: prog([], [petite, grande, si(appuye('D5'), [led('D9', 0), led('D10', 0), led('D11', 1), att(5)])]),
      message: 'Dans ton programme, elle reste allumée et ne s’éteint plus.',
    },
  ],
  9: [
    {
      nom: 'angle de 90°',
      programme: prog([servo('D6', 90)]),
      message: 'Au bout de 1 s, le moteur D6 devrait être à 180°. Dans ton programme, il reste à 90°.',
    },
    {
      nom: 'mauvaise broche',
      programme: prog([servo('D11', 180)]),
      message: 'Au bout de 1 s, le moteur D6 devrait être à 180°. Dans ton programme, il reste à 0°. Ton programme agit sur la broche D11',
    },
    {
      nom: 'le moteur repart',
      programme: prog([], [servo('D6', 180), att(1.5), servo('D6', 0), att(1.5)]),
      message: 'Le moteur D6 devrait rester à 180°. Dans ton programme, il va à 0°.',
    },
  ],
  10: [
    {
      nom: 'oubli du second « attendre »',
      programme: prog([], [servo('D6', 0), att(2), servo('D6', 90)]),
      message: 'Dans ton programme, il reste à 0°.',
    },
    {
      nom: 'attente de 1 s',
      programme: prog([], [servo('D6', 0), att(1), servo('D6', 90), att(1)]),
      message: 'Dans ton programme, il reste 1 s à',
    },
    {
      nom: 'angle de 180° au lieu de 90°',
      programme: prog([], [servo('D6', 0), att(2), servo('D6', 180), att(2)]),
      message: 'Le moteur D6 devrait passer par 0°, 90°, puis recommencer, en changeant toutes les 2 s. Dans ton programme, il passe de 0° à 180°.',
    },
  ],
  11: [
    {
      nom: 'pas de retour par 90°',
      programme: prog([], [servo('D6', 0), att(2), servo('D6', 90), att(2), servo('D6', 180), att(2)]),
      message: 'Dans ton programme, il passe de 180° à 0°.',
    },
    {
      nom: 'attentes de 1 s',
      programme: prog([], [servo('D6', 0), att(1), servo('D6', 90), att(1), servo('D6', 180), att(1), servo('D6', 90), att(1)]),
      message: 'Dans ton programme, il reste 1 s à',
    },
    {
      nom: 'oubli d’un « attendre » après 180°',
      programme: prog([], [servo('D6', 0), att(2), servo('D6', 90), att(2), servo('D6', 180), servo('D6', 90), att(2)]),
      message: 'Dans ton programme, il passe de 90° à 0°.',
    },
  ],
  12: [
    {
      nom: 'mauvaise broche du moteur',
      programme: prog([], [siSinon(appuye('D5'), [servo('D5', 90)], [servo('D5', 0)])]),
      message: 'Quand le bouton D5 est appuyé, le moteur D6 devrait être à 90°. Dans ton programme, il reste à 0°. Ton programme agit sur la broche D5',
    },
    {
      nom: 'angles inversés',
      programme: prog([], [siSinon(appuye('D5'), [servo('D6', 0)], [servo('D6', 90)])]),
      message: 'Quand le bouton D5 est appuyé, le moteur D6 devrait être à 90°. Dans ton programme, il est à 0°.',
    },
    {
      nom: 'pas de « sinon »',
      programme: prog([], [si(appuye('D5'), [servo('D6', 90)])]),
      message: 'Quand le bouton D5 est relâché, le moteur D6 devrait être à 0°. Dans ton programme, il reste à 90°.',
    },
  ],
  '13A': [
    {
      nom: 'trappe fermée à 0° au démarrage',
      programme: prog([choix(0), servo('D6', 0)], [choixPetite, choixGrande, si(appuye('D5'), ouvrir(CHOIX))]),
      message: 'Au démarrage, le moteur Trappe (D6) devrait être à 90°. Dans ton programme, il reste à 0°.',
    },
    {
      nom: 'durée fixe de 3 s',
      programme: prog([choix(0), servo('D6', 90)], [choixPetite, choixGrande, si(appuye('D5'), ouvrir(3))]),
      message:
        'Après un appui sur le bouton GrandeDose (D4) puis sur le bouton Trappe (D5), le moteur Trappe (D6) devrait rester à 0° pendant 7 s. Dans ton programme, il reste à 0° pendant 3 s.',
    },
    {
      nom: 'CHOIX oublié pour la grande dose',
      programme: prog([choix(0), servo('D6', 90)], [choixPetite, grande, si(appuye('D5'), ouvrir(CHOIX))]),
      message: 'Dans ton programme, il reste à 0° pendant 3 s.',
    },
    {
      nom: 'oubli de « attendre »',
      programme: prog([choix(0), servo('D6', 90)], [choixPetite, choixGrande, si(appuye('D5'), [led('D11', 1), servo('D6', 0), led('D11', 0), servo('D6', 90)])]),
      message: 'Dans ton programme, il ne va pas à 0°.',
    },
  ],
  '13B': [
    {
      nom: 'solution de 13A (pas de remise à zéro)',
      programme: prog([choix(0), servo('D6', 90)], [choixPetite, choixGrande, si(appuye('D5'), ouvrir(CHOIX))]),
      message:
        'Quand on appuie une deuxième fois sur le bouton Trappe (D5) sans choisir de nouvelle dose, la trappe devrait rester fermée (CHOIX doit revenir à 0 après la distribution). Dans ton programme, le moteur Trappe (D6) va à 0°.',
    },
    {
      nom: 'pas de test de CHOIX, durée fixe',
      programme: prog([choix(0), servo('D6', 90)], [choixPetite, choixGrande, si(appuye('D5'), [...ouvrir(3), choix(0)])]),
      message: 'Dans ton programme, il reste à 0° pendant 3 s.',
    },
    {
      nom: 'test CHOIX = 0 au lieu de ≠',
      programme: prog(
        [choix(0), servo('D6', 90)],
        [choixPetite, choixGrande, si(appuye('D5'), [si(egal(CHOIX, 0), [...ouvrir(CHOIX), choix(0)])])],
      ),
      message: 'Dans ton programme, il ne va pas à 0°.',
    },
    {
      nom: 'test ≠ 0 mais trappe ouverte 5 s',
      programme: prog(
        [choix(0), servo('D6', 90)],
        [choixPetite, choixGrande, si(appuye('D5'), [si(different(CHOIX, 0), [...ouvrir(5), choix(0)])])],
      ),
      message: 'Dans ton programme, il reste à 0° pendant 5 s.',
    },
  ],
};
