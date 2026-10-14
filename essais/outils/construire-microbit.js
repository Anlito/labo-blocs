// Fichiers à copier sur le micro:bit :  node essais/outils/construire-microbit.js
//   MicroPython officiel (V1 1.1.1, V2 2.1.2, ceux de l'éditeur Python du micro:bit) + essais/microbit/main.py allégé
//   → essais/firmware/labo_blocs_microbit_v1.hex et _v2.hex (glisser sur le lecteur MICROBIT)
//   Un fichier par version : le fichier « universel » V1 + V2 est refusé par les V1 dont la puce USB (DAPLink) est
//   ancienne (FAIL.TXT « The hex file cannot be decoded », essai du 14/10/2026).
//   → essais/page-essai/firmwares.js (ajouté aux firmwares Uno et mCore)
const fs = require('node:fs');
const path = require('node:path');
const { MicropythonFsHex, microbitBoardId } = require('@microbit/microbit-fs');

const ESSAIS = path.join(__dirname, '..');
const MP = path.join(ESSAIS, 'microbit', 'micropython');

// La V1 a très peu de mémoire : sans commentaires, sans lignes vides, un espace par niveau de retrait.
function alleger(source) {
  return source
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const m = /^( *)(.*)$/.exec(l);
      return ' '.repeat(m[1].length / 4) + m[2].replace(/\s+$/, '');
    })
    .join('\n') + '\n';
}

const source = alleger(fs.readFileSync(path.join(ESSAIS, 'microbit', 'main.py'), 'utf8'));
const microbitFs = new MicropythonFsHex([
  { hex: fs.readFileSync(path.join(MP, 'micropython-v1.1.1.hex'), 'utf8'), boardId: microbitBoardId.V1 },
  { hex: fs.readFileSync(path.join(MP, 'micropython-v2.1.2.hex'), 'utf8'), boardId: microbitBoardId.V2 },
]);
microbitFs.write('main.py', source);
const hexV1 = microbitFs.getIntelHex(microbitBoardId.V1);
const hexV2 = microbitFs.getIntelHex(microbitBoardId.V2);
const destination = path.join(ESSAIS, 'firmware', 'labo_blocs_microbit_v1.hex');
fs.writeFileSync(destination, hexV1);
fs.writeFileSync(path.join(ESSAIS, 'firmware', 'labo_blocs_microbit_v2.hex'), hexV2);
const ancien = path.join(ESSAIS, 'firmware', 'labo_blocs_microbit.hex');
if (fs.existsSync(ancien)) fs.unlinkSync(ancien);
fs.writeFileSync(path.join(ESSAIS, 'microbit', 'main-allege.py'), source); // pour les tests et pour voir ce qui part dans la carte
console.log(`micro:bit : ${path.relative(process.cwd(), destination)} et _v2.hex — main.py allégé : ${source.length} octets (source : ${fs.statSync(path.join(ESSAIS, 'microbit', 'main.py')).size})`);

// Ajout dans firmwares.js de la page d'essai, à côté de la Uno et du mCore.
const fichier = path.join(ESSAIS, 'page-essai', 'firmwares.js');
let existants = {};
if (fs.existsSync(fichier)) {
  const t = fs.readFileSync(fichier, 'utf8');
  existants = JSON.parse(t.slice(t.indexOf('definirFirmwares(') + 17, t.lastIndexOf(')')));
}
delete existants.microbit;
existants.microbitV1 = hexV1;
existants.microbitV2 = hexV2;
fs.writeFileSync(fichier, '// Firmwares de Labo Blocs (Intel HEX), générés par essais/outils/construire-firmware.js et construire-microbit.js : ne pas modifier.\ndefinirFirmwares(' + JSON.stringify(existants, null, 1) + ');\n');
