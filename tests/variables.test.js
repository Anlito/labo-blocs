// Variables créées par les élèves : noms acceptés, refusés (avec une phrase qui dit quoi faire), relus d'une sauvegarde.
const test = require('node:test');
const assert = require('node:assert');
const { nomDeVariable, variablesDeSauvegarde, versBlockly } = require('../noyau/programme.js');
const { controler } = require('../noyau/parcours.js');
const { compiler } = require('../noyau/code-octet.js');
const { creerSimulation } = require('../noyau/simulation.js');
const { versArduino } = require('../noyau/arduino.js');

test('noms de variables : simplifiés, refusés avec une phrase utile', () => {
  assert.deepStrictEqual(nomDeVariable('  ma vitesse '), { ok: true, nom: 'ma_vitesse' });
  assert.deepStrictEqual(nomDeVariable('Écart'), { ok: true, nom: 'Ecart' });
  assert.match(nomDeVariable('').message, /Écris un nom/);
  assert.match(nomDeVariable('2eme').message, /commence par une lettre/);
  assert.match(nomDeVariable('unNomBeaucoupTropLong').message, /trop long/);
  assert.match(nomDeVariable('delay').message, /mot du langage/);
  assert.match(nomDeVariable('vitesse', ['Vitesse']).message, /existe déjà/);
});

test('les variables d’une sauvegarde Blockly sont retrouvées (menus prêts avant le chargement)', () => {
  const sauvegarde = versBlockly({
    demarrage: [{ bloc: 'affecter', variable: 'vitesse', valeur: { bloc: 'nombre', valeur: 3 } }],
    boucle: [{ bloc: 'ajouter_a', variable: 'compteur', valeur: { bloc: 'variable', variable: 'vitesse' } }],
  });
  assert.deepStrictEqual(variablesDeSauvegarde(sauvegarde).sort(), ['compteur', 'vitesse']);
});

test('une variable créée par l’élève marche partout : simulateur, carte, code Arduino', () => {
  const p = {
    format: 'labo-blocs/programme',
    version: 1,
    fils: [
      { quand: 'demarrage', corps: [{ bloc: 'affecter', variable: 'vitesse', valeur: { bloc: 'nombre', valeur: 2 } }] },
      { quand: 'boucle', corps: [{ bloc: 'ajouter_a', variable: 'vitesse', valeur: { bloc: 'nombre', valeur: 1 } }, { bloc: 'attendre', duree: { bloc: 'nombre', valeur: 1 } }] },
    ],
  };
  assert.deepStrictEqual(compiler(p, {}).erreurs, []);
  const sim = creerSimulation(p, {});
  sim.avancerJusqua(2500);
  assert.strictEqual(sim.variables.vitesse, 5);
  assert.match(versArduino(p, {}).code, /float vitesse = 0;/);
});

test('variables d’un exercice : noms contrôlés à la publication', () => {
  const ex = (variables) => ({ format: 'labo-blocs/parcours', id: 'p', exercices: [{ id: 'e1', numero: '1', titre: 'T', libre: true, variables }] });
  assert.deepStrictEqual(controler(ex(['vitesse', 'score_2'])), []);
  assert.deepStrictEqual(controler(ex([])), []);
  assert.match(controler(ex(['ma vitesse'])).join(), /noms de variables invalides/);
});
