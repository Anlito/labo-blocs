// Paquet de parcours : le distributeur refait sans code propre au projet (critère du jalon 1).
const test = require('node:test');
const assert = require('node:assert');
const { lireParcours } = require('./outils/parcours.js');
const { controler, preparer, comparer, empreinte, comparerVersions } = require('../noyau/parcours.js');
const { valider } = require('../noyau/validation.js');
const { chargerExercices } = require('../essais/reference/outils.js');

const paquet = lireParcours('distributeur');

test('le parcours du distributeur est un paquet valide, aux identifiants stables', () => {
  assert.deepStrictEqual(controler(paquet), []);
  const p = preparer(paquet);
  assert.deepStrictEqual(
    p.exercices.map((e) => e.id),
    ['dist-01', 'dist-02', 'dist-03', 'dist-04', 'dist-05', 'dist-06', 'dist-07', 'dist-08', 'dist-09', 'dist-10', 'dist-11', 'dist-12', 'dist-13a', 'dist-13b'],
  );
  assert.deepStrictEqual(p.exercices.filter((e) => e.defi).map((e) => e.id), ['dist-13b']);
  assert.deepStrictEqual(p.exercices.filter((e) => e.aideLed).map((e) => e.numero), ['1', '2', '3', '4', '5']);
});

test('mêmes exercices que l’atelier, et chaque solution réussit dans Labo Blocs', () => {
  const atelier = JSON.parse(JSON.stringify(chargerExercices()));
  for (const [i, e] of preparer(paquet).exercices.entries()) {
    const a = atelier[i];
    assert.strictEqual(e.numero, String(a.id));
    for (const k of ['titre', 'consigne', 'composants', 'blocsAutorises', 'scenarios', 'indices', 'solutionReference']) assert.deepStrictEqual(e[k], a[k], `${e.id} ${k}`);
    const r = valider(e, e.solutionReference);
    assert.strictEqual(r.reussi, true, `${e.id} : ${r.message}`);
  }
});

test('empreinte : stable, et change quand ce qui décide de la réussite change', () => {
  const e = preparer(paquet).exercices[4];
  assert.strictEqual(empreinte(e), preparer(lireParcours('distributeur')).exercices[4].empreinte);
  const autre = JSON.parse(JSON.stringify(e));
  autre.titre = 'Nouveau titre';
  assert.strictEqual(empreinte(autre), e.empreinte, 'un titre seul ne change pas l’empreinte');
  autre.scenarios[0].etapes[0].attendre = 1;
  assert.notStrictEqual(empreinte(autre), e.empreinte);
  // Un paramètre (durée de la grande dose) change les exercices qui l'utilisent.
  const p2 = lireParcours('distributeur');
  p2.parametres.dureeGrandeDose = 8;
  const avant = preparer(paquet).exercices;
  const apres = preparer(p2).exercices;
  const changes = apres.filter((x, i) => x.empreinte !== avant[i].empreinte).map((x) => x.id);
  assert.ok(changes.includes('dist-13a') && !changes.includes('dist-01'), changes.join(' '));
});

test('comparer deux versions : ajoutés, supprimés, modifiés, déplacés, textes', () => {
  const v2 = lireParcours('distributeur');
  v2.versionParcours = '1.4.0';
  const [un, deux] = v2.exercices.splice(0, 2);
  v2.exercices.splice(1, 0, deux, un); // 3, 2, 1, 4… : 1 et 3 ont changé de place
  v2.exercices = v2.exercices.filter((e) => e.id !== 'dist-12');
  v2.exercices.push({ ...v2.exercices[0], id: 'dist-14', numero: '14' });
  v2.exercices.find((e) => e.id === 'dist-05').consigne += ' Puis éteins-la.';
  v2.exercices.find((e) => e.id === 'dist-06').titre = 'Autre titre';
  const d = comparer(paquet, v2);
  assert.deepStrictEqual(d.ajoutes, ['dist-14']);
  assert.deepStrictEqual(d.supprimes, ['dist-12']);
  assert.deepStrictEqual(d.modifies, ['dist-05']);
  assert.deepStrictEqual(d.textes, ['dist-06']);
  assert.deepStrictEqual(d.deplaces.sort(), ['dist-01', 'dist-03']);
});

test('contrôle : identifiant en double, version du moteur trop ancienne', () => {
  const p = lireParcours('distributeur');
  p.exercices[1].id = 'dist-01';
  p.moteurMinimum = '9.0.0';
  const pb = controler(p, '0.1.0');
  assert.ok(pb.some((x) => x.includes('déjà utilisé')));
  assert.ok(pb.some((x) => x.includes('9.0.0')));
  assert.strictEqual(comparerVersions('1.10.0', '1.9.3'), 1);
});

test('modes : parcours et exercice, le simulateur toujours là', () => {
  const p = lireParcours('distributeur');
  assert.deepEqual(controler(p), []);
  p.exercices[0].modes = ['simulateur', 'direct'];
  assert.deepEqual(controler(p), []);
  p.exercices[1].modes = ['direct'];
  p.modes = ['simulateur', 'live'];
  assert.equal(controler(p).length, 2);
});
