// Exercice libre : composants déduits du programme, conflits de broches, « J'ai terminé », pas de niveau.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { composantsDuProgramme } = require('../noyau/programme.js');
const { controler, preparer } = require('../noyau/parcours.js');
const S = require('../noyau/sauvegarde.js');
const { evaluerEquipe } = require('../noyau/competences.js');
const { controlerPublication, exercicePrepare } = require('../noyau/edition.js');
const { lireTexteParcours } = require('../tools/parcours-depot.js');

const led = (broche, etat) => ({ bloc: 'led_etat', broche, etat });
const programme = (corps, autres) => ({ format: 'labo-blocs/programme', version: 1, fils: [{ quand: 'demarrage', corps: [] }, { quand: 'boucle', corps }].concat(autres || []) });

test('composants déduits : LED, bouton (condition et « quand »), servo, buzzer, dans l’ordre', () => {
  const p = programme(
    [
      led('D5', 1),
      { bloc: 'si_alors', condition: { bloc: 'bouton_etat', broche: 'D2' }, alors: [{ bloc: 'servo_angle', broche: 'D6', angle: { bloc: 'nombre', valeur: 90 } }] },
      { bloc: 'son', broche: 'D8', frequence: { bloc: 'nombre', valeur: 440 }, duree: { bloc: 'nombre', valeur: 1 } },
      led('D5', 0),
    ],
    [{ quand: 'appui', broche: 'D3', corps: [led('D7', 1)] }],
  );
  assert.deepStrictEqual(composantsDuProgramme(p), {
    composants: [
      { type: 'led', broche: 'D5' },
      { type: 'bouton', broche: 'D2' },
      { type: 'servo', broche: 'D6' },
      { type: 'buzzer', broche: 'D8' },
      { type: 'bouton', broche: 'D3' },
      { type: 'led', broche: 'D7' },
    ],
    conflits: [],
  });
  assert.deepStrictEqual(composantsDuProgramme(null), { composants: [], conflits: [] });
  // Ancien format { demarrage, boucle } aussi.
  assert.deepStrictEqual(composantsDuProgramme({ demarrage: [led('D4', 1)], boucle: [] }).composants, [{ type: 'led', broche: 'D4' }]);
});

test('une broche pour deux composants : les deux restent, marqués, et le conflit est signalé', () => {
  const r = composantsDuProgramme(
    programme([
      led('D2', 1),
      { bloc: 'si_alors', condition: { bloc: 'bouton_etat', broche: 'D2' }, alors: [] },
      { bloc: 'son', broche: 'D5', frequence: { bloc: 'nombre', valeur: 440 }, duree: { bloc: 'nombre', valeur: 1 } },
      { bloc: 'servo_angle', broche: 'D5', angle: { bloc: 'nombre', valeur: 90 } },
      led('D7', 1),
    ]),
  );
  assert.deepStrictEqual(r.composants, [
    { type: 'led', broche: 'D2', conflit: true },
    { type: 'bouton', broche: 'D2', conflit: true },
    { type: 'buzzer', broche: 'D5', conflit: true },
    { type: 'servo', broche: 'D5', conflit: true },
    { type: 'led', broche: 'D7' },
  ]);
  assert.deepStrictEqual(r.conflits, [
    { broche: 'D2', types: ['led', 'bouton'] },
    { broche: 'D5', types: ['buzzer', 'servo'] },
  ]);
});

const base = lireTexteParcours(fs.readFileSync(path.join(__dirname, '..', 'parcours', 'distributeur', 'parcours.js'), 'utf8'));
const libre = { id: 'dist-libre', numero: '15', titre: 'Invente ton animation', consigne: 'Invente une animation avec des LED et un bouton.', libre: true, composants: [], blocsAutorises: ['led_etat', 'attendre', 'bouton_etat', 'si_alors'] };
const paquetLibre = Object.assign(JSON.parse(JSON.stringify(base)), { exercices: base.exercices.slice(0, 2).concat([libre]) });

test('un exercice libre n’a besoin ni de solution ni de scénario ; publication possible', () => {
  assert.deepStrictEqual(controler(paquetLibre), []);
  assert.deepStrictEqual(controlerPublication(paquetLibre).filter((p) => /Exercice 15/.test(p)), []);
  // Sans « libre », les manques sont signalés.
  const sans = JSON.parse(JSON.stringify(paquetLibre));
  delete sans.exercices[2].libre;
  assert.match(controler(sans).join(' '), /Exercice 15 : pas de solution de référence/);
  // Aperçu de l'éditeur : les composants de l'exemple.
  const avecExemple = Object.assign({}, libre, { solutionReference: programme([led('D9', 1)]) });
  assert.deepStrictEqual(exercicePrepare(paquetLibre, avecExemple).composants, [{ type: 'led', broche: 'D9' }]);
});

test('« J’ai terminé » : exercice fait, le suivant s’ouvre ; aucun niveau ni retenue', () => {
  const paquet = preparer(Object.assign({}, paquetLibre, { exercices: [libre].concat(base.exercices.slice(0, 1)) }));
  const d = S.creerSauvegarde({ eleves: ['Léa'], classe: '5A' }, { parcours: paquet });
  assert.strictEqual(S.estDebloque(d, paquet, paquet.exercices[1].id), false);
  S.noterTermine(d, paquet.exercices[0], programme([led('D5', 1)]));
  const e = d.programmation.exercices['dist-libre'];
  assert.strictEqual(e.statut, 'reussi');
  assert.strictEqual(e.historique.at(-1).type, 'termine');
  assert.strictEqual(S.estDebloque(d, paquet, paquet.exercices[1].id), true);
  // Compétences : l'exercice libre ne compte nulle part.
  const ev = evaluerEquipe(d, paquet);
  assert.ok(ev.competences.every((c) => !c.exercices.includes('dist-libre')));
  // Un parcours fait seulement d'exercices libres : aucune compétence, pas de note.
  const seul = preparer(Object.assign({}, paquetLibre, { exercices: [libre] }));
  assert.deepStrictEqual(evaluerEquipe(d, seul).competences, []);
  assert.strictEqual(evaluerEquipe(d, seul).note, null);
});

test('« ouvert après » : des défis libres s’ouvrent tous dès que l’exercice désigné est réussi', () => {
  const ex = (id, autres) => Object.assign({}, libre, { id, numero: id, titre: id }, autres);
  const brut = Object.assign({}, paquetLibre, {
    exercices: [ex('e1'), ex('e2'), ex('d1', { ouvertApres: 'e2' }), ex('d2', { ouvertApres: 'e2' }), ex('d3', { ouvertApres: 'e2' })],
  });
  assert.deepStrictEqual(controler(brut), []);
  const paquet = preparer(brut);
  const d = S.creerSauvegarde({ eleves: ['Léa'], classe: '3B' }, { parcours: paquet });
  S.noterTermine(d, paquet.exercices[0], programme([]));
  assert.deepStrictEqual(['d1', 'd2', 'd3'].map((id) => S.estDebloque(d, paquet, id)), [false, false, false]);
  S.noterTermine(d, paquet.exercices[1], programme([]));
  assert.deepStrictEqual(['d1', 'd2', 'd3'].map((id) => S.estDebloque(d, paquet, id)), [true, true, true]);
  // Un exercice désigné qui n'est pas avant lui est refusé.
  const faux = Object.assign({}, brut, { exercices: [ex('e1', { ouvertApres: 'e2' }), ex('e2')] });
  assert.match(controler(faux).join(' '), /ouvert après/);
});
