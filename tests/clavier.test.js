// Clavier de l'ordinateur (toutes les cartes) : blocs « quand la touche … est appuyée / relâchée » et « la touche … est
// appuyée ». Comme la caméra, le clavier est dans l'ordinateur : simulateur et « En direct », jamais vers la carte.
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../noyau/cartes.js');
const { compiler } = require('../noyau/code-octet.js');
const { creerSimulation } = require('../noyau/simulation.js');
const { versBlockly, depuisBlockly, utiliseClavier, typesDeBlocs } = require('../noyau/programme.js');
const { creerDirect } = require('../noyau/direct.js');
const { versArduino } = require('../noyau/arduino.js');
const V = require('../noyau/validation.js');
const E = require('../noyau/edition.js');

// Télécommande du mBot : flèche haut → avance, flèche bas → recule, sinon arrêt ; espace → LED, relâchée → éteinte.
const TELECOMMANDE = {
  format: 'labo-blocs/programme',
  version: 1,
  fils: [
    { quand: 'demarrage', corps: [] },
    {
      quand: 'boucle',
      corps: [
        {
          bloc: 'si_sinon',
          condition: { bloc: 'touche_appuyee', touche: 'haut' },
          alors: [{ bloc: 'mbot_deplacer', direction: 'avancer', vitesse: 50 }],
          sinon: [{ bloc: 'si_sinon', condition: { bloc: 'touche_appuyee', touche: 'bas' }, alors: [{ bloc: 'mbot_deplacer', direction: 'reculer', vitesse: 50 }], sinon: [{ bloc: 'mbot_arreter' }] }],
        },
      ],
    },
    { quand: 'touche', touche: 'espace', front: 'appui', corps: [{ bloc: 'mbot_led', quelle: '0', couleur: 'vert' }] },
    { quand: 'touche', touche: 'espace', front: 'relache', corps: [{ bloc: 'mbot_led', quelle: '0', couleur: 'eteinte' }] },
  ],
};

test('touches : flèches, espace, lettres et chiffres ; codes et noms du clavier de l’ordinateur', () => {
  assert.equal(K.TOUCHES.length, 5 + 26 + 10);
  assert.deepEqual(['haut', 'bas', 'gauche', 'droite', 'espace', 'a', 'z', '0', '9'].map(K.codeTouche), [1, 2, 3, 4, 32, 65, 90, 48, 57]);
  for (const [, t] of K.TOUCHES) assert.equal(K.toucheDuCode(K.codeTouche(t)), t);
  assert.deepEqual(['ArrowUp', ' ', 'q', 'Q', '7', 'Enter', 'F1', 'é'].map(K.toucheDuClavier), ['haut', 'espace', 'q', 'q', '7', null, null, null]);
  assert.deepEqual(K.CATEGORIES_CARTES.find((c) => c.cle === 'clavier').blocs, ['touche_appuyee']);
});

test('programme : compilé, relu par Blockly à l’identique, reconnu comme utilisant le clavier', () => {
  const r = compiler(TELECOMMANDE);
  assert.deepEqual(r.erreurs, []);
  const relu = depuisBlockly(versBlockly(TELECOMMANDE));
  assert.deepEqual(compiler(relu.programme).octets, r.octets);
  assert.ok(typesDeBlocs(TELECOMMANDE).includes('quand_touche'));
  assert.equal(utiliseClavier(TELECOMMANDE), true);
  assert.equal(utiliseClavier({ demarrage: [{ bloc: 'mbot_arreter' }], boucle: [] }), false);
});

test('simulateur : une touche est une entrée (« touche:haut ») ; « quand la touche » une fois par appui', () => {
  const sim = creerSimulation(TELECOMMANDE, { carte: 'mbot' });
  sim.avancerJusqua(100);
  assert.equal(sim.sorties['moteur gauche'], 0);
  sim.changerEntree('touche:haut', 1);
  sim.avancerJusqua(200);
  assert.equal(sim.sorties['moteur gauche'], 50);
  sim.changerEntree('touche:haut', 0);
  sim.changerEntree('touche:bas', 1);
  sim.avancerJusqua(300);
  assert.equal(sim.sorties['moteur droit'], -50);
  sim.changerEntree('touche:bas', 0);
  sim.changerEntree('touche:espace', 1);
  sim.avancerJusqua(400);
  assert.equal(K.nomCouleur(sim.sorties['LED gauche']), 'vert');
  assert.equal(sim.sorties['moteur gauche'], 0);
  // Tenue longtemps, la touche ne relance pas « quand la touche est appuyée » : une fois par appui.
  const vert = sim.journal.filter((j) => j.broche === 'LED gauche').length;
  sim.avancerJusqua(2000);
  assert.equal(sim.journal.filter((j) => j.broche === 'LED gauche').length, vert);
  sim.changerEntree('touche:espace', 0);
  sim.avancerJusqua(2100);
  assert.equal(K.nomCouleur(sim.sorties['LED gauche']), 'éteinte');
});

test('En direct : les touches restent dans l’ordinateur, seuls les ordres du robot partent', () => {
  const d = creerDirect(TELECOMMANDE, { carte: 'mbot', composants: [] });
  assert.deepEqual(d.lectures, [], 'le clavier n’est jamais demandé à la carte');
  assert.deepEqual(d.avancer(0), ['X 1 1 0 0']);
  d.sim.changerEntree('touche:haut', 1);
  assert.deepEqual(d.avancer(50), ['X 1 1 50 50']);
  d.sim.changerEntree('touche:haut', 0);
  assert.deepEqual(d.avancer(100), ['X 1 1 0 0']);
  // Arduino Uno : « quand la touche espace est appuyée » allume la LED D9.
  const uno = creerDirect({ format: 'labo-blocs/programme', version: 1, fils: [{ quand: 'demarrage', corps: [] }, { quand: 'touche', touche: 'espace', front: 'appui', corps: [{ bloc: 'led_etat', broche: 'D9', etat: 1 }] }] }, { composants: [{ type: 'led', broche: 'D9' }] });
  uno.avancer(0);
  uno.sim.changerEntree('touche:espace', 1);
  assert.deepEqual(uno.avancer(20), ['D 9 1']);
});

test('scénarios : « Maintenir appuyée la touche flèche haut », phrases avec le nom de la touche', () => {
  const ex = {
    carte: 'mbot',
    composants: [],
    blocsAutorises: ['quand_touche', 'touche_appuyee', 'mbot_deplacer', 'mbot_arreter', 'si_sinon'],
    scenarios: [{ etapes: [{ maintenir: 'touche:haut' }, { verifier: { 'moteur gauche': 50, 'moteur droit': 50 } }, { relacher: 'touche:haut' }, { verifier: { 'moteur gauche': 0 } }] }],
  };
  assert.equal(V.jouerScenario(ex, TELECOMMANDE, ex.scenarios[0]).reussi, true);
  const lent = JSON.parse(JSON.stringify(TELECOMMANDE).replace('"vitesse":50', '"vitesse":30'));
  assert.equal(V.jouerScenario(ex, lent, ex.scenarios[0]).message, 'Quand la touche flèche haut est appuyée, le moteur gauche devrait tourner à 50 %. Dans ton programme, il tourne à 30 %.');
  assert.equal(E.decrireEtape({ maintenir: 'touche:haut' }, ex), 'Maintenir appuyée la touche flèche haut');
  // Les touches ne sont proposées qu'aux exercices qui ont les blocs du clavier.
  assert.equal(K.composantsClavier(ex).length, K.TOUCHES.length);
  assert.deepEqual(K.composantsClavier({ blocsAutorises: ['mbot_arreter'] }), []);
});

test('code Arduino : le clavier est signalé (mode « En direct » seulement)', () => {
  const code = versArduino({ format: 'labo-blocs/programme', version: 1, fils: [{ quand: 'demarrage', corps: [] }, { quand: 'boucle', corps: [{ bloc: 'si_alors', condition: { bloc: 'touche_appuyee', touche: 'a' }, alors: [{ bloc: 'led_etat', broche: 'D9', etat: 1 }] }] }] }, { composants: [{ type: 'led', broche: 'D9' }] }).code;
  assert.match(code, /clavier est celui de l’ordinateur/);
});
