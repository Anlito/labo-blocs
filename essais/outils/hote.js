// Lance l'interpréteur C sur l'ordinateur (essais/vm/hote.c), compilé à la demande avec gcc.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const SOURCES = [path.join(RACINE, 'vm', 'hote.c'), path.join(RACINE, 'firmware', 'labo_blocs', 'vm.c')];
const DOSSIER = fs.mkdtempSync(path.join(os.tmpdir(), 'labo-blocs-hote-'));
const EXE = path.join(DOSSIER, 'hote');
let compile = false;

function compilerHote() {
  if (compile) return EXE;
  execFileSync('gcc', ['-O2', '-Wall', '-Wextra', '-Werror', '-o', EXE, ...SOURCES, '-lm']);
  compile = true;
  return EXE;
}

// entrees : [{ t (ms), broche (n°), valeur, apres }] ; renvoie { journal: [{ t, broche, valeur, type }], fin, erreur }
function executer(octets, dureeMs, entrees, graine) {
  const exe = compilerHote();
  const fichier = path.join(DOSSIER, 'programme.bin');
  fs.writeFileSync(fichier, octets);
  const texte = (entrees || [])
    .slice()
    .sort((a, b) => a.t - b.t || (a.apres ? 1 : 0) - (b.apres ? 1 : 0))
    .map((e) => `${Math.round(e.t)} ${e.broche} ${e.valeur ? 1 : 0} ${e.apres ? 1 : 0}`)
    .join('\n');
  const sortie = execFileSync(exe, [fichier, String(Math.round(dureeMs)), String(graine || 12345)], { input: texte + '\n' }).toString();
  const journal = [];
  let fin = null;
  let erreur = null;
  for (const ligne of sortie.trim().split('\n')) {
    const m = ligne.split(' ');
    if (m[0] === 'fin') fin = Number(m[1]);
    else if (m[0] === 'erreur') erreur = Number(m[1]);
    else if (m[1] === 'ext') journal.push({ t: Number(m[0]), type: 'ext', extension: Number(m[2]), commande: Number(m[3]), arguments: m.slice(4).map(Number) });
    else journal.push({ t: Number(m[0]), broche: Number(m[1]), valeur: Number(m[2]), type: m[3], duree: m[4] === undefined ? undefined : Number(m[4]) });
  }
  return { journal, fin, erreur };
}

module.exports = { executer, compilerHote };
