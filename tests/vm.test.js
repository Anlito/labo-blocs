// Le simulateur (noyau/vm.js) doit faire exactement ce que fait la carte : même sortie, mot pour mot, que
// l'interpréteur C de la Uno et du mBot (essais/vm/hote.c), sur les 14 exercices du distributeur (solutions et
// programmes faux), le Simon, les fils « quand » et les blocs nouveaux.
const test = require('node:test');
const assert = require('node:assert');
const { chargerExercices } = require('../essais/reference/outils.js');
const simulation = require('../essais/reference/moteur/simulation.js');
const { jouerScenario } = require('../essais/reference/moteur/validation.js');
const faux = require('../essais/reference/programmes-faux.js');
const { compiler, numeroBroche } = require('../noyau/code-octet.js');
const C = require('../essais/outils/hote.js');
const JS = require('./outils/hote-js.js');
const { simon, composantsSimon } = require('../essais/outils/mesurer.js');

const sauter = C.disponible() ? false : 'gcc absent';

const creer = simulation.creerSimulation;
let derniere = null;
let entrees = [];
simulation.creerSimulation = (...a) => {
  derniere = creer(...a);
  entrees = [];
  const planifier = derniere.planifierEntree;
  derniere.planifierEntree = (t, broche, valeur) => {
    entrees.push({ t: Math.max(t, derniere.t), broche: numeroBroche(broche), valeur, apres: t <= derniere.t });
    planifier(t, broche, valeur);
  };
  return derniere;
};

const identiques = (octets, duree, e, nom) => assert.strictEqual(JS.executerTexte(octets, duree, e), C.executerTexte(octets, duree, e), nom);

test('exercices 01 à 13B : le simulateur fait exactement ce que fait la carte', { skip: sauter }, () => {
  for (const ex of chargerExercices()) {
    for (const p of [{ nom: 'solution', programme: ex.solutionReference }, ...(faux[ex.id] || [])]) {
      const { octets } = compiler(p.programme, { composants: ex.composants });
      for (const [i, s] of (ex.scenarios || []).entries()) {
        jouerScenario(ex, p.programme, s);
        identiques(octets, derniere.t, entrees, `exercice ${ex.id}, ${p.nom}, scénario ${i + 1}`);
      }
    }
  }
});

test('Simon (listes, hasard, fonctions) : même partie', { skip: sauter }, () => {
  const { octets } = compiler(simon, { composants: composantsSimon });
  const appuis = [];
  for (let t = 1000; t < 20000; t += 700) appuis.push({ t, broche: 6 + ((t / 700) % 4 | 0), valeur: 1 }, { t: t + 100, broche: 6 + ((t / 700) % 4 | 0), valeur: 0 });
  identiques(octets, 20000, appuis, 'Simon');
});

test('fils « quand », boucles, opérations, extensions, programme abîmé : identiques', { skip: sauter }, () => {
  const led = (broche, etat) => ({ bloc: 'led_etat', broche, etat });
  const att = (s) => ({ bloc: 'attendre', duree: s });
  const op = (o, a, b) => ({ bloc: 'operation', op: o, a, b });
  const p = {
    fils: [
      { quand: 'boucle', corps: [led('D2', 1), att(0.5), led('D2', 0), att(0.5)] },
      { quand: 'appui', broche: 'D8', corps: [led('D3', 1), { bloc: 'servo_angle', broche: 'D6', angle: op('÷', 7, 2) }, att(0.7), led('D3', 0)] },
      { quand: 'relache', broche: 'D8', corps: [{ bloc: 'servo_angle', broche: 'D6', angle: op('+', op('mod', -1, 5), 100) }, { bloc: 'ext', extension: 2, commande: 3, arguments: [1, 2, 9] }] },
      { quand: 'demarrage', corps: [{ bloc: 'repeter_n', fois: 3, corps: [{ bloc: 'son', broche: 'D9', frequence: 440, duree: 0.1 }, att(0.2)] }] },
      { quand: 'appui', broche: 'D7', corps: [{ bloc: 'tant_que', condition: 1, corps: [{ bloc: 'ajouter_a', variable: 'x', valeur: 1 }] }] },
    ],
  };
  const { octets } = compiler(p, { composants: [{ type: 'bouton', broche: 'D8' }] });
  identiques(octets, 4000, [{ t: 1200, broche: 8, valeur: 1 }, { t: 1500, broche: 8, valeur: 0 }, { t: 1600, broche: 8, valeur: 1 }, { t: 2600, broche: 8, valeur: 0 }, { t: 3000, broche: 7, valeur: 1 }], 'fils');
  octets[octets.length - 1] ^= 0x33;
  identiques(octets, 10, [], 'abîmé');
});
