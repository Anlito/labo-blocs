// Robot Kitronik MOVE Motor (jalon 1 du MOVE Motor, 20/11/2026) : profil, blocs, carte simulée, programme de la carte.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const K = require('../noyau/cartes.js');
const { compiler } = require('../noyau/code-octet.js');
const { creerSimulation } = require('../noyau/simulation.js');
const { versBlockly, depuisBlockly } = require('../noyau/programme.js');

// Un programme qui utilise tous les blocs du robot, et un bloc de la micro:bit qu'il porte.
const ROBOT = {
  demarrage: [
    { bloc: 'mb_image', image: '3' },
    { bloc: 'mm_deplacer', direction: 'avancer', vitesse: 50 },
    { bloc: 'attendre', duree: 0.5 },
    { bloc: 'mm_deplacer', direction: 'gauche', vitesse: 30 },
    { bloc: 'mm_deplacer_pendant', direction: 'reculer', vitesse: 40, duree: 1 },
    { bloc: 'mm_moteur', moteur: '2', vitesse: -20 },
    { bloc: 'mm_led', quelle: '0', couleur: 'violet' },
    { bloc: 'mm_led', quelle: '3', couleur: 'vert' },
    { bloc: 'mm_note', note: '440', duree: 0.25 },
    { bloc: 'mm_klaxon' },
    { bloc: 'mm_arreter' },
  ],
  boucle: [
    { bloc: 'si_sinon', condition: { bloc: 'comparaison', op: '<', a: { bloc: 'mm_distance' }, b: 10 }, alors: [{ bloc: 'mm_arreter' }], sinon: [{ bloc: 'mm_deplacer', direction: 'droite', vitesse: 60 }] },
    { bloc: 'si_alors', condition: { bloc: 'mm_ligne_voit', cote: 'gauche', couleur: 'noir' }, alors: [{ bloc: 'mm_led', quelle: '1', couleur: 'rouge' }] },
    { bloc: 'si_alors', condition: { bloc: 'mm_ligne_voit', cote: 'droit', couleur: 'blanc' }, alors: [{ bloc: 'mm_led', quelle: '2', couleur: 'bleu' }] },
    { bloc: 'affecter', variable: 'g', valeur: { bloc: 'mm_ligne_valeur', cote: 'gauche' } },
    { bloc: 'attendre', duree: 0.2 },
  ],
};

test('MOVE Motor : profil (même programme de la carte que la micro:bit, 0.4), blocs de la micro:bit acceptés', () => {
  const p = K.profil('movemotor');
  assert.equal(p.firmware, K.PROFILS.microbit.firmware);
  assert.equal(p.reponse, 'microbit-v2');
  assert.equal(p.version, '0.4');
  assert.equal(K.PROFILS.microbit.version, '0.4');
  assert.equal(p.installation, 'fichier');
  assert.deepEqual(p.broches.servo, ['P15', 'P16']);
  assert.ok(K.carteAccepte('microbit', 'movemotor'));
  assert.ok(K.carteAccepte('movemotor', 'movemotor'));
  assert.ok(K.carteAccepte('*', 'movemotor'));
  assert.ok(!K.carteAccepte('mbot', 'movemotor'));
  assert.ok(!K.carteAccepte('movemotor', 'microbit'), 'les blocs du robot ne vont pas sur une micro:bit seule');
  const cles = K.CATEGORIES_CARTES.filter((c) => c.carte === 'movemotor').map((c) => c.cle);
  assert.deepEqual(cles, ['mm_moteurs', 'mm_capteurs', 'mm_led_son']);
  // Jamais la réponse dans un bloc : rien ne dépend d'un projet, broches imposées par le robot.
  for (const [t, d] of Object.entries(K.BLOCS_CARTES)) if (d.carte === 'movemotor') assert.match(t, /^mm_/);
});

test('MOVE Motor : le programme se compile sans erreur et repasse par Blockly à l’identique', () => {
  const r = compiler(ROBOT);
  assert.deepEqual(r.erreurs, []);
  const relu = depuisBlockly(versBlockly(ROBOT));
  assert.deepEqual(compiler(relu.programme).octets, r.octets);
});

test('MOVE Motor : déroulé des blocs (extension 6, buzzer sur P0)', () => {
  const lignes = [];
  let sim = null;
  sim = creerSimulation(ROBOT, { extension: (e, c, a) => (lignes.push(`${sim ? sim.t : 0} ${e}.${c} ${a.join(' ')}`), e === 6 && c === 3 ? 100 : 0) });
  sim.avancerJusqua(2100);
  assert.deepEqual(lignes.slice(0, 7), ['0 2.2 3', '0 6.1 50 50', '500 6.1 -30 30', '500 6.1 -40 -40', '1500 6.1 0 0', '1500 6.2 2 -20', '1500 6.5 0 200 0 255']);
  const sons = sim.journal.filter((j) => j.type === 'son');
  assert.deepEqual(sons.map((s) => [s.broche, s.valeur, s.duree]), [['P0', 440, 250], ['P0', 185, 300]]);
});

test('MOVE Motor simulé : écran de la micro:bit, moteurs, 4 LED, ultrasons, suivi de ligne', () => {
  const sim = creerSimulation(ROBOT, { carte: 'movemotor' });
  sim.avancerJusqua(100);
  assert.equal(K.ecranA(sim.carte, sim.t).filter(Boolean).length, 16, 'cœur sur l’écran');
  assert.equal(sim.sorties['moteur gauche'], 50);
  assert.equal(sim.sorties['moteur droit'], 50);
  sim.avancerJusqua(1600);
  assert.equal(sim.sorties['moteur gauche'], 0);
  assert.equal(sim.sorties['moteur droit'], -20);
  assert.equal(K.nomCouleur(sim.sorties['LED avant gauche']), 'violet');
  assert.equal(K.nomCouleur(sim.sorties['LED arrière droite']), 'vert');
  assert.equal(K.nomCouleur(sim.sorties['LED arrière gauche']), 'violet');
  // Boucle : rien devant (100 cm) → tourne à droite ; obstacle à 5 cm → s'arrête.
  sim.avancerJusqua(2600);
  assert.equal(sim.sorties['moteur gauche'], 60);
  assert.equal(sim.sorties['moteur droit'], -60);
  sim.capteurs.distance = 5;
  sim.avancerJusqua(3000);
  assert.equal(sim.sorties['moteur gauche'], 0);
  // Blanc des deux côtés (3) : LED avant droite bleue, rien sur l'avant gauche ; valeur brute ≈ 555.
  assert.equal(K.nomCouleur(sim.sorties['LED avant droite']), 'bleu');
  assert.equal(K.nomCouleur(sim.sorties['LED avant gauche']), 'violet');
  assert.ok(sim.variables.g > K.SEUIL_LIGNE_ROBOT);
  // Noir à gauche seulement (1) : LED avant gauche rouge, valeur brute ≈ 50.
  sim.capteurs.ligne = 1;
  sim.avancerJusqua(3400);
  assert.equal(K.nomCouleur(sim.sorties['LED avant gauche']), 'rouge');
  assert.ok(sim.variables.g < K.SEUIL_LIGNE_ROBOT);
  // Boutons de la micro:bit : présents comme sur la micro:bit seule.
  assert.ok('A' in sim.entrees && 'logo' in sim.entrees);
});

test('MOVE Motor : composants et capteurs de la carte (scénarios de test)', () => {
  const comp = K.composantsCarte('movemotor').map((c) => c.broche);
  assert.deepEqual(comp, ['A', 'B', 'logo', 'moteur gauche', 'moteur droit', 'LED avant gauche', 'LED avant droite', 'LED arrière droite', 'LED arrière gauche', 'P0']);
  const capteurs = K.capteursCarte('movemotor').map((c) => c.nom);
  assert.ok(capteurs.includes('distance') && capteurs.includes('ligne') && capteurs.includes('temperature'));
  assert.equal(K.capteursDepart('movemotor').distance, 100);
});

test('MOVE Motor : le programme de la micro:bit sait piloter le robot (extension 6, robot.py, version 0.4)', () => {
  const dossier = path.join(__dirname, '..', 'cartes', 'microbit');
  const py = fs.readFileSync(path.join(dossier, 'main.py'), 'utf8');
  const robot = fs.readFileSync(path.join(dossier, 'robot.py'), 'utf8');
  assert.match(py, /if e == 6:\n\s+return h_robot\(c, a\)/);
  assert.match(py, /import robot\n/);
  assert.match(py, /PONG v2 0\.4 /);
  // main.py allégé assez petit pour être compilé au démarrage (16 Ko : MemoryError sur la micro:bit, 20/11/2026).
  assert.ok(fs.readFileSync(path.join(dossier, 'main-allege.py'), 'utf8').length <= 14500);
  // Broches vérifiées sur le robot de Thomas (RECETTE §33) : ultrasons P13/P14, ligne gauche P2 / droite P1, LED P8, moteurs V3.1 P12.
  assert.match(robot, /NeoPixel\(pin12, 2\)/);
  assert.match(robot, /NeoPixel\(pin8, 4\)/);
  assert.match(robot, /time_pulse_us\(pin14, 1/);
  // Capteurs de ligne lus sans la résistance interne (sinon 124 au lieu de 566 sur du blanc, robot de Thomas, 20/11/2026).
  assert.match(robot, /p = pin1 if int\(a\[0\]\) == 2 else pin2\n\s+p\.read_digital\(\)\n\s+p\.set_pull\(p\.NO_PULL\)\n\s+return p\.read_analog\(\)/);
  assert.match(py, /def h_lire_ana\(b\):\n\s+p = broche\(b\)\n\s+p\.read_digital\(\)\n\s+p\.set_pull\(p\.NO_PULL\)\n\s+return p\.read_analog\(\)/);
  // « Vider la carte » et chaque nouveau programme arrêtent les moteurs et éteignent les LED.
  assert.match(py, /def tout_eteindre\(\):\n\s+arreter\(\)\n\s+robot_eteint\(\)/);
  for (const [nom, texte] of [['main.py', py], ['robot.py', robot]]) assert.ok(!/[^\x00-\x7f]/.test(texte), nom + ' reste en ASCII');
  // robot.py est bien dans le fichier à copier sur la micro:bit.
  const { MicropythonFsHex } = require('@microbit/microbit-fs');
  const hex = fs.readFileSync(path.join(__dirname, '..', 'cartes', 'labo_blocs_microbit_v2.hex'), 'utf8');
  const lu = new MicropythonFsHex(fs.readFileSync(path.join(dossier, 'micropython', 'micropython-v2.1.2.hex'), 'utf8'));
  lu.importFilesFromIntelHex(hex);
  assert.deepEqual(lu.ls().sort(), ['main.py', 'robot.py']);
});

test('MOVE Motor en direct : capteurs lus sur le vrai robot, un ordre répété ne repart pas (programme de Thomas, 20/11/2026)', () => {
  const { creerDirect } = require('../noyau/direct.js');
  // Boucle sans attente : si le capteur gauche voit du blanc → avancer à 50 %, sinon arrêter.
  const prog = {
    demarrage: [],
    boucle: [{ bloc: 'si_sinon', condition: { bloc: 'mm_ligne_voit', cote: 'gauche', couleur: 'blanc' }, alors: [{ bloc: 'mm_deplacer', direction: 'avancer', vitesse: 50 }], sinon: [{ bloc: 'mm_arreter' }] }],
  };
  const d = creerDirect(prog, { carte: 'movemotor', composants: [] });
  assert.deepEqual(d.lectures.map((l) => l.ligne), ['X 6 4 1', 'X 6 4 2'], 'les deux capteurs de ligne, toujours');
  // Le robot sur la feuille noire (514, capture de Thomas) : arrêter, une seule fois.
  d.lire(d.lectures[0], 'V 514');
  assert.deepEqual(d.avancer(0), ['X 6 1 0 0']);
  assert.deepEqual(d.avancer(1000), [], 'le même ordre ne repart pas');
  assert.equal(d.sim.capteurs.ligne, 1, 'le panneau des capteurs montre « noir à gauche »');
  // Sur la feuille blanche (681) : avancer, une seule fois.
  d.lire(d.lectures[0], 'V 681');
  assert.deepEqual(d.avancer(1100), ['X 6 1 50 50']);
  assert.deepEqual(d.avancer(2000), []);
  // Distance lue sur le robot ; les 4 LED une par une, puis toutes.
  const d2 = creerDirect({ demarrage: [], boucle: [{ bloc: 'si_alors', condition: { bloc: 'comparaison', op: '<', a: { bloc: 'mm_distance' }, b: 10 }, alors: [{ bloc: 'mm_led', quelle: '0', couleur: 'rouge' }] }] }, { carte: 'movemotor', composants: [] });
  assert.deepEqual(d2.lectures.map((l) => l.ligne), ['X 6 3', 'X 6 4 1', 'X 6 4 2']);
  d2.lire(d2.lectures[0], 'V 5');
  assert.deepEqual(d2.avancer(0), ['X 6 5 0 255 0 0']);
  assert.deepEqual(d2.avancer(500), []);
});
