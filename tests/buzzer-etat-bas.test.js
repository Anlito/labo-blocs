// Buzzer déclenché à l'état bas (module MH-FMD « 低电平触发 » des kits Simon) : il sonne quand sa broche est à 0 V.
// Réglage du parcours « buzzerEtatBas » → chaque buzzer porte etatBas → broche de type 8 (programme de la carte 0.5),
// « M <broche> B » en direct, et un C++ qui remet la broche à HIGH après chaque note.
const test = require('node:test');
const assert = require('node:assert/strict');
const { preparer } = require('../noyau/parcours.js');
const { compiler } = require('../noyau/code-octet.js');
const { creerDirect } = require('../noyau/direct.js');
const { versArduino } = require('../noyau/arduino.js');
const { PROFILS } = require('../noyau/cartes.js');

const BUZZER = { type: 'buzzer', broche: 'D10' };
const prog = { demarrage: [{ bloc: 'son', broche: 'D10', frequence: 440, duree: 0.3 }, { bloc: 'attendre', duree: 0.5 }], boucle: [] };
const paquet = (reglage) => ({
  format: 'labo-blocs/parcours', version: 1, id: 'essai', titre: 'Essai', versionParcours: '1.0.0', moteurMinimum: '0.5.0',
  ...reglage,
  exercices: [{ id: 'e1', numero: '1', titre: 'Note', consigne: 'Joue une note.', composants: [BUZZER], blocsAutorises: ['son'], scenarios: [], indices: ['', ''] }],
});
// Type de chaque broche dans l'en-tête du code octet (après variables et listes).
function typesBroches(octets) {
  let a = 7;
  a++;
  const nl = octets[a++];
  a += nl;
  const n = octets[a++];
  const types = {};
  for (let i = 0; i < n; i++, a += 2) types[octets[a]] = octets[a + 1];
  return types;
}

test('réglage du parcours : chaque buzzer porte etatBas, sans changer l’empreinte des exercices', () => {
  const sans = preparer(paquet({})).exercices[0];
  const avec = preparer(paquet({ buzzerEtatBas: true })).exercices[0];
  assert.equal(sans.composants[0].etatBas, undefined);
  assert.equal(avec.composants[0].etatBas, true);
  assert.equal(avec.empreinte, sans.empreinte);
});

test('code octet : buzzer normal → type 5, déclenché à l’état bas → type 8', () => {
  assert.equal(typesBroches(compiler(prog, { composants: [BUZZER] }).octets)[10], 5);
  assert.equal(typesBroches(compiler(prog, { composants: [{ ...BUZZER, etatBas: true }] }).octets)[10], 8);
});

test('en direct : la carte est prévenue (« M 10 B ») avant la première note', () => {
  assert.deepEqual(creerDirect(prog, { composants: [BUZZER] }).depart, ['OFF']);
  assert.deepEqual(creerDirect(prog, { composants: [{ ...BUZZER, etatBas: true }] }).depart, ['OFF', 'M 10 B']);
});

test('C++ : la note finie, la broche revient à HIGH ; buzzer normal : tone() comme avant', () => {
  const normal = versArduino(prog, { composants: [BUZZER] }).code;
  assert.match(normal, /tone\(10, 440, \(unsigned long\)\(0\.3 \* 1000\)\);/);
  assert.doesNotMatch(normal, /jouerNote/);
  const bas = versArduino(prog, { composants: [{ ...BUZZER, etatBas: true }] }).code;
  assert.match(bas, /jouerNote\(10, 440, 0\.3\);/);
  assert.match(bas, /digitalWrite\(10, HIGH\); \/\/ buzzer silencieux au repos/);
  assert.match(bas, /noTone\(brocheNote\);\s+digitalWrite\(brocheNote, HIGH\);/);
});

test('programme de la carte de l’Uno : version 0.5 attendue', () => {
  assert.equal(PROFILS.uno.version, '0.5');
});
