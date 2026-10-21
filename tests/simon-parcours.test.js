// Parcours « Simon Rétro Game » : 12 exercices, chaque solution passe ; un programme incomplet reçoit une phrase qui
// décrit ce qu'il fait ; la vérification lit la séquence de l'élève (elle n'en suppose aucune).
const test = require('node:test');
const assert = require('node:assert/strict');
const { lireParcours } = require('./outils/parcours.js');
const { controler, preparer } = require('../noyau/parcours.js');
const { valider } = require('../noyau/validation.js');
const { compiler } = require('../noyau/code-octet.js');

const paquet = preparer(lireParcours('simon'));
const ex = (n) => paquet.exercices.find((e) => e.numero === String(n));
const copie = (x) => JSON.parse(JSON.stringify(x));

test('Simon : 12 exercices, standard D2 à D10, solutions vérifiées et qui tiennent dans la carte', () => {
  assert.deepEqual(controler(paquet), []);
  assert.equal(paquet.exercices.length, 12);
  assert.equal(ex(12).defi, true);
  for (const e of paquet.exercices) {
    const c = compiler(e.solutionReference, { composants: e.composants, boutonsVersMasse: true });
    assert.deepEqual(c.erreurs, [], e.id);
    assert.ok(c.octets.length < 1024, `${e.id} : ${c.octets.length} octets`);
    assert.equal(valider(e, e.solutionReference).reussi, true, e.id);
  }
  // Les blocs de la palette partent de D2 : aucune consigne ne donne la broche dans les blocs de départ.
  for (const e of paquet.exercices.slice(0, 4)) assert.equal(e.blocsDepart, null, e.id);
  // À partir de l'exercice 6, on reprend son programme.
  for (const n of [6, 7, 8, 9, 10, 11, 12]) assert.equal(ex(n).reprendreProgramme, `simon-${String(n - 1).padStart(2, '0')}`);
});

test('Simon : la séquence de l’élève, quelle qu’elle soit, est lue et jouée', () => {
  // Mon Simon avec une autre séquence (8 couleurs) et d'autres notes : toujours réussi.
  const p = copie(ex(11).solutionReference);
  p.fils[0].corps[0].valeurs = [3, 3, 1, 4, 2, 1, 4, 2];
  assert.equal(valider(ex(11), p).reussi, true);
  // Trop courte : la phrase dit ce que contient la liste.
  p.fils[0].corps[0].valeurs = [3, 1, 2];
  const r = valider(ex(11), p);
  assert.equal(r.reussi, false);
  assert.match(r.message, /devrait contenir au moins 6 nombres.*elle en contient 3 : 3, 1, 2\./);
});

test('Simon : sans son d’erreur ou sans victoire, la phrase le dit', () => {
  // Son d'erreur joué avec la note d'une couleur : il ne compte pas.
  const p = copie(ex(10).solutionReference);
  const fin = p.fils[1].corps.find((i) => i.bloc === 'si_sinon');
  fin.alors[0].frequence = 262;
  const r = valider(ex(10), p);
  assert.equal(r.reussi, false);
  assert.match(r.message, /^Quand le joueur se trompe, le buzzer devrait jouer un son d’erreur, différent des notes des couleurs\./);
  // Le programme de l'exercice 9 (pas de musique de victoire) ne réussit pas le 10.
  assert.match(valider(ex(10), ex(9).solutionReference).message, /musique de victoire \(au moins 2 notes\)/);
});

test('Simon : le défi au hasard est vérifié sur la liste qui s’allonge', () => {
  for (let k = 0; k < 3; k++) assert.equal(valider(ex(12), ex(12).solutionReference).reussi, true, `essai ${k + 1}`);
  assert.equal(valider(ex(12), ex(11).solutionReference).reussi, false);
});
