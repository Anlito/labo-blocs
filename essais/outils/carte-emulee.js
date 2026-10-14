// Carte Uno émulée par simavr avec le vrai firmware (essais/vm/carte-emulee.c), compilée à la demande.
// disponible() est faux si gcc ou la bibliothèque simavr manquent : les tests concernés sont alors sautés.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ESSAIS = path.join(__dirname, '..');
const DOSSIER = fs.mkdtempSync(path.join(os.tmpdir(), 'labo-blocs-carte-'));
const EXE = path.join(DOSSIER, 'carte-emulee');
let etat = null;

function disponible() {
  if (etat === null) {
    try {
      execFileSync('gcc', ['-O2', '-o', EXE, path.join(ESSAIS, 'vm', 'carte-emulee.c'), '-lsimavr', '-lelf'], { stdio: 'ignore' });
      etat = true;
    } catch {
      etat = false;
    }
  }
  return etat;
}

// Une carte = un fichier EEPROM qui survit d'une mise sous tension à l'autre.
function creerCarte(carte) {
  const eeprom = path.join(fs.mkdtempSync(path.join(DOSSIER, 'eeprom-')), 'eeprom.bin');
  const firmware = path.join(ESSAIS, 'firmware', `labo_blocs_${carte || 'uno'}.hex`);
  // Une mise sous tension : déroule le script, renvoie les lignes « t quoi … » découpées.
  function allumer(script) {
    const sortie = execFileSync(EXE, [firmware, eeprom], { input: script.join('\n') + '\n' }).toString();
    return sortie
      .trim()
      .split('\n')
      .filter((l) => /^\d+ /.test(l))
      .map((l) => {
        const [t, quoi, ...reste] = l.split(' ');
        return { t: Number(t), quoi, texte: reste.join(' '), broche: Number(reste[0]), valeur: reste[1] };
      });
  }
  return { allumer };
}

// Lignes du script pour envoyer un programme (code octet), comme le fera le navigateur.
function scriptEnvoi(octets) {
  const hex = Buffer.from(octets).toString('hex').toUpperCase();
  const l = ['attendre 50', `envoyer PROG ${octets.length}`, 'attendre 5']; // la carte démarre d'abord
  for (let i = 0; i < hex.length; i += 64) l.push(`envoyer H ${hex.slice(i, i + 64)}`, 'attendre 5');
  l.push('envoyer FIN', 'attendre 10');
  return l;
}

module.exports = { disponible, creerCarte, scriptEnvoi };
