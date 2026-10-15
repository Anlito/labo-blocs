// Simulateur : pas à pas, bloc en cours, variables, hasard reproductible.
const test = require('node:test');
const assert = require('node:assert');
const { creerSimulation } = require('../noyau/simulation.js');

const led = (id, broche, etat) => ({ bloc: 'led_etat', id, broche, etat });
const att = (id, s) => ({ bloc: 'attendre', id, duree: s });

test('pas à pas : un bloc à la fois, attentes sautées, la boucle recommence', () => {
  const sim = creerSimulation({ demarrage: [led('a', 'D2', 1)], boucle: [led('b', 'D3', 1), att('c', 2), led('d', 'D3', 0)] }, { composants: [{ type: 'led', broche: 'D2' }, { type: 'led', broche: 'D3' }] });
  const vus = [];
  for (let i = 0; i < 6; i++) {
    sim.pas();
    vus.push(sim.blocEnCours);
  }
  assert.deepStrictEqual(vus, ['a', 'b', 'c', 'd', 'b', 'c']);
  assert.strictEqual(sim.t, 2000); // une attente de 2 s sautée
  assert.strictEqual(sim.valeur('D2'), 1);
});

test('bloc en cours pendant une attente, variables nommées', () => {
  const sim = creerSimulation({ demarrage: [{ bloc: 'affecter', id: 'v', variable: 'CHOIX', valeur: 7 }], boucle: [led('b', 'D3', 1), att('c', 1)] }, {});
  sim.avancerJusqua(500);
  assert.strictEqual(sim.blocEnCours, 'c');
  assert.strictEqual(sim.variables.CHOIX, 7);
});

test('hasard : la même graine donne le même tirage', () => {
  const p = { fils: [{ quand: 'boucle', corps: [{ bloc: 'servo_angle', broche: 'D6', angle: { bloc: 'hasard', min: 0, max: 180 } }, { bloc: 'attendre', duree: 0.1 }] }] };
  const tirage = (g) => {
    const s = creerSimulation(p, { graine: g });
    s.avancerJusqua(1000);
    return s.journal.map((e) => e.valeur).join(',');
  };
  assert.strictEqual(tirage(4), tirage(4));
  assert.notStrictEqual(tirage(4), tirage(5));
});

test('bouton « quand … appuyé » dans le simulateur', () => {
  const p = { fils: [{ quand: 'appui', broche: 'D8', corps: [led('x', 'D3', 1), att('y', 1), led('z', 'D3', 0)] }] };
  const sim = creerSimulation(p, { composants: [{ type: 'bouton', broche: 'D8' }, { type: 'led', broche: 'D3' }] });
  sim.avancerJusqua(100);
  sim.changerEntree('D8', 1);
  sim.avancerJusqua(200);
  assert.strictEqual(sim.valeur('D3'), 1);
  assert.strictEqual(sim.blocEnCours, 'y');
  sim.avancerJusqua(1200);
  assert.strictEqual(sim.valeur('D3'), 0);
});
