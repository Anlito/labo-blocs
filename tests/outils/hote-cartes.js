// Lance sur l'ordinateur les interpréteurs des programmes de carte (cartes/) : le C de la Uno et du mBot
// (cartes/hote/hote.c + cartes/arduino/labo_blocs/vm.c, compilé avec gcc) et le MicroPython de la micro:bit
// (cartes/microbit/hote.py, avec python3 ou micropython). Même entrée, même sortie brute.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CARTES = path.join(__dirname, '..', '..', 'cartes');
const DOSSIER = fs.mkdtempSync(path.join(os.tmpdir(), 'labo-blocs-cartes-'));
const EXE = path.join(DOSSIER, 'hote');
let compile = null;

function compilerHote() {
  if (compile === null) {
    try {
      execFileSync('gcc', ['-O2', '-Wall', '-Wextra', '-Werror', '-o', EXE, path.join(CARTES, 'hote', 'hote.c'), path.join(CARTES, 'arduino', 'labo_blocs', 'vm.c'), '-lm'], { stdio: 'pipe' });
      compile = true;
    } catch {
      compile = false;
    }
  }
  return compile;
}

function present(python) {
  try {
    execFileSync(python, ['-c', 'print(1)'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function texteEntrees(entrees) {
  return (entrees || [])
    .slice()
    .sort((a, b) => a.t - b.t || (a.apres ? 1 : 0) - (b.apres ? 1 : 0))
    .map((e) => `${Math.round(e.t)} ${e.broche} ${e.valeur ? 1 : 0} ${e.apres ? 1 : 0}`)
    .join('\n');
}

function ecrire(octets) {
  const fichier = path.join(DOSSIER, 'programme.bin');
  fs.writeFileSync(fichier, Buffer.from(octets));
  return fichier;
}

// Sortie brute : lignes « t broche valeur type », « t ext e c args… », puis « fin t » ou « erreur code t ».
function executerC(octets, dureeMs, entrees, graine) {
  return execFileSync(EXE, [ecrire(octets), String(Math.round(dureeMs)), String(graine || 12345)], { input: texteEntrees(entrees) + '\n' }).toString();
}
function executerPython(python, octets, dureeMs, entrees, graine) {
  return execFileSync(python, [path.join(CARTES, 'microbit', 'hote.py'), ecrire(octets), String(Math.round(dureeMs)), String(graine || 12345)], { input: texteEntrees(entrees) + '\n' }).toString();
}

module.exports = { compilerHote, present, executerC, executerPython, CARTES };
