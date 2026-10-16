// Jalon 5 : niveaux par compétence, note /20, fichier de résultats pour le Carnet de classe.
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../noyau/competences.js');

const paquet = {
  id: 'essai',
  titre: 'Essai',
  versionParcours: '1.0.0',
  exercices: [
    { id: 'e1', competence: 'C9' },
    { id: 'e2', competence: 'C9' },
    { id: 'e3', competence: 'C6' },
    { id: 'e4', competence: 'C6' },
    { id: 'e5', competence: 'C6', defi: true },
  ],
};
const verif = (reussi) => ({ type: 'verification', reussi });
const indice = (niveau) => ({ type: 'indice', niveau });
const sauvegarde = (ex) => ({ programmation: { exercices: ex } });

test('score d’un exercice : réussi du premier coup, avec indices et erreurs, commencé, pas commencé', () => {
  assert.equal(K.scoreExercice({ statut: 'reussi', historique: [verif(true)] }).score, 1);
  const r = K.scoreExercice({ statut: 'reussi', historique: [indice(1), indice(2), verif(false), verif(false), verif(true), verif(false)] });
  assert.equal(Math.round(r.score * 100), 70); // 2 indices (0,2) + 2 vérifications ratées (0,1), après la réussite : rien
  assert.equal(K.scoreExercice({ statut: 'reussi', historique: [indice(3), indice(3), ...Array(10).fill(verif(false)), verif(true)] }).score, 0.45); // plafonds
  assert.equal(K.scoreExercice({ statut: 'en_cours', historique: [verif(false)] }).score, 0.2);
  assert.equal(K.scoreExercice({ statut: 'en_cours', historique: [] }).score, 0);
  assert.equal(K.scoreExercice(undefined).score, 0);
});

test('niveaux : Non atteint, Partiellement atteint, Atteint, Dépassé (défi réussi) ; note = moyenne × 5', () => {
  const ok = { statut: 'reussi', historique: [verif(true)] };
  let r = K.evaluerEquipe(sauvegarde({}), paquet);
  assert.deepEqual(r.competences.map((c) => [c.code, c.niveau]), [['C6', 1], ['C9', 1]]);
  assert.equal(r.note, 5);
  r = K.evaluerEquipe(sauvegarde({ e1: ok, e2: { statut: 'en_cours', historique: [verif(false)] }, e3: ok, e4: ok }), paquet);
  assert.deepEqual(r.competences.map((c) => [c.code, c.niveau]), [['C6', 3], ['C9', 3]]); // C9 : (1 + 0,2) / 2 = 0,6 : le seuil « Atteint » est atteint
  assert.equal(r.competences.find((c) => c.code === 'C9').moyenne, 0.6);
  r = K.evaluerEquipe(sauvegarde({ e1: ok, e2: ok, e3: ok, e4: ok, e5: ok }), paquet);
  assert.deepEqual(r.competences.map((c) => [c.code, c.niveau]), [['C6', 4], ['C9', 3]]);
  assert.equal(r.note, 17.5);
  assert.equal(r.reussis, 5);
});

test('niveau forcé par le professeur ; exercices attendus (objectif)', () => {
  const ok = { statut: 'reussi', historique: [verif(true)] };
  const r = K.evaluerEquipe(sauvegarde({ e1: ok }), paquet, { forces: { C6: 2 }, bareme: { objectif: 1 } });
  const c6 = r.competences.find((c) => c.code === 'C6');
  assert.equal(c6.niveau, 2);
  assert.equal(c6.force, 2);
  assert.equal(c6.calcule, null, 'aucun exercice C6 attendu');
  assert.equal(r.competences.find((c) => c.code === 'C9').niveau, 3);
});

test('fichier de résultats et CSV : relus, libellés du programme, niveaux Pronote', () => {
  const ok = { statut: 'reussi', historique: [verif(true)] };
  const r = K.creerResultats({
    projet: { id: 'essai', titre: 'Essai' },
    paquet,
    date: '2026-10-20',
    equipes: [{ eleves: ['Léa', 'Hugo'], classe: '5A', commentaire: 'Très bien ; « autonomes »', evaluation: K.evaluerEquipe(sauvegarde({ e1: ok, e2: ok }), paquet) }],
  });
  const relu = K.lireResultats(JSON.stringify(r));
  assert.ok(relu.ok);
  assert.deepEqual(r.competences.map((c) => c.code), ['C6', 'C9']);
  assert.equal(r.competences[1].libelle, 'Concevoir, écrire, tester et mettre au point un programme');
  assert.deepEqual(r.equipes[0].niveaux, { C6: 1, C9: 3 });
  const csv = K.csvResultats(r);
  assert.ok(csv.startsWith('﻿Classe;Élèves;C6 '));
  assert.match(csv, /5A;Léa, Hugo;1 - Non atteint;3 - Atteint;10;2\/5;"Très bien ; « autonomes »"/);
  assert.equal(K.lireResultats('{"format":"autre"}').ok, false);
});
