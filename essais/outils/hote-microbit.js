// Lance l'interpréteur micro:bit (essais/microbit/main.py) sur l'ordinateur, avec python3 ou micropython.
// Même entrée et même sortie brute que l'interpréteur C (essais/outils/hote.js).
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOTE = path.join(__dirname, '..', 'microbit', 'hote.py');
const DOSSIER = fs.mkdtempSync(path.join(os.tmpdir(), 'labo-blocs-microbit-'));

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

// Renvoie la sortie brute (lignes « t broche valeur type », « fin t », « erreur … »).
function executerTexte(python, octets, dureeMs, entrees, graine) {
  const fichier = path.join(DOSSIER, 'programme.bin');
  fs.writeFileSync(fichier, octets);
  return execFileSync(python, [HOTE, fichier, String(Math.round(dureeMs)), String(graine || 12345)], { input: texteEntrees(entrees) + '\n' }).toString();
}

module.exports = { present, executerTexte, texteEntrees };
