// Modules de l'Uno pour Escape Lab (16/11/2026) : ultrason HY-SRF05, afficheur 4 chiffres, écran LCD 16×2 I2C,
// clavier tactile 12 touches. Blocs → commandes de l'extension 5, carte simulée, composants d'un exercice libre,
// mode « En direct », parcours Escape Lab et programme de la carte.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const K = require('../noyau/cartes.js');
const { creerSimulation } = require('../noyau/simulation.js');
const { compiler } = require('../noyau/code-octet.js');
const { versBlockly, depuisBlockly, composantsDuProgramme } = require('../noyau/programme.js');
const { creerDirect } = require('../noyau/direct.js');

const ECRAN = { bloc: 'ecran_texte', texte: 'Code ok', ligne: '2' };
const PROGRAMME = {
  demarrage: [ECRAN, { bloc: 'afficheur4_nombre', clk: 'D4', dio: 'D5', valeur: 42 }, { bloc: 'ecran_nombre', ligne: '1', valeur: 3.5 }],
  boucle: [
    { bloc: 'affecter', variable: 'd', valeur: { bloc: 'ultrason_distance', trig: 'D2', echo: 'D3' } },
    { bloc: 'affecter', variable: 't', valeur: { bloc: 'tactile_valeur', rx: 'D6', tx: 'D7' } },
    { bloc: 'attendre', duree: 0.1 },
  ],
};

test('blocs des modules : commandes de l’extension 5, broches en numéros (A0 = 14)', () => {
  assert.deepEqual(K.deroulerBlocCarte({ bloc: 'ultrason_distance', trig: 'D2', echo: 'A1' }), { bloc: 'ext', extension: 5, commande: 1, arguments: [2, 15] });
  assert.deepEqual(K.deroulerBlocCarte({ bloc: 'afficheur4_effacer', clk: 'D12', dio: 'D13' }).arguments, [12, 13]);
  const texte = K.deroulerBlocCarte({ bloc: 'ecran_texte', texte: 'Un texte bien trop long pour l’écran', ligne: '2' });
  assert.deepEqual(texte[0], { bloc: 'ext', extension: 5, commande: 4, arguments: [2] });
  assert.ok(texte.slice(1).every((m) => m.arguments.length <= 4));
  assert.equal(texte.slice(1).reduce((n, m) => n + m.arguments.length, 0), 16, '16 caractères au plus');
  assert.equal(texte[texte.length - 1].commande, 6);
  const touche = K.deroulerBlocCarte({ bloc: 'tactile_touche', touche: '#', rx: 'D2', tx: 'D3' });
  assert.equal(touche.b, 11);
  assert.equal(K.deroulerBlocCarte({ bloc: 'tactile_touche', touche: 'aucune', rx: 'D2', tx: 'D3' }).b, -1);
  // Les blocs ne donnent jamais la réponse : chaque broche part de D2.
  for (const t of K.BLOCS_MODULES) for (const c of Object.values(K.BLOCS_CARTES[t].champs || {})) if (Array.isArray(c) && c === K.BROCHES_MODULES) assert.equal(c[0][1], 'D2');
});

test('blocs des modules : compilés, relus par Blockly à l’identique', () => {
  const r = compiler(PROGRAMME);
  assert.deepEqual(r.erreurs, []);
  const relu = depuisBlockly(versBlockly(PROGRAMME));
  assert.deepEqual(compiler(relu.programme).octets, r.octets);
});

test('Uno simulée : afficheur, écran, distance de l’ultrason, touches du clavier tactile', () => {
  const sim = creerSimulation(PROGRAMME, { carte: 'uno' });
  sim.avancerJusqua(50);
  assert.equal(sim.carte.afficheur4, '  42');
  assert.deepEqual(sim.carte.lignesEcran, ['3,5', 'Code ok']);
  assert.equal(sim.variables.d, 100);
  assert.equal(sim.variables.t, -1);
  sim.capteurs.distance = 12;
  sim.changerEntree(K.entreeTactile('5'), 1);
  sim.avancerJusqua(200);
  assert.equal(sim.variables.d, 12);
  assert.equal(sim.variables.t, 5);
  // Touche relâchée : la dernière touche reste, jusqu'à « oublier ».
  sim.changerEntree(K.entreeTactile('5'), 0);
  sim.changerEntree(K.entreeTactile('*'), 1);
  sim.avancerJusqua(400);
  assert.equal(sim.variables.t, 10);
  assert.equal(K.texteAfficheur4(12345), '----');
  assert.equal(K.texteAfficheur4(-7), '  -7');
});

test('exercice libre : un composant par module, avec ses broches', () => {
  const { composants } = composantsDuProgramme(PROGRAMME, 'uno');
  assert.deepEqual(
    composants.map((c) => c.type),
    ['ecran', 'afficheur4', 'ultrason', 'tactile'],
  );
  assert.deepEqual(composants.find((c) => c.type === 'ultrason'), { type: 'ultrason', broche: 'D2', echo: 'D3' });
  assert.deepEqual(composants.find((c) => c.type === 'tactile'), { type: 'tactile', broche: 'D6', tx: 'D7' });
});

test('En direct : l’écran part en un seul ordre, l’ultrason et le clavier sont relus sur la carte', () => {
  const d = creerDirect(PROGRAMME, { carte: 'uno' });
  const lignes = d.avancer(50);
  assert.deepEqual(lignes.filter((l) => /^X 5 [456] /.test(l)), ['X 5 4 2', 'X 5 5 67 111 100 101', 'X 5 6 32 111 107']);
  assert.ok(lignes.includes('X 5 2 4 5 42'));
  assert.ok(lignes.includes('X 5 7 1 4'), 'les nombres sont arrondis en direct');
  assert.deepEqual(d.lectures.map((l) => l.ligne).sort(), ['X 5 1 2 3', 'X 5 9 6 7']);
  const clavier = d.lectures.find((l) => l.ligne === 'X 5 9 6 7');
  assert.ok(d.lire(clavier, 'V 3'));
  d.avancer(300);
  assert.equal(d.sim.variables.t, 3);
  // Le même texte redonné ne repart pas.
  assert.equal(d.avancer(600).filter((l) => /^X 5 [456] /.test(l)).length, 0);
});

test('parcours Escape Lab (Uno) : les blocs des modules dans chaque exercice', () => {
  let p;
  global.definirParcours = (x) => (p = x);
  require('../parcours/escape-lab/parcours.js');
  for (const e of p.exercices) for (const b of K.BLOCS_MODULES) assert.ok(e.blocsAutorises.includes(b), `${e.id} : ${b}`);
  assert.deepEqual(K.CATEGORIES_CARTES.filter((c) => c.carte === 'uno').map((c) => c.nom), ['Relais', 'Mouvement', 'Ultrason', 'Afficheur 4 chiffres', 'Écran', 'Clavier tactile']);
});

test('programme de la carte Uno : extension 5, I2C sans la bibliothèque Wire', () => {
  const ino = fs.readFileSync(path.join(__dirname, '..', 'cartes', 'arduino', 'labo_blocs', 'labo_blocs.ino'), 'utf8');
  assert.match(ino, /if \(extension == 5\) return extModules\(commande, n, a\);/);
  assert.doesNotMatch(ino, /#include <Wire\.h>/);
  for (let c = 1; c <= 10; c++) assert.match(ino, new RegExp(`case ${c}:`));
});

test('capteur de mouvement HC-SR501 : entrée sans résistance, HAUT = mouvement ; surveillé en direct sans inversion', () => {
  const p = { demarrage: [], boucle: [{ bloc: 'si_sinon', condition: { bloc: 'mouvement_detecte', broche: 'D8' }, alors: [{ bloc: 'led_etat', broche: 'D9', etat: 1 }], sinon: [{ bloc: 'led_etat', broche: 'D9', etat: 0 }] }, { bloc: 'attendre', duree: 0.05 }] };
  assert.deepEqual(compiler(p).erreurs, []);
  const { composants } = composantsDuProgramme(p, 'uno');
  assert.deepEqual(composants.find((c) => c.type === 'mouvement'), { type: 'mouvement', broche: 'D8' });
  const sim = creerSimulation(p, { carte: 'uno', composants });
  sim.avancerJusqua(100);
  assert.equal(sim.sorties.D9, 0);
  sim.changerEntree('D8', 1);
  sim.avancerJusqua(200);
  assert.equal(sim.sorties.D9, 1);
  const d = creerDirect(p, { carte: 'uno', composants });
  assert.ok(d.depart.includes('M 8 I'), 'entrée simple, sans résistance interne');
  assert.ok(d.depart.includes('W 8'));
  d.evenement('E 8 1');
  d.avancer(100);
  assert.equal(d.sim.sorties.D9, 1, 'niveau HAUT = mouvement (pas inversé comme un bouton)');
});

test('relais : HAUT = enclenché (sortie numérique), affiché dans les composants, ordre « D » en direct', () => {
  const p = { demarrage: [{ bloc: 'relais_etat', etat: '1', broche: 'D8' }, { bloc: 'attendre', duree: 1 }, { bloc: 'relais_etat', etat: '0', broche: 'D8' }], boucle: [] };
  assert.deepEqual(compiler(p).erreurs, []);
  const { composants } = composantsDuProgramme(p, 'uno');
  assert.deepEqual(composants, [{ type: 'relais', broche: 'D8' }]);
  const sim = creerSimulation(p, { carte: 'uno', composants });
  sim.avancerJusqua(500);
  assert.equal(sim.sorties.D8, 1);
  sim.avancerJusqua(1500);
  assert.equal(sim.sorties.D8, 0);
  const d = creerDirect(p, { carte: 'uno', composants });
  assert.ok(d.avancer(100).includes('D 8 1'));
  assert.ok(d.avancer(1500).includes('D 8 0'));
});
