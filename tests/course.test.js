// Moteur du mini-championnat de la course aux portes (noyau/course.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../noyau/course.js');

const noms = (n) => Array.from({ length: n }, (_, i) => `Équipe ${i + 1}`);
const fini = (temps, touches = 0) => ({ arrive: true, portes: 6, temps, touches });
const pasFini = (portes, temps = 180) => ({ arrive: false, portes, temps, touches: 0 });

// Remplit tous les départs non finis : l'équipe n° k fait k × 10 s (la 1re est la plus rapide).
function courir(etat, essai) {
  for (const d of etat.departs) for (const id of d.equipes) if (!d.resultats[id]) d.resultats[id] = essai ? essai(id, d) : fini(Number(id.slice(1)) * 10);
}

test('classement d’un essai : arrivés au temps total (malus compris), puis aux portes passées', () => {
  const R = { malus: 5 };
  assert.ok(C.comparer(fini(40), fini(42), R) < 0);
  assert.ok(C.comparer(fini(40, 1), fini(42), R) > 0, '40 s + 5 s de malus > 42 s');
  assert.ok(C.comparer(fini(170), pasFini(5, 60), R) < 0, 'arrivé avant non arrivé, même plus lent');
  assert.ok(C.comparer(pasFini(5), pasFini(3, 60), R) < 0, 'plus de portes passées');
  assert.equal(C.tempsTotal(fini(40.2, 2), R), 50.2);
});

test('égalités : même place', () => {
  const r = C.classer([{ equipe: 'a', essai: fini(30) }, { equipe: 'b', essai: fini(30) }, { equipe: 'c', essai: fini(35) }], C.REGLAGES);
  assert.deepEqual(r.map((l) => l.rang), [1, 1, 3]);
});

test('qualifications : chaque équipe court une fois par manche, départs de la taille des pistes', () => {
  const etat = C.creerCourse(noms(7), { manches: 3, pistes: 2 });
  for (let m = 1; m <= 3; m++) {
    const departs = etat.departs.filter((d) => d.manche === m);
    assert.deepEqual(departs.flatMap((d) => d.equipes).sort(), etat.equipes.map((e) => e.id).sort(), `manche ${m}`);
    assert.ok(departs.every((d) => d.equipes.length <= 2));
  }
  const premiers = etat.departs.filter((d) => d.equipes.length).map((d) => d.equipes[0]);
  assert.notEqual(etat.departs.find((d) => d.manche === 2).equipes[0], etat.departs[0].equipes[0], 'l’ordre tourne');
  assert.ok(premiers.length > 0);
});

test('meilleur essai retenu, puis finales par niveau courues de la dernière à la principale', () => {
  const etat = C.creerCourse(noms(9), { manches: 2, tailleFinale: 4, pistes: 1 });
  courir(etat, (id, d) => (d.manche === 1 ? pasFini(2) : fini(Number(id.slice(1)) * 10)));
  assert.ok(C.qualifsFinies(etat));
  const q = C.classementQualifications(etat);
  assert.equal(q[0].equipe, 'e1');
  assert.equal(q[0].essai.temps, 10, 'le meilleur des deux essais');
  const finales = C.composerFinales(etat);
  assert.deepEqual(finales.map((f) => f.nom), ['Finale principale', 'Finale secondaire', 'Finale tertiaire']);
  assert.deepEqual(finales.map((f) => f.equipes.length), [3, 3, 3]);
  assert.deepEqual(finales[0].equipes, ['e1', 'e2', 'e3']);
  assert.equal(C.prochainDepart(etat).finale, 'f3', 'la finale tertiaire d’abord');
  // En finale, l'équipe 3 fait le meilleur temps : elle gagne la finale principale.
  courir(etat, (id) => fini(id === 'e3' ? 5 : Number(id.slice(1)) * 10));
  assert.ok(C.finalesFinies(etat));
  const g = C.classementGeneral(etat);
  assert.deepEqual(g.slice(0, 4).map((l) => [l.equipe, l.rang]), [['e3', 1], ['e1', 2], ['e2', 3], ['e4', 4]]);
  assert.equal(g.length, 9, 'personne n’est éliminé');
  assert.deepEqual(C.record(etat), { equipe: 'e3', temps: 5, depart: 'Finale principale · départ 3' });
});

test('peu d’équipes : une seule « Finale » avec tout le monde ; sans finales, le classement des manches', () => {
  const etat = C.creerCourse(noms(3), { manches: 1 });
  courir(etat);
  assert.deepEqual(C.composerFinales(etat).map((f) => f.nom), ['Finale']);
  const sans = C.creerCourse(noms(3), { manches: 2, finales: false });
  courir(sans);
  assert.deepEqual(C.classementGeneral(sans).map((l) => l.equipe), ['e1', 'e2', 'e3']);
});

test('durée estimée et format proposé selon le nombre d’équipes', () => {
  assert.equal(C.nombreDeparts(8, { pistes: 1, manches: 2, tailleFinale: 4 }), 8 * 2 + 8);
  assert.equal(C.nombreDeparts(8, { pistes: 2, manches: 2, tailleFinale: 4 }), 4 * 2 + 4);
  assert.deepEqual(C.proposerFormat(4, 60, { pistes: 1 }), { manches: 3, finales: true });
  assert.deepEqual(C.proposerFormat(8, 45, { pistes: 1 }), { manches: 1, finales: true });
  assert.deepEqual(C.proposerFormat(8, 45, { pistes: 2 }), { manches: 3, finales: true });
  assert.deepEqual(C.proposerFormat(12, 20, { pistes: 1 }), { manches: 1, finales: false });
});

test('export CSV : séparateur « ; », virgule décimale, classement général', () => {
  const etat = C.creerCourse(['Les Fous', 'Turbo'], { manches: 1, finales: false });
  etat.departs[0].resultats.e1 = fini(41.5, 1);
  etat.departs[1].resultats.e2 = pasFini(4);
  const texte = C.csv(C.lignesCsv(etat));
  assert.match(texte, /Les Fous;oui;6;41,5;1;46,5/);
  assert.match(texte, /1re;;Les Fous;46,5 s \(dont 1 malus\)/);
  assert.match(texte, /2e;;Turbo;4 portes sur 6/);
});
