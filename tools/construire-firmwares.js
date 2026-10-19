// Construit les programmes de la carte Labo Blocs (installés une fois dans chaque carte) :  npm run firmwares
//   Uno et mBot (mCore) : cartes/arduino/labo_blocs (C, avr-gcc ou arduino-cli) → cartes/labo_blocs_uno.hex, _mbot.hex
//   micro:bit V2 : MicroPython officiel 2.1.2 + cartes/microbit/main.py allégé → cartes/labo_blocs_microbit_v2.hex
//   → cartes/firmwares.js : les trois fichiers dans un script (lisible en file://), avec la version de chacun (lue dans
//     le programme construit : « PONG v2 <version> »). Le mBot a sa propre version (afficheur, 0.3).
// Avr : arduino-cli (ARDUINO_CLI ou PATH), sinon avr-gcc avec ARDUINO_CORE (github.com/arduino/ArduinoCore-avr) et
// SERVO (github.com/arduino-libraries/Servo).
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CARTES = path.join(__dirname, '..', 'cartes');
const CROQUIS = path.join(CARTES, 'arduino', 'labo_blocs');

// Version écrite dans un programme construit (Intel HEX ou script) : la réponse « PONG v2 <version> ».
function versionDe(contenu) {
  const octets = [];
  for (const l of String(contenu).split(/\r?\n/)) if (/^:[0-9A-F]{6}00/i.test(l)) for (let i = 9; i < l.length - 2; i += 2) octets.push(parseInt(l.slice(i, i + 2), 16));
  const texte = String.fromCharCode(...octets) + '\n' + contenu;
  const m = /PONG v2 ([0-9.]+) /.exec(texte);
  return m ? m[1] : null;
}

function trouver(c, args) {
  try {
    execFileSync(c, args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function avecArduinoCli(cli, options, sortie) {
  const extra = options.join(' ');
  execFileSync(cli, ['compile', '--fqbn', 'arduino:avr:uno', '--build-property', `compiler.cpp.extra_flags=${extra}`, '--build-property', `compiler.c.extra_flags=${extra}`, '--output-dir', sortie, CROQUIS], { stdio: 'inherit' });
  return { hex: path.join(sortie, 'labo_blocs.ino.hex') };
}

function avecAvrGcc(options, sortie) {
  const core = process.env.ARDUINO_CORE;
  const servo = process.env.SERVO;
  if (!core || !servo) throw new Error('Indiquer ARDUINO_CORE et SERVO (ou installer arduino-cli).');
  const inc = [path.join(core, 'cores', 'arduino'), path.join(core, 'variants', 'standard'), path.join(core, 'libraries', 'EEPROM', 'src'), path.join(servo, 'src'), CROQUIS].flatMap((d) => ['-I', d]);
  const commun = ['-mmcu=atmega328p', '-DF_CPU=16000000L', '-DARDUINO=10819', '-DARDUINO_AVR_UNO', '-DARDUINO_ARCH_AVR', '-Os', '-ffunction-sections', '-fdata-sections', '-w', ...options, ...inc];
  const dossierCore = path.join(core, 'cores', 'arduino');
  const sources = fs.readdirSync(dossierCore).filter((f) => /\.(c|cpp|S)$/.test(f)).map((f) => path.join(dossierCore, f));
  const ino = path.join(sortie, 'labo_blocs.cpp');
  fs.copyFileSync(path.join(CROQUIS, 'labo_blocs.ino'), ino);
  sources.push(path.join(servo, 'src', 'avr', 'Servo.cpp'), path.join(CROQUIS, 'vm.c'), ino);
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

// La mémoire du micro:bit est comptée : sans commentaires, sans lignes vides, un espace par niveau de retrait.
function alleger(source) {
  return (
    source
      .split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('#'))
      .map((l) => {
        const m = /^( *)(.*)$/.exec(l);
        return ' '.repeat(m[1].length / 4) + m[2].replace(/\s+$/, '');
      })
      .join('\n') + '\n'
  );
}

function construireMicrobit() {
  const { MicropythonFsHex, microbitBoardId } = require('@microbit/microbit-fs');
  const source = alleger(fs.readFileSync(path.join(CARTES, 'microbit', 'main.py'), 'utf8'));
  // Un fichier par version : le fichier « universel » est refusé par les puces USB anciennes (jalon 0).
  const microbitFs = new MicropythonFsHex([{ hex: fs.readFileSync(path.join(CARTES, 'microbit', 'micropython', 'micropython-v2.1.2.hex'), 'utf8'), boardId: microbitBoardId.V2 }]);
  microbitFs.write('main.py', source);
  fs.writeFileSync(path.join(CARTES, 'microbit', 'main-allege.py'), source);
  return microbitFs.getIntelHex(microbitBoardId.V2);
}

if (require.main === module) {
  const cli = [process.env.ARDUINO_CLI, 'arduino-cli'].filter(Boolean).find((c) => trouver(c, ['version']));
  const fichiers = {};
  for (const [carte, options] of Object.entries({ uno: [], mbot: ['-DCARTE_MCORE'] })) {
    const sortie = fs.mkdtempSync(path.join(os.tmpdir(), `labo-blocs-fw-${carte}-`));
    const r = cli ? avecArduinoCli(cli, options, sortie) : avecAvrGcc(options, sortie);
    fichiers[carte] = fs.readFileSync(r.hex, 'utf8');
    fs.writeFileSync(path.join(CARTES, `labo_blocs_${carte}.hex`), fichiers[carte]);
    console.log(`${carte} : cartes/labo_blocs_${carte}.hex` + (r.flash ? ` — flash ${r.flash} o / 32256, RAM fixe ${r.ram} o / 2048` : ''));
  }
  fichiers.microbitV2 = construireMicrobit();
  const versions = {};
  for (const [carte, hex] of Object.entries(fichiers)) versions[carte] = carte === 'microbitV2' ? versionDe(fs.readFileSync(path.join(CARTES, 'microbit', 'main.py'), 'utf8')) : versionDe(hex);
  fs.writeFileSync(path.join(CARTES, 'labo_blocs_microbit_v2.hex'), fichiers.microbitV2);
  console.log('micro:bit V2 : cartes/labo_blocs_microbit_v2.hex');
  fs.writeFileSync(
    path.join(CARTES, 'firmwares.js'),
    `// Programmes de la carte Labo Blocs (Intel HEX), construits par « npm run firmwares » : ne pas modifier.\n` +
      `definirFirmwares(${JSON.stringify({ versions, ...fichiers })});\n`,
  );
  console.log(`cartes/firmwares.js (versions ${Object.entries(versions).map(([c, v]) => c + ' ' + v).join(', ')})`);
}

module.exports = { versionDe, alleger };
