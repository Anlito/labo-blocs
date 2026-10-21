// Éditeur de parcours (jalon 2) : opérations sur le paquet, sans affichage.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../noyau/edition.js');
const { lireParcours } = require('../tools/construire-module.js');
const { controler, comparer, preparer } = require('../noyau/parcours.js');
const { versBlockly, depuisBlockly } = require('../noyau/programme.js');

const distributeur = () => lireParcours(fs.readFileSync(path.join(__dirname, '..', 'parcours', 'distributeur', 'parcours.js'), 'utf8'));
const numeros = (p) => p.exercices.map((e) => e.numero);

test('le parcours du distributeur se publie : contrôle complet, chaque solution passe ses scénarios', () => {
  assert.deepEqual(E.controlerPublication(distributeur()), []);
});

test('identifiants : stables, jamais réutilisés après suppression', () => {
  const p = distributeur();
  assert.equal(E.prefixeIds(p), 'dist');
  const i = E.ajouterExercice(p);
  assert.equal(p.exercices[i].id, 'dist-14');
  E.supprimerExercice(p, i);
  assert.deepEqual(p.idsRetires, ['dist-14']);
  const j = E.ajouterExercice(p);
  assert.equal(p.exercices[j].id, 'dist-15', 'dist-14 n’est pas redonné');
  const k = E.dupliquerExercice(p, 4);
  assert.equal(p.exercices[k].id, 'dist-16');
  assert.equal(p.exercices[k].titre, 'Allumer, sinon éteindre (copie)');
  assert.deepEqual(p.exercices[k].scenarios, p.exercices[4].scenarios);
  assert.notEqual(p.exercices[k].scenarios, p.exercices[4].scenarios, 'copie indépendante');
});

test('numéros : suivent l’ordre, 13A et 13B restent ensemble ; comparer voit un déplacement, pas une modification', () => {
  const p = distributeur();
  const avant = JSON.parse(JSON.stringify(p));
  E.deplacerExercice(p, 4, 0);
  assert.deepEqual(numeros(p), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13A', '13B']);
  assert.equal(p.exercices[0].id, 'dist-05');
  E.ajouterExercice(p, 11);
  assert.deepEqual(numeros(p).slice(-4), ['12', '13', '14A', '14B']);
  const d = comparer(avant, p);
  assert.deepEqual(d.modifies, []);
  assert.ok(d.deplaces.includes('dist-05'));
  assert.equal(d.ajoutes.length, 1);
});

test('changer une broche : la solution et les scénarios suivent, la consigne est signalée', () => {
  const p = distributeur();
  const ex = p.exercices.find((e) => e.id === 'dist-05');
  const r = E.changerBroche(ex, 'D3', 'D7');
  assert.equal(ex.composants.find((c) => c.type === 'bouton').broche, 'D7');
  assert.ok(r.solution >= 1 && r.scenarios >= 2 && r.consigne);
  assert.ok(!JSON.stringify(ex.scenarios).includes('"D3"'));
  assert.deepEqual(E.testerScenarios(p, ex).map((x) => x.reussi), [true]);
  E.remplacerDansConsigne(ex, 'D3', 'D7');
  assert.match(ex.consigne, /broche D7/);
  // Une LED dans « verifier », « impulsion » et « opposees »
  const ex8 = p.exercices.find((e) => e.id === 'dist-08');
  E.changerBroche(ex8, 'D11', 'D12');
  assert.ok(E.testerScenarios(p, ex8).every((x) => x.reussi));
});

test('tester les scénarios : réussite, écart avec la phrase de l’élève, scénario sans vérification', () => {
  const p = distributeur();
  const ex = JSON.parse(JSON.stringify(p.exercices[0]));
  assert.deepEqual(E.testerScenarios(p, ex).map((x) => x.reussi), [true]);
  ex.solutionReference = { demarrage: [{ bloc: 'led_etat', broche: 'D10', etat: 1 }], boucle: [] };
  const [r] = E.testerScenarios(p, ex);
  assert.equal(r.reussi, false);
  assert.match(r.message, /LED D9 devrait être allumée/);
  ex.scenarios = [{ nom: 'Rien', etapes: [{ attendre: 1 }] }];
  assert.match(E.testerScenarios(p, ex)[0].message, /ne vérifie rien/);
  // Paramètres « $nom » remplacés comme chez l'élève (exercice 13A).
  const ex13 = p.exercices.find((e) => e.id === 'dist-13a');
  assert.ok(E.testerScenarios(p, ex13).every((x) => x.reussi));
});

test('étapes : chaque sorte a une valeur de départ et une phrase', () => {
  const ex = { composants: [{ type: 'bouton', broche: 'D3' }, { type: 'led', broche: 'D9' }, { type: 'led', broche: 'D10' }] };
  const phrases = E.TYPES_ETAPES.filter((t) => !t.avecCapteurs).map((t) => {
    const e = E.nouvelleEtape(t.cle, ex);
    assert.equal(E.typeEtape(e), t.cle);
    return E.decrireEtape(e, ex);
  });
  assert.deepEqual(phrases, [
    'Attendre 1 s',
    'Appuyer brièvement sur le bouton D3',
    'Maintenir appuyé le bouton D3',
    'Relâcher le bouton D3',
    'Vérifier que la LED D9 est allumée',
    'Vérifier que la LED D9 est allumée pendant 2 s',
    'Vérifier que la LED D9 est allumée pendant 5 s, puis plus',
    'Vérifier que la LED D9 passe par 1, 0 toutes les 1 s',
    'Vérifier que la LED D9 et la LED D10 s’allument en alternance',
    'Vérifier que la liste « sequence » contient au moins 4 nombres',
    'Jouer la séquence de la liste « sequence » avec D3, tour par tour (1, puis 1 2, puis 1 2 3…)',
    'Vérifier que le buzzer D9 joue une note dans les 3 s',
    'Vérifier que la LED D9 s’allume dans les 4 s',
  ]);
  assert.equal(E.decrireEtape({ contexte: 'au démarrage', verifier: { D9: 0 } }, ex), 'Au démarrage, vérifier que la LED D9 est éteinte');
});

test('étape « Régler un capteur » : seulement pour une carte qui en a (mBot, micro:bit)', () => {
  assert.throws(() => E.nouvelleEtape('regler', { composants: [] }, 'uno'));
  const e = E.nouvelleEtape('regler', { composants: [] }, 'mbot');
  assert.deepEqual(e, { regler: { distance: 2 } });
  assert.equal(E.decrireEtape({ regler: { distance: 10 } }, { composants: [] }, 'mbot'), 'Régler le capteur : l’obstacle est à 10 cm');
  assert.equal(E.decrireEtape({ regler: { ligne: 1 } }, { composants: [] }, 'mbot'), 'Régler le capteur : le suiveur de ligne voit du noir à gauche seulement');
  assert.equal(E.decrireEtape({ regler: { temperature: 30 } }, { composants: [] }, 'microbit'), 'Régler le capteur : la température est de 30 °C');
});

test('nouveau parcours et exercice créé de zéro : publiable, joué comme chez l’élève', () => {
  const p = E.creerParcours({ titre: 'Feu tricolore' });
  assert.equal(p.id, 'feu-tricolore');
  assert.deepEqual(numeros(p), ['1']);
  const ex = p.exercices[0];
  assert.match(E.controlerPublication(p).join(' '), /consigne est vide/);
  ex.titre = 'Le feu rouge';
  ex.consigne = 'Allumer la LED rouge de la broche D4 pendant 2 secondes, puis l’éteindre.';
  ex.composants = [{ type: 'led', nom: 'rouge', broche: 'D4' }];
  ex.indices = ['La LED s’allume, on attend, puis elle s’éteint.', 'Blocs : « contrôler la LED », « attendre ».'];
  // Solution construite dans Blockly (avec les identifiants des blocs), rangée sans eux.
  const blockly = versBlockly({ demarrage: [{ bloc: 'led_etat', broche: 'D4', etat: 1 }, { bloc: 'attendre', duree: 2 }, { bloc: 'led_etat', broche: 'D4', etat: 0 }], boucle: [] });
  ex.solutionReference = E.solutionDepuisProgramme(depuisBlockly(blockly).programme);
  assert.ok(!JSON.stringify(ex.solutionReference).includes('"id"'));
  assert.deepEqual(Object.keys(ex.solutionReference), ['demarrage', 'boucle']);
  ex.scenarios[0].etapes = [E.nouvelleEtape('verifier', ex), { attendre: 2.5 }, { verifier: { D4: 0 } }];
  assert.deepEqual(E.testerScenarios(p, ex).map((x) => x.reussi), [true]);
  assert.deepEqual(E.controlerPublication(p), []);
  const publie = E.publier(p);
  assert.equal(publie.versionParcours, '1.0.0', 'première publication');
  assert.equal(publie.jamaisPublie, undefined);
  assert.equal(E.publier(publie).versionParcours, '1.1.0');
  assert.deepEqual(controler(publie), []);
  assert.equal(preparer(publie).exercices[0].numero, '1');
});

test('version suivante', () => {
  assert.equal(E.versionSuivante('1.4.0'), '1.5.0');
  assert.equal(E.versionSuivante('1.0.1'), '1.1.0');
  assert.equal(E.versionSuivante(''), '1.1.0');
});
