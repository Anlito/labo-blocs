// Parcours « La course aux portes » (3e, mBot + caméra) : 2 exercices vérifiés, l'entraînement libre et un bonus.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../noyau/edition.js');
const V = require('../noyau/validation.js');
const { controler, preparer } = require('../noyau/parcours.js');
const { lireParcours } = require('../tools/construire-module.js');

const brut = lireParcours(fs.readFileSync(path.join(__dirname, '..', 'parcours', 'course-portes', 'parcours.js'), 'utf8'));
const paquet = preparer(brut);
const ex = (numero) => paquet.exercices.find((e) => e.numero === numero);

const deplacer = (direction, vitesse) => ({ bloc: 'mbot_deplacer', direction, vitesse });
const arreter = { bloc: 'mbot_arreter' };
const voit = (n) => ({ bloc: 'camera_reconnait', etiquette: String(n) });
const siSinon = (condition, alors, sinon) => ({ bloc: 'si_sinon', condition, alors, sinon });
const boucle = (...corps) => ({ demarrage: [], boucle: corps });
const fils = (...f) => ({ format: 'labo-blocs/programme', version: 1, fils: [{ quand: 'demarrage', corps: [] }, { quand: 'boucle', corps: [] }, ...f] });
const camera = (etiquette, front, ...corps) => ({ quand: 'camera', etiquette, front, corps });

function ecart(numero, programme) {
  const e = ex(numero);
  for (const s of e.scenarios) {
    const r = V.jouerScenario(e, programme, s);
    if (!r.reussi) return r.message;
  }
  return null;
}

test('le parcours est publiable : chaque solution passe ses scénarios', () => {
  assert.deepEqual(controler(brut), []);
  assert.deepEqual(E.controlerPublication(brut), []);
  assert.equal(brut.carte, 'mbot');
  assert.deepEqual(brut.niveaux, ['3']);
  assert.deepEqual(paquet.exercices.map((e) => e.numero), ['1', '2', '3', '4']);
});

test('les mêmes 4 commandes partout : l’IA n’est apprise qu’une fois', () => {
  for (const e of paquet.exercices) assert.deepEqual(e.camera.etiquettes, ['Avancer', 'Reculer', 'Gauche', 'Droite'], e.numero);
  for (const e of paquet.exercices) assert.equal(e.blocsDepart, null, e.numero);
});

test('exercice 1 : sans l’arrêt, un seul écart, décrit sans « tu as faux »', () => {
  const m = ecart('1', fils(camera(1, 'voit', deplacer('avancer', 40))));
  assert.ok(m);
  assert.doesNotMatch(m, /faux/i);
  assert.equal(ecart('1', fils(camera(1, 'voit', deplacer('avancer', 40)), camera(1, 'plus', arreter))), null);
});

test('exercice 2 : virages inversés → écart ; sans sécurité « Rien » → écart', () => {
  const programme = (g, d, sinon) =>
    boucle(siSinon(voit(1), [deplacer('avancer', 40)], [siSinon(voit(2), [deplacer('reculer', 40)], [siSinon(voit(3), [deplacer(g, 40)], [siSinon(voit(4), [deplacer(d, 40)], sinon)])])]));
  assert.ok(ecart('2', programme('droite', 'gauche', [arreter])), 'gauche et droite inversées');
  assert.ok(ecart('2', programme('gauche', 'droite', [])), 'il continue quand la caméra ne voit rien');
  assert.equal(ecart('2', programme('gauche', 'droite', [arreter])), null);
});

test('exercice 2 marche aussi avec les événements « quand la caméra … »', () => {
  const p = fils(
    camera(1, 'voit', deplacer('avancer', 40)),
    camera(2, 'voit', deplacer('reculer', 40)),
    camera(3, 'voit', deplacer('gauche', 40)),
    camera(4, 'voit', deplacer('droite', 40)),
    camera(0, 'voit', arreter)
  );
  assert.equal(ecart('2', p), null);
});

test('entraînement et bonus : libres, en direct, le bonus ouvert après l’exercice 2', () => {
  assert.ok(ex('3').libre && ex('3').modes.includes('direct'));
  assert.ok(ex('4').libre && ex('4').ouvertApres === 'cp-02');
});
