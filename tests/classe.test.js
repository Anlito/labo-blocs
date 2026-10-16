// Jalon 5 : suivi d'une classe test de 8 équipes (données fictives, tools/classe-test.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const C = require('../noyau/classe.js');
const K = require('../noyau/competences.js');
const { creerClasse } = require('../tools/classe-test.js');
const { lireParcours } = require('./outils/parcours.js');
const { preparer } = require('../noyau/parcours.js');

const maintenant = new Date(2026, 9, 20, 15, 0, 0);
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'classe-'));
const fichiers = creerClasse(path.join(dossier, '5A'), { maintenant }).map((f) => ({ nom: path.relative(dossier, f), texte: fs.readFileSync(f, 'utf8') }));
const paquet = preparer(lireParcours('distributeur'));

test('8 équipes lues ; un fichier qui n’est pas une sauvegarde est refusé avec sa raison', () => {
  const { equipes, refuses } = C.chargerEquipes([...fichiers, { nom: '5A/notes.json', texte: '{"a":1}' }, { nom: '5A/labo-blocs-professeur.json', texte: '{}' }], [paquet]);
  assert.equal(equipes.length, 8);
  assert.deepEqual(refuses.map((r) => r.nom), ['5A/notes.json']);
  assert.ok(equipes.every((e) => e.classe === '5A'));
});

test('tableau : progression, indices, envoi, bloquée, absente, parcours terminé', () => {
  const { equipes } = C.chargerEquipes(fichiers, [paquet]);
  const r = Object.fromEntries(equipes.map((e) => [e.eleves.join(' '), C.resumerEquipe(e, { maintenant })]));
  assert.equal(r['Léa Hugo'].reussis, 3);
  assert.equal(r['Léa Hugo'].cellules[3].etat, 'en_cours');
  assert.equal(r['Léa Hugo'].indices, 1);
  assert.equal(r['Sacha Maël'].etat.texte, 'Bloquée sur le 5');
  assert.equal(r['Lucas Ethan'].etat.cle, 'bloquee');
  assert.equal(r['Théo Rayan'].etat.cle, 'inactive');
  assert.equal(r['Camille Jade'].etat.texte, 'Parcours terminé');
  assert.deepEqual(r['Camille Jade'].dernierEnvoi.numero, '13A');
  assert.equal(r['Inès Noah'].etat.cle, 'rythme');
  const classe = C.resumerClasse(Object.values(r), maintenant);
  assert.deepEqual(classe, { equipes: 8, bloquees: 2, envoisAujourdhui: 2, aReverifier: 0 });
  assert.equal(C.ilYa('2026-10-20T14:57:00', maintenant), 'il y a 3 min');
  assert.equal(C.ilYa('2026-10-19T09:00:00', maintenant), 'hier');
});

test('niveaux et note : la classe se répartit ; le niveau forcé et le commentaire du professeur passent dans les résultats', () => {
  const { equipes } = C.chargerEquipes(fichiers, [paquet]);
  const prof = C.professeurVide();
  const lucas = equipes.find((e) => e.eleves[0] === 'Lucas');
  prof.equipes[lucas.cle] = { forces: { C9: 2 }, commentaire: 'Beaucoup d’aide sur les premiers exercices.' };
  const r = C.resultatsClasse(equipes, C.lireProfesseur(JSON.stringify(prof)), { projet: { id: 'distributeur', titre: 'Distributeur' }, date: '2026-10-20' });
  assert.equal(r.equipes.length, 8);
  assert.deepEqual(r.competences.map((c) => c.code), ['C6', 'C9']);
  const camille = r.equipes.find((e) => e.eleves[0] === 'Camille');
  assert.deepEqual(camille.niveaux, { C6: 3, C9: 4 }, 'tout réussi, défi compris');
  assert.equal(camille.note, 17.5);
  const l = r.equipes.find((e) => e.eleves[0] === 'Lucas');
  assert.equal(l.niveaux.C9, 2);
  assert.equal(l.commentaire, 'Beaucoup d’aide sur les premiers exercices.');
  const notes = r.equipes.map((e) => e.note);
  assert.ok(Math.min(...notes) < 10 && Math.max(...notes) > 15, notes.join(' '));
  const csv = K.csvResultats(r);
  assert.equal(csv.trim().split('\r\n').length, 9);
  // Objectif : seuls les 5 premiers exercices comptent.
  const r5 = C.resultatsClasse(equipes, Object.assign(C.professeurVide(), { objectif: 5 }), {});
  assert.ok(r5.equipes.find((e) => e.eleves[0] === 'Léa').note > r.equipes.find((e) => e.eleves[0] === 'Léa').note);
});
