// Parcours « mBot Challenge » (3e) : 8 exercices vérifiés, puis 5 défis libres ouverts ensemble après l'exercice 8.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../noyau/edition.js');
const V = require('../noyau/validation.js');
const S = require('../noyau/sauvegarde.js');
const { controler, preparer } = require('../noyau/parcours.js');
const { lireParcours } = require('../tools/construire-module.js');

const brut = lireParcours(fs.readFileSync(path.join(__dirname, '..', 'parcours', 'mbot-challenge', 'parcours.js'), 'utf8'));
const paquet = preparer(brut);
const ex = (numero) => paquet.exercices.find((e) => e.numero === numero);

const nb = (valeur) => ({ bloc: 'nombre', valeur });
const avancer = (vitesse) => ({ bloc: 'mbot_deplacer', direction: 'avancer', vitesse });
const arreter = { bloc: 'mbot_arreter' };
const led = (quelle, couleur) => ({ bloc: 'mbot_led', quelle, couleur });
const voit = (cote) => ({ bloc: 'mbot_ligne_voit', cote, couleur: 'noir' });
const boucle = (...corps) => ({ demarrage: [], boucle: corps });
const siSinon = (condition, alors, sinon) => ({ bloc: 'si_sinon', condition, alors, sinon });

// Premier écart trouvé par « Vérifier » (null si le programme passe).
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
  assert.deepEqual(paquet.exercices.map((e) => e.numero), ['1', '2', '3', '4', '5', '6', '7', '8', 'D1', 'D2', 'D3', 'D4', 'D5']);
});

test('les palettes ne donnent pas la réponse : aucun bloc de départ', () => {
  for (const e of paquet.exercices) assert.equal(e.blocsDepart, null, e.numero);
});

test('exercice 4 : couleurs inversées → un seul écart, décrit sans « tu as faux »', () => {
  const m = ecart('4', boucle(siSinon({ bloc: 'mbot_bouton' }, [led('0', 'rouge')], [led('0', 'bleu')])));
  assert.ok(m);
  assert.doesNotMatch(m, /faux/i);
});

test('exercice 5 : seulement le côté gauche → l’écart porte sur la LED droite', () => {
  const m = ecart('5', boucle(siSinon(voit('gauche'), [led('2', 'vert')], [led('2', 'eteinte')])));
  assert.match(m, /LED droite/);
});

test('exercice 6 : « ou » au lieu de « et » → le mBot avance alors qu’un seul capteur voit la ligne', () => {
  const ou = boucle(siSinon({ bloc: 'logique', op: 'ou', a: voit('gauche'), b: voit('droit') }, [avancer(50)], [arreter]));
  assert.ok(ecart('6', ou));
  const et = boucle(siSinon({ bloc: 'logique', op: 'et', a: voit('gauche'), b: voit('droit') }, [avancer(50)], [arreter]));
  assert.equal(ecart('6', et), null);
});

test('exercices 7 et 8 : la distance et le virage', () => {
  const pres = (cm) => ({ bloc: 'comparaison', op: '<', a: { bloc: 'mbot_distance' }, b: nb(cm) });
  assert.ok(ecart('7', boucle(siSinon(pres(20), [arreter], [avancer(50)]))), 'seuil de 20 cm au lieu de 5');
  assert.equal(ecart('7', boucle(siSinon(pres(5), [arreter], [avancer(50)]))), null);
  assert.ok(ecart('8', boucle(siSinon(pres(10), [arreter], [avancer(50)]))), 'il s’arrête au lieu de tourner');
  const virage = (duree) => boucle(siSinon(pres(10), [{ bloc: 'mbot_deplacer_pendant', direction: 'gauche', vitesse: 50, duree }], [avancer(50)]));
  assert.equal(ecart('8', virage(0.5)), null, 'la durée du virage se règle sur le vrai mBot');
});

test('exercice 3 : une note en continu, même sans appui → écart', () => {
  assert.ok(ecart('3', boucle({ bloc: 'mbot_note', note: '262', duree: 0.5 })));
});

test('les 5 défis s’ouvrent tous ensemble dès l’exercice 8 réussi', () => {
  const d = S.creerSauvegarde({ eleves: ['Inès'], classe: '3B' }, { parcours: paquet });
  const defis = ['mbc-d1', 'mbc-d2', 'mbc-d3', 'mbc-d4', 'mbc-d5'];
  for (const e of paquet.exercices.slice(0, 7)) {
    if (e.libre) S.noterTermine(d, e, e.solutionReference);
    else S.noterVerification(d, e, { reussi: true, programme: e.solutionReference });
  }
  assert.deepEqual(defis.map((id) => S.estDebloque(d, paquet, id)), [false, false, false, false, false]);
  S.noterVerification(d, ex('8'), { reussi: true, programme: ex('8').solutionReference });
  assert.deepEqual(defis.map((id) => S.estDebloque(d, paquet, id)), [true, true, true, true, true]);
  // Les défis pilotés au clavier se font en direct (ou dans le simulateur), jamais dans la carte.
  assert.deepEqual(ex('D3').modes, ['simulateur', 'direct']);
  assert.deepEqual(ex('D4').modes, ['simulateur', 'direct']);
});
