// Programme v1 ⇄ sauvegarde Blockly : aller-retour sans perte, anciennes sauvegardes de l'atelier relues.
const test = require('node:test');
const assert = require('node:assert');
const { depuisBlockly, versBlockly, versV1, typesDeBlocs } = require('../noyau/programme.js');
const { chargerExercices } = require('../essais/reference/outils.js');
const ref = require('../essais/reference/moteur/programme.js');

// Sans les « id » (ajoutés par Blockly) pour comparer.
// Un nombre écrit seul (raccourci) vaut un bloc « nombre ».
const CHAMPS = new Set(['duree', 'angle', 'valeur', 'fois', 'frequence', 'min', 'max', 'a', 'b']);
const sansId = (x) =>
  JSON.parse(
    JSON.stringify(x, function (k, v) {
      if (k === 'id') return undefined;
      const nombre = CHAMPS.has(k) && typeof v === 'number' && (k !== 'valeur' || this.bloc === 'affecter' || this.bloc === 'ajouter_a');
      return nombre ? { bloc: 'nombre', valeur: v } : v;
    }),
  );

test('aller-retour Blockly pour les 14 solutions du distributeur', () => {
  for (const ex of chargerExercices()) {
    const r = depuisBlockly(versBlockly(ex.solutionReference));
    assert.deepStrictEqual(r.horsProgramme, []);
    assert.deepStrictEqual(r.incomplets, []);
    assert.deepStrictEqual(sansId(r.programme.fils), sansId(versV1(ex.solutionReference).fils), ex.id);
  }
});

test('une sauvegarde Blockly écrite par l’atelier se relit à l’identique', () => {
  for (const ex of chargerExercices()) {
    const blocklyAtelier = ref.versBlockly(ex.solutionReference);
    const r = depuisBlockly(blocklyAtelier);
    const attendu = ref.depuisBlockly(blocklyAtelier).programme;
    assert.deepStrictEqual(sansId(r.programme), sansId(versV1(attendu)), ex.id);
  }
});

test('blocs nouveaux : quand le bouton, répéter, tant que, opérations, hasard, son', () => {
  const p = {
    fils: [
      { quand: 'demarrage', corps: [{ bloc: 'son', broche: 'D8', frequence: 440, duree: 0.5 }] },
      { quand: 'boucle', corps: [{ bloc: 'repeter_n', fois: 3, corps: [{ bloc: 'led_etat', broche: 'D2', etat: 1 }] }] },
      {
        quand: 'appui',
        broche: 'D7',
        corps: [
          { bloc: 'tant_que', condition: { bloc: 'logique', op: 'ou', a: { bloc: 'non', a: { bloc: 'bouton_etat', broche: 'D7' } }, b: { bloc: 'comparaison', op: '≥', a: { bloc: 'variable', variable: 'CHOIX' }, b: { bloc: 'nombre', valeur: 3 } } }, corps: [{ bloc: 'ajouter_a', variable: 'CHOIX', valeur: { bloc: 'nombre', valeur: 1 } }] },
          { bloc: 'servo_angle', broche: 'D6', angle: { bloc: 'operation', op: '×', a: { bloc: 'hasard', min: { bloc: 'nombre', valeur: 1 }, max: { bloc: 'nombre', valeur: 6 } }, b: { bloc: 'nombre', valeur: 30 } } },
        ],
      },
      { quand: 'relache', broche: 'D7', corps: [{ bloc: 'repeter_jusqua', condition: { bloc: 'valeur_haut_bas', valeur: 1 }, corps: [] }] },
    ],
  };
  const r = depuisBlockly(versBlockly(p));
  assert.deepStrictEqual(r.incomplets, []);
  const norm = (x) => sansId(x).fils.map((f) => ({ ...f, corps: f.corps }));
  assert.deepStrictEqual(norm(r.programme), norm({ fils: p.fils.map((f) => ({ ...f })) }));
  assert.ok(typesDeBlocs(p).includes('quand_bouton'));
});

test('bloc seul hors du programme et entrée vide : signalés', () => {
  const s = {
    blocks: {
      blocks: [
        { type: 'demarrage', id: 'demarrage', inputs: { DO: { block: { type: 'attendre', id: 'a1' } } } },
        { type: 'led_etat', id: 'seul', fields: { ETAT: '1', BROCHE: 'D2' } },
      ],
    },
  };
  const r = depuisBlockly(s);
  assert.deepStrictEqual(r.horsProgramme, ['seul']);
  assert.deepStrictEqual(r.incomplets, ['a1']);
});
