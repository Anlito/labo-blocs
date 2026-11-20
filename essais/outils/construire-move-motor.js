// Fichier d'essai du robot Kitronik MOVE Motor :  node essais/outils/construire-move-motor.js
//   MicroPython officiel V2 2.1.2 + essais/move-motor/essai.py → essais/firmware/essai_move_motor.hex
//   (glisser sur le lecteur MICROBIT de la micro:bit V2 posée sur le robot).
const fs = require('node:fs');
const path = require('node:path');
const { MicropythonFsHex, microbitBoardId } = require('@microbit/microbit-fs');

const ESSAIS = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(ESSAIS, 'move-motor', 'essai.py'), 'utf8');
const microbitFs = new MicropythonFsHex([
  { hex: fs.readFileSync(path.join(ESSAIS, 'microbit', 'micropython', 'micropython-v2.1.2.hex'), 'utf8'), boardId: microbitBoardId.V2 },
]);
microbitFs.write('main.py', source);
const destination = path.join(ESSAIS, 'firmware', 'essai_move_motor.hex');
fs.writeFileSync(destination, microbitFs.getIntelHex(microbitBoardId.V2));
console.log(`MOVE Motor : ${path.relative(process.cwd(), destination)} (main.py : ${source.length} octets)`);
