// Jalon 3 : cartes Arduino Uno, mBot et micro:bit V2.
// - Les blocs du mBot et de la micro:bit donnent le même déroulé dans le simulateur, dans le C de la Uno / du mBot et
//   dans le MicroPython de la micro:bit (mêmes commandes, mêmes instants).
// - La carte simulée : écran 5 × 5, boutons A/B, capteurs, moteurs et LED du mBot.
// - Une seule version du programme de la carte partout (outil, .ino, main.py, fichiers construits).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const K = require('../noyau/cartes.js');
const { compiler } = require('../noyau/code-octet.js');
const { creerSimulation } = require('../noyau/simulation.js');
const { versBlockly, depuisBlockly } = require('../noyau/programme.js');
const H = require('./outils/hote-cartes.js');

const pythons = ['python3', 'micropython'].filter(H.present);
const sansC = H.compilerHote() ? false : 'gcc absent';

// Programmes qui utilisent tous les blocs d'une carte.
const MBOT = {
  demarrage: [
    { bloc: 'mbot_deplacer', direction: 'avancer', vitesse: 50 },
    { bloc: 'attendre', duree: 0.5 },
    { bloc: 'mbot_deplacer', direction: 'gauche', vitesse: 30 },
    { bloc: 'mbot_deplacer_pendant', direction: 'reculer', vitesse: 40, duree: 1 },
    { bloc: 'mbot_moteur', moteur: '2', vitesse: -20 },
    { bloc: 'mbot_led', quelle: '2', couleur: 'vert' },
    { bloc: 'mbot_led', quelle: '0', couleur: 'violet' },
    { bloc: 'mbot_note', note: '440', duree: 0.25 },
    { bloc: 'mbot_arreter' },
  ],
  boucle: [
    { bloc: 'si_sinon', condition: { bloc: 'comparaison', op: '<', a: { bloc: 'mbot_distance' }, b: 10 }, alors: [{ bloc: 'mbot_arreter' }], sinon: [{ bloc: 'mbot_deplacer', direction: 'droite', vitesse: 60 }] },
    { bloc: 'si_alors', condition: { bloc: 'mbot_ligne_voit', cote: 'gauche', couleur: 'noir' }, alors: [{ bloc: 'mbot_led', quelle: '1', couleur: 'rouge' }] },
    { bloc: 'si_alors', condition: { bloc: 'mbot_bouton' }, alors: [{ bloc: 'affecter', variable: 'l', valeur: { bloc: 'mbot_lumiere' } }] },
    { bloc: 'attendre', duree: 0.2 },
  ],
};
const MICROBIT = {
  demarrage: [
    { bloc: 'mb_image', image: '3' },
    { bloc: 'attendre', duree: 0.5 },
    { bloc: 'mb_texte', texte: 'Été 3' },
    { bloc: 'mb_nombre', valeur: 42 },
    { bloc: 'mb_pixel', etat: '9', x: 1, y: 3 },
    { bloc: 'mb_note', note: '262', duree: 0.5 },
    { bloc: 'mb_effacer' },
  ],
  boucle: [
    { bloc: 'si_alors', condition: { bloc: 'mb_bouton', bouton: 'AB' }, alors: [{ bloc: 'mb_image', image: '1' }] },
    { bloc: 'si_alors', condition: { bloc: 'mb_logo' }, alors: [{ bloc: 'mb_nombre', valeur: { bloc: 'mb_temperature' } }] },
    { bloc: 'si_alors', condition: { bloc: 'mb_geste', geste: '1' }, alors: [{ bloc: 'affecter', variable: 'x', valeur: { bloc: 'mb_acceleration', axe: '2' } }] },
    { bloc: 'affecter', variable: 'l', valeur: { bloc: 'mb_lumiere' } },
    { bloc: 'attendre', duree: 0.1 },
  ],
};

const nombre = (v) => String(Number.isInteger(v) ? v : v);
// Déroulé du simulateur, écrit comme la sortie des interpréteurs de la carte (commandes et sons).
function derouleJs(programme, duree) {
  const lignes = [];
  let sim = null;
  sim = creerSimulation(programme, { extension: (e, c, a) => (lignes.push(`${sim ? sim.t : 0} ext ${e} ${c}${a.map((x) => ' ' + nombre(x)).join('')}`), 0) });
  sim.avancerJusqua(duree);
  for (const j of sim.journal) if (j.type === 'son') lignes.push({ t: j.t, l: `${j.t} ${j.broche.replace(/^D/, '')} ${j.valeur} son ${j.duree}` });
  return lignes;
}
const garder = (texte) => texte.split('\n').filter((l) => / ext | son /.test(l));
const trier = (lignes) => lignes.map((l) => (typeof l === 'string' ? l : l.l)).sort((a, b) => Number(a.split(' ')[0]) - Number(b.split(' ')[0]));

test('les programmes de carte se compilent sans erreur et repassent par Blockly à l’identique', () => {
  for (const p of [MBOT, MICROBIT]) {
    const r = compiler(p);
    assert.deepEqual(r.erreurs, []);
    const relu = depuisBlockly(versBlockly(p));
    assert.deepEqual(compiler(relu.programme).octets, r.octets);
  }
});

test('mBot : même déroulé dans le simulateur et dans le C du mBot', { skip: sansC }, () => {
  const octets = compiler(MBOT).octets;
  const c = garder(H.executerC(octets, 3000));
  assert.ok(c.length > 10);
  assert.deepEqual(trier(derouleJs(MBOT, 3000)), trier(c));
});

test('micro:bit : même déroulé dans le simulateur, dans le C et dans le MicroPython', { skip: sansC || (!pythons.length && 'python absent') }, () => {
  const octets = compiler(MICROBIT).octets;
  const c = H.executerC(octets, 3000);
  assert.deepEqual(trier(derouleJs(MICROBIT, 3000)), trier(garder(c)));
  for (const py of pythons) assert.equal(H.executerPython(py, octets, 3000), c, py);
});

test('micro:bit simulée : image, texte qui défile, nombre, point, boutons A et B', () => {
  const sim = creerSimulation(MICROBIT, { carte: 'microbit' });
  sim.avancerJusqua(100);
  assert.deepEqual(K.ecranA(sim.carte, sim.t), '09090:99999:99999:09990:00900'.replace(/:/g, '').split('').map(Number)); // cœur
  sim.avancerJusqua(600);
  // À 0,5 s : « Été 3 » (sans accents) est aussitôt remplacé par « 42 » (comme sur la carte, sans attendre) ;
  // le point (1, 3) s'allume sur le « 4 » affiché, puis la note joue 0,5 s.
  const quatre = '00110:01010:10010:11111:00010'.replace(/:/g, '').split('').map((v) => v * 9);
  quatre[3 * 5 + 1] = 9;
  assert.equal(sim.carte.animation, null);
  assert.deepEqual(K.ecranA(sim.carte, sim.t), quatre);
  sim.avancerJusqua(1100);
  assert.equal(K.ecranA(sim.carte, sim.t).filter(Boolean).length, 0); // effacé à la fin
  // Boutons A et B appuyés ensemble : sourire.
  sim.changerEntree('A', 1);
  sim.changerEntree('B', 1);
  sim.avancerJusqua(sim.t + 200);
  assert.deepEqual(K.ecranA(sim.carte, sim.t), '00000:09090:00000:90009:09990'.replace(/:/g, '').split('').map(Number));
  // Logo touché : la température s'affiche (21 °C : deux chiffres l'un après l'autre).
  sim.changerEntree('A', 0);
  sim.capteurs.temperature = 7;
  sim.changerEntree('logo', 1);
  sim.avancerJusqua(sim.t + 200);
  assert.ok(K.ecranA(sim.carte, sim.t).some(Boolean));
  assert.equal(sim.journal.filter((j) => j.type === 'son' && j.broche === 'haut-parleur')[0].valeur, 262);
});

test('micro:bit simulée : un texte défile de droite à gauche puis disparaît', () => {
  const sim = creerSimulation({ demarrage: [{ bloc: 'mb_texte', texte: 'I' }], boucle: [] }, { carte: 'microbit' });
  sim.avancerJusqua(0);
  assert.equal(K.ecranA(sim.carte, 0).filter(Boolean).length, 0); // entre par la droite
  assert.deepEqual(K.ecranA(sim.carte, 150 * 5).slice(0, 5), [9, 9, 9, 0, 0]); // la lettre entière
  assert.equal(K.ecranA(sim.carte, 150 * 20).filter(Boolean).length, 0); // sortie à gauche
});

test('mBot simulé : moteurs, LED, ultrasons, suiveur de ligne, bouton', () => {
  const sim = creerSimulation(MBOT, { carte: 'mbot' });
  sim.avancerJusqua(100);
  assert.equal(sim.sorties['moteur gauche'], 50);
  assert.equal(sim.sorties['moteur droit'], 50);
  sim.avancerJusqua(600);
  // « tourner à gauche » (la roue gauche recule : -30 / 30) est aussitôt suivi de « reculer pendant 1 s ».
  assert.ok(sim.journal.some((j) => j.broche === 'moteur gauche' && j.valeur === -30 && j.t === 500));
  assert.equal(sim.sorties['moteur gauche'], -40);
  assert.equal(sim.sorties['moteur droit'], -40);
  sim.avancerJusqua(1600);
  assert.equal(sim.sorties['moteur gauche'], 0);
  assert.equal(sim.sorties['moteur droit'], -20);
  assert.equal(K.nomCouleur(sim.sorties['LED gauche']), 'violet');
  assert.equal(K.nomCouleur(sim.sorties['LED droite']), 'violet');
  // Boucle : rien devant (100 cm) → tourne à droite ; obstacle à 5 cm → s'arrête.
  sim.avancerJusqua(2200);
  assert.equal(sim.sorties['moteur gauche'], 60);
  sim.capteurs.distance = 5;
  sim.avancerJusqua(2600);
  assert.equal(sim.sorties['moteur gauche'], 0);
  // Ligne noire à gauche (1) : LED droite rouge.
  sim.capteurs.ligne = 1;
  sim.avancerJusqua(3000);
  assert.equal(K.nomCouleur(sim.sorties['LED droite']), 'rouge');
  assert.equal(K.nomCouleur(sim.sorties['LED gauche']), 'violet');
  sim.capteurs.lumiere = 321;
  sim.changerEntree('bouton', 1);
  sim.avancerJusqua(3400);
  assert.equal(sim.variables.l, 321);
});

test('une seule version du programme de la carte : outil, Uno/mBot, micro:bit, fichiers construits', () => {
  const ino = fs.readFileSync(path.join(H.CARTES, 'arduino', 'labo_blocs', 'labo_blocs.ino'), 'utf8');
  const py = fs.readFileSync(path.join(H.CARTES, 'microbit', 'main.py'), 'utf8');
  let construits = null;
  vm.runInNewContext(fs.readFileSync(path.join(H.CARTES, 'firmwares.js'), 'utf8'), { definirFirmwares: (f) => (construits = f) });
  assert.match(ino, new RegExp(`#define VERSION_FIRMWARE "${K.VERSION_FIRMWARE}"`));
  assert.match(py, new RegExp(`PONG v2 ${K.VERSION_FIRMWARE.replace('.', '\\.')} `));
  assert.equal(construits.version, K.VERSION_FIRMWARE);
  for (const p of Object.values(K.PROFILS)) assert.match(construits[p.firmware], /^:[0-9A-F]{10}/, p.nom);
});

test('micro:bit : un long texte arrive en morceaux de 4 lettres et défile en entier sur la carte', { skip: !pythons.length && 'python absent' }, () => {
  const morceaux = K.deroulerBlocCarte({ bloc: 'mb_texte', texte: 'Bonjour à tous' });
  assert.deepEqual(morceaux.map((m) => m.commande), [14, 14, 14, 11]);
  assert.ok(morceaux.every((m) => m.arguments.length <= 4));
  const appels = morceaux.map((m) => `vm.h_ext(2, ${m.commande}, [${m.arguments.join(', ')}])`).join('\n');
  const script = [
    'import sys',
    `sys.path.insert(0, ${JSON.stringify(path.join(H.CARTES, 'microbit'))})`,
    `sys.path.insert(0, ${JSON.stringify(path.join(H.CARTES, 'microbit', 'faux'))})`,
    'import main as vm',
    'class Ecran:',
    '    def scroll(self, texte, wait=True): print(texte)',
    'vm.display = Ecran()',
    appels,
  ].join('\n');
  const { execFileSync } = require('node:child_process');
  for (const py of pythons) assert.equal(execFileSync(py, ['-c', script]).toString().trim(), 'Bonjour a tous', py);
  // Le simulateur affiche le même texte.
  const sim = creerSimulation({ demarrage: [{ bloc: 'mb_texte', texte: 'Bonjour à tous' }], boucle: [] }, { carte: 'microbit' });
  sim.avancerJusqua(0);
  assert.equal(sim.carte.animation.texte, 'Bonjour a tous');
});

test('une commande de carte à plus de 4 valeurs est refusée à la compilation', () => {
  const r = compiler({ demarrage: [{ bloc: 'ext', extension: 2, commande: 11, arguments: [1, 2, 3, 4, 5] }], boucle: [] });
  assert.equal(r.erreurs.length, 1);
});

test('scénarios sur la carte : bouton A de la micro:bit, moteurs du mBot, phrases sans « tu as faux »', () => {
  const V = require('../noyau/validation.js');
  const E = require('../noyau/edition.js');
  const microbit = {
    carte: 'microbit',
    composants: [{ type: 'led', broche: 'P0' }],
    scenarios: [{ etapes: [{ verifier: { P0: 0 } }, { maintenir: 'A' }, { verifier: { P0: 1 } }, { relacher: 'A' }, { verifier: { P0: 0 } }] }],
  };
  const juste = { demarrage: [], boucle: [{ bloc: 'si_sinon', condition: { bloc: 'mb_bouton', bouton: 'A' }, alors: [{ bloc: 'led_etat', broche: 'P0', etat: 1 }], sinon: [{ bloc: 'led_etat', broche: 'P0', etat: 0 }] }] };
  assert.equal(V.jouerScenario(microbit, juste, microbit.scenarios[0]).reussi, true);
  const faux = JSON.parse(JSON.stringify(juste).replace('"A"', '"B"'));
  const r = V.jouerScenario(microbit, faux, microbit.scenarios[0]);
  assert.equal(r.reussi, false);
  assert.match(r.message, /^Quand le bouton A est appuyé, la LED P0 devrait être allumée\. Dans ton programme, elle reste éteinte\./);
  assert.equal(E.decrireEtape({ maintenir: 'A' }, microbit), 'Maintenir appuyé le bouton A');

  const mbot = {
    carte: 'mbot',
    composants: [],
    scenarios: [{ etapes: [{ verifier: { 'moteur gauche': 0 } }, { appuyer: 'bouton' }, { verifier: { 'moteur gauche': 50, 'moteur droit': 50 } }] }],
  };
  const roule = { demarrage: [], boucle: [{ bloc: 'si_alors', condition: { bloc: 'mbot_bouton' }, alors: [{ bloc: 'mbot_deplacer', direction: 'avancer', vitesse: 50 }] }] };
  assert.equal(V.jouerScenario(mbot, roule, mbot.scenarios[0]).reussi, true);
  const lent = JSON.parse(JSON.stringify(roule).replace('"vitesse":50', '"vitesse":30'));
  const m = V.jouerScenario(mbot, lent, mbot.scenarios[0]).message;
  assert.equal(m, 'Après un appui sur le bouton de la carte, le moteur gauche devrait tourner à 50 %. Dans ton programme, il tourne à 30 %.');
  assert.equal(E.decrireEtape({ verifier: { 'moteur droit': 0 } }, mbot), 'Vérifier que le moteur droit est arrêté');
  assert.deepEqual(E.nouvelleEtape('appuyer', { composants: [] }, 'mbot'), { appuyer: 'bouton' });
});

test('parcours de découverte (mBot, micro:bit) : publiables, chaque solution passe ses scénarios', () => {
  const E = require('../noyau/edition.js');
  const { lireParcours } = require('../tools/construire-module.js');
  for (const id of ['decouverte-mbot', 'decouverte-microbit']) {
    const p = lireParcours(fs.readFileSync(path.join(__dirname, '..', 'parcours', id, 'parcours.js'), 'utf8'));
    assert.deepEqual(E.controlerPublication(p), [], id);
    assert.deepEqual(p.modes, ['simulateur', 'carte']);
  }
});
