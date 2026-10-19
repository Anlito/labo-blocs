// Dessin de l'écran de la micro:bit (5 × 5, programme de la carte 0.3) : le même dessin dans le simulateur, en mode
// « En direct » et dans le MicroPython de la carte.
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const K = require('../noyau/cartes.js');
const { compiler } = require('../noyau/code-octet.js');
const { creerSimulation } = require('../noyau/simulation.js');
const { versBlockly, depuisBlockly } = require('../noyau/programme.js');
const { creerDirect } = require('../noyau/direct.js');
const H = require('./outils/hote-cartes.js');

// Un dessin qui n'a rien de symétrique : le coin en haut à gauche, la diagonale, le coin en bas à droite… sauf un point.
const DESSIN = '1100001000001000001000011';
const PROGRAMME = { demarrage: [{ bloc: 'mb_dessin', dessin: DESSIN }], boucle: [] };

test('bloc « afficher le dessin » : 2 valeurs exactes, relu par Blockly à l’identique', () => {
  const [a, b] = K.valeursDessinMicrobit(DESSIN);
  assert.ok(a < 2 ** 15 && b < 2 ** 10);
  const r = compiler(PROGRAMME);
  assert.deepEqual(r.erreurs, []);
  assert.deepEqual(compiler(depuisBlockly(versBlockly(PROGRAMME)).programme).octets, r.octets);
  assert.deepEqual(K.deroulerBlocCarte({ bloc: 'mb_dessin', dessin: DESSIN }), { bloc: 'ext', extension: 2, commande: 15, arguments: [a, b] });
  // Un dessin abîmé (sauvegarde modifiée à la main) s'affiche vide.
  assert.deepEqual(K.valeursDessinMicrobit('2x'), [0, 0]);
  assert.equal(K.PROFILS.microbit.version, '0.3');
});

test('simulateur : l’écran montre le dessin, point par point', () => {
  const sim = creerSimulation(PROGRAMME, { carte: 'microbit' });
  sim.avancerJusqua(10);
  assert.deepEqual(K.ecranA(sim.carte, 10), DESSIN.split('').map((c) => Number(c) * 9));
});

test('En direct : une seule commande ; le même dessin répété ne repart pas', () => {
  const d = creerDirect({ demarrage: [], boucle: [{ bloc: 'mb_dessin', dessin: DESSIN }, { bloc: 'attendre', duree: 0.1 }] }, { carte: 'microbit', composants: [] });
  const [a, b] = K.valeursDessinMicrobit(DESSIN);
  assert.deepEqual(d.avancer(0), [`X 2 15 ${a} ${b}`]);
  assert.deepEqual(d.avancer(1000), []);
});

const pythons = ['python3', 'micropython'].filter(H.present);
test('programme de la micro:bit (MicroPython) : le même dessin sur l’écran', { skip: !pythons.length && 'python absent' }, () => {
  const [a, b] = K.valeursDessinMicrobit(DESSIN);
  const script = [
    'import sys',
    `sys.path[:0] = [${JSON.stringify(path.join(H.CARTES, 'microbit', 'faux'))}, ${JSON.stringify(path.join(H.CARTES, 'microbit'))}]`,
    'import main',
    'vu = []',
    'class Ecran:',
    '    def show(self, image, *a, **k): vu.append(image)',
    'main.display = Ecran()',
    'main.Image = lambda s: s',
    `main.h_ext(2, 15, [${a}.0, ${b}.0])`,
    'print(vu[0])',
  ].join('\n');
  const image = execFileSync(pythons[0], ['-c', script], { env: Object.assign({}, process.env, { PYTHONDONTWRITEBYTECODE: '1' }) }).toString().trim();
  const attendu = DESSIN.match(/.{5}/g).map((l) => l.replace(/1/g, '9')).join(':');
  assert.equal(image, attendu);
});
