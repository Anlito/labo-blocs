// Parcours « Simon Rétro Game », 4e (simon) et 5e (simon-5e) : 12 exercices chacun, chaque solution passe ; un
// programme incomplet reçoit une phrase qui décrit ce qu'il fait ; la vérification lit la séquence de l'élève.
// Les deux niveaux ont les mêmes exercices 1 à 4 et la même vérification ensuite : seul le guidage change.
const test = require('node:test');
const assert = require('node:assert/strict');
const { lireParcours } = require('./outils/parcours.js');
const { controler, preparer } = require('../noyau/parcours.js');
const { valider } = require('../noyau/validation.js');
const { compiler } = require('../noyau/code-octet.js');

const parcours4 = preparer(lireParcours('simon'));
const parcours5 = preparer(lireParcours('simon-5e'));
const exDe = (paquet) => (n) => paquet.exercices.find((e) => e.numero === String(n));
const ex = exDe(parcours4);
const ex5 = exDe(parcours5);
const copie = (x) => JSON.parse(JSON.stringify(x));

for (const [nom, paquet] of [['4e', parcours4], ['5e', parcours5]]) {
  test(`Simon ${nom} : 12 exercices, solutions vérifiées, départs qui compilent sans réussir`, () => {
    assert.deepEqual(controler(paquet), []);
    assert.equal(paquet.exercices.length, 12);
    assert.equal(exDe(paquet)(12).defi, true);
    for (const e of paquet.exercices) {
      const c = compiler(e.solutionReference, { composants: e.composants, boutonsVersMasse: true });
      assert.deepEqual(c.erreurs, [], e.id);
      assert.ok(c.octets.length < 1024, `${e.id} : ${c.octets.length} octets`);
      assert.equal(valider(e, e.solutionReference).reussi, true, e.id);
      if (e.blocsDepart) {
        assert.deepEqual(compiler(e.blocsDepart, { composants: e.composants, boutonsVersMasse: true }).erreurs, [], `${e.id} : départ`);
        assert.equal(valider(e, e.blocsDepart).reussi, false, `${e.id} : le départ réussit déjà`);
      }
    }
    // Les blocs de la palette partent de D2 : aucune consigne ne donne la broche dans les blocs de départ.
    for (const e of paquet.exercices.slice(0, 4)) assert.equal(e.blocsDepart, null, e.id);
  });
}

test('Simon : chaque parcours est celui d’un niveau (seules ses classes sont proposées) ; un niveau invalide est signalé', () => {
  assert.deepEqual(lireParcours('simon-5e').niveaux, ['5']);
  assert.deepEqual(lireParcours('simon').niveaux, ['4']);
  assert.match(controler(Object.assign(copie(lireParcours('simon')), { niveaux: ['4e'] })).join(' '), /Niveaux du parcours/);
});

test('Simon : les exercices 1 à 4 et les scénarios sont les mêmes en 5e et en 4e', () => {
  for (let n = 1; n <= 4; n++) assert.deepEqual(ex5(n), ex(n), `exercice ${n}`);
  for (let n = 5; n <= 12; n++) {
    assert.deepEqual(ex5(n).scenarios, ex(n).scenarios, `scénarios ${n}`);
    assert.deepEqual(ex5(n).solutionReference, ex(n).solutionReference, `solution ${n}`);
  }
});

test('Simon 5e : départs commentés, petite palette, jamais de reprise qui écraserait le départ', () => {
  for (let n = 5; n <= 11; n++) {
    const e = ex5(n);
    assert.ok(JSON.stringify(e.blocsDepart).includes('"commentaire"'), `${e.id} : pas de commentaire`);
    assert.ok(e.blocsAutorises.length <= 3, `${e.id} : palette de ${e.blocsAutorises.length} blocs`);
    assert.equal(e.reprendreProgramme, undefined, e.id);
  }
  // 4e : les exercices guidés repartent de leur départ ; la fin reprend le jeu de l'élève.
  for (const n of [5, 6, 7, 8, 9]) assert.equal(ex(n).reprendreProgramme, undefined, ex(n).id);
  for (const n of [10, 11, 12]) assert.equal(ex(n).reprendreProgramme, `simon-${String(n - 1).padStart(2, '0')}`);
});

test('Simon 5e : un seul bloc manque, et la phrase dit ce que fait le programme', () => {
  // Exercice 9 : avec « ajouter 1 à etape » à l'endroit du commentaire, c'est réussi.
  const p = copie(ex5(9).blocsDepart);
  const fin = p.fils[1].corps.find((b) => b.bloc === 'si_sinon');
  fin.sinon[0].alors.push({ bloc: 'ajouter_a', variable: 'etape', valeur: 1 });
  assert.equal(valider(ex5(9), p).reussi, true);
  assert.match(valider(ex5(9), ex5(9).blocsDepart).message, /devrait montrer 3 couleurs.*joue seulement 2 notes/);
  // Exercice 8 : le son d'erreur dans le « si erreur = 1 » suffit.
  const q = copie(ex5(8).blocsDepart);
  q.fils[1].corps.find((b) => b.bloc === 'si_alors').alors.push({ bloc: 'son', broche: 'D10', frequence: 110, duree: 1 }, { bloc: 'attendre', duree: 1 });
  assert.equal(valider(ex5(8), q).reussi, true);
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
