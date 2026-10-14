// Jalon 0 : blocs absents de l'atelier mais prévus dès le noyau (R1) : boucles, hasard, listes, fonctions,
// fils « quand le bouton … ». Comportement attendu écrit à la main, vérifié dans l'interpréteur C.
const test = require('node:test');
const assert = require('node:assert');
const { compiler } = require('../essais/code-octet/compilateur.js');
const { executer } = require('../essais/outils/hote.js');

const n = (valeur) => ({ bloc: 'nombre', valeur });
const v = (variable) => ({ bloc: 'variable', variable });
const led = (broche, etat) => ({ bloc: 'led_etat', broche, etat });
const att = (s) => ({ bloc: 'attendre', duree: s });
const op = (o, a, b) => ({ bloc: 'operation', op: o, a, b });
const cmp = (o, a, b) => ({ bloc: 'comparaison', op: o, a, b });
const fils = (...f) => ({ fils: f });

function lancer(programme, duree, entrees, options) {
  const { octets, erreurs } = compiler(programme, options);
  assert.deepStrictEqual(erreurs, []);
  const r = executer(octets, duree, entrees);
  assert.strictEqual(r.erreur, null);
  return r.journal.map((e) => (e.type === 'ext' ? `${e.t} ext ${e.commande} ${e.arguments.join(' ')}` : `${e.t} ${e.broche}=${e.valeur}`));
}

test('répéter 3 fois : trois clignotements puis plus rien', () => {
  const p = fils({ quand: 'demarrage', corps: [{ bloc: 'repeter_n', fois: 3, corps: [led('D2', 1), att(0.5), led('D2', 0), att(0.5)] }] });
  assert.deepStrictEqual(lancer(p, 5000), ['0 2=1', '500 2=0', '1000 2=1', '1500 2=0', '2000 2=1', '2500 2=0']);
});

test('tant que / répéter jusqu’à avec une variable', () => {
  const p = fils({
    quand: 'demarrage',
    corps: [
      { bloc: 'affecter', variable: 'i', valeur: 0 },
      { bloc: 'tant_que', condition: cmp('<', v('i'), 4), corps: [{ bloc: 'ajouter_a', variable: 'i', valeur: 1 }, att(0.1)] },
      { bloc: 'servo_angle', broche: 'D6', angle: op('×', v('i'), 10) },
      { bloc: 'repeter_jusqua', condition: cmp('=', v('i'), 0), corps: [{ bloc: 'ajouter_a', variable: 'i', valeur: -1 }] },
      { bloc: 'servo_angle', broche: 'D6', angle: op('+', v('i'), 90) },
    ],
  });
  assert.deepStrictEqual(lancer(p, 1000), ['400 6=40', '400 6=90']);
});

test('opérations : virgules, division par zéro, reste comme Scratch', () => {
  const p = fils({
    quand: 'demarrage',
    corps: [
      { bloc: 'servo_angle', broche: 'D5', angle: op('÷', 7, 2) }, // 3,5 → 4 (arrondi)
      att(0.1),
      { bloc: 'servo_angle', broche: 'D5', angle: op('÷', 7, 0) }, // 0
      att(0.1),
      { bloc: 'servo_angle', broche: 'D5', angle: op('+', op('mod', -1, 5), 100) }, // 4 + 100
      att(0.1),
      { bloc: 'servo_angle', broche: 'D5', angle: op('×', n(0.25), 400) }, // 100
    ],
  });
  assert.deepStrictEqual(lancer(p, 1000), ['0 5=4', '100 5=0', '200 5=104', '300 5=100']);
});

test('hasard : toujours entre les bornes, bornes atteintes', () => {
  const p = fils({
    quand: 'demarrage',
    corps: [{ bloc: 'repeter_n', fois: 100, corps: [{ bloc: 'servo_angle', broche: 'D6', angle: { bloc: 'hasard', min: 10, max: 13 } }, att(0.01)] }],
  });
  const valeurs = new Set(lancer(p, 2000).map((l) => Number(l.split('=')[1])));
  assert.deepStrictEqual([...valeurs].sort(), [10, 11, 12, 13]);
});

test('listes : ajouter, lire, remplacer, taille, vider', () => {
  const p = {
    listes: [{ nom: 'notes', capacite: 8 }],
    fils: [
      {
        quand: 'demarrage',
        corps: [
          { bloc: 'liste_ajouter', liste: 'notes', valeur: 30 },
          { bloc: 'liste_ajouter', liste: 'notes', valeur: 60 },
          { bloc: 'liste_remplacer', liste: 'notes', position: 1, valeur: 45 },
          { bloc: 'servo_angle', broche: 'D6', angle: { bloc: 'liste_element', liste: 'notes', position: 1 } },
          att(0.1),
          { bloc: 'servo_angle', broche: 'D6', angle: { bloc: 'liste_element', liste: 'notes', position: 2 } },
          att(0.1),
          { bloc: 'servo_angle', broche: 'D6', angle: op('×', { bloc: 'liste_taille', liste: 'notes' }, 10) },
          att(0.1),
          { bloc: 'liste_vider', liste: 'notes' },
          { bloc: 'servo_angle', broche: 'D6', angle: op('+', { bloc: 'liste_taille', liste: 'notes' }, { bloc: 'liste_element', liste: 'notes', position: 1 }) },
        ],
      },
    ],
  };
  assert.deepStrictEqual(lancer(p, 1000), ['0 6=45', '100 6=60', '200 6=20', '300 6=0']);
});

test('fonctions : paramètres, valeur renvoyée, appel comme instruction', () => {
  const p = {
    fonctions: [
      { nom: 'clignoter', parametres: ['broche_fois'], corps: [{ bloc: 'repeter_n', fois: v('broche_fois'), corps: [led('D4', 1), att(0.2), led('D4', 0), att(0.2)] }] },
      { nom: 'double', parametres: ['x'], corps: [{ bloc: 'retourner', valeur: op('×', v('x'), 2) }] },
    ],
    fils: [
      {
        quand: 'demarrage',
        corps: [
          { bloc: 'appeler', fonction: 'clignoter', arguments: [2] },
          { bloc: 'servo_angle', broche: 'D6', angle: { bloc: 'appel', fonction: 'double', arguments: [21] } },
        ],
      },
    ],
  };
  assert.deepStrictEqual(lancer(p, 2000), ['0 4=1', '200 4=0', '400 4=1', '600 4=0', '800 6=42']);
});

test('quand le bouton est appuyé : fil démarré sur l’appui, appui ignoré s’il tourne déjà', () => {
  const p = fils(
    { quand: 'demarrage', corps: [led('D2', 1)] },
    { quand: 'appui', broche: 'D8', corps: [led('D3', 1), att(1), led('D3', 0)] },
    { quand: 'relache', broche: 'D8', corps: [led('D2', 0)] },
  );
  const entrees = [
    { t: 100, broche: 8, valeur: 1 },
    { t: 300, broche: 8, valeur: 0 },
    { t: 500, broche: 8, valeur: 1 }, // pendant que le fil « appui » tourne : ignoré
    { t: 600, broche: 8, valeur: 0 },
    { t: 2000, broche: 8, valeur: 1 },
  ];
  assert.deepStrictEqual(lancer(p, 3500, entrees, { composants: [{ type: 'bouton', broche: 'D8' }] }), [
    '0 2=1', '100 3=1', '300 2=0', '1100 3=0', '2000 3=1', '3000 3=0',
  ]);
});

test('les fils tournent ensemble : boucle et fil « quand » en même temps', () => {
  const p = fils(
    { quand: 'boucle', corps: [led('D2', 1), att(0.5), led('D2', 0), att(0.5)] },
    { quand: 'appui', broche: 'D8', corps: [led('D3', 1), att(0.7), led('D3', 0)] },
  );
  assert.deepStrictEqual(lancer(p, 1600, [{ t: 200, broche: 8, valeur: 1 }]), ['0 2=1', '200 3=1', '500 2=0', '900 3=0', '1000 2=1', '1500 2=0']);
});

test('boucle sans attente : la carte ne se bloque pas, les autres fils continuent', () => {
  const p = fils(
    { quand: 'demarrage', corps: [{ bloc: 'tant_que', condition: 1, corps: [{ bloc: 'ajouter_a', variable: 'x', valeur: 1 }] }] },
  );
  const { octets } = compiler(p);
  const r = executer(octets, 50, []);
  assert.strictEqual(r.erreur, null);
  assert.strictEqual(r.fin, 50);
});

test('extension : la commande et ses arguments arrivent au pilote de la carte', () => {
  const p = fils({ quand: 'demarrage', corps: [{ bloc: 'ext', extension: 1, commande: 2, arguments: [100, -100] }] });
  assert.deepStrictEqual(lancer(p, 10), ['0 ext 2 100 -100']);
});

test('programme abîmé : refusé par la carte', () => {
  const { octets } = compiler(fils({ quand: 'demarrage', corps: [led('D2', 1)] }));
  octets[octets.length - 2] ^= 0xff;
  assert.strictEqual(executer(octets, 10, []).erreur, 3);
});
