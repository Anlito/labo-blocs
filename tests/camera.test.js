// Caméra et IA (jalon 6) : blocs de la caméra, événements « quand la caméra reconnaît… », simulation, vérification
// d'un exercice, mode « En direct » (rien ne part vers la carte).
const test = require('node:test');
const assert = require('node:assert');
const P = require('../noyau/programme.js');
const { compiler } = require('../noyau/code-octet.js');
const { creerSimulation } = require('../noyau/simulation.js');
const { valider } = require('../noyau/validation.js');
const { creerDirect } = require('../noyau/direct.js');

const led = (broche, etat) => ({ bloc: 'led_etat', broche, etat });
const attendre = (s) => ({ bloc: 'attendre', duree: { bloc: 'nombre', valeur: s } });

// Quand la caméra reconnaît le loup (1) : LED D3 allumée ; quand elle ne le reconnaît plus : éteinte.
const programmeLoup = {
  format: 'labo-blocs/programme',
  version: 1,
  fils: [
    { quand: 'demarrage', corps: [] },
    { quand: 'boucle', corps: [] },
    { quand: 'camera', etiquette: 1, front: 'voit', corps: [led('D3', 1)] },
    { quand: 'camera', etiquette: 1, front: 'plus', corps: [led('D3', 0)] },
  ],
};
const composants = [{ type: 'led', broche: 'D3' }];

test('événements de la caméra : une fois à chaque changement, au bon moment', () => {
  const sim = creerSimulation(programmeLoup, { composants });
  assert.deepStrictEqual(sim.erreurs, []);
  sim.avancer(500);
  assert.strictEqual(sim.valeur('D3'), 0);
  sim.planifierCapteur(sim.t, 'camera', 1);
  sim.avancer(100);
  assert.strictEqual(sim.valeur('D3'), 1);
  sim.planifierCapteur(sim.t, 'camera', 2); // un autre personnage : le loup n'est plus là
  sim.avancer(100);
  assert.strictEqual(sim.valeur('D3'), 0);
  const allumages = sim.journal.filter((e) => e.broche === 'D3' && e.valeur === 1).length;
  assert.strictEqual(allumages, 1);
});

test('blocs de la caméra : « reconnaît » et « certitude », réglés par la page (IA) ou à la main', () => {
  const prog = {
    fils: [
      { quand: 'demarrage', corps: [] },
      {
        quand: 'boucle',
        corps: [
          { bloc: 'si_sinon', condition: { bloc: 'camera_reconnait', etiquette: '2' }, alors: [led('D4', 1)], sinon: [led('D4', 0)] },
          { bloc: 'affecter', variable: 'c', valeur: { bloc: 'camera_certitude', etiquette: '2' } },
        ],
      },
    ],
  };
  const capteurs = { camera: 0 };
  const sim = creerSimulation(prog, { composants: [{ type: 'led', broche: 'D4' }], capteurs });
  assert.deepStrictEqual(sim.erreurs, []);
  sim.avancer(50);
  assert.strictEqual(sim.valeur('D4'), 0);
  capteurs.camera = 2;
  capteurs.certitudes = { 2: 87 };
  sim.avancer(50);
  assert.strictEqual(sim.valeur('D4'), 1);
  // Programme ↔ Blockly : l'étiquette est gardée.
  const b = P.versBlockly(prog);
  const retour = P.depuisBlockly(b).programme;
  assert.strictEqual(retour.fils[1].corps[0].condition.etiquette, '2');
});

test('quand_camera ↔ Blockly ; programme « utilise la caméra »', () => {
  const b = P.versBlockly(programmeLoup);
  const hauts = b.blocks.blocks.filter((x) => x.type === 'quand_camera');
  assert.deepStrictEqual(hauts.map((x) => x.fields), [{ ETIQUETTE: '1', FRONT: 'voit' }, { ETIQUETTE: '1', FRONT: 'plus' }]);
  const r = P.depuisBlockly(b).programme;
  assert.deepStrictEqual(r.fils.filter((f) => f.quand === 'camera').map((f) => [f.etiquette, f.front]), [[1, 'voit'], [1, 'plus']]);
  assert.strictEqual(P.utiliseCamera(programmeLoup), true);
  assert.strictEqual(P.utiliseCamera({ fils: [{ quand: 'boucle', corps: [led('D3', 1)] }] }), false);
  assert.ok(P.typesDeBlocs(programmeLoup).includes('quand_camera'));
  assert.ok(compiler(programmeLoup, { composants }).octets.length > 0);
});

test('vérification : « regler: { camera } » et phrase avec le nom de l’étiquette', () => {
  const exercice = {
    id: 'cam',
    composants,
    camera: { etiquettes: ['Loup', 'Roi'] },
    scenarios: [{ nom: 'loup', etapes: [{ attendre: 0.5 }, { regler: { camera: 1 } }, { verifier: { D3: 1 } }, { regler: { camera: 0 } }, { verifier: { D3: 0 } }] }],
  };
  assert.strictEqual(valider(exercice, programmeLoup).reussi, true);
  const oubli = { fils: programmeLoup.fils.slice(0, 3) }; // n'éteint jamais
  const r = valider(exercice, oubli);
  assert.strictEqual(r.reussi, false);
  assert.match(r.message, /caméra ne reconnaît rien/);
  const rien = valider(exercice, { fils: [{ quand: 'boucle', corps: [] }] });
  assert.match(rien.message, /caméra reconnaît « Loup »/);
});

test('mode « En direct » : la caméra ne part jamais vers la carte', () => {
  const capteurs = { camera: 0 };
  const d = creerDirect(programmeLoup, { composants, capteurs });
  d.avancer(100);
  capteurs.camera = 1;
  const lignes = d.avancer(200);
  assert.ok(lignes.some((l) => /^D 3 1$/.test(l) || /3/.test(l)), JSON.stringify(lignes));
  assert.ok(!lignes.some((l) => /^X 3 /.test(l)));
  assert.ok(!d.lectures.some((l) => /^X 3 /.test(l.ligne)));
});

test('IA : les exemples les plus proches votent ; une étiquette n’est vue qu’après plusieurs images stables', () => {
  const { creerReconnaissance, creerStabilite, versTexte, depuisTexte } = require('../noyau/knn.js');
  const ia = creerReconnaissance({ k: 3 });
  const v = (a, b) => Float32Array.from({ length: 8 }, (_, i) => (i < 4 ? a : b) + i * 0.01);
  for (let i = 0; i < 3; i++) ia.ajouter(1, v(1, 0));
  for (let i = 0; i < 3; i++) ia.ajouter(2, v(0, 1));
  const r = ia.reconnaitre(v(0.9, 0.1));
  assert.strictEqual(r.etiquette, 1);
  assert.strictEqual(r.certitudes[1], 100);
  assert.strictEqual(ia.reconnaitre(v(0.1, 0.9)).etiquette, 2);
  // La photo apprise la plus ressemblante (pour montrer la « réflexion » de l'IA).
  assert.strictEqual(r.proche.n, 1);
  assert.ok(r.proche.ressemblance > 90 && r.proche.ressemblance <= 100);
  assert.deepStrictEqual(creerReconnaissance().reconnaitre(v(1, 0)), { etiquette: 0, certitudes: {} });
  const s = creerStabilite({ seuil: 80, images: 3 });
  assert.strictEqual(s.pousser(r), 0);
  assert.strictEqual(s.pousser(r), 0);
  assert.deepStrictEqual([s.candidat, s.suite, s.images, s.seuil], [1, 2, 3, 80]);
  assert.strictEqual(s.pousser(r), 1);
  assert.strictEqual(s.pousser({ etiquette: 2, certitudes: { 2: 60 } }), 1); // pas assez sûr : on garde
  const t = versTexte(v(1, 0));
  assert.deepStrictEqual(Array.from(depuisTexte(t)), Array.from(v(1, 0)));
});

test('sauvegarde : ce que l’équipe a appris à la caméra', () => {
  const S = require('../noyau/sauvegarde.js');
  const d = S.creerSauvegarde({ eleves: ['Léa'], classe: '4B' });
  assert.deepStrictEqual(S.lireCamera(d).exemples, {});
  S.noterCamera(d, { modele: 'mobilenet_v2_050_224', exemples: { Loup: [{ f: 'AAAA', v: 'data:' }] }, etiquettes: ['Loup', 'Roi'] });
  const relu = S.lireSauvegarde(JSON.stringify(d));
  assert.ok(relu.ok);
  assert.strictEqual(S.lireCamera(relu.donnees).exemples.Loup.length, 1);
  assert.deepStrictEqual(S.lireCamera(relu.donnees).etiquettes, ['Loup', 'Roi']); // étiquettes créées par l'équipe
});
