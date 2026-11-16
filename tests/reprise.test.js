// Bouton « Reprendre l'exercice … » : l'élève repart du programme de l'exercice juste avant (même carte, programme
// non vide), sauf si le professeur l'a retiré de l'exercice (sansReprise).
const test = require('node:test');
const assert = require('node:assert');
const S = require('../noyau/sauvegarde.js');
const { preparer } = require('../noyau/parcours.js');
const { versBlockly } = require('../noyau/programme.js');
const { lireParcours } = require('./outils/parcours.js');

const paquet = preparer(lireParcours('distributeur'));
const [ex1, ex2, ex3] = paquet.exercices;
const nouvelle = () => S.creerSauvegarde({ eleves: ['Léa'], classe: '5A' }, { parcours: paquet, projet: 'distributeur' });
const vide = versBlockly({ demarrage: [], boucle: [] });
const allumer = versBlockly({ demarrage: [{ bloc: 'led_etat', broche: 'D9', etat: 1 }], boucle: [] });

test('programme de l’exercice précédent proposé seulement s’il n’est pas vide', () => {
  const d = nouvelle();
  assert.strictEqual(S.programmePrecedent(d, paquet, ex1.id), null, 'le premier exercice n’a pas de précédent');
  assert.strictEqual(S.programmePrecedent(d, paquet, ex2.id), null, 'rien de fait dans l’exercice 1');
  S.noterProgramme(d, ex1.id, vide);
  assert.strictEqual(S.programmePrecedent(d, paquet, ex2.id), null, 'seulement « Au démarrage » et « Répéter indéfiniment » vides');
  S.noterProgramme(d, ex1.id, allumer);
  const p = S.programmePrecedent(d, paquet, ex2.id);
  assert.strictEqual(p.exercice.id, ex1.id);
  assert.deepStrictEqual(p.programme, allumer);
  // Seulement l'exercice juste avant : pas l'exercice 1 depuis l'exercice 3.
  assert.strictEqual(S.programmePrecedent(d, paquet, ex3.id), null);
  // Une note seule (commentaire du programme) compte comme un programme.
  S.noterProgramme(d, ex2.id, Object.assign({}, vide, { workspaceComments: [{ text: 'mon idée' }] }));
  assert.strictEqual(S.programmePrecedent(d, paquet, ex3.id).exercice.id, ex2.id);
});

test('le professeur peut retirer le bouton d’un exercice ; une autre carte ne se reprend pas', () => {
  const d = nouvelle();
  S.noterProgramme(d, ex1.id, allumer);
  const sans = Object.assign({}, paquet, { exercices: [ex1, Object.assign({}, ex2, { sansReprise: true })] });
  assert.strictEqual(S.programmePrecedent(d, sans, ex2.id), null);
  const autreCarte = Object.assign({}, paquet, { exercices: [Object.assign({}, ex1, { carte: 'microbit' }), Object.assign({}, ex2, { carte: 'uno' })] });
  assert.strictEqual(S.programmePrecedent(d, autreCarte, ex2.id), null);
  assert.strictEqual(S.programmeNonVide(allumer), true);
  assert.strictEqual(S.programmeNonVide(vide), false);
  assert.strictEqual(S.programmeNonVide(null), false);
});
