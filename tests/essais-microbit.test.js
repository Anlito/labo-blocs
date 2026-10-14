// Jalon 0 (c) : l'interpréteur micro:bit (MicroPython, essais/microbit/main.py) doit donner exactement la même
// chose que l'interpréteur C de la Uno : mêmes changements de sorties, mêmes instants, mêmes tirages au hasard.
// Testé avec python3 et, s'il est installé, avec le micropython de l'ordinateur (même langage que la carte).
const test = require('node:test');
const assert = require('node:assert');
const { chargerExercices } = require('../essais/reference/outils.js');
const simulation = require('../essais/reference/moteur/simulation.js');
const { jouerScenario } = require('../essais/reference/moteur/validation.js');
const faux = require('../essais/reference/programmes-faux.js');
const { compiler, numeroBroche } = require('../essais/code-octet/compilateur.js');
const C = require('../essais/outils/hote.js');
const M = require('../essais/outils/hote-microbit.js');
const { simon, composantsSimon } = require('../essais/outils/mesurer.js');

const pythons = ['python3', 'micropython'].filter(M.present);
const sauter = !C.disponible() ? 'gcc absent' : !pythons.length ? 'python absent' : false;

// Entrées d'un scénario, relevées dans le simulateur de l'atelier (comme essais-interpreteur.test.js).
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

function identiques(octets, duree, e, nom) {
  const attendu = C.executerTexte(octets, duree, e);
  for (const py of pythons) assert.strictEqual(M.executerTexte(py, octets, duree, e), attendu, `${nom} (${py})`);
}

test('exercices 01 à 13B : solutions et programmes faux identiques au micro:bit et dans la Uno', { skip: sauter }, () => {
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

test('Simon (listes, hasard, fonctions) : même partie au micro:bit et dans la Uno', { skip: sauter }, () => {
  const { octets } = compiler(simon, { composants: composantsSimon });
  const appuis = [];
  for (let t = 1000; t < 20000; t += 700) appuis.push({ t, broche: 6 + ((t / 700) % 4 | 0), valeur: 1 }, { t: t + 100, broche: 6 + ((t / 700) % 4 | 0), valeur: 0 });
  identiques(octets, 20000, appuis, 'Simon');
});

test('fils « quand », boucles, opérations, extensions : identiques', { skip: sauter }, () => {
  const led = (broche, etat) => ({ bloc: 'led_etat', broche, etat });
  const att = (s) => ({ bloc: 'attendre', duree: s });
  const op = (o, a, b) => ({ bloc: 'operation', op: o, a, b });
  const p = {
    fils: [
      { quand: 'boucle', corps: [led('D2', 1), att(0.5), led('D2', 0), att(0.5)] },
      { quand: 'appui', broche: 'D8', corps: [led('D3', 1), { bloc: 'servo_angle', broche: 'D6', angle: op('÷', 7, 2) }, att(0.7), led('D3', 0)] },
      { quand: 'relache', broche: 'D8', corps: [{ bloc: 'servo_angle', broche: 'D6', angle: op('+', op('mod', -1, 5), 100) }, { bloc: 'ext', extension: 2, commande: 3, arguments: [1, 2, 9] }] },
      { quand: 'demarrage', corps: [{ bloc: 'repeter_n', fois: 3, corps: [{ bloc: 'son', broche: 'D9', frequence: 440, duree: 0.1 }, att(0.2)] }] },
    ],
  };
  const { octets } = compiler(p, { composants: [{ type: 'bouton', broche: 'D8' }] });
  identiques(octets, 4000, [{ t: 1200, broche: 8, valeur: 1 }, { t: 1500, broche: 8, valeur: 0 }, { t: 1600, broche: 8, valeur: 1 }, { t: 2600, broche: 8, valeur: 0 }], 'fils');
});

test('programme abîmé : refusé de la même façon', { skip: sauter }, () => {
  const { octets } = compiler({ fils: [{ quand: 'demarrage', corps: [{ bloc: 'led_etat', broche: 'D2', etat: 1 }] }] });
  octets[octets.length - 1] ^= 0x33;
  identiques(octets, 10, [], 'abîmé');
});

test('script allégé envoyé dans le micro:bit : même résultat que le script complet', { skip: sauter }, () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { execFileSync } = require('node:child_process');
  const allege = path.join(__dirname, '..', 'essais', 'microbit', 'main-allege.py');
  if (!fs.existsSync(allege)) return;
  // Copie de l'hôte avec le script allégé à la place de main.py.
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'labo-blocs-allege-'));
  fs.mkdirSync(path.join(d, 'faux'));
  for (const f of ['microbit.py', 'music.py']) fs.copyFileSync(path.join(__dirname, '..', 'essais', 'microbit', 'faux', f), path.join(d, 'faux', f));
  fs.copyFileSync(path.join(__dirname, '..', 'essais', 'microbit', 'hote.py'), path.join(d, 'hote.py'));
  fs.copyFileSync(allege, path.join(d, 'main.py'));
  const ex = chargerExercices().find((e) => e.id === '13B');
  const { octets } = compiler(ex.solutionReference, { composants: ex.composants });
  fs.writeFileSync(path.join(d, 'p.bin'), octets);
  jouerScenario(ex, ex.solutionReference, ex.scenarios[0]);
  const texte = M.texteEntrees(entrees) + '\n';
  for (const py of pythons) {
    const r = execFileSync(py, [path.join(d, 'hote.py'), path.join(d, 'p.bin'), String(derniere.t)], { input: texte }).toString();
    assert.strictEqual(r, C.executerTexte(octets, derniere.t, entrees), py);
  }
});
