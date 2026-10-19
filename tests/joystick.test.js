// Joystick 2 axes + bouton (module KY-023) sur l'Arduino Uno et la micro:bit : blocs « position », « direction »,
// « bouton du joystick » et « quand le joystick est poussé… ». Ses broches sont réglées par l'exercice.
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../noyau/cartes.js');
const { compiler } = require('../noyau/code-octet.js');
const { creerSimulation } = require('../noyau/simulation.js');
const { versBlockly, depuisBlockly, typesDeBlocs, composantsDuProgramme } = require('../noyau/programme.js');
const { creerDirect } = require('../noyau/direct.js');
const { versArduino } = require('../noyau/arduino.js');
const V = require('../noyau/validation.js');
const E = require('../noyau/edition.js');

const JOYSTICK = { type: 'joystick', broche: 'A0', y: 'A1', bouton: 'D2' };
const COMPOSANTS = [JOYSTICK, { type: 'led', broche: 'D9' }, { type: 'led', broche: 'D10' }];
// Poussé vers le haut → LED D9 ; bouton du joystick → LED D10 ; « quand poussé vers la gauche » compte.
const PROGRAMME = {
  format: 'labo-blocs/programme',
  version: 1,
  fils: [
    { quand: 'demarrage', corps: [{ bloc: 'affecter', variable: 'gauche', valeur: 0 }] },
    {
      quand: 'boucle',
      corps: [
        { bloc: 'si_sinon', condition: { bloc: 'joystick_direction', direction: 'haut' }, alors: [{ bloc: 'led_etat', broche: 'D9', etat: 1 }], sinon: [{ bloc: 'led_etat', broche: 'D9', etat: 0 }] },
        { bloc: 'si_sinon', condition: { bloc: 'joystick_bouton' }, alors: [{ bloc: 'led_etat', broche: 'D10', etat: 1 }], sinon: [{ bloc: 'led_etat', broche: 'D10', etat: 0 }] },
        { bloc: 'affecter', variable: 'x', valeur: { bloc: 'joystick_position', axe: 'x' } },
      ],
    },
    { quand: 'joystick', direction: 'gauche', corps: [{ bloc: 'ajouter_a', variable: 'gauche', valeur: 1 }] },
  ],
};

test('composant : broches de départ (Uno A0/A1/D2, micro:bit P0/P1/P2), bouton à la masse, valeurs des directions', () => {
  assert.deepEqual(K.nouveauJoystick('uno'), JOYSTICK);
  assert.deepEqual(K.nouveauJoystick('microbit'), { type: 'joystick', broche: 'P0', y: 'P1', bouton: 'P2' });
  assert.ok(K.profil('uno').composants.includes('joystick') && K.profil('microbit').composants.includes('joystick'));
  assert.ok(!K.profil('mbot').composants.includes('joystick'));
  assert.deepEqual(K.brutsJoystick('haut'), { x: 512, y: 1023 });
  assert.deepEqual(K.brutsJoystick('gauche', { inverserX: true }), { x: 1023, y: 512 });
  assert.deepEqual(K.composantsJoystick(COMPOSANTS).map((c) => [c.type, c.broche]), [['bouton', 'D2']]);
  assert.ok(E.TYPES_COMPOSANTS.some((t) => t.type === 'joystick'));
});

test('programme : compilé, relu par Blockly à l’identique ; joystick absent des composants → message', () => {
  const r = compiler(PROGRAMME, { composants: COMPOSANTS });
  assert.deepEqual(r.erreurs, []);
  const relu = depuisBlockly(versBlockly(PROGRAMME));
  assert.deepEqual(compiler(relu.programme, { composants: COMPOSANTS }).octets, r.octets);
  for (const t of ['quand_joystick', 'joystick_direction', 'joystick_bouton', 'joystick_position']) assert.ok(typesDeBlocs(PROGRAMME).includes(t), t);
  assert.deepEqual(compiler(PROGRAMME, { composants: [{ type: 'led', broche: 'D9' }, { type: 'led', broche: 'D10' }] }).erreurs, ['Ce programme utilise le joystick : il manque dans les composants de l’exercice.']);
  // Exercice libre : le joystick est ajouté aux composants déduits du programme.
  assert.ok(composantsDuProgramme(PROGRAMME, 'microbit').composants.some((c) => c.type === 'joystick' && c.broche === 'P0'));
});

test('simulateur : position -100 à 100, direction au-delà de 50, bouton, « quand poussé » une fois par poussée', () => {
  const sim = creerSimulation(PROGRAMME, { composants: COMPOSANTS });
  sim.avancerJusqua(100);
  assert.equal(sim.sorties.D9, 0);
  assert.equal(sim.variables.x, 0);
  sim.changerAnalogique('A1', 1023);
  sim.avancerJusqua(200);
  assert.equal(sim.sorties.D9, 1);
  sim.changerAnalogique('A1', 512);
  sim.changerAnalogique('A0', 0);
  sim.avancerJusqua(300);
  assert.equal(sim.sorties.D9, 0);
  assert.equal(sim.variables.x, -100);
  sim.avancerJusqua(1000);
  assert.equal(sim.variables.gauche, 1, 'tenu à gauche : une seule fois');
  sim.changerAnalogique('A0', 512);
  sim.avancerJusqua(1100);
  sim.changerAnalogique('A0', 100);
  sim.avancerJusqua(1200);
  assert.equal(sim.variables.gauche, 2);
  sim.changerAnalogique('A0', 700); // position 37 : pas encore « vers la droite »
  sim.avancerJusqua(1300);
  assert.equal(sim.variables.x, 37);
  sim.changerEntree('D2', 1);
  sim.avancerJusqua(1400);
  assert.equal(sim.sorties.D10, 1);
});

test('En direct : bouton du joystick surveillé (résistance interne), axes relus par « RA »', () => {
  const d = creerDirect(PROGRAMME, { composants: COMPOSANTS, boutonsVersMasse: false });
  assert.deepEqual(d.depart, ['OFF', 'M 2 P', 'W 2']);
  assert.deepEqual(d.lectures.map((l) => l.ligne), ['RA 14', 'RA 15']);
  d.avancer(0);
  assert.equal(d.lire(d.lectures[1], 'V 15 1000'), true);
  assert.deepEqual(d.avancer(50), ['D 9 1']);
  assert.equal(d.evenement('E 2 0'), true);
  assert.deepEqual(d.avancer(100), ['D 10 1']);
});

test('scénarios : « Régler : le joystick est poussé vers le haut », phrases sans « tu as faux »', () => {
  const ex = {
    composants: COMPOSANTS,
    blocsAutorises: ['joystick_direction', 'joystick_bouton', 'si_sinon', 'led_etat'],
    scenarios: [{ etapes: [{ regler: { joystick: 1 } }, { verifier: { D9: 1 } }, { regler: { joystick: 0 } }, { verifier: { D9: 0 } }, { maintenir: 'D2' }, { verifier: { D10: 1 } }] }],
  };
  assert.equal(V.jouerScenario(ex, PROGRAMME, ex.scenarios[0]).reussi, true);
  const sansLed = JSON.parse(JSON.stringify(PROGRAMME).replace('"broche":"D9","etat":1', '"broche":"D9","etat":0'));
  assert.match(V.jouerScenario(ex, sansLed, ex.scenarios[0]).message, /^Quand le joystick est poussé vers le haut, la LED D9 devrait être allumée/);
  assert.equal(E.decrireEtape({ regler: { joystick: 3 } }, ex), 'Régler : le joystick est poussé vers la gauche');
  assert.equal(E.decrireEtape({ maintenir: 'D2' }, ex), 'Maintenir appuyé le bouton du joystick');
  // Les réglages du joystick ne sont proposés qu'aux exercices qui en ont un.
  assert.ok(E.capteursExercice(ex, 'uno').some((c) => c.nom === 'joystick'));
  assert.ok(!E.capteursExercice({ composants: [] }, 'uno').some((c) => c.nom === 'joystick'));
});

test('code Arduino : positionJoystick(), bouton en INPUT_PULLUP, axe inversé', () => {
  const code = versArduino(PROGRAMME, { composants: COMPOSANTS }).code;
  assert.match(code, /int positionJoystick\(int broche\)/);
  assert.match(code, /pinMode\(2, INPUT_PULLUP\)/);
  assert.match(code, /digitalRead\(2\) == LOW/);
  const inverse = versArduino(PROGRAMME, { composants: [Object.assign({}, JOYSTICK, { inverserX: true }), COMPOSANTS[1], COMPOSANTS[2]] }).code;
  assert.match(inverse, /-positionJoystick\(A0\)/);
});
