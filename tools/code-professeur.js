// Règle le code professeur (porte de l'accueil, de l'éditeur, du suivi de classe et du mode enseignant) :
// écrit site/code-professeur.js avec un sel neuf et l'empreinte du code (PBKDF2-SHA-256), jamais le code lui-même.
// Le code est lu sur l'entrée standard (il n'apparaît ni dans la commande ni dans l'historique du terminal).
//
// Usage : npm run code-professeur        (puis taper le code et Entrée)
//         echo "mon code" | npm run code-professeur
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomBytes, webcrypto } = require('node:crypto');
const { empreinteCode } = require('../interface/porte-professeur.js');

const ITERATIONS = 200000;
const FICHIER = join(__dirname, '..', 'site', 'code-professeur.js');

async function regler(code, fichier) {
  if (!String(code).trim()) throw new Error('Code vide : rien n’a été écrit.');
  const sel = randomBytes(16).toString('hex');
  const empreinte = await empreinteCode(code, sel, ITERATIONS, webcrypto.subtle);
  writeFileSync(
    fichier || FICHIER,
    '// Code professeur de Labo Blocs : empreinte seulement (le code n’est écrit nulle part).\n' +
      '// Pour le changer : npm run code-professeur. Supprimer ce fichier enlève la porte.\n' +
      `definirCodeProfesseur(${JSON.stringify({ sel, iterations: ITERATIONS, empreinte }, null, 2)});\n`,
  );
  return { sel, empreinte };
}

if (require.main === module) {
  if (process.stdin.isTTY) process.stdout.write('Code professeur : ');
  let texte = '';
  process.stdin.on('data', (d) => (texte += d));
  process.stdin.on('end', () =>
    regler(texte.split(/\r?\n/)[0])
      .then(() => console.log('Code professeur réglé : site/code-professeur.js (empreinte seulement).'))
      .catch((e) => {
        console.error(e.message);
        process.exit(1);
      }),
  );
}

module.exports = { regler, ITERATIONS };
