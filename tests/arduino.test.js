// Code Arduino du niveau 3 : lignes reliées aux blocs, et le code compile pour la Uno (avr-g++ et le cœur Arduino,
// si ARDUINO_CORE et SERVO sont donnés : voir essais/outils/construire-firmware.js).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { versArduino } = require('../noyau/arduino.js');
const { chargerExercices } = require('../essais/reference/outils.js');

const CORE = process.env.ARDUINO_CORE;
const SERVO = process.env.SERVO;
const compilable = (() => {
  if (!CORE || !SERVO) return false;
  try {
    execFileSync('avr-g++', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

function compile(code) {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'labo-ino-')), 'p.cpp');
  fs.writeFileSync(f, code);
  const inc = [path.join(CORE, 'cores', 'arduino'), path.join(CORE, 'variants', 'standard'), path.join(SERVO, 'src')].flatMap((d) => ['-I', d]);
  execFileSync('avr-g++', ['-fsyntax-only', '-mmcu=atmega328p', '-DF_CPU=16000000L', '-DARDUINO=10819', '-DARDUINO_ARCH_AVR', '-std=gnu++11', '-include', 'Arduino.h', ...inc, f], { stdio: 'pipe' });
}

const nouveau = {
  fils: [
    { quand: 'demarrage', corps: [{ bloc: 'son', id: 's', broche: 'D8', frequence: 440, duree: 0.5 }, { bloc: 'servo_angle', id: 'sv', broche: 'D6', angle: 45 }] },
    { quand: 'boucle', corps: [{ bloc: 'repeter_n', id: 'r', fois: 3, corps: [{ bloc: 'repeter_n', id: 'r2', fois: 2, corps: [{ bloc: 'led_etat', id: 'l', broche: 'D2', etat: 1 }] }] }] },
    { quand: 'appui', broche: 'D7', corps: [{ bloc: 'tant_que', id: 't', condition: { bloc: 'logique', op: 'ou', a: { bloc: 'non', a: { bloc: 'bouton_etat', broche: 'D7' } }, b: { bloc: 'comparaison', op: '≥', a: { bloc: 'variable', variable: 'compteur' }, b: 3 } }, corps: [{ bloc: 'ajouter_a', id: 'aj', variable: 'compteur', valeur: 1 }] }, { bloc: 'affecter', id: 'af', variable: 'dé', valeur: { bloc: 'operation', op: 'mod', a: { bloc: 'hasard', min: 1, max: 6 }, b: 4 } }] },
  ],
};

test('chaque bloc connaît ses lignes', () => {
  const ex = chargerExercices().find((e) => e.id === '5');
  const p = JSON.parse(JSON.stringify(ex.solutionReference));
  p.boucle[0].id = 'si';
  p.boucle[0].alors[0].id = 'allumer';
  const { code, lignes } = versArduino(p);
  const l = code.split('\n');
  assert.match(l[lignes.allumer[0] - 1], /digitalWrite\(9, HIGH\)/);
  assert.match(l[lignes.si[0] - 1], /if \(\(bouton\(3\) == HIGH\)\) \{/);
  assert.match(l[lignes.si[1] - 1], /^\s*\}$/);
  const r = versArduino(nouveau);
  assert.match(r.code.split('\n')[r.lignes.aj[0] - 1], /compteur = compteur \+ 1;/);
});

test('le code des 14 solutions et des blocs nouveaux compile pour la Uno', { skip: compilable ? false : 'avr-g++, ARDUINO_CORE ou SERVO absent' }, () => {
  for (const ex of chargerExercices()) compile(versArduino(ex.solutionReference, { titre: ex.titre }).code);
  compile(versArduino(nouveau).code);
});
