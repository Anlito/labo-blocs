// Bloc « ré-étalonner … depuis (a, b) vers (c, d) » et « valeur du joystick (0 à 1023) » : du joystick à l'angle d'un
// servomoteur (projet Labyrinthe robotisé). Déroulés en blocs de base : aucun nouvel ordre pour les cartes.
const test = require('node:test');
const assert = require('node:assert/strict');
const { compiler, deroulerReetalonner } = require('../noyau/code-octet.js');
const { creerSimulation } = require('../noyau/simulation.js');
const { versBlockly, depuisBlockly, typesDeBlocs } = require('../noyau/programme.js');
const { versArduino } = require('../noyau/arduino.js');
const V = require('../noyau/validation.js');

const JOYSTICK = { type: 'joystick', broche: 'A0', y: 'A1', bouton: 'D4' };
const COMPOSANTS = [JOYSTICK, { type: 'servo', broche: 'D5' }, { type: 'servo', broche: 'D6' }];
const reetalonner = (valeur, de1, de2, vers1, vers2) => ({ bloc: 'reetalonner', valeur, de1, de2, vers1, vers2 });
// Le programme du kit : X depuis (1023, 0), Y depuis (0, 1023) vers (180, 0), limité ici à 60–120°.
const PROGRAMME = {
  format: 'labo-blocs/programme',
  version: 1,
  fils: [
    { quand: 'demarrage', corps: [] },
    {
      quand: 'boucle',
      corps: [
        { bloc: 'affecter', variable: 'VRX', valeur: { bloc: 'joystick_valeur', axe: 'x' } },
        { bloc: 'affecter', variable: 'VRY', valeur: { bloc: 'joystick_valeur', axe: 'y' } },
        { bloc: 'affecter', variable: 'MoteurX', valeur: reetalonner({ bloc: 'variable', variable: 'VRX' }, 1023, 0, 60, 120) },
        { bloc: 'affecter', variable: 'MoteurY', valeur: reetalonner({ bloc: 'variable', variable: 'VRY' }, 0, 1023, 120, 60) },
        { bloc: 'servo_angle', broche: 'D5', angle: { bloc: 'variable', variable: 'MoteurX' } },
        { bloc: 'servo_angle', broche: 'D6', angle: { bloc: 'variable', variable: 'MoteurY' } },
      ],
    },
  ],
};

// Calcule une expression déroulée comme le simulateur (reste du signe du diviseur, division par 0 → 0).
function evaluer(e) {
  if (typeof e === 'number') return e;
  const a = evaluer(e.a);
  const b = evaluer(e.b);
  switch (e.op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? 0 : a / b;
    case 'mod': { const r = a % b; return r !== 0 && r < 0 !== b < 0 ? r + b : r; }
  }
  throw new Error(e.op);
}

test('calcul : proportions gardées, arrondi à l’entier, échelle inversée, a = b → c', () => {
  const r = (v, a, b, c, d) => evaluer(deroulerReetalonner(reetalonner(v, a, b, c, d)));
  assert.equal(r(0, 0, 1023, 0, 180), 0);
  assert.equal(r(1023, 0, 1023, 0, 180), 180);
  assert.equal(r(512, 0, 1023, 0, 180), 90);
  assert.equal(r(512, 1023, 0, 60, 120), 90);
  assert.equal(r(0, 1023, 0, 60, 120), 120);
  assert.equal(r(1023, 0, 1023, 80, 100), 100);
  assert.equal(r(-100, -100, 100, 0, 180), 0);
  assert.equal(r(25, 0, 100, 0, 10), 3, '2,5 arrondi à 3');
  assert.equal(r(-25, 0, 100, 0, 10), -2, '-2,5 arrondi vers le haut, comme floor(x + 0,5)');
  assert.equal(r(500, 7, 7, 42, 99), 42);
});

test('programme : compilé, relu par Blockly à l’identique, types de blocs', () => {
  const r = compiler(PROGRAMME, { composants: COMPOSANTS });
  assert.deepEqual(r.erreurs, []);
  const relu = depuisBlockly(versBlockly(PROGRAMME));
  assert.deepEqual(compiler(relu.programme, { composants: COMPOSANTS }).octets, r.octets);
  assert.ok(typesDeBlocs(PROGRAMME).includes('reetalonner') && typesDeBlocs(PROGRAMME).includes('joystick_valeur'));
  // Une case qui reçoit un bloc garde un bloc fantôme (valeur de départ) dessous, comme dans la palette.
  const blocs = [];
  (function chercher(x) {
    if (!x || typeof x !== 'object') return;
    if (x.type === 'reetalonner') blocs.push(x);
    Object.values(x).forEach(chercher);
  })(versBlockly(PROGRAMME));
  assert.equal(blocs.length, 2);
  assert.equal(blocs[0].inputs.VALEUR.shadow.fields.NUM, 0);
  assert.equal(blocs[0].inputs.VALEUR.block.type, 'variable');
  assert.equal(blocs[0].inputs.DE_MIN.shadow.fields.NUM, 1023);
});

test('simulateur : les servos suivent le joystick (valeur brute 0 à 1023)', () => {
  const sim = creerSimulation(PROGRAMME, { composants: COMPOSANTS });
  sim.avancerJusqua(100);
  assert.equal(sim.variables.VRX, 512);
  assert.equal(sim.sorties.D5, 90);
  assert.equal(sim.sorties.D6, 90);
  sim.changerAnalogique('A0', 1023);
  sim.changerAnalogique('A1', 0);
  sim.avancerJusqua(200);
  assert.equal(sim.sorties.D5, 60);
  assert.equal(sim.sorties.D6, 120);
  sim.changerAnalogique('A0', 0);
  sim.avancerJusqua(300);
  assert.equal(sim.sorties.D5, 120);
});

test('scénario : joystick poussé à droite → servo D5 à 60°, au centre → 90°', () => {
  const ex = {
    composants: COMPOSANTS,
    blocsAutorises: ['joystick_valeur', 'reetalonner', 'servo_angle', 'affecter', 'variable'],
    scenarios: [{ etapes: [{ regler: { joystick: 0 } }, { verifier: { D5: 90 } }, { regler: { joystick: 4 } }, { verifier: { D5: 60 } }] }],
  };
  assert.equal(V.jouerScenario(ex, PROGRAMME, ex.scenarios[0]).reussi, true);
});

test('code Arduino : fonction reetalonner(), analogRead des axes', () => {
  const code = versArduino(PROGRAMME, { composants: COMPOSANTS }).code;
  assert.match(code, /float reetalonner\(float v, float a, float b, float c, float d\)/);
  assert.match(code, /floor\(c \+ \(v - a\) \* \(d - c\) \/ \(b - a\) \+ 0\.5\)/);
  assert.match(code, /VRX = analogRead\(A0\)/);
  assert.match(code, /reetalonner\(VRX, 1023, 0, 60, 120\)/);
});
