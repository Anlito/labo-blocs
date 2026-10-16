// Jalon 4 : mode « En direct ». Le programme tourne dans le navigateur ; on vérifie les lignes envoyées à la carte.
const test = require('node:test');
const assert = require('node:assert/strict');
const { creerDirect, ligneExtension } = require('../noyau/direct.js');

test('LED qui clignote : D 9 1 / D 9 0 au bon moment, rien quand rien ne change', () => {
  const d = creerDirect({ demarrage: [], boucle: [{ bloc: 'led_etat', broche: 'D9', etat: 1 }, { bloc: 'attendre', duree: 1 }, { bloc: 'led_etat', broche: 'D9', etat: 0 }, { bloc: 'attendre', duree: 1 }] }, { composants: [{ type: 'led', broche: 'D9' }] });
  assert.deepEqual(d.depart, ['OFF']);
  assert.deepEqual(d.avancer(0), ['D 9 1']);
  assert.deepEqual(d.avancer(500), []);
  assert.deepEqual(d.avancer(1000), ['D 9 0']);
  assert.deepEqual(d.avancer(2000), ['D 9 1']);
  // Retard (onglet en arrière-plan) : seul le dernier état part.
  assert.deepEqual(d.avancer(5000), ['D 9 0']);
  assert.deepEqual(d.fin, ['OFF']);
});

test('bouton vers la masse : surveillé, « E 3 0 » = appuyé, la LED suit', () => {
  const prog = { demarrage: [], boucle: [{ bloc: 'si_sinon', condition: { bloc: 'comparaison', op: '=', a: { bloc: 'bouton_etat', broche: 'D3' }, b: { bloc: 'valeur_haut_bas', valeur: 1 } }, alors: [{ bloc: 'led_etat', broche: 'D9', etat: 1 }], sinon: [{ bloc: 'led_etat', broche: 'D9', etat: 0 }] }] };
  const d = creerDirect(prog, { composants: [{ type: 'bouton', broche: 'D3' }, { type: 'led', broche: 'D9' }], boutonsVersMasse: true });
  assert.deepEqual(d.depart, ['OFF', 'M 3 P', 'W 3']);
  assert.deepEqual(d.avancer(10), []); // LED déjà éteinte au départ
  assert.ok(d.evenement('E 3 0'));
  assert.deepEqual(d.avancer(20), ['D 9 1']);
  d.evenement('E 3 1');
  assert.deepEqual(d.avancer(30), ['D 9 0']);
  assert.equal(d.evenement('E 7 0'), false, 'broche sans bouton : ignorée');
  assert.deepEqual(d.fin, ['W', 'OFF']);
});

test('servo et note : S et T', () => {
  const d = creerDirect({ demarrage: [{ bloc: 'servo_angle', broche: 'D6', angle: 90 }, { bloc: 'son', broche: 'D8', frequence: 440, duree: 0.5 }], boucle: [] }, { composants: [{ type: 'servo', broche: 'D6' }, { type: 'buzzer', broche: 'D8' }] });
  assert.deepEqual(d.avancer(0), ['S 6 90', 'T 8 440 500']);
});

test('mBot : moteurs en commandes X, distance relue par la carte', () => {
  const prog = { demarrage: [], boucle: [{ bloc: 'si_sinon', condition: { bloc: 'comparaison', op: '<', a: { bloc: 'mbot_distance' }, b: 20 }, alors: [{ bloc: 'mbot_arreter' }], sinon: [{ bloc: 'mbot_deplacer', direction: 'avancer', vitesse: 50 }] }, { bloc: 'attendre', duree: 0.1 }] };
  const d = creerDirect(prog, { carte: 'mbot', composants: [] });
  assert.deepEqual(d.lectures.map((l) => l.ligne), ['X 1 2 3']);
  assert.deepEqual(d.avancer(0), ['X 1 1 50 50']);
  assert.ok(d.lire(d.lectures[0], 'V 8'));
  assert.equal(d.sim.capteurs.distance, 8);
  assert.deepEqual(d.avancer(100), ['X 1 1 0 0']);
  assert.equal(d.lire(d.lectures[0], 'ERR CMD'), false);
});

test('micro:bit : boutons A et B relus, écran et texte envoyés, note au moins 1 s', () => {
  const prog = { demarrage: [{ bloc: 'mb_texte', texte: 'Salut' }], boucle: [{ bloc: 'si_alors', condition: { bloc: 'mb_bouton', bouton: 'A' }, alors: [{ bloc: 'mb_image', image: '3' }, { bloc: 'mb_note', note: '440', duree: 0.5 }] }] };
  const d = creerDirect(prog, { carte: 'microbit', composants: [] });
  assert.deepEqual(d.lectures.map((l) => l.ligne), ['X 2 5']);
  assert.deepEqual(d.avancer(0), ['X 2 14 83 97 108 117', 'X 2 11 116']);
  d.lire(d.lectures[0], 'V 1');
  assert.deepEqual(d.avancer(10), ['X 2 2 3', 'X 2 12 440 1']);
  assert.equal(ligneExtension(1, 1, [33.4, -12.6]), 'X 1 1 33 -13');
});

test('boucle sans attente : un ordre répété ne repart pas, un ordre qui change repart', () => {
  const prog = { demarrage: [], boucle: [{ bloc: 'si_sinon', condition: { bloc: 'mbot_bouton' }, alors: [{ bloc: 'mbot_moteur', moteur: '1', vitesse: 30 }], sinon: [{ bloc: 'mbot_deplacer', direction: 'avancer', vitesse: 50 }] }] };
  const d = creerDirect(prog, { carte: 'mbot', composants: [] });
  assert.deepEqual(d.avancer(1000), ['X 1 1 50 50']);
  assert.deepEqual(d.avancer(2000), []);
  d.lire(d.lectures[0], 'V 1');
  assert.deepEqual(d.avancer(2100), ['X 1 9 1 30']);
  d.lire(d.lectures[0], 'V 0');
  assert.deepEqual(d.avancer(2200), ['X 1 1 50 50']);
});
