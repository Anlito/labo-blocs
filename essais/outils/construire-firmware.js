// Compile le firmware de Labo Blocs pour la Uno et pour le mBot (mCore) :  node essais/outils/construire-firmware.js
//   → essais/firmware/labo_blocs_uno.hex, labo_blocs_mcore.hex
//   → essais/page-essai/firmwares.js (les .hex dans un script, pour la page d'essai en file://)
// Avec arduino-cli si on le trouve (variable ARDUINO_CLI ou PATH), sinon avec avr-gcc et une copie du cœur Arduino
// (variables ARDUINO_CORE = dossier de github.com/arduino/ArduinoCore-avr, SERVO = dossier de github.com/arduino-libraries/Servo).
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ESSAIS = path.join(__dirname, '..');
const CROQUIS = path.join(ESSAIS, 'firmware', 'labo_blocs');
const CARTES = { uno: [], mcore: ['-DCARTE_MCORE'] };

function trouver(c, args) {
  try {
    execFileSync(c, args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function avecArduinoCli(cli, carte, options, sortie) {
  execFileSync(cli, ['compile', '--fqbn', 'arduino:avr:uno', '--build-property', `compiler.cpp.extra_flags=${options.join(' ')}`, '--build-property', `compiler.c.extra_flags=${options.join(' ')}`, '--output-dir', sortie, CROQUIS], { stdio: 'inherit' });
  return path.join(sortie, 'labo_blocs.ino.hex');
}

function avecAvrGcc(carte, options, sortie) {
  const core = process.env.ARDUINO_CORE;
  const servo = process.env.SERVO;
  if (!core || !servo) throw new Error('Indiquer ARDUINO_CORE et SERVO (ou installer arduino-cli).');
  const inc = [path.join(core, 'cores', 'arduino'), path.join(core, 'variants', 'standard'), path.join(core, 'libraries', 'EEPROM', 'src'), path.join(servo, 'src'), CROQUIS].flatMap((d) => ['-I', d]);
  const commun = ['-mmcu=atmega328p', '-DF_CPU=16000000L', '-DARDUINO=10819', '-DARDUINO_AVR_UNO', '-DARDUINO_ARCH_AVR', '-Os', '-ffunction-sections', '-fdata-sections', '-w', ...options, ...inc];
  const sources = [];
  const dossierCore = path.join(core, 'cores', 'arduino');
  for (const f of fs.readdirSync(dossierCore)) if (/\.(c|cpp|S)$/.test(f)) sources.push(path.join(dossierCore, f));
  sources.push(path.join(servo, 'src', 'avr', 'Servo.cpp'), path.join(CROQUIS, 'vm.c'));
  const ino = path.join(sortie, 'labo_blocs.cpp');
  fs.copyFileSync(path.join(CROQUIS, 'labo_blocs.ino'), ino);
  sources.push(ino);
  const objets = sources.map((s, i) => {
    const o = path.join(sortie, `${i}-${path.basename(s)}.o`);
    const cpp = /\.cpp$/.test(s);
    const lang = cpp ? ['-std=gnu++11', '-fno-exceptions', '-fno-threadsafe-statics', '-fpermissive'] : /\.S$/.test(s) ? ['-x', 'assembler-with-cpp'] : ['-std=gnu11'];
    execFileSync(cpp ? 'avr-g++' : 'avr-gcc', [...commun, ...lang, '-c', s, '-o', o]);
    return o;
  });
  const elf = path.join(sortie, 'labo_blocs.elf');
  execFileSync('avr-gcc', ['-mmcu=atmega328p', '-Os', '-Wl,--gc-sections', '-o', elf, ...objets, '-lm']);
  const hex = path.join(sortie, 'labo_blocs.hex');
  execFileSync('avr-objcopy', ['-O', 'ihex', '-R', '.eeprom', elf, hex]);
  const taille = execFileSync('avr-size', ['-A', elf]).toString();
  const octets = (nom) => Number((new RegExp(`^${nom}\\s+(\\d+)`, 'm').exec(taille) || [0, 0])[1]);
  return { hex, elf, flash: octets('\\.text') + octets('\\.data'), ram: octets('\\.data') + octets('\\.bss') };
}

const cli = [process.env.ARDUINO_CLI, 'arduino-cli'].filter(Boolean).find((c) => trouver(c, ['version']));
const resultats = {};
for (const [carte, options] of Object.entries(CARTES)) {
  const sortie = fs.mkdtempSync(path.join(os.tmpdir(), `labo-blocs-fw-${carte}-`));
  const r = cli ? { hex: avecArduinoCli(cli, carte, options, sortie) } : avecAvrGcc(carte, options, sortie);
  const destination = path.join(ESSAIS, 'firmware', `labo_blocs_${carte}.hex`);
  fs.copyFileSync(r.hex, destination);
  resultats[carte] = fs.readFileSync(destination, 'utf8');
  console.log(`${carte} : ${path.relative(process.cwd(), destination)}` + (r.flash ? ` — flash ${r.flash} o / 32256, RAM statique ${r.ram} o / 2048` : ''));
}
const page = path.join(ESSAIS, 'page-essai');
fs.mkdirSync(page, { recursive: true });
const fichier = path.join(page, 'firmwares.js');
if (fs.existsSync(fichier)) {
  // Garder le micro:bit (construire-microbit.js).
  const t = fs.readFileSync(fichier, 'utf8');
  const avant = JSON.parse(t.slice(t.indexOf('definirFirmwares(') + 17, t.lastIndexOf(')')));
  for (const k of ['microbitV1', 'microbitV2']) if (avant[k]) resultats[k] = avant[k];
}
fs.writeFileSync(fichier, '// Firmwares de Labo Blocs (Intel HEX), générés par essais/outils/construire-firmware.js et construire-microbit.js : ne pas modifier.\ndefinirFirmwares(' + JSON.stringify(resultats, null, 1) + ');\n');
